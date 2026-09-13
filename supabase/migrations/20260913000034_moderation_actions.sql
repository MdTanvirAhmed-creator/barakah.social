-- Letting moderators actually moderate.
--
-- Until now the only UPDATE policy on posts was "author_id = auth.uid()", so
-- a moderator could read a reported post and write a resolution note while
-- the post stayed up. Resolving a report changed the report row and nothing
-- else. Five people were appointed to a job the database would not let them
-- do.
--
-- Hiding, not deleting. The words are not destroyed: the author keeps them,
-- an admin can reverse it, and who hid it and why are on the record. A
-- platform built on adab should be able to say what it did and why, and be
-- answerable for it afterwards.

ALTER TABLE posts
  ADD COLUMN hidden_at     timestamptz,
  ADD COLUMN hidden_by     uuid REFERENCES profiles(id),
  ADD COLUMN hidden_reason text;

COMMENT ON COLUMN posts.hidden_at IS
  'Set when a moderator hides a post. Distinct from is_deleted, which is the '
  'author removing their own words — the two must stay distinguishable.';

CREATE INDEX posts_hidden_at_idx ON posts (hidden_at) WHERE hidden_at IS NOT NULL;

-- Hidden posts leave the feed for everyone except the author, who must not be
-- left guessing why their words vanished, and moderators, who need to see
-- what they have done. This replaces the policy from migration 29 — same
-- rules, plus the hiding.
DROP POLICY IF EXISTS "read posts by visibility" ON posts;

CREATE POLICY "read posts by visibility" ON posts
FOR SELECT USING (
  author_id = (SELECT auth.uid())
  OR (
    (SELECT auth.uid()) IS NOT NULL
    AND deleted_at IS NULL
    AND is_deleted = false
    AND NOT is_blocked((SELECT auth.uid()), author_id)
    AND (
      hidden_at IS NULL
      OR has_role((SELECT auth.uid()), 'moderator')
      OR has_role((SELECT auth.uid()), 'admin')
    )
    AND (
      visibility = 'public'
      OR (visibility = 'companions' AND are_companions((SELECT auth.uid()), author_id))
      OR (visibility = 'halaqa' AND is_halaqa_member((SELECT auth.uid()), halaqa_id))
    )
  )
);

-- A moderator may hide what every member can already see, and nothing more.
-- The proactive queue therefore extends no new sight into anyone's private
-- conversation: it is a working surface for content that is already open.
CREATE POLICY "moderators hide public posts" ON posts
FOR UPDATE USING (
  visibility = 'public'
  AND (
    has_role((SELECT auth.uid()), 'moderator')
    OR has_role((SELECT auth.uid()), 'admin')
  )
)
WITH CHECK (
  visibility = 'public'
  AND (
    has_role((SELECT auth.uid()), 'moderator')
    OR has_role((SELECT auth.uid()), 'admin')
  )
);

-- A policy cannot express "only these columns", so a trigger does. A
-- moderator hides words; they never edit them, never move them to another
-- audience, and never reassign them to someone else.
CREATE OR REPLACE FUNCTION restrict_moderator_post_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_author    boolean := OLD.author_id = auth.uid();
  is_moderator boolean := has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'admin');
  is_admin     boolean := has_role(auth.uid(), 'admin');
BEGIN
  -- Not client traffic: migrations, service_role tooling and the author's own
  -- edits are governed by the ordinary policies.
  IF session_user <> 'authenticator'
     OR coalesce(
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
          ''
        ) = 'service_role'
     OR is_author
  THEN
    RETURN NEW;
  END IF;

  IF is_moderator THEN
    IF NEW.content     IS DISTINCT FROM OLD.content
       OR NEW.author_id  IS DISTINCT FROM OLD.author_id
       OR NEW.visibility IS DISTINCT FROM OLD.visibility
       OR NEW.media_urls IS DISTINCT FROM OLD.media_urls
       OR NEW.tags       IS DISTINCT FROM OLD.tags
    THEN
      RAISE EXCEPTION 'A moderator may hide a post, not rewrite it.'
        USING ERRCODE = '42501';
    END IF;

    -- Reversing a hiding is an admin's decision. A moderator who could undo
    -- their own action could act and erase the trace of it, which is exactly
    -- what the record exists to prevent.
    IF OLD.hidden_at IS NOT NULL AND NEW.hidden_at IS NULL AND NOT is_admin THEN
      RAISE EXCEPTION 'Only an administrator can restore a hidden post.'
        USING ERRCODE = '42501';
    END IF;

    -- The record is written by the database, not offered by the client.
    IF NEW.hidden_at IS DISTINCT FROM OLD.hidden_at AND NEW.hidden_at IS NOT NULL THEN
      NEW.hidden_by := auth.uid();
      NEW.hidden_at := now();
      IF coalesce(btrim(NEW.hidden_reason), '') = '' THEN
        RAISE EXCEPTION 'Say why the post is being hidden.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_moderator_post_edits ON posts;
CREATE TRIGGER restrict_moderator_post_edits
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION restrict_moderator_post_edits();

-- What the queue reads: public posts nobody has looked at yet, oldest first,
-- so nothing sits unseen while newer things are reviewed. Hidden posts and
-- the reviewer's own are excluded.
CREATE TABLE post_reviews (
  post_id     uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  reviewed_by uuid NOT NULL REFERENCES profiles(id),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  note        text
);

ALTER TABLE post_reviews ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants in this project; that omission kept the whole
-- role system inert for thirteen migrations.
GRANT SELECT, INSERT, DELETE ON post_reviews TO authenticated;
GRANT ALL ON post_reviews TO service_role;

CREATE POLICY "moderators see reviews" ON post_reviews
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'moderator') OR has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "moderators record reviews" ON post_reviews
FOR INSERT WITH CHECK (
  reviewed_by = (SELECT auth.uid())
  AND (has_role((SELECT auth.uid()), 'moderator') OR has_role((SELECT auth.uid()), 'admin'))
);

COMMENT ON TABLE post_reviews IS
  'A post a moderator has looked at and let stand. Exists so the queue '
  'empties and two people do not review the same thing. Deliberately not a '
  'tally: nobody is scored on how many they clear.';
