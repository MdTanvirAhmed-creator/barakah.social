-- The minbar — what "public" means, and when it may change.
--
-- Posts have always carried a visibility of public/companions/halaqa/private,
-- but only 'companions' was ever reachable: nothing in the product could set
-- anything else. Opening the minbar makes 'public' reachable for the first
-- time, which means the read policy is about to start mattering.
--
-- Two things have to be settled before that happens.

-- 1. Public means everyone signed in to Barakah, not the open internet.
--
-- The existing policy allowed visibility = 'public' with no session at all,
-- and posts' SELECT policy is granted to the anonymous role — so a logged-out
-- stranger, or a search-engine crawler, could have read any public post. No
-- post has ever been public, so nothing has leaked; the door was simply
-- unlocked before anyone could reach it.
--
-- Requiring a session is the reversible direction. Opening this to the web
-- later remains possible; taking it back does not, because an indexed and
-- archived page does not return when the row is deleted. People write
-- differently when their words can be searched by name, and that expectation
-- gap is where real harm happens.
DROP POLICY IF EXISTS "read posts by visibility" ON posts;

CREATE POLICY "read posts by visibility" ON posts
FOR SELECT USING (
  author_id = (SELECT auth.uid())
  OR (
    -- No session, no reading. This is the whole of the change above.
    (SELECT auth.uid()) IS NOT NULL
    AND deleted_at IS NULL
    AND is_deleted = false
    AND NOT is_blocked((SELECT auth.uid()), author_id)
    AND (
      visibility = 'public'
      OR (visibility = 'companions' AND are_companions((SELECT auth.uid()), author_id))
      OR (visibility = 'halaqa' AND is_halaqa_member((SELECT auth.uid()), halaqa_id))
    )
  )
);

-- 2. Visibility may be narrowed, but not widened over people's replies.
--
-- Comments follow the post's visibility (migration 22), so widening a post
-- also widens every reply beneath it. Someone who answered a companions-only
-- post wrote to a small room; moving that post to the minbar would carry
-- their words there too, without their knowing. Narrowing is always allowed —
-- taking your own words back to a smaller room harms nobody.
CREATE OR REPLACE FUNCTION visibility_rank(v text)
RETURNS smallint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE v
    WHEN 'private'    THEN 0
    WHEN 'halaqa'     THEN 1
    WHEN 'companions' THEN 2
    WHEN 'public'     THEN 3
    ELSE 0
  END::smallint;
$$;

CREATE OR REPLACE FUNCTION protect_replies_from_widening()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility IS DISTINCT FROM OLD.visibility
     AND visibility_rank(NEW.visibility) > visibility_rank(OLD.visibility)
     AND EXISTS (
       SELECT 1 FROM comments c
        WHERE c.post_id = OLD.id
          AND c.is_deleted = false
     )
  THEN
    RAISE EXCEPTION
      'This post already has replies written when it was %. Widening it to % '
      'would carry those replies to a wider audience than the people who '
      'wrote them agreed to.', OLD.visibility, NEW.visibility
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_replies_from_widening ON posts;
CREATE TRIGGER protect_replies_from_widening
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION protect_replies_from_widening();
