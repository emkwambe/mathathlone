-- =============================================================================
-- 037_heats_league_id.sql
-- =============================================================================
-- Adds league_id (nullable FK) to heats so a heat can be linked to a league.
-- When set, the heat result feeds into league standings and ELO updates via
-- the /api/league/heat-complete route.
-- =============================================================================
BEGIN;

ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS heats_league_id_idx ON public.heats(league_id)
  WHERE league_id IS NOT NULL;

COMMENT ON COLUMN public.heats.league_id IS
  'Optional link to a league. When set, heat completion triggers ELO update and standings recalculation for that league.';

COMMIT;
