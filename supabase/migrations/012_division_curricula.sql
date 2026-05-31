-- =============================================================================
-- Sprint 0 / Migration 012 — Create division_curricula junction
-- =============================================================================
-- Junction table: which courses each division can compete on.
-- MVP rule (PROJECT_CONTEXT.md): Advanced / JV / SV can access NC Math 1.
-- Junior and Intermediate have no curriculum yet (greyed out in UI).
--
-- Migration 013 will seed the actual ADV/JV/SV → NC Math 1 rows once the
-- division codes are upserted.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Create table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.division_curricula (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id  UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    course_id    UUID NOT NULL REFERENCES public.courses(id)   ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT division_curricula_unique UNIQUE (division_id, course_id)
);

COMMENT ON TABLE public.division_curricula IS
    'Many-to-many: which courses each division can access. Empty division row means "greyed out / coming soon" in UI.';

-- -----------------------------------------------------------------------------
-- PART 2: Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_division_curricula_division
    ON public.division_curricula (division_id);

CREATE INDEX IF NOT EXISTS idx_division_curricula_course
    ON public.division_curricula (course_id);

-- -----------------------------------------------------------------------------
-- PART 3: Row-Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.division_curricula ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read division_curricula" ON public.division_curricula;
CREATE POLICY "Public read division_curricula"
    ON public.division_curricula FOR SELECT
    USING (true);

-- Writes happen via service role or admin code paths only.

-- -----------------------------------------------------------------------------
-- PART 4: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'division_curricula'
    ) INTO v_exists;

    RAISE NOTICE '✓ division_curricula exists: %', v_exists;
END $$;

COMMIT;
