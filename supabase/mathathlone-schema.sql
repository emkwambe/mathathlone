-- ============================================
-- MATHATHLONE DATABASE SCHEMA
-- Version: 1.0.0
-- Target: Supabase (PostgreSQL 15+)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('athlete', 'teacher', 'parent', 'school_admin', 'judge', 'platform_admin');
CREATE TYPE license_tier AS ENUM ('free', 'bronze', 'silver', 'gold', 'platinum');
CREATE TYPE heat_type AS ENUM ('official', 'practice');
CREATE TYPE heat_scope AS ENUM ('class', 'school', 'global');
CREATE TYPE heat_status AS ENUM ('scheduled', 'open', 'in_progress', 'calculating', 'complete', 'cancelled');
CREATE TYPE participation_status AS ENUM ('queued', 'synced', 'competing', 'finished', 'voided', 'abandoned');
CREATE TYPE medal_type AS ENUM ('gold', 'silver', 'bronze');
CREATE TYPE depth_level AS ENUM ('1', '2', '3', '4');
CREATE TYPE violation_type AS ENUM ('focus', 'velocity', 'suspected_solver', 'answer_sharing', 'identity');
CREATE TYPE violation_severity AS ENUM ('warning', 'penalty', 'disqualification');
CREATE TYPE violation_status AS ENUM ('flagged', 'under_review', 'confirmed', 'cleared', 'appealed', 'final');
CREATE TYPE self_report_reason AS ENUM ('help_received', 'saw_screen', 'used_resource', 'other');
CREATE TYPE enrollment_status AS ENUM ('active', 'removed');
CREATE TYPE parent_link_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE topic_category AS ENUM ('algebra', 'geometry', 'statistics', 'number_sense', 'mixed');
CREATE TYPE grade_band AS ENUM ('5-6', '7-8', '9-10', '11-12');

-- ============================================
-- CORE TABLES
-- ============================================

-- Schools
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    state VARCHAR(100),
    country_code CHAR(2) NOT NULL DEFAULT 'US',
    license_tier license_tier NOT NULL DEFAULT 'free',
    license_expires_at TIMESTAMPTZ,
    admin_user_id UUID, -- FK added after users table
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Athletes, Teachers, Parents, Admins, Judges)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'athlete',
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    country_code CHAR(2) NOT NULL DEFAULT 'US',
    date_of_birth DATE,
    grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    
    -- Compliance timestamps
    fair_play_acknowledged_at TIMESTAMPTZ,
    parent_consent_at TIMESTAMPTZ,
    proctor_certified_at TIMESTAMPTZ,
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from schools to users (admin)
ALTER TABLE schools 
ADD CONSTRAINT fk_schools_admin 
FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
    join_code CHAR(6) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Class Enrollments (Many-to-Many: Athletes <-> Classes)
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(class_id, athlete_id)
);

-- Parent Links (Parents <-> Athletes)
CREATE TABLE parent_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL DEFAULT 'parent',
    status parent_link_status NOT NULL DEFAULT 'pending',
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(parent_id, athlete_id)
);

-- ============================================
-- CONTENT TABLES
-- ============================================

-- Topics (Algebra, Geometry, etc.)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category topic_category NOT NULL,
    grade_band grade_band NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Problem Templates
CREATE TABLE problem_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    depth_level INTEGER NOT NULL CHECK (depth_level >= 1 AND depth_level <= 4),
    
    -- Template structure (e.g., "ax + b = c")
    template_structure JSONB NOT NULL,
    
    -- Variable constraints (e.g., {"a": {"min": 2, "max": 10}, "b": {"min": 1, "max": 20}})
    variable_constraints JSONB NOT NULL,
    
    -- Formula to compute correct answer from variables
    answer_formula TEXT NOT NULL,
    
    -- Points awarded for correct answer
    points_value INTEGER NOT NULL DEFAULT 50,
    
    -- Display format (LaTeX template)
    display_template TEXT NOT NULL,
    
    -- Answer type for validation
    answer_type VARCHAR(50) NOT NULL DEFAULT 'integer', -- integer, decimal, fraction
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMPETITION TABLES
-- ============================================

-- Heats (Competition Sessions)
CREATE TABLE heats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CHAR(7) UNIQUE NOT NULL, -- Format: MA-XXXX
    
    -- Configuration
    topic_id UUID NOT NULL REFERENCES topics(id),
    depth_min INTEGER NOT NULL DEFAULT 1 CHECK (depth_min >= 1 AND depth_min <= 4),
    depth_max INTEGER NOT NULL DEFAULT 3 CHECK (depth_max >= 1 AND depth_max <= 4),
    type heat_type NOT NULL DEFAULT 'official',
    scope heat_scope NOT NULL DEFAULT 'class',
    
    -- Scope references
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    
    -- Creator
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Status
    status heat_status NOT NULL DEFAULT 'scheduled',
    
    -- Timing
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Settings
    question_count INTEGER NOT NULL DEFAULT 20,
    duration_seconds INTEGER NOT NULL DEFAULT 900, -- 15 minutes
    
    -- Results cache (denormalized for performance)
    participant_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_depth_range CHECK (depth_min <= depth_max)
);

-- Heat Problems (Questions assigned to a Heat)
CREATE TABLE heat_problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
    problem_template_id UUID NOT NULL REFERENCES problem_templates(id),
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(heat_id, sequence_number)
);

-- Heat Participations (Athlete's involvement in a Heat)
CREATE TABLE heat_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status tracking
    status participation_status NOT NULL DEFAULT 'queued',
    
    -- Timing
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    
    -- Scores (calculated after Heat ends)
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    first_touch_correct INTEGER DEFAULT 0,
    total_time_ms INTEGER DEFAULT 0,
    
    content_score DECIMAL(10,2),
    time_score DECIMAL(10,2),
    accuracy_score DECIMAL(10,2),
    cta_score DECIMAL(10,2),
    
    -- Ranking
    rank_in_heat INTEGER,
    percentile DECIMAL(5,2),
    medal medal_type,
    ranking_points_earned INTEGER DEFAULT 0,
    
    -- Integrity
    focus_violations INTEGER NOT NULL DEFAULT 0,
    accuracy_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    voided_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(heat_id, athlete_id)
);

-- Submissions (Individual answer submissions)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participation_id UUID NOT NULL REFERENCES heat_participations(id) ON DELETE CASCADE,
    heat_problem_id UUID NOT NULL REFERENCES heat_problems(id) ON DELETE CASCADE,
    
    -- Randomized variables for THIS athlete on THIS problem
    variables_used JSONB NOT NULL,
    
    -- Answers
    correct_answer VARCHAR(100) NOT NULL,
    athlete_answer VARCHAR(100),
    is_correct BOOLEAN,
    
    -- Attempt tracking (for accuracy calculation)
    attempt_number INTEGER NOT NULL DEFAULT 1,
    
    -- Timing
    displayed_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    time_to_answer_ms INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(participation_id, heat_problem_id, attempt_number)
);

-- ============================================
-- RECOGNITION TABLES
-- ============================================

-- Rankings (Seasonal leaderboard)
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
    season VARCHAR(20) NOT NULL, -- e.g., "2025-2026"
    
    -- Points and position
    ranking_points INTEGER NOT NULL DEFAULT 0,
    rank_position INTEGER,
    
    -- Stats
    heats_completed INTEGER NOT NULL DEFAULT 0,
    gold_medals INTEGER NOT NULL DEFAULT 0,
    silver_medals INTEGER NOT NULL DEFAULT 0,
    bronze_medals INTEGER NOT NULL DEFAULT 0,
    
    -- Averages
    avg_cta_score DECIMAL(10,2),
    avg_content_score DECIMAL(10,2),
    avg_time_score DECIMAL(10,2),
    avg_accuracy_score DECIMAL(10,2),
    
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(athlete_id, grade_level, season)
);

-- Medals (Individual medal records)
CREATE TABLE medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
    participation_id UUID NOT NULL REFERENCES heat_participations(id) ON DELETE CASCADE,
    type medal_type NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(participation_id) -- One medal per participation
);

-- Achievements (Badges, milestones)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50), -- 'medals', 'streaks', 'milestones'
    threshold_value INTEGER, -- e.g., 10 for "10 gold medals"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Achievements (Earned badges)
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- INTEGRITY TABLES
-- ============================================

-- Violations (System-detected or reported)
CREATE TABLE violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES heat_participations(id) ON DELETE SET NULL,
    
    type violation_type NOT NULL,
    severity violation_severity NOT NULL,
    status violation_status NOT NULL DEFAULT 'flagged',
    
    -- Details
    details JSONB, -- timestamps, specifics, evidence
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Appeal
    appeal_submitted_at TIMESTAMPTZ,
    appeal_text TEXT,
    appeal_decided_at TIMESTAMPTZ,
    appeal_decision TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self Reports (Athlete-initiated honesty)
CREATE TABLE self_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES heat_participations(id) ON DELETE SET NULL,
    
    reason self_report_reason NOT NULL,
    description TEXT,
    
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    heat_ended_at TIMESTAMPTZ, -- To calculate if within grace period
    within_grace_period BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Auto-calculated: was this within 10 minutes of Heat end?
    grace_period_minutes INTEGER DEFAULT 10,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- Classes
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_join_code ON classes(join_code);

-- Class Enrollments
CREATE INDEX idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_athlete ON class_enrollments(athlete_id);

-- Topics
CREATE INDEX idx_topics_category ON topics(category);
CREATE INDEX idx_topics_grade_band ON topics(grade_band);

-- Problem Templates
CREATE INDEX idx_templates_topic ON problem_templates(topic_id);
CREATE INDEX idx_templates_depth ON problem_templates(depth_level);

-- Heats
CREATE INDEX idx_heats_code ON heats(code);
CREATE INDEX idx_heats_status ON heats(status);
CREATE INDEX idx_heats_class ON heats(class_id);
CREATE INDEX idx_heats_school ON heats(school_id);
CREATE INDEX idx_heats_topic ON heats(topic_id);
CREATE INDEX idx_heats_created_by ON heats(created_by);
CREATE INDEX idx_heats_scheduled ON heats(scheduled_at);

-- Heat Participations
CREATE INDEX idx_participations_heat ON heat_participations(heat_id);
CREATE INDEX idx_participations_athlete ON heat_participations(athlete_id);
CREATE INDEX idx_participations_status ON heat_participations(status);

-- Submissions
CREATE INDEX idx_submissions_participation ON submissions(participation_id);
CREATE INDEX idx_submissions_problem ON submissions(heat_problem_id);

-- Rankings
CREATE INDEX idx_rankings_athlete ON rankings(athlete_id);
CREATE INDEX idx_rankings_season ON rankings(season);
CREATE INDEX idx_rankings_grade_season ON rankings(grade_level, season);
CREATE INDEX idx_rankings_position ON rankings(rank_position);

-- Medals
CREATE INDEX idx_medals_athlete ON medals(athlete_id);
CREATE INDEX idx_medals_heat ON medals(heat_id);
CREATE INDEX idx_medals_type ON medals(type);

-- Violations
CREATE INDEX idx_violations_athlete ON violations(athlete_id);
CREATE INDEX idx_violations_heat ON violations(heat_id);
CREATE INDEX idx_violations_status ON violations(status);

-- Self Reports
CREATE INDEX idx_self_reports_athlete ON self_reports(athlete_id);
CREATE INDEX idx_self_reports_heat ON self_reports(heat_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate Heat Code (MA-XXXX format)
CREATE OR REPLACE FUNCTION generate_heat_code()
RETURNS CHAR(7) AS $$
DECLARE
    new_code CHAR(7);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 4-character alphanumeric
        new_code := 'MA-' || upper(substr(md5(random()::text), 1, 4));
        
        -- Check if exists
        SELECT EXISTS(SELECT 1 FROM heats WHERE code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Generate Class Join Code (6 chars)
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS CHAR(6) AS $$
DECLARE
    new_code CHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := upper(substr(md5(random()::text), 1, 6));
        SELECT EXISTS(SELECT 1 FROM classes WHERE join_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Calculate CTA Score
CREATE OR REPLACE FUNCTION calculate_cta_score(
    p_content_score DECIMAL,
    p_time_score DECIMAL,
    p_accuracy_score DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(
        (COALESCE(p_content_score, 0) * 0.50) +
        (COALESCE(p_time_score, 0) * 0.30) +
        (COALESCE(p_accuracy_score, 0) * 0.20),
        2
    );
END;
$$ LANGUAGE plpgsql;

-- Check if self-report is within grace period
CREATE OR REPLACE FUNCTION check_grace_period()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.heat_ended_at IS NOT NULL THEN
        NEW.within_grace_period := (
            EXTRACT(EPOCH FROM (NEW.reported_at - NEW.heat_ended_at)) / 60
        ) <= NEW.grace_period_minutes;
    ELSE
        -- Heat hasn't ended yet, definitely within grace
        NEW.within_grace_period := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_grace_period
    BEFORE INSERT ON self_reports
    FOR EACH ROW
    EXECUTE FUNCTION check_grace_period();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_problem_templates_updated_at BEFORE UPDATE ON problem_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_heats_updated_at BEFORE UPDATE ON heats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_participations_updated_at BEFORE UPDATE ON heat_participations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_rankings_updated_at BEFORE UPDATE ON rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_violations_updated_at BEFORE UPDATE ON violations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_reports ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, public profiles are limited
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

-- Schools: Public read for basic info
CREATE POLICY schools_select ON schools FOR SELECT USING (TRUE);

-- Classes: Teachers see their classes, students see enrolled classes
CREATE POLICY classes_select ON classes FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM class_enrollments 
        WHERE class_id = classes.id AND athlete_id = auth.uid()
    )
);

-- Topics: Public read (part of syllabus)
CREATE POLICY topics_select ON topics FOR SELECT USING (TRUE);

-- Problem Templates: Only admins can see (prevents cheating)
CREATE POLICY templates_select ON problem_templates FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'platform_admin')
);

-- Heats: Participants and creators can see
CREATE POLICY heats_select ON heats FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM heat_participations 
        WHERE heat_id = heats.id AND athlete_id = auth.uid()
    )
);

-- Heat Participations: Own participation only
CREATE POLICY participations_select ON heat_participations FOR SELECT USING (
    athlete_id = auth.uid() OR
    EXISTS (SELECT 1 FROM heats WHERE id = heat_id AND created_by = auth.uid())
);

-- Submissions: Own submissions only
CREATE POLICY submissions_select ON submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM heat_participations 
        WHERE id = participation_id AND athlete_id = auth.uid()
    )
);

-- Rankings: Public read
CREATE POLICY rankings_select ON rankings FOR SELECT USING (TRUE);

-- Medals: Public read
CREATE POLICY medals_select ON medals FOR SELECT USING (TRUE);

-- Achievements: Public read
CREATE POLICY achievements_select ON achievements FOR SELECT USING (TRUE);

-- User Achievements: Public read
CREATE POLICY user_achievements_select ON user_achievements FOR SELECT USING (TRUE);

-- Violations: Own violations only
CREATE POLICY violations_select ON violations FOR SELECT USING (athlete_id = auth.uid());

-- Self Reports: Own reports only
CREATE POLICY self_reports_select ON self_reports FOR SELECT USING (athlete_id = auth.uid());
CREATE POLICY self_reports_insert ON self_reports FOR INSERT WITH CHECK (athlete_id = auth.uid());

-- ============================================
-- SEED DATA (Initial Setup)
-- ============================================

-- Insert default topics
INSERT INTO topics (id, name, category, grade_band, description, display_order) VALUES
    (uuid_generate_v4(), 'Linear Equations', 'algebra', '7-8', 'Solving equations with one variable', 1),
    (uuid_generate_v4(), 'Quadratic Equations', 'algebra', '9-10', 'Solving quadratic equations', 2),
    (uuid_generate_v4(), 'Fractions & Decimals', 'number_sense', '5-6', 'Operations with fractions and decimals', 3),
    (uuid_generate_v4(), 'Ratios & Proportions', 'number_sense', '7-8', 'Working with ratios and proportional relationships', 4),
    (uuid_generate_v4(), 'Angles & Lines', 'geometry', '7-8', 'Angle relationships and parallel lines', 5),
    (uuid_generate_v4(), 'Area & Perimeter', 'geometry', '5-6', 'Calculating area and perimeter of shapes', 6),
    (uuid_generate_v4(), 'Basic Statistics', 'statistics', '7-8', 'Mean, median, mode, and data interpretation', 7),
    (uuid_generate_v4(), 'Probability', 'statistics', '9-10', 'Basic probability concepts', 8);

-- Insert default achievements
INSERT INTO achievements (id, code, name, description, category, threshold_value) VALUES
    (uuid_generate_v4(), 'FIRST_HEAT', 'First Steps', 'Complete your first Heat', 'milestones', 1),
    (uuid_generate_v4(), 'GOLD_1', 'Gold Rush', 'Win your first Gold medal', 'medals', 1),
    (uuid_generate_v4(), 'GOLD_10', 'Gold Standard', 'Win 10 Gold medals', 'medals', 10),
    (uuid_generate_v4(), 'GOLD_50', 'Golden Legend', 'Win 50 Gold medals', 'medals', 50),
    (uuid_generate_v4(), 'STREAK_5', 'On Fire', 'Complete 5 Heats in a row', 'streaks', 5),
    (uuid_generate_v4(), 'CENTURY', 'Century Club', 'Complete 100 Heats', 'milestones', 100),
    (uuid_generate_v4(), 'PERFECT', 'Perfect Score', 'Get 100% Content score in a Heat', 'milestones', 1),
    (uuid_generate_v4(), 'PROMOTED', 'Level Up', 'Earn promotion to a higher grade', 'milestones', 1);

-- ============================================
-- VIEWS (For Common Queries)
-- ============================================

-- Leaderboard view (public rankings)
CREATE VIEW v_leaderboard AS
SELECT 
    r.rank_position,
    r.athlete_id,
    u.display_name,
    u.country_code,
    r.grade_level,
    r.season,
    r.ranking_points,
    r.heats_completed,
    r.gold_medals,
    r.silver_medals,
    r.bronze_medals,
    r.avg_cta_score
FROM rankings r
JOIN users u ON u.id = r.athlete_id
WHERE u.is_active = TRUE
ORDER BY r.ranking_points DESC;

-- Heat results view
CREATE VIEW v_heat_results AS
SELECT 
    hp.heat_id,
    hp.athlete_id,
    u.display_name,
    u.country_code,
    hp.rank_in_heat,
    hp.cta_score,
    hp.content_score,
    hp.time_score,
    hp.accuracy_score,
    hp.medal,
    hp.ranking_points_earned,
    hp.questions_correct,
    hp.questions_attempted,
    hp.total_time_ms
FROM heat_participations hp
JOIN users u ON u.id = hp.athlete_id
WHERE hp.status = 'finished'
ORDER BY hp.rank_in_heat;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE users IS 'All platform users: athletes, teachers, parents, admins, judges';
COMMENT ON TABLE schools IS 'Educational institutions registered on the platform';
COMMENT ON TABLE classes IS 'Teacher-created class groups within schools';
COMMENT ON TABLE heats IS 'Competition sessions - the core unit of competition';
COMMENT ON TABLE heat_participations IS 'Athlete involvement in a specific Heat';
COMMENT ON TABLE submissions IS 'Individual answer submissions during a Heat';
COMMENT ON TABLE rankings IS 'Seasonal leaderboard rankings';
COMMENT ON TABLE violations IS 'Integrity violations detected or reported';
COMMENT ON TABLE self_reports IS 'Athlete-initiated honesty reports (Akeelah Rule)';

COMMENT ON COLUMN heat_participations.accuracy_multiplier IS 'Reduced to 0.5 after second focus violation';
COMMENT ON COLUMN self_reports.within_grace_period IS 'Auto-calculated: TRUE if reported within 10 minutes of Heat end';
COMMENT ON COLUMN submissions.variables_used IS 'The randomized values generated for THIS athlete on THIS problem';
