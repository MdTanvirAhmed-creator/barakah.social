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
    UNIQUE(source_content_id, source_content_type, target_content_id, target_content_type, relationship_type)
);

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
