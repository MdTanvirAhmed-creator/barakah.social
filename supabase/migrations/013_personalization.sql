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
            SELECT DISTINCT content_id, content_type, 
                   (array_length(user_interests & tags, 1) * 10.0 + 
                    array_length(user_goals & categories, 1) * 5.0) as base_score
            FROM content_items -- Assuming this table exists
            WHERE tags && user_interests OR categories && user_goals
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
