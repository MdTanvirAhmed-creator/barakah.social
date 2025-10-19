-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT/TESTING
-- =====================================================
-- Run this SQL in Supabase SQL Editor to temporarily
-- disable Row Level Security and allow all operations
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqas DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqa_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficial_marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected result: rowsecurity = false for all tables

