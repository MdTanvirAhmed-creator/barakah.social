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
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
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
ALTER TABLE imported_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_quality_metrics ENABLE ROW LEVEL SECURITY;

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
