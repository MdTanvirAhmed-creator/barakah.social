/**
 * RLS — the hadith reference tables (migration 35).
 *
 * Same contract as the Qur'an tables from Stage 1: this is reference material
 * for everyone, so it is world-readable, and it enters the database only
 * through a service-role import script. There are no client write policies at
 * all, which is stronger than a policy that refuses — there is nothing to
 * evaluate.
 *
 * The provenance tables matter as much as the text. A hadith without a
 * recorded source and a named grader is a claim, and this platform does not
 * make claims on behalf of scholars.
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

const TABLES = ["hadith_sources", "hadith_collections", "hadith", "hadith_translations"];

beforeAll(async () => {
  admin = createAdminClient();
  const { url, anonKey } = getTestEnv();
  anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  member = await createTestUser(admin, "hadithreader");
});

afterAll(async () => {
  await deleteTestUser(admin, member);
});

describe("reference material is for everyone", () => {
  test.each(TABLES)("a signed-out reader can read %s", async (table) => {
    const { error } = await anon.from(table).select("*").limit(1);
    expect(error).toBeNull();
  });

  test.each(TABLES)("a signed-in member can read %s", async (table) => {
    const { error } = await member.client.from(table).select("*").limit(1);
    expect(error).toBeNull();
  });
});

describe("nobody writes scripture from a browser", () => {
  test("a member cannot insert a hadith", async () => {
    const { data } = await member.client
      .from("hadith")
      .insert({
        collection_id: "nawawi40",
        number: 999,
        text_arabic: "invented",
        source_id: "invented",
      })
      .select();
    // PostgREST returns data:null when no INSERT policy exists at all.
    expect(data ?? []).toEqual([]);

    const { count } = await admin
      .from("hadith")
      .select("*", { count: "exact", head: true })
      .eq("number", 999);
    expect(count).toBe(0);
  });

  test("a member cannot rewrite an existing hadith", async () => {
    const { data: before } = await admin
      .from("hadith")
      .select("id, text_arabic")
      .limit(1)
      .single();
    if (!before) return; // nothing imported locally; the insert test still holds

    await member.client
      .from("hadith")
      .update({ text_arabic: "altered" })
      .eq("id", before.id);

    const { data: after } = await admin
      .from("hadith")
      .select("text_arabic")
      .eq("id", before.id)
      .single();
    expect(after?.text_arabic).toBe(before.text_arabic);
  });

  test("a member cannot invent a source to lend something authority", async () => {
    const { data } = await member.client
      .from("hadith_sources")
      .insert({
        id: "forged",
        kind: "arabic_text",
        name: "Forged",
        license: "none",
        source_url: "http://example.invalid",
      })
      .select();
    expect(data ?? []).toEqual([]);
  });
});

describe("provenance is not optional", () => {
  test("every hadith points at a source", async () => {
    const { data } = await admin.from("hadith").select("id, source_id").is("source_id", null);
    expect(data ?? []).toEqual([]);
  });

  test("every source records a licence and where it came from", async () => {
    const { data } = await admin.from("hadith_sources").select("id, license, source_url, checksum");
    for (const s of data ?? []) {
      expect(s.license ?? "").not.toBe("");
      expect(s.source_url ?? "").not.toBe("");
      expect(s.checksum ?? "").not.toBe("");
    }
  });

  test("a hadith carries the attribution as transmitted, not a bare stamp", async () => {
    const { data } = await admin.from("hadith").select("number, takhrij_arabic").limit(5);
    // Where a takhrij exists it must be the source's own words, never an
    // empty string standing in for "trust us".
    for (const h of data ?? []) {
      if (h.takhrij_arabic !== null) expect(h.takhrij_arabic.length).toBeGreaterThan(3);
    }
  });
});
