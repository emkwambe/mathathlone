-- =============================================================================
-- MathAthlone: Views & Functions
-- =============================================================================
-- Run AFTER: 000_preflight, 004_nc_math_1_seed, 003_integrity_system
--
-- Adds the views and helper functions from the original 002 migration that
-- aren't included in NC-MATH-1-COMPLETE.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Add missing supporting tables (league_weeks, school_week_results)
-- -----------------------------------------------------------------------------
-- These are needed by the league standings function but weren't in 004.

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
    is_championship BOOLEAN DEFAULT false,
    UNIQUE(league_id, week_number)
);

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
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_membership_id, league_week_id)
);

CREATE TABLE IF NOT EXISTS heat_template_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_template_id UUID REFERENCES heat_templates(id) ON DELETE CASCADE,
    question_slot INTEGER NOT NULL,
    generator_id UUID REFERENCES question_generators(id),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 4),
    points_value INTEGER DEFAULT 100,
    time_limit_seconds INTEGER DEFAULT 90,
    UNIQUE(heat_template_id, question_slot)
);

ALTER TABLE league_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_week_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_template_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read league_weeks" ON league_weeks;
CREATE POLICY "Public read league_weeks" ON league_weeks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read school_week_results" ON school_week_results;
CREATE POLICY "Public read school_week_results" ON school_week_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read heat_template_questions" ON heat_template_questions;
CREATE POLICY "Public read heat_template_questions" ON heat_template_questions FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- PART 2: Add divisions/seasons FK to leagues if not present
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    -- Add division_id to leagues if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='leagues' AND column_name='division_id'
    ) THEN
        ALTER TABLE leagues ADD COLUMN division_id UUID REFERENCES divisions(id);
    END IF;

    -- Add season_id to leagues if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='leagues' AND column_name='season_id'
    ) THEN
        ALTER TABLE leagues ADD COLUMN season_id UUID REFERENCES seasons(id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: VIEWS
-- -----------------------------------------------------------------------------

-- View: League Standings
DROP VIEW IF EXISTS v_league_standings CASCADE;
CREATE VIEW v_league_standings
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
LEFT JOIN divisions d ON l.division_id = d.id
LEFT JOIN seasons s ON l.season_id = s.id
JOIN league_memberships lm ON lm.league_id = l.id
JOIN schools sch ON lm.school_id = sch.id
WHERE lm.is_active = true
ORDER BY lm.rank_in_league ASC NULLS LAST;

-- View: Generator Catalog
DROP VIEW IF EXISTS v_generator_catalog CASCADE;
CREATE VIEW v_generator_catalog
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
DROP VIEW IF EXISTS v_heat_question_results CASCADE;
CREATE VIEW v_heat_question_results
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
-- PART 4: FUNCTIONS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_school_week_results(
    p_league_week_id UUID
)
RETURNS void AS $$
BEGIN
    INSERT INTO school_week_results (
        league_membership_id, league_week_id, total_points, participants_count,
        avg_cta_score, best_cta_score, gold_medals, silver_medals, bronze_medals,
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

    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, avg_cta_score DESC) as new_rank
        FROM school_week_results
        WHERE league_week_id = p_league_week_id
    )
    UPDATE school_week_results swr
    SET rank_in_week = ranked.new_rank
    FROM ranked
    WHERE swr.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION update_league_standings(
    p_league_id UUID
)
RETURNS void AS $$
BEGIN
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

    WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY total_points DESC, avg_team_cta DESC NULLS LAST) as new_rank
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
-- DONE
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_views INT;
    v_funcs INT;
BEGIN
    SELECT COUNT(*) INTO v_views FROM information_schema.views
    WHERE table_schema='public' AND table_name IN ('v_league_standings','v_generator_catalog','v_heat_question_results');

    SELECT COUNT(*) INTO v_funcs FROM information_schema.routines
    WHERE routine_schema='public' AND routine_name IN ('calculate_school_week_results','update_league_standings');

    RAISE NOTICE '✅ Views: %/3, Functions: %/2', v_views, v_funcs;
END $$;
