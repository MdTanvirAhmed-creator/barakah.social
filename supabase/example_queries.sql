-- =====================================================
-- Barakah.Social Example Queries
-- Common queries for the application
-- =====================================================

-- =====================================================
-- PROFILE QUERIES
-- =====================================================

-- Get user profile by username
SELECT 
  id,
  username,
  full_name,
  bio,
  avatar_url,
  interests,
  madhab_preference,
  is_verified_scholar,
  beneficial_count,
  joined_at
FROM profiles
WHERE username = 'sheikh_ahmad';

-- Get user's stats
SELECT 
  username,
  beneficial_count,
  (SELECT COUNT(*) FROM posts WHERE author_id = profiles.id) as post_count,
  (SELECT COUNT(*) FROM comments WHERE author_id = profiles.id) as comment_count,
  (SELECT COUNT(*) FROM halaqa_members WHERE user_id = profiles.id) as halaqas_joined
FROM profiles
WHERE id = auth.uid();

-- Search users by username (fuzzy search)
SELECT 
  username,
  full_name,
  avatar_url,
  is_verified_scholar,
  beneficial_count
FROM profiles
WHERE username ILIKE '%ahmad%'
ORDER BY is_verified_scholar DESC, beneficial_count DESC
LIMIT 20;

-- Get verified scholars
SELECT 
  username,
  full_name,
  madhab_preference,
  beneficial_count
FROM profiles
WHERE is_verified_scholar = true
ORDER BY beneficial_count DESC;

-- =====================================================
-- POST QUERIES
-- =====================================================

-- Get latest posts with author information
SELECT 
  p.id,
  p.content,
  p.post_type,
  p.tags,
  p.beneficial_count,
  p.created_at,
  p.is_pinned,
  pr.username,
  pr.full_name,
  pr.avatar_url,
  pr.is_verified_scholar,
  (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
  has_marked_beneficial(p.id, auth.uid()) as user_has_marked_beneficial,
  has_bookmarked(p.id, auth.uid()) as user_has_bookmarked
FROM posts p
INNER JOIN profiles pr ON p.author_id = pr.id
WHERE p.is_deleted = false
ORDER BY p.is_pinned DESC, p.created_at DESC
LIMIT 20;

-- Get posts by tag
SELECT 
  p.id,
  p.content,
  p.post_type,
  p.beneficial_count,
  p.created_at,
  pr.username,
  pr.full_name,
  pr.is_verified_scholar
FROM posts p
INNER JOIN profiles pr ON p.author_id = pr.id
WHERE 'Quran' = ANY(p.tags)
  AND p.is_deleted = false
ORDER BY p.beneficial_count DESC, p.created_at DESC
LIMIT 20;

-- Get trending posts (most beneficial in last 7 days)
SELECT 
  p.id,
  p.content,
  p.beneficial_count,
  p.created_at,
  pr.username,
  pr.full_name,
  pr.is_verified_scholar,
  (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
FROM posts p
INNER JOIN profiles pr ON p.author_id = pr.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
  AND p.is_deleted = false
ORDER BY p.beneficial_count DESC
LIMIT 20;

-- Get user's posts
SELECT 
  id,
  content,
  post_type,
  tags,
  beneficial_count,
  created_at,
  (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
FROM posts
WHERE author_id = auth.uid()
  AND is_deleted = false
ORDER BY created_at DESC;

-- Get user's bookmarked posts
SELECT 
  p.id,
  p.content,
  p.post_type,
  p.beneficial_count,
  p.created_at,
  pr.username,
  pr.full_name,
  pr.is_verified_scholar
FROM posts p
INNER JOIN bookmarks b ON p.id = b.post_id
INNER JOIN profiles pr ON p.author_id = pr.id
WHERE b.user_id = auth.uid()
  AND p.is_deleted = false
ORDER BY b.created_at DESC;

-- =====================================================
-- COMMENT QUERIES
-- =====================================================

-- Get comments for a post (threaded)
WITH RECURSIVE comment_tree AS (
  -- Root comments (no parent)
  SELECT 
    c.id,
    c.post_id,
    c.author_id,
    c.content,
    c.parent_comment_id,
    c.created_at,
    c.beneficial_count,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.is_verified_scholar,
    0 as level,
    ARRAY[c.created_at] as path
  FROM comments c
  INNER JOIN profiles pr ON c.author_id = pr.id
  WHERE c.post_id = '20000000-0000-0000-0000-000000000001'
    AND c.parent_comment_id IS NULL
    AND c.is_deleted = false
  
  UNION ALL
  
  -- Child comments (replies)
  SELECT 
    c.id,
    c.post_id,
    c.author_id,
    c.content,
    c.parent_comment_id,
    c.created_at,
    c.beneficial_count,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.is_verified_scholar,
    ct.level + 1,
    ct.path || c.created_at
  FROM comments c
  INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
  INNER JOIN profiles pr ON c.author_id = pr.id
  WHERE c.is_deleted = false
)
SELECT * FROM comment_tree
ORDER BY path;

-- Get user's recent comments
SELECT 
  c.id,
  c.content,
  c.created_at,
  c.beneficial_count,
  p.content as post_content,
  p.id as post_id
FROM comments c
INNER JOIN posts p ON c.post_id = p.id
WHERE c.author_id = auth.uid()
  AND c.is_deleted = false
ORDER BY c.created_at DESC
LIMIT 20;

-- =====================================================
-- HALAQA QUERIES
-- =====================================================

-- Get public halaqas
SELECT 
  h.id,
  h.name,
  h.description,
  h.category,
  h.member_count,
  h.created_at,
  pr.username as created_by_username,
  pr.full_name as created_by_name
FROM halaqas h
INNER JOIN profiles pr ON h.created_by = pr.id
WHERE h.is_public = true
  AND h.is_active = true
ORDER BY h.member_count DESC;

-- Get user's halaqas
SELECT 
  h.id,
  h.name,
  h.description,
  h.category,
  h.member_count,
  h.is_public,
  hm.role,
  hm.joined_at
FROM halaqas h
INNER JOIN halaqa_members hm ON h.id = hm.halaqa_id
WHERE hm.user_id = auth.uid()
  AND h.is_active = true
ORDER BY hm.joined_at DESC;

-- Get halaqa details with member info
SELECT 
  h.id,
  h.name,
  h.description,
  h.category,
  h.rules,
  h.member_count,
  h.is_public,
  h.created_at,
  pr.username as created_by_username,
  (
    SELECT role 
    FROM halaqa_members 
    WHERE halaqa_id = h.id 
    AND user_id = auth.uid()
  ) as user_role,
  (
    SELECT COUNT(*) 
    FROM halaqa_members 
    WHERE halaqa_id = h.id
  ) as actual_member_count
FROM halaqas h
INNER JOIN profiles pr ON h.created_by = pr.id
WHERE h.id = '10000000-0000-0000-0000-000000000001';

-- Get halaqa members
SELECT 
  pr.id,
  pr.username,
  pr.full_name,
  pr.avatar_url,
  pr.is_verified_scholar,
  hm.role,
  hm.joined_at
FROM halaqa_members hm
INNER JOIN profiles pr ON hm.user_id = pr.id
WHERE hm.halaqa_id = '10000000-0000-0000-0000-000000000001'
ORDER BY 
  CASE hm.role
    WHEN 'admin' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'member' THEN 3
  END,
  hm.joined_at ASC;

-- Search halaqas by name or description
SELECT 
  h.id,
  h.name,
  h.description,
  h.category,
  h.member_count,
  h.is_public
FROM halaqas h
WHERE (
    h.name ILIKE '%quran%' OR
    h.description ILIKE '%quran%'
  )
  AND h.is_public = true
  AND h.is_active = true
ORDER BY h.member_count DESC;

-- =====================================================
-- BENEFICIAL MARKS QUERIES
-- =====================================================

-- Check if user marked a post as beneficial
SELECT has_marked_beneficial(
  '20000000-0000-0000-0000-000000000002'::UUID,
  auth.uid()
);

-- Get users who marked a post as beneficial
SELECT 
  pr.id,
  pr.username,
  pr.full_name,
  pr.avatar_url,
  bm.created_at
FROM beneficial_marks bm
INNER JOIN profiles pr ON bm.user_id = pr.id
WHERE bm.post_id = '20000000-0000-0000-0000-000000000002'
ORDER BY bm.created_at DESC
LIMIT 20;

-- =====================================================
-- REPORT QUERIES
-- =====================================================

-- Get user's reports
SELECT 
  r.id,
  r.content_type,
  r.content_id,
  r.reason,
  r.description,
  r.status,
  r.created_at,
  r.reviewed_at,
  r.resolution_note
FROM reports r
WHERE r.reporter_id = auth.uid()
ORDER BY r.created_at DESC;

-- Get pending reports (for admins/moderators - use service role)
SELECT 
  r.id,
  r.content_type,
  r.content_id,
  r.reason,
  r.description,
  r.created_at,
  pr.username as reporter_username
FROM reports r
INNER JOIN profiles pr ON r.reporter_id = pr.id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- =====================================================
-- ANALYTICS QUERIES
-- =====================================================

-- Get platform statistics
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_verified_scholar = true) as verified_scholars,
  (SELECT COUNT(*) FROM posts WHERE is_deleted = false) as total_posts,
  (SELECT COUNT(*) FROM comments WHERE is_deleted = false) as total_comments,
  (SELECT COUNT(*) FROM halaqas WHERE is_active = true) as active_halaqas,
  (SELECT SUM(member_count) FROM halaqas WHERE is_active = true) as total_halaqa_memberships;

-- Get most active users (by posts and comments)
SELECT 
  pr.username,
  pr.full_name,
  pr.is_verified_scholar,
  pr.beneficial_count,
  (SELECT COUNT(*) FROM posts WHERE author_id = pr.id AND is_deleted = false) as post_count,
  (SELECT COUNT(*) FROM comments WHERE author_id = pr.id AND is_deleted = false) as comment_count,
  (
    (SELECT COUNT(*) FROM posts WHERE author_id = pr.id AND is_deleted = false) +
    (SELECT COUNT(*) FROM comments WHERE author_id = pr.id AND is_deleted = false)
  ) as total_contributions
FROM profiles pr
ORDER BY total_contributions DESC
LIMIT 10;

-- Get most popular halaqas
SELECT 
  h.name,
  h.category,
  h.member_count,
  h.created_at,
  pr.username as created_by
FROM halaqas h
INNER JOIN profiles pr ON h.created_by = pr.id
WHERE h.is_active = true
ORDER BY h.member_count DESC
LIMIT 10;

-- Get trending tags
SELECT 
  tag,
  COUNT(*) as usage_count
FROM posts,
UNNEST(tags) AS tag
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND is_deleted = false
GROUP BY tag
ORDER BY usage_count DESC
LIMIT 20;

-- =====================================================
-- MODERATION QUERIES
-- =====================================================

-- Get reported content with details
SELECT 
  r.id as report_id,
  r.content_type,
  r.reason,
  r.description as report_description,
  r.status,
  r.created_at as reported_at,
  reporter.username as reporter_username,
  CASE r.content_type
    WHEN 'post' THEN (SELECT content FROM posts WHERE id = r.content_id)
    WHEN 'comment' THEN (SELECT content FROM comments WHERE id = r.content_id)
    WHEN 'profile' THEN (SELECT bio FROM profiles WHERE id = r.content_id)
  END as content,
  CASE r.content_type
    WHEN 'post' THEN (SELECT username FROM profiles WHERE id = (SELECT author_id FROM posts WHERE id = r.content_id))
    WHEN 'comment' THEN (SELECT username FROM profiles WHERE id = (SELECT author_id FROM comments WHERE id = r.content_id))
    WHEN 'profile' THEN (SELECT username FROM profiles WHERE id = r.content_id)
  END as content_author_username
FROM reports r
INNER JOIN profiles reporter ON r.reporter_id = reporter.id
WHERE r.status = 'pending'
ORDER BY r.created_at ASC;

-- =====================================================
-- SEARCH QUERIES
-- =====================================================

-- Full-text search for posts
SELECT 
  p.id,
  p.content,
  p.post_type,
  p.beneficial_count,
  p.created_at,
  pr.username,
  pr.full_name,
  pr.is_verified_scholar,
  ts_rank(
    to_tsvector('english', p.content),
    plainto_tsquery('english', 'prayer traveling')
  ) as relevance
FROM posts p
INNER JOIN profiles pr ON p.author_id = pr.id
WHERE to_tsvector('english', p.content) @@ plainto_tsquery('english', 'prayer traveling')
  AND p.is_deleted = false
ORDER BY relevance DESC, p.beneficial_count DESC
LIMIT 20;

-- Search across posts and comments
(
  SELECT 
    'post' as type,
    p.id,
    p.content,
    p.created_at,
    pr.username,
    pr.full_name,
    p.beneficial_count as engagement
  FROM posts p
  INNER JOIN profiles pr ON p.author_id = pr.id
  WHERE p.content ILIKE '%salah%'
    AND p.is_deleted = false
)
UNION ALL
(
  SELECT 
    'comment' as type,
    c.id,
    c.content,
    c.created_at,
    pr.username,
    pr.full_name,
    c.beneficial_count as engagement
  FROM comments c
  INNER JOIN profiles pr ON c.author_id = pr.id
  WHERE c.content ILIKE '%salah%'
    AND c.is_deleted = false
)
ORDER BY engagement DESC, created_at DESC
LIMIT 20;

-- =====================================================
-- END OF EXAMPLE QUERIES
-- =====================================================

