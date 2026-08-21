-- =============================================================================
-- Migration 045 — Repair Ranking/Content Division Schema
-- =============================================================================
-- Purpose: safely repair production databases where migration 043 was skipped,
-- partially applied, or applied after newer application code was deployed.
--
-- This migration is intentionally idempotent. It detects the existing schema
-- before renaming or adding anything, preserves historical heat data, and can
-- be run even if migration 043 has already completed successfully.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  -- heats: preserve the legacy division_id data under its new explicit name.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats' AND column_name = 'division_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats' AND column_name = 'ranking_division_id'
  ) THEN
    ALTER TABLE public.heats RENAME COLUMN division_id TO ranking_division_id;
  END IF;

  -- heat_awards: this table may not exist in an early deployment, so guard it.
  IF to_regclass('public.heat_awards') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'heat_awards' AND column_name = 'division_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'heat_awards' AND column_name = 'ranking_division_id'
    ) THEN
    ALTER TABLE public.heat_awards RENAME COLUMN division_id TO ranking_division_id;
  END IF;
END $$;

-- The content division is nullable so that a standard same-grade heat remains
-- valid even if legacy data does not yet have a value.
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS content_division_id UUID
    REFERENCES public.divisions(id) ON DELETE SET NULL;

-- Existing historical heats used one division for both content and ranking.
UPDATE public.heats
SET content_division_id = ranking_division_id
WHERE content_division_id IS NULL
  AND ranking_division_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS heats_content_division_id_idx
  ON public.heats(content_division_id)
  WHERE content_division_id IS NOT NULL;

ALTER TABLE public.athlete_ratings
  ADD COLUMN IF NOT EXISTS advancement_eligible BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.heats.ranking_division_id IS
  'The division whose ELO pool and standings receive heat results.';
COMMENT ON COLUMN public.heats.content_division_id IS
  'The division whose curriculum supplies heat questions. NULL means the ranking division.';

COMMIT;

-- Verification: all values below must be true before retrying Heat creation.
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats' AND column_name = 'ranking_division_id'
  ) AS has_ranking_division_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats' AND column_name = 'content_division_id'
  ) AS has_content_division_id,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'athlete_ratings' AND column_name = 'advancement_eligible'
  ) AS has_advancement_eligible;
