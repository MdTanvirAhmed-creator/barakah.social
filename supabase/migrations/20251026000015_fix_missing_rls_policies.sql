-- =====================================================
-- BARAKAH.SOCIAL - FIX MISSING RLS POLICIES
-- =====================================================
-- This script fixes missing RLS policies for contributor_badges and content_categories tables
-- =====================================================

-- Enable RLS on contributor_badges table
ALTER TABLE contributor_badges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on content_categories table
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contributor_badges
CREATE POLICY "Anyone can view badges" ON contributor_badges
FOR SELECT USING (true);

CREATE POLICY "Only admins can insert badges" ON contributor_badges
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update badges" ON contributor_badges
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete badges" ON contributor_badges
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create RLS policies for content_categories
CREATE POLICY "Anyone can view content categories" ON content_categories
FOR SELECT USING (true);

CREATE POLICY "Only admins can insert content categories" ON content_categories
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update content categories" ON content_categories
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete content categories" ON content_categories
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- =====================================================
-- END OF FIX
-- =====================================================
