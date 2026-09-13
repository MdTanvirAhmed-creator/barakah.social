/**
 * RLS — public_profiles is for members, not for the open internet
 * (migration 31).
 *
 * The view exists so a signed-in member can see who wrote something even when
 * that person is not their companion: username, display name, avatar, scholar
 * status. It is deliberately SECURITY DEFINER, because the whole point is to
 * show those few fields to someone whose RLS would otherwise return nothing.
 *
 * What was not deliberate is that SELECT had been granted to `anon`. The
 * profiles table itself correctly returns nothing to a signed-out caller, but
 * the view walked straight past that and handed over every member's real
 * display name to anyone who asked, no account required. The same decision
 * that made public posts members-only applies here.
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
let member: TestUser;
let stranger: TestUser;

beforeAll(async () => {
  admin = createAdminClient();
  const { url, anonKey } = getTestEnv();
  anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  [member, stranger] = await Promise.all([
    createTestUser(admin, "ppmember"),
    createTestUser(admin, "ppstranger"),
  ]);
});

afterAll(async () => {
  await Promise.all([deleteTestUser(admin, member), deleteTestUser(admin, stranger)]);
});

describe("who may read public_profiles", () => {
  test("a signed-out caller gets nothing", async () => {
    const { data, error } = await anon.from("public_profiles").select("username");
    // Either the grant is gone (error) or the result is empty. Never rows.
    expect(data ?? []).toEqual([]);
    expect(error === null ? (data ?? []).length : 0).toBe(0);
  });

  test("a signed-out caller cannot read the underlying table either", async () => {
    const { data } = await anon.from("profiles").select("username");
    expect(data ?? []).toEqual([]);
  });

  test("a signed-in member can still see a stranger they are not companions with", async () => {
    const { data, error } = await member.client
      .from("public_profiles")
      .select("id, username, display_name")
      .eq("id", stranger.id);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  test("the view still exposes only the intended columns", async () => {
    const { data } = await member.client
      .from("public_profiles")
      .select("*")
      .eq("id", stranger.id)
      .single();
    expect(Object.keys(data ?? {}).sort()).toEqual(
      ["avatar_url", "display_name", "id", "is_verified_scholar", "username"].sort()
    );
  });
});
