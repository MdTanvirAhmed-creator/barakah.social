-- Phase 3 — Al-Minbar feed + notifications core.
--
-- Four coordinated changes, all governed by RLS:
--   A. Beneficial marks become PRIVATE TO THE AUTHOR. The mark rows are
--      readable only by the person who made the mark and the author of the
--      marked post. The per-post denormalised counter is removed entirely so
--      it can never leak a tally to companions; the author derives the true
--      count from the (now RLS-scoped) mark rows. No red counts, no riya.
--   B. user_roles + has_role(): the Review queue is gated to granted
--      reviewers. Contribution stays open to every member.
--   C. notifications: a quiet, badge-free inbox fed by SECURITY DEFINER
--      triggers on companionship request/accept. Beneficial marks
--      deliberately do NOT notify — the mark is a private du'a, not a ping.
--   D. Post media becomes PRIVATE: the post-media bucket is flipped to
--      private and guarded by storage RLS that mirrors post visibility, so
--      an image is only ever served to someone who may read its post.

-- ===========================================================================
-- A. Beneficial marks — private to the author
-- ===========================================================================

-- Author-of-post check, SECURITY DEFINER so the marks policy does not recurse
-- back through the posts RLS.
CREATE OR REPLACE FUNCTION is_post_author(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM posts WHERE id = p_post_id AND author_id = auth.uid()
  );
$$;

-- Was: USING (true) — every mark visible to everyone. Now: only your own
-- marks, plus every mark on a post you authored.
DROP POLICY IF EXISTS "Beneficial marks are viewable" ON beneficial_marks;
CREATE POLICY "Beneficial marks are viewable by marker and author"
ON beneficial_marks
FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR is_post_author(post_id)
);

-- Stop maintaining the per-post counter (the column is dropped below); keep
-- the profile-level aggregate, which is an admin-only signal used for scholar
-- verification eligibility, never surfaced to members.
CREATE OR REPLACE FUNCTION increment_post_beneficial_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET beneficial_count = beneficial_count + 1
  WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_beneficial_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET beneficial_count = GREATEST(0, beneficial_count - 1)
  WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  RETURN OLD;
END;
$$;

-- The denormalised per-post tally travelled on the post row, which every
-- companion may read — incompatible with private-to-author. Remove it.
ALTER TABLE posts DROP COLUMN IF EXISTS beneficial_count;

-- ===========================================================================
-- B. Roles + Review gating
-- ===========================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('reviewer', 'moderator', 'scholar', 'admin')),
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- New tables receive no grants automatically in this project.
GRANT SELECT ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

CREATE OR REPLACE FUNCTION has_role(p_user uuid, p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = p_user AND role = p_role
  );
$$;

-- Everyone sees their own roles; admins see and manage all. The first admin
-- is bootstrapped out-of-band via service_role.
CREATE POLICY "read own roles" ON user_roles
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "admins read all roles" ON user_roles
FOR SELECT USING (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "admins grant roles" ON user_roles
FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "admins revoke roles" ON user_roles
FOR DELETE USING (has_role((SELECT auth.uid()), 'admin'));

-- The community review queue is no longer open to every member: only granted
-- reviewers may read in-pipeline submissions. Contribution (INSERT of your own
-- submissions) is untouched and stays open to all.
DROP POLICY IF EXISTS "Community can view submissions under review" ON content_submissions;
CREATE POLICY "Reviewers can view submissions under review" ON content_submissions
FOR SELECT USING (
  status IN ('submitted', 'community_review', 'scholar_review')
  AND has_role((SELECT auth.uid()), 'reviewer')
);

-- Recording a review is likewise a reviewer action (was: any authenticated
-- member could insert a review of their own).
DROP POLICY IF EXISTS "Users can insert reviews" ON community_reviews;
CREATE POLICY "Reviewers record their own reviews" ON community_reviews
FOR INSERT WITH CHECK (
  reviewer_id = (SELECT auth.uid())
  AND has_role((SELECT auth.uid()), 'reviewer')
);

-- People search runs on public_profiles (so you can discover someone before
-- you are companions, while blocks are still honoured). Surface the verified-
-- scholar flag there too — it is inherently public — so scholars remain
-- discoverable and badged without exposing the private profile row.
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id,
         username,
         full_name AS display_name,
         avatar_url,
         is_verified_scholar
    FROM profiles
   WHERE NOT is_blocked((SELECT auth.uid()), id);

-- ===========================================================================
-- C. Notifications — quiet, badge-free inbox
-- ===========================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('companion_request', 'companion_accepted')),
  actor_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- You may read and mark-read only your own notifications. Inserts happen only
-- through the SECURITY DEFINER triggers below — never directly by a client.
CREATE POLICY "read own notifications" ON notifications
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "mark own notifications read" ON notifications
FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION notify_companion_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id)
    VALUES (NEW.addressee_id, 'companion_request', NEW.requester_id, 'companionship', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_companionship_requested
AFTER INSERT ON companionships
FOR EACH ROW EXECUTE FUNCTION notify_companion_request();

CREATE OR REPLACE FUNCTION notify_companion_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id)
    VALUES (NEW.requester_id, 'companion_accepted', NEW.addressee_id, 'companionship', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_companionship_accepted
AFTER UPDATE ON companionships
FOR EACH ROW EXECUTE FUNCTION notify_companion_accepted();

-- ===========================================================================
-- D. Post media — private bucket mirroring post visibility
-- ===========================================================================

-- Visibility of a post, as a callable function mirroring the posts SELECT
-- policy, so storage RLS can reuse the exact same rule.
CREATE OR REPLACE FUNCTION can_view_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = p_post_id
      AND (
        p.author_id = auth.uid()
        OR (
          p.deleted_at IS NULL
          AND p.is_deleted = false
          AND NOT is_blocked(auth.uid(), p.author_id)
          AND (
            p.visibility = 'public'
            OR (p.visibility = 'companions' AND are_companions(auth.uid(), p.author_id))
            OR (p.visibility = 'halaqa' AND is_halaqa_member(auth.uid(), p.halaqa_id))
          )
        )
      )
  );
$$;

-- Flip the bucket private: no more anonymous public URLs. Media is now reached
-- only through signed URLs, which require passing the SELECT policy below.
UPDATE storage.buckets SET public = false WHERE id = 'post-media';

-- Uploads land in a per-user folder (path = "<uid>/<file>"), matching
-- uploadPostImage() which prefixes with the user's id.
DROP POLICY IF EXISTS "Users upload their own post media" ON storage.objects;
CREATE POLICY "Users upload their own post media"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users delete their own post media" ON storage.objects;
CREATE POLICY "Users delete their own post media"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- You may read a media object if you uploaded it, or if it is attached to a
-- post you are allowed to view (media_urls stores the bare object path).
DROP POLICY IF EXISTS "Post media visible to those who can view the post" ON storage.objects;
CREATE POLICY "Post media visible to those who can view the post"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'post-media'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM posts p
      WHERE name = ANY (p.media_urls)
        AND can_view_post(p.id)
    )
  )
);
