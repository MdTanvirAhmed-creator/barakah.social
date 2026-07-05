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
