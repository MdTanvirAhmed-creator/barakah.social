/**
 * RLS — a reader's own marks on the Qur'an are private (migration 26).
 *
 *  - you can record and read your own position, bookmarks, notes, memorisation
 *  - another member sees none of it, and cannot write rows in your name
 *  - a moderator has no special sight here either: unlike reported content,
 *    personal reflection is not moderatable
 */
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  TestUser,
} from "./helpers";

let admin: SupabaseClient;
let reader: TestUser;
let other: TestUser;
let moderator: TestUser;
let ayahId: number;

beforeAll(async () => {
  admin = createAdminClient();
  [reader, other, moderator] = await Promise.all([
    createTestUser(admin, "rdr"),
    createTestUser(admin, "oth"),
    createTestUser(admin, "mod"),
  ]);

  await admin.from("user_roles").insert({ user_id: moderator.id, role: "moderator" });

  // Any real ayah; the corpus may or may not be imported in this database.
  const { data } = await admin.from("quran_ayat").select("id").order("id").limit(1);
  if (!data?.length) {
    // Create a sentinel ayah so the suite is independent of the import.
    await admin.from("quran_sources").insert({
      id: "rls-personal-src",
      kind: "arabic_text",
      name: "fixture",
      license: "test",
      source_url: "https://example.invalid",
    });
    await admin.from("quran_surahs").insert({
      number: 1,
      name_arabic: "-",
      name_transliterated: "-",
      name_english: "-",
      revelation_place: "makkah",
      ayah_count: 7,
    });
    const { data: made } = await admin
      .from("quran_ayat")
      .insert({
        id: 999998,
        surah: 1,
        ayah: 9998,
        text_uthmani: "fixture",
        source_id: "rls-personal-src",
      })
      .select("id")
      .single();
    ayahId = made!.id;
  } else {
    ayahId = data[0].id;
  }
});

afterAll(async () => {
  for (const t of [
    "user_reading_position",
    "user_ayah_bookmarks",
    "user_ayah_notes",
    "user_memorization",
  ]) {
    await admin
      .from(t)
      .delete()
      .in("user_id", [reader.id, other.id, moderator.id]);
  }
  await admin.from("user_roles").delete().eq("user_id", moderator.id);
  await admin.from("quran_ayat").delete().eq("id", 999998);
  await admin.from("quran_sources").delete().eq("id", "rls-personal-src");
  await Promise.all(
    [reader, other, moderator].map((u) => deleteTestUser(admin, u))
  );
});

test("a reader records and reads their own position, bookmark, note and memorisation", async () => {
  const rows = [
    reader.client.from("user_reading_position").upsert({ user_id: reader.id, ayah_id: ayahId }),
    reader.client.from("user_ayah_bookmarks").insert({ user_id: reader.id, ayah_id: ayahId }),
    reader.client
      .from("user_ayah_notes")
      .insert({ user_id: reader.id, ayah_id: ayahId, text: "A reflection." }),
    reader.client
      .from("user_memorization")
      .insert({ user_id: reader.id, ayah_id: ayahId, state: "learning" }),
  ];
  for (const r of await Promise.all(rows)) expect(r.error).toBeNull();

  const { data } = await reader.client
    .from("user_ayah_notes")
    .select("text")
    .eq("ayah_id", ayahId);
  expect(data).toEqual([{ text: "A reflection." }]);
});

test("another member sees none of it", async () => {
  for (const t of [
    "user_reading_position",
    "user_ayah_bookmarks",
    "user_ayah_notes",
    "user_memorization",
  ]) {
    const { data } = await other.client.from(t).select("user_id");
    expect(data).toEqual([]);
  }
});

test("a moderator has no special sight into personal reflection", async () => {
  const { data } = await moderator.client.from("user_ayah_notes").select("text");
  expect(data).toEqual([]);
});

test("nobody can write rows in someone else's name", async () => {
  const forged = await other.client
    .from("user_ayah_notes")
    .insert({ user_id: reader.id, ayah_id: ayahId, text: "forged" });
  expect(forged.error).not.toBeNull();
  expect(forged.error?.code).toBe("42501");

  const forgedMark = await other.client
    .from("user_memorization")
    .insert({ user_id: reader.id, ayah_id: ayahId, state: "memorised" });
  expect(forgedMark.error).not.toBeNull();
});

test("another member cannot edit or delete your marks", async () => {
  const upd = await other.client
    .from("user_ayah_notes")
    .update({ text: "tampered" })
    .eq("user_id", reader.id)
    .select("user_id");
  expect(upd.data ?? []).toEqual([]);

  const del = await other.client
    .from("user_ayah_bookmarks")
    .delete()
    .eq("user_id", reader.id)
    .select("user_id");
  expect(del.data ?? []).toEqual([]);

  // Untouched.
  const { data } = await admin
    .from("user_ayah_notes")
    .select("text")
    .eq("user_id", reader.id)
    .single();
  expect(data?.text).toBe("A reflection.");
});

test("memorisation state is constrained to what a reader can honestly claim", async () => {
  const { error } = await reader.client
    .from("user_memorization")
    .update({ state: "certified" })
    .eq("user_id", reader.id)
    .eq("ayah_id", ayahId);
  expect(error).not.toBeNull();
});
