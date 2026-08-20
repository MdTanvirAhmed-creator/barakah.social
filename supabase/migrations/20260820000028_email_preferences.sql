-- Phase 6 — email preferences.
--
-- The Settings screen has shown an "Email Preferences" section since the
-- mock era, but nothing was ever stored behind it. Before anything actually
-- sends mail, a reader's choice has to be real and has to be respected — so
-- the daily digest gets a preference the mailer reads, and a reader can turn
-- it off and have that mean something.
--
-- Private to its owner, like the rest of a reader's own settings. The digest
-- mailer runs as service_role and reads across everyone, which is why the
-- row is here rather than inferred at send time.

CREATE TABLE user_email_prefs (
  user_id      uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_digest boolean NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_email_prefs ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT, INSERT, UPDATE, DELETE ON user_email_prefs TO authenticated;
GRANT ALL ON user_email_prefs TO service_role;

CREATE POLICY "own email preferences" ON user_email_prefs
FOR ALL USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- The digest now excludes anyone who has opted out. Absence of a row means
-- opted in, which matches the column default and avoids a backfill.
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
     AND NOT EXISTS (
       SELECT 1 FROM user_email_prefs p
        WHERE p.user_id = n.user_id AND p.daily_digest = false
     )
   GROUP BY n.user_id;
$$;

REVOKE EXECUTE ON FUNCTION daily_notification_digest(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION daily_notification_digest(timestamptz) TO service_role;
