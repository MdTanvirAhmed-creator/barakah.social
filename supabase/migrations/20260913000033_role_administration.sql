-- Making the role system usable, and safe to use.
--
-- user_roles has had correct policies since migration 20 and has never once
-- worked. Three things were wrong at the same time, each of which alone would
-- have been enough to make it inert:
--
--   1. `authenticated` was granted SELECT but never INSERT or DELETE, so the
--      "admins grant roles" policy had nothing to gate — every attempt died
--      at "permission denied for table user_roles" before RLS was consulted.
--      This project grants nothing automatically; that is the recurring trap.
--   2. Production contained no admin at all, and only an admin may grant, so
--      there was no one who could ever start.
--   3. granted_by was whatever the client chose to send, which makes an audit
--      column worse than none: it looks like provenance and is not.

-- 1. The grants the policies were always waiting for.
GRANT SELECT, INSERT, DELETE ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

-- TRUNCATE ignores row-level security entirely, so a policy cannot stand in
-- front of it. It is not reachable through PostgREST today, which is the only
-- reason this has been harmless, but members holding it on posts, profiles
-- and blocks is a hole waiting for a path. Nothing in this application needs
-- it, nor REFERENCES or TRIGGER.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT DISTINCT table_name
      FROM information_schema.role_table_grants
     WHERE table_schema = 'public'
       AND grantee IN ('anon', 'authenticated')
       AND privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER')
  LOOP
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated',
      t.table_name
    );
  END LOOP;
END $$;

-- 2. granted_by is recorded by the database, never accepted from the client.
ALTER TABLE user_roles
  ALTER COLUMN granted_by SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION stamp_role_grant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role tooling and migrations may state the granter (backfills,
  -- fixtures); client traffic may not.
  IF session_user = 'authenticator'
     AND coalesce(
           nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
           ''
         ) <> 'service_role'
  THEN
    NEW.granted_by := auth.uid();
  END IF;
  NEW.granted_at := coalesce(NEW.granted_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_role_grant ON user_roles;
CREATE TRIGGER stamp_role_grant
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION stamp_role_grant();

-- 3. The platform must never be left without an admin. An admin may step down
-- while another remains; the last one may not, because nobody could then
-- appoint anyone and moderation would be beyond reach for good.
CREATE OR REPLACE FUNCTION protect_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin'
     AND (SELECT count(*) FROM user_roles WHERE role = 'admin') <= 1
  THEN
    RAISE EXCEPTION
      'This is the last admin. Appoint another before standing down, or the '
      'platform will have no one who can appoint anyone.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_last_admin ON user_roles;
CREATE TRIGGER protect_last_admin
  BEFORE DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION protect_last_admin();

-- 4. Someone has to be first. Only the owner's account, only when no admin
-- exists anywhere, and only where that account is present — so this is a
-- no-op on a fresh local database and on staging.
INSERT INTO user_roles (user_id, role, granted_by, granted_at)
SELECT u.id, 'admin', u.id, now()
  FROM auth.users u
 WHERE u.email = 'tnvrahmed0@gmail.com'
   AND NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;

-- 5. One answer to "who may do what".
--
-- 23 policies across the dormant content-pipeline tables trust profiles.role,
-- while the live ones trust user_roles. Rewriting all 23 risks breaking
-- policies nothing currently exercises; instead user_roles becomes the single
-- source of truth and profiles.role becomes a projection of it, maintained
-- here. Members cannot write profiles.role themselves — migration 22's
-- protect_profile_privileges already refuses that — so the projection cannot
-- drift from underneath.
-- protect_profile_privileges (migration 22) refuses any client-side write to
-- profiles.role, which is exactly right and would also refuse the projection
-- below — SECURITY DEFINER changes current_user but not session_user, so it
-- still looks like ordinary PostgREST traffic. Rather than weaken that guard
-- for every definer function, the projection announces itself with a
-- transaction-local flag and the guard admits that one case by name.
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
    -- The role projection, writing what user_roles already decided.
    IF current_setting('app.syncing_role', true) = 'on' THEN
      RETURN NEW;
    END IF;
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

CREATE OR REPLACE FUNCTION sync_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := coalesce(NEW.user_id, OLD.user_id);
BEGIN
  -- Local to this transaction only, so it cannot leak into another request.
  PERFORM set_config('app.syncing_role', 'on', true);
  UPDATE profiles
     SET role = CASE
                  WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target AND role = 'admin')
                    THEN 'admin'
                  WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target AND role = 'moderator')
                    THEN 'moderator'
                  ELSE 'user'
                END
   WHERE id = target;
  PERFORM set_config('app.syncing_role', 'off', true);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role ON user_roles;
CREATE TRIGGER sync_profile_role
  AFTER INSERT OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_role();

-- Bring the projection in line with whatever user_roles already says.
UPDATE profiles p
   SET role = CASE
                WHEN EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'admin')
                  THEN 'admin'
                WHEN EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'moderator')
                  THEN 'moderator'
                ELSE 'user'
              END
 WHERE p.role IS DISTINCT FROM CASE
         WHEN EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'admin')
           THEN 'admin'
         WHEN EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.id AND r.role = 'moderator')
           THEN 'moderator'
         ELSE 'user'
       END;

COMMENT ON TABLE user_roles IS
  'The single source of truth for privilege. profiles.role is a projection of '
  'this, maintained by sync_profile_role — grant and revoke here, never there.';
