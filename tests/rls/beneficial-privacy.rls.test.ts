/**
 * RLS — beneficial marks are PRIVATE TO THE AUTHOR (migration 20).
 *
 *  - the author of a post sees every beneficial mark on it (their true tally)
 *  - a marker sees only their own mark, never anyone else's
 *  - a third party (companion of neither) sees nothing
 *  - the per-post denormalised counter column is gone
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let author: TestUser;
let markerA: TestUser;
let markerB: TestUser;
let postId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [author, markerA, markerB] = await Promise.all([
    createTestUser(admin, "author"),
    createTestUser(admin, "marka"),
    createTestUser(admin, "markb"),
  ]);

  // A public post so any signed-in user may read the post itself and mark it.
  const { data: post, error } = await admin
    .from("posts")
    .insert({
      author_id: author.id,
      content: "A beneficial reminder.",
      visibility: "public",
    })
    .select("id")
    .single();
  if (error || !post) throw new Error(`post fixture: ${error?.message}`);
  postId = post.id;

  // Both markers mark the post beneficial.
  for (const m of [markerA, markerB]) {
    const { error: mErr } = await m.client
      .from("beneficial_marks")
      .insert({ user_id: m.id, post_id: postId });
    if (mErr) throw new Error(`mark fixture (${m.email}): ${mErr.message}`);
  }
});

afterAll(async () => {
  await admin.from("posts").delete().eq("author_id", author.id);
  await Promise.all(
    [author, markerA, markerB].map((u) => deleteTestUser(admin, u))
  );
});

test("the author sees every mark on their post (the true tally)", async () => {
  const { data } = await author.client
    .from("beneficial_marks")
    .select("user_id")
    .eq("post_id", postId);
  expect(data).toHaveLength(2);
});

test("a marker sees only their own mark, not the other marker's", async () => {
  const { data } = await markerA.client
    .from("beneficial_marks")
    .select("user_id")
    .eq("post_id", postId);
  expect(data).toEqual([{ user_id: markerA.id }]);
});

test("a bystander who did not mark sees no marks", async () => {
  const bystander = await createTestUser(admin, "bystnd");
  try {
    const { data } = await bystander.client
      .from("beneficial_marks")
      .select("user_id")
      .eq("post_id", postId);
    expect(data).toEqual([]);
  } finally {
    await deleteTestUser(admin, bystander);
  }
});

test("the denormalised per-post beneficial_count column is gone", async () => {
  const { error } = await author.client
    .from("posts")
    .select("beneficial_count")
    .eq("id", postId);
  // Selecting a dropped column is a schema error, not an empty result.
  expect(error).not.toBeNull();
});
