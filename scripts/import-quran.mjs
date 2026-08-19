#!/usr/bin/env node
/**
 * Al-Hikmah Stage 1 — the Qur'an import pipeline.
 *
 * Downloads the Tanzil Uthmani text (the checksummed, scholar-verified
 * standard), the Tanzil surah metadata, and the Saheeh International
 * translation; verifies shape (114 surahs / 6236 ayat); and upserts them
 * into the read-only reference tables from migration 23, recording each
 * file's sha256 + license verbatim in quran_sources.
 *
 * The reference tables have NO client write policies — this script runs as
 * service_role and is the only way scripture enters the database.
 *
 * Usage:
 *   node scripts/import-quran.mjs --local          # local supabase stack
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-quran.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const SOURCES = {
  arabic: {
    id: "tanzil-uthmani-1.1",
    kind: "arabic_text",
    name: "Tanzil Qur'an Text (Uthmani), v1.1",
    language: "ar",
    translator: null,
    license:
      "Creative Commons Attribution 3.0. Verbatim copies only — changing the text is not allowed. " +
      "Source (Tanzil Project) must be clearly indicated with a link to tanzil.net.",
    source_url:
      "https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true",
  },
  metadata: {
    id: "tanzil-metadata-1.0",
    kind: "metadata",
    name: "Tanzil Qur'an Metadata, v1.0",
    language: null,
    translator: null,
    license: "Creative Commons Attribution (cc-by), (C) 2008-2009 Tanzil.info",
    source_url: "https://tanzil.net/res/text/metadata/quran-data.xml",
  },
  translation: {
    id: "en-sahih-intl",
    kind: "translation",
    name: "Saheeh International (English)",
    language: "en",
    translator: "Saheeh International",
    license:
      "Distributed via Tanzil.net translations collection with attribution; text unmodified.",
    source_url: "https://tanzil.net/trans/en.sahih",
  },
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
    console.error(
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or pass --local."
    );
    process.exit(1);
  }
  return { url, key, label: new URL(url).hostname };
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  const body = await res.text();
  const checksum = createHash("sha256").update(body).digest("hex");
  return { body, checksum };
}

/** Tanzil txt format: `surah|ayah|text`, with a # comment trailer. */
function parsePipeText(body, label) {
  const rows = [];
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const first = t.indexOf("|");
    const second = t.indexOf("|", first + 1);
    if (first === -1 || second === -1) continue;
    const surah = Number(t.slice(0, first));
    const ayah = Number(t.slice(first + 1, second));
    const text = t.slice(second + 1);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || !text) continue;
    rows.push({ surah, ayah, text });
  }
  if (rows.length !== 6236) {
    throw new Error(`${label}: expected 6236 ayat, parsed ${rows.length}`);
  }
  return rows;
}

function parseSurahMetadata(xml) {
  const surahs = [];
  const re =
    /<sura index="(\d+)" ayas="(\d+)"[^>]*? name="([^"]+)" tname="([^"]+)" ename="([^"]+)" type="([^"]+)" order="(\d+)"/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    surahs.push({
      number: Number(m[1]),
      ayah_count: Number(m[2]),
      name_arabic: m[3],
      name_transliterated: m[4],
      name_english: m[5],
      revelation_place: m[6] === "Meccan" ? "makkah" : "madinah",
      // Order of revelation, distinct from position in the mushaf.
      revelation_order: Number(m[7]),
    });
  }
  if (surahs.length !== 114) {
    throw new Error(`metadata: expected 114 surahs, parsed ${surahs.length}`);
  }
  return surahs;
}

async function upsertBatches(db, table, rows, onConflict, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} upsert (rows ${i}..): ${error.message}`);
  }
}

async function main() {
  const target = resolveTarget();
  console.log(`Importing Qur'an reference data into: ${target.label}`);
  const db = createClient(target.url, target.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Downloading from tanzil.net ...");
  const [arabic, metadata, translation] = await Promise.all([
    download(SOURCES.arabic.source_url),
    download(SOURCES.metadata.source_url),
    download(SOURCES.translation.source_url),
  ]);

  const surahs = parseSurahMetadata(metadata.body);
  const ayat = parsePipeText(arabic.body, "uthmani");
  const trans = parsePipeText(translation.body, "en.sahih");

  // Global ayah id = position in canonical order (Tanzil files are ordered).
  const ayahRows = ayat.map((a, i) => ({
    id: i + 1,
    surah: a.surah,
    ayah: a.ayah,
    text_uthmani: a.text,
    source_id: SOURCES.arabic.id,
  }));
  const idByKey = new Map(ayahRows.map((a) => [`${a.surah}:${a.ayah}`, a.id]));
  const transRows = trans.map((t) => {
    const ayah_id = idByKey.get(`${t.surah}:${t.ayah}`);
    if (!ayah_id) throw new Error(`translation for unknown ayah ${t.surah}:${t.ayah}`);
    return { ayah_id, source_id: SOURCES.translation.id, text: t.text };
  });

  // Cross-check ayah counts per surah against the metadata.
  for (const s of surahs) {
    const count = ayahRows.filter((a) => a.surah === s.number).length;
    if (count !== s.ayah_count) {
      throw new Error(
        `surah ${s.number}: metadata says ${s.ayah_count} ayat, text has ${count}`
      );
    }
  }

  const now = new Date().toISOString();
  const sourceRows = [
    { ...SOURCES.arabic, checksum: arabic.checksum, imported_at: now },
    { ...SOURCES.metadata, checksum: metadata.checksum, imported_at: now },
    { ...SOURCES.translation, checksum: translation.checksum, imported_at: now },
  ];

  console.log("Upserting sources, surahs, ayat, translations ...");
  await upsertBatches(db, "quran_sources", sourceRows, "id");
  await upsertBatches(db, "quran_surahs", surahs, "number");
  await upsertBatches(db, "quran_ayat", ayahRows, "id");
  await upsertBatches(db, "quran_translations", transRows, "ayah_id,source_id");

  // Verify what actually landed.
  const [nSurahs, nAyat, nTrans] = await Promise.all(
    ["quran_surahs", "quran_ayat", "quran_translations"].map(async (t) => {
      const { count, error } = await db
        .from(t)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`count ${t}: ${error.message}`);
      return count;
    })
  );
  console.log(`surahs: ${nSurahs}, ayat: ${nAyat}, translations: ${nTrans}`);
  if (nSurahs !== 114 || nAyat < 6236 || nTrans < 6236) {
    throw new Error("post-import verification failed");
  }
  console.log(`sha256 uthmani:     ${arabic.checksum}`);
  console.log(`sha256 metadata:    ${metadata.checksum}`);
  console.log(`sha256 translation: ${translation.checksum}`);
  console.log("Import complete, alhamdulillah.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
