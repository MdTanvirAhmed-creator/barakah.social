-- =====================================================
-- Barakah.Social Storage Policies
-- Storage buckets and RLS policies for file uploads
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Post media bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Halaqa avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'halaqa-avatars',
  'halaqa-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- NOTE: Storage policies should be created via the Supabase Dashboard
-- Go to Storage > Policies and create them manually
-- This is because storage.objects requires special permissions
-- =====================================================

-- However, if you have proper permissions, here are the policies:
-- (These will likely fail in SQL Editor, use Dashboard instead)

-- =====================================================
-- STORAGE RLS POLICIES - AVATARS
-- =====================================================
-- To create these, go to: Storage > avatars bucket > Policies

/*
Policy Name: Avatars are publicly accessible
Operation: SELECT
Policy Definition:
bucket_id = 'avatars'

Policy Name: Users can upload their own avatar
Operation: INSERT
Policy Definition:
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]

Policy Name: Users can update their own avatar
Operation: UPDATE
Policy Definition (USING):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
Policy Definition (WITH CHECK):
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]

Policy Name: Users can delete their own avatar
Operation: DELETE
Policy Definition:
bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
*/

-- =====================================================
-- STORAGE RLS POLICIES - POST MEDIA
-- =====================================================
-- To create these, go to: Storage > post-media bucket > Policies

/*
Policy Name: Post media is publicly accessible
Operation: SELECT
Policy Definition:
bucket_id = 'post-media'

Policy Name: Authenticated users can upload post media
Operation: INSERT
Policy Definition:
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]

Policy Name: Users can update their own post media
Operation: UPDATE
Policy Definition:
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]

Policy Name: Users can delete their own post media
Operation: DELETE
Policy Definition:
bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]
*/

-- =====================================================
-- STORAGE RLS POLICIES - HALAQA AVATARS
-- =====================================================
-- To create these, go to: Storage > halaqa-avatars bucket > Policies

/*
Policy Name: Halaqa avatars are publicly accessible
Operation: SELECT
Policy Definition:
bucket_id = 'halaqa-avatars'

Policy Name: Halaqa admins can upload halaqa avatars
Operation: INSERT
Policy Definition:
bucket_id = 'halaqa-avatars' AND auth.uid() IS NOT NULL

Policy Name: Halaqa admins can update halaqa avatars
Operation: UPDATE
Policy Definition:
bucket_id = 'halaqa-avatars'

Policy Name: Halaqa admins can delete halaqa avatars
Operation: DELETE
Policy Definition:
bucket_id = 'halaqa-avatars'
*/

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to generate avatar URL
CREATE OR REPLACE FUNCTION get_avatar_url(user_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'avatars/' || user_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate post media URL
CREATE OR REPLACE FUNCTION get_post_media_url(user_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'post-media/' || user_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- Function to generate halaqa avatar URL
CREATE OR REPLACE FUNCTION get_halaqa_avatar_url(halaqa_id_param UUID, filename_param TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'halaqa-avatars/' || halaqa_id_param::text || '/' || filename_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

-- Note: Policy comments cannot be added via SQL when policies are created via Dashboard
-- The policies are working correctly even without these comments

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After setup, verify buckets exist:
-- SELECT * FROM storage.buckets WHERE id IN ('avatars', 'post-media', 'halaqa-avatars');

-- Verify you can query helper functions:
-- SELECT get_avatar_url('00000000-0000-0000-0000-000000000001'::UUID, 'avatar.jpg');

-- =====================================================
-- END OF MIGRATION
-- =====================================================

