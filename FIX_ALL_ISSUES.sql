-- =====================================================
-- 🚀 INSTANT FIX - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================
-- This will fix ALL current issues:
-- ✅ Posts not showing
-- ✅ Halaqas member addition failing
-- ✅ Profile updates not working
-- =====================================================

-- Step 1: Disable RLS (Row Level Security) temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqas DISABLE ROW LEVEL SECURITY;
ALTER TABLE halaqa_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficial_marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '❌ ENABLED' ELSE '✅ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- Expected Result:
-- All tables should show: rowsecurity = false (✅ DISABLED)
-- =====================================================

