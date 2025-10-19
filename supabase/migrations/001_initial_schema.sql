-- =====================================================
-- Barakah.Social Database Schema
-- Initial Migration
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

-- Moderators and admins can view all reports (implement via service role or function)
-- For now, users can only see their own reports

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
-- INITIAL DATA (Optional)
-- =====================================================

-- You can add some initial madhab categories or halaqa categories here
-- For example:
-- INSERT INTO halaqa_categories (name, description) VALUES
-- ('Fiqh', 'Islamic jurisprudence discussions'),
-- ('Aqeedah', 'Islamic theology and beliefs');

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
-- END OF MIGRATION
-- =====================================================

