-- =====================================================
-- BARAKAH.SOCIAL - SUPER MINIMAL MIGRATION
-- =====================================================
-- This script creates only the basic table structure
-- WITHOUT any foreign key references to avoid user_id errors
-- =====================================================

-- =====================================================
-- SAFE EXTENSION SETUP
-- =====================================================

-- Enable required extensions (safe to run multiple times)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "unaccent";
EXCEPTION
    WHEN OTHERS THEN
        -- Extensions might already exist, continue
        NULL;
END $$;

-- =====================================================
-- SAFE ENUM CREATION
-- =====================================================

-- Create ENUM types only if they don't exist
DO $$ 
BEGIN
    -- Core system ENUMs
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'scholar');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
        CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'link', 'poll', 'question');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halaqa_status') THEN
        CREATE TYPE halaqa_status AS ENUM ('active', 'inactive', 'archived');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'halaqa_type') THEN
        CREATE TYPE halaqa_type AS ENUM ('study', 'discussion', 'memorization', 'recitation', 'general');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
        CREATE TYPE membership_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('member', 'moderator', 'admin');
    END IF;
    
    -- Companion system ENUMs
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'companion_status') THEN
        CREATE TYPE companion_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_strength') THEN
        CREATE TYPE connection_strength AS ENUM ('weak', 'moderate', 'strong', 'very_strong');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'personality_trait') THEN
        CREATE TYPE personality_trait AS ENUM ('patient', 'grateful', 'humble', 'generous', 'kind', 'wise', 'supportive', 'encouraging');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'companion_type') THEN
        CREATE TYPE companion_type AS ENUM ('study_partner', 'mentor', 'mentee', 'friend', 'spiritual_guide');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type') THEN
        CREATE TYPE interaction_type AS ENUM ('message', 'study_session', 'halaqa_together', 'beneficial_content', 'prayer_reminder');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('connection_request', 'connection_accepted', 'study_invitation', 'content_shared', 'reminder');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_preference') THEN
        CREATE TYPE study_preference AS ENUM ('quran', 'hadith', 'fiqh', 'aqeedah', 'spirituality', 'general');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        CREATE TYPE availability_status AS ENUM ('available', 'busy', 'away', 'offline');
    END IF;
END $$;

-- =====================================================
-- BASIC TABLE CREATION (NO FOREIGN KEYS, NO RLS)
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    location VARCHAR(100),
    website TEXT,
    birth_date DATE,
    gender VARCHAR(20),
    madhab_preference VARCHAR(50),
    interests TEXT[],
    beneficial_count INTEGER DEFAULT 0,
    companion_score INTEGER DEFAULT 0,
    is_available_for_connections BOOLEAN DEFAULT TRUE,
    connection_capacity INTEGER DEFAULT 50,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    personality_traits personality_trait[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'text',
    image_url TEXT,
    video_url TEXT,
    link_url TEXT,
    link_title TEXT,
    link_description TEXT,
    link_image TEXT,
    poll_question TEXT,
    poll_options JSONB,
    poll_end_date TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN DEFAULT TRUE,
    is_beneficial BOOLEAN DEFAULT FALSE,
    beneficial_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create halaqas table
CREATE TABLE IF NOT EXISTS halaqas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    creator_id UUID NOT NULL,
    status halaqa_status DEFAULT 'active',
    halaqa_type halaqa_type DEFAULT 'general',
    is_public BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 50,
    current_members INTEGER DEFAULT 0,
    beneficial_count INTEGER DEFAULT 0,
    enable_companion_discovery BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create halaqa_memberships table
CREATE TABLE IF NOT EXISTS halaqa_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    halaqa_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status membership_status DEFAULT 'pending',
    role membership_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(halaqa_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID,
    is_beneficial BOOLEAN DEFAULT FALSE,
    beneficial_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create beneficial_marks table
CREATE TABLE IF NOT EXISTS beneficial_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID,
    comment_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    post_id UUID,
    comment_id UUID,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- COMPANION SYSTEM TABLES
-- =====================================================

-- Create companion_connections table
CREATE TABLE IF NOT EXISTS companion_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    status companion_status DEFAULT 'pending',
    strength connection_strength DEFAULT 'moderate',
    connection_type companion_type DEFAULT 'friend',
    message TEXT,
    shared_interests TEXT[],
    mutual_halaqas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(requester_id, recipient_id)
);

-- Create companion_interactions table
CREATE TABLE IF NOT EXISTS companion_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID NOT NULL,
    user_id UUID NOT NULL,
    interaction_type interaction_type NOT NULL,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companion_notifications table
CREATE TABLE IF NOT EXISTS companion_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    connection_id UUID NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create companion_preferences table
CREATE TABLE IF NOT EXISTS companion_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    study_preferences study_preference[],
    preferred_connection_types companion_type[],
    max_connections INTEGER DEFAULT 50,
    auto_accept_connections BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Create companion_analytics table
CREATE TABLE IF NOT EXISTS companion_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    total_connections INTEGER DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    study_sessions INTEGER DEFAULT 0,
    content_shared INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- =====================================================
-- CREATE BASIC INDEXES (SAFE)
-- =====================================================

-- Core system indexes
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_beneficial ON posts(is_beneficial);
CREATE INDEX IF NOT EXISTS idx_halaqas_creator ON halaqas(creator_id);
CREATE INDEX IF NOT EXISTS idx_halaqas_status ON halaqas(status);
CREATE INDEX IF NOT EXISTS idx_halaqa_memberships_halaqa ON halaqa_memberships(halaqa_id);
CREATE INDEX IF NOT EXISTS idx_halaqa_memberships_user ON halaqa_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficial_marks_user ON beneficial_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficial_marks_post ON beneficial_marks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Companion system indexes
CREATE INDEX IF NOT EXISTS idx_companion_connections_requester ON companion_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_companion_connections_recipient ON companion_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_companion_connections_status ON companion_connections(status);
CREATE INDEX IF NOT EXISTS idx_companion_connections_strength ON companion_connections(strength);
CREATE INDEX IF NOT EXISTS idx_companion_interactions_connection ON companion_interactions(connection_id);
CREATE INDEX IF NOT EXISTS idx_companion_interactions_user ON companion_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_interactions_type ON companion_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_companion_notifications_user ON companion_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_notifications_read ON companion_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_companion_preferences_user ON companion_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_analytics_user ON companion_analytics(user_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Barakah.social super minimal database setup completed successfully! 🎉' as status;
