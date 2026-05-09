-- =============================================================================
-- MathAthlone League System & Question Generators
-- Database Schema Additions
-- =============================================================================
-- Run this AFTER mathathlone-schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: CURRICULUM & QUESTION GENERATORS
-- -----------------------------------------------------------------------------

-- Courses (NC Math 1, NC Math 2, etc.)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,                  -- "NC Math 1"
    code TEXT NOT NULL UNIQUE,                  -- "M1"
    grade_band TEXT NOT NULL,                   -- "9" or "6-8"
    state TEXT DEFAULT 'NC',                    -- State alignment
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unit Topics within courses
CREATE TABLE IF NOT EXISTS unit_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                         -- "Equations & Inequalities"
    code TEXT NOT NULL,                         -- "EQN"
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, code)
);

-- Atomic Concepts (the smallest teachable unit)
CREATE TABLE IF NOT EXISTS atomic_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_topic_id UUID REFERENCES unit_topics(id) ON DELETE CASCADE,
    lesson_number TEXT NOT NULL UNIQUE,         -- "M1.EQN.2.4"
    name TEXT NOT NULL,                         -- "Solving Two-Step Linear Equations"
    key_skills TEXT,                            -- "Apply inverse operations in sequence"
    state_standard TEXT,                        -- "NC.M1.A-REI.3"
    display_order INTEGER DEFAULT 0,
    is_generator_ready BOOLEAN DEFAULT false,   -- Can auto-generate questions?
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Generators (linked to atomic concepts)
CREATE TABLE IF NOT EXISTS question_generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES atomic_concepts(id) ON DELETE CASCADE,
    generator_type TEXT NOT NULL UNIQUE,        -- "linear_eq_two_step"
    answer_type TEXT NOT NULL,                  -- "integer", "decimal", "fraction", etc.
    difficulty_config JSONB DEFAULT '{
        "1": {"coefficient_range": [2, 5], "constant_range": [1, 10]},
        "2": {"coefficient_range": [2, 10], "constant_range": [1, 20]},
        "3": {"coefficient_range": [-10, 10], "constant_range": [-30, 30]},
        "4": {"coefficient_range": [-20, 20], "constant_range": [-50, 50]}
    }'::jsonb,
    example_question TEXT,                      -- "2x + 3 = 11"
    example_answer TEXT,                        -- "4"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Questions (for Heats)
CREATE TABLE IF NOT EXISTS heat_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,           -- 1-20 typically
    generator_id UUID REFERENCES question_generators(id),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    question_latex TEXT NOT NULL,               -- LaTeX formatted
    question_text TEXT NOT NULL,                -- Plain text
    correct_answer TEXT NOT NULL,
    answer_type TEXT NOT NULL,
    solution_steps JSONB,                       -- Step-by-step solution
    points_value INTEGER DEFAULT 100,           -- Base points for this question
    time_limit_seconds INTEGER DEFAULT 90,      -- Time allowed for this question
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(heat_id, question_number)
);

-- Question Submissions (student answers)
CREATE TABLE IF NOT EXISTS question_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_participation_id UUID REFERENCES heat_participations(id) ON DELETE CASCADE,
    heat_question_id UUID REFERENCES heat_questions(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct BOOLEAN,
    time_taken_ms INTEGER,                      -- Time to answer in milliseconds
    attempt_number INTEGER DEFAULT 1,           -- For re-attempts if allowed
    points_earned INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(heat_participation_id, heat_question_id, attempt_number)
);

-- -----------------------------------------------------------------------------
-- PART 2: LEAGUE SYSTEM
-- -----------------------------------------------------------------------------

-- Divisions (grade-based groupings)
CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,                  -- "Challengers"
    code TEXT NOT NULL UNIQUE,                  -- "D2"
    grade_min INTEGER NOT NULL,                 -- 6
    grade_max INTEGER NOT NULL,                 -- 8
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- "Spring 2026"
    code TEXT NOT NULL UNIQUE,                  -- "2026-SPRING"
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues (geographic/organizational groupings)
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- "NC Division 2 League"
    division_id UUID REFERENCES divisions(id),
    season_id UUID REFERENCES seasons(id),
    level TEXT NOT NULL CHECK (level IN ('school', 'district', 'regional', 'state', 'national')),
    region TEXT,                                -- "NC", "Southeast", "USA"
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
    -- Season stats (updated after each Heat)
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    heats_completed INTEGER DEFAULT 0,
    avg_team_cta DECIMAL(5, 2),
    rank_in_league INTEGER,
    UNIQUE(league_id, school_id)
);

-- League Weeks (scheduled competition weeks)
CREATE TABLE IF NOT EXISTS league_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    name TEXT,                                  -- "Week 3: Ratios & Proportions"
    topic_focus TEXT,                           -- "Ratios & Proportional Relationships"
    unit_topic_id UUID REFERENCES unit_topics(id),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    is_playoff BOOLEAN DEFAULT false,
    is_championship BOOLEAN DEFAULT false,
    UNIQUE(league_id, week_number)
);

-- League Heats (heats scheduled for a league week)
CREATE TABLE IF NOT EXISTS league_heats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_week_id UUID REFERENCES league_weeks(id) ON DELETE CASCADE,
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,           -- Must participate to count
    points_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- 1.5x for playoffs, 2x for championship
    UNIQUE(league_week_id, heat_id)
);

-- School Week Results (aggregated results per school per week)
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
    is_win BOOLEAN,                             -- Did this school win this week?
    rank_in_week INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_membership_id, league_week_id)
);

-- -----------------------------------------------------------------------------
-- PART 3: HEAT TEMPLATES (Pre-configured Heat formats)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS heat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- "Sprint Heat"
    code TEXT NOT NULL UNIQUE,                  -- "SPRINT"
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    question_count INTEGER DEFAULT 20,
    -- Question difficulty distribution
    difficulty_distribution JSONB DEFAULT '{
        "1": 5,
        "2": 8,
        "3": 5,
        "4": 2
    }'::jsonb,
    -- Scoring rules
    scoring_config JSONB DEFAULT '{
        "base_points": 100,
        "time_bonus_enabled": true,
        "accuracy_bonus_enabled": true,
        "streak_bonus_enabled": false
    }'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heat Template Questions (which generators to use)
CREATE TABLE IF NOT EXISTS heat_template_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_template_id UUID REFERENCES heat_templates(id) ON DELETE CASCADE,
    question_slot INTEGER NOT NULL,             -- 1-20
    generator_id UUID REFERENCES question_generators(id),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 90,
    UNIQUE(heat_template_id, question_slot)
);

-- -----------------------------------------------------------------------------
-- PART 4: ENABLE RLS
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
-- PART 5: RLS POLICIES
-- -----------------------------------------------------------------------------

-- Curriculum tables: Public read, admin write
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public can read unit_topics" ON unit_topics FOR SELECT USING (true);
CREATE POLICY "Public can read atomic_concepts" ON atomic_concepts FOR SELECT USING (true);
CREATE POLICY "Public can read question_generators" ON question_generators FOR SELECT USING (true);
CREATE POLICY "Public can read divisions" ON divisions FOR SELECT USING (true);
CREATE POLICY "Public can read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public can read heat_templates" ON heat_templates FOR SELECT USING (true);

-- Heat questions: Participants can read their heat's questions
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

-- Question submissions: Users can manage their own
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

-- Leagues: Public read
CREATE POLICY "Public can read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Public can read league_memberships" ON league_memberships FOR SELECT USING (true);
CREATE POLICY "Public can read league_weeks" ON league_weeks FOR SELECT USING (true);
CREATE POLICY "Public can read league_heats" ON league_heats FOR SELECT USING (true);
CREATE POLICY "Public can read school_week_results" ON school_week_results FOR SELECT USING (true);
CREATE POLICY "Public can read heat_template_questions" ON heat_template_questions FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- PART 6: SEED DATA - DIVISIONS
-- -----------------------------------------------------------------------------

INSERT INTO divisions (name, code, grade_min, grade_max, description, display_order) VALUES
('Rising Stars', 'D1', 4, 5, 'Elementary foundations - Grades 4-5', 1),
('Challengers', 'D2', 6, 7, 'Middle school transition - Grades 6-7', 2),
('Contenders', 'D3', 8, 9, 'Pre-algebra to algebra - Grades 8-9', 3),
('Varsity', 'D4', 10, 12, 'Advanced math - Grades 10-12', 4)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 7: SEED DATA - HEAT TEMPLATES
-- -----------------------------------------------------------------------------

INSERT INTO heat_templates (name, code, description, duration_minutes, question_count, difficulty_distribution, is_default) VALUES
('Sprint Heat', 'SPRINT', 'Fast-paced 15-minute competition with 20 questions', 15, 20, 
 '{"1": 5, "2": 8, "3": 5, "4": 2}', true),
('Target Heat', 'TARGET', 'Deeper problem-solving with paired questions', 20, 10,
 '{"2": 4, "3": 4, "4": 2}', false),
('Practice Heat', 'PRACTICE', 'Low-pressure practice session', 20, 15,
 '{"1": 8, "2": 5, "3": 2, "4": 0}', false),
('Championship Heat', 'CHAMPIONSHIP', 'High-stakes championship format', 25, 25,
 '{"1": 4, "2": 8, "3": 8, "4": 5}', false)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 8: SEED DATA - NC MATH 1 COURSE & GENERATORS
-- -----------------------------------------------------------------------------

-- Insert NC Math 1 course
INSERT INTO courses (name, code, grade_band, state, description, display_order) VALUES
('NC Math 1', 'M1', '9', 'NC', 'North Carolina Math 1 - Algebra foundations', 4)
ON CONFLICT (code) DO NOTHING;

-- Insert unit topics for NC Math 1
WITH m1 AS (SELECT id FROM courses WHERE code = 'M1')
INSERT INTO unit_topics (course_id, name, code, display_order)
SELECT m1.id, name, code, display_order FROM m1, (VALUES
    ('Equations & Inequalities', 'EQN', 1),
    ('Functions & Linear Functions', 'FLF', 2),
    ('Systems of Equations & Inequalities', 'SYS', 3),
    ('Exponents & Exponential Functions', 'EXP', 4),
    ('Polynomials & Factoring', 'POLY', 5),
    ('Quadratic Functions & Equations', 'QUAD', 6),
    ('Data Analysis & Statistics', 'DAS', 7),
    ('Geometric Transformations & Congruence', 'GEO.TRANS', 8)
) AS t(name, code, display_order)
ON CONFLICT DO NOTHING;

-- Insert atomic concepts (sample - key generator-ready concepts)
WITH eqn AS (SELECT id FROM unit_topics WHERE code = 'EQN' LIMIT 1)
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT eqn.id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order FROM eqn, (VALUES
    ('M1.EQN.2.2', 'Solving One-Step Linear Equations (Addition/Subtraction)', 'Isolate the variable using inverse operations', 'NC.M1.A-REI.3', true, 1),
    ('M1.EQN.2.3', 'Solving One-Step Linear Equations (Multiplication/Division)', 'Isolate the variable using inverse operations', 'NC.M1.A-REI.3', true, 2),
    ('M1.EQN.2.4', 'Solving Two-Step Linear Equations', 'Apply inverse operations in sequence to solve', 'NC.M1.A-REI.3', true, 3),
    ('M1.EQN.2.5', 'Solving Multi-Step Linear Equations', 'Use distributive property; Combine like terms; Apply inverse operations', 'NC.M1.A-REI.3', true, 4),
    ('M1.EQN.2.6', 'Solving Linear Equations with Variables on Both Sides', 'Collect variable terms on one side and constant terms on the other', 'NC.M1.A-REI.3', true, 5)
) AS t(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
ON CONFLICT DO NOTHING;

-- Insert question generators
INSERT INTO question_generators (concept_id, generator_type, answer_type, example_question, example_answer)
SELECT ac.id, gen.generator_type, gen.answer_type, gen.example_question, gen.example_answer
FROM atomic_concepts ac
JOIN (VALUES
    ('M1.EQN.2.2', 'linear_eq_one_step_add', 'integer', 'x + 5 = 12', '7'),
    ('M1.EQN.2.3', 'linear_eq_one_step_mult', 'integer', '3x = 15', '5'),
    ('M1.EQN.2.4', 'linear_eq_two_step', 'integer', '2x + 3 = 11', '4'),
    ('M1.EQN.2.5', 'linear_eq_multi_step', 'integer', '3(x + 2) - 4 = 11', '3'),
    ('M1.EQN.2.6', 'linear_eq_both_sides', 'integer', '5x + 3 = 2x + 12', '3')
) AS gen(lesson_number, generator_type, answer_type, example_question, example_answer)
ON ac.lesson_number = gen.lesson_number
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 9: USEFUL VIEWS
-- -----------------------------------------------------------------------------

-- View: League Standings
CREATE OR REPLACE VIEW v_league_standings
WITH (security_invoker = true) AS
SELECT 
    l.id AS league_id,
    l.name AS league_name,
    d.name AS division_name,
    s.name AS season_name,
    lm.school_id,
    sch.name AS school_name,
    lm.wins,
    lm.losses,
    lm.total_points,
    lm.heats_completed,
    lm.avg_team_cta,
    lm.rank_in_league
FROM leagues l
JOIN divisions d ON l.division_id = d.id
JOIN seasons s ON l.season_id = s.id
JOIN league_memberships lm ON lm.league_id = l.id
JOIN schools sch ON lm.school_id = sch.id
WHERE lm.is_active = true
ORDER BY lm.rank_in_league ASC NULLS LAST;

-- View: Generator Catalog
CREATE OR REPLACE VIEW v_generator_catalog
WITH (security_invoker = true) AS
SELECT 
    qg.id AS generator_id,
    qg.generator_type,
    qg.answer_type,
    qg.example_question,
    qg.example_answer,
    ac.lesson_number,
    ac.name AS concept_name,
    ac.state_standard,
    ut.name AS unit_topic,
    c.name AS course_name,
    c.grade_band
FROM question_generators qg
JOIN atomic_concepts ac ON qg.concept_id = ac.id
JOIN unit_topics ut ON ac.unit_topic_id = ut.id
JOIN courses c ON ut.course_id = c.id
WHERE qg.is_active = true
ORDER BY c.display_order, ut.display_order, ac.display_order;

-- View: Heat Question Results
CREATE OR REPLACE VIEW v_heat_question_results
WITH (security_invoker = true) AS
SELECT 
    hq.heat_id,
    hq.question_number,
    hq.difficulty,
    hq.correct_answer,
    qs.heat_participation_id,
    hp.athlete_id,
    u.display_name,
    qs.submitted_answer,
    qs.is_correct,
    qs.time_taken_ms,
    qs.points_earned
FROM heat_questions hq
JOIN question_submissions qs ON qs.heat_question_id = hq.id
JOIN heat_participations hp ON qs.heat_participation_id = hp.id
JOIN users u ON hp.athlete_id = u.id
ORDER BY hq.question_number, qs.time_taken_ms;

-- -----------------------------------------------------------------------------
-- PART 10: FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function: Calculate school week results
CREATE OR REPLACE FUNCTION calculate_school_week_results(
    p_league_week_id UUID
)
RETURNS void AS $$
BEGIN
    -- Aggregate results for each school in the league week
    INSERT INTO school_week_results (
        league_membership_id,
        league_week_id,
        total_points,
        participants_count,
        avg_cta_score,
        best_cta_score,
        gold_medals,
        silver_medals,
        bronze_medals,
        calculated_at
    )
    SELECT 
        lm.id,
        p_league_week_id,
        COALESCE(SUM(hp.ranking_points_earned), 0),
        COUNT(DISTINCT hp.athlete_id),
        AVG(hp.cta_score),
        MAX(hp.cta_score),
        SUM(CASE WHEN hp.medal = 'gold' THEN 1 ELSE 0 END),
        SUM(CASE WHEN hp.medal = 'silver' THEN 1 ELSE 0 END),
        SUM(CASE WHEN hp.medal = 'bronze' THEN 1 ELSE 0 END),
        NOW()
    FROM league_memberships lm
    JOIN league_weeks lw ON lw.league_id = lm.league_id
    JOIN league_heats lh ON lh.league_week_id = lw.id
    JOIN heat_participations hp ON hp.heat_id = lh.heat_id
    JOIN users u ON hp.athlete_id = u.id AND u.school_id = lm.school_id
    WHERE lw.id = p_league_week_id
    GROUP BY lm.id
    ON CONFLICT (league_membership_id, league_week_id) 
    DO UPDATE SET
        total_points = EXCLUDED.total_points,
        participants_count = EXCLUDED.participants_count,
        avg_cta_score = EXCLUDED.avg_cta_score,
        best_cta_score = EXCLUDED.best_cta_score,
        gold_medals = EXCLUDED.gold_medals,
        silver_medals = EXCLUDED.silver_medals,
        bronze_medals = EXCLUDED.bronze_medals,
        calculated_at = NOW();
        
    -- Update rankings within the week
    WITH ranked AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, avg_cta_score DESC) as new_rank
        FROM school_week_results
        WHERE league_week_id = p_league_week_id
    )
    UPDATE school_week_results swr
    SET rank_in_week = ranked.new_rank
    FROM ranked
    WHERE swr.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update league standings
CREATE OR REPLACE FUNCTION update_league_standings(
    p_league_id UUID
)
RETURNS void AS $$
BEGIN
    -- Aggregate all week results into league standings
    WITH aggregated AS (
        SELECT 
            lm.id AS membership_id,
            SUM(swr.total_points) AS total_points,
            COUNT(DISTINCT swr.league_week_id) AS heats_completed,
            AVG(swr.avg_cta_score) AS avg_team_cta,
            SUM(CASE WHEN swr.rank_in_week = 1 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN swr.rank_in_week > 1 THEN 1 ELSE 0 END) AS losses
        FROM league_memberships lm
        LEFT JOIN school_week_results swr ON swr.league_membership_id = lm.id
        WHERE lm.league_id = p_league_id
        GROUP BY lm.id
    )
    UPDATE league_memberships lm
    SET 
        total_points = COALESCE(a.total_points, 0),
        heats_completed = COALESCE(a.heats_completed, 0),
        avg_team_cta = a.avg_team_cta,
        wins = COALESCE(a.wins, 0),
        losses = COALESCE(a.losses, 0)
    FROM aggregated a
    WHERE lm.id = a.membership_id;
    
    -- Update rankings
    WITH ranked AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                ORDER BY total_points DESC, avg_team_cta DESC NULLS LAST
            ) as new_rank
        FROM league_memberships
        WHERE league_id = p_league_id
    )
    UPDATE league_memberships lm
    SET rank_in_league = ranked.new_rank
    FROM ranked
    WHERE lm.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- DONE!
-- -----------------------------------------------------------------------------
-- After running this:
-- 1. You have a full league system (divisions, seasons, leagues, weeks)
-- 2. You have curriculum structure (courses → topics → concepts)
-- 3. You have question generator metadata in the database
-- 4. You have heat template system for different competition formats
-- 5. RLS is enabled and policies are set
-- -----------------------------------------------------------------------------
