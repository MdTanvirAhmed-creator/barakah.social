-- Phase 4 — Halaqa membership hardening.
--
-- The initial-schema halaqa policies had three defects, all proven by
-- tests/rls/halaqa-lifecycle.rls.test.ts before this migration:
--
--   1. RECURSION: halaqa_members policies subqueried halaqa_members itself,
--      and halaqas <-> halaqa_members referenced each other, so any touch of
--      halaqa_members raised 42P17 ("infinite recursion detected"). Creating
--      a halaqa as an authenticated user has never worked against RLS.
--   2. PRIVACY LEAK: halaqas SELECT was (is_public OR is_active) — is_active
--      defaults true, so every PRIVATE halaqa was visible to everyone.
--   3. PRIVILEGE ESCALATION: the join policy never constrained the role
--      column, so anyone could join a public halaqa as 'admin' and then
--      update/delete it and expel its members.
--
-- The fix mirrors Phase 1's pattern: tiny SECURITY DEFINER boolean helpers
-- (which bypass RLS internally, breaking the recursion) and policies that
-- only ever call helpers or reference their own row's columns. The two
-- membership triggers also become SECURITY DEFINER — they used to run with
-- invoker rights, which under the hardened policies would block the
-- founder's admin seat and silently corrupt member_count.

-- ===========================================================================
-- Helpers (is_halaqa_member(u, h) already exists from migration 17)
-- ===========================================================================

CREATE OR REPLACE FUNCTION is_halaqa_admin(u uuid, h uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM halaqa_members
    WHERE user_id = u AND halaqa_id = h AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_halaqa_privileged(u uuid, h uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM halaqa_members
    WHERE user_id = u AND halaqa_id = h AND role IN ('admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION is_halaqa_public(h uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM halaqas
    WHERE id = h AND is_public = true AND is_active = true
  );
$$;

-- ===========================================================================
-- halaqas policies
-- ===========================================================================

DROP POLICY IF EXISTS "Public halaqas are viewable by everyone" ON halaqas;
DROP POLICY IF EXISTS "Members can view their private halaqas" ON halaqas;
DROP POLICY IF EXISTS "Admins can update their halaqas" ON halaqas;
DROP POLICY IF EXISTS "Admins can delete their halaqas" ON halaqas;
-- "Authenticated users can create halaqas" (created_by = auth.uid()) is kept.

-- Active public circles are open; private (or archived) circles are visible
-- to their members only. The creator always sees their own circle — also
-- required mechanically: INSERT..RETURNING checks the SELECT policy before
-- the AFTER trigger has seated the founder as admin member.
CREATE POLICY "halaqas visible when public or joined" ON halaqas
FOR SELECT USING (
  (is_public = true AND is_active = true)
  OR created_by = (SELECT auth.uid())
  OR is_halaqa_member((SELECT auth.uid()), id)
);

CREATE POLICY "halaqa admins update" ON halaqas
FOR UPDATE
USING (is_halaqa_admin((SELECT auth.uid()), id))
WITH CHECK (is_halaqa_admin((SELECT auth.uid()), id));

CREATE POLICY "halaqa admins delete" ON halaqas
FOR DELETE USING (is_halaqa_admin((SELECT auth.uid()), id));

-- ===========================================================================
-- halaqa_members policies
-- ===========================================================================

DROP POLICY IF EXISTS "Members can view halaqa members" ON halaqa_members;
DROP POLICY IF EXISTS "Users can join public halaqas" ON halaqa_members;
DROP POLICY IF EXISTS "Moderators can add members" ON halaqa_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON halaqa_members;
DROP POLICY IF EXISTS "Users can leave or be removed from halaqas" ON halaqa_members;

CREATE POLICY "member lists visible when public or joined" ON halaqa_members
FOR SELECT USING (
  is_halaqa_public(halaqa_id)
  OR is_halaqa_member((SELECT auth.uid()), halaqa_id)
);

-- Joining is always as a plain member; seats of responsibility are granted
-- afterwards by an admin, never claimed.
CREATE POLICY "join public halaqas as member" ON halaqa_members
FOR INSERT WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role = 'member'
  AND is_halaqa_public(halaqa_id)
);

CREATE POLICY "privileged members add members" ON halaqa_members
FOR INSERT WITH CHECK (
  role = 'member'
  AND is_halaqa_privileged((SELECT auth.uid()), halaqa_id)
);

CREATE POLICY "halaqa admins change roles" ON halaqa_members
FOR UPDATE
USING (is_halaqa_admin((SELECT auth.uid()), halaqa_id))
WITH CHECK (is_halaqa_admin((SELECT auth.uid()), halaqa_id));

CREATE POLICY "leave or be removed" ON halaqa_members
FOR DELETE USING (
  user_id = (SELECT auth.uid())
  OR is_halaqa_privileged((SELECT auth.uid()), halaqa_id)
);

-- ===========================================================================
-- Posting into a halaqa requires belonging to it. The old INSERT policy only
-- checked authorship, so any user could inject a halaqa-scoped post into a
-- circle they never joined (readable by its members).
-- ===========================================================================

DROP POLICY IF EXISTS "insert own posts" ON posts;
CREATE POLICY "insert own posts" ON posts
FOR INSERT WITH CHECK (
  author_id = (SELECT auth.uid())
  AND (
    visibility <> 'halaqa'
    OR (halaqa_id IS NOT NULL AND is_halaqa_member((SELECT auth.uid()), halaqa_id))
  )
);

-- ===========================================================================
-- Daily digest source (decision: daily digest + badge-free inbox). The
-- Phase 6 mailer calls this with service_role once a day; it summarises what
-- each member has not yet seen. Execution is service-only — it aggregates
-- across users, so it must never be callable from a client.
-- ===========================================================================

CREATE OR REPLACE FUNCTION daily_notification_digest(
  p_since timestamptz DEFAULT now() - interval '24 hours'
)
RETURNS TABLE (
  user_id     uuid,
  requests    bigint,
  acceptances bigint,
  latest_at   timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT n.user_id,
         count(*) FILTER (WHERE n.type = 'companion_request'),
         count(*) FILTER (WHERE n.type = 'companion_accepted'),
         max(n.created_at)
    FROM notifications n
   WHERE n.created_at >= p_since
     AND n.read_at IS NULL
   GROUP BY n.user_id;
$$;

REVOKE EXECUTE ON FUNCTION daily_notification_digest(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION daily_notification_digest(timestamptz) TO service_role;

-- ===========================================================================
-- Triggers: run with definer rights so the founder's admin seat and the
-- member_count bookkeeping are not subject to the acting user's RLS.
-- ===========================================================================

CREATE OR REPLACE FUNCTION add_halaqa_creator_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO halaqa_members (halaqa_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_halaqa_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE halaqas
    SET member_count = member_count + 1
    WHERE id = NEW.halaqa_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE halaqas
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.halaqa_id;
    RETURN OLD;
  END IF;
END;
$$;
