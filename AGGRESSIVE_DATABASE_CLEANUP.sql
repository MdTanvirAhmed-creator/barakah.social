-- =====================================================
-- BARAKAH.SOCIAL - AGGRESSIVE DATABASE CLEANUP
-- =====================================================
-- This script aggressively cleans ALL possible database objects
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL TABLES WITH CASCADE
-- =====================================================

-- Drop all possible tables (comprehensive list)
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
-- STEP 2: DROP ALL ENUMS WITH CASCADE (COMPREHENSIVE)
-- =====================================================

-- Drop ALL possible ENUMs that might exist
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
-- STEP 3: DROP ALL FUNCTIONS WITH CASCADE
-- =====================================================

-- Drop all possible functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_companion_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_connection_strength(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_beneficial_count() CASCADE;
DROP FUNCTION IF EXISTS update_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_share_count() CASCADE;
DROP FUNCTION IF EXISTS update_halaqa_member_count() CASCADE;

-- =====================================================
-- STEP 4: DROP ALL VIEWS WITH CASCADE
-- =====================================================

-- Drop all possible views
DROP VIEW IF EXISTS mentor_mentee_matches CASCADE;
DROP VIEW IF EXISTS companion_network_stats CASCADE;
DROP VIEW IF EXISTS content_performance_summary CASCADE;

-- =====================================================
-- STEP 5: DROP ALL TRIGGERS
-- =====================================================

-- Drop all possible triggers
DROP TRIGGER IF EXISTS update_updated_at_column ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_updated_at_column ON posts CASCADE;
DROP TRIGGER IF EXISTS update_updated_at_column ON halaqas CASCADE;
DROP TRIGGER IF EXISTS update_updated_at_column ON comments CASCADE;
DROP TRIGGER IF EXISTS update_updated_at_column ON companion_connections CASCADE;
DROP TRIGGER IF EXISTS update_beneficial_count_trigger ON beneficial_marks CASCADE;
DROP TRIGGER IF EXISTS update_comment_count_trigger ON comments CASCADE;
DROP TRIGGER IF EXISTS update_share_count_trigger ON posts CASCADE;
DROP TRIGGER IF EXISTS update_halaqa_member_count_trigger ON halaqa_memberships CASCADE;

-- =====================================================
-- STEP 6: DROP ALL INDEXES
-- =====================================================

-- Drop all possible indexes
DROP INDEX IF EXISTS idx_posts_user_id CASCADE;
DROP INDEX IF EXISTS idx_posts_created_at CASCADE;
DROP INDEX IF EXISTS idx_comments_post_id CASCADE;
DROP INDEX IF EXISTS idx_comments_user_id CASCADE;
DROP INDEX IF EXISTS idx_beneficial_marks_user_id CASCADE;
DROP INDEX IF EXISTS idx_beneficial_marks_post_id CASCADE;
DROP INDEX IF EXISTS idx_bookmarks_user_id CASCADE;
DROP INDEX IF EXISTS idx_bookmarks_post_id CASCADE;
DROP INDEX IF EXISTS idx_follows_follower_id CASCADE;
DROP INDEX IF EXISTS idx_follows_following_id CASCADE;
DROP INDEX IF EXISTS idx_halaqas_created_by CASCADE;
DROP INDEX IF EXISTS idx_halaqas_scheduled_at CASCADE;
DROP INDEX IF EXISTS idx_halaqa_participants_halaqa_id CASCADE;
DROP INDEX IF EXISTS idx_halaqa_participants_user_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_recipient_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_created_at CASCADE;
DROP INDEX IF EXISTS idx_reports_reporter_id CASCADE;
DROP INDEX IF EXISTS idx_companion_connections_requester_id CASCADE;
DROP INDEX IF EXISTS idx_companion_connections_responder_id CASCADE;
DROP INDEX IF EXISTS idx_companion_connections_status CASCADE;
DROP INDEX IF EXISTS idx_companion_interactions_connection_id CASCADE;
DROP INDEX IF EXISTS idx_companion_notifications_recipient_id CASCADE;

-- =====================================================
-- STEP 7: DROP ALL SEQUENCES
-- =====================================================

-- Drop all possible sequences
DROP SEQUENCE IF EXISTS profiles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS posts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS halaqas_id_seq CASCADE;
DROP SEQUENCE IF EXISTS comments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS beneficial_marks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS bookmarks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS follows_id_seq CASCADE;
DROP SEQUENCE IF EXISTS notifications_id_seq CASCADE;
DROP SEQUENCE IF EXISTS reports_id_seq CASCADE;
DROP SEQUENCE IF EXISTS companion_connections_id_seq CASCADE;
DROP SEQUENCE IF EXISTS companion_interactions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS companion_notifications_id_seq CASCADE;

-- =====================================================
-- STEP 8: DROP ALL DOMAINS
-- =====================================================

-- Drop all possible domains
DROP DOMAIN IF EXISTS email CASCADE;
DROP DOMAIN IF EXISTS url CASCADE;
DROP DOMAIN IF EXISTS positive_int CASCADE;

-- =====================================================
-- STEP 9: DROP ALL SCHEMAS (EXCEPT PUBLIC)
-- =====================================================

-- Drop any custom schemas (be careful with this)
-- DROP SCHEMA IF EXISTS custom_schema CASCADE;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Aggressive database cleanup completed! 🧹 All objects removed.' as status;
