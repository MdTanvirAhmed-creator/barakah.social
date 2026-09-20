-- Al-Hikmah Stage 2 — hadith.
--
-- Stage 2 was planned as the six books. It is not, and the reason is worth
-- recording rather than quietly working around.
--
-- Every convenient machine-readable hadith corpus fails the sourcing rules
-- agreed for this project. OpenITI has real academic provenance but is
-- CC BY-NC-SA, so NonCommercial and ShareAlike would both bind this platform
-- for years. The LK corpus states no licence and does not say where its text
-- came from. The popular Hugging Face and Kaggle sets are scrapes of other
-- sites wearing CC0 labels their publishers had no standing to apply, and
-- their English is near-certainly the copyrighted Darussalam translation.
--
-- So this begins with one collection whose provenance is simple and
-- defensible: al-Arba'un al-Nawawiyya. Forty-two hadith, an eighth-century
-- Hijri compilation long in the public domain, where each hadith already
-- carries its own takhrij naming who narrated it and — for the Tirmidhi
-- ones — his own grading in his own words. The structure below holds more
-- collections the day a clean source exists for them.

-- The ledger. Nothing enters the tables below without a row here saying what
-- it is, who may use it and on what terms, where it came from, and the
-- checksum of exactly what was fetched.
CREATE TABLE hadith_sources (
  id           text PRIMARY KEY,
  kind         text NOT NULL CHECK (kind IN ('arabic_text', 'translation', 'metadata')),
  name         text NOT NULL,
  language     text,
  translator   text,
  -- The licence verbatim, not a summary. A paraphrase is where obligations
  -- get lost.
  license      text NOT NULL,
  source_url   text NOT NULL,
  checksum     text,
  retrieved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hadith_collections (
  id                   text PRIMARY KEY,
  name_arabic          text NOT NULL,
  name_transliterated  text NOT NULL,
  name_english         text NOT NULL,
  compiler_arabic      text,
  compiler_english     text,
  -- Year of the compiler's death in the Hijri calendar, which is how the
  -- tradition dates its own scholars.
  compiler_died_ah     smallint,
  hadith_count         smallint NOT NULL,
  source_id            text NOT NULL REFERENCES hadith_sources(id)
);

CREATE TABLE hadith (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  collection_id   text NOT NULL REFERENCES hadith_collections(id),
  number          smallint NOT NULL,
  -- The matn as transmitted, including the narrator's opening. Stored
  -- verbatim; nothing is normalised, corrected or abridged.
  text_arabic     text NOT NULL,
  -- The takhrij in the collection's own words — "رواه البخاري ومسلم", or
  -- al-Tirmidhi's own "حديث حسن صحيح". This is why the platform never needs
  -- to grade anything itself: the attribution and the grading are part of
  -- the text, and they name the person making the judgement.
  takhrij_arabic  text,
  source_id       text NOT NULL REFERENCES hadith_sources(id),
  UNIQUE (collection_id, number)
);

CREATE INDEX hadith_collection_number_idx ON hadith (collection_id, number);

-- Deliberately empty for now. English translations of these collections are
-- almost all in copyright, and an honestly empty slot is better than a
-- translation nobody has the right to publish.
CREATE TABLE hadith_translations (
  hadith_id  bigint NOT NULL REFERENCES hadith(id) ON DELETE CASCADE,
  source_id  text   NOT NULL REFERENCES hadith_sources(id),
  text       text   NOT NULL,
  PRIMARY KEY (hadith_id, source_id)
);

ALTER TABLE hadith_sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_collections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith              ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_translations ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants in this project; forgetting that kept the
-- whole role system inert for thirteen migrations.
GRANT SELECT ON hadith_sources, hadith_collections, hadith, hadith_translations
  TO anon, authenticated;
GRANT ALL ON hadith_sources, hadith_collections, hadith, hadith_translations
  TO service_role;

-- Reference material is for everyone, signed in or not — the same decision
-- taken for the Qur'an in Stage 1. This is the deliberate exception to the
-- members-only rule that governs everything people themselves write.
CREATE POLICY "hadith sources are public"     ON hadith_sources      FOR SELECT USING (true);
CREATE POLICY "hadith collections are public" ON hadith_collections  FOR SELECT USING (true);
CREATE POLICY "hadith is public"              ON hadith              FOR SELECT USING (true);
CREATE POLICY "hadith translations are public" ON hadith_translations FOR SELECT USING (true);

-- No INSERT, UPDATE or DELETE policy exists for any client role, which is
-- stronger than one that refuses: there is nothing to evaluate. Text enters
-- only through scripts/import-hadith.mjs running as service_role.

COMMENT ON TABLE hadith IS
  'Hadith matn as transmitted. Never edited in place — a correction means a '
  're-import from a source whose checksum changed, so the ledger shows what '
  'was fetched and when.';
COMMENT ON COLUMN hadith.takhrij_arabic IS
  'The attribution in the collection''s own words, naming who narrated it and '
  'who graded it. The platform never grades a hadith itself.';
