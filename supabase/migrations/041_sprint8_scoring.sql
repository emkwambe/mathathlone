-- =============================================================================
-- Migration 041 — Sprint 8: Match Scoring Infrastructure
-- =============================================================================
-- Adds:
--   1. increment_standing(...)  — atomic RPC to add wins/losses/points/elo
--      to a league_standings row without a full recalculate
--   2. bracket_match_complete() trigger function — marks a bracket 'completed'
--      when its final match is done (single/double-elim)
--   3. RLS policy allowing authenticated users to call increment_standing
-- =============================================================================

-- ────────────────────────────────────────────────────────────
-- 1. increment_standing RPC
-- ────────────────────────────────────────────────────────────
-- Atomically increments wins, losses, draws, points, and elo_change
-- on a league_standings row. Creates the row if it doesn't exist.
-- Called by the Swiss and bracket record-result API routes.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_standing(
  p_league_id  UUID,
  p_athlete_id UUID,
  p_wins       INTEGER DEFAULT 0,
  p_losses     INTEGER DEFAULT 0,
  p_draws      INTEGER DEFAULT 0,
  p_points     INTEGER DEFAULT 0,
  p_elo_change NUMERIC DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert: create row if missing, otherwise increment
  INSERT INTO league_standings (
    league_id, athlete_id, rank,
    wins, losses, draws, points,
    current_elo, elo_change,
    last_updated
  )
  VALUES (
    p_league_id, p_athlete_id, 0,
    p_wins, p_losses, p_draws, p_points,
    1200 + p_elo_change, p_elo_change,
    now()
  )
  ON CONFLICT (league_id, athlete_id) DO UPDATE
    SET
      wins        = league_standings.wins        + EXCLUDED.wins,
      losses      = league_standings.losses      + EXCLUDED.losses,
      draws       = league_standings.draws       + EXCLUDED.draws,
      points      = league_standings.points      + EXCLUDED.points,
      current_elo = league_standings.current_elo + p_elo_change,
      elo_change  = p_elo_change,
      last_updated = now();
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 2. Auto-complete bracket when final match is done
-- ────────────────────────────────────────────────────────────
-- The existing bracket_match_advance trigger handles tree progression.
-- This trigger marks the bracket itself as 'completed' when the grand
-- final (is_grand_final = true) match is completed.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION bracket_auto_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.is_grand_final = true THEN
    UPDATE brackets
      SET status = 'completed',
          updated_at = now()
      WHERE id = NEW.bracket_id
        AND status <> 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_bracket_auto_complete
    AFTER UPDATE ON bracket_matches
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
    EXECUTE FUNCTION bracket_auto_complete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. RLS: allow service_role to call increment_standing
-- ────────────────────────────────────────────────────────────
-- increment_standing is SECURITY DEFINER so it runs as the
-- migration owner (postgres) regardless of caller role.
-- No additional grant needed beyond EXECUTE for authenticated.

GRANT EXECUTE ON FUNCTION increment_standing(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC)
  TO authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verify
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_fn INT;
BEGIN
  SELECT COUNT(*) INTO v_fn
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'increment_standing';

  RAISE NOTICE '✅ Migration 041 complete — increment_standing functions: %', v_fn;
END $$;
