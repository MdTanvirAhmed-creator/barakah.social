/**
 * Phase 2 RLS — companions flow hardening.
 *
 *  - request rate limit is enforced server-side (10/hour), immune to
 *    delete-and-resend tricks (counter lives in a private events table)
 *  - blocked users disappear from each other's discovery (public_profiles)
 *  - unblocking restores discovery
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
let userC: TestUser;

beforeAll(async () => {
  admin = createAdminClient();
  [userA, userB, userC] = await Promise.all([
    createTestUser(admin, "a"),
    createTestUser(admin, "b"),
    createTestUser(admin, "c"),
  ]);
});

afterAll(async () => {
  await admin
    .from("companionship_request_events")
    .delete()
    .in("requester_id", [userA.id, userB.id, userC.id]);
  await Promise.all([userA, userB, userC].map((u) => deleteTestUser(admin, u)));
});

describe("request rate limit", () => {
  test("a successful request records a counter event", async () => {
    const { error } = await userB.client
      .from("companionships")
      .insert({ requester_id: userB.id, addressee_id: userC.id });
    expect(error).toBeNull();

    const { data: events } = await admin
      .from("companionship_request_events")
      .select("id")
      .eq("requester_id", userB.id);
    expect(events).toHaveLength(1);
  });

  test("the 11th request within an hour is rejected", async () => {
    // Seed 10 counter events directly (service role) instead of creating 10
    // real addressees.
    const rows = Array.from({ length: 10 }, () => ({ requester_id: userA.id }));
    const { error: seedError } = await admin
      .from("companionship_request_events")
      .insert(rows);
    expect(seedError).toBeNull();

    const { error } = await userA.client
      .from("companionships")
      .insert({ requester_id: userA.id, addressee_id: userB.id });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/rate limit exceeded/);
  });

  test("clients cannot read or reset the counter", async () => {
    const { data, error: readError } = await userA.client
      .from("companionship_request_events")
      .select("id");
    expect(readError).not.toBeNull(); // no grants at all for authenticated
    expect(data).toBeNull();

    const { error: deleteError } = await userA.client
      .from("companionship_request_events")
      .delete()
      .eq("requester_id", userA.id);
    expect(deleteError).not.toBeNull();
  });
});

describe("blocks hide discovery", () => {
  beforeAll(async () => {
    const { error } = await userA.client
      .from("blocks")
      .insert({ blocker_id: userA.id, blocked_id: userB.id });
    if (error) throw new Error(`block fixture: ${error.message}`);
  });

  test("blocked B no longer sees A in public_profiles — and vice versa", async () => {
    const { data: bSeesA } = await userB.client
      .from("public_profiles")
      .select("id")
      .eq("id", userA.id);
    expect(bSeesA).toEqual([]);

    const { data: aSeesB } = await userA.client
      .from("public_profiles")
      .select("id")
      .eq("id", userB.id);
    expect(aSeesB).toEqual([]);
  });

  test("an uninvolved user C still sees both", async () => {
    const { data } = await userC.client
      .from("public_profiles")
      .select("id")
      .in("id", [userA.id, userB.id]);
    expect(data).toHaveLength(2);
  });

  test("the blocker still sees their block list via my_blocked_cards", async () => {
    const { data, error } = await userA.client.rpc("my_blocked_cards");
    expect(error).toBeNull();
    expect((data as { id: string }[]).map((c) => c.id)).toEqual([userB.id]);
  });

  test("my_blocked_cards never exposes other people's blocks", async () => {
    const { data } = await userB.client.rpc("my_blocked_cards");
    expect(data).toEqual([]); // B blocked nobody; A's block of B stays invisible
  });

  test("unblocking restores discovery", async () => {
    const { error } = await userA.client
      .from("blocks")
      .delete()
      .eq("blocker_id", userA.id)
      .eq("blocked_id", userB.id);
    expect(error).toBeNull();

    const { data: bSeesA } = await userB.client
      .from("public_profiles")
      .select("id")
      .eq("id", userA.id);
    expect(bSeesA).toHaveLength(1);
  });
});
