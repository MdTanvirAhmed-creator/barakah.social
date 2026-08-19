-- Al-Hikmah Stage 1.1 — word-by-word translation + tajweed annotation.
--
-- quran_words: one row per Qur'anic word — its Uthmani form and English
-- gloss, keyed to the ayah it belongs to.
-- quran_tajweed: per-ayah recitation-rule markup (<tajweed class=rule>
-- spans), rendered through a strict allowlisting parser in QuranText.
--
-- Same contract as the rest of the reference core (migration 23):
-- provenance via quran_sources, readable by everyone, writable by nobody
-- but the service-role import pipeline.

CREATE TABLE quran_words (
  ayah_id       integer NOT NULL REFERENCES quran_ayat(id) ON DELETE CASCADE,
  source_id     text NOT NULL REFERENCES quran_sources(id),
  position      smallint NOT NULL CHECK (position > 0),
  text_uthmani  text NOT NULL,
  translation   text NOT NULL,
  PRIMARY KEY (ayah_id, source_id, position)
);

CREATE TABLE quran_tajweed (
  ayah_id   integer NOT NULL REFERENCES quran_ayat(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES quran_sources(id),
  markup    text NOT NULL,
  PRIMARY KEY (ayah_id, source_id)
);

ALTER TABLE quran_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_tajweed ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT ON quran_words, quran_tajweed TO anon, authenticated;
GRANT ALL ON quran_words, quran_tajweed TO service_role;

CREATE POLICY "scripture is open" ON quran_words FOR SELECT USING (true);
CREATE POLICY "scripture is open" ON quran_tajweed FOR SELECT USING (true);
-- No write policies: service-role import pipeline only.
