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
