/**
 * RLS — community contribution & review access (migration 19).
 *
 *  - a member can submit content and read their own submissions
 *  - the community can read submissions in the review pipeline
 *  - drafts stay private to their author
 *  - nobody can submit as someone else
 *  - reviews are recorded by the reviewer themselves only
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
let reviewer: TestUser;
let submissionId: string;
let draftId: string;

beforeAll(async () => {
  admin = createAdminClient();
  [author, reviewer] = await Promise.all([
    createTestUser(admin, "a"),
    createTestUser(admin, "b"),
  ]);

  const { data: submitted, error: e1 } = await author.client
    .from("content_submissions")
    .insert({
      contributor_id: author.id,
      type: "article",
      title: "RLS fixture — under review",
      description: "fixture",
      content: "Body of the fixture submission.",
      status: "submitted",
    })
    .select("id")
    .single();
  if (e1 || !submitted) throw new Error(`submitted fixture: ${e1?.message}`);
  submissionId = submitted.id;

  const { data: draft, error: e2 } = await author.client
    .from("content_submissions")
    .insert({
      contributor_id: author.id,
      type: "article",
      title: "RLS fixture — draft",
      content: "Draft body.",
      status: "draft",
    })
    .select("id")
    .single();
  if (e2 || !draft) throw new Error(`draft fixture: ${e2?.message}`);
  draftId = draft.id;
});

afterAll(async () => {
  await admin.from("content_submissions").delete().eq("contributor_id", author.id);
  await Promise.all([author, reviewer].map((u) => deleteTestUser(admin, u)));
});

test("author reads their own submissions (draft included)", async () => {
  const { data } = await author.client
    .from("content_submissions")
    .select("id")
    .eq("contributor_id", author.id);
  expect(data).toHaveLength(2);
});

test("the community can read submissions under review", async () => {
  const { data } = await reviewer.client
    .from("content_submissions")
    .select("id, title")
    .eq("id", submissionId);
  expect(data).toHaveLength(1);
});

test("drafts stay private to the author", async () => {
  const { data } = await reviewer.client
    .from("content_submissions")
    .select("id")
    .eq("id", draftId);
  expect(data).toEqual([]);
});

test("nobody can submit as someone else", async () => {
  const { error } = await reviewer.client.from("content_submissions").insert({
    contributor_id: author.id,
    type: "article",
    title: "forged",
    content: "forged",
    status: "submitted",
  });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("a reviewer records a review as themselves; forging reviewer_id fails", async () => {
  const { error } = await reviewer.client.from("community_reviews").insert({
    submission_id: submissionId,
    reviewer_id: reviewer.id,
    action: "approve",
    stage: 1,
  });
  expect(error).toBeNull();

  const { error: forged } = await reviewer.client.from("community_reviews").insert({
    submission_id: submissionId,
    reviewer_id: author.id,
    action: "approve",
    stage: 1,
  });
  expect(forged).not.toBeNull();
  expect(forged?.code).toBe("42501");
});
