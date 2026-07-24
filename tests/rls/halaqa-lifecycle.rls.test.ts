/**
 * RLS — halaqa lifecycle (migration 21).
 *
 *  - creating a halaqa makes the founder its admin member (trigger)
 *  - anyone may join a PUBLIC halaqa — but only ever as 'member'
 *  - claiming a privileged role on join is rejected (no self-promotion)
 *  - a PRIVATE halaqa is invisible to non-members (existence, name, members)
 *  - members see their private halaqa and its member list
 *  - leaving works, and member_count stays true (trigger)
 *  - nobody can insert a membership row for someone else
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let founder: TestUser;
let joiner: TestUser;
let outsider: TestUser;
let publicId: string;
let privateId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [founder, joiner, outsider] = await Promise.all([
    createTestUser(admin, "found"),
    createTestUser(admin, "join"),
    createTestUser(admin, "outs"),
  ]);

  const mk = async (name: string, isPublic: boolean) => {
    const { data, error } = await founder.client
      .from("halaqas")
      .insert({
        name,
        description: "RLS lifecycle fixture",
        category: "Quran",
        is_public: isPublic,
        created_by: founder.id,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`halaqa fixture ${name}: ${error?.message}`);
    return data.id as string;
  };

  publicId = await mk("RLS Public Circle", true);
  privateId = await mk("RLS Private Circle", false);
});

afterAll(async () => {
  await admin.from("halaqas").delete().in("id", [publicId, privateId]);
  await Promise.all(
    [founder, joiner, outsider].map((u) => deleteTestUser(admin, u))
  );
});

test("the founder is automatically the admin member of their halaqa", async () => {
  const { data } = await founder.client
    .from("halaqa_members")
    .select("role")
    .eq("halaqa_id", publicId)
    .eq("user_id", founder.id);
  expect(data).toEqual([{ role: "admin" }]);
});

test("anyone may join a public halaqa as a member", async () => {
  const { error } = await joiner.client
    .from("halaqa_members")
    .insert({ halaqa_id: publicId, user_id: joiner.id, role: "member" });
  expect(error).toBeNull();

  const { data } = await joiner.client
    .from("halaqa_members")
    .select("user_id")
    .eq("halaqa_id", publicId);
  expect(data?.map((m) => m.user_id).sort()).toEqual(
    [founder.id, joiner.id].sort()
  );
});

test("joining with a privileged role is rejected", async () => {
  const { error } = await outsider.client
    .from("halaqa_members")
    .insert({ halaqa_id: publicId, user_id: outsider.id, role: "admin" });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("nobody can insert a membership for someone else", async () => {
  const { error } = await outsider.client
    .from("halaqa_members")
    .insert({ halaqa_id: publicId, user_id: joiner.id, role: "member" });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("a private halaqa is invisible to non-members", async () => {
  const { data: rows } = await outsider.client
    .from("halaqas")
    .select("id")
    .eq("id", privateId);
  expect(rows).toEqual([]);

  const { data: members } = await outsider.client
    .from("halaqa_members")
    .select("user_id")
    .eq("halaqa_id", privateId);
  expect(members).toEqual([]);
});

test("a non-member cannot join a private halaqa directly", async () => {
  const { error } = await outsider.client
    .from("halaqa_members")
    .insert({ halaqa_id: privateId, user_id: outsider.id, role: "member" });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("members see their private halaqa and its member list", async () => {
  // Founder (admin) brings joiner into the private circle.
  const { error: addErr } = await founder.client
    .from("halaqa_members")
    .insert({ halaqa_id: privateId, user_id: joiner.id, role: "member" });
  expect(addErr).toBeNull();

  const { data: rows } = await joiner.client
    .from("halaqas")
    .select("name")
    .eq("id", privateId);
  expect(rows).toEqual([{ name: "RLS Private Circle" }]);

  const { data: members } = await joiner.client
    .from("halaqa_members")
    .select("user_id")
    .eq("halaqa_id", privateId);
  expect(members?.length).toBe(2);
});

test("a non-member cannot post into a halaqa", async () => {
  const { error } = await outsider.client.from("posts").insert({
    author_id: outsider.id,
    content: "injected into a circle I never joined",
    visibility: "halaqa",
    halaqa_id: publicId,
  });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");

  // A member posting into their own circle is fine.
  const { error: memberPost } = await founder.client.from("posts").insert({
    author_id: founder.id,
    content: "a reflection for the circle",
    visibility: "halaqa",
    halaqa_id: publicId,
  });
  expect(memberPost).toBeNull();
  await admin.from("posts").delete().eq("author_id", founder.id);
});

test("leaving a halaqa works and member_count stays true", async () => {
  const { error } = await joiner.client
    .from("halaqa_members")
    .delete()
    .eq("halaqa_id", publicId)
    .eq("user_id", joiner.id);
  expect(error).toBeNull();

  // Count via service_role: the denormalised member_count must match reality.
  const { data } = await admin
    .from("halaqas")
    .select("member_count")
    .eq("id", publicId)
    .single();
  expect(data?.member_count).toBe(1);
});
