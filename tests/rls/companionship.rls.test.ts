/**
 * Phase 1 RLS — companions-only privacy model.
 *
 * Acceptance criteria (from the Phase 1 spec), each asserted below:
 *  1. B (stranger) queries A's companions-visibility post by id -> 0 rows
 *  2. After A accepts B's request, B sees A's companions post
 *  3. A blocks B -> B sees none of A's posts and cannot send A a request
 *  4. B cannot insert a post with author_id = A
 *  5. B (requester) cannot flip a companionship's status — only the addressee can
 *  6. Direct REST calls with the anon key reproduce all of the above
 *
 * State flows through this file in order (Jest runs tests sequentially with
 * maxWorkers: 1): stranger checks -> request/accept -> block -> teardown.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  getTestEnv,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let userA: TestUser; // post author
let userB: TestUser; // stranger -> companion -> blocked
let userC: TestUser; // halaqa member; declined-request cases
let userD: TestUser; // permanent stranger (halaqa non-member)

let companionsPostId: string;
let publicPostId: string;
let privatePostId: string;

/** Raw PostgREST call — criterion 6: bypassing supabase-js changes nothing. */
async function restFetch(
  user: TestUser,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: unknown }> {
  const { url, anonKey } = getTestEnv();
  const { data } = await user.client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("test user has no session token");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  admin = createAdminClient();
  [userA, userB, userC, userD] = await Promise.all([
    createTestUser(admin, "a"),
    createTestUser(admin, "b"),
    createTestUser(admin, "c"),
    createTestUser(admin, "d"),
  ]);

  const insert = async (visibility: string) => {
    const { data, error } = await userA.client
      .from("posts")
      .insert({ author_id: userA.id, content: `${visibility} fixture`, visibility })
      .select("id")
      .single();
    if (error || !data) throw new Error(`fixture post (${visibility}): ${error?.message}`);
    return data.id;
  };
  companionsPostId = await insert("companions");
  publicPostId = await insert("public");
  privatePostId = await insert("private");
});

afterAll(async () => {
  await admin.from("posts").delete().eq("author_id", userA.id);
  await Promise.all([userA, userB, userC, userD].map((u) => deleteTestUser(admin, u)));
});

describe("1. stranger visibility", () => {
  test("B cannot read A's companions post by id", async () => {
    const { data, error } = await userB.client
      .from("posts")
      .select("id")
      .eq("id", companionsPostId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("B cannot read A's companions post via raw REST either", async () => {
    const { status, body } = await restFetch(userB, `posts?id=eq.${companionsPostId}`);
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  test("B can read A's public post", async () => {
    const { data } = await userB.client.from("posts").select("id").eq("id", publicPostId);
    expect(data).toHaveLength(1);
  });

  test("B cannot read A's private post; A can", async () => {
    const { data: forB } = await userB.client
      .from("posts")
      .select("id")
      .eq("id", privatePostId);
    expect(forB).toEqual([]);

    const { data: forA } = await userA.client
      .from("posts")
      .select("id")
      .eq("id", privatePostId);
    expect(forA).toHaveLength(1);
  });

  test("B cannot read A's full profile row, but sees the public card", async () => {
    const { data: fullRow } = await userB.client
      .from("profiles")
      .select("id")
      .eq("id", userA.id);
    expect(fullRow).toEqual([]);

    const { data: card, error } = await userB.client
      .from("public_profiles")
      .select("id, username, display_name")
      .eq("id", userA.id)
      .single();
    expect(error).toBeNull();
    expect(card?.id).toBe(userA.id);
  });
});

describe("2. companionship request/accept lifecycle", () => {
  let requestId: string;

  test("B sends A a companionship request", async () => {
    const { data, error } = await userB.client
      .from("companionships")
      .insert({ requester_id: userB.id, addressee_id: userA.id })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    requestId = data!.id;
  });

  test("criterion 5: B (requester) cannot accept their own request", async () => {
    const { data } = await userB.client
      .from("companionships")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .select();
    expect(data).toEqual([]); // RLS: only the addressee's UPDATE matches the row

    const { data: fresh } = await userB.client
      .from("companionships")
      .select("status")
      .eq("id", requestId)
      .single();
    expect(fresh?.status).toBe("pending");
  });

  test("A (addressee) accepts; responded_at is set by the trigger", async () => {
    const { data, error } = await userA.client
      .from("companionships")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .select("status, responded_at")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("accepted");
    expect(data?.responded_at).not.toBeNull();
  });

  test("criterion 2: B now sees A's companions post (supabase-js and raw REST)", async () => {
    const { data } = await userB.client
      .from("posts")
      .select("id")
      .eq("id", companionsPostId);
    expect(data).toHaveLength(1);

    const { status, body } = await restFetch(userB, `posts?id=eq.${companionsPostId}`);
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
  });

  test("as a companion, B can read A's full profile row", async () => {
    const { data, error } = await userB.client
      .from("profiles")
      .select("id, full_name")
      .eq("id", userA.id)
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(userA.id);
  });
});

describe("3. blocks", () => {
  beforeAll(async () => {
    const { error } = await userA.client
      .from("blocks")
      .insert({ blocker_id: userA.id, blocked_id: userB.id });
    if (error) throw new Error(`block fixture: ${error.message}`);
  });

  test("blocked B sees none of A's posts — not even public ones", async () => {
    const { data: companions } = await userB.client
      .from("posts")
      .select("id")
      .eq("id", companionsPostId);
    expect(companions).toEqual([]);

    const { data: pub } = await userB.client
      .from("posts")
      .select("id")
      .eq("id", publicPostId);
    expect(pub).toEqual([]);
  });

  test("B cannot send A a new request while blocked", async () => {
    // Clear the old (accepted) companionship first so the unique constraint
    // isn't what stops the insert.
    await userA.client
      .from("companionships")
      .delete()
      .or(`requester_id.eq.${userB.id},addressee_id.eq.${userB.id}`);

    const { error } = await userB.client
      .from("companionships")
      .insert({ requester_id: userB.id, addressee_id: userA.id });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  test("B cannot see who blocked them", async () => {
    const { data } = await userB.client
      .from("blocks")
      .select("blocker_id")
      .eq("blocked_id", userB.id);
    expect(data).toEqual([]);
  });
});

describe("4. author forgery", () => {
  test("B cannot insert a post with author_id = A", async () => {
    const { error } = await userB.client
      .from("posts")
      .insert({ author_id: userA.id, content: "forged post" });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  test("raw REST forgery is rejected the same way", async () => {
    const { status, body } = await restFetch(userB, "posts", {
      method: "POST",
      body: JSON.stringify({ author_id: userA.id, content: "forged via REST" }),
    });
    expect(status).toBe(403);
    expect((body as { code?: string })?.code).toBe("42501");
  });
});

describe("5. companionship state machine (trigger)", () => {
  test("a request cannot be created pre-accepted", async () => {
    const { error } = await userC.client
      .from("companionships")
      .insert({ requester_id: userC.id, addressee_id: userA.id, status: "accepted" });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/must start as pending/);
  });

  test("declined is terminal: addressee cannot later flip it to accepted", async () => {
    const { data: req, error: reqError } = await userC.client
      .from("companionships")
      .insert({ requester_id: userC.id, addressee_id: userA.id })
      .select("id")
      .single();
    expect(reqError).toBeNull();

    const { error: declineError } = await userA.client
      .from("companionships")
      .update({ status: "declined" })
      .eq("id", req!.id);
    expect(declineError).toBeNull();

    const { error } = await userA.client
      .from("companionships")
      .update({ status: "accepted" })
      .eq("id", req!.id);
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/invalid companionship transition/);
  });
});

describe("6. halaqa visibility", () => {
  let halaqaId: string;
  let halaqaPostId: string;

  beforeAll(async () => {
    const { data: halaqa, error } = await admin
      .from("halaqas")
      .insert({
        name: "RLS test halaqa",
        description: "Fixture halaqa for the Phase 1 RLS visibility tests.",
        category: "test",
        created_by: userA.id,
      })
      .select("id")
      .single();
    if (error || !halaqa) throw new Error(`halaqa fixture: ${error?.message}`);
    halaqaId = halaqa.id;

    // The creator (A) is auto-added as a member by a trigger; add C only.
    const { error: memberError } = await admin
      .from("halaqa_members")
      .insert([{ halaqa_id: halaqaId, user_id: userC.id }]);
    if (memberError) throw new Error(`membership fixture: ${memberError.message}`);

    const { data: post, error: postError } = await userA.client
      .from("posts")
      .insert({
        author_id: userA.id,
        content: "halaqa fixture",
        visibility: "halaqa",
        halaqa_id: halaqaId,
      })
      .select("id")
      .single();
    if (postError || !post) throw new Error(`halaqa post fixture: ${postError?.message}`);
    halaqaPostId = post.id;
  });

  afterAll(async () => {
    await admin.from("halaqas").delete().eq("id", halaqaId);
  });

  test("halaqa member C sees the halaqa post", async () => {
    const { data } = await userC.client.from("posts").select("id").eq("id", halaqaPostId);
    expect(data).toHaveLength(1);
  });

  test("non-member D does not", async () => {
    const { data } = await userD.client.from("posts").select("id").eq("id", halaqaPostId);
    expect(data).toEqual([]);
  });
});

describe("7. soft delete", () => {
  test("a soft-deleted post disappears for others; the author keeps it (undelete)", async () => {
    const { error } = await userA.client
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", publicPostId);
    expect(error).toBeNull();

    const { data } = await userD.client.from("posts").select("id").eq("id", publicPostId);
    expect(data).toEqual([]);

    const { data: own } = await userA.client
      .from("posts")
      .select("id")
      .eq("id", publicPostId);
    expect(own).toHaveLength(1);
  });

  test("hard deletes are not allowed, even for the author", async () => {
    const { data } = await userA.client
      .from("posts")
      .delete()
      .eq("id", companionsPostId)
      .select();
    expect(data).toEqual([]); // no DELETE policy -> zero rows affected

    const { data: still } = await userA.client
      .from("posts")
      .select("id")
      .eq("id", companionsPostId);
    expect(still).toHaveLength(1);
  });
});
