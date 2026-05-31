-- =============================================================================
-- Sprint 2 / Migration 016 — Make heats.topic_id nullable
-- =============================================================================
-- The legacy `heats.topic_id` column FK's to the legacy `topics` table and
-- was declared NOT NULL in the base schema. The new curriculum flow uses
-- `heats.unit_topic_id` (added in 010) and does not require a legacy topic.
--
-- This migration drops the NOT NULL constraint so the Heat creation flow can
-- pass NULL when no legacy topic is appropriate. The FK itself remains; rows
-- that still set topic_id will continue to reference `topics` correctly.
--
-- Idempotent: if topic_id is already nullable, DROP NOT NULL is a no-op.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    v_is_nullable TEXT;
BEGIN
    SELECT is_nullable
    INTO v_is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'heats'
      AND column_name = 'topic_id';

    IF v_is_nullable IS NULL THEN
        RAISE EXCEPTION '016 prerequisite missing: heats.topic_id column not found.';
    END IF;

    IF v_is_nullable = 'NO' THEN
        ALTER TABLE public.heats ALTER COLUMN topic_id DROP NOT NULL;
        RAISE NOTICE '✓ heats.topic_id is now nullable.';
    ELSE
        RAISE NOTICE 'heats.topic_id was already nullable — no change.';
    END IF;
END $$;

-- Refresh the column comment so future readers know the legacy semantics.
COMMENT ON COLUMN public.heats.topic_id IS
    'LEGACY. New code should use unit_topic_id instead. Kept for backward compatibility.';

-- Verification
DO $$
DECLARE
    v_nullable TEXT;
BEGIN
    SELECT is_nullable INTO v_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats' AND column_name = 'topic_id';

    RAISE NOTICE '✓ heats.topic_id is_nullable: % (expected YES)', v_nullable;
END $$;

COMMIT;
