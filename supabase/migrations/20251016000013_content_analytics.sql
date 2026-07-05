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
