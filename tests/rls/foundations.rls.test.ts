/**
 * Phase 0 RLS harness — foundational access-control assertions.
 *
 * Signs in as two real users (A and B) with separate supabase-js sessions and
 * asserts what each can and cannot read/write. Later phases add their own
 * *.rls.test.ts files next to this one using the same helpers.
 *
 * Requires a running local stack: `supabase start` (or CI equivalent).
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let userA: TestUser;
let userB: TestUser;

beforeAll(async () => {
  admin = createAdminClient();
  userA = await createTestUser(admin, "a");
  userB = await createTestUser(admin, "b");
});

afterAll(async () => {
  await deleteTestUser(admin, userA);
  await deleteTestUser(admin, userB);
});

describe("profiles", () => {
  test("user A can read their own profile", async () => {
    const { data, error } = await userA.client
      .from("profiles")
      .select("id, username, full_name")
      .eq("id", userA.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userA.id);
  });

  test("full profile rows are private to self + companions (Phase 1)", async () => {
    const { data } = await userB.client
      .from("profiles")
      .select("id, username")
      .eq("id", userA.id);

    expect(data).toEqual([]);
  });

  test("strangers see only the minimal public card via public_profiles", async () => {
    const { data, error } = await userB.client
      .from("public_profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", userA.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(userA.id);
  });

  test("user B cannot update A's profile", async () => {
    const { data } = await userB.client
      .from("profiles")
      .update({ full_name: "Hacked By B" })
      .eq("id", userA.id)
      .select();

    // RLS filters the row out of the UPDATE, so zero rows are affected.
    expect(data).toEqual([]);

    const { data: fresh } = await userA.client
      .from("profiles")
      .select("full_name")
      .eq("id", userA.id)
      .single();
    expect(fresh?.full_name).not.toBe("Hacked By B");
  });
});

describe("bookmarks (private per-user data)", () => {
  let postId: string;

  beforeAll(async () => {
    const { data: post, error } = await userA.client
      .from("posts")
      .insert({ author_id: userA.id, content: "RLS harness fixture post" })
      .select("id")
      .single();
    if (error || !post) throw new Error(`Fixture post failed: ${error?.message}`);
    postId = post.id;

    const { error: bookmarkError } = await userA.client
      .from("bookmarks")
      .insert({ user_id: userA.id, post_id: postId });
    if (bookmarkError) throw new Error(`Fixture bookmark failed: ${bookmarkError.message}`);
  });

  afterAll(async () => {
    // Deleting the post cascades to the bookmark.
    await admin.from("posts").delete().eq("id", postId);
  });

  test("user A can read their own bookmark", async () => {
    const { data, error } = await userA.client
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userA.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0].post_id).toBe(postId);
  });

  test("user B cannot read A's bookmarks", async () => {
    const { data, error } = await userB.client
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userA.id);

    // RLS hides the rows entirely rather than erroring.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("user B cannot insert a bookmark owned by A", async () => {
    const { error } = await userB.client
      .from("bookmarks")
      .insert({ user_id: userA.id, post_id: postId });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501"); // insufficient_privilege (RLS violation)
  });

  test("user B cannot delete A's bookmark", async () => {
    const { data } = await userB.client
      .from("bookmarks")
      .delete()
      .eq("user_id", userA.id)
      .eq("post_id", postId)
      .select();

    expect(data).toEqual([]);

    const { data: stillThere } = await userA.client
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", userA.id);
    expect(stillThere).toHaveLength(1);
  });
});
