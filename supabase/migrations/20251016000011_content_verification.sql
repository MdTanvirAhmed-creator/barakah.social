-- Content Verification Pipeline
-- Migration: 010_content_verification.sql

-- Create ENUM types for content verification
CREATE TYPE verification_level AS ENUM ('level1_automated', 'level2_community', 'level3_scholarly');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'flagged', 'needs_review');
CREATE TYPE verification_check_type AS ENUM ('profanity', 'spam', 'duplicate', 'broken_link', 'copyright', 'relevance', 'quality', 'difficulty', 'source_credibility', 'islamic_authenticity', 'aqeedah', 'hadith_citation', 'bidah', 'scholarly_consensus');
CREATE TYPE verification_result AS ENUM ('pass', 'fail', 'warning', 'needs_review');

-- Content Verifications table
CREATE TABLE content_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    verification_level verification_level NOT NULL,
    status verification_status DEFAULT 'pending',
    submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    overall_score DECIMAL(5,2), -- 0-100
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Checks table
CREATE TABLE verification_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    check_type verification_check_type NOT NULL,
    check_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    weight DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Results table
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    check_id UUID REFERENCES verification_checks(id) ON DELETE CASCADE,
    result verification_result NOT NULL,
    score DECIMAL(5,2), -- 0-100
    details JSONB,
    evidence TEXT[],
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Assignments table
CREATE TABLE verification_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES content_verifications(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status verification_status DEFAULT 'pending',
    priority INTEGER DEFAULT 1, -- 1-5 scale
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Evidence table
CREATE TABLE verification_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID REFERENCES verification_results(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'link', 'reference'
    evidence_data JSONB NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verification Settings table
CREATE TABLE verification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_level verification_level NOT NULL,
    check_type verification_check_type NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    weight DECIMAL(5,2) DEFAULT 1.00,
    threshold DECIMAL(5,2) DEFAULT 70.00,
    auto_approve BOOLEAN DEFAULT FALSE,
    requires_review BOOLEAN DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(verification_level, check_type)
);

-- Verification Analytics table
CREATE TABLE verification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    verification_level verification_level NOT NULL,
    total_verifications INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    flagged_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    avg_processing_time INTERVAL,
    avg_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date, verification_level)
);

-- Reviewer Performance table
CREATE TABLE reviewer_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    verifications_completed INTEGER DEFAULT 0,
    avg_review_time INTERVAL,
    accuracy_score DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(reviewer_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_content_verifications_content ON content_verifications(content_id, content_type);
CREATE INDEX idx_content_verifications_level ON content_verifications(verification_level);
CREATE INDEX idx_content_verifications_status ON content_verifications(status);
CREATE INDEX idx_content_verifications_submitted ON content_verifications(submitted_by);
CREATE INDEX idx_content_verifications_created ON content_verifications(created_at);

CREATE INDEX idx_verification_checks_verification ON verification_checks(verification_id);
CREATE INDEX idx_verification_checks_type ON verification_checks(check_type);
CREATE INDEX idx_verification_checks_required ON verification_checks(is_required);

CREATE INDEX idx_verification_results_verification ON verification_results(verification_id);
CREATE INDEX idx_verification_results_check ON verification_results(check_id);
CREATE INDEX idx_verification_results_result ON verification_results(result);
CREATE INDEX idx_verification_results_reviewer ON verification_results(reviewer_id);

CREATE INDEX idx_verification_assignments_verification ON verification_assignments(verification_id);
CREATE INDEX idx_verification_assignments_reviewer ON verification_assignments(reviewer_id);
CREATE INDEX idx_verification_assignments_status ON verification_assignments(status);
CREATE INDEX idx_verification_assignments_due ON verification_assignments(due_date);

CREATE INDEX idx_verification_evidence_result ON verification_evidence(result_id);
CREATE INDEX idx_verification_evidence_type ON verification_evidence(evidence_type);

CREATE INDEX idx_verification_settings_level ON verification_settings(verification_level);
CREATE INDEX idx_verification_settings_check ON verification_settings(check_type);
CREATE INDEX idx_verification_settings_enabled ON verification_settings(is_enabled);

CREATE INDEX idx_verification_analytics_date ON verification_analytics(date);
CREATE INDEX idx_verification_analytics_level ON verification_analytics(verification_level);

CREATE INDEX idx_reviewer_performance_reviewer ON reviewer_performance(reviewer_id);
CREATE INDEX idx_reviewer_performance_date ON reviewer_performance(date);

-- Enable RLS
ALTER TABLE content_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_verifications
CREATE POLICY "Enable read access for all users" ON content_verifications FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for authenticated users" ON content_verifications FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Enable update for reviewers and submitters" ON content_verifications FOR UPDATE USING (
    auth.uid() = submitted_by OR 
    EXISTS (SELECT 1 FROM verification_assignments WHERE verification_id = id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable delete for submitters" ON content_verifications FOR DELETE USING (auth.uid() = submitted_by);

-- RLS Policies for verification_checks
CREATE POLICY "Enable read access for all users" ON verification_checks FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON verification_checks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON verification_checks FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON verification_checks FOR DELETE USING (TRUE);

-- RLS Policies for verification_results
CREATE POLICY "Enable read access for all users" ON verification_results FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for reviewers" ON verification_results FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Enable update for reviewers" ON verification_results FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable delete for reviewers" ON verification_results FOR DELETE USING (auth.uid() = reviewer_id);

-- RLS Policies for verification_assignments
CREATE POLICY "Enable read access for assigned reviewers" ON verification_assignments FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable insert for system" ON verification_assignments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for assigned reviewers" ON verification_assignments FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable delete for system" ON verification_assignments FOR DELETE USING (TRUE);

-- RLS Policies for verification_evidence
CREATE POLICY "Enable read access for all users" ON verification_evidence FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for reviewers" ON verification_evidence FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable update for reviewers" ON verification_evidence FOR UPDATE USING (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);
CREATE POLICY "Enable delete for reviewers" ON verification_evidence FOR DELETE USING (
    EXISTS (SELECT 1 FROM verification_results WHERE id = result_id AND reviewer_id = auth.uid())
);

-- RLS Policies for verification_settings
CREATE POLICY "Enable read access for all users" ON verification_settings FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for admins" ON verification_settings FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Enable update for admins" ON verification_settings FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Enable delete for admins" ON verification_settings FOR DELETE USING (auth.role() = 'admin');

-- RLS Policies for verification_analytics
CREATE POLICY "Enable read access for all users" ON verification_analytics FOR SELECT USING (TRUE);
CREATE POLICY "Enable insert for system" ON verification_analytics FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON verification_analytics FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON verification_analytics FOR DELETE USING (TRUE);

-- RLS Policies for reviewer_performance
CREATE POLICY "Enable read access for own performance" ON reviewer_performance FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Enable insert for system" ON reviewer_performance FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Enable update for system" ON reviewer_performance FOR UPDATE USING (TRUE);
CREATE POLICY "Enable delete for system" ON reviewer_performance FOR DELETE USING (TRUE);

-- Create functions for content verification
CREATE OR REPLACE FUNCTION calculate_verification_score(verification_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_weight DECIMAL(5,2) := 0;
    weighted_score DECIMAL(5,2) := 0;
    check_record RECORD;
    result_record RECORD;
BEGIN
    -- Calculate weighted score based on verification results
    FOR check_record IN 
        SELECT vc.id, vc.weight, vc.is_required
        FROM verification_checks vc
        WHERE vc.verification_id = verification_uuid
    LOOP
        -- Get the latest result for this check
        SELECT vr.score, vr.result
        INTO result_record
        FROM verification_results vr
        WHERE vr.check_id = check_record.id
        ORDER BY vr.reviewed_at DESC
        LIMIT 1;
        
        IF result_record IS NOT NULL THEN
            total_weight := total_weight + check_record.weight;
            
            IF result_record.result = 'pass' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight);
            ELSIF result_record.result = 'warning' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight * 0.7);
            ELSIF result_record.result = 'fail' THEN
                weighted_score := weighted_score + (result_record.score * check_record.weight * 0.3);
            END IF;
        END IF;
    END LOOP;
    
    -- Return calculated score
    IF total_weight > 0 THEN
        RETURN ROUND(weighted_score / total_weight, 2);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update verification status
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS TRIGGER AS $$
DECLARE
    verification_score DECIMAL(5,2);
    verification_status verification_status;
    required_checks_count INTEGER;
    completed_checks_count INTEGER;
BEGIN
    -- Calculate overall score
    verification_score := calculate_verification_score(NEW.verification_id);
    
    -- Count required checks
    SELECT COUNT(*)
    INTO required_checks_count
    FROM verification_checks vc
    WHERE vc.verification_id = NEW.verification_id
    AND vc.is_required = TRUE;
    
    -- Count completed required checks
    SELECT COUNT(*)
    INTO completed_checks_count
    FROM verification_checks vc
    JOIN verification_results vr ON vc.id = vr.check_id
    WHERE vc.verification_id = NEW.verification_id
    AND vc.is_required = TRUE
    AND vr.result IN ('pass', 'fail', 'warning');
    
    -- Determine status based on score and completion
    IF completed_checks_count < required_checks_count THEN
        verification_status := 'pending';
    ELSIF verification_score >= 80 THEN
        verification_status := 'approved';
    ELSIF verification_score >= 60 THEN
        verification_status := 'needs_review';
    ELSE
        verification_status := 'rejected';
    END IF;
    
    -- Update verification status
    UPDATE content_verifications
    SET overall_score = verification_score,
        status = verification_status,
        completed_at = CASE WHEN verification_status IN ('approved', 'rejected') THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = NEW.verification_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification status updates
CREATE TRIGGER update_verification_status_trigger
    AFTER INSERT OR UPDATE ON verification_results
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_status();

-- Create function to assign verification to reviewers
CREATE OR REPLACE FUNCTION assign_verification_to_reviewers(
    verification_uuid UUID,
    reviewer_ids UUID[],
    due_hours INTEGER DEFAULT 72
)
RETURNS VOID AS $$
DECLARE
    reviewer_id UUID;
BEGIN
    -- Assign to each reviewer
    FOREACH reviewer_id IN ARRAY reviewer_ids
    LOOP
        INSERT INTO verification_assignments (
            verification_id,
            reviewer_id,
            due_date,
            priority
        ) VALUES (
            verification_uuid,
            reviewer_id,
            now() + (due_hours || ' hours')::INTERVAL,
            1
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get verification statistics
CREATE OR REPLACE FUNCTION get_verification_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    verification_level verification_level,
    total_count BIGINT,
    approved_count BIGINT,
    rejected_count BIGINT,
    pending_count BIGINT,
    avg_score DECIMAL(5,2),
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.verification_level,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE cv.status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE cv.status = 'rejected') as rejected_count,
        COUNT(*) FILTER (WHERE cv.status = 'pending') as pending_count,
        ROUND(AVG(cv.overall_score), 2) as avg_score,
        AVG(cv.completed_at - cv.submitted_at) as avg_processing_time
    FROM content_verifications cv
    WHERE cv.submitted_at::DATE BETWEEN start_date AND end_date
    GROUP BY cv.verification_level;
END;
$$ LANGUAGE plpgsql;