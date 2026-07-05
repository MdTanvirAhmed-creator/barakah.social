-- =====================================================
-- BARAKAH.SOCIAL - ULTIMATE CLEANUP SCRIPT
-- =====================================================
-- This script performs a complete database reset
-- WARNING: This will delete ALL data and schema!
-- =====================================================

-- =====================================================
-- STEP 1: DROP AND RECREATE PUBLIC SCHEMA
-- =====================================================

-- Drop the entire public schema and recreate it
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restore proper permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- =====================================================
-- STEP 2: DROP ALL CUSTOM ENUM TYPES
-- =====================================================

-- Drop all possible ENUM types to prevent "already exists" errors
DROP TYPE IF EXISTS madhab_type CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS halaqa_role CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS connection_status CASCADE;
DROP TYPE IF EXISTS knowledge_level CASCADE;
DROP TYPE IF EXISTS gender_preference CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS partnership_type CASCADE;
DROP TYPE IF EXISTS check_in_frequency CASCADE;
DROP TYPE IF EXISTS mentor_status CASCADE;
DROP TYPE IF EXISTS life_stage CASCADE;
DROP TYPE IF EXISTS publisher_verification_status CASCADE;
DROP TYPE IF EXISTS content_import_type CASCADE;
DROP TYPE IF EXISTS content_review_status CASCADE;
DROP TYPE IF EXISTS import_schedule_type CASCADE;
DROP TYPE IF EXISTS target_audience CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;
DROP TYPE IF EXISTS review_action CASCADE;
DROP TYPE IF EXISTS study_note_type CASCADE;
DROP TYPE IF EXISTS flashcard_status CASCADE;
DROP TYPE IF EXISTS quiz_status CASCADE;
DROP TYPE IF EXISTS study_session_status CASCADE;
DROP TYPE IF EXISTS verification_level CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS verification_check_type CASCADE;
DROP TYPE IF EXISTS verification_result CASCADE;
DROP TYPE IF EXISTS search_operator CASCADE;
DROP TYPE IF EXISTS search_filter_type CASCADE;
DROP TYPE IF EXISTS search_result_type CASCADE;
DROP TYPE IF EXISTS engagement_type CASCADE;
DROP TYPE IF EXISTS content_format CASCADE;
DROP TYPE IF EXISTS learning_outcome CASCADE;
DROP TYPE IF EXISTS preference_type CASCADE;
DROP TYPE IF EXISTS behavior_type CASCADE;
DROP TYPE IF EXISTS recommendation_type CASCADE;

-- =====================================================
-- STEP 3: DROP ALL POSSIBLE TABLES
-- =====================================================

-- Drop all possible tables that might exist
DROP TABLE IF EXISTS companion_analytics CASCADE;
DROP TABLE IF EXISTS companion_preferences CASCADE;
DROP TABLE IF EXISTS companion_notifications CASCADE;
DROP TABLE IF EXISTS companion_interactions CASCADE;
DROP TABLE IF EXISTS companion_connections CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS beneficial_marks CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS halaqa_memberships CASCADE;
DROP TABLE IF EXISTS halaqas CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS trusted_publishers CASCADE;
DROP TABLE IF EXISTS imported_content CASCADE;
DROP TABLE IF EXISTS content_submissions CASCADE;
DROP TABLE IF EXISTS community_reviews CASCADE;
DROP TABLE IF EXISTS contributor_stats CASCADE;
DROP TABLE IF EXISTS contributor_badges CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS content_flags CASCADE;
DROP TABLE IF EXISTS scholar_approvals CASCADE;
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS content_pipelines CASCADE;
DROP TABLE IF EXISTS content_sources CASCADE;
DROP TABLE IF EXISTS content_import_logs CASCADE;
DROP TABLE IF EXISTS curator_applications CASCADE;
DROP TABLE IF EXISTS curator_profiles CASCADE;
DROP TABLE IF EXISTS curator_reviews CASCADE;
DROP TABLE IF EXISTS curator_assignments CASCADE;
DROP TABLE IF EXISTS curator_performance_logs CASCADE;
DROP TABLE IF EXISTS curator_badges CASCADE;
DROP TABLE IF EXISTS user_curator_badges CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS learning_path_lessons CASCADE;
DROP TABLE IF EXISTS learning_path_progress CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS assessment_attempts CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS learning_path_reviews CASCADE;
DROP TABLE IF EXISTS learning_path_tags CASCADE;
DROP TABLE IF EXISTS learning_path_tag_assignments CASCADE;
DROP TABLE IF EXISTS study_notes CASCADE;
DROP TABLE IF EXISTS flashcard_decks CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS study_group_members CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS study_session_participants CASCADE;
DROP TABLE IF EXISTS shared_notes CASCADE;
DROP TABLE IF EXISTS study_progress CASCADE;
DROP TABLE IF EXISTS spaced_repetition_schedule CASCADE;
DROP TABLE IF EXISTS study_analytics CASCADE;
DROP TABLE IF EXISTS content_verifications CASCADE;
DROP TABLE IF EXISTS verification_checks CASCADE;
DROP TABLE IF EXISTS verification_results CASCADE;
DROP TABLE IF EXISTS verification_assignments CASCADE;
DROP TABLE IF EXISTS verification_evidence CASCADE;
DROP TABLE IF EXISTS verification_settings CASCADE;
DROP TABLE IF EXISTS verification_analytics CASCADE;
DROP TABLE IF EXISTS reviewer_performance CASCADE;
DROP TABLE IF EXISTS content_analytics CASCADE;
DROP TABLE IF EXISTS content_engagement CASCADE;
DROP TABLE IF EXISTS content_learning_outcomes CASCADE;
DROP TABLE IF EXISTS content_gaps CASCADE;
DROP TABLE IF EXISTS content_quality_scores CASCADE;
DROP TABLE IF EXISTS search_synonyms CASCADE;
DROP TABLE IF EXISTS user_search_history CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS content_relationships CASCADE;
DROP TABLE IF EXISTS editorial_picks CASCADE;
DROP TABLE IF EXISTS search_analytics CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_behavior_logs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS content_recommendations CASCADE;
DROP TABLE IF EXISTS imported_content_categories CASCADE;

-- =====================================================
-- STEP 4: DROP ALL POSSIBLE VIEWS
-- =====================================================

DROP VIEW IF EXISTS mentor_mentee_matches CASCADE;
DROP VIEW IF EXISTS companion_network_stats CASCADE;
DROP VIEW IF EXISTS content_performance_summary CASCADE;

-- =====================================================
-- STEP 5: DROP ALL POSSIBLE FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_companion_matches(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_mentor_mentee_matches() CASCADE;
DROP FUNCTION IF EXISTS get_companion_network_stats() CASCADE;
DROP FUNCTION IF EXISTS get_content_performance_summary() CASCADE;
DROP FUNCTION IF EXISTS get_avatar_url(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_post_media_url(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_halaqa_avatar_url(uuid, text) CASCADE;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Ultimate cleanup completed! 🧹 Database completely reset. Ready for master migration.' as status;
