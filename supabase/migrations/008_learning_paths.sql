-- Learning Paths System
-- Migration: 008_learning_paths.sql

-- Create ENUM types for learning paths
CREATE TYPE learning_path_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lesson_status AS ENUM ('locked', 'unlocked', 'completed');
CREATE TYPE assessment_type AS ENUM ('quiz', 'assignment', 'project', 'exam');
CREATE TYPE certificate_status AS ENUM ('pending', 'issued', 'revoked');

-- Learning Paths table
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100),
    difficulty VARCHAR(50),
    estimated_duration INTEGER, -- in minutes
    status learning_path_status DEFAULT 'draft',
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    tags TEXT[],
    prerequisites TEXT[],
    learning_objectives TEXT[],
    target_audience TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    is_featured BOOLEAN DEFAULT FALSE,
    is_certified BOOLEAN DEFAULT FALSE,
    completion_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Lessons table
CREATE TABLE learning_path_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50), -- 'video', 'article', 'quiz', 'assignment'
    content_url TEXT,
    content_data JSONB,
    duration INTEGER, -- in minutes
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Progress table
CREATE TABLE learning_path_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    current_lesson_id UUID REFERENCES learning_path_lessons(id),
    time_spent INTEGER DEFAULT 0, -- in minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_certificate_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, path_id)
);

-- Lesson Progress table
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES learning_path_lessons(id) ON DELETE CASCADE,
    status lesson_status DEFAULT 'locked',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 0,
    notes TEXT,
    bookmarks JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES learning_path_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type assessment_type NOT NULL,
    questions JSONB NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    time_limit INTEGER, -- in minutes
    max_attempts INTEGER DEFAULT 3,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment Attempts table
CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
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

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status certificate_status DEFAULT 'issued',
    verification_code VARCHAR(50) UNIQUE,
    pdf_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Reviews table
CREATE TABLE learning_path_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, path_id)
);

-- Learning Path Tags table
CREATE TABLE learning_path_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning Path Tag Assignments table
CREATE TABLE learning_path_tag_assignments (
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES learning_path_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (path_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_learning_paths_category ON learning_paths(category);
CREATE INDEX idx_learning_paths_difficulty ON learning_paths(difficulty);
CREATE INDEX idx_learning_paths_status ON learning_paths(status);
CREATE INDEX idx_learning_paths_author ON learning_paths(author_id);
CREATE INDEX idx_learning_paths_featured ON learning_paths(is_featured);

CREATE INDEX idx_learning_path_lessons_path ON learning_path_lessons(path_id);
CREATE INDEX idx_learning_path_lessons_order ON learning_path_lessons(path_id, order_index);

CREATE INDEX idx_learning_path_progress_user ON learning_path_progress(user_id);
CREATE INDEX idx_learning_path_progress_path ON learning_path_progress(path_id);
CREATE INDEX idx_learning_path_progress_completed ON learning_path_progress(is_completed);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);

CREATE INDEX idx_assessments_lesson ON assessments(lesson_id);
CREATE INDEX idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);

CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_path ON certificates(path_id);
CREATE INDEX idx_certificates_status ON certificates(status);

CREATE INDEX idx_learning_path_reviews_path ON learning_path_reviews(path_id);
CREATE INDEX idx_learning_path_reviews_rating ON learning_path_reviews(rating);

-- Enable RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_paths
CREATE POLICY "Enable read access for all users" ON learning_paths FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_paths FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Enable update for path authors" ON learning_paths FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Enable delete for path authors" ON learning_paths FOR DELETE USING (auth.uid() = author_id);

-- RLS Policies for learning_path_lessons
CREATE POLICY "Enable read access for all users" ON learning_path_lessons FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for path authors" ON learning_path_lessons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable update for path authors" ON learning_path_lessons FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable delete for path authors" ON learning_path_lessons FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);

-- RLS Policies for learning_path_progress
CREATE POLICY "Enable read access for own progress" ON learning_path_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON learning_path_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON learning_path_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON learning_path_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lesson_progress
CREATE POLICY "Enable read access for own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own progress" ON lesson_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assessments
CREATE POLICY "Enable read access for all users" ON assessments FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for lesson authors" ON assessments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);
CREATE POLICY "Enable update for lesson authors" ON assessments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);
CREATE POLICY "Enable delete for lesson authors" ON assessments FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_path_lessons lp 
            JOIN learning_paths lpp ON lp.path_id = lpp.id 
            WHERE lp.id = lesson_id AND lpp.author_id = auth.uid())
);

-- RLS Policies for assessment_attempts
CREATE POLICY "Enable read access for own attempts" ON assessment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for own attempts" ON assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own attempts" ON assessment_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own attempts" ON assessment_attempts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for certificates
CREATE POLICY "Enable read access for own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for system" ON certificates FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON certificates FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON certificates FOR DELETE USING (TRUE);

-- RLS Policies for learning_path_reviews
CREATE POLICY "Enable read access for all users" ON learning_path_reviews FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_path_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own reviews" ON learning_path_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own reviews" ON learning_path_reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for learning_path_tags
CREATE POLICY "Enable read access for all users" ON learning_path_tags FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON learning_path_tags FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for authenticated users" ON learning_path_tags FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for authenticated users" ON learning_path_tags FOR DELETE USING (TRUE);

-- RLS Policies for learning_path_tag_assignments
CREATE POLICY "Enable read access for all users" ON learning_path_tag_assignments FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for path authors" ON learning_path_tag_assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable update for path authors" ON learning_path_tag_assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);
CREATE POLICY "Enable delete for path authors" ON learning_path_tag_assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND author_id = auth.uid())
);

-- Create functions for learning paths
CREATE OR REPLACE FUNCTION update_learning_path_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress percentage when lesson is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE learning_path_progress 
        SET progress_percentage = (
            SELECT (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM learning_path_lessons WHERE path_id = NEW.lesson_id))
            FROM lesson_progress lp
            JOIN learning_path_lessons lpl ON lp.lesson_id = lpl.id
            WHERE lpl.path_id = (SELECT path_id FROM learning_path_lessons WHERE id = NEW.lesson_id)
            AND lp.user_id = NEW.user_id
            AND lp.status = 'completed'
        ),
        updated_at = now()
        WHERE user_id = NEW.user_id 
        AND path_id = (SELECT path_id FROM learning_path_lessons WHERE id = NEW.lesson_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for progress updates
CREATE TRIGGER update_learning_path_progress_trigger
    AFTER UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_path_progress();

-- Create function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'CERT-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(EXTRACT(DOY FROM now())::TEXT, 3, '0') || '-' || LPAD((EXTRACT(EPOCH FROM now()) % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create function to issue certificate
CREATE OR REPLACE FUNCTION issue_certificate(user_uuid UUID, path_uuid UUID)
RETURNS UUID AS $$
DECLARE
    cert_id UUID;
    cert_number TEXT;
BEGIN
    cert_number := generate_certificate_number();
    
    INSERT INTO certificates (user_id, path_id, certificate_number, verification_code)
    VALUES (user_uuid, path_uuid, cert_number, substring(md5(random()::text) from 1 for 8))
    RETURNING id INTO cert_id;
    
    -- Update learning path progress with certificate
    UPDATE learning_path_progress 
    SET completion_certificate_id = cert_id, completed_at = now(), is_completed = TRUE
    WHERE user_id = user_uuid AND path_id = path_uuid;
    
    RETURN cert_id;
END;
$$ LANGUAGE plpgsql;