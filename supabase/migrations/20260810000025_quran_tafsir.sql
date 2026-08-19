-- Al-Hikmah Stage 1.2 — classical tafsir + recitation provenance.
--
-- quran_tafsir holds one commentary passage per (ayah, edition). The
-- editions are classical Arabic works long in the public domain — Jalalayn,
-- Ibn Kathir, al-Qurtubi, al-Tabari — imported from a pinned commit of the
-- MIT-licensed spa5k/tafsir_api dataset and checksummed per edition, so the
-- reader can always show which edition it is quoting and prove the text has
-- not drifted.
--
-- Recitation audio is NOT stored here. Verse-by-verse audio for the whole
-- Qur'an runs to gigabytes per reciter, so it is served from everyayah.com
-- by constructed URL. The reciters are still recorded in quran_sources, so
-- audio carries the same provenance trail as text and the reader can name
-- who is reciting.
--
-- Same contract as the rest of the reference core: world-readable, and no
-- client write policies at all — only the service-role import writes.

ALTER TABLE quran_sources DROP CONSTRAINT IF EXISTS quran_sources_kind_check;
ALTER TABLE quran_sources ADD CONSTRAINT quran_sources_kind_check
  CHECK (kind IN ('arabic_text', 'translation', 'metadata', 'tafsir', 'audio'));

-- The URL template for constructed-media sources (audio), e.g.
-- 'https://everyayah.com/data/Alafasy_128kbps/{surah:3}{ayah:3}.mp3'.
ALTER TABLE quran_sources ADD COLUMN IF NOT EXISTS url_template text;

CREATE TABLE quran_tafsir (
  ayah_id   integer NOT NULL REFERENCES quran_ayat(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES quran_sources(id),
  text      text NOT NULL,
  PRIMARY KEY (ayah_id, source_id)
);

-- Reading a surah pulls one edition across many ayat.
CREATE INDEX quran_tafsir_source_idx ON quran_tafsir (source_id, ayah_id);

ALTER TABLE quran_tafsir ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT ON quran_tafsir TO anon, authenticated;
GRANT ALL ON quran_tafsir TO service_role;

CREATE POLICY "scripture is open" ON quran_tafsir FOR SELECT USING (true);
-- No write policies: service-role import pipeline only.
