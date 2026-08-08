-- Al-Hikmah Stage 1 — the Qur'an reference core.
--
-- Purpose-built, read-only reference tables. Design rules:
--
--   - PROVENANCE IS FIRST-CLASS: every text row points at a quran_sources
--     row naming the edition, license, source URL and the sha256 of the
--     exact file imported. A reference hub must show its receipts.
--   - WORLD-READABLE BY DESIGN: this is the first deliberately public data
--     in the schema — it is scripture, not user data. SELECT is granted to
--     anon + authenticated.
--   - WRITES ARE SERVICE-ONLY: no INSERT/UPDATE/DELETE policies exist at
--     all. Content arrives exclusively through the checksummed import
--     pipeline (scripts/import-quran.mjs) running as service_role.
--   - This does NOT build on the mock-era imported_content/publisher
--     pipeline — different purpose, different guarantees.

CREATE TABLE quran_sources (
  id          text PRIMARY KEY,          -- e.g. 'tanzil-uthmani'
  kind        text NOT NULL CHECK (kind IN ('arabic_text', 'translation', 'metadata')),
  name        text NOT NULL,             -- 'Tanzil Qur'an Text (Uthmani)'
  language    text,                      -- BCP-47, e.g. 'ar', 'en'
  translator  text,
  license     text NOT NULL,             -- the license terms, verbatim or summarised
  source_url  text NOT NULL,
  checksum    text,                      -- sha256 of the imported file
  imported_at timestamptz
);

CREATE TABLE quran_surahs (
  number              smallint PRIMARY KEY CHECK (number BETWEEN 1 AND 114),
  name_arabic         text NOT NULL,
  name_transliterated text NOT NULL,
  name_english        text NOT NULL,
  revelation_place    text NOT NULL CHECK (revelation_place IN ('makkah', 'madinah')),
  ayah_count          smallint NOT NULL CHECK (ayah_count > 0)
);

CREATE TABLE quran_ayat (
  id           integer PRIMARY KEY,      -- global ayah number, 1..6236
  surah        smallint NOT NULL REFERENCES quran_surahs(number),
  ayah         smallint NOT NULL CHECK (ayah > 0),
  text_uthmani text NOT NULL,
  source_id    text NOT NULL REFERENCES quran_sources(id),
  UNIQUE (surah, ayah)
);

CREATE INDEX quran_ayat_surah_idx ON quran_ayat (surah, ayah);

CREATE TABLE quran_translations (
  ayah_id   integer NOT NULL REFERENCES quran_ayat(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES quran_sources(id),
  text      text NOT NULL,
  PRIMARY KEY (ayah_id, source_id)
);

ALTER TABLE quran_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayat ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_translations ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT ON quran_sources, quran_surahs, quran_ayat, quran_translations
  TO anon, authenticated;
GRANT ALL ON quran_sources, quran_surahs, quran_ayat, quran_translations
  TO service_role;

CREATE POLICY "scripture is open" ON quran_sources FOR SELECT USING (true);
CREATE POLICY "scripture is open" ON quran_surahs FOR SELECT USING (true);
CREATE POLICY "scripture is open" ON quran_ayat FOR SELECT USING (true);
CREATE POLICY "scripture is open" ON quran_translations FOR SELECT USING (true);
-- No write policies: mutation is possible only via service_role (bypasses
-- RLS), i.e. the import pipeline. The text cannot be edited from the app.
