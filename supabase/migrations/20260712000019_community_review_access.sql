-- Community contribution/review: make the real tables usable.
--
-- The community_contribution tables (migration 20251016000003) postdate the
-- initial schema's GRANT sweep, so `authenticated` never received DML on
-- them — the Contribute/Review features could only ever run on mock data.
-- Grants are narrow and RLS still governs every row.

-- content_submissions reused the moderation content_type enum
-- (post/comment/profile); add the values the contribution feature
-- actually submits.
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'article';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'book';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'translation';

GRANT ALL ON content_submissions TO authenticated;
GRANT ALL ON community_reviews TO authenticated;
GRANT SELECT ON content_categories TO authenticated;
GRANT SELECT ON contributor_stats TO authenticated;

-- The community review queue: any signed-in member may read submissions
-- that are inside the review pipeline (that is what community review is).
-- Drafts stay private to their author; rejected stays author-only.
CREATE POLICY "Community can view submissions under review" ON content_submissions
FOR SELECT USING (status IN ('submitted', 'community_review', 'scholar_review'));
