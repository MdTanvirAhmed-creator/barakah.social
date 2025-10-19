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

