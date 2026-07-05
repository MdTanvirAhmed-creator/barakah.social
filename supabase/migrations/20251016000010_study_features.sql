-- Interactive Study Features
-- Migration: 009_study_features.sql

-- Create ENUM types for study features
CREATE TYPE study_note_type AS ENUM ('highlight', 'note', 'bookmark', 'question');
CREATE TYPE flashcard_status AS ENUM ('new', 'learning', 'review', 'mastered');
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE study_session_status AS ENUM ('active', 'completed', 'abandoned');

-- Study Notes table
CREATE TABLE study_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID, -- References various content types
    content_type VARCHAR(50), -- 'article', 'video', 'lesson', etc.
    note_type study_note_type DEFAULT 'note',
    title VARCHAR(255),
    content TEXT NOT NULL,
    position_data JSONB, -- For inline notes (paragraph, timestamp, etc.)
    tags TEXT[],
    is_private BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flashcard Decks table
CREATE TABLE flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    total_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flashcards table
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    front_image_url TEXT,
    back_image_url TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Flashcard Progress table
CREATE TABLE user_flashcard_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    status flashcard_status DEFAULT 'new',
    ease_factor DECIMAL(4,2) DEFAULT 2.50,
    interval_days INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, card_id)
);

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID, -- References various content types
    content_type VARCHAR(50),
    questions JSONB NOT NULL,
    time_limit INTEGER, -- in minutes
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    max_attempts INTEGER DEFAULT 3,
    is_randomized BOOLEAN DEFAULT FALSE,
    status quiz_status DEFAULT 'draft',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz Attempts table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    answers JSONB,
    time_spent INTEGER, -- in minutes
    is_passed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Group Members table
CREATE TABLE study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(group_id, user_id)
);

-- Study Sessions table
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50), -- 'live', 'scheduled', 'recorded'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    max_participants INTEGER,
    status study_session_status DEFAULT 'active',
    meeting_url TEXT,
    recording_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Session Participants table
CREATE TABLE study_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    participation_score INTEGER DEFAULT 0,
    UNIQUE(session_id, user_id)
);

-- Shared Notes table
CREATE TABLE shared_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Study Progress table
CREATE TABLE study_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID,
    content_type VARCHAR(50),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INTEGER DEFAULT 0, -- in minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    bookmarks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, content_id, content_type)
);

-- Spaced Repetition Schedule table
CREATE TABLE spaced_repetition_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    next_review TIMESTAMP WITH TIME ZONE NOT NULL,
    interval_days INTEGER NOT NULL,
    ease_factor DECIMAL(4,2) NOT NULL,
    repetitions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, card_id)
);

-- Study Analytics table
CREATE TABLE study_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    study_time INTEGER DEFAULT 0, -- in minutes
    cards_reviewed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    sessions_attended INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_study_notes_user ON study_notes(user_id);
CREATE INDEX idx_study_notes_content ON study_notes(content_id, content_type);
CREATE INDEX idx_study_notes_type ON study_notes(note_type);
CREATE INDEX idx_study_notes_tags ON study_notes USING GIN(tags);

CREATE INDEX idx_flashcard_decks_user ON flashcard_decks(user_id);
CREATE INDEX idx_flashcard_decks_public ON flashcard_decks(is_public);
CREATE INDEX idx_flashcard_decks_subject ON flashcard_decks(subject);

CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);
CREATE INDEX idx_flashcards_difficulty ON flashcards(difficulty_level);

CREATE INDEX idx_user_flashcard_progress_user ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_card ON user_flashcard_progress(card_id);
CREATE INDEX idx_user_flashcard_progress_status ON user_flashcard_progress(status);
CREATE INDEX idx_user_flashcard_progress_review ON user_flashcard_progress(next_review_date);

CREATE INDEX idx_quizzes_author ON quizzes(author_id);
CREATE INDEX idx_quizzes_content ON quizzes(content_id, content_type);
CREATE INDEX idx_quizzes_status ON quizzes(status);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(completed_at);

CREATE INDEX idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX idx_study_groups_public ON study_groups(is_public);
CREATE INDEX idx_study_groups_active ON study_groups(is_active);

CREATE INDEX idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX idx_study_group_members_active ON study_group_members(is_active);

CREATE INDEX idx_study_sessions_group ON study_sessions(group_id);
CREATE INDEX idx_study_sessions_scheduled ON study_sessions(scheduled_at);
CREATE INDEX idx_study_sessions_status ON study_sessions(status);

CREATE INDEX idx_study_session_participants_session ON study_session_participants(session_id);
CREATE INDEX idx_study_session_participants_user ON study_session_participants(user_id);

CREATE INDEX idx_shared_notes_group ON shared_notes(group_id);
CREATE INDEX idx_shared_notes_user ON shared_notes(user_id);
CREATE INDEX idx_shared_notes_pinned ON shared_notes(is_pinned);

CREATE INDEX idx_study_progress_user ON study_progress(user_id);
CREATE INDEX idx_study_progress_content ON study_progress(content_id, content_type);
CREATE INDEX idx_study_progress_completed ON study_progress(is_completed);

CREATE INDEX idx_spaced_repetition_schedule_user ON spaced_repetition_schedule(user_id);
CREATE INDEX idx_spaced_repetition_schedule_review ON spaced_repetition_schedule(next_review);

CREATE INDEX idx_study_analytics_user ON study_analytics(user_id);
CREATE INDEX idx_study_analytics_date ON study_analytics(date);

-- Enable RLS
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_notes
CREATE POLICY "Enable read access for own notes" ON study_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON study_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own notes" ON study_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own notes" ON study_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcard_decks
CREATE POLICY "Enable read access for public decks and own decks" ON flashcard_decks FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON flashcard_decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for deck owners" ON flashcard_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for deck owners" ON flashcard_decks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flashcards
CREATE POLICY "Enable read access for deck members" ON flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND (is_public = TRUE OR user_id = auth.uid()))
);
CREATE POLICY "Enable insert for deck owners" ON flashcards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for deck owners" ON flashcards FOR UPDATE USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);
CREATE POLICY "Enable delete for deck owners" ON flashcards FOR DELETE USING (
    EXISTS (SELECT 1 FROM flashcard_decks WHERE id = deck_id AND user_id = auth.uid())
);

-- RLS Policies for user_flashcard_progress
CREATE POLICY "Enable read access for own progress" ON user_flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON user_flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON user_flashcard_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON user_flashcard_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quizzes
CREATE POLICY "Enable read access for all users" ON quizzes FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON quizzes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable update for quiz authors" ON quizzes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for quiz authors" ON quizzes FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for quiz_attempts
CREATE POLICY "Enable read access for own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own attempts" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own attempts" ON quiz_attempts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Enable read access for public groups and member groups" ON study_groups FOR SELECT USING (
    is_public = TRUE OR 
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for authenticated users" ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Enable update for group creators" ON study_groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Enable delete for group creators" ON study_groups FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for study_group_members
CREATE POLICY "Enable read access for group members" ON study_group_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND (is_public = TRUE OR creator_id = auth.uid()))
);
CREATE POLICY "Enable insert for group creators and members" ON study_group_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);
CREATE POLICY "Enable update for group creators and members" ON study_group_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);
CREATE POLICY "Enable delete for group creators and members" ON study_group_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
);

-- RLS Policies for study_sessions
CREATE POLICY "Enable read access for group members" ON study_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON study_sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for session creators" ON study_sessions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Enable delete for session creators" ON study_sessions FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for study_session_participants
CREATE POLICY "Enable read access for group members" ON study_session_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members sm 
            JOIN study_sessions ss ON sm.group_id = ss.group_id 
            WHERE ss.id = session_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON study_session_participants FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM study_group_members sm 
            JOIN study_sessions ss ON sm.group_id = ss.group_id 
            WHERE ss.id = session_id AND sm.user_id = auth.uid())
);
CREATE POLICY "Enable update for participants" ON study_session_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for participants" ON study_session_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_notes
CREATE POLICY "Enable read access for group members" ON shared_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = shared_notes.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable insert for group members" ON shared_notes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = shared_notes.group_id AND user_id = auth.uid())
);
CREATE POLICY "Enable update for note authors" ON shared_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for note authors" ON shared_notes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_progress
CREATE POLICY "Enable read access for own progress" ON study_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON study_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON study_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON study_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for spaced_repetition_schedule
CREATE POLICY "Enable read access for own schedule" ON spaced_repetition_schedule FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own schedule" ON spaced_repetition_schedule FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own schedule" ON spaced_repetition_schedule FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own schedule" ON spaced_repetition_schedule FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_analytics
CREATE POLICY "Enable read access for own analytics" ON study_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own analytics" ON study_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own analytics" ON study_analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own analytics" ON study_analytics FOR DELETE USING (auth.uid() = user_id);

-- Create functions for study features
CREATE OR REPLACE FUNCTION update_flashcard_deck_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total cards count when flashcards are added/removed
    UPDATE flashcard_decks 
    SET total_cards = (
        SELECT COUNT(*) FROM flashcards WHERE deck_id = NEW.deck_id
    ),
    updated_at = now()
    WHERE id = NEW.deck_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flashcard deck stats
CREATE TRIGGER update_flashcard_deck_stats_trigger
    AFTER INSERT OR DELETE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_flashcard_deck_stats();

-- Create function for spaced repetition (SM-2 algorithm)
CREATE OR REPLACE FUNCTION update_spaced_repetition(
    user_uuid UUID,
    card_uuid UUID,
    quality INTEGER -- 0-5 scale
)
RETURNS VOID AS $$
DECLARE
    current_ease DECIMAL(4,2);
    current_interval INTEGER;
    current_repetitions INTEGER;
    new_ease DECIMAL(4,2);
    new_interval INTEGER;
    new_repetitions INTEGER;
BEGIN
    -- Get current progress
    SELECT ease_factor, interval_days, repetitions
    INTO current_ease, current_interval, current_repetitions
    FROM user_flashcard_progress
    WHERE user_id = user_uuid AND card_id = card_uuid;
    
    -- SM-2 Algorithm
    IF quality < 3 THEN
        -- Failed - reset
        new_repetitions := 0;
        new_interval := 1;
        new_ease := current_ease;
    ELSE
        -- Passed
        new_repetitions := current_repetitions + 1;
        
        IF new_repetitions = 1 THEN
            new_interval := 1;
        ELSIF new_repetitions = 2 THEN
            new_interval := 6;
        ELSE
            new_interval := ROUND(current_interval * current_ease);
        END IF;
        
        -- Update ease factor
        new_ease := current_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        new_ease := GREATEST(1.3, new_ease);
    END IF;
    
    -- Update progress
    UPDATE user_flashcard_progress
    SET ease_factor = new_ease,
        interval_days = new_interval,
        repetitions = new_repetitions,
        next_review_date = now() + (new_interval || ' days')::INTERVAL,
        last_reviewed = now(),
        review_count = review_count + 1,
        correct_count = CASE WHEN quality >= 3 THEN correct_count + 1 ELSE correct_count END,
        updated_at = now()
    WHERE user_id = user_uuid AND card_id = card_uuid;
    
    -- Update spaced repetition schedule
    INSERT INTO spaced_repetition_schedule (user_id, card_id, next_review, interval_days, ease_factor, repetitions)
    VALUES (user_uuid, card_uuid, now() + (new_interval || ' days')::INTERVAL, new_interval, new_ease, new_repetitions)
    ON CONFLICT (user_id, card_id) 
    DO UPDATE SET 
        next_review = EXCLUDED.next_review,
        interval_days = EXCLUDED.interval_days,
        ease_factor = EXCLUDED.ease_factor,
        repetitions = EXCLUDED.repetitions,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to get cards for review
CREATE OR REPLACE FUNCTION get_cards_for_review(user_uuid UUID)
RETURNS TABLE (
    card_id UUID,
    deck_id UUID,
    front_text TEXT,
    back_text TEXT,
    front_image_url TEXT,
    back_image_url TEXT,
    difficulty_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.deck_id,
        f.front_text,
        f.back_text,
        f.front_image_url,
        f.back_image_url,
        f.difficulty_level
    FROM flashcards f
    JOIN user_flashcard_progress ufp ON f.id = ufp.card_id
    WHERE ufp.user_id = user_uuid
    AND ufp.next_review_date <= now()
    ORDER BY ufp.next_review_date ASC;
END;
$$ LANGUAGE plpgsql;
