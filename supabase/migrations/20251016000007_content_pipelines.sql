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

-- Insert some default content sources for verified scholars
INSERT INTO content_sources (name, type, source_url, scholar_id, auto_approve, quality_score) VALUES
  ('Dr. Yasir Qadhi YouTube', 'youtube_channel', 'https://www.youtube.com/@YasirQadhi', 
   (SELECT id FROM profiles WHERE username = 'yasir_qadhi' LIMIT 1), true, 95),
  ('Shaykh Abdul Nasir Jangda YouTube', 'youtube_channel', 'https://www.youtube.com/@ShaykhAbdulNasirJangda',
   (SELECT id FROM profiles WHERE username = 'abdul_nasir' LIMIT 1), true, 92),
  ('SeekersGuidance RSS', 'rss_feed', 'https://seekersguidance.org/feed/',
   (SELECT id FROM profiles WHERE username = 'seekers_guidance' LIMIT 1), true, 98),
  ('Yaqeen Institute RSS', 'rss_feed', 'https://yaqeeninstitute.org/feed/',
   (SELECT id FROM profiles WHERE username = 'yaqeen_institute' LIMIT 1), true, 96);

-- Create a default content pipeline for RSS feeds
INSERT INTO content_pipelines (name, type, config, schedule, status) VALUES
  ('Islamic RSS Feeds', 'rss', 
   '{"feeds": ["https://seekersguidance.org/feed/", "https://yaqeeninstitute.org/feed/"]}', 
   'daily', 'active'),
  ('Scholar YouTube Channels', 'youtube',
   '{"channels": ["UCxqXjFh7iQ1Q2Q3Q4Q5Q6Q7", "UCyqYjGh8iQ2Q3Q4Q5Q6Q7Q8"]}',
   'daily', 'active');

-- Add comments for documentation
COMMENT ON TABLE content_pipelines IS 'Automated content import pipelines for various sources';
COMMENT ON TABLE content_import_logs IS 'Logs of content import pipeline executions';
COMMENT ON TABLE content_sources IS 'Configured sources for content import (channels, feeds, etc.)';
COMMENT ON COLUMN content_pipelines.config IS 'JSON configuration for the specific pipeline type';
COMMENT ON COLUMN content_pipelines.schedule IS 'Cron-like schedule for automated imports';
COMMENT ON COLUMN content_sources.auto_approve IS 'Whether to auto-approve content from this source';
COMMENT ON COLUMN content_sources.quality_score IS 'Quality score (0-100) for content from this source';
