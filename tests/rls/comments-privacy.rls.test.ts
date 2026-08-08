/**
 * RLS — comments follow the post's visibility (migration 22).
 *
 * Before this migration the comments SELECT policy was `is_deleted = false`:
 * every comment on every companions-only post was readable by anyone signed
 * in, and anyone could comment on a post they could not see.
 *
 *  - a companion of the author reads comments on a companions-only post
 *  - a stranger reads nothing
 *  - a stranger cannot comment on a post they cannot see
 *  - a companion can comment
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
let companion: TestUser;
let stranger: TestUser;
let postId: string;
let commentId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [author, companion, stranger] = await Promise.all([
    createTestUser(admin, "cauth"),
    createTestUser(admin, "ccomp"),
    createTestUser(admin, "cstrg"),
  ]);

  // companion -> author, accepted by author.
  const { error: reqErr } = await companion.client
    .from("companionships")
    .insert({ requester_id: companion.id, addressee_id: author.id, status: "pending" });
  if (reqErr) throw new Error(`request fixture: ${reqErr.message}`);
  const { error: accErr } = await author.client
    .from("companionships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("requester_id", companion.id)
    .eq("addressee_id", author.id);
  if (accErr) throw new Error(`accept fixture: ${accErr.message}`);

  const { data: post, error: postErr } = await author.client
    .from("posts")
    .insert({
      author_id: author.id,
      content: "For my companions only.",
      visibility: "companions",
    })
    .select("id")
    .single();
  if (postErr || !post) throw new Error(`post fixture: ${postErr?.message}`);
  postId = post.id;

  const { data: comment, error: cErr } = await author.client
    .from("comments")
    .insert({ post_id: postId, author_id: author.id, content: "A note under my post." })
    .select("id")
    .single();
  if (cErr || !comment) throw new Error(`comment fixture: ${cErr?.message}`);
  commentId = comment.id;
});

afterAll(async () => {
  await admin.from("posts").delete().eq("author_id", author.id);
  await admin.from("companionships").delete().eq("requester_id", companion.id);
  await Promise.all(
    [author, companion, stranger].map((u) => deleteTestUser(admin, u))
  );
});

test("a companion reads comments on a companions-only post", async () => {
  const { data } = await companion.client
    .from("comments")
    .select("id")
    .eq("post_id", postId);
  expect(data?.map((c) => c.id)).toContain(commentId);
});

test("a stranger reads no comments on a companions-only post", async () => {
  const { data } = await stranger.client
    .from("comments")
    .select("id")
    .eq("post_id", postId);
  expect(data).toEqual([]);
});

test("a stranger cannot comment on a post they cannot see", async () => {
  const { error } = await stranger.client.from("comments").insert({
    post_id: postId,
    author_id: stranger.id,
    content: "should never land",
  });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("a companion can comment on the post", async () => {
  const { error } = await companion.client.from("comments").insert({
    post_id: postId,
    author_id: companion.id,
    content: "BarakAllahu feek for sharing.",
  });
  expect(error).toBeNull();
});
