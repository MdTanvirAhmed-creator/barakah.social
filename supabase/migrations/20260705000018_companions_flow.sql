-- Phase 2 — Companions flow hardening:
--  1. server-side rate limit on companionship requests (anti-harassment)
--  2. blocked users disappear from each other's discovery (public_profiles)

-- ============================================================
-- 1. Rate limit: max 10 companionship requests per hour per user.
--
-- Events are recorded in a private counter table so deleting/re-sending
-- requests cannot reset the counter. Clients have no grants on it; the
-- SECURITY DEFINER trigger function writes it.
-- ============================================================
CREATE TABLE companionship_request_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX companionship_request_events_requester_idx
  ON companionship_request_events (requester_id, created_at);

ALTER TABLE companionship_request_events ENABLE ROW LEVEL SECURITY;
-- No policies: not client-readable. service_role bypasses RLS for ops/cleanup.
GRANT ALL ON companionship_request_events TO service_role;

CREATE OR REPLACE FUNCTION enforce_companionship_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Only rate-limit API traffic from end users: service_role requests and
  -- direct DB connections (seeds, psql) are exempt.
  IF session_user <> 'authenticator'
     OR current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO recent_count
  FROM companionship_request_events
  WHERE requester_id = NEW.requester_id
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'rate limit exceeded: too many companionship requests, try again later'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO companionship_request_events (requester_id) VALUES (NEW.requester_id);
  RETURN NEW;
END;
$$;

-- If any trigger in the chain raises, the whole statement (event row included)
-- rolls back, so failed inserts never consume quota inconsistently.
CREATE TRIGGER companionship_rate_limit
  BEFORE INSERT ON companionships
  FOR EACH ROW EXECUTE FUNCTION enforce_companionship_rate_limit();

-- ============================================================
-- 2. Discovery: blocked pairs can't see each other's public card.
-- ============================================================
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, username, full_name AS display_name, avatar_url
  FROM profiles
  WHERE NOT is_blocked((SELECT auth.uid()), id);

-- The blocker still needs to render their own block list (names/avatars),
-- which public_profiles now hides. Scoped to the caller's own blocks.
CREATE OR REPLACE FUNCTION my_blocked_cards()
RETURNS TABLE (id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.username::text, p.full_name::text, p.avatar_url
  FROM blocks b
  JOIN profiles p ON p.id = b.blocked_id
  WHERE b.blocker_id = (SELECT auth.uid());
$$;
