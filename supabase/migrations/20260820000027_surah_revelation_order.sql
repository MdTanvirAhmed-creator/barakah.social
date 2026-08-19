-- Al-Hikmah — the order in which a surah was revealed.
--
-- Distinct from its place in the mushaf: Al-Fatihah is 1st in the codex but
-- 5th in revelation. The Tanzil metadata already carries it (`order=` on each
-- <sura>), so this is a column plus a re-run of the existing import — no new
-- source and no new provenance question.
--
-- Nullable until the import backfills it, so the migration is safe to apply
-- ahead of the data.

ALTER TABLE quran_surahs
  ADD COLUMN IF NOT EXISTS revelation_order smallint
  CHECK (revelation_order IS NULL OR revelation_order BETWEEN 1 AND 114);
