/**
 * RLS — the Mithaq is recorded, and recorded honestly (migration 30).
 *
 * The covenant has been shown since the first signup screen, but acceptance
 * was never stored anywhere: acceptMithaq lived only in form state and a zod
 * rule. So there was no record that any member had agreed to it, and anyone
 * arriving through Google never saw it at all.
 *
 *  - a member can record their own acceptance
 *  - a member cannot record acceptance on someone else's behalf
 *  - acceptance cannot be back-dated, which is the only way the timestamp
 *    means anything
 *  - acceptance cannot be quietly withdrawn to rewrite history; leaving is
 *    deleting the account, not un-agreeing
 *  - the version accepted is stored, so a later Mithaq can be re-consented
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let member: TestUser;
let other: TestUser;

beforeAll(async () => {
  admin = createAdminClient();
  [member, other] = await Promise.all([
    // These two test the recording itself, so they start at the threshold.
    createTestUser(admin, "mithaqa", { acceptMithaq: false }),
    createTestUser(admin, "mithaqb", { acceptMithaq: false }),
  ]);
});

afterAll(async () => {
  await Promise.all([deleteTestUser(admin, member), deleteTestUser(admin, other)]);
});

describe("the covenant governs contributing", () => {
  test("someone who has not accepted cannot post", async () => {
    const fresh = await createTestUser(admin, "mithaqc", { acceptMithaq: false });
    const { error } = await fresh.client
      .from("posts")
      .insert({ author_id: fresh.id, content: "Before agreeing to anything." });
    expect(error).not.toBeNull();
    await deleteTestUser(admin, fresh);
  });

  test("someone who has not accepted cannot comment", async () => {
    const host = await createTestUser(admin, "mithaqh");
    const fresh = await createTestUser(admin, "mithaqd", { acceptMithaq: false });
    const { data: post } = await admin
      .from("posts")
      .insert({ author_id: host.id, content: "Open to everyone.", visibility: "public" })
      .select("id")
      .single();

    const { error } = await fresh.client
      .from("comments")
      .insert({ post_id: post!.id, author_id: fresh.id, content: "Before agreeing." });
    expect(error).not.toBeNull();

    await admin.from("posts").delete().eq("id", post!.id);
    await Promise.all([deleteTestUser(admin, fresh), deleteTestUser(admin, host)]);
  });

  test("once accepted, they can post", async () => {
    const fresh = await createTestUser(admin, "mithaqe", { acceptMithaq: false });
    await fresh.client
      .from("profiles")
      .update({ mithaq_accepted_at: new Date().toISOString(), mithaq_version: "1" })
      .eq("id", fresh.id);

    const { error } = await fresh.client
      .from("posts")
      .insert({ author_id: fresh.id, content: "Having agreed." });
    expect(error).toBeNull();
    await deleteTestUser(admin, fresh);
  });
});

describe("recording the covenant", () => {
  test("a new account starts with no acceptance", async () => {
    const { data } = await admin
      .from("profiles")
      .select("mithaq_accepted_at, mithaq_version")
      .eq("id", member.id)
      .single();
    expect(data?.mithaq_accepted_at).toBeNull();
    expect(data?.mithaq_version).toBeNull();
  });

  test("a member can record their own acceptance", async () => {
    const { error } = await member.client
      .from("profiles")
      .update({ mithaq_accepted_at: new Date().toISOString(), mithaq_version: "1" })
      .eq("id", member.id);
    expect(error).toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("mithaq_accepted_at, mithaq_version")
      .eq("id", member.id)
      .single();
    expect(data?.mithaq_accepted_at).not.toBeNull();
    expect(data?.mithaq_version).toBe("1");
  });

  test("a member cannot accept on someone else's behalf", async () => {
    await member.client
      .from("profiles")
      .update({ mithaq_accepted_at: new Date().toISOString(), mithaq_version: "1" })
      .eq("id", other.id);

    const { data } = await admin
      .from("profiles")
      .select("mithaq_accepted_at")
      .eq("id", other.id)
      .single();
    expect(data?.mithaq_accepted_at).toBeNull();
  });

  test("acceptance cannot be back-dated", async () => {
    const lastYear = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    const { error } = await other.client
      .from("profiles")
      .update({ mithaq_accepted_at: lastYear, mithaq_version: "1" })
      .eq("id", other.id);
    expect(error).not.toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("mithaq_accepted_at")
      .eq("id", other.id)
      .single();
    expect(data?.mithaq_accepted_at).toBeNull();
  });

  test("acceptance cannot be withdrawn to rewrite history", async () => {
    const { error } = await member.client
      .from("profiles")
      .update({ mithaq_accepted_at: null, mithaq_version: null })
      .eq("id", member.id);
    expect(error).not.toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("mithaq_accepted_at")
      .eq("id", member.id)
      .single();
    expect(data?.mithaq_accepted_at).not.toBeNull();
  });

  test("re-accepting a newer Mithaq is allowed", async () => {
    const { error } = await member.client
      .from("profiles")
      .update({ mithaq_accepted_at: new Date().toISOString(), mithaq_version: "2" })
      .eq("id", member.id);
    expect(error).toBeNull();

    const { data } = await admin
      .from("profiles")
      .select("mithaq_version")
      .eq("id", member.id)
      .single();
    expect(data?.mithaq_version).toBe("2");
  });
});
