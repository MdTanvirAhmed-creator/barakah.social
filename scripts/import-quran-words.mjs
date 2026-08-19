#!/usr/bin/env node
/**
 * Al-Hikmah Stage 1.1 — word-by-word import.
 *
 * Pulls the word-by-word dataset from the Quran Foundation's open API
 * (api.quran.com v4): each Qur'anic word's Uthmani form with its English
 * gloss. Ayah-end markers (char_type "end") are excluded. Rows key to
 * quran_ayat via verse_key (surah:ayah), never by trusting id alignment.
 *
 * Provenance: a quran_sources row records the API, attribution and the
 * sha256 of the full normalised dataset actually imported.
 *
 * Usage:
 *   node scripts/import-quran-words.mjs --local
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-quran-words.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const SOURCE = {
  id: "quran-com-wbw-en",
  kind: "translation",
  name: "Word-by-word English (Quran Foundation / Quran.com)",
  language: "en",
  translator: "Quran.com word-by-word project",
  license:
    "Provided through the Quran Foundation's open API (api.quran.com) for public benefit, with attribution to Quran.com.",
  source_url: "https://api.quran.com/api/v4/verses/by_chapter/{chapter}?words=true",
};

const TAJWEED_SOURCE = {
  id: "quran-com-tajweed",
  kind: "metadata",
  name: "Tajweed annotation (Quran Foundation / Quran.com)",
  language: "ar",
  translator: null,
  license:
    "Provided through the Quran Foundation's open API (api.quran.com) for public benefit, with attribution to Quran.com.",
  source_url:
    "https://api.quran.com/api/v4/verses/by_chapter/{chapter}?fields=text_uthmani_tajweed",
};

function resolveTarget() {
  const args = process.argv.slice(2);
  if (args.includes("--local")) {
    const out = execSync("supabase status -o env", { encoding: "utf8" });
    const env = Object.fromEntries(
      out
        .split("\n")
        .filter((l) => l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
        })
    );
    return { url: env.API_URL, key: env.SERVICE_ROLE_KEY, label: "local" };
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --local.");
    process.exit(1);
  }
  return { url, key, label: new URL(url).hostname };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    if (attempt < 4) {
      await sleep(1500 * attempt);
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`${res.status} fetching ${url}`);
  }
  return res.json();
}

async function fetchAllWords() {
  /** verse_key -> { words: [{position, text_uthmani, translation}], tajweed } */
  const byVerse = new Map();
  for (let chapter = 1; chapter <= 114; chapter++) {
    let page = 1;
    for (;;) {
      const data = await fetchJson(
        `https://api.quran.com/api/v4/verses/by_chapter/${chapter}` +
          `?words=true&word_fields=text_uthmani&fields=text_uthmani_tajweed&per_page=50&page=${page}`
      );
      for (const verse of data.verses) {
        const words = (verse.words ?? [])
          .filter((w) => w.char_type_name === "word" && w.text_uthmani)
          .map((w) => ({
            position: w.position,
            text_uthmani: w.text_uthmani,
            translation: w.translation?.text ?? "",
          }));
        byVerse.set(verse.verse_key, {
          words,
          tajweed: verse.text_uthmani_tajweed ?? "",
        });
      }
      if (!data.pagination?.next_page) break;
      page = data.pagination.next_page;
      await sleep(150); // be a considerate guest
    }
    if (chapter % 20 === 0) console.log(`  fetched through surah ${chapter} ...`);
    await sleep(150);
  }
  return byVerse;
}

async function main() {
  const target = resolveTarget();
  console.log(`Importing word-by-word data into: ${target.label}`);
  const db = createClient(target.url, target.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Map verse_key -> our ayah id from the already-imported canonical text.
  const ayahIdByKey = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("quran_ayat")
      .select("id, surah, ayah")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`loading ayat: ${error.message}`);
    if (!data?.length) break;
    data.forEach((a) => ayahIdByKey.set(`${a.surah}:${a.ayah}`, a.id));
    if (data.length < 1000) break;
  }
  if (ayahIdByKey.size !== 6236) {
    throw new Error(
      `expected 6236 ayat already imported, found ${ayahIdByKey.size} — run import-quran.mjs first`
    );
  }

  console.log("Fetching word-by-word data from api.quran.com (114 surahs) ...");
  const byVerse = await fetchAllWords();
  if (byVerse.size !== 6236) {
    throw new Error(`expected words for 6236 verses, got ${byVerse.size}`);
  }

  const rows = [];
  const tajweedRows = [];
  for (const [verseKey, v] of byVerse) {
    const ayah_id = ayahIdByKey.get(verseKey);
    if (!ayah_id) throw new Error(`words for unknown verse ${verseKey}`);
    if (!v.words.length) throw new Error(`no words for verse ${verseKey}`);
    if (!v.tajweed) throw new Error(`no tajweed markup for verse ${verseKey}`);
    for (const w of v.words) {
      rows.push({
        ayah_id,
        source_id: SOURCE.id,
        position: w.position,
        text_uthmani: w.text_uthmani,
        translation: w.translation,
      });
    }
    tajweedRows.push({
      ayah_id,
      source_id: TAJWEED_SOURCE.id,
      markup: v.tajweed,
    });
  }

  // Checksums of the exact normalised datasets being imported.
  const checksum = createHash("sha256")
    .update(
      rows
        .map((r) => `${r.ayah_id}|${r.position}|${r.text_uthmani}|${r.translation}`)
        .join("\n")
    )
    .digest("hex");
  const tajweedChecksum = createHash("sha256")
    .update(tajweedRows.map((r) => `${r.ayah_id}|${r.markup}`).join("\n"))
    .digest("hex");

  console.log(`Upserting sources + ${rows.length} words + ${tajweedRows.length} tajweed rows ...`);
  const now = new Date().toISOString();
  const { error: srcErr } = await db.from("quran_sources").upsert(
    [
      { ...SOURCE, checksum, imported_at: now },
      { ...TAJWEED_SOURCE, checksum: tajweedChecksum, imported_at: now },
    ],
    { onConflict: "id" }
  );
  if (srcErr) throw new Error(`source upsert: ${srcErr.message}`);

  for (let i = 0; i < rows.length; i += 1000) {
    const batch = rows.slice(i, i + 1000);
    const { error } = await db
      .from("quran_words")
      .upsert(batch, { onConflict: "ayah_id,source_id,position" });
    if (error) throw new Error(`words upsert (rows ${i}..): ${error.message}`);
  }
  for (let i = 0; i < tajweedRows.length; i += 1000) {
    const batch = tajweedRows.slice(i, i + 1000);
    const { error } = await db
      .from("quran_tajweed")
      .upsert(batch, { onConflict: "ayah_id,source_id" });
    if (error) throw new Error(`tajweed upsert (rows ${i}..): ${error.message}`);
  }

  const [words, tajweed] = await Promise.all(
    [
      ["quran_words", SOURCE.id],
      ["quran_tajweed", TAJWEED_SOURCE.id],
    ].map(async ([table, src]) => {
      const { count, error } = await db
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("source_id", src);
      if (error) throw new Error(`count ${table}: ${error.message}`);
      return count ?? 0;
    })
  );
  console.log(`words in database: ${words}, tajweed rows: ${tajweed}`);
  if (words < rows.length || tajweed !== 6236) {
    throw new Error("post-import verification failed");
  }
  console.log(`sha256 words:   ${checksum}`);
  console.log(`sha256 tajweed: ${tajweedChecksum}`);
  console.log("Word-by-word + tajweed import complete, alhamdulillah.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
