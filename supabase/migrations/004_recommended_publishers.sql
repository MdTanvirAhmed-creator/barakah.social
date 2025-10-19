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
