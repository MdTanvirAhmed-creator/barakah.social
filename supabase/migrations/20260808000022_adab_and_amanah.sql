-- Phase 5 — Adab & Amanah: comments privacy, working moderation, and the
-- closing of the last self-promotion hole.
--
-- Three defects fixed, all proven by tests before this migration:
--
--   1. COMMENTS LEAK: the SELECT policy was `is_deleted = false` — every
--      comment on every companions-only post was readable by anyone signed
--      in, and INSERT never checked that the commenter could see the post.
--   2. MODERATION WAS NON-FUNCTIONAL: reports were visible only to their
--      reporter. No moderator could read or resolve anything, so the
--      "admins moderate initially" commitment had no working mechanism.
--   3. PRIVILEGE ESCALATION: profiles.role and profiles.is_verified_scholar
--      were freely self-updatable ("update own profile" has no column
--      restrictions), while 23 policies and the admin UI trust those
--      columns. Any member could make themselves admin with one API call.
--
-- Also retired: the legacy companion_connections / companion_interactions
-- tables (0 rows in every environment; superseded by companionships in
-- migration 17).

-- ===========================================================================
-- 1. Comments follow the post's visibility
-- ===========================================================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "comments visible with their post" ON comments
FOR SELECT USING (
  author_id = (SELECT auth.uid())
  OR (is_deleted = false AND can_view_post(post_id))
);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "comment where you can read" ON comments
FOR INSERT WITH CHECK (
  author_id = (SELECT auth.uid())
  AND can_view_post(post_id)
);

-- ===========================================================================
-- 2. Moderation: granted moderators (and admins) read and resolve reports
-- ===========================================================================

CREATE POLICY "moderators view all reports" ON reports
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'moderator')
  OR has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "moderators resolve reports" ON reports
FOR UPDATE
USING (
  has_role((SELECT auth.uid()), 'moderator')
  OR has_role((SELECT auth.uid()), 'admin')
)
WITH CHECK (
  has_role((SELECT auth.uid()), 'moderator')
  OR has_role((SELECT auth.uid()), 'admin')
);

-- A moderator must be able to see the content they are asked to judge — but
-- ONLY content that has actually been reported. Moderation is not a window
-- into private circles; it is scoped to the complaint in front of them.
CREATE INDEX IF NOT EXISTS reports_content_idx ON reports (content_type, content_id);

CREATE POLICY "moderators view reported posts" ON posts
FOR SELECT USING (
  (has_role((SELECT auth.uid()), 'moderator') OR has_role((SELECT auth.uid()), 'admin'))
  AND EXISTS (
    SELECT 1 FROM reports r
    WHERE r.content_type = 'post' AND r.content_id = posts.id
  )
);

CREATE POLICY "moderators view reported comments" ON comments
FOR SELECT USING (
  (has_role((SELECT auth.uid()), 'moderator') OR has_role((SELECT auth.uid()), 'admin'))
  AND EXISTS (
    SELECT 1 FROM reports r
    WHERE r.content_type = 'comment' AND r.content_id = comments.id
  )
);

-- ===========================================================================
-- 3. Privilege columns on profiles are amanah — held in trust, granted by
--    the service (moderation tooling), never claimed. The trigger pattern
--    follows migration 18: direct DB roles and service_role are exempt.
-- ===========================================================================

CREATE OR REPLACE FUNCTION protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_verified_scholar IS DISTINCT FROM OLD.is_verified_scholar
  THEN
    -- Direct connections (psql, migrations) are not PostgREST traffic.
    IF session_user <> 'authenticator' THEN
      RETURN NEW;
    END IF;
    -- service_role requests (admin tooling, fixtures) are allowed.
    IF coalesce(
         nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
         ''
       ) = 'service_role'
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'role and scholar status are granted, not claimed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON profiles;
CREATE TRIGGER protect_profile_privileges
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_profile_privileges();

-- ===========================================================================
-- 4. Retire the legacy companion tables (superseded by companionships)
-- ===========================================================================

DROP VIEW IF EXISTS active_companion_connections;
DROP TABLE IF EXISTS companion_interactions;
DROP TABLE IF EXISTS companion_connections;
DROP FUNCTION IF EXISTS update_connection_strength() CASCADE;
