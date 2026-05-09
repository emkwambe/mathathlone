-- =============================================================================
-- MathAthlone League System - SAFE MIGRATION
-- =============================================================================
-- This migration ONLY adds NEW tables for the competition system
-- It will NOT conflict with existing schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: CURRICULUM & QUESTION GENERATORS (NEW TABLES)
-- -----------------------------------------------------------------------------

-- Courses (NC Math 1, NC Math 2, etc.)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    grade_band TEXT NOT NULL,
    state TEXT DEFAULT 'NC',
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$ BEGIN
    ALTER TABLE courses ADD CONSTRAINT courses_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE courses ADD CONSTRAINT courses_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unit Topics within courses
CREATE TABLE IF NOT EXISTS unit_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic Concepts (the smallest teachable unit)
CREATE TABLE IF NOT EXISTS atomic_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_topic_id UUID REFERENCES unit_topics(id) ON DELETE CASCADE,
    lesson_number TEXT NOT NULL,
    name TEXT NOT NULL,
    key_skills TEXT,
    state_standard TEXT,
    display_order INTEGER DEFAULT 0,
    is_generator_ready BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$ BEGIN
    ALTER TABLE atomic_concepts ADD CONSTRAINT atomic_concepts_lesson_number_key UNIQUE (lesson_number);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Question Generators (linked to atomic concepts)
CREATE TABLE IF NOT EXISTS question_generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES atomic_concepts(id) ON DELETE CASCADE,
    generator_type TEXT NOT NULL,
    answer_type TEXT NOT NULL,
    difficulty_config JSONB DEFAULT '{
        "1": {"coefficient_range": [2, 5], "constant_range": [1, 10]},
        "2": {"coefficient_range": [2, 10], "constant_range": [1, 20]},
        "3": {"coefficient_range": [-10, 10], "constant_range": [-30, 30]},
        "4": {"coefficient_range": [-20, 20], "constant_range": [-50, 50]}
    }'::jsonb,
    example_question TEXT,
    example_answer TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE question_generators ADD CONSTRAINT question_generators_generator_type_key UNIQUE (generator_type);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Generated Questions (for Heats) - references existing heats table
CREATE TABLE IF NOT EXISTS heat_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    generator_id UUID REFERENCES question_generators(id),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    question_latex TEXT NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    answer_type TEXT NOT NULL,
    solution_steps JSONB,
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Submissions (student answers) - references existing heat_participations
CREATE TABLE IF NOT EXISTS question_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_participation_id UUID REFERENCES heat_participations(id) ON DELETE CASCADE,
    heat_question_id UUID REFERENCES heat_questions(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct BOOLEAN,
    time_taken_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    points_earned INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- PART 2: LEAGUE SYSTEM (NEW TABLES)
-- -----------------------------------------------------------------------------

-- Divisions (grade-based groupings)
CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    grade_min INTEGER NOT NULL,
    grade_max INTEGER NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE divisions ADD CONSTRAINT divisions_name_key UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE divisions ADD CONSTRAINT divisions_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE seasons ADD CONSTRAINT seasons_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Leagues (geographic/organizational groupings)
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    division_id UUID REFERENCES divisions(id),
    season_id UUID REFERENCES seasons(id),
    level TEXT NOT NULL CHECK (level IN ('school', 'district', 'regional', 'state', 'national')),
    region TEXT,
    max_schools INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League Memberships (schools in leagues)
CREATE TABLE IF NOT EXISTS league_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    heats_completed INTEGER DEFAULT 0,
    avg_team_cta DECIMAL(5, 2),
    rank_in_league INTEGER
);

-- League Weeks (scheduled competition weeks)
CREATE TABLE IF NOT EXISTS league_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    name TEXT,
    topic_focus TEXT,
    unit_topic_id UUID REFERENCES unit_topics(id),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    is_playoff BOOLEAN DEFAULT false,
    is_championship BOOLEAN DEFAULT false
);

-- League Heats (heats scheduled for a league week)
CREATE TABLE IF NOT EXISTS league_heats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_week_id UUID REFERENCES league_weeks(id) ON DELETE CASCADE,
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    points_multiplier DECIMAL(3, 2) DEFAULT 1.0
);

-- School Week Results
CREATE TABLE IF NOT EXISTS school_week_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_membership_id UUID REFERENCES league_memberships(id) ON DELETE CASCADE,
    league_week_id UUID REFERENCES league_weeks(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    participants_count INTEGER DEFAULT 0,
    avg_cta_score DECIMAL(5, 2),
    best_cta_score DECIMAL(5, 2),
    gold_medals INTEGER DEFAULT 0,
    silver_medals INTEGER DEFAULT 0,
    bronze_medals INTEGER DEFAULT 0,
    is_win BOOLEAN,
    rank_in_week INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heat Templates
CREATE TABLE IF NOT EXISTS heat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    question_count INTEGER DEFAULT 20,
    difficulty_distribution JSONB DEFAULT '{"1": 5, "2": 8, "3": 5, "4": 2}'::jsonb,
    scoring_config JSONB DEFAULT '{"base_points": 100, "time_bonus_enabled": true}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE heat_templates ADD CONSTRAINT heat_templates_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Heat Template Questions
CREATE TABLE IF NOT EXISTS heat_template_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_template_id UUID REFERENCES heat_templates(id) ON DELETE CASCADE,
    question_slot INTEGER NOT NULL,
    generator_id UUID REFERENCES question_generators(id),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 90
);

-- -----------------------------------------------------------------------------
-- PART 3: ENABLE RLS (safe - won't error if already enabled)
-- -----------------------------------------------------------------------------

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE atomic_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_week_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_template_questions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PART 4: RLS POLICIES (use CREATE OR REPLACE pattern)
-- -----------------------------------------------------------------------------

-- Drop existing policies first (safe)
DROP POLICY IF EXISTS "Public can read courses" ON courses;
DROP POLICY IF EXISTS "Public can read unit_topics" ON unit_topics;
DROP POLICY IF EXISTS "Public can read atomic_concepts" ON atomic_concepts;
DROP POLICY IF EXISTS "Public can read question_generators" ON question_generators;
DROP POLICY IF EXISTS "Public can read divisions" ON divisions;
DROP POLICY IF EXISTS "Public can read seasons" ON seasons;
DROP POLICY IF EXISTS "Public can read heat_templates" ON heat_templates;
DROP POLICY IF EXISTS "Public can read leagues" ON leagues;
DROP POLICY IF EXISTS "Public can read league_memberships" ON league_memberships;
DROP POLICY IF EXISTS "Public can read league_weeks" ON league_weeks;
DROP POLICY IF EXISTS "Public can read league_heats" ON league_heats;
DROP POLICY IF EXISTS "Public can read school_week_results" ON school_week_results;
DROP POLICY IF EXISTS "Public can read heat_template_questions" ON heat_template_questions;
DROP POLICY IF EXISTS "Participants can read heat questions" ON heat_questions;
DROP POLICY IF EXISTS "Athletes can insert own submissions" ON question_submissions;
DROP POLICY IF EXISTS "Athletes can read own submissions" ON question_submissions;

-- Create policies
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public can read unit_topics" ON unit_topics FOR SELECT USING (true);
CREATE POLICY "Public can read atomic_concepts" ON atomic_concepts FOR SELECT USING (true);
CREATE POLICY "Public can read question_generators" ON question_generators FOR SELECT USING (true);
CREATE POLICY "Public can read divisions" ON divisions FOR SELECT USING (true);
CREATE POLICY "Public can read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public can read heat_templates" ON heat_templates FOR SELECT USING (true);
CREATE POLICY "Public can read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public can read league_memberships" ON league_memberships FOR SELECT USING (true);
CREATE POLICY "Public can read league_weeks" ON league_weeks FOR SELECT USING (true);
CREATE POLICY "Public can read league_heats" ON league_heats FOR SELECT USING (true);
CREATE POLICY "Public can read school_week_results" ON school_week_results FOR SELECT USING (true);
CREATE POLICY "Public can read heat_template_questions" ON heat_template_questions FOR SELECT USING (true);

CREATE POLICY "Participants can read heat questions" ON heat_questions 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM heat_participations hp
        WHERE hp.heat_id = heat_questions.heat_id
        AND hp.athlete_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM heats h
        WHERE h.id = heat_questions.heat_id
        AND h.created_by = auth.uid()
    )
);

CREATE POLICY "Athletes can insert own submissions" ON question_submissions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM heat_participations hp
        WHERE hp.id = question_submissions.heat_participation_id
        AND hp.athlete_id = auth.uid()
    )
);

CREATE POLICY "Athletes can read own submissions" ON question_submissions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM heat_participations hp
        WHERE hp.id = question_submissions.heat_participation_id
        AND hp.athlete_id = auth.uid()
    )
);

-- -----------------------------------------------------------------------------
-- PART 5: SEED DATA (with ON CONFLICT DO NOTHING)
-- -----------------------------------------------------------------------------

-- Divisions
INSERT INTO divisions (name, code, grade_min, grade_max, description, display_order) VALUES
('Rising Stars', 'D1', 4, 5, 'Elementary foundations - Grades 4-5', 1),
('Challengers', 'D2', 6, 7, 'Middle school transition - Grades 6-7', 2),
('Contenders', 'D3', 8, 9, 'Pre-algebra to algebra - Grades 8-9', 3),
('Varsity', 'D4', 10, 12, 'Advanced math - Grades 10-12', 4)
ON CONFLICT DO NOTHING;

-- Heat Templates
INSERT INTO heat_templates (name, code, description, duration_minutes, question_count, difficulty_distribution, is_default) VALUES
('Sprint Heat', 'SPRINT', 'Fast-paced 15-minute competition with 20 questions', 15, 20, '{"1": 5, "2": 8, "3": 5, "4": 2}', true),
('Target Heat', 'TARGET', 'Deeper problem-solving with paired questions', 20, 10, '{"2": 4, "3": 4, "4": 2}', false),
('Practice Heat', 'PRACTICE', 'Low-pressure practice session', 20, 15, '{"1": 8, "2": 5, "3": 2, "4": 0}', false),
('Championship Heat', 'CHAMPIONSHIP', 'High-stakes championship format', 25, 25, '{"1": 4, "2": 8, "3": 8, "4": 5}', false)
ON CONFLICT DO NOTHING;

-- NC Math 1 Course
INSERT INTO courses (name, code, grade_band, state, description, display_order) VALUES
('NC Math 1', 'M1', '9', 'NC', 'North Carolina Math 1 - Algebra foundations', 4)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- DONE!
-- -----------------------------------------------------------------------------
-- Migration complete. New tables created:
-- - courses, unit_topics, atomic_concepts, question_generators
-- - heat_questions, question_submissions
-- - divisions, seasons, leagues, league_memberships
-- - league_weeks, league_heats, school_week_results
-- - heat_templates, heat_template_questions
-- -----------------------------------------------------------------------------
