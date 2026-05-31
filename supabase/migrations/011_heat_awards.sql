-- =============================================================================
-- Sprint 0 / Migration 011 — Create heat_awards
-- =============================================================================
-- Heat awards are the percentile-based awards assigned after each Heat,
-- per the Award System defined in PROJECT_CONTEXT.md:
--   - participation: every eligible Mathlete who completes the Heat
--   - bronze:        70–80th percentile within division
--   - silver:        80–90th
--   - gold:          90–96th
--   - platinum:      96–99th
--   - champion:      99–100th (or rank 1–3)
--
-- One row per (heat, athlete). Division-scoped because percentile is
-- computed within division. Eligibility (≥60% accuracy) is enforced at
-- insert time by the application, not by the schema.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Create heat_awards table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.heat_awards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_id       UUID NOT NULL REFERENCES public.heats(id) ON DELETE CASCADE,
    athlete_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    division_id   UUID REFERENCES public.divisions(id) ON DELETE SET NULL,

    -- Performance metrics (denormalized at award time so historical awards
    -- survive if heat_participations is later edited)
    raw_score     DECIMAL(10,2),
    accuracy_pct  DECIMAL(5,2),
    percentile    DECIMAL(5,2),

    -- Award tier
    award_level   TEXT NOT NULL,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT heat_awards_unique_per_heat UNIQUE (heat_id, athlete_id),
    CONSTRAINT heat_awards_level_check CHECK (
        award_level IN ('participation','bronze','silver','gold','platinum','champion')
    ),
    CONSTRAINT heat_awards_accuracy_range CHECK (
        accuracy_pct IS NULL OR (accuracy_pct >= 0 AND accuracy_pct <= 100)
    ),
    CONSTRAINT heat_awards_percentile_range CHECK (
        percentile IS NULL OR (percentile >= 0 AND percentile <= 100)
    )
);

COMMENT ON TABLE public.heat_awards IS
    'Percentile-based awards assigned at Heat completion. One row per (heat, athlete). award_level ∈ {participation, bronze, silver, gold, platinum, champion}.';

COMMENT ON COLUMN public.heat_awards.raw_score    IS 'CTA score (or equivalent composite) at award time.';
COMMENT ON COLUMN public.heat_awards.accuracy_pct IS 'Accuracy percentage 0–100. Eligibility threshold is ≥60.';
COMMENT ON COLUMN public.heat_awards.percentile   IS 'Percentile within division for this Heat. NULL for participation-only awards.';

-- -----------------------------------------------------------------------------
-- PART 2: Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_heat_awards_heat_level
    ON public.heat_awards (heat_id, award_level);

CREATE INDEX IF NOT EXISTS idx_heat_awards_athlete
    ON public.heat_awards (athlete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_heat_awards_division
    ON public.heat_awards (division_id, award_level)
    WHERE division_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- PART 3: Row-Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.heat_awards ENABLE ROW LEVEL SECURITY;

-- Public read: awards are public recognition, like medals
DROP POLICY IF EXISTS "Public read heat_awards" ON public.heat_awards;
CREATE POLICY "Public read heat_awards"
    ON public.heat_awards FOR SELECT
    USING (true);

-- Inserts/updates/deletes happen via service role or admin code paths; no
-- end-user-facing policy is granted here on purpose.

-- -----------------------------------------------------------------------------
-- PART 4: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_exists BOOLEAN;
    v_indexes INT;
    v_policies INT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'heat_awards'
    ) INTO v_exists;

    SELECT COUNT(*) INTO v_indexes
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'heat_awards';

    SELECT COUNT(*) INTO v_policies
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'heat_awards';

    RAISE NOTICE '✓ heat_awards exists: %', v_exists;
    RAISE NOTICE '✓ heat_awards indexes: %', v_indexes;
    RAISE NOTICE '✓ heat_awards policies: %', v_policies;
END $$;

COMMIT;
