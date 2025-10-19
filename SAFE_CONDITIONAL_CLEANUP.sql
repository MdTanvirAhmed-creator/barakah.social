-- =====================================================
-- BARAKAH.SOCIAL - SAFE CONDITIONAL CLEANUP
-- =====================================================
-- This script safely cleans database objects that actually exist
-- =====================================================

-- =====================================================
-- STEP 1: DROP TABLES ONLY IF THEY EXIST
-- =====================================================

-- Drop tables only if they exist (using DO blocks for safety)
DO $$ 
BEGIN
    -- Drop all possible tables safely
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DROP TABLE profiles CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        DROP TABLE posts CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'halaqas') THEN
        DROP TABLE halaqas CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        DROP TABLE comments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'beneficial_marks') THEN
        DROP TABLE beneficial_marks CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
        DROP TABLE bookmarks CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN
        DROP TABLE follows CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP TABLE notifications CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP TABLE reports CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'halaqa_memberships') THEN
        DROP TABLE halaqa_memberships CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companion_connections') THEN
        DROP TABLE companion_connections CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companion_interactions') THEN
        DROP TABLE companion_interactions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companion_notifications') THEN
        DROP TABLE companion_notifications CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companion_preferences') THEN
        DROP TABLE companion_preferences CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companion_analytics') THEN
        DROP TABLE companion_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trusted_publishers') THEN
        DROP TABLE trusted_publishers CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'imported_content') THEN
        DROP TABLE imported_content CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_submissions') THEN
        DROP TABLE content_submissions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_reviews') THEN
        DROP TABLE community_reviews CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributor_stats') THEN
        DROP TABLE contributor_stats CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contributor_badges') THEN
        DROP TABLE contributor_badges CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
        DROP TABLE user_badges CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_flags') THEN
        DROP TABLE content_flags CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scholar_approvals') THEN
        DROP TABLE scholar_approvals CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_categories') THEN
        DROP TABLE content_categories CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_pipelines') THEN
        DROP TABLE content_pipelines CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_sources') THEN
        DROP TABLE content_sources CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_import_logs') THEN
        DROP TABLE content_import_logs CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_applications') THEN
        DROP TABLE curator_applications CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_profiles') THEN
        DROP TABLE curator_profiles CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_reviews') THEN
        DROP TABLE curator_reviews CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_assignments') THEN
        DROP TABLE curator_assignments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_performance_logs') THEN
        DROP TABLE curator_performance_logs CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curator_badges') THEN
        DROP TABLE curator_badges CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_curator_badges') THEN
        DROP TABLE user_curator_badges CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_paths') THEN
        DROP TABLE learning_paths CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_path_lessons') THEN
        DROP TABLE learning_path_lessons CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_path_progress') THEN
        DROP TABLE learning_path_progress CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_progress') THEN
        DROP TABLE lesson_progress CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
        DROP TABLE assessments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_attempts') THEN
        DROP TABLE assessment_attempts CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
        DROP TABLE certificates CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_path_reviews') THEN
        DROP TABLE learning_path_reviews CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_path_tags') THEN
        DROP TABLE learning_path_tags CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_path_tag_assignments') THEN
        DROP TABLE learning_path_tag_assignments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_notes') THEN
        DROP TABLE study_notes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcard_decks') THEN
        DROP TABLE flashcard_decks CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards') THEN
        DROP TABLE flashcards CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quizzes') THEN
        DROP TABLE quizzes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        DROP TABLE quiz_attempts CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_groups') THEN
        DROP TABLE study_groups CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_group_members') THEN
        DROP TABLE study_group_members CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_sessions') THEN
        DROP TABLE study_sessions CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_session_participants') THEN
        DROP TABLE study_session_participants CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shared_notes') THEN
        DROP TABLE shared_notes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_progress') THEN
        DROP TABLE study_progress CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spaced_repetition_schedule') THEN
        DROP TABLE spaced_repetition_schedule CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_analytics') THEN
        DROP TABLE study_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_verifications') THEN
        DROP TABLE content_verifications CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_checks') THEN
        DROP TABLE verification_checks CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_results') THEN
        DROP TABLE verification_results CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_assignments') THEN
        DROP TABLE verification_assignments CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_evidence') THEN
        DROP TABLE verification_evidence CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_settings') THEN
        DROP TABLE verification_settings CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_analytics') THEN
        DROP TABLE verification_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviewer_performance') THEN
        DROP TABLE reviewer_performance CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_analytics') THEN
        DROP TABLE content_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_engagement') THEN
        DROP TABLE content_engagement CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_learning_outcomes') THEN
        DROP TABLE content_learning_outcomes CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_gaps') THEN
        DROP TABLE content_gaps CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_quality_scores') THEN
        DROP TABLE content_quality_scores CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_synonyms') THEN
        DROP TABLE search_synonyms CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_search_history') THEN
        DROP TABLE user_search_history CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
        DROP TABLE saved_searches CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_relationships') THEN
        DROP TABLE content_relationships CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'editorial_picks') THEN
        DROP TABLE editorial_picks CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_analytics') THEN
        DROP TABLE search_analytics CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        DROP TABLE user_preferences CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_behavior_logs') THEN
        DROP TABLE user_behavior_logs CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DROP TABLE user_profiles CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_recommendations') THEN
        DROP TABLE content_recommendations CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 2: DROP ENUMS ONLY IF THEY EXIST
-- =====================================================

DO $$ 
BEGIN
    -- Drop all possible ENUMs safely
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        DROP TYPE availability_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_preference') THEN
        DROP TYPE study_preference CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        DROP TYPE notification_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type') THEN
        DROP TYPE interaction_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'companion_type') THEN
        DROP TYPE companion_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'personality_trait') THEN
        DROP TYPE personality_trait CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_strength') THEN
        DROP TYPE connection_strength CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'companion_status') THEN
        DROP TYPE companion_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        DROP TYPE membership_role CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        DROP TYPE membership_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halaqa_type') THEN
        DROP TYPE halaqa_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halaqa_status') THEN
        DROP TYPE halaqa_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halaqa_role') THEN
        DROP TYPE halaqa_role CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
        DROP TYPE post_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'madhab_type') THEN
        DROP TYPE madhab_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_submission_status') THEN
        DROP TYPE content_submission_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        DROP TYPE review_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_level') THEN
        DROP TYPE verification_level CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        DROP TYPE content_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_status') THEN
        DROP TYPE pipeline_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status') THEN
        DROP TYPE import_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curator_status') THEN
        DROP TYPE curator_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_path_difficulty') THEN
        DROP TYPE learning_path_difficulty CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_type') THEN
        DROP TYPE assessment_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        DROP TYPE quiz_type CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_group_status') THEN
        DROP TYPE study_group_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        DROP TYPE verification_status CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_quality_score_category') THEN
        DROP TYPE content_quality_score_category CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_type') THEN
        DROP TYPE recommendation_type CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 3: DROP FUNCTIONS ONLY IF THEY EXIST
-- =====================================================

DO $$ 
BEGIN
    -- Drop all possible functions safely
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP FUNCTION update_updated_at_column() CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_companion_score') THEN
        DROP FUNCTION calculate_companion_score(UUID) CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_connection_strength') THEN
        DROP FUNCTION get_connection_strength(UUID, UUID) CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_beneficial_count') THEN
        DROP FUNCTION update_beneficial_count() CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_comment_count') THEN
        DROP FUNCTION update_comment_count() CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_share_count') THEN
        DROP FUNCTION update_share_count() CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_halaqa_member_count') THEN
        DROP FUNCTION update_halaqa_member_count() CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 4: DROP VIEWS ONLY IF THEY EXIST
-- =====================================================

DO $$ 
BEGIN
    -- Drop all possible views safely
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'mentor_mentee_matches') THEN
        DROP VIEW mentor_mentee_matches CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'companion_network_stats') THEN
        DROP VIEW companion_network_stats CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'content_performance_summary') THEN
        DROP VIEW content_performance_summary CASCADE;
    END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Safe conditional cleanup completed! 🧹 Only existing objects were removed.' as status;
