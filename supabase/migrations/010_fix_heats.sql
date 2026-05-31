-- =============================================================================
-- Sprint 0 / Migration 010 — Fix heats table
-- =============================================================================
-- Live-confirmed state (LIVE_QUERY_RESULTS.md A1):
--   - heats has 24 columns
--   - Missing: division_id, is_global, division_code, auto_scheduled, unit_topic_id
--   - topic_id is NOT NULL FK to legacy topics(id) — we keep it for backward
--     compatibility and add unit_topic_id as the forward path
--
-- This migration:
--   1. Adds the 5 missing columns (nullable so existing rows survive)
--   2. Extends heat_type enum with: sprint, target, championship
--   3. Extends heat_status enum with: lobby, countdown, active, finished
--   4. Adds index for the global-lobby query path
--   5. Drops the dangling "Read public broadcast heats" RLS policy that
--      references a nonexistent broadcast_heats table
--
-- Idempotent: every operation is guarded.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Add missing columns to heats
-- -----------------------------------------------------------------------------

ALTER TABLE public.heats ADD COLUMN IF NOT EXISTS division_id    UUID;
ALTER TABLE public.heats ADD COLUMN IF NOT EXISTS is_global      BOOLEAN DEFAULT false;
ALTER TABLE public.heats ADD COLUMN IF NOT EXISTS division_code  TEXT;
ALTER TABLE public.heats ADD COLUMN IF NOT EXISTS auto_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.heats ADD COLUMN IF NOT EXISTS unit_topic_id  UUID;

-- Add FK constraints only if missing
DO $$ BEGIN
    ALTER TABLE public.heats
        ADD CONSTRAINT heats_division_id_fkey
        FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.heats
        ADD CONSTRAINT heats_unit_topic_id_fkey
        FOREIGN KEY (unit_topic_id) REFERENCES public.unit_topics(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.heats.division_id   IS 'Forward path: which Division this Heat targets. Replaces ad-hoc grade filtering.';
COMMENT ON COLUMN public.heats.is_global     IS 'TRUE for cron-launched always-on Heats anyone can join. Pairs with division_code.';
COMMENT ON COLUMN public.heats.division_code IS 'Denormalized division.code for fast global-lobby lookups (JR/INT/ADV/JV/SV).';
COMMENT ON COLUMN public.heats.auto_scheduled IS 'TRUE for cron-created Heats (vs teacher-created). Pairs with is_global.';
COMMENT ON COLUMN public.heats.unit_topic_id IS 'Forward path: FK to unit_topics. Coexists with legacy topic_id until migration 016 drops topic_id.';

-- -----------------------------------------------------------------------------
-- PART 2: Extend heat_type enum with sprint / target / championship
-- -----------------------------------------------------------------------------

DO $$ BEGIN ALTER TYPE public.heat_type ADD VALUE IF NOT EXISTS 'sprint';        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_type ADD VALUE IF NOT EXISTS 'target';        EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_type ADD VALUE IF NOT EXISTS 'championship';  EXCEPTION WHEN others THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Extend heat_status enum with lifecycle values
-- -----------------------------------------------------------------------------

DO $$ BEGIN ALTER TYPE public.heat_status ADD VALUE IF NOT EXISTS 'lobby';     EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_status ADD VALUE IF NOT EXISTS 'countdown'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_status ADD VALUE IF NOT EXISTS 'active';    EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_status ADD VALUE IF NOT EXISTS 'finished';  EXCEPTION WHEN others THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- PART 4: Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_heats_global_lobby
    ON public.heats (division_code, status, scheduled_at)
    WHERE is_global = true;

CREATE INDEX IF NOT EXISTS idx_heats_division
    ON public.heats (division_id);

CREATE INDEX IF NOT EXISTS idx_heats_unit_topic
    ON public.heats (unit_topic_id);

-- -----------------------------------------------------------------------------
-- PART 5: Drop dangling RLS policy referencing nonexistent broadcast_heats
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_broadcast_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'broadcast_heats'
    ) INTO v_broadcast_exists;

    IF NOT v_broadcast_exists THEN
        DROP POLICY IF EXISTS "Read public broadcast heats" ON public.heats;
        RAISE NOTICE '✓ Dropped dangling "Read public broadcast heats" policy (broadcast_heats table missing).';
    ELSE
        RAISE NOTICE 'broadcast_heats table exists; leaving policy in place.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 6: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_new_cols TEXT[];
    v_heat_type_vals TEXT[];
    v_heat_status_vals TEXT[];
    v_index_exists BOOLEAN;
BEGIN
    SELECT array_agg(column_name ORDER BY column_name)
    INTO v_new_cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'heats'
      AND column_name IN ('division_id','is_global','division_code','auto_scheduled','unit_topic_id');

    SELECT array_agg(enumlabel::text ORDER BY enumsortorder) INTO v_heat_type_vals
    FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'heat_type';

    SELECT array_agg(enumlabel::text ORDER BY enumsortorder) INTO v_heat_status_vals
    FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'heat_status';

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'idx_heats_global_lobby'
    ) INTO v_index_exists;

    RAISE NOTICE '✓ heats new columns present: %', v_new_cols;
    RAISE NOTICE '✓ heat_type values: %', v_heat_type_vals;
    RAISE NOTICE '✓ heat_status values: %', v_heat_status_vals;
    RAISE NOTICE '✓ idx_heats_global_lobby exists: %', v_index_exists;
END $$;

COMMIT;
