/**
 * RLS — user_roles + Review gating (migration 20).
 *
 *  - a member reads only their own roles
 *  - a member cannot grant themselves a role (no self-promotion)
 *  - the Review queue is visible only to granted reviewers
 *  - recording a review requires the reviewer role
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let reviewer: TestUser;
let plainMember: TestUser;
let submitter: TestUser;
let submissionId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [reviewer, plainMember, submitter] = await Promise.all([
    createTestUser(admin, "revwr"),
    createTestUser(admin, "plain"),
    createTestUser(admin, "submt"),
  ]);

  // Grant the reviewer role via service_role (admin bootstrap path).
  const { error: grantErr } = await admin
    .from("user_roles")
    .insert({ user_id: reviewer.id, role: "reviewer" });
  if (grantErr) throw new Error(`grant reviewer: ${grantErr.message}`);

  const { data: sub, error } = await submitter.client
    .from("content_submissions")
    .insert({
      contributor_id: submitter.id,
      type: "article",
      title: "In-pipeline fixture",
      content: "Body.",
      status: "submitted",
    })
    .select("id")
    .single();
  if (error || !sub) throw new Error(`submission fixture: ${error?.message}`);
  submissionId = sub.id;
});

afterAll(async () => {
  await admin.from("content_submissions").delete().eq("contributor_id", submitter.id);
  await admin.from("user_roles").delete().eq("user_id", reviewer.id);
  await Promise.all(
    [reviewer, plainMember, submitter].map((u) => deleteTestUser(admin, u))
  );
});

test("a member reads their own roles", async () => {
  const { data } = await reviewer.client
    .from("user_roles")
    .select("role")
    .eq("user_id", reviewer.id);
  expect(data).toEqual([{ role: "reviewer" }]);
});

test("a member cannot see another member's roles", async () => {
  const { data } = await plainMember.client
    .from("user_roles")
    .select("role")
    .eq("user_id", reviewer.id);
  expect(data).toEqual([]);
});

test("a member cannot grant themselves a role", async () => {
  const { error } = await plainMember.client
    .from("user_roles")
    .insert({ user_id: plainMember.id, role: "reviewer" });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("only a granted reviewer sees the review queue", async () => {
  const asReviewer = await reviewer.client
    .from("content_submissions")
    .select("id")
    .eq("id", submissionId);
  expect(asReviewer.data).toHaveLength(1);

  const asPlain = await plainMember.client
    .from("content_submissions")
    .select("id")
    .eq("id", submissionId);
  expect(asPlain.data).toEqual([]);
});

test("recording a review requires the reviewer role", async () => {
  const asPlain = await plainMember.client.from("community_reviews").insert({
    submission_id: submissionId,
    reviewer_id: plainMember.id,
    action: "approve",
    stage: 1,
  });
  expect(asPlain.error).not.toBeNull();
  expect(asPlain.error?.code).toBe("42501");

  const asReviewer = await reviewer.client.from("community_reviews").insert({
    submission_id: submissionId,
    reviewer_id: reviewer.id,
    action: "approve",
    stage: 1,
  });
  expect(asReviewer.error).toBeNull();
});
