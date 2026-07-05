-- =====================================================
-- BARAKAH.SOCIAL - MASTER MIGRATION SCRIPT
-- =====================================================
-- This script contains all database migrations in the correct order
-- Run this after 000_CLEANUP_ALL.sql
-- =====================================================

-- =====================================================
-- 1. INITIAL SCHEMA (001_initial_schema.sql)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- ENUMS
-- =====================================================

-- Madhab preferences
CREATE TYPE madhab_type AS ENUM (
  'hanafi',
  'shafi',
  'maliki',
  'hanbali',
  'jafari'
);

-- Post types
CREATE TYPE post_type AS ENUM (
  'standard',
  'question',
  'poll',
  'debate'
);

-- Halaqa member roles
CREATE TYPE halaqa_role AS ENUM (
  'member',
  'moderator',
  'admin'
);

-- Report content types
CREATE TYPE content_type AS ENUM (
  'post',
  'comment',
  'profile'
);

-- Report reasons (Islamic-specific)
CREATE TYPE report_reason AS ENUM (
  'ghibah',           -- Backbiting
  'takfir',           -- Declaring others as non-believers inappropriately
  'fitna',            -- Causing discord/mischief
  'hate_speech',      -- General hate speech
  'misinformation',   -- False information
  'inappropriate',    -- Other inappropriate content
  'spam'              -- Spam content
);

-- Report status
CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
);

-- =====================================================
-- TABLES
-- =====================================================

-- ============ 1. PROFILES TABLE ============
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  madhab_preference madhab_type,
  role TEXT DEFAULT 'user' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_verified_scholar BOOLEAN DEFAULT false NOT NULL,
  beneficial_count INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT beneficial_count_positive CHECK (beneficial_count >= 0)
);

-- Profiles indexes
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_username_trgm_idx ON profiles USING gin(username gin_trgm_ops);
CREATE INDEX profiles_is_verified_scholar_idx ON profiles(is_verified_scholar) WHERE is_verified_scholar = true;
CREATE INDEX profiles_joined_at_idx ON profiles(joined_at DESC);

-- ============ 2. POSTS TABLE ============
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type post_type DEFAULT 'standard' NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  beneficial_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  
  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  CONSTRAINT beneficial_count_positive CHECK (beneficial_count >= 0),
  CONSTRAINT tags_limit CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10)
);

-- Posts indexes
CREATE INDEX posts_author_id_idx ON posts(author_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX posts_post_type_idx ON posts(post_type);
CREATE INDEX posts_tags_idx ON posts USING gin(tags);
CREATE INDEX posts_is_pinned_idx ON posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX posts_beneficial_count_idx ON posts(beneficial_count DESC);
CREATE INDEX posts_is_deleted_idx ON posts(is_deleted) WHERE is_deleted = false;

-- ============ 3. HALAQAS (CIRCLES) TABLE ============
CREATE TABLE halaqas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  rules TEXT,
  member_count INTEGER DEFAULT 0 NOT NULL,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Constraints
  CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) >= 10),
  CONSTRAINT member_count_positive CHECK (member_count >= 0)
);

-- Halaqas indexes
CREATE INDEX halaqas_created_by_idx ON halaqas(created_by);
CREATE INDEX halaqas_category_idx ON halaqas(category);
CREATE INDEX halaqas_is_public_idx ON halaqas(is_public);
CREATE INDEX halaqas_created_at_idx ON halaqas(created_at DESC);
CREATE INDEX halaqas_member_count_idx ON halaqas(member_count DESC);
CREATE INDEX halaqas_name_trgm_idx ON halaqas USING gin(name gin_trgm_ops);

-- ============ 4. HALAQA_MEMBERS TABLE ============
CREATE TABLE halaqa_members (
  halaqa_id UUID NOT NULL REFERENCES halaqas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role halaqa_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (halaqa_id, user_id)
);

-- Halaqa members indexes
CREATE INDEX halaqa_members_halaqa_id_idx ON halaqa_members(halaqa_id);
CREATE INDEX halaqa_members_user_id_idx ON halaqa_members(user_id);
CREATE INDEX halaqa_members_role_idx ON halaqa_members(role) WHERE role IN ('moderator', 'admin');

-- ============ 5. COMMENTS TABLE ============
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  beneficial_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Constraints
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  CONSTRAINT beneficial_count_positive CHECK (beneficial_count >= 0)
);

-- Comments indexes
CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_author_id_idx ON comments(author_id);
CREATE INDEX comments_parent_comment_id_idx ON comments(parent_comment_id);
CREATE INDEX comments_created_at_idx ON comments(created_at DESC);
CREATE INDEX comments_is_deleted_idx ON comments(is_deleted) WHERE is_deleted = false;

-- ============ 6. BENEFICIAL_MARKS TABLE ============
CREATE TABLE beneficial_marks (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (user_id, post_id)
);

-- Beneficial marks indexes
CREATE INDEX beneficial_marks_post_id_idx ON beneficial_marks(post_id);
CREATE INDEX beneficial_marks_user_id_idx ON beneficial_marks(user_id);
CREATE INDEX beneficial_marks_created_at_idx ON beneficial_marks(created_at DESC);

-- ============ 7. BOOKMARKS TABLE ============
CREATE TABLE bookmarks (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  PRIMARY KEY (user_id, post_id)
);

-- Bookmarks indexes
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX bookmarks_post_id_idx ON bookmarks(post_id);
CREATE INDEX bookmarks_created_at_idx ON bookmarks(created_at DESC);

-- ============ 8. REPORTS TABLE ============
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  content_id UUID NOT NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,
  
  -- Constraints
  CONSTRAINT description_length CHECK (char_length(description) <= 1000)
);

-- Reports indexes
CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX reports_content_type_idx ON reports(content_type);
CREATE INDEX reports_content_id_idx ON reports(content_id);
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_created_at_idx ON reports(created_at DESC);
CREATE INDEX reports_reason_idx ON reports(reason);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_halaqas_updated_at
  BEFORE UPDATE ON halaqas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to increment beneficial count on posts
CREATE OR REPLACE FUNCTION increment_post_beneficial_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET beneficial_count = beneficial_count + 1
  WHERE id = NEW.post_id;
  
  -- Also increment author's beneficial count
  UPDATE profiles
  SET beneficial_count = beneficial_count + 1
  WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement beneficial count on posts
CREATE OR REPLACE FUNCTION decrement_post_beneficial_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET beneficial_count = GREATEST(0, beneficial_count - 1)
  WHERE id = OLD.post_id;
  
  -- Also decrement author's beneficial count
  UPDATE profiles
  SET beneficial_count = GREATEST(0, beneficial_count - 1)
  WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for beneficial marks
CREATE TRIGGER on_beneficial_mark_created
  AFTER INSERT ON beneficial_marks
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_beneficial_count();

CREATE TRIGGER on_beneficial_mark_deleted
  AFTER DELETE ON beneficial_marks
  FOR EACH ROW
  EXECUTE FUNCTION decrement_post_beneficial_count();

-- Function to update halaqa member count
CREATE OR REPLACE FUNCTION update_halaqa_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Triggers for halaqa member count
CREATE TRIGGER on_halaqa_member_added
  AFTER INSERT ON halaqa_members
  FOR EACH ROW
  EXECUTE FUNCTION update_halaqa_member_count();

CREATE TRIGGER on_halaqa_member_removed
  AFTER DELETE ON halaqa_members
  FOR EACH ROW
  EXECUTE FUNCTION update_halaqa_member_count();

-- Function to automatically add creator as admin of halaqa
CREATE OR REPLACE FUNCTION add_halaqa_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO halaqa_members (halaqa_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as admin
CREATE TRIGGER on_halaqa_created
  AFTER INSERT ON halaqas
  FOR EACH ROW
  EXECUTE FUNCTION add_halaqa_creator_as_admin();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE halaqas ENABLE ROW LEVEL SECURITY;
ALTER TABLE halaqa_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficial_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES POLICIES ============

-- Anyone can view public profile information
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete their profile (use auth.users deletion instead)
CREATE POLICY "Users cannot delete profiles"
  ON profiles FOR DELETE
  USING (false);

-- ============ POSTS POLICIES ============

-- Anyone can view non-deleted posts
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can soft delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============ HALAQAS POLICIES ============

-- Public halaqas are viewable by everyone
CREATE POLICY "Public halaqas are viewable by everyone"
  ON halaqas FOR SELECT
  USING (
    is_public = true OR
    is_active = true
  );

-- Members can view private halaqas they belong to
CREATE POLICY "Members can view their private halaqas"
  ON halaqas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM halaqa_members
      WHERE halaqa_members.halaqa_id = halaqas.id
      AND halaqa_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create halaqas
CREATE POLICY "Authenticated users can create halaqas"
  ON halaqas FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only admins can update halaqas
CREATE POLICY "Admins can update their halaqas"
  ON halaqas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM halaqa_members
      WHERE halaqa_members.halaqa_id = halaqas.id
      AND halaqa_members.user_id = auth.uid()
      AND halaqa_members.role = 'admin'
    )
  );

-- Only admins can delete halaqas
CREATE POLICY "Admins can delete their halaqas"
  ON halaqas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM halaqa_members
      WHERE halaqa_members.halaqa_id = halaqas.id
      AND halaqa_members.user_id = auth.uid()
      AND halaqa_members.role = 'admin'
    )
  );

-- ============ HALAQA_MEMBERS POLICIES ============

-- Members can view other members of halaqas they belong to
CREATE POLICY "Members can view halaqa members"
  ON halaqa_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM halaqas
      WHERE halaqas.id = halaqa_members.halaqa_id
      AND (
        halaqas.is_public = true OR
        EXISTS (
          SELECT 1 FROM halaqa_members AS hm
          WHERE hm.halaqa_id = halaqas.id
          AND hm.user_id = auth.uid()
        )
      )
    )
  );

-- Users can join public halaqas
CREATE POLICY "Users can join public halaqas"
  ON halaqa_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM halaqas
      WHERE halaqas.id = halaqa_id
      AND halaqas.is_public = true
    )
  );

-- Admins and moderators can add members
CREATE POLICY "Moderators can add members"
  ON halaqa_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM halaqa_members AS hm
      WHERE hm.halaqa_id = halaqa_members.halaqa_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('admin', 'moderator')
    )
  );

-- Admins can update member roles
CREATE POLICY "Admins can update member roles"
  ON halaqa_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM halaqa_members AS hm
      WHERE hm.halaqa_id = halaqa_members.halaqa_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'admin'
    )
  );

-- Users can leave halaqas or admins can remove members
CREATE POLICY "Users can leave or be removed from halaqas"
  ON halaqa_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM halaqa_members AS hm
      WHERE hm.halaqa_id = halaqa_members.halaqa_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('admin', 'moderator')
    )
  );

-- ============ COMMENTS POLICIES ============

-- Anyone can view non-deleted comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============ BENEFICIAL_MARKS POLICIES ============

-- Users can view beneficial marks
CREATE POLICY "Beneficial marks are viewable"
  ON beneficial_marks FOR SELECT
  USING (true);

-- Users can mark posts as beneficial
CREATE POLICY "Users can mark posts as beneficial"
  ON beneficial_marks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own beneficial marks
CREATE POLICY "Users can remove their beneficial marks"
  ON beneficial_marks FOR DELETE
  USING (auth.uid() = user_id);

-- ============ BOOKMARKS POLICIES ============

-- Users can only view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create bookmarks
CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============ REPORTS POLICIES ============

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only the reporter can update their pending reports
CREATE POLICY "Users can update their pending reports"
  ON reports FOR UPDATE
  USING (
    auth.uid() = reporter_id AND
    status = 'pending'
  );

-- Users can delete their own pending reports
CREATE POLICY "Users can delete their pending reports"
  ON reports FOR DELETE
  USING (
    auth.uid() = reporter_id AND
    status = 'pending'
  );

-- =====================================================
-- HELPER FUNCTIONS FOR QUERIES
-- =====================================================

-- Function to check if user is halaqa moderator or admin
CREATE OR REPLACE FUNCTION is_halaqa_moderator(halaqa_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM halaqa_members
    WHERE halaqa_id = halaqa_id_param
    AND user_id = user_id_param
    AND role IN ('moderator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has marked post as beneficial
CREATE OR REPLACE FUNCTION has_marked_beneficial(post_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beneficial_marks
    WHERE post_id = post_id_param
    AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has bookmarked post
CREATE OR REPLACE FUNCTION has_bookmarked(post_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookmarks
    WHERE post_id = post_id_param
    AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post with author and engagement info
CREATE OR REPLACE FUNCTION get_post_with_details(post_id_param UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  post_type post_type,
  media_urls TEXT[],
  tags TEXT[],
  beneficial_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN,
  author_id UUID,
  author_username VARCHAR,
  author_full_name VARCHAR,
  author_avatar_url TEXT,
  author_is_verified BOOLEAN,
  has_user_marked_beneficial BOOLEAN,
  has_user_bookmarked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.content,
    p.post_type,
    p.media_urls,
    p.tags,
    p.beneficial_count,
    p.created_at,
    p.updated_at,
    p.is_pinned,
    pr.id AS author_id,
    pr.username AS author_username,
    pr.full_name AS author_full_name,
    pr.avatar_url AS author_avatar_url,
    pr.is_verified_scholar AS author_is_verified,
    has_marked_beneficial(p.id, auth.uid()) AS has_user_marked_beneficial,
    has_bookmarked(p.id, auth.uid()) AS has_user_bookmarked
  FROM posts p
  INNER JOIN profiles pr ON p.author_id = pr.id
  WHERE p.id = post_id_param
  AND p.is_deleted = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS (if needed for specific roles)
-- =====================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to anon (public) users for read-only operations
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- =====================================================
-- COMMENTS ON TABLES (Documentation)
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with Islamic-specific preferences';
COMMENT ON TABLE posts IS 'User posts with different types (standard, question, poll, debate)';
COMMENT ON TABLE halaqas IS 'Islamic study circles or community groups';
COMMENT ON TABLE halaqa_members IS 'Members of halaqas with their roles';
COMMENT ON TABLE comments IS 'Comments on posts with threading support';
COMMENT ON TABLE beneficial_marks IS 'Marks posts as beneficial (like feature but called "Beneficial")';
COMMENT ON TABLE bookmarks IS 'User bookmarks for saving posts';
COMMENT ON TABLE reports IS 'Content reports with Islamic-specific report reasons';

COMMENT ON COLUMN profiles.madhab_preference IS 'User''s preferred school of Islamic jurisprudence';
COMMENT ON COLUMN profiles.is_verified_scholar IS 'Indicates if user is a verified Islamic scholar';
COMMENT ON COLUMN profiles.beneficial_count IS 'Total beneficial marks received by user';
COMMENT ON COLUMN posts.post_type IS 'Type of post: standard, question, poll, or debate';
COMMENT ON COLUMN reports.reason IS 'Islamic-specific report reasons like ghibah, takfir, fitna';

-- =====================================================
-- END OF INITIAL SCHEMA
-- =====================================================

-- =====================================================
-- 2. STORAGE POLICIES (002_storage_policies.sql)
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Post media bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Halaqa avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'halaqa-avatars',
  'halaqa-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to generate avatar URL
CREATE OR REPLACE FUNCTION get_avatar_url(user_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'avatars/' || user_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate post media URL
CREATE OR REPLACE FUNCTION get_post_media_url(user_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'post-media/' || user_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate halaqa avatar URL
CREATE OR REPLACE FUNCTION get_halaqa_avatar_url(halaqa_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'halaqa-avatars/' || halaqa_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF STORAGE POLICIES
-- =====================================================

-- =====================================================
-- 3. COMPANION SYSTEM (002_companion_system.sql)
-- =====================================================

-- =====================================================
-- COMPANION SYSTEM MIGRATION
-- Phase 1: Database Schema Updates
-- =====================================================

-- ============ 1. CREATE ENUM TYPES ============

-- Connection status enum
DO $$ BEGIN
  CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Knowledge level enum
DO $$ BEGIN
  CREATE TYPE knowledge_level AS ENUM ('beginner', 'intermediate', 'advanced', 'any');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Gender preference enum
DO $$ BEGIN
  CREATE TYPE gender_preference AS ENUM ('same_only', 'educational_mixed', 'any');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Interaction type enum
DO $$ BEGIN
  CREATE TYPE interaction_type AS ENUM (
    'beneficial_given',
    'comment_reply',
    'halaqa_shared',
    'knowledge_shared',
    'message_sent',
    'post_interaction',
    'study_session'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Partnership type enum
DO $$ BEGIN
  CREATE TYPE partnership_type AS ENUM (
    'quran_memorization',
    'arabic_learning',
    'book_study',
    'general',
    'hadith_study',
    'fiqh_study'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Check-in frequency enum
DO $$ BEGIN
  CREATE TYPE check_in_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Mentor relationship status enum
DO $$ BEGIN
  CREATE TYPE mentor_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Life stage enum
DO $$ BEGIN
  CREATE TYPE life_stage AS ENUM ('student', 'professional', 'parent', 'retiree', 'seeker', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============ 2. UPDATE PROFILES TABLE ============

-- Add companion-related fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS companion_score INTEGER DEFAULT 0 CHECK (companion_score >= 0 AND companion_score <= 100),
  ADD COLUMN IF NOT EXISTS is_available_for_connections BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS connection_capacity INTEGER DEFAULT 50 CHECK (connection_capacity >= 0 AND connection_capacity <= 200),
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS personality_traits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS life_stage life_stage;

-- Add constraint for personality traits (valid values)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_personality_traits;
ALTER TABLE profiles ADD CONSTRAINT valid_personality_traits 
  CHECK (
    personality_traits <@ ARRAY['truthful', 'just', 'generous', 'patient', 'grateful', 'humble', 'sincere', 'kind']::TEXT[]
  );

-- Create index for companion matching queries
CREATE INDEX IF NOT EXISTS profiles_companion_matching_idx ON profiles (
  is_available_for_connections, 
  companion_score, 
  last_active
) WHERE is_available_for_connections = true;

-- ============ 3. COMPANION CONNECTIONS TABLE ============

CREATE TABLE IF NOT EXISTS companion_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending' NOT NULL,
  connection_strength INTEGER DEFAULT 0 CHECK (connection_strength >= 0 AND connection_strength <= 100),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  message TEXT,
  
  -- Constraints
  CONSTRAINT different_users CHECK (requester_id != recipient_id),
  CONSTRAINT message_length CHECK (char_length(message) <= 500),
  CONSTRAINT unique_connection UNIQUE (requester_id, recipient_id)
);

-- Indexes for companion_connections
CREATE INDEX IF NOT EXISTS companion_connections_requester_idx ON companion_connections(requester_id);
CREATE INDEX IF NOT EXISTS companion_connections_recipient_idx ON companion_connections(recipient_id);
CREATE INDEX IF NOT EXISTS companion_connections_status_idx ON companion_connections(status);
CREATE INDEX IF NOT EXISTS companion_connections_strength_idx ON companion_connections(connection_strength DESC);
CREATE INDEX IF NOT EXISTS companion_connections_last_interaction_idx ON companion_connections(last_interaction DESC);

-- ============ 4. USER MATCHING PREFERENCES TABLE ============

CREATE TABLE IF NOT EXISTS user_matching_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_age_range INT4RANGE,
  preferred_location_radius INTEGER CHECK (preferred_location_radius >= 0 AND preferred_location_radius <= 10000),
  preferred_knowledge_level knowledge_level DEFAULT 'any',
  preferred_languages TEXT[] DEFAULT '{}',
  gender_preference gender_preference DEFAULT 'educational_mixed',
  is_seeking_mentor BOOLEAN DEFAULT false,
  can_be_mentor BOOLEAN DEFAULT false,
  interests_weight INTEGER DEFAULT 50 CHECK (interests_weight >= 0 AND interests_weight <= 100),
  activity_weight INTEGER DEFAULT 30 CHECK (activity_weight >= 0 AND activity_weight <= 100),
  location_weight INTEGER DEFAULT 20 CHECK (location_weight >= 0 AND location_weight <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for matching preferences
CREATE INDEX IF NOT EXISTS matching_preferences_mentor_seeking_idx ON user_matching_preferences(is_seeking_mentor) WHERE is_seeking_mentor = true;
CREATE INDEX IF NOT EXISTS matching_preferences_can_mentor_idx ON user_matching_preferences(can_be_mentor) WHERE can_be_mentor = true;

-- ============ 5. COMPANION INTERACTIONS TABLE ============

CREATE TABLE IF NOT EXISTS companion_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  companion_connection_id UUID NOT NULL REFERENCES companion_connections(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  points INTEGER DEFAULT 1 CHECK (points >= 0 AND points <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for companion_interactions
CREATE INDEX IF NOT EXISTS companion_interactions_connection_idx ON companion_interactions(companion_connection_id);
CREATE INDEX IF NOT EXISTS companion_interactions_type_idx ON companion_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS companion_interactions_created_idx ON companion_interactions(created_at DESC);

-- ============ 6. STUDY PARTNERSHIPS TABLE ============

CREATE TABLE IF NOT EXISTS study_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partnership_type partnership_type NOT NULL,
  partner_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_progress JSONB DEFAULT '{}',
  goal TEXT,
  target_date DATE,
  check_in_frequency check_in_frequency DEFAULT 'weekly',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT different_partners CHECK (partner_1_id != partner_2_id),
  CONSTRAINT goal_length CHECK (char_length(goal) <= 1000)
);

-- Indexes for study_partnerships
CREATE INDEX IF NOT EXISTS study_partnerships_partner_1_idx ON study_partnerships(partner_1_id);
CREATE INDEX IF NOT EXISTS study_partnerships_partner_2_idx ON study_partnerships(partner_2_id);
CREATE INDEX IF NOT EXISTS study_partnerships_type_idx ON study_partnerships(partnership_type);
CREATE INDEX IF NOT EXISTS study_partnerships_active_idx ON study_partnerships(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS study_partnerships_target_date_idx ON study_partnerships(target_date);

-- ============ 7. MENTOR RELATIONSHIPS TABLE ============

CREATE TABLE IF NOT EXISTS mentor_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_areas TEXT[] DEFAULT '{}',
  status mentor_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT different_mentor_student CHECK (mentor_id != student_id),
  CONSTRAINT notes_length CHECK (char_length(notes) <= 2000)
);

-- Indexes for mentor_relationships
CREATE INDEX IF NOT EXISTS mentor_relationships_mentor_idx ON mentor_relationships(mentor_id);
CREATE INDEX IF NOT EXISTS mentor_relationships_student_idx ON mentor_relationships(student_id);
CREATE INDEX IF NOT EXISTS mentor_relationships_status_idx ON mentor_relationships(status);
CREATE INDEX IF NOT EXISTS mentor_relationships_active_idx ON mentor_relationships(status) WHERE status = 'active';

-- ============ 8. TRIGGERS ============

-- Update updated_at timestamp trigger for companion tables
CREATE OR REPLACE FUNCTION update_companion_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_companion_connections_updated_at ON companion_connections;
CREATE TRIGGER update_companion_connections_updated_at
  BEFORE UPDATE ON companion_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_updated_at_column();

DROP TRIGGER IF EXISTS update_matching_preferences_updated_at ON user_matching_preferences;
CREATE TRIGGER update_matching_preferences_updated_at
  BEFORE UPDATE ON user_matching_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_updated_at_column();

DROP TRIGGER IF EXISTS update_study_partnerships_updated_at ON study_partnerships;
CREATE TRIGGER update_study_partnerships_updated_at
  BEFORE UPDATE ON study_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_updated_at_column();

DROP TRIGGER IF EXISTS update_mentor_relationships_updated_at ON mentor_relationships;
CREATE TRIGGER update_mentor_relationships_updated_at
  BEFORE UPDATE ON mentor_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_companion_updated_at_column();

-- ============ 9. ROW LEVEL SECURITY (RLS) ============

-- Enable RLS on all companion tables
ALTER TABLE companion_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_relationships ENABLE ROW LEVEL SECURITY;

-- companion_connections policies
CREATE POLICY "Users can view their own connections" ON companion_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON companion_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own connections" ON companion_connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own connections" ON companion_connections
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- user_matching_preferences policies
CREATE POLICY "Users can view their own preferences" ON user_matching_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_matching_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_matching_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- companion_interactions policies
CREATE POLICY "Users can view interactions for their connections" ON companion_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companion_connections cc
      WHERE cc.id = companion_connection_id
      AND (cc.requester_id = auth.uid() OR cc.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can create interactions for their connections" ON companion_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companion_connections cc
      WHERE cc.id = companion_connection_id
      AND (cc.requester_id = auth.uid() OR cc.recipient_id = auth.uid())
      AND cc.status = 'accepted'
    )
  );

-- study_partnerships policies
CREATE POLICY "Users can view their own partnerships" ON study_partnerships
  FOR SELECT USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

CREATE POLICY "Users can create partnerships" ON study_partnerships
  FOR INSERT WITH CHECK (auth.uid() = partner_1_id);

CREATE POLICY "Partners can update their partnerships" ON study_partnerships
  FOR UPDATE USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

CREATE POLICY "Partners can delete their partnerships" ON study_partnerships
  FOR DELETE USING (auth.uid() = partner_1_id OR auth.uid() = partner_2_id);

-- mentor_relationships policies
CREATE POLICY "Users can view their mentor relationships" ON mentor_relationships
  FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Mentors can create relationships" ON mentor_relationships
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Both can update mentor relationships" ON mentor_relationships
  FOR UPDATE USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Both can delete mentor relationships" ON mentor_relationships
  FOR DELETE USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- ============ 10. HELPER FUNCTIONS ============

-- Function to calculate companion match score
CREATE OR REPLACE FUNCTION calculate_companion_match_score(
  user1_id UUID,
  user2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  match_score INTEGER := 0;
  user1_prefs RECORD;
  user2_prefs RECORD;
  user1_profile RECORD;
  user2_profile RECORD;
  shared_interests INTEGER;
BEGIN
  -- Get user profiles
  SELECT * INTO user1_profile FROM profiles WHERE id = user1_id;
  SELECT * INTO user2_profile FROM profiles WHERE id = user2_id;
  
  -- Get user preferences
  SELECT * INTO user1_prefs FROM user_matching_preferences WHERE user_id = user1_id;
  SELECT * INTO user2_prefs FROM user_matching_preferences WHERE user_id = user2_id;
  
  -- If either user is not available, return 0
  IF NOT user1_profile.is_available_for_connections OR NOT user2_profile.is_available_for_connections THEN
    RETURN 0;
  END IF;
  
  -- Calculate shared interests
  SELECT COUNT(*) INTO shared_interests
  FROM unnest(user1_profile.interests) i1
  WHERE i1 = ANY(user2_profile.interests);
  
  -- Interest compatibility (0-40 points)
  IF COALESCE(user1_prefs.interests_weight, 50) > 0 THEN
    match_score := match_score + LEAST(
      (shared_interests * 10),
      (40 * COALESCE(user1_prefs.interests_weight, 50) / 100)
    );
  END IF;
  
  -- Activity level (0-30 points) - based on beneficial_count
  IF COALESCE(user1_prefs.activity_weight, 30) > 0 THEN
    IF user1_profile.beneficial_count > 0 AND user2_profile.beneficial_count > 0 THEN
      match_score := match_score + (20 * COALESCE(user1_prefs.activity_weight, 30) / 100);
    END IF;
  END IF;
  
  -- Mentor/mentee matching (bonus 30 points)
  IF COALESCE(user1_prefs.is_seeking_mentor, false) AND COALESCE(user2_prefs.can_be_mentor, false) THEN
    match_score := match_score + 30;
  END IF;
  
  IF COALESCE(user2_prefs.is_seeking_mentor, false) AND COALESCE(user1_prefs.can_be_mentor, false) THEN
    match_score := match_score + 30;
  END IF;
  
  RETURN LEAST(match_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update connection strength based on interactions
CREATE OR REPLACE FUNCTION update_connection_strength()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companion_connections
  SET 
    connection_strength = LEAST(
      connection_strength + NEW.points,
      100
    ),
    last_interaction = timezone('utc'::text, now())
  WHERE id = NEW.companion_connection_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update connection strength
DROP TRIGGER IF EXISTS update_connection_strength_trigger ON companion_interactions;
CREATE TRIGGER update_connection_strength_trigger
  AFTER INSERT ON companion_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_strength();

-- ============ 11. VIEWS FOR EASY QUERYING ============

-- View for active connections with user details
CREATE OR REPLACE VIEW active_companion_connections AS
SELECT 
  cc.*,
  p1.full_name as requester_name,
  p1.username as requester_username,
  p1.avatar_url as requester_avatar,
  p2.full_name as recipient_name,
  p2.username as recipient_username,
  p2.avatar_url as recipient_avatar
FROM companion_connections cc
JOIN profiles p1 ON cc.requester_id = p1.id
JOIN profiles p2 ON cc.recipient_id = p2.id
WHERE cc.status = 'accepted';

-- View for mentor/mentee matches
CREATE OR REPLACE VIEW mentor_mentee_matches AS
SELECT 
  p.id as mentor_id,
  p.full_name as mentor_name,
  p.username as mentor_username,
  p.avatar_url as mentor_avatar,
  p.beneficial_count as mentor_beneficial_count,
  p.interests as mentor_interests,
  s.id as seeker_id,
  s.full_name as seeker_name,
  s.username as seeker_username,
  s.avatar_url as seeker_avatar,
  s.interests as seeker_interests,
  calculate_companion_match_score(p.id, s.id) as match_score
FROM profiles p
JOIN user_matching_preferences ump ON p.id = ump.user_id
JOIN user_matching_preferences smp ON true
JOIN profiles s ON s.id = smp.user_id
WHERE ump.can_be_mentor = true
AND smp.is_seeking_mentor = true
AND p.is_available_for_connections = true
AND s.is_available_for_connections = true
AND p.id != s.id;

-- ============ 12. COMMENTS ============

COMMENT ON TABLE companion_connections IS 'Stores connection relationships between users';
COMMENT ON TABLE user_matching_preferences IS 'User preferences for companion matching algorithm';
COMMENT ON TABLE companion_interactions IS 'Tracks interactions between companions for strengthening bonds';
COMMENT ON TABLE study_partnerships IS 'Study buddy partnerships for accountability';
COMMENT ON TABLE mentor_relationships IS 'Mentor-student relationships';
COMMENT ON COLUMN profiles.companion_score IS 'Internal score for matching algorithm (0-100)';
COMMENT ON COLUMN profiles.connection_capacity IS 'Maximum number of active connections allowed';
COMMENT ON COLUMN profiles.personality_traits IS 'Islamic character traits: truthful, just, generous, patient, grateful';


-- =====================================================
-- 4. COMMUNITY CONTRIBUTION (005_community_contribution.sql)
-- =====================================================

-- Migration: Community Contribution System
-- This migration creates tables for community content submission and review

-- Content submission types
-- CREATE TYPE content_type AS ENUM ('article', 'video', 'book', 'translation'); -- Commented out to avoid conflict with 001_initial_schema.sql
CREATE TYPE target_audience AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'community_review', 'scholar_review', 'approved', 'rejected');
CREATE TYPE review_action AS ENUM ('approve', 'reject', 'flag', 'request_changes');

-- Content submissions table
CREATE TABLE content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_author VARCHAR(255),
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  target_audience target_audience DEFAULT 'beginner',
  sources TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  status submission_status DEFAULT 'draft',
  review_stage INTEGER DEFAULT 1,
  community_flags INTEGER DEFAULT 0,
  beneficial_marks INTEGER DEFAULT 0,
  scholar_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  rejection_reason TEXT
);

-- Community reviews table
CREATE TABLE community_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES content_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action review_action NOT NULL,
  comment TEXT,
  stage INTEGER NOT NULL, -- 1: community flagging, 2: knowledgeable review, 3: scholar review
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contributor stats table
CREATE TABLE contributor_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_submissions INTEGER DEFAULT 0,
  approved_content INTEGER DEFAULT 0,
  pending_review INTEGER DEFAULT 0,
  rejected_content INTEGER DEFAULT 0,
  beneficial_marks INTEGER DEFAULT 0,
  contributor_level VARCHAR(50) DEFAULT 'Novice',
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contributor badges table
CREATE TABLE contributor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  requirements JSONB, -- JSON object defining requirements
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User badges junction table
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES contributor_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Content flags table
CREATE TABLE content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES content_submissions(id) ON DELETE CASCADE,
  flagger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL, -- spam, inappropriate, inaccurate, etc.
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scholar approvals table
CREATE TABLE scholar_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES content_submissions(id) ON DELETE CASCADE,
  scholar_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content categories table
CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES content_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO content_categories (name, description) VALUES
('Aqeedah', 'Islamic creed and beliefs'),
('Fiqh', 'Islamic jurisprudence'),
('Quran', 'Quranic studies and tafsir'),
('Hadith', 'Prophetic traditions'),
('Seerah', 'Prophet Muhammad (PBUH) biography'),
('History', 'Islamic history'),
('Arabic', 'Arabic language studies'),
('Classics', 'Classical Islamic texts'),
('Contemporary', 'Modern Islamic topics'),
('Education', 'Educational content'),
('Spirituality', 'Tasawwuf and spiritual development'),
('Family', 'Family and social issues');

-- Insert default badges
INSERT INTO contributor_badges (name, description, icon, color, requirements) VALUES
('Knowledge Contributor', 'Submitted first approved content', 'award', 'blue', '{"approved_content": 1}'),
('Quality Reviewer', 'Reviewed 10+ pieces of content', 'users', 'green', '{"reviews_completed": 10}'),
('Community Helper', 'Helped 50+ community members', 'heart', 'purple', '{"helpful_actions": 50}'),
('Scholar Assistant', 'Content approved by scholars', 'graduation-cap', 'gold', '{"scholar_approvals": 1}'),
('Expert Contributor', '50+ approved submissions', 'star', 'orange', '{"approved_content": 50}'),
('Translation Expert', 'Contributed translations', 'languages', 'teal', '{"translation_submissions": 5}'),
('Video Curator', 'Contributed video content', 'video', 'red', '{"video_submissions": 10}'),
('Book Reviewer', 'Contributed book recommendations', 'book-open', 'brown', '{"book_submissions": 5}');

-- Create indexes for performance
CREATE INDEX idx_content_submissions_contributor ON content_submissions(contributor_id);
CREATE INDEX idx_content_submissions_status ON content_submissions(status);
CREATE INDEX idx_content_submissions_type ON content_submissions(type);
CREATE INDEX idx_content_submissions_created ON content_submissions(created_at);
CREATE INDEX idx_community_reviews_submission ON community_reviews(submission_id);
CREATE INDEX idx_community_reviews_reviewer ON community_reviews(reviewer_id);
CREATE INDEX idx_content_flags_submission ON content_flags(submission_id);
CREATE INDEX idx_scholar_approvals_submission ON scholar_approvals(submission_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_content_submissions_updated_at 
  BEFORE UPDATE ON content_submissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributor_stats_updated_at 
  BEFORE UPDATE ON contributor_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update contributor stats
CREATE OR REPLACE FUNCTION update_contributor_stats(user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_subs INTEGER;
  approved_count INTEGER;
  pending_count INTEGER;
  rejected_count INTEGER;
  beneficial_total INTEGER;
  current_level VARCHAR(50);
  current_points INTEGER;
BEGIN
  -- Get submission counts
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'approved' THEN 1 END),
    COUNT(CASE WHEN status IN ('submitted', 'community_review', 'scholar_review') THEN 1 END),
    COUNT(CASE WHEN status = 'rejected' THEN 1 END)
  INTO total_subs, approved_count, pending_count, rejected_count
  FROM content_submissions 
  WHERE contributor_id = user_id;

  -- Get beneficial marks
  SELECT COALESCE(SUM(beneficial_marks), 0)
  INTO beneficial_total
  FROM content_submissions 
  WHERE contributor_id = user_id AND status = 'approved';

  -- Calculate points (10 per approved submission + 1 per beneficial mark)
  current_points := (approved_count * 10) + beneficial_total;

  -- Determine contributor level
  current_level := CASE
    WHEN approved_count >= 50 THEN 'Expert'
    WHEN approved_count >= 20 THEN 'Scholar'
    WHEN approved_count >= 10 THEN 'Knowledgeable'
    WHEN approved_count >= 1 THEN 'Contributor'
    ELSE 'Novice'
  END;

  -- Update or insert contributor stats
  INSERT INTO contributor_stats (
    user_id, total_submissions, approved_content, pending_review, 
    rejected_content, beneficial_marks, contributor_level, points
  ) VALUES (
    user_id, total_subs, approved_count, pending_count, 
    rejected_count, beneficial_total, current_level, current_points
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_submissions = EXCLUDED.total_submissions,
    approved_content = EXCLUDED.approved_content,
    pending_review = EXCLUDED.pending_review,
    rejected_content = EXCLUDED.rejected_content,
    beneficial_marks = EXCLUDED.beneficial_marks,
    contributor_level = EXCLUDED.contributor_level,
    points = EXCLUDED.points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id UUID)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  user_stats RECORD;
  meets_requirements BOOLEAN;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats FROM contributor_stats WHERE user_id = user_id;
  
  IF user_stats IS NULL THEN
    RETURN;
  END IF;

  -- Check each badge
  FOR badge_record IN 
    SELECT * FROM contributor_badges WHERE is_active = true
  LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges 
      WHERE user_id = user_id AND badge_id = badge_record.id
    ) THEN
      -- Check requirements (simplified - in production, use JSON path queries)
      meets_requirements := false;
      
      CASE badge_record.name
        WHEN 'Knowledge Contributor' THEN
          meets_requirements := user_stats.approved_content >= 1;
        WHEN 'Expert Contributor' THEN
          meets_requirements := user_stats.approved_content >= 50;
        WHEN 'Scholar Assistant' THEN
          meets_requirements := EXISTS (
            SELECT 1 FROM content_submissions 
            WHERE contributor_id = user_id AND scholar_approval = true
          );
        ELSE
          meets_requirements := false;
      END CASE;

      -- Award badge if requirements met
      IF meets_requirements THEN
        INSERT INTO user_badges (user_id, badge_id) 
        VALUES (user_id, badge_record.id);
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when submission status changes
CREATE OR REPLACE FUNCTION trigger_update_contributor_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contributor stats
  PERFORM update_contributor_stats(NEW.contributor_id);
  
  -- Check for new badges
  PERFORM check_and_award_badges(NEW.contributor_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contributor_stats_trigger
  AFTER UPDATE ON content_submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_contributor_stats();

-- Create view for submission details with contributor info
CREATE VIEW submission_details AS
SELECT 
  cs.*,
  p.username as contributor_username,
  p.full_name as contributor_name,
  p.avatar_url as contributor_avatar,
  cs_stats.contributor_level,
  cs_stats.points as contributor_points
FROM content_submissions cs
LEFT JOIN profiles p ON cs.contributor_id = p.id
LEFT JOIN contributor_stats cs_stats ON cs.contributor_id = cs_stats.user_id;

-- Create view for review queue
CREATE VIEW review_queue AS
SELECT 
  cs.*,
  p.username as contributor_username,
  p.full_name as contributor_name,
  p.avatar_url as contributor_avatar,
  cs_stats.contributor_level
FROM content_submissions cs
LEFT JOIN profiles p ON cs.contributor_id = p.id
LEFT JOIN contributor_stats cs_stats ON cs.contributor_id = cs_stats.user_id
WHERE cs.status IN ('submitted', 'community_review', 'scholar_review')
ORDER BY cs.created_at ASC;

-- RLS Policies
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholar_approvals ENABLE ROW LEVEL SECURITY;

-- Content submissions policies
CREATE POLICY "Users can view approved submissions" ON content_submissions
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own submissions" ON content_submissions
FOR SELECT USING (contributor_id = auth.uid());

CREATE POLICY "Users can insert their own submissions" ON content_submissions
FOR INSERT WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Users can update their own submissions" ON content_submissions
FOR UPDATE USING (contributor_id = auth.uid());

-- Community reviews policies
CREATE POLICY "Users can view reviews" ON community_reviews
FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews" ON community_reviews
FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Contributor stats policies
CREATE POLICY "Users can view all stats" ON contributor_stats
FOR SELECT USING (true);

CREATE POLICY "Users can view their own stats" ON contributor_stats
FOR SELECT USING (user_id = auth.uid());

-- User badges policies
CREATE POLICY "Users can view all badges" ON user_badges
FOR SELECT USING (true);

-- Content flags policies
CREATE POLICY "Users can view flags" ON content_flags
FOR SELECT USING (true);

CREATE POLICY "Users can insert flags" ON content_flags
FOR INSERT WITH CHECK (flagger_id = auth.uid());

-- Scholar approvals policies
CREATE POLICY "Users can view scholar approvals" ON scholar_approvals
FOR SELECT USING (true);

CREATE POLICY "Scholars can insert approvals" ON scholar_approvals
FOR INSERT WITH CHECK (scholar_id = auth.uid());

-- =====================================================
-- 5. TRUSTED PUBLISHERS (003_trusted_publishers.sql)
-- =====================================================

-- Trusted Publisher Partnerships System
-- Migration: 003_trusted_publishers.sql

-- Create ENUM types
CREATE TYPE publisher_verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE content_import_type AS ENUM ('article', 'video', 'audio', 'book', 'pdf');
CREATE TYPE content_review_status AS ENUM ('auto_approved', 'pending_review', 'approved', 'rejected');
CREATE TYPE import_schedule_type AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- Trusted Publishers Table
CREATE TABLE trusted_publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    verification_status publisher_verification_status DEFAULT 'pending',
    content_types TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    api_endpoint TEXT,
    api_key TEXT, -- Encrypted storage for API keys
    import_schedule import_schedule_type DEFAULT 'manual',
    last_import TIMESTAMP,
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    is_recommended BOOLEAN DEFAULT false,
    contact_email VARCHAR(255),
    contact_person VARCHAR(255),
    established_date DATE,
    country VARCHAR(100),
    specializations TEXT[] DEFAULT '{}',
    social_media JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP
);

-- Publisher Connections Table (User-Publisher relationships)
CREATE TABLE publisher_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    publisher_id UUID NOT NULL REFERENCES trusted_publishers(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) DEFAULT 'follower', -- 'follower', 'subscriber', 'contributor', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, publisher_id)
);

-- Imported Content Table
CREATE TABLE imported_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES trusted_publishers(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_import_type NOT NULL,
    authors TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_status content_review_status DEFAULT 'pending_review',
    reviewer_id UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    content_data JSONB, -- Store full content or metadata
    file_url TEXT, -- If content is a file
    thumbnail_url TEXT,
    duration INTEGER, -- For video/audio content in seconds
    word_count INTEGER,
    reading_time INTEGER, -- Estimated reading time in minutes
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    quality_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_rating >= 0.0 AND quality_rating <= 5.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Categories for Imported Content
CREATE TABLE imported_content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES imported_content(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES content_categories(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, category_id)
);

-- Publisher API Logs
CREATE TABLE publisher_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES trusted_publishers(id) ON DELETE CASCADE,
    api_endpoint TEXT,
    request_method VARCHAR(10),
    request_data JSONB,
    response_status INTEGER,
    response_data JSONB,
    error_message TEXT,
    execution_time INTEGER, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Import Jobs
CREATE TABLE content_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES trusted_publishers(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'full_import', 'incremental', 'manual'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Publisher Quality Metrics
CREATE TABLE publisher_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID NOT NULL REFERENCES trusted_publishers(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_content INTEGER DEFAULT 0,
    approved_content INTEGER DEFAULT 0,
    rejected_content INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(publisher_id, metric_date)
);

-- Create indexes for performance
CREATE INDEX idx_trusted_publishers_status ON trusted_publishers(verification_status);
CREATE INDEX idx_trusted_publishers_quality ON trusted_publishers(quality_score);
CREATE INDEX idx_trusted_publishers_created ON trusted_publishers(created_at);

CREATE INDEX idx_imported_content_publisher ON imported_content(publisher_id);
CREATE INDEX idx_imported_content_type ON imported_content(content_type);
CREATE INDEX idx_imported_content_review ON imported_content(review_status);
CREATE INDEX idx_imported_content_import_date ON imported_content(import_date);
CREATE INDEX idx_imported_content_published ON imported_content(is_published);
CREATE INDEX idx_imported_content_featured ON imported_content(is_featured);
CREATE INDEX idx_imported_content_quality ON imported_content(quality_rating);

CREATE INDEX idx_content_categories_content ON imported_content_categories(content_id);
CREATE INDEX idx_content_categories_category ON imported_content_categories(category_id);

CREATE INDEX idx_api_logs_publisher ON publisher_api_logs(publisher_id);
CREATE INDEX idx_api_logs_created ON publisher_api_logs(created_at);

CREATE INDEX idx_import_jobs_publisher ON content_import_jobs(publisher_id);
CREATE INDEX idx_import_jobs_status ON content_import_jobs(status);
CREATE INDEX idx_import_jobs_created ON content_import_jobs(created_at);

CREATE INDEX idx_quality_metrics_publisher ON publisher_quality_metrics(publisher_id);
CREATE INDEX idx_quality_metrics_date ON publisher_quality_metrics(metric_date);

-- RLS Policies
ALTER TABLE trusted_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Publisher Connections RLS Policies
CREATE POLICY "Users can view their own connections" ON publisher_connections
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own connections" ON publisher_connections
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own connections" ON publisher_connections
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own connections" ON publisher_connections
    FOR DELETE USING (user_id = auth.uid());

-- Trusted Publishers RLS Policies
CREATE POLICY "Admins can manage all publishers" ON trusted_publishers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Publishers can view their own data" ON trusted_publishers
    FOR SELECT USING (
        id IN (
            SELECT publisher_id FROM publisher_connections 
            WHERE user_id = auth.uid()
        )
    );

-- Imported Content RLS Policies
CREATE POLICY "Everyone can view published content" ON imported_content
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all content" ON imported_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Reviewers can update content" ON imported_content
    FOR UPDATE USING (
        reviewer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- Content Categories RLS Policies
CREATE POLICY "Everyone can view content categories" ON imported_content_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage content categories" ON imported_content_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- API Logs RLS Policies
CREATE POLICY "Admins can view all API logs" ON publisher_api_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Publishers can view their API logs" ON publisher_api_logs
    FOR SELECT USING (
        publisher_id IN (
            SELECT id FROM trusted_publishers 
            WHERE created_by = auth.uid()
        )
    );

-- Import Jobs RLS Policies
CREATE POLICY "Admins can manage all import jobs" ON content_import_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Publishers can view their import jobs" ON content_import_jobs
    FOR SELECT USING (
        publisher_id IN (
            SELECT id FROM trusted_publishers 
            WHERE created_by = auth.uid()
        )
    );

-- Quality Metrics RLS Policies
CREATE POLICY "Admins can view all quality metrics" ON publisher_quality_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Functions for automated operations
CREATE OR REPLACE FUNCTION update_publisher_quality_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Update quality score based on recent metrics
    UPDATE trusted_publishers 
    SET quality_score = (
        SELECT COALESCE(AVG(quality_score), 0)
        FROM publisher_quality_metrics 
        WHERE publisher_id = NEW.publisher_id 
        AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
    )
    WHERE id = NEW.publisher_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update quality score
CREATE TRIGGER update_publisher_quality_trigger
    AFTER INSERT OR UPDATE ON publisher_quality_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_publisher_quality_score();

-- Function to calculate content quality rating
CREATE OR REPLACE FUNCTION calculate_content_quality_rating(content_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating), 0.0)
    INTO rating
    FROM content_ratings 
    WHERE content_id = content_id;
    
    RETURN rating;
END;
$$ LANGUAGE plpgsql;

-- Function to get publisher statistics
CREATE OR REPLACE FUNCTION get_publisher_stats(publisher_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_content', COUNT(*),
        'published_content', COUNT(*) FILTER (WHERE is_published = true),
        'pending_review', COUNT(*) FILTER (WHERE review_status = 'pending_review'),
        'average_rating', COALESCE(AVG(quality_rating), 0.0),
        'total_views', COALESCE(SUM(view_count), 0),
        'total_likes', COALESCE(SUM(like_count), 0),
        'total_shares', COALESCE(SUM(share_count), 0)
    )
    INTO stats
    FROM imported_content
    WHERE publisher_id = publisher_uuid;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule content imports
CREATE OR REPLACE FUNCTION schedule_content_import()
RETURNS void AS $$
DECLARE
    publisher_record RECORD;
BEGIN
    -- Get publishers with scheduled imports
    FOR publisher_record IN 
        SELECT id, api_endpoint, import_schedule, last_import
        FROM trusted_publishers 
        WHERE verification_status = 'approved' 
        AND api_endpoint IS NOT NULL
        AND (
            (import_schedule = 'daily' AND (last_import IS NULL OR last_import < CURRENT_DATE))
            OR (import_schedule = 'weekly' AND (last_import IS NULL OR last_import < CURRENT_DATE - INTERVAL '7 days'))
            OR (import_schedule = 'monthly' AND (last_import IS NULL OR last_import < CURRENT_DATE - INTERVAL '30 days'))
        )
    LOOP
        -- Create import job
        INSERT INTO content_import_jobs (publisher_id, job_type, status, created_at)
        VALUES (publisher_record.id, 'scheduled_import', 'pending', NOW());
        
        -- Update last import timestamp
        UPDATE trusted_publishers 
        SET last_import = NOW() 
        WHERE id = publisher_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for publisher dashboard
CREATE VIEW publisher_dashboard AS
SELECT 
    tp.id,
    tp.name,
    tp.website,
    tp.verification_status,
    tp.quality_score,
    tp.last_import,
    COUNT(ic.id) as total_content,
    COUNT(ic.id) FILTER (WHERE ic.is_published = true) as published_content,
    COUNT(ic.id) FILTER (WHERE ic.review_status = 'pending_review') as pending_content,
    COALESCE(AVG(ic.quality_rating), 0.0) as average_rating,
    COALESCE(SUM(ic.view_count), 0) as total_views,
    COALESCE(SUM(ic.like_count), 0) as total_likes,
    COALESCE(SUM(ic.share_count), 0) as total_shares
FROM trusted_publishers tp
LEFT JOIN imported_content ic ON tp.id = ic.publisher_id
GROUP BY tp.id, tp.name, tp.website, tp.verification_status, tp.quality_score, tp.last_import;

-- Create a view for content review queue
CREATE VIEW content_review_queue AS
SELECT 
    ic.id,
    ic.title,
    ic.content_type,
    ic.import_date,
    ic.review_status,
    tp.name as publisher_name,
    ic.authors,
    ic.tags,
    ic.language,
    ic.word_count,
    ic.reading_time
FROM imported_content ic
JOIN trusted_publishers tp ON ic.publisher_id = tp.id
WHERE ic.review_status IN ('pending_review', 'auto_approved')
ORDER BY ic.import_date ASC;

-- Insert some sample trusted publishers
INSERT INTO trusted_publishers (
    name, 
    website, 
    description, 
    verification_status, 
    content_types, 
    languages, 
    quality_score,
    contact_email,
    country,
    specializations
) VALUES 
(
    'Islamic Research Foundation',
    'https://irf.net',
    'Leading Islamic research organization providing authentic Islamic content',
    'approved',
    ARRAY['article', 'video', 'book'],
    ARRAY['en', 'ar', 'ur'],
    95,
    'contact@irf.net',
    'United States',
    ARRAY['Quran', 'Hadith', 'Fiqh', 'Aqeedah']
),
(
    'Al-Azhar Online',
    'https://alazhar.edu.eg',
    'Official online platform of Al-Azhar University',
    'approved',
    ARRAY['article', 'video', 'audio'],
    ARRAY['ar', 'en'],
    98,
    'online@alazhar.edu.eg',
    'Egypt',
    ARRAY['Islamic Studies', 'Arabic', 'Tafsir', 'Hadith']
),
(
    'Islamic Book Trust',
    'https://ibtbooks.com',
    'Trusted publisher of Islamic books and literature',
    'approved',
    ARRAY['book', 'article', 'pdf'],
    ARRAY['en', 'ar', 'ur', 'fr'],
    92,
    'info@ibtbooks.com',
    'Malaysia',
    ARRAY['Islamic Literature', 'Biography', 'History']
);

-- Add comments for documentation
COMMENT ON TABLE trusted_publishers IS 'Stores information about trusted content publishers and their verification status';
COMMENT ON TABLE imported_content IS 'Stores content imported from trusted publishers';
COMMENT ON TABLE publisher_api_logs IS 'Logs API interactions with publisher endpoints';
COMMENT ON TABLE content_import_jobs IS 'Tracks automated content import jobs';
COMMENT ON TABLE publisher_quality_metrics IS 'Stores quality metrics for publishers over time';

COMMENT ON COLUMN trusted_publishers.quality_score IS 'Quality score from 0-100 based on user feedback and content metrics';
COMMENT ON COLUMN imported_content.quality_rating IS 'User rating from 0.0-5.0 for the content';
COMMENT ON COLUMN imported_content.content_data IS 'JSONB field storing full content or metadata';
COMMENT ON COLUMN trusted_publishers.api_key IS 'Encrypted API key for publisher authentication';

-- =====================================================
-- 6. RECOMMENDED PUBLISHERS (004_recommended_publishers.sql)
-- =====================================================

-- Migration: Add Recommended Trusted Publishers
-- This migration adds the recommended publishers to the trusted_publishers table

-- Insert recommended English sources
INSERT INTO trusted_publishers (
  id,
  name,
  website,
  verification_status,
  content_types,
  languages,
  quality_score,
  description,
  api_endpoint,
  import_schedule,
  is_recommended,
  created_at
) VALUES 
-- English Sources
(
  gen_random_uuid(),
  'SeekersGuidance.org',
  'https://seekersguidance.org',
  'approved',
  ARRAY['article', 'video', 'audio'],
  ARRAY['en'],
  95,
  'Comprehensive Islamic education platform with courses, articles, and guidance from qualified scholars',
  'https://seekersguidance.org/api',
  'weekly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Yaqeen Institute',
  'https://yaqeeninstitute.org',
  'approved',
  ARRAY['article', 'video', 'research'],
  ARRAY['en'],
  98,
  'Research-based Islamic content with scholarly articles and educational videos',
  'https://yaqeeninstitute.org/api',
  'weekly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Bayyinah Institute',
  'https://bayyinah.com',
  'approved',
  ARRAY['video', 'audio', 'course'],
  ARRAY['en'],
  96,
  'Quran and Arabic language education with high-quality video content',
  'https://bayyinah.com/api',
  'weekly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'AlMaghrib Institute',
  'https://almaghrib.org',
  'approved',
  ARRAY['course', 'video', 'article'],
  ARRAY['en'],
  94,
  'Islamic education courses and seminars with scholarly content',
  'https://almaghrib.org/api',
  'monthly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Zaytuna College',
  'https://zaytuna.edu',
  'approved',
  ARRAY['article', 'research', 'course'],
  ARRAY['en'],
  97,
  'Liberal arts college with Islamic studies and scholarly research',
  'https://zaytuna.edu/api',
  'monthly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Cambridge Muslim College',
  'https://cambridgemuslimcollege.org',
  'approved',
  ARRAY['research', 'article', 'course'],
  ARRAY['en'],
  96,
  'Academic institution with Islamic studies and research publications',
  'https://cambridgemuslimcollege.org/api',
  'monthly',
  true,
  NOW()
),

-- Arabic Sources (with translation pipeline)
(
  gen_random_uuid(),
  'Tafsir.app',
  'https://tafsir.app',
  'approved',
  ARRAY['article', 'book', 'research'],
  ARRAY['ar', 'en'],
  92,
  'Comprehensive Quranic commentary and Islamic scholarship',
  'https://tafsir.app/api',
  'weekly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'IslamWeb.net',
  'https://islamweb.net',
  'pending',
  ARRAY['article', 'fatwa', 'qa'],
  ARRAY['ar', 'en'],
  85,
  'Islamic website with articles and fatwas (content will be filtered)',
  'https://islamweb.net/api',
  'daily',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Alukah.net',
  'https://alukah.net',
  'pending',
  ARRAY['article', 'research', 'book'],
  ARRAY['ar'],
  88,
  'Arabic Islamic website with scholarly articles and research',
  'https://alukah.net/api',
  'weekly',
  true,
  NOW()
),

-- Specialized Sources
(
  gen_random_uuid(),
  'Sunnah.com',
  'https://sunnah.com',
  'approved',
  ARRAY['hadith', 'book', 'research'],
  ARRAY['en', 'ar'],
  99,
  'Comprehensive hadith database with authentication and commentary',
  'https://sunnah.com/api',
  'monthly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Quran.com',
  'https://quran.com',
  'approved',
  ARRAY['quran', 'translation', 'tafsir'],
  ARRAY['en', 'ar', 'ur', 'fr', 'es'],
  100,
  'Complete Quran with multiple translations and tafsir',
  'https://quran.com/api',
  'monthly',
  true,
  NOW()
),
(
  gen_random_uuid(),
  'Islamic Finance Institute',
  'https://islamicfinanceinstitute.org',
  'approved',
  ARRAY['article', 'research', 'course'],
  ARRAY['en'],
  93,
  'Specialized content on Islamic finance and economics',
  'https://islamicfinanceinstitute.org/api',
  'monthly',
  true,
  NOW()
);

-- Add new columns to trusted_publishers table if they don't exist
ALTER TABLE trusted_publishers 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_import TIMESTAMP,
ADD COLUMN IF NOT EXISTS import_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 0.0;

-- Create an index for recommended publishers
CREATE INDEX IF NOT EXISTS idx_trusted_publishers_recommended 
ON trusted_publishers(is_recommended) 
WHERE is_recommended = true;

-- Create a view for recommended publishers with stats
CREATE OR REPLACE VIEW recommended_publishers AS
SELECT 
  tp.*,
  COUNT(ic.id) as total_imports,
  COUNT(CASE WHEN ic.review_status = 'approved' THEN 1 END) as approved_content,
  COUNT(CASE WHEN ic.review_status = 'pending_review' THEN 1 END) as pending_content,
  ROUND(
    COUNT(CASE WHEN ic.review_status = 'approved' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(ic.id), 0) * 100, 2
  ) as approval_rate
FROM trusted_publishers tp
LEFT JOIN imported_content ic ON tp.id = ic.publisher_id
WHERE tp.is_recommended = true
GROUP BY tp.id;

-- Add RLS policy for recommended publishers
CREATE POLICY "Allow read access to recommended publishers" ON trusted_publishers
FOR SELECT USING (is_recommended = true);

-- Drop existing function to avoid return type conflict
DROP FUNCTION IF EXISTS get_publisher_stats(UUID);

-- Create a function to get publisher statistics
CREATE OR REPLACE FUNCTION get_publisher_stats(publisher_id UUID)
RETURNS TABLE (
  total_content BIGINT,
  approved_content BIGINT,
  pending_content BIGINT,
  rejected_content BIGINT,
  avg_quality_rating DECIMAL(3,2),
  last_import_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ic.id) as total_content,
    COUNT(CASE WHEN ic.review_status = 'approved' THEN 1 END) as approved_content,
    COUNT(CASE WHEN ic.review_status = 'pending_review' THEN 1 END) as pending_content,
    COUNT(CASE WHEN ic.review_status = 'rejected' THEN 1 END) as rejected_content,
    ROUND(AVG(ic.quality_rating), 2) as avg_quality_rating,
    MAX(ic.import_date) as last_import_date
  FROM imported_content ic
  WHERE ic.publisher_id = publisher_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CONTENT PIPELINES (006_content_pipelines.sql)
-- =====================================================

-- Content Pipelines Migration
-- Adds support for automated content import pipelines

-- Create content_pipelines table
CREATE TABLE content_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('youtube', 'rss', 'podcast', 'pdf')),
  config JSONB NOT NULL,
  schedule VARCHAR(100), -- Cron-like schedule
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'disabled')),
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  last_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_import_logs table for tracking import history
CREATE TABLE content_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES content_pipelines(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'error')),
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Create content_sources table for managing import sources
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('youtube_channel', 'rss_feed', 'podcast_feed', 'file_upload')),
  source_url TEXT,
  scholar_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  publisher_id UUID REFERENCES trusted_publishers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false, -- Auto-approve content from this source
  quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
  last_imported TIMESTAMP WITH TIME ZONE,
  import_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_content_pipelines_type ON content_pipelines(type);
CREATE INDEX idx_content_pipelines_status ON content_pipelines(status);
CREATE INDEX idx_content_pipelines_next_run ON content_pipelines(next_run);
CREATE INDEX idx_content_import_logs_pipeline_id ON content_import_logs(pipeline_id);
CREATE INDEX idx_content_import_logs_started_at ON content_import_logs(started_at);
CREATE INDEX idx_content_sources_type ON content_sources(type);
CREATE INDEX idx_content_sources_scholar_id ON content_sources(scholar_id);
CREATE INDEX idx_content_sources_publisher_id ON content_sources(publisher_id);

-- Add RLS policies
ALTER TABLE content_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

-- Content pipelines policies (admin only)
CREATE POLICY "Only admins can manage content pipelines" ON content_pipelines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Content import logs policies (admin only)
CREATE POLICY "Only admins can view content import logs" ON content_import_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Content sources policies (admin and scholars)
CREATE POLICY "Admins and scholars can manage content sources" ON content_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'scholar')
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_pipelines_updated_at 
  BEFORE UPDATE ON content_pipelines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sources_updated_at 
  BEFORE UPDATE ON content_sources 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to calculate import statistics
CREATE OR REPLACE FUNCTION get_pipeline_stats(pipeline_id UUID)
RETURNS TABLE (
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  avg_duration NUMERIC,
  last_import_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_imports,
    COUNT(*) FILTER (WHERE status = 'success') as successful_imports,
    COUNT(*) FILTER (WHERE status = 'error') as failed_imports,
    AVG(duration_seconds) as avg_duration,
    MAX(started_at) as last_import_date
  FROM content_import_logs
  WHERE content_import_logs.pipeline_id = get_pipeline_stats.pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to get next scheduled run
CREATE OR REPLACE FUNCTION get_next_run_time(schedule_text TEXT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Simple cron-like parsing (this would need more sophisticated logic in production)
  -- For now, return next hour for hourly schedules
  IF schedule_text LIKE '%hourly%' THEN
    next_run := date_trunc('hour', now()) + interval '1 hour';
  ELSIF schedule_text LIKE '%daily%' THEN
    next_run := date_trunc('day', now()) + interval '1 day';
  ELSIF schedule_text LIKE '%weekly%' THEN
    next_run := date_trunc('week', now()) + interval '1 week';
  ELSE
    next_run := now() + interval '1 hour'; -- Default to hourly
  END IF;
  
  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Content sources will be added by admins through the admin panel
-- No default content sources inserted

-- Content pipelines will be configured by admins through the admin panel
-- No default content pipelines inserted

-- Add comments for documentation
COMMENT ON TABLE content_pipelines IS 'Automated content import pipelines for various sources';
COMMENT ON TABLE content_import_logs IS 'Logs of content import pipeline executions';
COMMENT ON TABLE content_sources IS 'Configured sources for content import (channels, feeds, etc.)';
COMMENT ON COLUMN content_pipelines.config IS 'JSON configuration for the specific pipeline type';
COMMENT ON COLUMN content_pipelines.schedule IS 'Cron-like schedule for automated imports';
COMMENT ON COLUMN content_sources.auto_approve IS 'Whether to auto-approve content from this source';
COMMENT ON COLUMN content_sources.quality_score IS 'Quality score (0-100) for content from this source';

-- =====================================================
-- 8. CURATOR SYSTEM (007_curator_system.sql)
-- =====================================================

-- Curator System Migration
-- Adds support for volunteer content curators

-- Create curator_applications table
CREATE TABLE curator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  areas_of_interest TEXT[] NOT NULL,
  languages TEXT[] NOT NULL,
  time_commitment VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  sample_evaluation TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create curator_profiles table
CREATE TABLE curator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  areas_of_interest TEXT[] NOT NULL,
  languages TEXT[] NOT NULL,
  time_commitment VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  content_reviewed INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.0 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create curator_reviews table
CREATE TABLE curator_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL, -- References content_submissions or imported_content
  curator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'request_changes')),
  comments TEXT,
  suggested_tags TEXT[],
  suggested_category VARCHAR(100),
  difficulty_rating VARCHAR(20) CHECK (difficulty_rating IN ('beginner', 'intermediate', 'advanced', 'scholar')),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create curator_assignments table for batch assignments
CREATE TABLE curator_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_ids UUID[] NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create curator_performance table for tracking performance metrics
CREATE TABLE curator_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  content_reviewed INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.0,
  average_review_time INTEGER DEFAULT 0, -- in minutes
  quality_score DECIMAL(3,2) DEFAULT 0.0,
  community_feedback_score DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create curator_badges table for recognition system
CREATE TABLE curator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria JSONB NOT NULL, -- e.g., {"min_reviews": 100, "min_accuracy": 90}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_curator_badges table for badge assignments
CREATE TABLE user_curator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES curator_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  awarded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id)
);

-- Add indexes for performance
CREATE INDEX idx_curator_applications_user_id ON curator_applications(user_id);
CREATE INDEX idx_curator_applications_status ON curator_applications(status);
CREATE INDEX idx_curator_profiles_user_id ON curator_profiles(user_id);
CREATE INDEX idx_curator_profiles_is_active ON curator_profiles(is_active);
CREATE INDEX idx_curator_reviews_content_id ON curator_reviews(content_id);
CREATE INDEX idx_curator_reviews_curator_id ON curator_reviews(curator_id);
CREATE INDEX idx_curator_reviews_reviewed_at ON curator_reviews(reviewed_at);
CREATE INDEX idx_curator_assignments_curator_id ON curator_assignments(curator_id);
CREATE INDEX idx_curator_assignments_status ON curator_assignments(status);
CREATE INDEX idx_curator_performance_curator_id ON curator_performance(curator_id);
CREATE INDEX idx_curator_performance_period ON curator_performance(period_start, period_end);

-- Add RLS policies
ALTER TABLE curator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE curator_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_curator_badges ENABLE ROW LEVEL SECURITY;

-- Curator applications policies
CREATE POLICY "Users can view their own applications" ON curator_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON curator_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON curator_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Curator profiles policies
CREATE POLICY "Users can view their own profile" ON curator_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON curator_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Curator reviews policies
CREATE POLICY "Curators can view their own reviews" ON curator_reviews
  FOR SELECT USING (auth.uid() = curator_id);

CREATE POLICY "Curators can insert their own reviews" ON curator_reviews
  FOR INSERT WITH CHECK (auth.uid() = curator_id);

CREATE POLICY "Admins can view all reviews" ON curator_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Curator assignments policies
CREATE POLICY "Curators can view their own assignments" ON curator_assignments
  FOR SELECT USING (auth.uid() = curator_id);

CREATE POLICY "Admins can manage all assignments" ON curator_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Curator performance policies
CREATE POLICY "Curators can view their own performance" ON curator_performance
  FOR SELECT USING (auth.uid() = curator_id);

CREATE POLICY "Admins can view all performance" ON curator_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Curator badges policies
CREATE POLICY "Everyone can view badges" ON curator_badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON curator_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- User curator badges policies
CREATE POLICY "Users can view their own badges" ON user_curator_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all badges" ON user_curator_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_curator_applications_updated_at 
  BEFORE UPDATE ON curator_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curator_profiles_updated_at 
  BEFORE UPDATE ON curator_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to create curator profile when application is approved
CREATE OR REPLACE FUNCTION create_curator_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO curator_profiles (
      user_id,
      areas_of_interest,
      languages,
      time_commitment,
      experience
    ) VALUES (
      NEW.user_id,
      NEW.areas_of_interest,
      NEW.languages,
      NEW.time_commitment,
      NEW.experience
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_curator_profile_trigger
  AFTER UPDATE ON curator_applications
  FOR EACH ROW EXECUTE FUNCTION create_curator_profile();

-- Add function to update curator performance
CREATE OR REPLACE FUNCTION update_curator_performance()
RETURNS TRIGGER AS $$
DECLARE
  curator_profile RECORD;
  total_reviews INTEGER;
  accurate_reviews INTEGER;
  accuracy_rate DECIMAL(5,2);
BEGIN
  -- Get curator profile
  SELECT * INTO curator_profile FROM curator_profiles WHERE user_id = NEW.curator_id;
  
  IF curator_profile IS NOT NULL THEN
    -- Calculate total reviews
    SELECT COUNT(*) INTO total_reviews FROM curator_reviews WHERE curator_id = NEW.curator_id;
    
    -- Calculate accurate reviews (reviews that were later confirmed by scholars)
    SELECT COUNT(*) INTO accurate_reviews 
    FROM curator_reviews cr
    JOIN content_submissions cs ON cr.content_id = cs.id
    WHERE cr.curator_id = NEW.curator_id 
    AND cr.action = 'approve' 
    AND cs.status = 'approved';
    
    -- Calculate accuracy rate
    IF total_reviews > 0 THEN
      accuracy_rate := (accurate_reviews::DECIMAL / total_reviews::DECIMAL) * 100;
    ELSE
      accuracy_rate := 0;
    END IF;
    
    -- Update curator profile
    UPDATE curator_profiles 
    SET 
      content_reviewed = total_reviews,
      accuracy_rate = accuracy_rate,
      performance_score = LEAST(100, (accuracy_rate + (total_reviews * 0.1))),
      last_active = now()
    WHERE user_id = NEW.curator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_curator_performance_trigger
  AFTER INSERT ON curator_reviews
  FOR EACH ROW EXECUTE FUNCTION update_curator_performance();

-- Insert default curator badges
INSERT INTO curator_badges (name, description, criteria) VALUES
  ('First Review', 'Completed your first content review', '{"min_reviews": 1}'),
  ('Quality Reviewer', 'Maintained high accuracy in reviews', '{"min_reviews": 50, "min_accuracy": 85}'),
  ('Expert Curator', 'Reviewed 100+ pieces of content', '{"min_reviews": 100}'),
  ('Language Specialist', 'Reviewed content in multiple languages', '{"min_languages": 2, "min_reviews": 25}'),
  ('Community Champion', 'Consistently helpful and accurate reviews', '{"min_reviews": 200, "min_accuracy": 90}'),
  ('Scholar Assistant', 'Reviews frequently confirmed by scholars', '{"min_reviews": 100, "min_scholar_confirmations": 80}');

-- Add comments for documentation
COMMENT ON TABLE curator_applications IS 'Applications from users to become content curators';
COMMENT ON TABLE curator_profiles IS 'Active curator profiles with performance metrics';
COMMENT ON TABLE curator_reviews IS 'Content reviews performed by curators';
COMMENT ON TABLE curator_assignments IS 'Batch assignments of content to curators';
COMMENT ON TABLE curator_performance IS 'Performance metrics for curators over time';
COMMENT ON TABLE curator_badges IS 'Recognition badges for curator achievements';
COMMENT ON TABLE user_curator_badges IS 'Badge assignments to curators';
COMMENT ON COLUMN curator_applications.areas_of_interest IS 'Areas of expertise the applicant is interested in curating';
COMMENT ON COLUMN curator_applications.languages IS 'Languages the applicant can review content in';
COMMENT ON COLUMN curator_applications.time_commitment IS 'How much time the applicant can commit to curating';
COMMENT ON COLUMN curator_applications.sample_evaluation IS 'Sample content evaluation to assess curation skills';
COMMENT ON COLUMN curator_profiles.performance_score IS 'Overall performance score (0-100) based on accuracy and volume';
COMMENT ON COLUMN curator_profiles.accuracy_rate IS 'Percentage of reviews that were later confirmed by scholars';
COMMENT ON COLUMN curator_reviews.action IS 'Action taken on the content (approve, reject, flag, request_changes)';
COMMENT ON COLUMN curator_reviews.quality_score IS 'Quality score (1-10) assigned to the content';
COMMENT ON COLUMN curator_badges.criteria IS 'JSON criteria for earning the badge';

-- =====================================================
-- 9. LEARNING PATHS (008_learning_paths.sql)
-- =====================================================

-- Learning Paths System
-- Migration: 008_learning_paths.sql

-- Create ENUM types for learning paths
CREATE TYPE learning_path_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lesson_status AS ENUM ('locked', 'unlocked', 'completed');
CREATE TYPE assessment_type AS ENUM ('quiz', 'assignment', 'project', 'exam');
CREATE TYPE certificate_status AS ENUM ('pending', 'issued', 'revoked');

-- Learning Paths table
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100),
    difficulty VARCHAR(50),
    estimated_duration INTEGER, -- in minutes
    status learning_path_status DEFAULT 'draft',
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    tags TEXT[],
    prerequisites TEXT[],
    learning_objectives TEXT[],
    target_audience TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    is_featured BOOLEAN DEFAULT FALSE,
    is_certified BOOLEAN DEFAULT FALSE,
    completion_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Lessons table
CREATE TABLE learning_path_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50), -- 'video', 'article', 'quiz', 'assignment'
    content_url TEXT,
    content_data JSONB,
    duration INTEGER, -- in minutes
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Progress table
CREATE TABLE learning_path_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_lesson_id UUID REFERENCES learning_path_lessons(id),
    time_spent INTEGER DEFAULT 0, -- in minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_certificate_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, path_id)
);

-- Lesson Progress table
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES learning_path_lessons(id) ON DELETE CASCADE,
    status lesson_status DEFAULT 'locked',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    notes TEXT,
    bookmarks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES learning_path_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type assessment_type NOT NULL,
    questions JSONB NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    time_limit INTEGER, -- in minutes
    max_attempts INTEGER DEFAULT 3,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment Attempts table
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    answers JSONB,
    time_spent INTEGER, -- in minutes
    is_passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status certificate_status DEFAULT 'issued',
    verification_code VARCHAR(50) UNIQUE,
    pdf_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Reviews table
CREATE TABLE learning_path_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, path_id)
);

-- Learning Path Tags table
CREATE TABLE learning_path_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Tag Assignments table
CREATE TABLE learning_path_tag_assignments (
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES learning_path_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (path_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_learning_paths_category ON learning_paths(category);
CREATE INDEX idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);
CREATE INDEX idx_learning_paths_author ON learning_paths(author_id);
CREATE INDEX idx_learning_paths_featured ON learning_paths(is_featured);

CREATE INDEX idx_learning_path_lessons_path ON learning_path_lessons(path_id);
CREATE INDEX idx_learning_path_lessons_order ON learning_path_lessons(path_id, order_index);

CREATE INDEX idx_learning_path_progress_user ON learning_path_progress(user_id);
CREATE INDEX idx_learning_path_progress_path ON learning_path_progress(path_id);
CREATE INDEX idx_learning_path_progress_completed ON learning_path_progress(is_completed);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);

CREATE INDEX idx_assessments_lesson ON assessments(lesson_id);
CREATE INDEX idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_path ON certificates(path_id);
CREATE INDEX idx_certificates_status ON certificates(status);

CREATE INDEX idx_learning_path_reviews_path ON learning_path_reviews(path_id);
CREATE INDEX idx_learning_path_reviews_rating ON learning_path_reviews(rating);

-- Enable RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_paths
CREATE POLICY "Enable read access for all users" ON learning_paths FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_paths FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable update for path authors" ON learning_paths FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for path authors" ON learning_paths FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for learning_path_lessons
CREATE POLICY "Enable read access for all users" ON learning_path_lessons FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for path authors" ON learning_path_lessons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable update for path authors" ON learning_path_lessons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable delete for path authors" ON learning_path_lessons FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);

-- RLS Policies for learning_path_progress
CREATE POLICY "Enable read access for own progress" ON learning_path_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON learning_path_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON learning_path_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON learning_path_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lesson_progress
CREATE POLICY "Enable read access for own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON lesson_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assessments
CREATE POLICY "Enable read access for all users" ON assessments FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for lesson authors" ON assessments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);
CREATE POLICY "Enable update for lesson authors" ON assessments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);
CREATE POLICY "Enable delete for lesson authors" ON assessments FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);

-- RLS Policies for assessment_attempts
CREATE POLICY "Enable read access for own attempts" ON assessment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own attempts" ON assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own attempts" ON assessment_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own attempts" ON assessment_attempts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for certificates
CREATE POLICY "Enable read access for own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for system" ON certificates FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON certificates FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON certificates FOR DELETE USING (TRUE);

-- RLS Policies for learning_path_reviews
CREATE POLICY "Enable read access for all users" ON learning_path_reviews FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_path_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own reviews" ON learning_path_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own reviews" ON learning_path_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for learning_path_tags
CREATE POLICY "Enable read access for all users" ON learning_path_tags FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_path_tags FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for authenticated users" ON learning_path_tags FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for authenticated users" ON learning_path_tags FOR DELETE USING (TRUE);

-- RLS Policies for learning_path_tag_assignments
CREATE POLICY "Enable read access for all users" ON learning_path_tag_assignments FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for path authors" ON learning_path_tag_assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable update for path authors" ON learning_path_tag_assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable delete for path authors" ON learning_path_tag_assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);

-- Create functions for learning paths
CREATE OR REPLACE FUNCTION update_learning_path_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress percentage when lesson is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE learning_path_progress 
        SET progress_percentage = (
            SELECT (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM learning_path_lessons WHERE path_id = NEW.lesson_id))
            FROM lesson_progress lp
            JOIN learning_path_lessons lpl ON lp.lesson_id = lpl.id
            WHERE lpl.path_id = (SELECT path_id FROM learning_path_lessons WHERE id = NEW.lesson_id)
            AND lp.user_id = NEW.user_id
            AND lp.status = 'completed'
        ),
        updated_at = now()
        WHERE user_id = NEW.user_id 
        AND path_id = (SELECT path_id FROM learning_path_lessons WHERE id = NEW.lesson_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for progress updates
CREATE TRIGGER update_learning_path_progress_trigger
    AFTER UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_path_progress();

-- Create function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CERT-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(EXTRACT(DOY FROM now())::TEXT, 3, '0') || '-' || LPAD((EXTRACT(EPOCH FROM now()) % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to issue certificate
CREATE OR REPLACE FUNCTION issue_certificate(user_uuid UUID, path_uuid UUID)
RETURNS UUID AS $$
DECLARE
    cert_id UUID;
    cert_number TEXT;
BEGIN
    cert_number := generate_certificate_number();
    
    INSERT INTO certificates (user_id, path_id, certificate_number, verification_code)
    VALUES (user_uuid, path_uuid, cert_number, substring(md5(random()::text) from 1 for 8))
    RETURNING id INTO cert_id;
    
    -- Update learning path progress with certificate
    UPDATE learning_path_progress 
    SET completion_certificate_id = cert_id, completed_at = now(), is_completed = TRUE
    WHERE user_id = user_uuid AND path_id = path_uuid;
    
    RETURN cert_id;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 10. STUDY FEATURES (009_study_features.sql)
-- =====================================================

-- Interactive Study Features
-- Migration: 009_study_features.sql

-- Create ENUM types for study features
CREATE TYPE study_note_type AS ENUM ('highlight', 'note', 'bookmark', 'question');
CREATE TYPE flashcard_status AS ENUM ('new', 'learning', 'review', 'mastered');
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE study_session_status AS ENUM ('active', 'completed', 'abandoned');

-- Study Notes table
CREATE TABLE study_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID, -- References various content types
    content_type VARCHAR(50), -- 'article', 'video', 'lesson', etc.
    note_type study_note_type DEFAULT 'note',
    title VARCHAR(255),
    content TEXT NOT NULL,
    position_data JSONB, -- For inline notes (paragraph, timestamp, etc.)
    tags TEXT[],
    is_private BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flashcard Decks table
CREATE TABLE flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flashcards table
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    front_image_url TEXT,
    back_image_url TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Flashcard Progress table
CREATE TABLE user_flashcard_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    status flashcard_status DEFAULT 'new',
    ease_factor DECIMAL(4,2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, card_id)
);

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID, -- References various content types
    content_type VARCHAR(50),
    questions JSONB NOT NULL,
    time_limit INTEGER, -- in minutes
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    max_attempts INTEGER DEFAULT 3,
    is_randomized BOOLEAN DEFAULT FALSE,
    status quiz_status DEFAULT 'draft',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz Attempts table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    answers JSONB,
    time_spent INTEGER, -- in minutes
    is_passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Group Members table
CREATE TABLE study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(group_id, user_id)
);

-- Study Sessions table
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50), -- 'live', 'scheduled', 'recorded'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    max_participants INTEGER,
    status study_session_status DEFAULT 'active',
    meeting_url TEXT,
    recording_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Session Participants table
CREATE TABLE study_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    participation_score INTEGER DEFAULT 0,
    UNIQUE(session_id, user_id)
);

-- Shared Notes table
CREATE TABLE shared_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Progress table
CREATE TABLE study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID,
    content_type VARCHAR(50),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INTEGER DEFAULT 0, -- in minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    bookmarks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, content_id, content_type)
);

-- Spaced Repetition Schedule table
CREATE TABLE spaced_repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    next_review TIMESTAMP WITH TIME ZONE NOT NULL,
    interval_days INTEGER NOT NULL,
    ease_factor DECIMAL(4,2) NOT NULL,
    repetitions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, card_id)
);

-- Study Analytics table
CREATE TABLE study_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    study_time INTEGER DEFAULT 0, -- in minutes
    cards_reviewed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    sessions_attended INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_study_notes_user ON study_notes(user_id);
CREATE INDEX idx_study_notes_content ON study_notes(content_id, content_type);
CREATE INDEX idx_study_notes_type ON study_notes(note_type);
CREATE INDEX idx_study_notes_tags ON study_notes USING GIN(tags);

CREATE INDEX idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX idx_flashcard_decks_public ON flashcard_decks(is_public);
CREATE INDEX idx_flashcard_decks_subject ON flashcard_decks(subject);

CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_difficulty ON flashcards(difficulty_level);

CREATE INDEX idx_user_flashcard_progress_user ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_card ON user_flashcard_progress(card_id);
CREATE INDEX idx_user_flashcard_progress_status ON user_flashcard_progress(status);
CREATE INDEX idx_user_flashcard_progress_review ON user_flashcard_progress(next_review_date);

CREATE INDEX idx_quizzes_author ON quizzes(author_id);
CREATE INDEX idx_quizzes_content ON quizzes(content_id, content_type);
CREATE INDEX idx_quizzes_status ON quizzes(status);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(completed_at);

CREATE INDEX idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX idx_study_groups_public ON study_groups(is_public);
CREATE INDEX idx_study_groups_active ON study_groups(is_active);

CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX idx_study_group_members_active ON study_group_members(is_active);

CREATE INDEX idx_study_sessions_group ON study_sessions(group_id);
CREATE INDEX idx_study_sessions_scheduled ON study_sessions(scheduled_at);
CREATE INDEX idx_study_sessions_status ON study_sessions(status);

CREATE INDEX idx_study_session_participants_session ON study_session_participants(session_id);
CREATE INDEX idx_study_session_participants_user ON study_session_participants(user_id);

CREATE INDEX idx_shared_notes_group ON shared_notes(group_id);
CREATE INDEX idx_shared_notes_user ON shared_notes(user_id);
CREATE INDEX idx_shared_notes_pinned ON shared_notes(is_pinned);

CREATE INDEX idx_study_progress_user ON study_progress(user_id);
CREATE INDEX idx_study_progress_content ON study_progress(content_id, content_type);
CREATE INDEX idx_study_progress_completed ON study_progress(is_completed);

CREATE INDEX idx_spaced_repetition_schedule_user ON spaced_repetition_schedule(user_id);
CREATE INDEX idx_spaced_repetition_schedule_review ON spaced_repetition_schedule(next_review);

CREATE INDEX idx_study_analytics_user ON study_analytics(user_id);
CREATE INDEX idx_study_analytics_date ON study_analytics(date);

-- Enable RLS
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_notes
CREATE POLICY "Enable read access for own notes" ON study_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON study_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own notes" ON study_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own notes" ON study_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcard_decks
CREATE POLICY "Enable read access for public decks and own decks" ON flashcard_decks FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for deck owners" ON flashcard_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for deck owners" ON flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Enable read access for deck members" ON flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND (is_public = TRUE OR user_id = auth.uid()))
);
CREATE POLICY "Enable insert for deck owners" ON flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for deck owners" ON flashcards FOR UPDATE USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);
CREATE POLICY "Enable delete for deck owners" ON flashcards FOR DELETE USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);

-- RLS Policies for user_flashcard_progress
CREATE POLICY "Enable read access for own progress" ON user_flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON user_flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON user_flashcard_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON user_flashcard_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quizzes
CREATE POLICY "Enable read access for all users" ON quizzes FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON quizzes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable update for quiz authors" ON quizzes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for quiz authors" ON quizzes FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for quiz_attempts
CREATE POLICY "Enable read access for own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own attempts" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own attempts" ON quiz_attempts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Enable read access for public groups and member groups" ON study_groups FOR SELECT USING (
    is_public = TRUE OR 
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for authenticated users" ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Enable update for group creators" ON study_groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Enable delete for group creators" ON study_groups FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for study_group_members
CREATE POLICY "Enable read access for group members" ON study_group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND (is_public = TRUE OR creator_id = auth.uid()))
);
CREATE POLICY "Enable insert for group creators and members" ON study_group_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);
CREATE POLICY "Enable update for group creators and members" ON study_group_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);
CREATE POLICY "Enable delete for group creators and members" ON study_group_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);

-- RLS Policies for study_sessions
CREATE POLICY "Enable read access for group members" ON study_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON study_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for session creators" ON study_sessions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Enable delete for session creators" ON study_sessions FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for study_session_participants
CREATE POLICY "Enable read access for group members" ON study_session_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members sm 
            JOIN study_sessions ss ON sm.group_id = ss.group_id 
            WHERE ss.id = session_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON study_session_participants FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM study_group_members sm 
            JOIN study_sessions ss ON sm.group_id = ss.group_id 
            WHERE ss.id = session_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Enable update for participants" ON study_session_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for participants" ON study_session_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_notes
CREATE POLICY "Enable read access for group members" ON shared_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = shared_notes.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON shared_notes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = shared_notes.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for note authors" ON shared_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for note authors" ON shared_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_progress
CREATE POLICY "Enable read access for own progress" ON study_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON study_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON study_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON study_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for spaced_repetition_schedule
CREATE POLICY "Enable read access for own schedule" ON spaced_repetition_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own schedule" ON spaced_repetition_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own schedule" ON spaced_repetition_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own schedule" ON spaced_repetition_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_analytics
CREATE POLICY "Enable read access for own analytics" ON study_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own analytics" ON study_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own analytics" ON study_analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own analytics" ON study_analytics FOR DELETE USING (auth.uid() = user_id);

-- Create functions for study features
CREATE OR REPLACE FUNCTION update_flashcard_deck_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total cards count when flashcards are added/removed
    UPDATE flashcard_decks 
    SET total_cards = (
        SELECT COUNT(*) FROM flashcards WHERE deck_id = NEW.deck_id
    ),
    updated_at = now()
    WHERE id = NEW.deck_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flashcard deck stats
CREATE TRIGGER update_flashcard_deck_stats_trigger
    AFTER INSERT OR DELETE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_deck_stats();

-- Create function for spaced repetition (SM-2 algorithm)
CREATE OR REPLACE FUNCTION update_spaced_repetition(
    user_uuid UUID,
    card_uuid UUID,
    quality INTEGER -- 0-5 scale
)
RETURNS VOID AS $$
DECLARE
    current_ease DECIMAL(4,2);
    current_interval INTEGER;
    current_repetitions INTEGER;
    new_ease DECIMAL(4,2);
    new_interval INTEGER;
    new_repetitions INTEGER;
BEGIN
    -- Get current progress
    SELECT ease_factor, interval_days, repetitions
    INTO current_ease, current_interval, current_repetitions
    FROM user_flashcard_progress
    WHERE user_id = user_uuid AND card_id = card_uuid;
    
    -- SM-2 Algorithm
    IF quality < 3 THEN
        -- Failed - reset
        new_repetitions := 0;
        new_interval := 1;
        new_ease := current_ease;
    ELSE
        -- Passed
        new_repetitions := current_repetitions + 1;
        
        IF new_repetitions = 1 THEN
            new_interval := 1;
        ELSIF new_repetitions = 2 THEN
            new_interval := 6;
        ELSE
            new_interval := ROUND(current_interval * current_ease);
        END IF;
        
        -- Update ease factor
        new_ease := current_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        new_ease := GREATEST(1.3, new_ease);
    END IF;
    
    -- Update progress
    UPDATE user_flashcard_progress
    SET ease_factor = new_ease,
        interval_days = new_interval,
        repetitions = new_repetitions,
        next_review_date = now() + (new_interval || ' days')::INTERVAL,
        last_reviewed = now(),
        review_count = review_count + 1,
        correct_count = CASE WHEN quality >= 3 THEN correct_count + 1 ELSE correct_count END,
        updated_at = now()
    WHERE user_id = user_uuid AND card_id = card_uuid;
    
    -- Update spaced repetition schedule
    INSERT INTO spaced_repetition_schedule (user_id, card_id, next_review, interval_days, ease_factor, repetitions)
    VALUES (user_uuid, card_uuid, now() + (new_interval || ' days')::INTERVAL, new_interval, new_ease, new_repetitions)
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET 
        next_review = EXCLUDED.next_review,
        interval_days = EXCLUDED.interval_days,
        ease_factor = EXCLUDED.ease_factor,
        repetitions = EXCLUDED.repetitions,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to get cards for review
CREATE OR REPLACE FUNCTION get_cards_for_review(user_uuid UUID)
RETURNS TABLE (
    card_id UUID,
    deck_id UUID,
    front_text TEXT,
    back_text TEXT,
    front_image_url TEXT,
    back_image_url TEXT,
    difficulty_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.deck_id,
        f.front_text,
        f.back_text,
        f.front_image_url,
        f.back_image_url,
        f.difficulty_level
    FROM flashcards f
    JOIN user_flashcard_progress ufp ON f.id = ufp.card_id
    WHERE ufp.user_id = user_uuid
    AND ufp.next_review_date <= now()
    ORDER BY ufp.next_review_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CONTENT VERIFICATION (010_content_verification.sql)
-- =====================================================

-- Content Verification Pipeline
-- Migration: 010_content_verification.sql

-- Create ENUM types for content verification
CREATE TYPE verification_level AS ENUM ('level1_automated', 'level2_community', 'level3_scholarly');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'flagged', 'needs_review');
CREATE TYPE verification_check_type AS ENUM ('profanity', 'spam', 'duplicate', 'broken_link', 'copyright', 'relevance', 'quality', 'difficulty', 'source_credibility', 'islamic_authenticity', 'aqeedah', 'hadith_citation', 'bidah', 'scholarly_consensus');
CREATE TYPE verification_result AS ENUM ('pass', 'fail', 'warning', 'needs_review');

-- Content Verifications table
CREATE TABLE content_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    verification_level verification_level NOT NULL,
    status verification_status DEFAULT 'pending',
    submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    overall_score DECIMAL(5,2), -- 0-100
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Checks table
CREATE TABLE verification_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    check_type verification_check_type NOT NULL,
    check_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    weight DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Results table
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    check_id UUID REFERENCES verification_checks(id) ON DELETE CASCADE,
    result verification_result NOT NULL,
    score DECIMAL(5,2), -- 0-100
    details JSONB,
    evidence TEXT[],
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Assignments table
CREATE TABLE verification_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status verification_status DEFAULT 'pending',
    priority INTEGER DEFAULT 1, -- 1-5 scale
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Evidence table
CREATE TABLE verification_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES verification_results(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'link', 'reference'
    evidence_data JSONB NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Settings table
CREATE TABLE verification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_level verification_level NOT NULL,
    check_type verification_check_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    weight DECIMAL(5,2) DEFAULT 1.00,
    threshold DECIMAL(5,2) DEFAULT 70.00,
    auto_approve BOOLEAN DEFAULT FALSE,
    requires_review BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(verification_level, check_type)
);

-- Verification Analytics table
CREATE TABLE verification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    verification_level verification_level NOT NULL,
    total_verifications INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    flagged_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    avg_processing_time INTERVAL,
    avg_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date, verification_level)
);

-- Reviewer Performance table
CREATE TABLE reviewer_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    verifications_completed INTEGER DEFAULT 0,
    avg_review_time INTERVAL,
    accuracy_score DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(reviewer_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_content_verifications_content ON content_verifications(content_id, content_type);
CREATE INDEX idx_content_verifications_level ON content_verifications(verification_level);
CREATE INDEX idx_content_verifications_status ON content_verifications(status);
CREATE INDEX idx_content_verifications_submitted ON content_verifications(submitted_by);
CREATE INDEX idx_content_verifications_created ON content_verifications(created_at);

CREATE INDEX idx_verification_checks_verification ON verification_checks(verification_id);
CREATE INDEX idx_verification_checks_type ON verification_checks(check_type);
CREATE INDEX idx_verification_checks_required ON verification_checks(is_required);

CREATE INDEX idx_verification_results_verification ON verification_results(verification_id);
CREATE INDEX idx_verification_results_check ON verification_results(check_id);
CREATE INDEX idx_verification_results_result ON verification_results(result);
CREATE INDEX idx_verification_results_reviewer ON verification_results(reviewer_id);

CREATE INDEX idx_verification_assignments_verification ON verification_assignments(verification_id);
CREATE INDEX idx_verification_assignments_reviewer ON verification_assignments(reviewer_id);
CREATE INDEX idx_verification_assignments_status ON verification_assignments(status);
CREATE INDEX idx_verification_assignments_due ON verification_assignments(due_date);

CREATE INDEX idx_verification_evidence_result ON verification_evidence(result_id);
CREATE INDEX idx_verification_evidence_type ON verification_evidence(evidence_type);

CREATE INDEX idx_verification_settings_level ON verification_settings(verification_level);
CREATE INDEX idx_verification_settings_check ON verification_settings(check_type);
CREATE INDEX idx_verification_settings_enabled ON verification_settings(is_enabled);

CREATE INDEX idx_verification_analytics_date ON verification_analytics(date);
CREATE INDEX idx_verification_analytics_level ON verification_analytics(verification_level);

CREATE INDEX idx_reviewer_performance_reviewer ON reviewer_performance(reviewer_id);
CREATE INDEX idx_reviewer_performance_date ON reviewer_performance(date);

-- Enable RLS
ALTER TABLE content_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_verifications
CREATE POLICY "Enable read access for all users" ON content_verifications FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON content_verifications FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Enable update for reviewers and submitters" ON content_verifications FOR UPDATE USING (
    auth.uid() = submitted_by OR 
    EXISTS (SELECT 1 FROM verification_assignments WHERE verification_id = id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable delete for submitters" ON content_verifications FOR DELETE USING (auth.uid() = submitted_by);

-- RLS Policies for verification_checks
CREATE POLICY "Enable read access for all users" ON verification_checks FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON verification_checks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON verification_checks FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON verification_checks FOR DELETE USING (TRUE);

-- RLS Policies for verification_results
CREATE POLICY "Enable read access for all users" ON verification_results FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for reviewers" ON verification_results FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Enable update for reviewers" ON verification_results FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable delete for reviewers" ON verification_results FOR DELETE USING (auth.uid() = reviewer_id);

-- RLS Policies for verification_assignments
CREATE POLICY "Enable read access for assigned reviewers" ON verification_assignments FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable insert for system" ON verification_assignments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for assigned reviewers" ON verification_assignments FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable delete for system" ON verification_assignments FOR DELETE USING (TRUE);

-- RLS Policies for verification_evidence
CREATE POLICY "Enable read access for all users" ON verification_evidence FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for reviewers" ON verification_evidence FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable update for reviewers" ON verification_evidence FOR UPDATE USING (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable delete for reviewers" ON verification_evidence FOR DELETE USING (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);

-- RLS Policies for verification_settings
CREATE POLICY "Enable read access for all users" ON verification_settings FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for admins" ON verification_settings FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Enable update for admins" ON verification_settings FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Enable delete for admins" ON verification_settings FOR DELETE USING (auth.role() = 'admin');

-- RLS Policies for verification_analytics
CREATE POLICY "Enable read access for all users" ON verification_analytics FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON verification_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON verification_analytics FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON verification_analytics FOR DELETE USING (TRUE);

-- RLS Policies for reviewer_performance
CREATE POLICY "Enable read access for own performance" ON reviewer_performance FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable insert for system" ON reviewer_performance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON reviewer_performance FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON reviewer_performance FOR DELETE USING (TRUE);

-- Create functions for content verification
CREATE OR REPLACE FUNCTION calculate_verification_score(verification_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_weight DECIMAL(5,2) := 0;
    weighted_score DECIMAL(5,2) := 0;
    check_record RECORD;
    result_record RECORD;
BEGIN
    -- Calculate weighted score based on verification results
    FOR check_record IN 
        SELECT vc.id, vc.weight, vc.is_required
        FROM verification_checks vc
        WHERE vc.verification_id = verification_uuid
    LOOP
        -- Get the latest result for this check
        SELECT vr.score, vr.result
        INTO result_record
        FROM verification_results vr
        WHERE vr.check_id = check_record.id
        ORDER BY vr.reviewed_at DESC
        LIMIT 1;
        
        IF result_record IS NOT NULL THEN
            total_weight := total_weight + check_record.weight;
            
            IF result_record.result = 'pass' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight);
            ELSIF result_record.result = 'warning' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight * 0.7);
            ELSIF result_record.result = 'fail' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight * 0.3);
            END IF;
        END IF;
    END LOOP;
    
    -- Return calculated score
    IF total_weight > 0 THEN
        RETURN ROUND(weighted_score / total_weight, 2);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update verification status
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS TRIGGER AS $$
DECLARE
    verification_score DECIMAL(5,2);
    verification_status verification_status;
    required_checks_count INTEGER;
    completed_checks_count INTEGER;
BEGIN
    -- Calculate overall score
    verification_score := calculate_verification_score(NEW.verification_id);
    
    -- Count required checks
    SELECT COUNT(*)
    INTO required_checks_count
    FROM verification_checks vc
    WHERE vc.verification_id = NEW.verification_id
    AND vc.is_required = TRUE;
    
    -- Count completed required checks
    SELECT COUNT(*)
    INTO completed_checks_count
    FROM verification_checks vc
    JOIN verification_results vr ON vc.id = vr.check_id
    WHERE vc.verification_id = NEW.verification_id
    AND vc.is_required = TRUE
    AND vr.result IN ('pass', 'fail', 'warning');
    
    -- Determine status based on score and completion
    IF completed_checks_count < required_checks_count THEN
        verification_status := 'pending';
    ELSIF verification_score >= 80 THEN
        verification_status := 'approved';
    ELSIF verification_score >= 60 THEN
        verification_status := 'needs_review';
    ELSE
        verification_status := 'rejected';
    END IF;
    
    -- Update verification status
    UPDATE content_verifications
    SET overall_score = verification_score,
        status = verification_status,
        completed_at = CASE WHEN verification_status IN ('approved', 'rejected') THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = NEW.verification_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification status updates
CREATE TRIGGER update_verification_status_trigger
    AFTER INSERT OR UPDATE ON verification_results
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_status();

-- Create function to assign verification to reviewers
CREATE OR REPLACE FUNCTION assign_verification_to_reviewers(
    verification_uuid UUID,
    reviewer_ids UUID[],
    due_hours INTEGER DEFAULT 72
)
RETURNS VOID AS $$
DECLARE
    reviewer_id UUID;
BEGIN
    -- Assign to each reviewer
    FOREACH reviewer_id IN ARRAY reviewer_ids
    LOOP
        INSERT INTO verification_assignments (
            verification_id,
            reviewer_id,
            due_date,
            priority
        ) VALUES (
            verification_uuid,
            reviewer_id,
            now() + (due_hours || ' hours')::INTERVAL,
            1
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get verification statistics
CREATE OR REPLACE FUNCTION get_verification_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    verification_level verification_level,
    total_count BIGINT,
    approved_count BIGINT,
    rejected_count BIGINT,
    pending_count BIGINT,
    avg_score DECIMAL(5,2),
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.verification_level,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE cv.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE cv.status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE cv.status = 'pending') as pending_count,
        ROUND(AVG(cv.overall_score), 2) as avg_score,
        AVG(cv.completed_at - cv.submitted_at) as avg_processing_time
    FROM content_verifications cv
    WHERE cv.submitted_at::DATE BETWEEN start_date AND end_date
    GROUP BY cv.verification_level;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 12. SEARCH SYSTEM (011_search_system.sql)
-- =====================================================

-- Smart Search & Discovery System
-- Migration: 011_search_system.sql

-- Create ENUM types for search system
CREATE TYPE search_operator AS ENUM ('AND', 'OR', 'NOT', 'PHRASE', 'FUZZY');
CREATE TYPE search_filter_type AS ENUM ('category', 'format', 'difficulty', 'language', 'date_range', 'author', 'tags');
CREATE TYPE search_result_type AS ENUM ('content', 'user', 'halaqa', 'learning_path', 'study_group');

-- Search Synonyms table
CREATE TABLE search_synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(255) NOT NULL,
    synonyms TEXT[] NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(word, language)
);

-- User Search History table
CREATE TABLE user_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    processed_query TEXT,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2),
    search_time INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Saved Searches table
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content Relationships table
CREATE TABLE content_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content_id UUID NOT NULL,
    source_content_type VARCHAR(50) NOT NULL,
    target_content_id UUID NOT NULL,
    target_content_type VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL, -- 'prerequisite', 'related', 'series', 'similar'
    strength DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
    is_bidirectional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(source_content_id, source_content_type, target_content_id, target_content_type, relationship_type),
    -- Add check constraints to ensure content_type is valid
    CONSTRAINT valid_source_content_type CHECK (source_content_type IN ('content_submission', 'imported_content', 'learning_path', 'study_group')),
    CONSTRAINT valid_target_content_type CHECK (target_content_type IN ('content_submission', 'imported_content', 'learning_path', 'study_group'))
);

-- Function to validate content relationships
CREATE OR REPLACE FUNCTION validate_content_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate source content exists
    IF NEW.source_content_type = 'content_submission' THEN
        IF NOT EXISTS (SELECT 1 FROM content_submissions WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source content_submission with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'imported_content' THEN
        IF NOT EXISTS (SELECT 1 FROM imported_content WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source imported_content with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'learning_path' THEN
        IF NOT EXISTS (SELECT 1 FROM learning_paths WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source learning_path with id % does not exist', NEW.source_content_id;
        END IF;
    ELSIF NEW.source_content_type = 'study_group' THEN
        IF NOT EXISTS (SELECT 1 FROM study_groups WHERE id = NEW.source_content_id) THEN
            RAISE EXCEPTION 'Source study_group with id % does not exist', NEW.source_content_id;
        END IF;
    END IF;

    -- Validate target content exists
    IF NEW.target_content_type = 'content_submission' THEN
        IF NOT EXISTS (SELECT 1 FROM content_submissions WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target content_submission with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'imported_content' THEN
        IF NOT EXISTS (SELECT 1 FROM imported_content WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target imported_content with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'learning_path' THEN
        IF NOT EXISTS (SELECT 1 FROM learning_paths WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target learning_path with id % does not exist', NEW.target_content_id;
        END IF;
    ELSIF NEW.target_content_type = 'study_group' THEN
        IF NOT EXISTS (SELECT 1 FROM study_groups WHERE id = NEW.target_content_id) THEN
            RAISE EXCEPTION 'Target study_group with id % does not exist', NEW.target_content_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate content relationships
CREATE TRIGGER validate_content_relationship_trigger
    BEFORE INSERT OR UPDATE ON content_relationships
    FOR EACH ROW
    EXECUTE FUNCTION validate_content_relationship();

-- Editorial Picks table
CREATE TABLE editorial_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    featured_image_url TEXT,
    picker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Search Analytics table
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    query TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    unique_users INTEGER DEFAULT 1,
    avg_results_count DECIMAL(10,2) DEFAULT 0,
    avg_click_through_rate DECIMAL(5,2) DEFAULT 0,
    avg_search_time INTERVAL,
    no_results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date, query)
);

-- Search Suggestions table
CREATE TABLE search_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion TEXT NOT NULL,
    suggestion_type VARCHAR(50) NOT NULL, -- 'popular', 'trending', 'related', 'autocomplete'
    category VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Search Filters table
CREATE TABLE search_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filter_type search_filter_type NOT NULL,
    filter_value VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(filter_type, filter_value)
);

-- Search Performance table
CREATE TABLE search_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT NOT NULL,
    execution_time INTERVAL,
    results_count INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    index_used TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_search_synonyms_word ON search_synonyms(word);
CREATE INDEX idx_search_synonyms_language ON search_synonyms(language);
CREATE INDEX idx_search_synonyms_active ON search_synonyms(is_active);
CREATE INDEX idx_search_synonyms_synonyms ON search_synonyms USING GIN(synonyms);

CREATE INDEX idx_user_search_history_user ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_created ON user_search_history(created_at);
CREATE INDEX idx_user_search_history_query ON user_search_history(query);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_public ON saved_searches(is_public);
CREATE INDEX idx_saved_searches_usage ON saved_searches(usage_count);

CREATE INDEX idx_content_relationships_source ON content_relationships(source_content_id, source_content_type);
CREATE INDEX idx_content_relationships_target ON content_relationships(target_content_id, target_content_type);
CREATE INDEX idx_content_relationships_type ON content_relationships(relationship_type);
CREATE INDEX idx_content_relationships_strength ON content_relationships(strength);

CREATE INDEX idx_editorial_picks_content ON editorial_picks(content_id, content_type);
CREATE INDEX idx_editorial_picks_category ON editorial_picks(category);
CREATE INDEX idx_editorial_picks_featured ON editorial_picks(is_featured);
CREATE INDEX idx_editorial_picks_active ON editorial_picks(is_active);
CREATE INDEX idx_editorial_picks_dates ON editorial_picks(start_date, end_date);

CREATE INDEX idx_search_analytics_date ON search_analytics(date);
CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_count ON search_analytics(search_count);

CREATE INDEX idx_search_suggestions_type ON search_suggestions(suggestion_type);
CREATE INDEX idx_search_suggestions_category ON search_suggestions(category);
CREATE INDEX idx_search_suggestions_active ON search_suggestions(is_active);
CREATE INDEX idx_search_suggestions_usage ON search_suggestions(usage_count);

CREATE INDEX idx_search_filters_type ON search_filters(filter_type);
CREATE INDEX idx_search_filters_active ON search_filters(is_active);
CREATE INDEX idx_search_filters_usage ON search_filters(usage_count);

CREATE INDEX idx_search_performance_hash ON search_performance(query_hash);
CREATE INDEX idx_search_performance_time ON search_performance(execution_time);
CREATE INDEX idx_search_performance_created ON search_performance(created_at);

-- Enable RLS
ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_synonyms
CREATE POLICY "Enable read access for all users" ON search_synonyms FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for admins" ON search_synonyms FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Enable update for admins" ON search_synonyms FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Enable delete for admins" ON search_synonyms FOR DELETE USING (auth.role() = 'admin');

-- RLS Policies for user_search_history
CREATE POLICY "Enable read access for own history" ON user_search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON user_search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own history" ON user_search_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own history" ON user_search_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for saved_searches
CREATE POLICY "Enable read access for public searches and own searches" ON saved_searches FOR SELECT USING (
    is_public = TRUE OR auth.uid() = user_id
);
CREATE POLICY "Enable insert for authenticated users" ON saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for search owners" ON saved_searches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for search owners" ON saved_searches FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content_relationships
CREATE POLICY "Enable read access for all users" ON content_relationships FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON content_relationships FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for authenticated users" ON content_relationships FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for authenticated users" ON content_relationships FOR DELETE USING (TRUE);

-- RLS Policies for editorial_picks
CREATE POLICY "Enable read access for all users" ON editorial_picks FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Enable insert for admins and pickers" ON editorial_picks FOR INSERT WITH CHECK (
    auth.role() = 'admin' OR auth.uid() = picker_id
);
CREATE POLICY "Enable update for admins and pickers" ON editorial_picks FOR UPDATE USING (
    auth.role() = 'admin' OR auth.uid() = picker_id
);
CREATE POLICY "Enable delete for admins and pickers" ON editorial_picks FOR DELETE USING (
    auth.role() = 'admin' OR auth.uid() = picker_id
);

-- RLS Policies for search_analytics
CREATE POLICY "Enable read access for all users" ON search_analytics FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON search_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON search_analytics FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON search_analytics FOR DELETE USING (TRUE);

-- RLS Policies for search_suggestions
CREATE POLICY "Enable read access for all users" ON search_suggestions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Enable insert for admins" ON search_suggestions FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Enable update for admins" ON search_suggestions FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Enable delete for admins" ON search_suggestions FOR DELETE USING (auth.role() = 'admin');

-- RLS Policies for search_filters
CREATE POLICY "Enable read access for all users" ON search_filters FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Enable insert for admins" ON search_filters FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Enable update for admins" ON search_filters FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Enable delete for admins" ON search_filters FOR DELETE USING (auth.role() = 'admin');

-- RLS Policies for search_performance
CREATE POLICY "Enable read access for all users" ON search_performance FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON search_performance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON search_performance FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON search_performance FOR DELETE USING (TRUE);

-- Create functions for search system
CREATE OR REPLACE FUNCTION expand_search_query(query_text TEXT, user_language VARCHAR(10) DEFAULT 'en')
RETURNS TEXT AS $$
DECLARE
    expanded_query TEXT := query_text;
    word_record RECORD;
    synonym_list TEXT[];
BEGIN
    -- Split query into words and expand with synonyms
    FOR word_record IN 
        SELECT DISTINCT word, synonyms
        FROM search_synonyms
        WHERE language = user_language
        AND is_active = TRUE
        AND word = ANY(string_to_array(lower(query_text), ' '))
    LOOP
        -- Replace word with (word OR synonym1 OR synonym2)
        synonym_list := array_prepend(word_record.word, word_record.synonyms);
        expanded_query := regexp_replace(
            expanded_query, 
            '\b' || word_record.word || '\b', 
            '(' || array_to_string(synonym_list, ' OR ') || ')', 
            'gi'
        );
    END LOOP;
    
    RETURN expanded_query;
END;
$$ LANGUAGE plpgsql;

-- Create function to process search query
CREATE OR REPLACE FUNCTION process_search_query(
    query_text TEXT,
    user_uuid UUID,
    search_filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
    processed_query TEXT,
    detected_categories TEXT[],
    complexity VARCHAR(20),
    suggestions TEXT[]
) AS $$
DECLARE
    expanded_query TEXT;
    detected_categories TEXT[];
    complexity VARCHAR(20);
    suggestions TEXT[];
BEGIN
    -- Expand query with synonyms
    expanded_query := expand_search_query(query_text);
    
    -- Detect categories based on keywords
    SELECT array_agg(DISTINCT category)
    INTO detected_categories
    FROM search_synonyms
    WHERE language = 'en'
    AND is_active = TRUE
    AND word = ANY(string_to_array(lower(query_text), ' '))
    AND category IS NOT NULL;
    
    -- Determine complexity
    IF array_length(string_to_array(query_text, ' '), 1) > 5 THEN
        complexity := 'complex';
    ELSIF array_length(string_to_array(query_text, ' '), 1) > 2 THEN
        complexity := 'medium';
    ELSE
        complexity := 'simple';
    END IF;
    
    -- Get suggestions
    SELECT array_agg(suggestion)
    INTO suggestions
    FROM search_suggestions
    WHERE is_active = TRUE
    AND suggestion_type = 'related'
    AND suggestion ILIKE '%' || query_text || '%'
    LIMIT 5;
    
    -- Log search history
    INSERT INTO user_search_history (user_id, query, processed_query, filters)
    VALUES (user_uuid, query_text, expanded_query, search_filters);
    
    RETURN QUERY SELECT expanded_query, detected_categories, complexity, suggestions;
END;
$$ LANGUAGE plpgsql;

-- Create function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    suggestion TEXT,
    suggestion_type VARCHAR(50),
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.suggestion,
        ss.suggestion_type,
        ss.usage_count
    FROM search_suggestions ss
    WHERE ss.is_active = TRUE
    AND ss.suggestion ILIKE '%' || partial_query || '%'
    ORDER BY ss.usage_count DESC, ss.suggestion
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to track search performance
CREATE OR REPLACE FUNCTION track_search_performance(
    query_text TEXT,
    execution_time INTERVAL,
    results_count INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
    query_hash VARCHAR(64);
BEGIN
    -- Generate query hash
    query_hash := encode(digest(query_text, 'sha256'), 'hex');
    
    -- Insert performance record
    INSERT INTO search_performance (
        query_hash,
        query_text,
        execution_time,
        results_count,
        cache_hit
    ) VALUES (
        query_hash,
        query_text,
        execution_time,
        results_count,
        cache_hit
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get search analytics
CREATE OR REPLACE FUNCTION get_search_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_searches BIGINT,
    unique_queries BIGINT,
    avg_results_per_query DECIMAL(10,2),
    avg_search_time INTERVAL,
    top_queries TEXT[],
    no_results_queries TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(sa.search_count) as total_searches,
        COUNT(DISTINCT sa.query) as unique_queries,
        ROUND(AVG(sa.avg_results_count), 2) as avg_results_per_query,
        AVG(sa.avg_search_time) as avg_search_time,
        ARRAY(
            SELECT sa2.query 
            FROM search_analytics sa2 
            WHERE sa2.date BETWEEN start_date AND end_date
            ORDER BY sa2.search_count DESC 
            LIMIT 10
        ) as top_queries,
        ARRAY(
            SELECT sa3.query 
            FROM search_analytics sa3 
            WHERE sa3.date BETWEEN start_date AND end_date
            AND sa3.no_results_count > 0
            ORDER BY sa3.no_results_count DESC 
            LIMIT 10
        ) as no_results_queries
    FROM search_analytics sa
    WHERE sa.date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to update search suggestions
CREATE OR REPLACE FUNCTION update_search_suggestions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update usage count for existing suggestions
    UPDATE search_suggestions 
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE suggestion = NEW.query;
    
    -- If suggestion doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO search_suggestions (suggestion, suggestion_type, usage_count)
        VALUES (NEW.query, 'popular', 1)
        ON CONFLICT (suggestion) DO UPDATE SET
            usage_count = search_suggestions.usage_count + 1,
            updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search suggestions
CREATE TRIGGER update_search_suggestions_trigger
    AFTER INSERT ON user_search_history
    FOR EACH ROW
    EXECUTE FUNCTION update_search_suggestions();

-- =====================================================
-- 13. CONTENT ANALYTICS (012_content_analytics.sql)
-- =====================================================

-- Content Performance Analytics
-- Migration: 012_content_analytics.sql

-- Create ENUM types for content analytics
CREATE TYPE engagement_type AS ENUM ('view', 'click', 'beneficial', 'bookmark', 'share', 'comment', 'like');
CREATE TYPE content_format AS ENUM ('article', 'video', 'audio', 'course', 'book', 'quiz', 'assessment');
CREATE TYPE learning_outcome AS ENUM ('completion', 'quiz_pass', 'certificate', 'retention', 'application');

-- Content Analytics table
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    beneficial_marks INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    avg_time_spent INTERVAL,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(content_id, content_type, date)
);

-- Content Engagement table
CREATE TABLE content_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    engagement_type engagement_type NOT NULL,
    engagement_data JSONB,
    session_id VARCHAR(255),
    device_type VARCHAR(50),
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Outcomes table
CREATE TABLE learning_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    outcome_type learning_outcome NOT NULL,
    score DECIMAL(5,2),
    completion_time INTERVAL,
    retention_score DECIMAL(5,2),
    application_score DECIMAL(5,2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content Gaps table
CREATE TABLE content_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_type VARCHAR(50) NOT NULL, -- 'search_no_results', 'user_request', 'category_underserved', 'language_needed'
    query TEXT,
    category VARCHAR(100),
    language VARCHAR(10),
    search_count INTEGER DEFAULT 0,
    user_requests INTEGER DEFAULT 0,
    priority_score DECIMAL(5,2) DEFAULT 0.00,
    suggested_content TEXT[],
    is_addressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content Quality Scores table
CREATE TABLE content_quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    user_rating DECIMAL(3,2), -- 1.00 to 5.00
    scholar_endorsements INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    complaint_count INTEGER DEFAULT 0,
    update_frequency INTEGER DEFAULT 0, -- days since last update
    accuracy_score DECIMAL(5,2) DEFAULT 0.00,
    relevance_score DECIMAL(5,2) DEFAULT 0.00,
    clarity_score DECIMAL(5,2) DEFAULT 0.00,
    overall_quality DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(content_id, content_type)
);

-- Content Performance Views table
CREATE TABLE content_performance_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL, -- 0-23
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(content_id, content_type, date, hour)
);

-- Content Category Performance table
CREATE TABLE content_category_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_content INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    avg_engagement DECIMAL(5,2) DEFAULT 0.00,
    top_content UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(category, date)
);

-- Content Author Performance table
CREATE TABLE content_author_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(author_id, date)
);

-- Content Trend Analysis table
CREATE TABLE content_trend_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    trend_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    trend_date DATE NOT NULL,
    views_trend DECIMAL(5,2) DEFAULT 0.00,
    engagement_trend DECIMAL(5,2) DEFAULT 0.00,
    completion_trend DECIMAL(5,2) DEFAULT 0.00,
    ranking_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(content_id, content_type, trend_period, trend_date)
);

-- Create indexes for performance
CREATE INDEX idx_content_analytics_content ON content_analytics(content_id, content_type);
CREATE INDEX idx_content_analytics_date ON content_analytics(date);
CREATE INDEX idx_content_analytics_engagement ON content_analytics(engagement_score);
CREATE INDEX idx_content_analytics_views ON content_analytics(views);

CREATE INDEX idx_content_engagement_content ON content_engagement(content_id, content_type);
CREATE INDEX idx_content_engagement_user ON content_engagement(user_id);
CREATE INDEX idx_content_engagement_type ON content_engagement(engagement_type);
CREATE INDEX idx_content_engagement_created ON content_engagement(created_at);

CREATE INDEX idx_learning_outcomes_content ON learning_outcomes(content_id, content_type);
CREATE INDEX idx_learning_outcomes_user ON learning_outcomes(user_id);
CREATE INDEX idx_learning_outcomes_type ON learning_outcomes(outcome_type);
CREATE INDEX idx_learning_outcomes_score ON learning_outcomes(score);

CREATE INDEX idx_content_gaps_type ON content_gaps(gap_type);
CREATE INDEX idx_content_gaps_category ON content_gaps(category);
CREATE INDEX idx_content_gaps_priority ON content_gaps(priority_score);
CREATE INDEX idx_content_gaps_addressed ON content_gaps(is_addressed);

CREATE INDEX idx_content_quality_scores_content ON content_quality_scores(content_id, content_type);
CREATE INDEX idx_content_quality_scores_rating ON content_quality_scores(user_rating);
CREATE INDEX idx_content_quality_scores_quality ON content_quality_scores(overall_quality);

CREATE INDEX idx_content_performance_views_content ON content_performance_views(content_id, content_type);
CREATE INDEX idx_content_performance_views_date ON content_performance_views(date);
CREATE INDEX idx_content_performance_views_hour ON content_performance_views(hour);

CREATE INDEX idx_content_category_performance_category ON content_category_performance(category);
CREATE INDEX idx_content_category_performance_date ON content_category_performance(date);
CREATE INDEX idx_content_category_performance_engagement ON content_category_performance(avg_engagement);

CREATE INDEX idx_content_author_performance_author ON content_author_performance(author_id);
CREATE INDEX idx_content_author_performance_date ON content_author_performance(date);
CREATE INDEX idx_content_author_performance_engagement ON content_author_performance(engagement_score);

CREATE INDEX idx_content_trend_analysis_content ON content_trend_analysis(content_id, content_type);
CREATE INDEX idx_content_trend_analysis_period ON content_trend_analysis(trend_period);
CREATE INDEX idx_content_trend_analysis_date ON content_trend_analysis(trend_date);
CREATE INDEX idx_content_trend_analysis_ranking ON content_trend_analysis(ranking_position);

-- Enable RLS
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_category_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_author_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_trend_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_analytics
CREATE POLICY "Enable read access for all users" ON content_analytics FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_analytics FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_analytics FOR DELETE USING (TRUE);

-- RLS Policies for content_engagement
CREATE POLICY "Enable read access for all users" ON content_engagement FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON content_engagement FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own engagement" ON content_engagement FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own engagement" ON content_engagement FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for learning_outcomes
CREATE POLICY "Enable read access for all users" ON learning_outcomes FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own outcomes" ON learning_outcomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own outcomes" ON learning_outcomes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content_gaps
CREATE POLICY "Enable read access for all users" ON content_gaps FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_gaps FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_gaps FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_gaps FOR DELETE USING (TRUE);

-- RLS Policies for content_quality_scores
CREATE POLICY "Enable read access for all users" ON content_quality_scores FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_quality_scores FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_quality_scores FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_quality_scores FOR DELETE USING (TRUE);

-- RLS Policies for content_performance_views
CREATE POLICY "Enable read access for all users" ON content_performance_views FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_performance_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_performance_views FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_performance_views FOR DELETE USING (TRUE);

-- RLS Policies for content_category_performance
CREATE POLICY "Enable read access for all users" ON content_category_performance FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_category_performance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_category_performance FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_category_performance FOR DELETE USING (TRUE);

-- RLS Policies for content_author_performance
CREATE POLICY "Enable read access for all users" ON content_author_performance FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_author_performance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_author_performance FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_author_performance FOR DELETE USING (TRUE);

-- RLS Policies for content_trend_analysis
CREATE POLICY "Enable read access for all users" ON content_trend_analysis FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_trend_analysis FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_trend_analysis FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_trend_analysis FOR DELETE USING (TRUE);

-- Create functions for content analytics
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    content_uuid UUID,
    content_type_param VARCHAR(50)
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    views_count INTEGER;
    completions_count INTEGER;
    beneficial_count INTEGER;
    bookmarks_count INTEGER;
    shares_count INTEGER;
    comments_count INTEGER;
    likes_count INTEGER;
    engagement_score DECIMAL(5,2);
BEGIN
    -- Get engagement metrics
    SELECT 
        COALESCE(views, 0),
        COALESCE(completions, 0),
        COALESCE(beneficial_marks, 0),
        COALESCE(bookmarks, 0),
        COALESCE(shares, 0),
        COALESCE(comments, 0),
        COALESCE(likes, 0)
    INTO views_count, completions_count, beneficial_count, bookmarks_count, shares_count, comments_count, likes_count
    FROM content_analytics
    WHERE content_id = content_uuid AND content_type = content_type_param
    ORDER BY date DESC
    LIMIT 1;
    
    -- Calculate engagement score (weighted formula)
    engagement_score := (
        (completions_count * 10.0) +
        (beneficial_count * 5.0) +
        (bookmarks_count * 3.0) +
        (shares_count * 2.0) +
        (comments_count * 1.5) +
        (likes_count * 1.0)
    ) / GREATEST(views_count, 1);
    
    RETURN ROUND(engagement_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to track content engagement
CREATE OR REPLACE FUNCTION track_content_engagement(
    content_uuid UUID,
    content_type_param VARCHAR(50),
    user_uuid UUID,
    engagement_type_param engagement_type,
    engagement_data_param JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
    -- Insert engagement record
    INSERT INTO content_engagement (
        content_id,
        content_type,
        user_id,
        engagement_type,
        engagement_data
    ) VALUES (
        content_uuid,
        content_type_param,
        user_uuid,
        engagement_type_param,
        engagement_data_param
    );
    
    -- Update daily analytics
    INSERT INTO content_analytics (
        content_id,
        content_type,
        date,
        views,
        unique_views,
        completions,
        beneficial_marks,
        bookmarks,
        shares,
        comments,
        likes
    ) VALUES (
        content_uuid,
        content_type_param,
        CURRENT_DATE,
        CASE WHEN engagement_type_param = 'view' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'view' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'completion' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'beneficial' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'bookmark' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'share' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'comment' THEN 1 ELSE 0 END,
        CASE WHEN engagement_type_param = 'like' THEN 1 ELSE 0 END
    )
    ON CONFLICT (content_id, content_type, date)
    DO UPDATE SET
        views = content_analytics.views + CASE WHEN engagement_type_param = 'view' THEN 1 ELSE 0 END,
        unique_views = content_analytics.unique_views + CASE WHEN engagement_type_param = 'view' THEN 1 ELSE 0 END,
        completions = content_analytics.completions + CASE WHEN engagement_type_param = 'completion' THEN 1 ELSE 0 END,
        beneficial_marks = content_analytics.beneficial_marks + CASE WHEN engagement_type_param = 'beneficial' THEN 1 ELSE 0 END,
        bookmarks = content_analytics.bookmarks + CASE WHEN engagement_type_param = 'bookmark' THEN 1 ELSE 0 END,
        shares = content_analytics.shares + CASE WHEN engagement_type_param = 'share' THEN 1 ELSE 0 END,
        comments = content_analytics.comments + CASE WHEN engagement_type_param = 'comment' THEN 1 ELSE 0 END,
        likes = content_analytics.likes + CASE WHEN engagement_type_param = 'like' THEN 1 ELSE 0 END,
        engagement_score = calculate_engagement_score(content_uuid, content_type_param);
END;
$$ LANGUAGE plpgsql;

-- Create function to get content performance metrics
CREATE OR REPLACE FUNCTION get_content_performance_metrics(
    content_uuid UUID,
    content_type_param VARCHAR(50),
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_views BIGINT,
    total_completions BIGINT,
    total_beneficial BIGINT,
    total_bookmarks BIGINT,
    total_shares BIGINT,
    avg_engagement DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    engagement_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(ca.views) as total_views,
        SUM(ca.completions) as total_completions,
        SUM(ca.beneficial_marks) as total_beneficial,
        SUM(ca.bookmarks) as total_bookmarks,
        SUM(ca.shares) as total_shares,
        ROUND(AVG(ca.engagement_score), 2) as avg_engagement,
        ROUND(
            (SUM(ca.completions)::DECIMAL / GREATEST(SUM(ca.views), 1)) * 100, 
            2
        ) as completion_rate,
        ROUND(
            ((SUM(ca.beneficial_marks) + SUM(ca.bookmarks) + SUM(ca.shares))::DECIMAL / GREATEST(SUM(ca.views), 1)) * 100, 
            2
        ) as engagement_rate
    FROM content_analytics ca
    WHERE ca.content_id = content_uuid 
    AND ca.content_type = content_type_param
    AND ca.date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to identify content gaps
CREATE OR REPLACE FUNCTION identify_content_gaps()
RETURNS VOID AS $$
BEGIN
    -- Identify search queries with no results
    INSERT INTO content_gaps (gap_type, query, search_count, priority_score)
    SELECT 
        'search_no_results',
        sa.query,
        sa.no_results_count,
        sa.no_results_count::DECIMAL / sa.search_count * 100
    FROM search_analytics sa
    WHERE sa.no_results_count > 0
    AND sa.date >= CURRENT_DATE - INTERVAL '7 days'
    ON CONFLICT (gap_type, query) DO UPDATE SET
        search_count = content_gaps.search_count + EXCLUDED.search_count,
        priority_score = GREATEST(content_gaps.priority_score, EXCLUDED.priority_score);
    
    -- Identify underserved categories
    INSERT INTO content_gaps (gap_type, category, priority_score)
    SELECT 
        'category_underserved',
        ccp.category,
        (100 - ccp.avg_engagement) * ccp.total_views / 1000
    FROM content_category_performance ccp
    WHERE ccp.avg_engagement < 50
    AND ccp.date >= CURRENT_DATE - INTERVAL '7 days'
    ON CONFLICT (gap_type, category) DO UPDATE SET
        priority_score = GREATEST(content_gaps.priority_score, EXCLUDED.priority_score);
END;
$$ LANGUAGE plpgsql;

-- Create function to update content quality scores
CREATE OR REPLACE FUNCTION update_content_quality_scores(
    content_uuid UUID,
    content_type_param VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
    user_rating_avg DECIMAL(3,2);
    scholar_endorsements_count INTEGER;
    report_count_total INTEGER;
    complaint_count_total INTEGER;
    accuracy_score_calc DECIMAL(5,2);
    relevance_score_calc DECIMAL(5,2);
    clarity_score_calc DECIMAL(5,2);
    overall_quality_calc DECIMAL(5,2);
BEGIN
    -- Calculate quality metrics
    SELECT 
        COALESCE(AVG(user_rating), 0),
        COUNT(*) FILTER (WHERE scholar_endorsements > 0),
        COALESCE(SUM(report_count), 0),
        COALESCE(SUM(complaint_count), 0)
    INTO user_rating_avg, scholar_endorsements_count, report_count_total, complaint_count_total
    FROM content_quality_scores
    WHERE content_id = content_uuid AND content_type = content_type_param;
    
    -- Calculate individual scores
    accuracy_score_calc := user_rating_avg * 20; -- Convert 1-5 to 0-100
    relevance_score_calc := LEAST(100, scholar_endorsements_count * 10);
    clarity_score_calc := GREATEST(0, 100 - (report_count_total + complaint_count_total) * 5);
    
    -- Calculate overall quality
    overall_quality_calc := (accuracy_score_calc + relevance_score_calc + clarity_score_calc) / 3;
    
    -- Update or insert quality scores
    INSERT INTO content_quality_scores (
        content_id,
        content_type,
        user_rating,
        scholar_endorsements,
        report_count,
        complaint_count,
        accuracy_score,
        relevance_score,
        clarity_score,
        overall_quality
    ) VALUES (
        content_uuid,
        content_type_param,
        user_rating_avg,
        scholar_endorsements_count,
        report_count_total,
        complaint_count_total,
        accuracy_score_calc,
        relevance_score_calc,
        clarity_score_calc,
        overall_quality_calc
    )
    ON CONFLICT (content_id, content_type)
    DO UPDATE SET
        user_rating = EXCLUDED.user_rating,
        scholar_endorsements = EXCLUDED.scholar_endorsements,
        report_count = EXCLUDED.report_count,
        complaint_count = EXCLUDED.complaint_count,
        accuracy_score = EXCLUDED.accuracy_score,
        relevance_score = EXCLUDED.relevance_score,
        clarity_score = EXCLUDED.clarity_score,
        overall_quality = EXCLUDED.overall_quality,
        last_updated = now();
END;
$$ LANGUAGE plpgsql;
-- Personalization System
-- Migration: 013_personalization.sql

-- Create ENUM types for personalization
CREATE TYPE preference_type AS ENUM ('content', 'notification', 'privacy', 'display', 'learning');
CREATE TYPE behavior_type AS ENUM ('view', 'click', 'bookmark', 'share', 'comment', 'like', 'search', 'study');
CREATE TYPE recommendation_type AS ENUM ('content_based', 'collaborative', 'trending', 'editorial', 'session_based');

-- User Preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    preference_type preference_type NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, preference_type, preference_key)
);

-- User Behavior Logs table
CREATE TABLE user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    behavior_type behavior_type NOT NULL,
    content_id UUID,
    content_type VARCHAR(50),
    session_id VARCHAR(255),
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Profiles table (extended user profiles for personalization)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    interests TEXT[],
    learning_goals TEXT[],
    preferred_languages TEXT[],
    difficulty_preference VARCHAR(20),
    study_time_preference VARCHAR(20),
    content_preferences JSONB,
    notification_preferences JSONB,
    privacy_settings JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Content Recommendations table
CREATE TABLE content_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    recommendation_type recommendation_type NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    reason TEXT,
    is_shown BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Similarity Matrix table
CREATE TABLE user_similarity_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL,
    common_interests INTEGER DEFAULT 0,
    common_behavior_patterns INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user1_id, user2_id)
);

-- Content Similarity Matrix table
CREATE TABLE content_similarity_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content1_id UUID NOT NULL,
    content1_type VARCHAR(50) NOT NULL,
    content2_id UUID NOT NULL,
    content2_type VARCHAR(50) NOT NULL,
    similarity_score DECIMAL(5,2) NOT NULL,
    common_tags INTEGER DEFAULT 0,
    common_categories INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(content1_id, content1_type, content2_id, content2_type)
);

-- Personalization Analytics table
CREATE TABLE personalization_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    recommendations_shown INTEGER DEFAULT 0,
    recommendations_clicked INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0.00,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    diversity_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
CREATE INDEX idx_user_preferences_active ON user_preferences(is_active);

CREATE INDEX idx_user_behavior_logs_user ON user_behavior_logs(user_id);
CREATE INDEX idx_user_behavior_logs_type ON user_behavior_logs(behavior_type);
CREATE INDEX idx_user_behavior_logs_content ON user_behavior_logs(content_id, content_type);
CREATE INDEX idx_user_behavior_logs_timestamp ON user_behavior_logs(timestamp);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN(interests);
CREATE INDEX idx_user_profiles_goals ON user_profiles USING GIN(learning_goals);

CREATE INDEX idx_content_recommendations_user ON content_recommendations(user_id);
CREATE INDEX idx_content_recommendations_content ON content_recommendations(content_id, content_type);
CREATE INDEX idx_content_recommendations_type ON content_recommendations(recommendation_type);
CREATE INDEX idx_content_recommendations_score ON content_recommendations(score);
CREATE INDEX idx_content_recommendations_shown ON content_recommendations(is_shown);

CREATE INDEX idx_user_similarity_matrix_user1 ON user_similarity_matrix(user1_id);
CREATE INDEX idx_user_similarity_matrix_user2 ON user_similarity_matrix(user2_id);
CREATE INDEX idx_user_similarity_matrix_score ON user_similarity_matrix(similarity_score);

CREATE INDEX idx_content_similarity_matrix_content1 ON content_similarity_matrix(content1_id, content1_type);
CREATE INDEX idx_content_similarity_matrix_content2 ON content_similarity_matrix(content2_id, content2_type);
CREATE INDEX idx_content_similarity_matrix_score ON content_similarity_matrix(similarity_score);

CREATE INDEX idx_personalization_analytics_user ON personalization_analytics(user_id);
CREATE INDEX idx_personalization_analytics_date ON personalization_analytics(date);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_similarity_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_similarity_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Enable read access for own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_behavior_logs
CREATE POLICY "Enable read access for own behavior" ON user_behavior_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own behavior" ON user_behavior_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own behavior" ON user_behavior_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own behavior" ON user_behavior_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Enable read access for own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for content_recommendations
CREATE POLICY "Enable read access for own recommendations" ON content_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for system" ON content_recommendations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for own recommendations" ON content_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own recommendations" ON content_recommendations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_similarity_matrix
CREATE POLICY "Enable read access for own similarities" ON user_similarity_matrix FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Enable insert for system" ON user_similarity_matrix FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON user_similarity_matrix FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON user_similarity_matrix FOR DELETE USING (TRUE);

-- RLS Policies for content_similarity_matrix
CREATE POLICY "Enable read access for all users" ON content_similarity_matrix FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON content_similarity_matrix FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON content_similarity_matrix FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON content_similarity_matrix FOR DELETE USING (TRUE);

-- RLS Policies for personalization_analytics
CREATE POLICY "Enable read access for own analytics" ON personalization_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for system" ON personalization_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON personalization_analytics FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON personalization_analytics FOR DELETE USING (TRUE);

-- Create functions for personalization
CREATE OR REPLACE FUNCTION update_user_profile(
    user_uuid UUID,
    interests_param TEXT[] DEFAULT NULL,
    learning_goals_param TEXT[] DEFAULT NULL,
    preferred_languages_param TEXT[] DEFAULT NULL,
    difficulty_preference_param VARCHAR(20) DEFAULT NULL,
    study_time_preference_param VARCHAR(20) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_profiles (
        user_id,
        interests,
        learning_goals,
        preferred_languages,
        difficulty_preference,
        study_time_preference
    ) VALUES (
        user_uuid,
        COALESCE(interests_param, ARRAY[]::TEXT[]),
        COALESCE(learning_goals_param, ARRAY[]::TEXT[]),
        COALESCE(preferred_languages_param, ARRAY['en']::TEXT[]),
        COALESCE(difficulty_preference_param, 'beginner'),
        COALESCE(study_time_preference_param, 'morning')
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        interests = COALESCE(EXCLUDED.interests, user_profiles.interests),
        learning_goals = COALESCE(EXCLUDED.learning_goals, user_profiles.learning_goals),
        preferred_languages = COALESCE(EXCLUDED.preferred_languages, user_profiles.preferred_languages),
        difficulty_preference = COALESCE(EXCLUDED.difficulty_preference, user_profiles.difficulty_preference),
        study_time_preference = COALESCE(EXCLUDED.study_time_preference, user_profiles.study_time_preference),
        last_updated = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to track user behavior
CREATE OR REPLACE FUNCTION track_user_behavior(
    user_uuid UUID,
    behavior_type_param behavior_type,
    content_uuid UUID DEFAULT NULL,
    content_type_param VARCHAR(50) DEFAULT NULL,
    session_id_param VARCHAR(255) DEFAULT NULL,
    metadata_param JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_behavior_logs (
        user_id,
        behavior_type,
        content_id,
        content_type,
        session_id,
        metadata
    ) VALUES (
        user_uuid,
        behavior_type_param,
        content_uuid,
        content_type_param,
        session_id_param,
        metadata_param
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get personalized recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    content_id UUID,
    content_type VARCHAR(50),
    recommendation_type recommendation_type,
    score DECIMAL(5,2),
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.content_id,
        cr.content_type,
        cr.recommendation_type,
        cr.score,
        cr.reason
    FROM content_recommendations cr
    WHERE cr.user_id = user_uuid
    AND cr.is_shown = FALSE
    ORDER BY cr.score DESC, cr.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate user similarity
CREATE OR REPLACE FUNCTION calculate_user_similarity(
    user1_uuid UUID,
    user2_uuid UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    common_interests_count INTEGER;
    common_behavior_count INTEGER;
    similarity_score DECIMAL(5,2);
BEGIN
    -- Count common interests
    SELECT COUNT(*)
    INTO common_interests_count
    FROM (
        SELECT unnest(up1.interests) as interest
        FROM user_profiles up1
        WHERE up1.user_id = user1_uuid
        INTERSECT
        SELECT unnest(up2.interests) as interest
        FROM user_profiles up2
        WHERE up2.user_id = user2_uuid
    ) common;
    
    -- Count common behavior patterns
    SELECT COUNT(*)
    INTO common_behavior_count
    FROM (
        SELECT content_id, content_type
        FROM user_behavior_logs
        WHERE user_id = user1_uuid
        AND behavior_type IN ('view', 'bookmark', 'like')
        INTERSECT
        SELECT content_id, content_type
        FROM user_behavior_logs
        WHERE user_id = user2_uuid
        AND behavior_type IN ('view', 'bookmark', 'like')
    ) common;
    
    -- Calculate similarity score (0-100)
    similarity_score := LEAST(100, (common_interests_count * 10) + (common_behavior_count * 5));
    
    -- Update or insert similarity
    INSERT INTO user_similarity_matrix (user1_id, user2_id, similarity_score, common_interests, common_behavior_patterns)
    VALUES (user1_uuid, user2_uuid, similarity_score, common_interests_count, common_behavior_count)
    ON CONFLICT (user1_id, user2_id)
    DO UPDATE SET
        similarity_score = EXCLUDED.similarity_score,
        common_interests = EXCLUDED.common_interests,
        common_behavior_patterns = EXCLUDED.common_behavior_patterns,
        last_calculated = now();
    
    RETURN similarity_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate content recommendations
CREATE OR REPLACE FUNCTION generate_content_recommendations(
    user_uuid UUID,
    recommendation_type_param recommendation_type DEFAULT 'content_based'
)
RETURNS VOID AS $$
DECLARE
    user_interests TEXT[];
    user_goals TEXT[];
    difficulty_pref VARCHAR(20);
    rec_content RECORD;
    rec_score DECIMAL(5,2);
BEGIN
    -- Get user preferences
    SELECT interests, learning_goals, difficulty_preference
    INTO user_interests, user_goals, difficulty_pref
    FROM user_profiles
    WHERE user_id = user_uuid;
    
    -- Generate recommendations based on type
    IF recommendation_type_param = 'content_based' THEN
        -- Content-based recommendations using interests and goals
        FOR rec_content IN
            SELECT DISTINCT id as content_id, content_type, 
                   (array_length(user_interests & tags, 1) * 10.0) as base_score
            FROM imported_content
            WHERE tags && user_interests
            ORDER BY base_score DESC
            LIMIT 20
        LOOP
            rec_score := LEAST(100, rec_content.base_score);
            
            INSERT INTO content_recommendations (
                user_id, content_id, content_type, recommendation_type, score, reason
            ) VALUES (
                user_uuid, rec_content.content_id, rec_content.content_type, 
                recommendation_type_param, rec_score, 
                'Based on your interests and learning goals'
            )
            ON CONFLICT (user_id, content_id, content_type, recommendation_type) DO NOTHING;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF MASTER MIGRATION SCRIPT
-- =====================================================

