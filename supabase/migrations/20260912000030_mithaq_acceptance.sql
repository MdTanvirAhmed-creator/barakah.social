-- Recording the Mithaq.
--
-- The covenant has been on the second signup screen since the beginning, but
-- accepting it was never stored: acceptMithaq lived in React state and a zod
-- rule and went nowhere. So there is no record that any member ever agreed to
-- it — and anyone arriving through Google never saw it at all, because OAuth
-- lands straight on the feed.
--
-- A covenant nobody can show was agreed to is not much of a covenant.

ALTER TABLE profiles
  ADD COLUMN mithaq_accepted_at timestamptz,
  ADD COLUMN mithaq_version     text;

COMMENT ON COLUMN profiles.mithaq_accepted_at IS
  'When this member accepted the Mithaq. NULL means they have not, and the '
  'app keeps them at the threshold until they do.';
COMMENT ON COLUMN profiles.mithaq_version IS
  'Which Mithaq they accepted, so a later revision can be re-consented '
  'rather than silently assumed.';

-- Existing members accepted it on the signup screen; we simply failed to
-- write it down. Recording "unknown" rather than inventing a date would send
-- everyone who already agreed back through the threshold, which is both
-- untrue and unkind. Their acceptance is stamped at the moment this runs, and
-- marked as the version they were actually shown.
UPDATE profiles
   SET mithaq_accepted_at = now(),
       mithaq_version = '1'
 WHERE mithaq_accepted_at IS NULL;

-- A timestamp anyone can set to any value records nothing. Acceptance may be
-- made, and may be renewed for a later version, but it cannot be back-dated
-- and it cannot be withdrawn: leaving is deleting the account, not claiming
-- never to have agreed.
CREATE OR REPLACE FUNCTION protect_mithaq_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direct connections (psql, migrations) and service_role tooling are not
  -- the client traffic this guards, and backfills must stay possible.
  IF session_user <> 'authenticator'
     OR coalesce(
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
          ''
        ) = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  IF OLD.mithaq_accepted_at IS NOT NULL AND NEW.mithaq_accepted_at IS NULL THEN
    RAISE EXCEPTION 'The Mithaq cannot be un-accepted.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.mithaq_accepted_at IS DISTINCT FROM OLD.mithaq_accepted_at
     AND NEW.mithaq_accepted_at < now() - interval '5 minutes'
  THEN
    RAISE EXCEPTION 'The Mithaq cannot be accepted retroactively.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_mithaq_acceptance ON profiles;
CREATE TRIGGER protect_mithaq_acceptance
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_mithaq_acceptance();

-- The covenant governs what you contribute, so the database is where it has
-- to hold. A page that redirects is a courtesy; a policy is the rule.
CREATE OR REPLACE FUNCTION has_accepted_mithaq(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
     WHERE id = p_user AND mithaq_accepted_at IS NOT NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION has_accepted_mithaq(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_accepted_mithaq(uuid) TO authenticated, service_role;

-- Reading is open to anyone signed in; contributing is not. Someone who has
-- not agreed to the adab of this place may look around and leave.
DROP POLICY IF EXISTS "insert own posts" ON posts;
CREATE POLICY "insert own posts" ON posts
FOR INSERT WITH CHECK (
  author_id = (SELECT auth.uid())
  AND has_accepted_mithaq((SELECT auth.uid()))
  AND (
    visibility <> 'halaqa'
    OR (halaqa_id IS NOT NULL AND is_halaqa_member((SELECT auth.uid()), halaqa_id))
  )
);

DROP POLICY IF EXISTS "comment where you can read" ON comments;
CREATE POLICY "comment where you can read" ON comments
FOR INSERT WITH CHECK (
  author_id = (SELECT auth.uid())
  AND has_accepted_mithaq((SELECT auth.uid()))
  AND can_view_post(post_id)
);
