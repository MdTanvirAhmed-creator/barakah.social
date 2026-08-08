/**
 * RLS — working moderation + no self-promotion (migration 22).
 *
 *  - a member files a report and sees only their own
 *  - another member sees nothing
 *  - a granted moderator sees the queue and resolves reports
 *  - a plain member cannot touch someone else's report
 *  - nobody can grant themselves profiles.role / is_verified_scholar
 *    (the columns 23 admin policies trust — previously self-updatable)
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let reporter: TestUser;
let member: TestUser;
let moderator: TestUser;
let postId: string;
let reportId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [reporter, member, moderator] = await Promise.all([
    createTestUser(admin, "rept"),
    createTestUser(admin, "memb"),
    createTestUser(admin, "modr"),
  ]);

  const { error: grantErr } = await admin
    .from("user_roles")
    .insert({ user_id: moderator.id, role: "moderator" });
  if (grantErr) throw new Error(`grant moderator: ${grantErr.message}`);

  const { data: post, error: postErr } = await admin
    .from("posts")
    .insert({ author_id: member.id, content: "reported fixture", visibility: "public" })
    .select("id")
    .single();
  if (postErr || !post) throw new Error(`post fixture: ${postErr?.message}`);
  postId = post.id;

  const { data: report, error: repErr } = await reporter.client
    .from("reports")
    .insert({
      reporter_id: reporter.id,
      content_type: "post",
      content_id: postId,
      reason: "misinformation",
      description: "RLS moderation fixture",
    })
    .select("id")
    .single();
  if (repErr || !report) throw new Error(`report fixture: ${repErr?.message}`);
  reportId = report.id;
});

afterAll(async () => {
  await admin.from("reports").delete().eq("id", reportId);
  await admin.from("posts").delete().eq("id", postId);
  await admin.from("user_roles").delete().eq("user_id", moderator.id);
  await Promise.all(
    [reporter, member, moderator].map((u) => deleteTestUser(admin, u))
  );
});

test("the reporter sees their own report", async () => {
  const { data } = await reporter.client
    .from("reports")
    .select("id")
    .eq("id", reportId);
  expect(data).toHaveLength(1);
});

test("another member sees nothing", async () => {
  const { data } = await member.client
    .from("reports")
    .select("id")
    .eq("id", reportId);
  expect(data).toEqual([]);
});

test("a granted moderator sees the queue", async () => {
  const { data } = await moderator.client
    .from("reports")
    .select("id, status")
    .eq("id", reportId);
  expect(data).toEqual([{ id: reportId, status: "pending" }]);
});

test("a moderator resolves a report", async () => {
  const { data, error } = await moderator.client
    .from("reports")
    .update({
      status: "resolved",
      reviewed_by: moderator.id,
      reviewed_at: new Date().toISOString(),
      resolution_note: "Content reviewed; no violation found.",
    })
    .eq("id", reportId)
    .select("status");
  expect(error).toBeNull();
  expect(data).toEqual([{ status: "resolved" }]);
});

test("a plain member cannot touch someone else's report", async () => {
  const { data } = await member.client
    .from("reports")
    .update({ status: "dismissed" })
    .eq("id", reportId)
    .select("id");
  // No policy row matches — the update silently affects nothing.
  expect(data).toEqual([]);
});

test("a moderator sees reported private content, but ONLY reported content", async () => {
  // Two companions-only posts by the member; one gets reported.
  const { data: posts, error: mkErr } = await admin
    .from("posts")
    .insert([
      { author_id: member.id, content: "reported private words", visibility: "companions" },
      { author_id: member.id, content: "unreported private words", visibility: "companions" },
    ])
    .select("id, content");
  expect(mkErr).toBeNull();
  const reported = posts!.find((p) => p.content.startsWith("reported"))!;
  const unreported = posts!.find((p) => p.content.startsWith("unreported"))!;

  const { error: repErr } = await reporter.client.from("reports").insert({
    reporter_id: reporter.id,
    content_type: "post",
    content_id: reported.id,
    reason: "ghibah",
  });
  expect(repErr).toBeNull();

  // The moderator (not a companion of the author) sees the reported post…
  const seen = await moderator.client
    .from("posts")
    .select("id")
    .in("id", [reported.id, unreported.id]);
  expect(seen.data).toEqual([{ id: reported.id }]);

  // …and a plain member still sees neither.
  const memberView = await reporter.client
    .from("posts")
    .select("id")
    .eq("id", reported.id);
  expect(memberView.data).toEqual([]);

  await admin.from("reports").delete().eq("content_id", reported.id);
  await admin.from("posts").delete().in("id", [reported.id, unreported.id]);
});

test("nobody can grant themselves admin or scholar status", async () => {
  const roleAttempt = await member.client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", member.id)
    .select("id");
  expect(roleAttempt.error).not.toBeNull();

  const scholarAttempt = await member.client
    .from("profiles")
    .update({ is_verified_scholar: true })
    .eq("id", member.id)
    .select("id");
  expect(scholarAttempt.error).not.toBeNull();

  // Ordinary profile edits still work.
  const benign = await member.client
    .from("profiles")
    .update({ bio: "Seeking beneficial knowledge." })
    .eq("id", member.id)
    .select("id");
  expect(benign.error).toBeNull();
  expect(benign.data).toHaveLength(1);
});
