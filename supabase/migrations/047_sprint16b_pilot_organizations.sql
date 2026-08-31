-- =============================================================================
-- Migration 047 — Sprint 16B: Three-School Pilot Organizations & Authorization
-- =============================================================================
-- Establishes organization-bound league ownership and a narrow delegation model
-- for the pilot.  The migration is deliberately idempotent and preserves legacy
-- leagues by backfilling from their creator where possible.
--
-- Scope model
--   classroom league -> school_id (+ class_id in Sprint 16C)
--   school league    -> school_id
--   district league  -> district_id; participating schools are stored in
--                        league_memberships
--
-- No client-supplied school/district authority is trusted.  Server routes and
-- RLS consult the actor's current profile and these persisted relationships.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Organization ownership on leagues
-- -----------------------------------------------------------------------------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_schools_active
  ON public.schools (district_id, name)
  WHERE is_active = TRUE;

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

-- Older schema versions omitted the classroom level even though the product
-- already uses it. Replace only level-related CHECK constraints dynamically so
-- the migration works across both legacy and current pilot databases.
DO $$
DECLARE constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.leagues'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%level%'
  LOOP
    EXECUTE format('ALTER TABLE public.leagues DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;

ALTER TABLE public.leagues
  ADD CONSTRAINT leagues_level_check
  CHECK (level IN ('classroom', 'school', 'district', 'regional', 'state', 'national'));

CREATE INDEX IF NOT EXISTS idx_leagues_school_scope
  ON public.leagues (school_id, level, created_at DESC)
  WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leagues_district_scope
  ON public.leagues (district_id, level, created_at DESC)
  WHERE district_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leagues_class_scope
  ON public.leagues (class_id)
  WHERE class_id IS NOT NULL;

-- Existing teacher-created leagues inherit the creator's school when available.
UPDATE public.leagues l
SET school_id = u.school_id
FROM public.users u
WHERE l.school_id IS NULL
  AND l.created_by = u.id
  AND u.school_id IS NOT NULL;

-- Derive a district for school-bound leagues from the authoritative school row.
UPDATE public.leagues l
SET district_id = s.district_id
FROM public.schools s
WHERE l.district_id IS NULL
  AND l.school_id = s.id
  AND s.district_id IS NOT NULL;

COMMENT ON COLUMN public.leagues.school_id IS
  'Owning school for classroom and school-level pilot leagues. Bound server-side from the actor or selected class.';
COMMENT ON COLUMN public.leagues.district_id IS
  'Owning district for district-level pilot leagues. Participating schools are stored in league_memberships.';
COMMENT ON COLUMN public.leagues.class_id IS
  'Owning class for classroom leagues. Used by Sprint 16C roster-scoped operations.';

-- -----------------------------------------------------------------------------
-- 2. Explicit per-league delegations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.league_delegations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id     UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL CHECK (permission IN ('manage', 'proctor', 'record_results')),
  granted_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  UNIQUE (league_id, user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_league_delegations_active
  ON public.league_delegations (league_id, user_id)
  WHERE is_active = TRUE;

ALTER TABLE public.league_delegations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. Authoritative scope helpers
-- -----------------------------------------------------------------------------
-- These helpers read the current profile directly instead of depending on a
-- stale JWT after a coordinator assignment.  They are used by RLS and server
-- routes alike; public execution is limited to authenticated users.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role::text
  FROM public.users u
  WHERE u.id = auth.uid()
    AND COALESCE(u.is_active, TRUE) = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.school_id
  FROM public.users u
  WHERE u.id = auth.uid()
    AND COALESCE(u.is_active, TRUE) = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_district_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ur.scope_id
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role::text = 'district_admin'
        AND ur.scope_type = 'district'
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY ur.granted_at DESC
      LIMIT 1
    ),
    (
      SELECT s.district_id
      FROM public.users u
      JOIN public.schools s ON s.id = u.school_id
      WHERE u.id = auth.uid()
        AND COALESCE(u.is_active, TRUE) = TRUE
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_league(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leagues l
    LEFT JOIN public.users actor ON actor.id = auth.uid()
    WHERE l.id = p_league_id
      AND (
        actor.role::text = 'platform_admin'
        OR l.created_by = auth.uid()
        OR (
          actor.role::text = 'school_admin'
          AND l.school_id IS NOT NULL
          AND l.school_id = actor.school_id
        )
        OR (
          actor.role::text = 'district_admin'
          AND l.district_id IS NOT NULL
          AND l.district_id = public.current_profile_district_id()
        )
        OR EXISTS (
          SELECT 1
          FROM public.league_delegations d
          WHERE d.league_id = l.id
            AND d.user_id = auth.uid()
            AND d.permission IN ('manage', 'record_results')
            AND d.is_active = TRUE
            AND (d.expires_at IS NULL OR d.expires_at > NOW())
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_league(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_manage_league(p_league_id)
  OR EXISTS (
    SELECT 1 FROM public.league_standings ls
    WHERE ls.league_id = p_league_id AND ls.athlete_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.league_memberships lm
    WHERE lm.league_id = p_league_id
      AND lm.is_active = TRUE
      AND lm.school_id = public.current_profile_school_id()
  )
  OR EXISTS (
    SELECT 1
    FROM public.leagues l
    JOIN public.users actor ON actor.id = auth.uid()
    WHERE l.id = p_league_id
      AND (
        (actor.role::text = 'school_admin' AND l.school_id = actor.school_id)
        OR (
          actor.role::text = 'district_admin'
          AND l.district_id IS NOT NULL
          AND l.district_id = public.current_profile_district_id()
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_district_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_league(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_league(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RLS: organization-scoped league, membership, and delegation access
-- -----------------------------------------------------------------------------
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leagues'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leagues', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY "Organization members view pilot leagues"
  ON public.leagues FOR SELECT TO authenticated
  USING (public.can_view_league(id));

CREATE POLICY "Authorized actors create scoped leagues"
  ON public.leagues FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.current_profile_role() = 'platform_admin'
      OR (
        public.current_profile_role() = 'teacher'
        AND level = 'classroom'
        AND school_id = public.current_profile_school_id()
      )
      OR (
        public.current_profile_role() = 'school_admin'
        AND level IN ('classroom', 'school')
        AND school_id = public.current_profile_school_id()
      )
      OR (
        public.current_profile_role() = 'district_admin'
        AND level = 'district'
        AND district_id = public.current_profile_district_id()
      )
    )
  );

CREATE POLICY "Authorized actors manage scoped leagues"
  ON public.leagues FOR UPDATE TO authenticated
  USING (public.can_manage_league(id))
  WITH CHECK (public.can_manage_league(id));

CREATE POLICY "Authorized actors delete scoped leagues"
  ON public.leagues FOR DELETE TO authenticated
  USING (public.can_manage_league(id));

DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'league_memberships'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.league_memberships', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY "Organization members view league memberships"
  ON public.league_memberships FOR SELECT TO authenticated
  USING (public.can_view_league(league_id));

CREATE POLICY "Authorized actors manage valid league memberships"
  ON public.league_memberships FOR ALL TO authenticated
  USING (public.can_manage_league(league_id))
  WITH CHECK (
    public.can_manage_league(league_id)
    AND EXISTS (
      SELECT 1
      FROM public.leagues l
      JOIN public.schools s ON s.id = league_memberships.school_id
      WHERE l.id = league_memberships.league_id
        AND (
          (l.level = 'district' AND l.district_id = s.district_id)
          OR (l.level = 'school' AND l.school_id = s.id)
        )
    )
  );

CREATE POLICY "Authorized actors view league delegations"
  ON public.league_delegations FOR SELECT TO authenticated
  USING (public.can_manage_league(league_id) OR user_id = auth.uid());

CREATE POLICY "Authorized actors manage league delegations"
  ON public.league_delegations FOR ALL TO authenticated
  USING (public.can_manage_league(league_id))
  WITH CHECK (public.can_manage_league(league_id));

COMMIT;

-- =============================================================================
-- Verification query (safe to run after migration)
-- =============================================================================
-- SELECT
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
--     AND table_name='leagues' AND column_name='school_id') AS leagues_school_scope,
--   EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
--     AND table_name='leagues' AND column_name='district_id') AS leagues_district_scope,
--   EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public'
--     AND table_name='league_delegations') AS delegation_table,
--   EXISTS (SELECT 1 FROM pg_proc WHERE proname='can_manage_league') AS league_scope_helper;

-- -----------------------------------------------------------------------------
-- 6. Extend Sprint 15's atomic bracket command to the scoped manager model
-- -----------------------------------------------------------------------------
-- This preserves the exact transactional scoring logic from migration 046 while
-- replacing creator-only authorization with can_manage_league(). The function
-- remains SECURITY DEFINER and still derives the league from the match itself.
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

  IF v_actor_role NOT IN ('teacher', 'school_admin', 'district_admin', 'platform_admin') THEN
    RAISE EXCEPTION 'Forbidden — authorized staff only' USING ERRCODE = '42501';
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

  IF NOT public.can_manage_league(v_match.league_id) THEN
    RAISE EXCEPTION 'Forbidden — you are not authorized to manage this league'
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

-- The 046 definition has been intentionally replaced above so the same scoped
-- authority rule covers the UI, bracket generation, Swiss mutations, and the
-- atomic single/double-elimination result command.
