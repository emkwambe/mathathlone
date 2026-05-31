-- =============================================================================
-- Sprint 0 / Migration 015 — Cleanup
-- =============================================================================
-- Final cleanup items identified during live verification:
--   1. Drop any RLS policy on `heats` that references a nonexistent
--      `broadcast_heats` table (migration 010 handled the named policy;
--      this is a belt-and-suspenders sweep for any other policy whose
--      qual/with_check still mentions broadcast_heats).
--   2. Document the heat_participations focus_violations integer/jsonb
--      situation: live confirmed it is INTEGER. Migration 003 also added
--      `focus_violation_count INTEGER` as the explicit counter. Both exist
--      as integer counters. Add COMMENTs so new code knows which to use.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Sweep for any remaining policies referencing broadcast_heats
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_broadcast_exists BOOLEAN;
    pol RECORD;
    v_dropped INT := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'broadcast_heats'
    ) INTO v_broadcast_exists;

    IF v_broadcast_exists THEN
        RAISE NOTICE 'broadcast_heats table exists — leaving its policies intact.';
        RETURN;
    END IF;

    FOR pol IN
        SELECT schemaname, tablename, policyname, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND (
              COALESCE(qual::text,       '') LIKE '%broadcast_heats%'
           OR COALESCE(with_check::text, '') LIKE '%broadcast_heats%'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename
        );
        v_dropped := v_dropped + 1;
        RAISE NOTICE '✓ Dropped policy "%" on %.% (referenced missing broadcast_heats).',
            pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;

    RAISE NOTICE '✓ Total broadcast_heats-referencing policies dropped: %', v_dropped;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Document the focus_violations counter columns on heat_participations
-- -----------------------------------------------------------------------------
-- Live verification confirmed heat_participations.focus_violations is INTEGER
-- (the base schema "won" the IF NOT EXISTS race against migration 003's JSONB
-- attempt). The 003 migration also added `focus_violation_count INTEGER`.
-- Both are now integer counters; we keep both for backward compatibility
-- but mark focus_violation_count as the canonical one going forward.

DO $$
DECLARE
    v_has_focus_violations BOOLEAN;
    v_has_focus_violation_count BOOLEAN;
    v_focus_violations_type TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'heat_participations'
          AND column_name = 'focus_violations'
    ), EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'heat_participations'
          AND column_name = 'focus_violation_count'
    )
    INTO v_has_focus_violations, v_has_focus_violation_count;

    IF v_has_focus_violations THEN
        SELECT data_type INTO v_focus_violations_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'heat_participations'
          AND column_name = 'focus_violations';

        EXECUTE 'COMMENT ON COLUMN public.heat_participations.focus_violations IS ' ||
                quote_literal(
                    'Legacy integer counter from base schema (live type: ' ||
                    COALESCE(v_focus_violations_type, 'unknown') ||
                    '). New code should prefer focus_violation_count (added in migration 003). Do not store JSONB here.'
                );
    END IF;

    IF v_has_focus_violation_count THEN
        COMMENT ON COLUMN public.heat_participations.focus_violation_count IS
            'Canonical counter for focus-mode violation incidents in this participation. Updated by the focus_violations trigger.';
    END IF;

    RAISE NOTICE '✓ heat_participations.focus_violations present: % (data_type: %)',
        v_has_focus_violations, COALESCE(v_focus_violations_type, 'n/a');
    RAISE NOTICE '✓ heat_participations.focus_violation_count present: %',
        v_has_focus_violation_count;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Final cleanup summary
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_remaining_bad_policies INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining_bad_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
          COALESCE(qual::text,       '') LIKE '%broadcast_heats%'
       OR COALESCE(with_check::text, '') LIKE '%broadcast_heats%'
      );

    RAISE NOTICE '✓ Remaining policies referencing broadcast_heats (should be 0 unless table exists): %',
        v_remaining_bad_policies;
END $$;

COMMIT;
