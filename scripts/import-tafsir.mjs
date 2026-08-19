#!/usr/bin/env node
/**
 * Al-Hikmah Stage 1.2 — classical Arabic tafsir import.
 *
 * Pulls whole-surah bundles (114 requests per edition, not 6236) from a
 * PINNED commit of the MIT-licensed spa5k/tafsir_api dataset, verifies it
 * covers all 6236 ayat, and records a sha256 of the exact normalised text
 * per edition in quran_sources.
 *
 * Pinned, not @main, deliberately: a reference hub must be able to say
 * which text it imported and prove it has not drifted underneath.
 *
 * Usage:
 *   node scripts/import-tafsir.mjs --local
 *   node scripts/import-tafsir.mjs --local --only ar-tafsir-al-jalalayn
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-tafsir.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

/** Pinned commit of spa5k/tafsir_api (2026-08-02). */
const PIN = "05d5ba765d77c6ca6d43c30f0e1c273deb137454";
const BASE = `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@${PIN}/tafsir`;

const LICENCE =
  "Classical work, public domain by age. Aggregated dataset spa5k/tafsir_api " +
  `(MIT), pinned at commit ${PIN.slice(0, 10)}.`;

const EDITIONS = [
  {
    slug: "ar-tafsir-al-jalalayn",
    id: "ar-tafsir-al-jalalayn",
    name: "Tafsir al-Jalalayn (Arabic)",
    translator: "Jalal ad-Din al-Mahalli and Jalal ad-Din as-Suyuti",
  },
  {
    slug: "ar-tafsir-ibn-kathir",
    id: "ar-tafsir-ibn-kathir",
    name: "Tafsir Ibn Kathir (Arabic)",
    translator: "Isma'il ibn Kathir",
  },
  {
    slug: "ar-tafseer-al-qurtubi",
    id: "ar-tafsir-al-qurtubi",
    name: "Tafsir al-Qurtubi (Arabic)",
    translator: "Muhammad ibn Ahmad al-Qurtubi",
  },
  {
    slug: "ar-tafsir-al-tabari",
    id: "ar-tafsir-al-tabari",
    name: "Tafsir al-Tabari (Arabic)",
    translator: "Muhammad ibn Jarir al-Tabari",
  },
];

/** Verse-by-verse recitation, served by constructed URL (see migration 25). */
const RECITERS = [
  {
    id: "everyayah-alafasy-128",
    name: "Mishary Rashid Alafasy (128kbps)",
    translator: "Mishary Rashid Alafasy",
    url_template: "https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3",
  },
  {
    id: "everyayah-husary-128",
    name: "Mahmoud Khalil al-Husary (128kbps)",
    translator: "Mahmoud Khalil al-Husary",
    url_template: "https://everyayah.com/data/Husary_128kbps/{surah:3}{ayah:3}.mp3",
  },
];

function resolveTarget() {
  if (process.argv.includes("--local")) {
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
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < 4) {
      await sleep(800 * attempt);
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`fetching ${url}: ${err.message}`);
  }
}

/** Fetch all 114 surah bundles for an edition, a few at a time. */
async function fetchEdition(slug) {
  const surahs = Array.from({ length: 114 }, (_, i) => i + 1);
  const byKey = new Map();
  const CONCURRENCY = 8;
  for (let i = 0; i < surahs.length; i += CONCURRENCY) {
    const batch = surahs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((s) => fetchJson(`${BASE}/${slug}/${s}.json`))
    );
    results.forEach((rows) => {
      const list = Array.isArray(rows) ? rows : rows?.ayahs ?? [];
      for (const r of list) {
        const text = (r.text ?? "").trim();
        if (text) byKey.set(`${r.surah}:${r.ayah}`, text);
      }
    });
    process.stdout.write(`\r    surahs ${Math.min(i + CONCURRENCY, 114)}/114`);
  }
  process.stdout.write("\n");
  return byKey;
}

async function main() {
  const target = resolveTarget();
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : null;
  const editions = only ? EDITIONS.filter((e) => e.slug === only || e.id === only) : EDITIONS;
  if (!editions.length) {
    console.error(`No edition matches --only ${only}`);
    process.exit(1);
  }

  console.log(`Importing tafsir into: ${target.label}`);
  const db = createClient(target.url, target.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // verse_key -> our ayah id, from the canonical Tanzil text.
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
      `expected 6236 ayat imported, found ${ayahIdByKey.size} — run import-quran.mjs first`
    );
  }

  // Reciters are pure provenance rows; no media is copied.
  const now = new Date().toISOString();
  const { error: recErr } = await db.from("quran_sources").upsert(
    RECITERS.map((r) => ({
      id: r.id,
      kind: "audio",
      name: r.name,
      language: "ar",
      translator: r.translator,
      license:
        "Verse-by-verse recitation served from everyayah.com, the long-standing " +
        "free distribution used by open Qur'an projects. Audio is linked, never rehosted.",
      source_url: "https://everyayah.com",
      url_template: r.url_template,
      imported_at: now,
    })),
    { onConflict: "id" }
  );
  if (recErr) throw new Error(`reciter upsert: ${recErr.message}`);
  console.log(`Recorded ${RECITERS.length} reciters in the provenance ledger.`);

  for (const ed of editions) {
    console.log(`\n${ed.name}`);
    const byKey = await fetchEdition(ed.slug);
    const covered = [...ayahIdByKey.keys()].filter((k) => byKey.has(k)).length;
    console.log(`    covers ${covered}/6236 ayat`);
    if (covered < 6236) {
      console.warn(`    WARNING: ${6236 - covered} ayat have no passage in this edition`);
    }

    const rows = [];
    for (const [key, id] of ayahIdByKey) {
      const text = byKey.get(key);
      if (text) rows.push({ ayah_id: id, source_id: ed.id, text });
    }

    const checksum = createHash("sha256")
      .update(rows.map((r) => `${r.ayah_id}|${r.text}`).join("\n"))
      .digest("hex");

    const { error: srcErr } = await db.from("quran_sources").upsert(
      [
        {
          id: ed.id,
          kind: "tafsir",
          name: ed.name,
          language: "ar",
          translator: ed.translator,
          license: LICENCE,
          source_url: `https://github.com/spa5k/tafsir_api/tree/${PIN}/tafsir/${ed.slug}`,
          checksum,
          imported_at: now,
        },
      ],
      { onConflict: "id" }
    );
    if (srcErr) throw new Error(`source upsert: ${srcErr.message}`);

    // Chunk by payload size, not row count: al-Qurtubi averages ~46KB per
    // passage, so a fixed 200-row batch would be a 9MB request body.
    const MAX_BYTES = 1_000_000;
    let batch = [];
    let bytes = 0;
    let done = 0;
    const flush = async () => {
      if (!batch.length) return;
      const { error } = await db
        .from("quran_tafsir")
        .upsert(batch, { onConflict: "ayah_id,source_id" });
      if (error) throw new Error(`tafsir upsert (${ed.id} at row ${done}): ${error.message}`);
      done += batch.length;
      process.stdout.write(`\r    stored ${done}/${rows.length}`);
      batch = [];
      bytes = 0;
    };
    for (const row of rows) {
      batch.push(row);
      bytes += row.text.length * 2;
      if (bytes >= MAX_BYTES) await flush();
    }
    await flush();
    process.stdout.write("\n");
    const chars = rows.reduce((n, r) => n + r.text.length, 0);
    console.log(`    ${rows.length} passages, ${(chars / 1_000_000).toFixed(1)}M chars`);
    console.log(`    sha256 ${checksum}`);
  }

  console.log("\nTafsir import complete, alhamdulillah.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
