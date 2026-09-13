/**
 * RLS — moderators can act, within limits (migration 34).
 *
 * Until now moderation was advisory. A moderator could read a reported post
 * and write a resolution note, but the only UPDATE policy on posts was
 * "author_id = auth.uid()", so the post stayed up. Resolving a report changed
 * the report row and nothing else.
 *
 * The rules being asserted here:
 *  - a moderator may hide a post that every member can already see
 *  - hiding is recorded: who, when, and why
 *  - a moderator may NOT hide a companions-only post, because they cannot see
 *    it in the first place — the proactive queue extends no new sight
 *  - a moderator may not edit the words themselves, only hide them
 *  - an ordinary member can hide nothing
 *  - an admin can reverse a hiding; a moderator cannot reverse their own,
 *    which is what keeps the power reviewable rather than private
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let owner: TestUser;      // admin
let mod: TestUser;        // moderator
let author: TestUser;     // writes the posts
let member: TestUser;     // ordinary member
let publicPost: string;
let privatePost: string;

beforeAll(async () => {
  admin = createAdminClient();
  [owner, mod, author, member] = await Promise.all([
    createTestUser(admin, "maowner"),
    createTestUser(admin, "mamod"),
    createTestUser(admin, "maauthor"),
    createTestUser(admin, "mamember"),
  ]);
  await admin.from("user_roles").insert([
    { user_id: owner.id, role: "admin" },
    { user_id: mod.id, role: "moderator" },
  ]);

  const { data: posts } = await admin
    .from("posts")
    .insert([
      { author_id: author.id, content: "Said to everyone.", visibility: "public" },
      { author_id: author.id, content: "Said to companions.", visibility: "companions" },
    ])
    .select("id, visibility");
  publicPost = posts!.find((p) => p.visibility === "public")!.id;
  privatePost = posts!.find((p) => p.visibility === "companions")!.id;
});

afterAll(async () => {
  await admin.from("posts").delete().in("id", [publicPost, privatePost]);
  await admin.from("user_roles").delete().in("user_id", [owner.id, mod.id]);
  await Promise.all([
    deleteTestUser(admin, owner),
    deleteTestUser(admin, mod),
    deleteTestUser(admin, author),
    deleteTestUser(admin, member),
  ]);
});

describe("hiding a post", () => {
  test("an ordinary member cannot hide someone else's post", async () => {
    // No policy matches, so the update simply affects no rows rather than
    // raising — which is why the assertion is about the post's state, not
    // about an error. What matters is that the words are still standing.
    await member.client
      .from("posts")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: "I dislike it" })
      .eq("id", publicPost);

    const { data } = await admin.from("posts").select("hidden_at").eq("id", publicPost).single();
    expect(data?.hidden_at).toBeNull();

    // And it is still readable by everyone.
    const { data: seen } = await member.client.from("posts").select("id").eq("id", publicPost);
    expect(seen?.length).toBe(1);
  });

  test("a moderator can hide a post every member can already see", async () => {
    const { error } = await mod.client
      .from("posts")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: "Breaches the Mithaq" })
      .eq("id", publicPost);
    expect(error).toBeNull();
  });

  test("the hiding records who did it and why", async () => {
    const { data } = await admin
      .from("posts")
      .select("hidden_at, hidden_by, hidden_reason")
      .eq("id", publicPost)
      .single();
    expect(data?.hidden_by).toBe(mod.id);
    expect(data?.hidden_at).not.toBeNull();
    expect(data?.hidden_reason).toBe("Breaches the Mithaq");
  });

  test("a hidden post disappears from members", async () => {
    const { data } = await member.client.from("posts").select("id").eq("id", publicPost);
    expect(data ?? []).toEqual([]);
  });

  test("the author is not left guessing: they still see it, marked hidden", async () => {
    const { data } = await author.client
      .from("posts")
      .select("id, hidden_at, hidden_reason")
      .eq("id", publicPost);
    expect(data?.length).toBe(1);
    expect(data?.[0].hidden_reason).toBe("Breaches the Mithaq");
  });

  test("a moderator cannot hide a companions-only post they cannot see", async () => {
    const { error } = await mod.client
      .from("posts")
      .update({ hidden_at: new Date().toISOString(), hidden_reason: "unseen" })
      .eq("id", privatePost);
    void error;
    const { data } = await admin.from("posts").select("hidden_at").eq("id", privatePost).single();
    expect(data?.hidden_at).toBeNull();
  });

  test("a moderator cannot rewrite the words, only hide them", async () => {
    const { error } = await mod.client
      .from("posts")
      .update({ content: "something else entirely" })
      .eq("id", publicPost);
    expect(error).not.toBeNull();

    const { data } = await admin.from("posts").select("content").eq("id", publicPost).single();
    expect(data?.content).toBe("Said to everyone.");
  });
});

describe("reversing a hiding", () => {
  test("a moderator cannot quietly reverse their own hiding", async () => {
    const { error } = await mod.client
      .from("posts")
      .update({ hidden_at: null, hidden_by: null, hidden_reason: null })
      .eq("id", publicPost);
    expect(error).not.toBeNull();

    const { data } = await admin.from("posts").select("hidden_at").eq("id", publicPost).single();
    expect(data?.hidden_at).not.toBeNull();
  });

  test("an admin can reverse it", async () => {
    const { error } = await owner.client
      .from("posts")
      .update({ hidden_at: null, hidden_by: null, hidden_reason: null })
      .eq("id", publicPost);
    expect(error).toBeNull();

    const { data } = await member.client.from("posts").select("id").eq("id", publicPost);
    expect(data?.length).toBe(1);
  });
});
