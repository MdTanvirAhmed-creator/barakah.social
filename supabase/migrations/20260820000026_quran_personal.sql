-- Al-Hikmah — a reader's own marks on the Qur'an.
--
-- Four small tables, all strictly PRIVATE TO THEIR OWNER. Unlike the
-- reference core (which is world-readable scripture), this is personal
-- practice: where someone has reached, what they have chosen to memorise,
-- what they wanted to come back to, and their own written reflections.
--
-- Deliberately absent, and to stay absent: any notion of a public count, a
-- streak, a rank, or one reader being able to see another's progress.
-- Memorisation is between a person and their Lord; the platform's job is to
-- remember the position, not to score it.

-- ---------------------------------------------------------------------------
-- Where you had reached. One row per reader — "continue from yesterday".
-- ---------------------------------------------------------------------------
CREATE TABLE user_reading_position (
  user_id    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ayah_id    integer NOT NULL REFERENCES quran_ayat(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Ayat marked to return to.
-- ---------------------------------------------------------------------------
CREATE TABLE user_ayah_bookmarks (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ayah_id    integer NOT NULL REFERENCES quran_ayat(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ayah_id)
);

-- ---------------------------------------------------------------------------
-- Personal reflections. Private by construction: there is no policy under
-- which another member — moderator or admin — can read these.
-- ---------------------------------------------------------------------------
CREATE TABLE user_ayah_notes (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ayah_id    integer NOT NULL REFERENCES quran_ayat(id),
  text       text NOT NULL CHECK (length(btrim(text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ayah_id)
);

-- ---------------------------------------------------------------------------
-- Self-marked memorisation. 'learning' and 'memorised' only — the reader
-- says so, nothing is inferred or tested against them.
-- ---------------------------------------------------------------------------
CREATE TABLE user_memorization (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ayah_id    integer NOT NULL REFERENCES quran_ayat(id),
  state      text NOT NULL CHECK (state IN ('learning', 'memorised')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ayah_id)
);

CREATE INDEX user_memorization_state_idx ON user_memorization (user_id, state);

ALTER TABLE user_reading_position ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ayah_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ayah_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memorization ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON user_reading_position, user_ayah_bookmarks, user_ayah_notes, user_memorization
  TO authenticated;
GRANT ALL
  ON user_reading_position, user_ayah_bookmarks, user_ayah_notes, user_memorization
  TO service_role;

-- One shape, four tables: you may see and change your own rows, and no one
-- else's — including rows you try to write in someone else's name.
CREATE POLICY "own reading position" ON user_reading_position
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "own bookmarks" ON user_ayah_bookmarks
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "own notes" ON user_ayah_notes
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "own memorisation" ON user_memorization
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));
