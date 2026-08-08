/**
 * RLS — the Qur'an reference core is open to read, sealed to write
 * (migration 23).
 *
 *  - any signed-in member reads surahs, ayat, translations, sources
 *  - the anonymous (signed-out) role can read too — scripture is public
 *  - no client can insert, modify or delete a single character; only the
 *    service-role import pipeline writes
 *
 * Fixtures use sentinel ids far outside real Qur'an data (ayah id 999999,
 * source 'rls-test-*') so the suite is safe to run against a database that
 * already holds the imported text.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminClient,
  createTestUser,
  deleteTestUser,
  getTestEnv,
  TestUser,
} from "./helpers";

const SENTINEL_AYAH_ID = 999999;
const SENTINEL_SOURCE = "rls-test-arabic";
const SENTINEL_TRANS_SOURCE = "rls-test-translation";

let admin: SupabaseClient;
let member: TestUser;
let hadSurah1: boolean;

beforeAll(async () => {
  admin = createAdminClient();
  member = await createTestUser(admin, "quran");

  // Surah 1 may or may not exist depending on whether the real import has
  // run; create it only if absent and remember, so cleanup never touches
  // real data.
  const { data: existing } = await admin
    .from("quran_surahs")
    .select("number")
    .eq("number", 1);
  hadSurah1 = (existing?.length ?? 0) > 0;
  if (!hadSurah1) {
    const { error } = await admin.from("quran_surahs").insert({
      number: 1,
      name_arabic: "الفاتحة",
      name_transliterated: "Al-Fatihah",
      name_english: "The Opening",
      revelation_place: "makkah",
      ayah_count: 7,
    });
    if (error) throw new Error(`surah fixture: ${error.message}`);
  }

  const { error: srcErr } = await admin.from("quran_sources").insert([
    {
      id: SENTINEL_SOURCE,
      kind: "arabic_text",
      name: "RLS fixture (arabic)",
      language: "ar",
      license: "test",
      source_url: "https://example.invalid",
    },
    {
      id: SENTINEL_TRANS_SOURCE,
      kind: "translation",
      name: "RLS fixture (translation)",
      language: "en",
      license: "test",
      source_url: "https://example.invalid",
    },
  ]);
  if (srcErr) throw new Error(`source fixture: ${srcErr.message}`);

  const { error: ayahErr } = await admin.from("quran_ayat").insert({
    id: SENTINEL_AYAH_ID,
    surah: 1,
    ayah: 9999,
    text_uthmani: "fixture-only row, not scripture",
    source_id: SENTINEL_SOURCE,
  });
  if (ayahErr) throw new Error(`ayah fixture: ${ayahErr.message}`);

  const { error: transErr } = await admin.from("quran_translations").insert({
    ayah_id: SENTINEL_AYAH_ID,
    source_id: SENTINEL_TRANS_SOURCE,
    text: "fixture translation",
  });
  if (transErr) throw new Error(`translation fixture: ${transErr.message}`);
});

afterAll(async () => {
  await admin.from("quran_ayat").delete().eq("id", SENTINEL_AYAH_ID);
  await admin
    .from("quran_sources")
    .delete()
    .in("id", [SENTINEL_SOURCE, SENTINEL_TRANS_SOURCE]);
  if (!hadSurah1) {
    await admin.from("quran_surahs").delete().eq("number", 1);
  }
  await deleteTestUser(admin, member);
});

test("a signed-in member reads surahs, ayat, translations and sources", async () => {
  const [surahs, ayat, translations, sources] = await Promise.all([
    member.client.from("quran_surahs").select("number").eq("number", 1),
    member.client.from("quran_ayat").select("id").eq("id", SENTINEL_AYAH_ID),
    member.client
      .from("quran_translations")
      .select("text")
      .eq("ayah_id", SENTINEL_AYAH_ID),
    member.client.from("quran_sources").select("id").eq("id", SENTINEL_SOURCE),
  ]);
  expect(surahs.data).toHaveLength(1);
  expect(ayat.data).toHaveLength(1);
  expect(translations.data).toHaveLength(1);
  expect(sources.data).toHaveLength(1);
});

test("the signed-out (anon) role can read — scripture is public", async () => {
  const { url, anonKey } = getTestEnv();
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon
    .from("quran_ayat")
    .select("id")
    .eq("id", SENTINEL_AYAH_ID);
  expect(error).toBeNull();
  expect(data).toHaveLength(1);
});

test("no client can write scripture — insert is rejected", async () => {
  const { error } = await member.client.from("quran_ayat").insert({
    id: SENTINEL_AYAH_ID + 1,
    surah: 1,
    ayah: 9998,
    text_uthmani: "forged",
    source_id: SENTINEL_SOURCE,
  });
  expect(error).not.toBeNull();
  expect(error?.code).toBe("42501");
});

test("no client can modify or delete scripture — update/delete touch nothing", async () => {
  // With no UPDATE/DELETE policy at all, PostgREST rejects outright
  // (42501, data null); either way no row may be touched.
  const upd = await member.client
    .from("quran_ayat")
    .update({ text_uthmani: "tampered" })
    .eq("id", SENTINEL_AYAH_ID)
    .select("id");
  expect(upd.data ?? []).toEqual([]);

  const del = await member.client
    .from("quran_ayat")
    .delete()
    .eq("id", SENTINEL_AYAH_ID)
    .select("id");
  expect(del.data ?? []).toEqual([]);

  // The row is untouched.
  const { data } = await admin
    .from("quran_ayat")
    .select("text_uthmani")
    .eq("id", SENTINEL_AYAH_ID)
    .single();
  expect(data?.text_uthmani).toBe("fixture-only row, not scripture");
});
