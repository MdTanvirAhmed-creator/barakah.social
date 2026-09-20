#!/usr/bin/env node
/**
 * Al-Hikmah Stage 2 — the hadith import pipeline.
 *
 * Imports al-Arba'un al-Nawawiyya (42 hadith) from Arabic Wikisource, which
 * is a transcription of a public-domain eighth-century-Hijri compilation.
 *
 * Why this source and not a hadith API: every convenient machine-readable
 * corpus fails the sourcing rules for this project. OpenITI is CC BY-NC-SA;
 * the LK corpus states no licence and no origin; the popular Hugging Face and
 * Kaggle sets are scrapes wearing CC0 labels their publishers had no standing
 * to apply. Wikisource is a named, versioned transcription with a stable URL
 * and a stated licence, of a text nobody holds rights in.
 *
 * What is imported and what is not:
 *   - matn and takhrij: imported verbatim
 *   - the "شرح وفوائد الحديث" commentary sections: NOT imported. That is
 *     modern writing by Wikisource contributors, not part of the classical
 *     collection, and this platform does not publish commentary whose author
 *     it cannot name.
 *
 * Usage:
 *   node scripts/import-hadith.mjs --local
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-hadith.mjs
 *   node scripts/import-hadith.mjs --dry-run    # parse and report, write nothing
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const DRY = process.argv.includes("--dry-run");

const PAGE = "الأربعون النووية";
const API =
  "https://ar.wikisource.org/w/api.php?action=parse&prop=wikitext&format=json&formatversion=2&page=" +
  encodeURIComponent(PAGE);

const SOURCE = {
  id: "ar-wikisource-nawawi40",
  kind: "arabic_text",
  name: "al-Arba'un al-Nawawiyya (Arabic Wikisource transcription)",
  language: "ar",
  translator: null,
  license:
    "The compilation by Yahya ibn Sharaf al-Nawawi (d. 676 AH / 1277 CE) is in the public " +
    "domain by age. This transcription is taken from Arabic Wikisource, whose contributed " +
    "text is licensed CC BY-SA 4.0; only the public-domain matn and its takhrij are used, " +
    "and no Wikisource-contributed commentary is reproduced.",
  source_url: "https://ar.wikisource.org/wiki/" + encodeURIComponent(PAGE),
};

const COLLECTION = {
  id: "nawawi40",
  name_arabic: "الأربعون النووية",
  name_transliterated: "al-Arba'un al-Nawawiyya",
  name_english: "The Forty Hadith of al-Nawawi",
  compiler_arabic: "يحيى بن شرف النووي",
  compiler_english: "Yahya ibn Sharaf al-Nawawi",
  compiler_died_ah: 676,
  source_id: SOURCE.id,
};

/** The collection is called "the Forty" and contains forty-two. */
const EXPECTED = 42;

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

async function fetchWikitext() {
  const res = await fetch(API, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} fetching Wikisource`);
  const body = await res.json();
  const wikitext = body?.parse?.wikitext;
  if (typeof wikitext !== "string" || wikitext.length < 1000) {
    throw new Error("Wikisource returned no usable wikitext");
  }
  return {
    wikitext,
    checksum: createHash("sha256").update(wikitext).digest("hex"),
  };
}

/**
 * Strips wiki markup while keeping every Arabic character of the text
 * itself. Nothing here rewrites words: it removes links, templates and
 * references, and leaves what they wrapped.
 */
function stripMarkup(s) {
  return (
    s
      // [[target|shown]] -> shown ; [[target]] -> target
      .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
      .replace(/\[\[([^\]]*)\]\]/g, "$1")
      // <ref>...</ref> and friends
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
      .replace(/<ref[^>]*\/>/gi, "")
      .replace(/<[^>]+>/g, "")
      // {{صل}} is the honorific template; \u{FDFA} is its single-character form.
      .replace(/\{\{\s*صل\s*\}\}/g, "\u{FDFA}")
      // Any remaining template: drop it rather than guess what it rendered as.
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/'{2,}/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * The takhrij names who narrated the hadith, and sometimes who graded it and
 * in what words. It is the reason this platform never has to grade anything
 * itself.
 *
 * It is COPIED OUT, not cut out. In several hadith the attribution sits in
 * the middle with a variant narration after it — hadith 5 ends with Muslim's
 * wording following "(رواه البخاري ومسلم)" — so removing it would mangle the
 * matn. The stored text stays whole and this is a convenience extract for
 * display.
 *
 * Three verbs of attribution appear in this collection: رواه, رويناه (hadith
 * 27 and 41) and أخرجه. Matching only the first missed four of the forty-two.
 */
const ATTRIBUTION = /\(([^()]*(?:رواه|رويناه|أخرجه)[^()]*)\)/g;

function extractTakhrij(text) {
  const matches = [...text.matchAll(ATTRIBUTION)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1].trim();
}

function parse(wikitext) {
  // Each hadith is a "=== الحديث ... ===" section. Commentary lives in a
  // deeper "====شرح..." heading inside it and is cut away.
  const parts = wikitext.split(/\n=== *الحديث[^=\n]*? *===\n/);
  const bodies = parts.slice(1);
  const hadiths = [];

  bodies.forEach((body, i) => {
    const beforeCommentary = body.split(/\n=+\s*شرح/)[0];
    const matn = stripMarkup(beforeCommentary);
    if (matn.length < 20) {
      throw new Error(`hadith ${i + 1}: parsed matn is implausibly short`);
    }
    hadiths.push({
      number: i + 1,
      text_arabic: matn,
      takhrij_arabic: extractTakhrij(matn),
    });
  });

  if (hadiths.length !== EXPECTED) {
    throw new Error(`expected ${EXPECTED} hadith, parsed ${hadiths.length}`);
  }
  // Every hadith in this collection carries an attribution. Anything less
  // means the parser has drifted, not that the source is incomplete.
  const withTakhrij = hadiths.filter((h) => h.takhrij_arabic).length;
  if (withTakhrij !== EXPECTED) {
    const missing = hadiths.filter((h) => !h.takhrij_arabic).map((h) => h.number);
    throw new Error(
      `${withTakhrij}/${EXPECTED} hadith carry a takhrij; missing: ${missing.join(", ")}`
    );
  }
  return { hadiths, withTakhrij };
}

async function main() {
  console.log("Fetching al-Arba'un al-Nawawiyya from Arabic Wikisource ...");
  const { wikitext, checksum } = await fetchWikitext();
  console.log(`  ${wikitext.length} bytes, sha256 ${checksum.slice(0, 16)}…`);

  const { hadiths, withTakhrij } = parse(wikitext);
  console.log(`  parsed ${hadiths.length} hadith, ${withTakhrij} with a takhrij`);

  if (DRY) {
    const sample = hadiths[0];
    console.log("\n  --- first hadith as it would be stored ---");
    console.log(`  matn:    ${sample.text_arabic.slice(0, 90)}…`);
    console.log(`  takhrij: ${sample.takhrij_arabic?.slice(0, 90) ?? "(none)"}`);
    console.log("\nDry run: nothing written.");
    return;
  }

  const target = resolveTarget();
  console.log(`Importing into: ${target.label}`);
  const db = createClient(target.url, target.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: sourceError } = await db
    .from("hadith_sources")
    .upsert({ ...SOURCE, checksum, retrieved_at: new Date().toISOString() }, { onConflict: "id" });
  if (sourceError) throw new Error(`hadith_sources: ${sourceError.message}`);

  const { error: collectionError } = await db
    .from("hadith_collections")
    .upsert({ ...COLLECTION, hadith_count: hadiths.length }, { onConflict: "id" });
  if (collectionError) throw new Error(`hadith_collections: ${collectionError.message}`);

  const rows = hadiths.map((h) => ({
    collection_id: COLLECTION.id,
    number: h.number,
    text_arabic: h.text_arabic,
    takhrij_arabic: h.takhrij_arabic,
    source_id: SOURCE.id,
  }));
  const { error: hadithError } = await db
    .from("hadith")
    .upsert(rows, { onConflict: "collection_id,number" });
  if (hadithError) throw new Error(`hadith: ${hadithError.message}`);

  const { count } = await db
    .from("hadith")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", COLLECTION.id);
  console.log(`  ${count} hadith in the database for ${COLLECTION.name_transliterated}`);
  console.log("Import complete, alhamdulillah.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
