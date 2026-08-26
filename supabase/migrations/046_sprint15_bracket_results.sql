-- =============================================================================
-- Migration 046 — Sprint 15: League Ranking Cohort & Atomic Bracket Results
-- =============================================================================
--
-- A league's content may span one or more courses, but its standings and ELO
-- must always belong to one explicit ranking cohort. This migration adds that
-- cohort to leagues, backfills legacy leagues where possible, and creates the
-- single authoritative command for recording a bracket match result.
--
-- The command is SECURITY DEFINER but validates auth.uid(), platform role, and
-- league ownership internally. It locks the match and rating rows, so a replayed
-- submission cannot double-count ratings, standings, head-to-head totals, or
-- bracket advancement.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Explicit league ranking cohort
-- -----------------------------------------------------------------------------

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS ranking_division_id UUID
  REFERENCES public.divisions(id);

-- Preserve the existing division relation as a legacy fallback and backfill the
-- new explicit semantic column for leagues that already carry a division.
UPDATE public.leagues
SET ranking_division_id = division_id
WHERE ranking_division_id IS NULL
  AND division_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leagues_ranking_division_id_idx
  ON public.leagues(ranking_division_id)
  WHERE ranking_division_id IS NOT NULL;

COMMENT ON COLUMN public.leagues.ranking_division_id IS
  'The student grade cohort whose standings and athlete_ratings receive league and bracket results. Content scope is independent.';

-- -----------------------------------------------------------------------------
-- 2. Atomic, authorized bracket result command
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_bracket_match_result(
  p_match_id UUID,
  p_winner_id UUID,
  p_player1_cta NUMERIC,
  p_player2_cta NUMERIC,
  p_heat_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_match RECORD;
  v_league RECORD;
  v_ranking_division_id UUID;
  v_loser_id UUID;
  v_winner_rating RECORD;
  v_loser_rating RECORD;
  v_winner_expected NUMERIC;
  v_loser_expected NUMERIC;
  v_winner_k NUMERIC;
  v_loser_k NUMERIC;
  v_winner_delta NUMERIC;
  v_loser_delta NUMERIC;
  v_winner_after NUMERIC;
  v_loser_after NUMERIC;
  v_first_athlete UUID;
  v_second_athlete UUID;
  v_winner_cta NUMERIC;
  v_loser_cta NUMERIC;
  v_winner_is_first BOOLEAN;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '28000';
  END IF;

  SELECT role
  INTO v_actor_role
  FROM public.users
  WHERE id = v_actor_id;

  IF v_actor_role NOT IN ('teacher', 'platform_admin') THEN
    RAISE EXCEPTION 'Forbidden — teachers only' USING ERRCODE = '42501';
  END IF;

  IF p_player1_cta IS NULL OR p_player2_cta IS NULL
     OR p_player1_cta < 0 OR p_player2_cta < 0 THEN
    RAISE EXCEPTION 'Both CTA scores must be valid numbers greater than or equal to zero'
      USING ERRCODE = '22023';
  END IF;

  -- Lock the canonical match row first. A concurrent result call waits here,
  -- then sees the completed status and exits without double-counting.
  SELECT
    bm.id,
    bm.status,
    bm.bracket_id,
    bm.participant1_id,
    bm.participant2_id,
    bm.is_bye,
    b.league_id
  INTO v_match
  FROM public.bracket_matches bm
  JOIN public.brackets b ON b.id = bm.bracket_id
  WHERE bm.id = p_match_id
  FOR UPDATE OF bm;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'Match already completed' USING ERRCODE = 'P0001';
  END IF;

  IF v_match.is_bye OR v_match.participant1_id IS NULL OR v_match.participant2_id IS NULL THEN
    RAISE EXCEPTION 'Both participants must be present before recording a bracket result'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_winner_id NOT IN (v_match.participant1_id, v_match.participant2_id) THEN
    RAISE EXCEPTION 'Winner must be a participant in this match' USING ERRCODE = '22023';
  END IF;

  SELECT
    l.id,
    l.created_by,
    l.ranking_division_id,
    l.division_id
  INTO v_league
  FROM public.leagues l
  WHERE l.id = v_match.league_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'League not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_actor_role <> 'platform_admin' AND v_league.created_by IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'Forbidden — only this league''s creator may record bracket results'
      USING ERRCODE = '42501';
  END IF;

  v_ranking_division_id := COALESCE(v_league.ranking_division_id, v_league.division_id);
  IF v_ranking_division_id IS NULL THEN
    RAISE EXCEPTION 'This league needs a ranking cohort before bracket results can be scored'
      USING ERRCODE = 'P0001';
  END IF;

  v_loser_id := CASE
    WHEN p_winner_id = v_match.participant1_id THEN v_match.participant2_id
    ELSE v_match.participant1_id
  END;

  IF p_heat_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.heats h
    WHERE h.id = p_heat_id
      AND h.league_id = v_match.league_id
  ) THEN
    RAISE EXCEPTION 'The submitted heat does not belong to this league'
      USING ERRCODE = '22023';
  END IF;

  -- Lock exactly the two rating rows in this league's verified ranking cohort.
  SELECT id, athlete_id, rating, rating_deviation, volatility, games_played,
         peak_rating, is_provisional, last_competition
  INTO v_winner_rating
  FROM public.athlete_ratings
  WHERE athlete_id = p_winner_id
    AND division_id = v_ranking_division_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Winner has no rating in this league''s ranking cohort'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT id, athlete_id, rating, rating_deviation, volatility, games_played,
         peak_rating, is_provisional, last_competition
  INTO v_loser_rating
  FROM public.athlete_ratings
  WHERE athlete_id = v_loser_id
    AND division_id = v_ranking_division_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loser has no rating in this league''s ranking cohort'
      USING ERRCODE = 'P0001';
  END IF;

  -- Mirror the existing direct-match EloEngine calculation.
  v_winner_expected := 1 / (1 + power(10, least(greatest(v_loser_rating.rating - v_winner_rating.rating, -400), 400) / 400));
  v_loser_expected := 1 / (1 + power(10, least(greatest(v_winner_rating.rating - v_loser_rating.rating, -400), 400) / 400));
  v_winner_k := CASE
    WHEN v_winner_rating.games_played < 30 THEN 40
    WHEN v_winner_rating.rating >= 2200 THEN 16
    ELSE 24
  END;
  v_loser_k := CASE
    WHEN v_loser_rating.games_played < 30 THEN 40
    WHEN v_loser_rating.rating >= 2200 THEN 16
    ELSE 24
  END;
  v_winner_delta := greatest(800 - v_winner_rating.rating, v_winner_k * (1 - v_winner_expected));
  v_loser_delta := greatest(800 - v_loser_rating.rating, v_loser_k * (0 - v_loser_expected));
  v_winner_after := least(3000, greatest(800, v_winner_rating.rating + v_winner_delta));
  v_loser_after := least(3000, greatest(800, v_loser_rating.rating + v_loser_delta));
  v_winner_delta := v_winner_after - v_winner_rating.rating;
  v_loser_delta := v_loser_after - v_loser_rating.rating;

  UPDATE public.athlete_ratings
  SET rating = v_winner_after,
      peak_rating = greatest(peak_rating, v_winner_after),
      games_played = games_played + 1,
      last_competition = now(),
      updated_at = now()
  WHERE id = v_winner_rating.id;

  UPDATE public.athlete_ratings
  SET rating = v_loser_after,
      peak_rating = greatest(peak_rating, v_loser_after),
      games_played = games_played + 1,
      last_competition = now(),
      updated_at = now()
  WHERE id = v_loser_rating.id;

  INSERT INTO public.rating_history (
    athlete_id, heat_id, league_id,
    rating_before, rating_after,
    rd_before, rd_after,
    k_factor_used, expected_score, actual_score
  )
  VALUES
    (
      p_winner_id, p_heat_id, v_match.league_id,
      v_winner_rating.rating, v_winner_after,
      v_winner_rating.rating_deviation, v_winner_rating.rating_deviation,
      v_winner_k, v_winner_expected, 1
    ),
    (
      v_loser_id, p_heat_id, v_match.league_id,
      v_loser_rating.rating, v_loser_after,
      v_loser_rating.rating_deviation, v_loser_rating.rating_deviation,
      v_loser_k, v_loser_expected, 0
    );

  PERFORM public.increment_standing(v_match.league_id, p_winner_id, 1, 0, 0, 3, v_winner_delta);
  PERFORM public.increment_standing(v_match.league_id, v_loser_id, 0, 1, 0, 0, v_loser_delta);

  v_first_athlete := least(p_winner_id, v_loser_id);
  v_second_athlete := greatest(p_winner_id, v_loser_id);
  v_winner_is_first := v_first_athlete = p_winner_id;
  v_winner_cta := CASE WHEN p_winner_id = v_match.participant1_id THEN p_player1_cta ELSE p_player2_cta END;
  v_loser_cta := CASE WHEN v_loser_id = v_match.participant1_id THEN p_player1_cta ELSE p_player2_cta END;

  INSERT INTO public.head_to_head (
    league_id, athlete1_id, athlete2_id,
    athlete1_wins, athlete2_wins, draws,
    athlete1_cta_total, athlete2_cta_total,
    last_updated
  )
  VALUES (
    v_match.league_id, v_first_athlete, v_second_athlete,
    CASE WHEN v_winner_is_first THEN 1 ELSE 0 END,
    CASE WHEN v_winner_is_first THEN 0 ELSE 1 END,
    0,
    CASE WHEN v_winner_is_first THEN v_winner_cta ELSE v_loser_cta END,
    CASE WHEN v_winner_is_first THEN v_loser_cta ELSE v_winner_cta END,
    now()
  )
  ON CONFLICT (league_id, athlete1_id, athlete2_id) DO UPDATE
  SET athlete1_wins = public.head_to_head.athlete1_wins + EXCLUDED.athlete1_wins,
      athlete2_wins = public.head_to_head.athlete2_wins + EXCLUDED.athlete2_wins,
      athlete1_cta_total = public.head_to_head.athlete1_cta_total + EXCLUDED.athlete1_cta_total,
      athlete2_cta_total = public.head_to_head.athlete2_cta_total + EXCLUDED.athlete2_cta_total,
      last_updated = now();

  -- The existing trigger advances winner/loser slots and marks a completed final.
  UPDATE public.bracket_matches
  SET winner_id = p_winner_id,
      loser_id = v_loser_id,
      heat_id = p_heat_id,
      p1_cta_score = p_player1_cta,
      p2_cta_score = p_player2_cta,
      status = 'completed',
      completed_at = now()
  WHERE id = v_match.id;

  RETURN jsonb_build_object(
    'success', true,
    'league_id', v_match.league_id,
    'ranking_division_id', v_ranking_division_id,
    'winner_id', p_winner_id,
    'loser_id', v_loser_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_bracket_match_result(UUID, UUID, NUMERIC, NUMERIC, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_bracket_match_result(UUID, UUID, NUMERIC, NUMERIC, UUID)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.record_bracket_match_result(UUID, UUID, NUMERIC, NUMERIC, UUID) IS
  'Atomically records an authorized bracket result, applies cohort-scoped ELO and standings, updates head-to-head, and advances the bracket.';

COMMIT;

-- =============================================================================
-- Manual verification after applying this migration
-- =============================================================================
-- SELECT ranking_division_id, division_id FROM public.leagues;
-- SELECT public.record_bracket_match_result(...); -- execute only with an
-- authenticated teacher session through the API route, never from SQL Editor.
-- =============================================================================
