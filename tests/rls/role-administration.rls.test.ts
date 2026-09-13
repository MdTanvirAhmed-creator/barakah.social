/**
 * RLS — who may grant a role, and who may not (migration 33).
 *
 * user_roles has had correct policies since migration 20, but production had
 * no admin in it at all, so nobody could grant anything and the table was
 * inert. Two further things were missing before it could be used in anger:
 * granted_by was whatever the client said it was, and nothing stopped the
 * last admin removing themselves and locking the platform out of its own
 * moderation.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let owner: TestUser;      // an admin
let second: TestUser;     // a second admin, so the first may be demoted
let moderator: TestUser;  // a moderator
let member: TestUser;     // an ordinary member

async function grant(userId: string, role: string) {
  const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(`seed role ${role}: ${error.message}`);
}

beforeAll(async () => {
  admin = createAdminClient();
  [owner, second, moderator, member] = await Promise.all([
    createTestUser(admin, "raowner"),
    createTestUser(admin, "rasecond"),
    createTestUser(admin, "ramod"),
    createTestUser(admin, "ramember"),
  ]);
  await grant(owner.id, "admin");
  await grant(second.id, "admin");
  await grant(moderator.id, "moderator");
});

afterAll(async () => {
  await admin.from("user_roles").delete().in("user_id", [owner.id, second.id, moderator.id, member.id]);
  await Promise.all([
    deleteTestUser(admin, owner),
    deleteTestUser(admin, second),
    deleteTestUser(admin, moderator),
    deleteTestUser(admin, member),
  ]);
});

describe("granting roles", () => {
  test("an admin can make someone a moderator", async () => {
    const { error } = await owner.client
      .from("user_roles")
      .insert({ user_id: member.id, role: "moderator" });
    expect(error).toBeNull();

    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", member.id);
    expect(data?.map((r) => r.role)).toContain("moderator");
  });

  test("granted_by records the real granter, not what the client claims", async () => {
    const { data } = await admin
      .from("user_roles")
      .select("granted_by, granted_at")
      .eq("user_id", member.id)
      .eq("role", "moderator")
      .single();
    expect(data?.granted_by).toBe(owner.id);
    expect(data?.granted_at).not.toBeNull();
  });

  test("a moderator cannot grant roles", async () => {
    const { error } = await moderator.client
      .from("user_roles")
      .insert({ user_id: moderator.id, role: "admin" });
    expect(error).not.toBeNull();

    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", moderator.id);
    expect(data?.map((r) => r.role)).not.toContain("admin");
  });

  test("an ordinary member cannot make themselves anything", async () => {
    const { error } = await member.client
      .from("user_roles")
      .insert({ user_id: member.id, role: "admin" });
    expect(error).not.toBeNull();
  });

  test("a member cannot forge granted_by to look authorised", async () => {
    const { error } = await member.client
      .from("user_roles")
      .insert({ user_id: member.id, role: "admin", granted_by: owner.id });
    expect(error).not.toBeNull();
  });
});

describe("revoking roles", () => {
  test("an admin can revoke a moderator", async () => {
    const { error } = await owner.client
      .from("user_roles")
      .delete()
      .eq("user_id", member.id)
      .eq("role", "moderator");
    expect(error).toBeNull();

    const { data } = await admin.from("user_roles").select("role").eq("user_id", member.id);
    expect(data ?? []).toEqual([]);
  });

  test("an admin may step down while another admin remains", async () => {
    const { error } = await second.client
      .from("user_roles")
      .delete()
      .eq("user_id", second.id)
      .eq("role", "admin");
    expect(error).toBeNull();
    // Put them back for the next test.
    await grant(second.id, "admin");
  });

  test("the last admin cannot be removed", async () => {
    // This must be the only admin in the database for the guard to be the
    // thing under test, and other suites leave admins of their own behind.
    // Park them, assert, then put them back exactly as they were.
    const { data: others } = await admin
      .from("user_roles")
      .select("user_id, role, granted_by, granted_at")
      .eq("role", "admin")
      .neq("user_id", owner.id);
    await admin.from("user_roles").delete().eq("role", "admin").neq("user_id", owner.id);

    const { error } = await owner.client
      .from("user_roles")
      .delete()
      .eq("user_id", owner.id)
      .eq("role", "admin");
    expect(error).not.toBeNull();

    const { data } = await admin.from("user_roles").select("user_id").eq("role", "admin");
    expect(data?.map((r) => r.user_id)).toContain(owner.id);

    // Restoring the parked rows already puts the second admin back.
    if ((others ?? []).length) await admin.from("user_roles").insert(others!);
  });
});

describe("seeing roles", () => {
  test("a member sees only their own roles", async () => {
    const { data } = await member.client.from("user_roles").select("user_id, role");
    expect((data ?? []).every((r) => r.user_id === member.id)).toBe(true);
  });

  test("an admin sees everyone's roles, which is what an admin page needs", async () => {
    const { data } = await owner.client.from("user_roles").select("user_id, role");
    const ids = (data ?? []).map((r) => r.user_id);
    expect(ids).toContain(moderator.id);
  });
});
