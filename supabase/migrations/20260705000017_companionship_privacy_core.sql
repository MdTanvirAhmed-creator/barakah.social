-- Phase 1 — Security core: companions-only privacy model, enforced in the DB.
--
-- Adapted to the existing schema: posts uses `content` (not `body`) and already
-- has a legacy `is_deleted` flag; profiles uses `full_name` (not `display_name`);
-- halaqa membership lives in halaqa_members(halaqa_id, user_id).

-- ============================================================
-- Companionships (mutual, request/accept)
-- ============================================================
CREATE TABLE companionships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

-- One row per pair regardless of direction (also stops duplicate reverse requests).
CREATE UNIQUE INDEX companionships_pair_uniq
  ON companionships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
CREATE INDEX companionships_requester_addressee_status_idx
  ON companionships (requester_id, addressee_id, status);
CREATE INDEX companionships_addressee_idx ON companionships (addressee_id);

-- ============================================================
-- Blocks (one-directional, separate from companionship)
-- ============================================================
CREATE TABLE blocks (
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX blocks_blocked_id_idx ON blocks (blocked_id);

-- ============================================================
-- Posts: first-class visibility + halaqa link + soft delete
-- ============================================================
ALTER TABLE posts
  ADD COLUMN visibility text NOT NULL DEFAULT 'companions'
    CHECK (visibility IN ('public','companions','halaqa','private')),
  ADD COLUMN halaqa_id uuid REFERENCES halaqas(id) ON DELETE CASCADE,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE posts
  ADD CONSTRAINT posts_halaqa_visibility_check
    CHECK (visibility <> 'halaqa' OR halaqa_id IS NOT NULL);

CREATE INDEX posts_author_created_idx ON posts (author_id, created_at);
CREATE INDEX posts_visibility_idx ON posts (visibility);
CREATE INDEX posts_halaqa_id_idx ON posts (halaqa_id) WHERE halaqa_id IS NOT NULL;

-- ============================================================
-- Helper functions (SECURITY DEFINER, boolean-only — leak nothing)
-- ============================================================
CREATE OR REPLACE FUNCTION are_companions(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM companionships c
    WHERE c.status = 'accepted'
      AND ((c.requester_id = a AND c.addressee_id = b)
        OR (c.requester_id = b AND c.addressee_id = a))
  );
$$;

CREATE OR REPLACE FUNCTION is_blocked(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  );
$$;

CREATE OR REPLACE FUNCTION is_halaqa_member(u uuid, h uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM halaqa_members
    WHERE user_id = u AND halaqa_id = h
  );
$$;

-- ============================================================
-- Companionship state machine: pending -> accepted/declined only
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_companionship_transitions()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'companionship requests must start as pending';
    END IF;
    NEW.responded_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.requester_id <> OLD.requester_id OR NEW.addressee_id <> OLD.addressee_id THEN
    RAISE EXCEPTION 'companionship participants cannot be changed';
  END IF;

  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('accepted','declined') THEN
    NEW.responded_at := now();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid companionship transition: % -> %', OLD.status, NEW.status;
END;
$$;

CREATE TRIGGER companionship_transitions
  BEFORE INSERT OR UPDATE ON companionships
  FOR EACH ROW EXECUTE FUNCTION enforce_companionship_transitions();

-- ============================================================
-- RLS
-- ============================================================
-- Table-level grants (RLS below is what actually restricts row access).
GRANT ALL ON companionships TO authenticated, service_role;
GRANT ALL ON blocks TO authenticated, service_role;

-- The initial schema granted authenticated/anon but never service_role, so the
-- service key (server-only) lacks DML on several tables (e.g. halaqas) — in
-- production too. Restore the Supabase convention: service_role can do
-- everything; RLS doesn't apply to it anyway.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

ALTER TABLE companionships ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
-- posts + profiles already have RLS enabled (initial schema)

-- POSTS: replace world-readable policy; read governed by visibility + companionship + blocks
DROP POLICY "Posts are viewable by everyone" ON posts;
DROP POLICY "Authenticated users can create posts" ON posts;
DROP POLICY "Users can update their own posts" ON posts;
-- Soft delete only from now on: no DELETE policy (authors set deleted_at via UPDATE).
DROP POLICY "Users can delete their own posts" ON posts;

-- Authors always see their own rows (soft-deleted included — required both for
-- undelete and because Postgres rejects an UPDATE whose result the author could
-- no longer read). Everyone else: not deleted, not blocked, visibility rules.
CREATE POLICY "read posts by visibility" ON posts FOR SELECT USING (
  author_id = (SELECT auth.uid())
  OR (
    deleted_at IS NULL
    AND is_deleted = false
    AND NOT is_blocked((SELECT auth.uid()), author_id)
    AND (
         visibility = 'public'
      OR (visibility = 'companions' AND are_companions((SELECT auth.uid()), author_id))
      OR (visibility = 'halaqa'     AND is_halaqa_member((SELECT auth.uid()), halaqa_id))
    )
  )
);
CREATE POLICY "insert own posts" ON posts FOR INSERT
  WITH CHECK (author_id = (SELECT auth.uid()));
CREATE POLICY "update own posts" ON posts FOR UPDATE
  USING (author_id = (SELECT auth.uid()));

-- COMPANIONSHIPS: you only ever touch rows you're part of
CREATE POLICY "see own companionships" ON companionships FOR SELECT
  USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()));
CREATE POLICY "create request" ON companionships FOR INSERT
  WITH CHECK (requester_id = (SELECT auth.uid())
              AND NOT is_blocked(addressee_id, (SELECT auth.uid())));
CREATE POLICY "respond to request" ON companionships FOR UPDATE
  USING (addressee_id = (SELECT auth.uid()));
CREATE POLICY "remove companionship" ON companionships FOR DELETE
  USING (requester_id = (SELECT auth.uid()) OR addressee_id = (SELECT auth.uid()));

-- BLOCKS: you manage only your own blocks
CREATE POLICY "manage own blocks" ON blocks FOR ALL
  USING (blocker_id = (SELECT auth.uid()))
  WITH CHECK (blocker_id = (SELECT auth.uid()));

-- PROFILES: full row visible to self + companions only; strangers use the card view
DROP POLICY "Profiles are viewable by everyone" ON profiles;

ALTER TABLE profiles ADD COLUMN gender text;

CREATE POLICY "read own or companion profiles" ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()) OR are_companions((SELECT auth.uid()), id));

-- Minimal public "card" so strangers can find someone to send a request to.
-- Owned by postgres (bypasses RLS) on purpose — it exposes ONLY these columns.
CREATE VIEW public_profiles AS
  SELECT id, username, full_name AS display_name, avatar_url
  FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;
