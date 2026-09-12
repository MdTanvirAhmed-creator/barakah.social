/**
 * RLS — what "public" means on the minbar (migration 29).
 *
 * The decision: public means everyone signed in to Barakah, NOT the open
 * internet. Before this migration the read policy allowed visibility='public'
 * with no session at all, and the policy is granted to the anonymous role, so
 * a logged-out stranger and any search-engine crawler could have read a public
 * post. No post had ever been public, so nothing leaked — but the door was
 * open before anyone could walk through it.
 *
 *  - a signed-in stranger (no companionship) CAN read a public post
 *  - an anonymous reader CANNOT, and cannot list posts at all
 *  - companions-only posts stay invisible to signed-in strangers
 *  - a blocked user still cannot see the blocker's public posts
 *  - visibility may be NARROWED after the fact, but not WIDENED once the post
 *    carries replies written under the narrower expectation
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  getTestEnv,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let anon: SupabaseClient;
let author: TestUser;
let stranger: TestUser;
let blocked: TestUser;
let publicPost: string;
let companionsPost: string;

beforeAll(async () => {
  admin = createAdminClient();
  const { url, anonKey } = getTestEnv();
  // A client with no session at all — what a logged-out visitor or a crawler
  // would be.
  anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  [author, stranger, blocked] = await Promise.all([
    createTestUser(admin, "mbauthor"),
    createTestUser(admin, "mbstranger"),
    createTestUser(admin, "mbblocked"),
  ]);

  const { data: posts, error } = await admin
    .from("posts")
    .insert([
      { author_id: author.id, content: "On the minbar, for everyone.", visibility: "public" },
      { author_id: author.id, content: "Only for those close to me.", visibility: "companions" },
    ])
    .select("id, visibility");
  if (error) throw new Error(`seed posts: ${error.message}`);
  publicPost = posts!.find((p) => p.visibility === "public")!.id;
  companionsPost = posts!.find((p) => p.visibility === "companions")!.id;

  // The author blocks someone. A block should hold even on public posts.
  const { error: blockError } = await admin
    .from("blocks")
    .insert({ blocker_id: author.id, blocked_id: blocked.id });
  if (blockError) throw new Error(`seed block: ${blockError.message}`);
});

afterAll(async () => {
  await admin.from("posts").delete().in("id", [publicPost, companionsPost]);
  await Promise.all([
    deleteTestUser(admin, author),
    deleteTestUser(admin, stranger),
    deleteTestUser(admin, blocked),
  ]);
});

describe("public posts are for the signed-in community", () => {
  test("a signed-in stranger can read a public post", async () => {
    const { data } = await stranger.client.from("posts").select("id").eq("id", publicPost);
    expect(data?.map((p) => p.id)).toEqual([publicPost]);
  });

  test("an anonymous reader cannot read a public post", async () => {
    const { data } = await anon.from("posts").select("id").eq("id", publicPost);
    expect(data ?? []).toEqual([]);
  });

  test("an anonymous reader cannot list any posts at all", async () => {
    const { data } = await anon.from("posts").select("id");
    expect(data ?? []).toEqual([]);
  });

  test("companions-only posts stay hidden from signed-in strangers", async () => {
    const { data } = await stranger.client.from("posts").select("id").eq("id", companionsPost);
    expect(data ?? []).toEqual([]);
  });

  test("a blocked user cannot see the blocker's public post", async () => {
    const { data } = await blocked.client.from("posts").select("id").eq("id", publicPost);
    expect(data ?? []).toEqual([]);
  });
});

describe("changing a post's visibility after the fact", () => {
  let narrowing: string;
  let widening: string;

  beforeAll(async () => {
    const { data } = await admin
      .from("posts")
      .insert([
        { author_id: author.id, content: "Will be narrowed.", visibility: "public" },
        { author_id: author.id, content: "Will try to widen.", visibility: "companions" },
      ])
      .select("id, content");
    narrowing = data!.find((p) => p.content === "Will be narrowed.")!.id;
    widening = data!.find((p) => p.content === "Will try to widen.")!.id;
  });

  afterAll(async () => {
    await admin.from("posts").delete().in("id", [narrowing, widening]);
  });

  test("the author may narrow public down to companions", async () => {
    const { error } = await author.client
      .from("posts")
      .update({ visibility: "companions" })
      .eq("id", narrowing);
    expect(error).toBeNull();
    const { data } = await admin.from("posts").select("visibility").eq("id", narrowing).single();
    expect(data?.visibility).toBe("companions");
  });

  test("the author may widen a post that has no replies yet", async () => {
    const { error } = await author.client
      .from("posts")
      .update({ visibility: "public" })
      .eq("id", widening);
    expect(error).toBeNull();
    // Put it back for the next test.
    await admin.from("posts").update({ visibility: "companions" }).eq("id", widening);
  });

  test("widening is refused once the post carries replies", async () => {
    // A reply written while only companions could read it.
    const { error: commentError } = await admin
      .from("comments")
      .insert({ post_id: widening, author_id: author.id, content: "Said in confidence." });
    expect(commentError).toBeNull();

    const { error } = await author.client
      .from("posts")
      .update({ visibility: "public" })
      .eq("id", widening);
    expect(error).not.toBeNull();

    const { data } = await admin.from("posts").select("visibility").eq("id", widening).single();
    expect(data?.visibility).toBe("companions");
  });
});
