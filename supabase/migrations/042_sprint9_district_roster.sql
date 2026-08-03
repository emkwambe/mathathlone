-- =============================================================================
-- Migration 042 — Sprint 9: District League Mode + Bulk Roster Enrollment
-- =============================================================================
-- Changes:
--   1. Add `managed` boolean to public.users — flags teacher-created accounts
--   2. Add `district_id` to league_standings — enables district standings view
--   3. Add RLS policy: district league standings visible to same-district users
--   4. Add RLS policy: managed users can be inserted by service role
--   5. Grant execute on increment_standing to service role (for roster import)
-- =============================================================================

-- ── 1. managed flag on users ──────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS managed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.users.managed IS
  'TRUE for teacher-created (roster-imported) student accounts. '
  'These accounts use a PIN instead of a password and have no real email.';

-- ── 2. district_id on league_standings ───────────────────────────────────────
-- Populated by trigger below from the athlete's users.district_id column.
ALTER TABLE public.league_standings
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_league_standings_district
  ON public.league_standings (league_id, district_id);

-- ── 3. Trigger: auto-populate district_id on standings insert ─────────────────
CREATE OR REPLACE FUNCTION public.sync_standings_district()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Pull district_id from the athlete's profile
  SELECT district_id INTO NEW.district_id
  FROM public.users
  WHERE id = NEW.athlete_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_standings_district ON public.league_standings;
CREATE TRIGGER trg_sync_standings_district
  BEFORE INSERT ON public.league_standings
  FOR EACH ROW EXECUTE FUNCTION public.sync_standings_district();

-- ── 4. RLS: district league standings visible to same-district authenticated users ──
-- (Only applies when the league.level = 'district')
-- We use a helper function to avoid a subquery in the policy predicate.
CREATE OR REPLACE FUNCTION public.league_is_district(p_league_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leagues
    WHERE id = p_league_id AND level = 'district'
  );
$$;

-- Policy: allow reading district standings if viewer is in same district
-- (This supplements the existing policy — does not replace it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'league_standings'
      AND policyname = 'district_standings_visible_to_district_members'
  ) THEN
    CREATE POLICY district_standings_visible_to_district_members
      ON public.league_standings
      FOR SELECT
      USING (
        NOT public.league_is_district(league_id)
        OR district_id = (
          SELECT district_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── 5. Allow service role to insert managed users ─────────────────────────────
-- The roster import API uses the service role key to bypass RLS for user creation.
-- No additional grants needed — service role bypasses RLS by default in Supabase.
-- This comment documents the intent.

-- ── 6. Grant increment_standing to service role ───────────────────────────────
-- (increment_standing was created in migration 041)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'increment_standing'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.increment_standing TO service_role';
  END IF;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_managed_col   BOOLEAN;
  v_district_col  BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'managed'
  ) INTO v_managed_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'league_standings' AND column_name = 'district_id'
  ) INTO v_district_col;

  RAISE NOTICE 'Migration 042: managed column=%  district_id column=%',
    v_managed_col, v_district_col;
END $$;
