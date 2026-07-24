/**
 * RLS — quiet notifications inbox (migration 20).
 *
 *  - a companion request notifies the addressee
 *  - accepting notifies the original requester
 *  - you read only your own notifications
 *  - a client cannot forge a notification for someone else
 *  - beneficial marks never generate a notification (private du'a, no ping)
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let requester: TestUser;
let addressee: TestUser;

beforeAll(async () => {
  admin = createAdminClient();
  [requester, addressee] = await Promise.all([
    createTestUser(admin, "reqr"),
    createTestUser(admin, "addr"),
  ]);
});

afterAll(async () => {
  await admin.from("companionships").delete().eq("requester_id", requester.id);
  await admin.from("notifications").delete().in("user_id", [requester.id, addressee.id]);
  await Promise.all([requester, addressee].map((u) => deleteTestUser(admin, u)));
});

test("a companion request notifies the addressee, and accepting notifies the requester", async () => {
  const { error: reqErr } = await requester.client
    .from("companionships")
    .insert({ requester_id: requester.id, addressee_id: addressee.id, status: "pending" });
  expect(reqErr).toBeNull();

  const inbox = await addressee.client
    .from("notifications")
    .select("type, actor_id")
    .eq("type", "companion_request");
  expect(inbox.data).toEqual([
    expect.objectContaining({ type: "companion_request", actor_id: requester.id }),
  ]);

  // Addressee accepts.
  const { error: accErr } = await addressee.client
    .from("companionships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("requester_id", requester.id)
    .eq("addressee_id", addressee.id);
  expect(accErr).toBeNull();

  const requesterInbox = await requester.client
    .from("notifications")
    .select("type, actor_id")
    .eq("type", "companion_accepted");
  expect(requesterInbox.data).toEqual([
    expect.objectContaining({ type: "companion_accepted", actor_id: addressee.id }),
  ]);
});

test("you read only your own notifications", async () => {
  // The requester must not see the addressee's request notification.
  const { data } = await requester.client
    .from("notifications")
    .select("id")
    .eq("type", "companion_request");
  expect(data).toEqual([]);
});

test("a client cannot forge a notification for someone else", async () => {
  const { error } = await requester.client.from("notifications").insert({
    user_id: addressee.id,
    type: "companion_request",
    actor_id: requester.id,
  });
  // No INSERT policy exists for authenticated → denied.
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("the daily digest function is not callable by clients", async () => {
  // It aggregates across all users — service_role only (Phase 6 mailer).
  const { error } = await requester.client.rpc("daily_notification_digest");
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("marking a post beneficial produces no notification", async () => {
  const { data: post } = await admin
    .from("posts")
    .insert({ author_id: addressee.id, content: "reminder", visibility: "public" })
    .select("id")
    .single();

  const before = await addressee.client
    .from("notifications")
    .select("id", { count: "exact", head: true });

  await requester.client
    .from("beneficial_marks")
    .insert({ user_id: requester.id, post_id: post!.id });

  const after = await addressee.client
    .from("notifications")
    .select("id", { count: "exact", head: true });

  expect(after.count).toBe(before.count);
  await admin.from("posts").delete().eq("id", post!.id);
});
