-- =============================================================================
-- NC MATH 1 COMPLETE - ALL-IN-ONE SQL
-- =============================================================================
-- Run this ONCE in Supabase SQL Editor to set up everything
-- =============================================================================

-- PART 1: LEAGUE SYSTEM TABLES
-- =============================================================================

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
DO $$ BEGIN ALTER TABLE courses ADD CONSTRAINT courses_code_key UNIQUE (code); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS unit_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS question_generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID REFERENCES atomic_concepts(id) ON DELETE CASCADE,
    generator_type TEXT NOT NULL,
    answer_type TEXT NOT NULL,
    difficulty_config JSONB DEFAULT '{}'::jsonb,
    example_question TEXT,
    example_answer TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN ALTER TABLE question_generators ADD CONSTRAINT question_generators_generator_type_key UNIQUE (generator_type); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
DO $$ BEGIN ALTER TABLE divisions ADD CONSTRAINT divisions_code_key UNIQUE (code); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS league_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS heat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 15,
    question_count INTEGER DEFAULT 20,
    difficulty_distribution JSONB DEFAULT '{"1": 5, "2": 8, "3": 5, "4": 2}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN ALTER TABLE heat_templates ADD CONSTRAINT heat_templates_code_key UNIQUE (code); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PART 2: STATIC QUESTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS static_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id TEXT NOT NULL,
    concept_name TEXT NOT NULL,
    course TEXT NOT NULL DEFAULT 'NC Math 1',
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'select_all', 'image_choice')),
    question_text TEXT NOT NULL,
    question_latex TEXT,
    question_image_url TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    option_images JSONB,
    correct_answer TEXT NOT NULL,
    correct_answer_index INTEGER,
    explanation TEXT,
    solution_steps JSONB,
    difficulty INTEGER NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 4),
    category TEXT,
    tags JSONB DEFAULT '[]',
    times_used INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_static_questions_concept ON static_questions(concept_id);
CREATE INDEX IF NOT EXISTS idx_static_questions_active ON static_questions(is_active) WHERE is_active = true;

-- PART 3: ENABLE RLS
-- =============================================================================

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
ALTER TABLE heat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read courses" ON courses;
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read divisions" ON divisions;
CREATE POLICY "Public read divisions" ON divisions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read heat_templates" ON heat_templates;
CREATE POLICY "Public read heat_templates" ON heat_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read static_questions" ON static_questions;
CREATE POLICY "Public read static_questions" ON static_questions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Read heat questions" ON heat_questions;
CREATE POLICY "Read heat questions" ON heat_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert submissions" ON question_submissions;
CREATE POLICY "Insert submissions" ON question_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Read own submissions" ON question_submissions;
CREATE POLICY "Read own submissions" ON question_submissions FOR SELECT USING (true);

-- PART 4: SEED DATA
-- =============================================================================

-- Divisions
INSERT INTO divisions (name, code, grade_min, grade_max, description, display_order) VALUES
('Rising Stars', 'D1', 4, 5, 'Elementary - Grades 4-5', 1),
('Challengers', 'D2', 6, 7, 'Middle School - Grades 6-7', 2),
('Contenders', 'D3', 8, 9, 'Pre-Algebra/Algebra - Grades 8-9', 3),
('Varsity', 'D4', 10, 12, 'Advanced - Grades 10-12', 4)
ON CONFLICT DO NOTHING;

-- Heat Templates
INSERT INTO heat_templates (name, code, description, duration_minutes, question_count, difficulty_distribution, is_default) VALUES
('Sprint', 'SPRINT', '15 min, 20 questions - fast paced', 15, 20, '{"1": 5, "2": 8, "3": 5, "4": 2}', true),
('Target', 'TARGET', '20 min, 10 questions - deeper problems', 20, 10, '{"2": 4, "3": 4, "4": 2}', false),
('Practice', 'PRACTICE', 'Low pressure practice', 20, 15, '{"1": 8, "2": 5, "3": 2, "4": 0}', false),
('Championship', 'CHAMPIONSHIP', 'High stakes championship', 25, 25, '{"1": 4, "2": 8, "3": 8, "4": 5}', false)
ON CONFLICT DO NOTHING;

-- NC Math 1 Course
INSERT INTO courses (name, code, grade_band, state, description) VALUES
('NC Math 1', 'NCM1', '9', 'NC', 'North Carolina Math 1')
ON CONFLICT DO NOTHING;

-- PART 5: STATIC QUESTIONS (50 questions for 30 non-generator concepts)
-- =============================================================================

INSERT INTO static_questions (concept_id, concept_name, question_type, question_text, options, correct_answer, correct_answer_index, explanation, difficulty, category) VALUES

-- Understanding Variables
('M1.EQN.1.1', 'Understanding Variables', 'multiple_choice', 'Which expression represents "five more than a number n"?', '["5n", "n - 5", "n + 5", "n ÷ 5"]', 'C', 2, '"Five more than" means adding 5', 1, 'conceptual'),
('M1.EQN.1.1', 'Understanding Variables', 'multiple_choice', 'The variable x in 3x + 7 = 19 represents:', '["Any number", "A specific unknown value", "The number 3", "The number 19"]', 'B', 1, 'Variables in equations represent specific values', 1, 'conceptual'),

-- Understanding Equations
('M1.EQN.2.1', 'Understanding Equations', 'multiple_choice', 'An equation is best described as:', '["An expression with variables", "A statement that two expressions are equal", "A number sentence", "A formula"]', 'B', 1, 'Equations show equality between expressions', 1, 'conceptual'),
('M1.EQN.2.1', 'Understanding Equations', 'multiple_choice', 'Solving an equation means:', '["Simplifying", "Finding values that make it true", "Adding to both sides", "Combining terms"]', 'B', 1, 'We solve to find what makes it true', 1, 'conceptual'),

-- Graphing Inequalities
('M1.EQN.5.1', 'Graphing Inequalities', 'multiple_choice', 'The inequality x > 3 is graphed with:', '["Closed circle, shade left", "Open circle, shade right", "Closed circle, shade right", "Open circle, shade left"]', 'B', 1, '> uses open circle, shade right', 2, 'visual'),
('M1.EQN.5.1', 'Graphing Inequalities', 'multiple_choice', 'Which inequality uses a closed circle?', '["x < 5", "x > 5", "x ≤ 5", "x ≠ 5"]', 'C', 2, '≤ and ≥ include the endpoint (closed)', 2, 'visual'),

-- Relations vs Functions
('M1.FLF.1.1', 'Relations vs Functions', 'multiple_choice', 'Which is a function?', '["{(1,2), (1,3), (2,4)}", "{(1,2), (2,2), (3,2)}", "{(1,2), (2,3), (1,4)}", "{(0,1), (0,2), (0,3)}"]', 'B', 1, 'Each x-value must have exactly one y-value', 2, 'conceptual'),
('M1.FLF.1.1', 'Relations vs Functions', 'multiple_choice', 'A function requires:', '["All outputs different", "Each input → exactly one output", "Each output → exactly one input", "Positive inputs"]', 'B', 1, 'Definition of a function', 2, 'conceptual'),

-- Vertical Line Test
('M1.FLF.1.2', 'Vertical Line Test', 'multiple_choice', 'A graph passes the vertical line test if:', '["Every vertical line touches it", "No vertical line touches it twice", "It is straight", "It passes through origin"]', 'B', 1, 'More than one intersection = not a function', 2, 'visual'),
('M1.FLF.1.2', 'Vertical Line Test', 'multiple_choice', 'Which FAILS the vertical line test?', '["Diagonal line", "Parabola up", "Circle", "V-shape"]', 'C', 2, 'Circle has two y-values for most x-values', 2, 'visual'),

-- Graphing Slope-Intercept
('M1.FLF.2.2', 'Graphing Slope-Intercept', 'multiple_choice', 'To graph y = 2x - 3, first plot:', '["(2, -3)", "(0, -3)", "(-3, 0)", "(2, 0)"]', 'B', 1, 'Start with y-intercept (0, -3)', 2, 'visual'),

-- Horizontal/Vertical Lines
('M1.FLF.2.4', 'Horizontal/Vertical Lines', 'multiple_choice', 'The slope of y = 5 is:', '["5", "0", "Undefined", "1"]', 'B', 1, 'Horizontal lines have slope 0', 2, 'conceptual'),
('M1.FLF.2.4', 'Horizontal/Vertical Lines', 'multiple_choice', 'Vertical line through (3, -2):', '["y = -2", "x = 3", "y = 3", "x = -2"]', 'B', 1, 'Vertical: x = constant', 2, 'conceptual'),

-- Graphing 2-var Inequalities
('M1.FLF.5.1', 'Graphing 2-var Inequalities', 'multiple_choice', 'For y > 2x + 1, the boundary is:', '["Solid, above", "Solid, below", "Dashed, above", "Dashed, below"]', 'C', 2, '> means dashed line, shade above', 3, 'visual'),

-- Interpret Linear Context
('M1.FLF.6.1', 'Interpret Linear Context', 'multiple_choice', 'In C = 10m + 25, what is 10?', '["Initial fee", "Monthly cost", "Total cost", "Months"]', 'B', 1, 'Coefficient of m is rate per month', 2, 'word_problem'),
('M1.FLF.6.1', 'Interpret Linear Context', 'multiple_choice', 'In d = 65t, what is 65?', '["Time", "Distance", "Speed", "Start position"]', 'C', 2, 'Rate = 65 miles per hour', 2, 'word_problem'),

-- Model with Linear Functions
('M1.FLF.6.2', 'Model with Linear', 'multiple_choice', 'Plumber: $50 call + $75/hr. Total cost C for h hours?', '["C = 50h + 75", "C = 75h + 50", "C = 125h", "C = 50 + 75"]', 'B', 1, 'Rate × hours + flat fee', 2, 'word_problem'),

-- Compare Functions
('M1.FLF.7.1', 'Compare Functions', 'multiple_choice', 'f(x) = 3x + 2, g(x) passes through (0,1) and (2,7). Greater slope?', '["f(x)", "g(x)", "Equal", "Cannot tell"]', 'B', 1, 'f slope=3, g slope=(7-1)/(2-0)=3. Equal!', 3, 'analysis'),

-- Understanding Systems
('M1.SYS.1.1', 'Understanding Systems', 'multiple_choice', 'A system solution satisfies:', '["Any one equation", "Both equations", "Neither equation", "The steeper line"]', 'B', 1, 'Must work in BOTH equations', 2, 'conceptual'),
('M1.SYS.1.1', 'Understanding Systems', 'multiple_choice', 'Graphically, one solution means:', '["Parallel lines", "One intersection", "Same line", "No intersection"]', 'B', 1, 'One intersection = one solution', 2, 'conceptual'),

-- Solve by Graphing
('M1.SYS.1.2', 'Solve by Graphing', 'multiple_choice', 'Lines intersect at (2, 3). The solution is:', '["No solution", "(2, 3)", "Infinite", "(3, 2)"]', 'B', 1, 'Intersection point IS the solution', 2, 'visual'),

-- Write System from Context
('M1.SYS.4.1', 'Write System', 'multiple_choice', 'Adult $12, child $8. 15 tickets for $156. System?', '["a+c=156; 12a+8c=15", "a+c=15; 12a+8c=156", "a+c=15; 8a+12c=156", "12a+8c=15"]', 'B', 1, 'Count equation + cost equation', 3, 'word_problem'),

-- System of Inequalities
('M1.SYS.5.1', 'System of Inequalities', 'multiple_choice', 'Solution to a system of inequalities is:', '["A point", "A line", "A region", "Empty"]', 'C', 2, 'Overlap of shaded regions', 2, 'conceptual'),

-- Exponential Characteristics
('M1.EXP.2.1', 'Exponential Characteristics', 'multiple_choice', 'NOT a characteristic of exponential growth:', '["Rapid increase", "Constant rate of change", "Curved graph", "Never touches x-axis"]', 'B', 1, 'Exponential has multiplicative, not constant, rate', 2, 'conceptual'),
('M1.EXP.2.1', 'Exponential Characteristics', 'multiple_choice', 'y = ab^x with b = 0.5 represents:', '["Growth", "Decay", "Linear", "No change"]', 'B', 1, '0 < b < 1 means decay', 2, 'conceptual'),

-- Write Exponential from Context
('M1.EXP.3.2', 'Write Exponential', 'multiple_choice', '500 bacteria triple hourly. Equation?', '["P = 500 + 3h", "P = 500(3)^h", "P = 3(500)^h", "P = 500h³"]', 'B', 1, 'Initial × (factor)^time', 3, 'word_problem'),

-- Exponential Word Problems
('M1.EXP.4.1', 'Exponential Word Problems', 'multiple_choice', '$20,000 car, 15% yearly depreciation. After 2 years?', '["$17,000", "$14,450", "$12,000", "$20,000"]', 'B', 1, '20000 × 0.85² = $14,450', 3, 'word_problem'),

-- Polynomial Vocabulary
('M1.POLY.1.1', 'Polynomial Vocabulary', 'multiple_choice', 'Degree of 3x⁴ - 2x² + 5x - 1:', '["3", "4", "5", "-1"]', 'B', 1, 'Highest exponent = 4', 1, 'conceptual'),
('M1.POLY.1.1', 'Polynomial Vocabulary', 'multiple_choice', 'Leading coefficient of 5x³ - 2x² + x:', '["5", "-2", "1", "3"]', 'A', 0, 'Coefficient of highest degree term', 1, 'conceptual'),

-- Choose Factoring Method
('M1.POLY.6.1', 'Choose Factoring', 'multiple_choice', 'First step to factor 2x² - 8:', '["FOIL", "Factor GCF", "Quadratic formula", "Complete square"]', 'B', 1, 'Always check GCF first: 2(x² - 4)', 2, 'analysis'),

-- Quadratic Definition
('M1.QUAD.1.1', 'Quadratic Definition', 'multiple_choice', 'Which is quadratic?', '["y = 2x + 3", "y = x² - 4", "y = 2^x", "y = |x|"]', 'B', 1, 'Quadratic has x² as highest power', 1, 'conceptual'),

-- Interpret Quadratic Context
('M1.QUAD.1.3', 'Interpret Quadratic', 'multiple_choice', 'h(t) = -16t² + 48t + 4 vertex represents:', '["Start height", "Max height & time", "Ground hit", "Initial velocity"]', 'B', 1, 'Vertex = maximum for projectile', 3, 'word_problem'),

-- Zeros/Roots/X-intercepts
('M1.QUAD.2.1', 'Zeros/Roots', 'multiple_choice', 'Zeros, roots, x-intercepts all mean:', '["y when x=0", "x when y=0", "Vertex", "Axis of symmetry"]', 'B', 1, 'Where function equals zero', 2, 'conceptual'),

-- Types of Data
('M1.DAS.1.1', 'Types of Data', 'multiple_choice', 'Quantitative data example:', '["Eye color", "Favorite food", "Height in inches", "Zip code"]', 'C', 2, 'Height is measurable/numerical', 1, 'conceptual'),

-- Standard Deviation
('M1.DAS.2.3', 'Standard Deviation', 'multiple_choice', 'Larger standard deviation means:', '["More spread out", "More clustered", "Higher mean", "More data"]', 'A', 0, 'SD measures spread from mean', 2, 'conceptual'),

-- Interpret Scatter Plots
('M1.DAS.3.2', 'Interpret Scatter', 'multiple_choice', 'Points lower-left to upper-right show:', '["Negative correlation", "Positive correlation", "No correlation", "Perfect"]', 'B', 1, 'Upward trend = positive', 2, 'visual'),

-- Correlation Coefficient
('M1.DAS.5.1', 'Correlation Coefficient', 'multiple_choice', 'r = -0.92 indicates:', '["Weak positive", "Strong positive", "Weak negative", "Strong negative"]', 'D', 3, 'Close to -1 = strong negative', 2, 'conceptual'),

-- Correlation vs Causation
('M1.DAS.5.2', 'Correlation vs Causation', 'multiple_choice', 'Ice cream sales and drownings are correlated because:', '["Ice cream causes drowning", "Drowning causes sales", "Third factor (summer)", "Bad data"]', 'C', 2, 'Lurking variable: summer heat', 2, 'conceptual'),

-- Transformations Intro
('M1.GEO.TRANS.1.1', 'Transformations Intro', 'multiple_choice', 'Which changes SIZE?', '["Translation", "Rotation", "Reflection", "Dilation"]', 'D', 3, 'Only dilation changes size', 1, 'conceptual'),

-- Congruence
('M1.GEO.TRANS.6.1', 'Congruence', 'multiple_choice', 'Congruent figures map via:', '["Any transformation", "Only translations", "Rigid motions only", "Dilations"]', 'C', 2, 'Rigid motions preserve size/shape', 2, 'conceptual'),

-- Line Symmetry
('M1.GEO.TRANS.8.1', 'Line Symmetry', 'multiple_choice', 'Non-square rectangle has how many lines of symmetry?', '["0", "1", "2", "4"]', 'C', 2, 'Vertical and horizontal through center', 2, 'visual'),

-- Rotational Symmetry
('M1.GEO.TRANS.8.2', 'Rotational Symmetry', 'multiple_choice', 'Regular hexagon rotational symmetry order:', '["2", "3", "4", "6"]', 'D', 3, 'Maps to itself 6 times in 360°', 2, 'visual')

ON CONFLICT DO NOTHING;

-- =============================================================================
-- DONE! Verify counts:
-- =============================================================================
DO $$
DECLARE
    div_count INTEGER;
    temp_count INTEGER;
    sq_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO div_count FROM divisions;
    SELECT COUNT(*) INTO temp_count FROM heat_templates;
    SELECT COUNT(*) INTO sq_count FROM static_questions;
    RAISE NOTICE '✅ Divisions: %, Templates: %, Static Questions: %', div_count, temp_count, sq_count;
END $$;
