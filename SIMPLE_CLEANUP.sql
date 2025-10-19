-- =====================================================
-- BARAKAH.SOCIAL - SIMPLE CLEANUP
-- =====================================================
-- This script performs basic cleanup without complex checks
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL ENUMS (SAFE APPROACH)
-- =====================================================

-- Drop all possible ENUMs that might exist
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS study_preference CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS interaction_type CASCADE;
DROP TYPE IF EXISTS companion_type CASCADE;
DROP TYPE IF EXISTS personality_trait CASCADE;
DROP TYPE IF EXISTS connection_strength CASCADE;
DROP TYPE IF EXISTS companion_status CASCADE;
DROP TYPE IF EXISTS membership_role CASCADE;
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS halaqa_type CASCADE;
DROP TYPE IF EXISTS halaqa_status CASCADE;
DROP TYPE IF EXISTS halaqa_role CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS madhab_type CASCADE;
DROP TYPE IF EXISTS content_submission_status CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS verification_level CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS pipeline_status CASCADE;
DROP TYPE IF EXISTS import_status CASCADE;
DROP TYPE IF EXISTS curator_status CASCADE;
DROP TYPE IF EXISTS learning_path_difficulty CASCADE;
DROP TYPE IF EXISTS assessment_type CASCADE;
DROP TYPE IF EXISTS quiz_type CASCADE;
DROP TYPE IF EXISTS study_group_status CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS content_quality_score_category CASCADE;
DROP TYPE IF EXISTS recommendation_type CASCADE;

-- =====================================================
-- STEP 2: DROP ALL TABLES (SAFE APPROACH)
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

-- =====================================================
-- STEP 3: DROP ALL VIEWS (SAFE APPROACH)
-- =====================================================

-- Drop all possible views that might exist
DROP VIEW IF EXISTS mentor_mentee_matches CASCADE;
DROP VIEW IF EXISTS companion_network_stats CASCADE;
DROP VIEW IF EXISTS content_performance_summary CASCADE;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Simple cleanup completed! 🧹 Database is now clean and ready for migrations.' as status;
