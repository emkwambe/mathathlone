-- =============================================================================
-- Migration 043 — Grade-Cohort Ranking: Split division_id
-- =============================================================================
-- Implements the Sprint 13 grade-cohort ranking model.
--
-- The core principle: a student's ranking is always among their grade-level
-- peers, regardless of what material was used in the heat. This requires
-- separating two previously conflated concepts on the heats table:
--
--   ranking_division_id  — The division whose ELO pool and standings receive
--                          the results. Always the teacher's class grade cohort.
--                          (Renamed from division_id)
--
--   content_division_id  — The division whose curriculum the questions are
--                          drawn from. May differ from ranking_division_id
--                          when a teacher uses prior-grade material at the
--                          start of the year. Nullable; when NULL, defaults
--                          to ranking_division_id (the normal same-grade case).
--
-- Also adds advancement_eligible flag to athlete_ratings so the teacher
-- dashboard can surface students who are ready to compete above grade level.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. heats — rename division_id → ranking_division_id, add content_division_id
-- ─────────────────────────────────────────────────────────────────────────────

-- Rename the existing column (preserves all data and the FK constraint)
ALTER TABLE public.heats
  RENAME COLUMN division_id TO ranking_division_id;

-- Add the new content_division_id column (nullable — NULL means same as ranking)
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS content_division_id UUID
    REFERENCES public.divisions(id) ON DELETE SET NULL;

-- Backfill: for all existing heats, content_division_id = ranking_division_id
-- (they were the same concept before this migration)
UPDATE public.heats
  SET content_division_id = ranking_division_id
  WHERE content_division_id IS NULL AND ranking_division_id IS NOT NULL;

-- Index for content_division_id queries (question assembler lookups)
CREATE INDEX IF NOT EXISTS heats_content_division_id_idx
  ON public.heats(content_division_id)
  WHERE content_division_id IS NOT NULL;

-- Update comments
COMMENT ON COLUMN public.heats.ranking_division_id IS
  'The division whose ELO pool and standings receive the heat results. Always the enrolled grade cohort of the participants. Renamed from division_id in migration 043.';

COMMENT ON COLUMN public.heats.content_division_id IS
  'The division whose curriculum the questions are drawn from. NULL means same as ranking_division_id (default case). Differs when a teacher uses prior-grade material (e.g., Grade 7 content for Grade 8 students at the start of the year).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. heat_awards — rename division_id → ranking_division_id
-- ─────────────────────────────────────────────────────────────────────────────
-- heat_awards.division_id stores the ranking division for award attribution.

ALTER TABLE public.heat_awards
  RENAME COLUMN division_id TO ranking_division_id;

COMMENT ON COLUMN public.heat_awards.ranking_division_id IS
  'The division the award is attributed to for leaderboard and standing purposes. Renamed from division_id in migration 043.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. athlete_ratings — add advancement_eligible flag
-- ─────────────────────────────────────────────────────────────────────────────
-- A student is advancement_eligible when their ELO in their home division
-- exceeds the threshold (default 1350). The scoring service sets this flag
-- automatically. Teachers see a badge on the student in the dashboard.

ALTER TABLE public.athlete_ratings
  ADD COLUMN IF NOT EXISTS advancement_eligible BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.athlete_ratings.advancement_eligible IS
  'True when the athlete''s rating in this division exceeds the advancement threshold (1350). Triggers an "Advancement Eligible" badge on the teacher dashboard.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verify
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_ranking   INT;
  v_content   INT;
  v_adv       INT;
BEGIN
  SELECT COUNT(*) INTO v_ranking
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats'
      AND column_name = 'ranking_division_id';

  SELECT COUNT(*) INTO v_content
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heats'
      AND column_name = 'content_division_id';

  SELECT COUNT(*) INTO v_adv
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'athlete_ratings'
      AND column_name = 'advancement_eligible';

  RAISE NOTICE '✅ Migration 043 complete — heats.ranking_division_id: %, heats.content_division_id: %, athlete_ratings.advancement_eligible: %',
    v_ranking, v_content, v_adv;
END $$;

COMMIT;
