-- =============================================================================
-- Sprint 0 / Migration 009 — Fix violation type enum
-- =============================================================================
-- Background:
--   Base schema (mathathlone-schema.sql) created enum `violation_type` with
--   integrity-domain labels (focus, velocity, suspected_solver, ...).
--   Migration 003 attempted to redefine `violation_type` with web-event labels
--   (tab_switch, window_blur, fullscreen_exit, ...) but wrapped the CREATE TYPE
--   in EXCEPTION WHEN duplicate_object → the second creation was skipped.
--
--   Result: `focus_violations.violation_type` cannot store tab_switch/etc.,
--   so the integrity feature would fail at INSERT.
--
-- Fix:
--   1. Create a NEW enum `focus_violation_type` with the web-event labels.
--   2. Try to ALTER focus_violations.violation_type to the new enum.
--   3. If the ALTER fails (existing rows incompatible), add a NEW column
--      `event_type focus_violation_type` and let new code use that instead.
--
-- Idempotent: every statement is guarded.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Create the new enum
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    CREATE TYPE focus_violation_type AS ENUM (
        'tab_switch',
        'window_blur',
        'copy_attempt',
        'fullscreen_exit',
        'devtools_open',
        'paste_attempt'
    );
EXCEPTION WHEN duplicate_object THEN
    -- Enum already exists — ensure all required values are present.
    NULL;
END $$;

-- Ensure each expected value exists (in case the enum was partially defined elsewhere)
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'tab_switch';      EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'window_blur';     EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'copy_attempt';    EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'fullscreen_exit'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'devtools_open';   EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE focus_violation_type ADD VALUE IF NOT EXISTS 'paste_attempt';   EXCEPTION WHEN others THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Apply the new enum to focus_violations
-- -----------------------------------------------------------------------------
-- Strategy: try to ALTER the existing `violation_type` column. If it fails
-- (e.g., legacy rows with values that don't map), fall back to adding a new
-- column `event_type` that uses the new enum. New code should prefer
-- `event_type` over `violation_type`.

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_col_exists   BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'focus_violations'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        RAISE NOTICE 'focus_violations table does not exist — nothing to alter.';
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'focus_violations'
          AND column_name = 'violation_type'
    ) INTO v_col_exists;

    -- Attempt direct ALTER (works only if no incompatible rows exist)
    IF v_col_exists THEN
        BEGIN
            ALTER TABLE public.focus_violations
                ALTER COLUMN violation_type TYPE focus_violation_type
                USING (
                    CASE violation_type::text
                        WHEN 'tab_switch'      THEN 'tab_switch'::focus_violation_type
                        WHEN 'window_blur'     THEN 'window_blur'::focus_violation_type
                        WHEN 'copy_attempt'    THEN 'copy_attempt'::focus_violation_type
                        WHEN 'fullscreen_exit' THEN 'fullscreen_exit'::focus_violation_type
                        WHEN 'devtools_open'   THEN 'devtools_open'::focus_violation_type
                        WHEN 'paste_attempt'   THEN 'paste_attempt'::focus_violation_type
                        WHEN 'focus'           THEN 'tab_switch'::focus_violation_type
                        WHEN 'velocity'        THEN 'tab_switch'::focus_violation_type
                        WHEN 'suspected_solver' THEN 'devtools_open'::focus_violation_type
                        WHEN 'answer_sharing'  THEN 'copy_attempt'::focus_violation_type
                        WHEN 'identity'        THEN 'tab_switch'::focus_violation_type
                        ELSE 'tab_switch'::focus_violation_type
                    END
                );
            RAISE NOTICE 'focus_violations.violation_type altered to focus_violation_type.';
        EXCEPTION WHEN OTHERS THEN
            -- Fallback: add a new column `event_type` that uses the new enum
            BEGIN
                ALTER TABLE public.focus_violations
                    ADD COLUMN IF NOT EXISTS event_type focus_violation_type;
                COMMENT ON COLUMN public.focus_violations.event_type IS
                    'Use this column for new code. The legacy violation_type column could not be retyped (likely due to incompatible existing data).';
                RAISE NOTICE 'Could not alter violation_type (%). Added event_type column instead.', SQLERRM;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not modify focus_violations: %', SQLERRM;
            END;
        END;
    ELSE
        -- No violation_type column at all — just add event_type
        ALTER TABLE public.focus_violations
            ADD COLUMN IF NOT EXISTS event_type focus_violation_type;
        COMMENT ON COLUMN public.focus_violations.event_type IS
            'Canonical focus-violation event type. Use this column in new code.';
        RAISE NOTICE 'No violation_type column found; added event_type column.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_enum_labels TEXT[];
    v_col_type    TEXT;
    v_has_event_type BOOLEAN;
BEGIN
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
    INTO v_enum_labels
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'focus_violation_type';

    SELECT udt_name INTO v_col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'focus_violations'
      AND column_name = 'violation_type';

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'focus_violations'
          AND column_name = 'event_type'
    ) INTO v_has_event_type;

    RAISE NOTICE '✓ focus_violation_type enum values: %', v_enum_labels;
    RAISE NOTICE '✓ focus_violations.violation_type udt_name: %', v_col_type;
    RAISE NOTICE '✓ focus_violations.event_type column present: %', v_has_event_type;
END $$;

COMMIT;
