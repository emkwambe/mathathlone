-- =============================================================================
-- MathAthlone Auth v2 — RLS Policies Migration
-- =============================================================================
-- File: 007_auth_v2_rls.sql
-- Run AFTER: 006_auth_v2_schema.sql
--
-- Rebuilds RLS policies on existing tables (users, schools, heats,
-- heat_participations, etc.) to use the new JWT-based authorization helpers:
--   * user_role()
--   * user_school_id()
--   * user_district_id()
--   * authorize(permission)
--   * has_role(...roles)
--
-- This migration is IDEMPOTENT — drops policies before recreating them.
-- Existing custom policies will be replaced. If you have local edits,
-- back up the policies you care about before running.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- USERS TABLE
-- -----------------------------------------------------------------------------

-- Drop any pre-existing policies (clean slate)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;

-- Read own profile
CREATE POLICY "Read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

-- Update own profile (limited fields — full profile updates go through Edge Functions)
CREATE POLICY "Update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid());

-- Teachers read mathletes in their school
CREATE POLICY "Teachers read school mathletes"
  ON users FOR SELECT
  TO authenticated
  USING (
    has_role('teacher','school_admin')
    AND school_id = user_school_id()
    AND deleted_at IS NULL
  );

-- School admins read all users in their school
CREATE POLICY "School admins read school users"
  ON users FOR SELECT
  TO authenticated
  USING (
    has_role('school_admin')
    AND school_id = user_school_id()
    AND deleted_at IS NULL
  );

-- District admins read all users in their district
CREATE POLICY "District admins read district users"
  ON users FOR SELECT
  TO authenticated
  USING (
    has_role('district_admin')
    AND school_id IN (
      SELECT id FROM schools WHERE district_id = user_district_id()
    )
    AND deleted_at IS NULL
  );

-- Parents read their children
CREATE POLICY "Parents read children"
  ON users FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT child_user_id
      FROM parental_consents
      WHERE parent_user_id = auth.uid()
        AND status = 'verified'
    )
  );

-- Platform admins read everything
CREATE POLICY "Platform admins read all users"
  ON users FOR SELECT
  TO authenticated
  USING (has_role('platform_admin'));

-- INSERT: handled by handle_new_user() trigger on auth.users — block direct inserts
-- (no INSERT policy = denied)

-- DELETE: only via data.delete.minor permission
CREATE POLICY "Authorized minor data deletion"
  ON users FOR DELETE
  TO authenticated
  USING (
    authorize('data.delete.minor')
    AND date_of_birth > (CURRENT_DATE - INTERVAL '18 years')
  );

-- -----------------------------------------------------------------------------
-- SCHOOLS TABLE
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='schools'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.schools', pol.policyname);
  END LOOP;
END $$;

-- Public read for school search/registration
CREATE POLICY "Public read schools"
  ON schools FOR SELECT
  TO authenticated, anon
  USING (true);

-- School admins update their own school
CREATE POLICY "School admins update own school"
  ON schools FOR UPDATE
  TO authenticated
  USING (has_role('school_admin') AND id = user_school_id())
  WITH CHECK (id = user_school_id());

-- District admins manage schools in their district
CREATE POLICY "District admins manage schools"
  ON schools FOR ALL
  TO authenticated
  USING (has_role('district_admin') AND district_id = user_district_id())
  WITH CHECK (has_role('district_admin') AND district_id = user_district_id());

-- Platform admins manage all schools
CREATE POLICY "Platform admins manage all schools"
  ON schools FOR ALL
  TO authenticated
  USING (has_role('platform_admin'))
  WITH CHECK (has_role('platform_admin'));

-- -----------------------------------------------------------------------------
-- HEATS TABLE
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='heats'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.heats', pol.policyname);
  END LOOP;
END $$;

-- Heat creators read their own heats
CREATE POLICY "Read own heats"
  ON heats FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Mathletes read heats they're participating in
-- (heat_participations table will define the link)
CREATE POLICY "Read participated heats"
  ON heats FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT heat_id FROM heat_participations
      WHERE athlete_id = auth.uid()
    )
  );

-- Anyone can read public broadcast heats
CREATE POLICY "Read public broadcast heats"
  ON heats FOR SELECT
  TO authenticated, anon
  USING (
    id IN (SELECT heat_id FROM broadcast_heats WHERE is_live = true)
  );

-- Teachers in same school read all school heats
CREATE POLICY "Teachers read school heats"
  ON heats FOR SELECT
  TO authenticated
  USING (
    has_role('teacher','school_admin','district_admin','platform_admin')
    AND created_by IN (
      SELECT id FROM users WHERE school_id = user_school_id()
    )
  );

-- Create heats requires permission
CREATE POLICY "Create heats with permission"
  ON heats FOR INSERT
  TO authenticated
  WITH CHECK (
    authorize('heats.create') AND created_by = auth.uid()
  );

-- Update own heats
CREATE POLICY "Update own heats"
  ON heats FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Delete heats requires permission
CREATE POLICY "Delete heats with permission"
  ON heats FOR DELETE
  TO authenticated
  USING (
    authorize('heats.delete') OR created_by = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- HEAT PARTICIPATIONS
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='heat_participations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.heat_participations', pol.policyname);
  END LOOP;
END $$;

-- Athletes read own participations
CREATE POLICY "Read own participations"
  ON heat_participations FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- Heat creators read participations in their heats
CREATE POLICY "Heat creator reads participations"
  ON heat_participations FOR SELECT
  TO authenticated
  USING (
    heat_id IN (SELECT id FROM heats WHERE created_by = auth.uid())
  );

-- Teachers read participations of mathletes in their school
CREATE POLICY "Teachers read school participations"
  ON heat_participations FOR SELECT
  TO authenticated
  USING (
    has_role('teacher','school_admin','district_admin','platform_admin')
    AND athlete_id IN (
      SELECT id FROM users WHERE school_id = user_school_id()
    )
  );

-- Parents read participations of their children
CREATE POLICY "Parents read child participations"
  ON heat_participations FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT child_user_id FROM parental_consents
      WHERE parent_user_id = auth.uid() AND status = 'verified'
    )
  );

-- Athletes create their own participations (joining a heat)
CREATE POLICY "Join heat as participant"
  ON heat_participations FOR INSERT
  TO authenticated
  WITH CHECK (athlete_id = auth.uid());

-- Athletes update own participation (submitting answers, finishing)
CREATE POLICY "Update own participation"
  ON heat_participations FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- -----------------------------------------------------------------------------
-- HEAT QUESTIONS
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='heat_questions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.heat_questions', pol.policyname);
  END LOOP;
END $$;

-- Participants read questions for heats they joined
CREATE POLICY "Read questions of joined heats"
  ON heat_questions FOR SELECT
  TO authenticated
  USING (
    heat_id IN (
      SELECT heat_id FROM heat_participations WHERE athlete_id = auth.uid()
    )
  );

-- Heat creators read all their heat questions
CREATE POLICY "Heat creators read questions"
  ON heat_questions FOR SELECT
  TO authenticated
  USING (
    heat_id IN (SELECT id FROM heats WHERE created_by = auth.uid())
  );

-- Heat creator (or anyone with heats.create) inserts questions when creating heat
CREATE POLICY "Heat creators insert questions"
  ON heat_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    heat_id IN (SELECT id FROM heats WHERE created_by = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- QUESTION SUBMISSIONS
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='question_submissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.question_submissions', pol.policyname);
  END LOOP;
END $$;

-- Read own submissions
CREATE POLICY "Read own submissions"
  ON question_submissions FOR SELECT
  TO authenticated
  USING (
    heat_participation_id IN (
      SELECT id FROM heat_participations WHERE athlete_id = auth.uid()
    )
  );

-- Heat creators read all submissions in their heats
CREATE POLICY "Heat creators read submissions"
  ON question_submissions FOR SELECT
  TO authenticated
  USING (
    heat_participation_id IN (
      SELECT hp.id FROM heat_participations hp
      JOIN heats h ON h.id = hp.heat_id
      WHERE h.created_by = auth.uid()
    )
  );

-- Insert own submissions
CREATE POLICY "Insert own submissions"
  ON question_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    heat_participation_id IN (
      SELECT id FROM heat_participations WHERE athlete_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- LEAGUES, MEMBERSHIPS, ETC.
-- -----------------------------------------------------------------------------

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='leagues'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leagues', pol.policyname);
  END LOOP;
END $$;

-- Public read leagues
CREATE POLICY "Public read leagues" ON leagues FOR SELECT TO authenticated USING (true);

-- Platform/district admins manage leagues
CREATE POLICY "Admins manage leagues"
  ON leagues FOR ALL
  TO authenticated
  USING (has_role('platform_admin','district_admin'));

-- League memberships: similar pattern
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='league_memberships'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.league_memberships', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read memberships"
  ON league_memberships FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage memberships"
  ON league_memberships FOR ALL TO authenticated
  USING (has_role('platform_admin','district_admin','school_admin'));

-- -----------------------------------------------------------------------------
-- INTEGRITY TABLES (from 003)
-- -----------------------------------------------------------------------------

-- Focus violations: athletes see their own, teachers see their school's
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='focus_violations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.focus_violations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Athletes read own violations"
  ON focus_violations FOR SELECT
  TO authenticated
  USING (
    heat_participation_id IN (
      SELECT id FROM heat_participations WHERE athlete_id = auth.uid()
    )
  );

CREATE POLICY "Heat creators read violations"
  ON focus_violations FOR SELECT
  TO authenticated
  USING (
    heat_participation_id IN (
      SELECT hp.id FROM heat_participations hp
      JOIN heats h ON h.id = hp.heat_id
      WHERE h.created_by = auth.uid()
    )
  );

CREATE POLICY "Insert own violations"
  ON focus_violations FOR INSERT
  TO authenticated
  WITH CHECK (
    heat_participation_id IN (
      SELECT id FROM heat_participations WHERE athlete_id = auth.uid()
    )
  );

-- Teacher attestations: teachers manage with attest.* permissions
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='teacher_attestations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teacher_attestations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Teachers create attestations"
  ON teacher_attestations FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (authorize('attest.regional') OR authorize('attest.state'))
  );

CREATE POLICY "Read own and target attestations"
  ON teacher_attestations FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR athlete_id = auth.uid());

-- Qualification reviews
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='qualification_reviews'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.qualification_reviews', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Reviewers manage qualification reviews"
  ON qualification_reviews FOR ALL
  TO authenticated
  USING (authorize('integrity.review'));

-- Detected anomalies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='detected_anomalies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.detected_anomalies', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Reviewers read anomalies"
  ON detected_anomalies FOR SELECT
  TO authenticated
  USING (
    authorize('integrity.review')
    OR athlete_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- VERIFY
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  RAISE NOTICE '✅ Auth v2 RLS migration complete. Total policies in public schema: %', policy_count;
END $$;

COMMIT;
