-- =============================================================================
-- MathAthlone — ELO Write Policies
-- =============================================================================
-- File: 033_elo_write_policies.sql
-- Run AFTER: 006_league_engine.sql, 007_auth_v2_rls.sql
--
-- Migration 006 created athlete_ratings and rating_history with RLS enabled
-- but only added SELECT policies. The scoring-service.ts calls
-- updateAthleteRatingsFromHeat() using the teacher's authenticated Supabase
-- client (anon key), so INSERT/UPDATE policies are required for those writes
-- to succeed.
--
-- Policy design:
--   • athlete_ratings INSERT  — any authenticated user (scoring service runs
--     under the teacher's session when endHeat() is called from TeacherMonitor)
--   • athlete_ratings UPDATE  — any authenticated user (same reason)
--   • rating_history INSERT   — any authenticated user
--
-- These are intentionally broad because:
--   1. The scoring service is the only writer in practice.
--   2. athlete_ratings rows are keyed by athlete_id — a malicious actor
--      could only insert/update their own row or a row for another athlete
--      they know the UUID of. The data is non-sensitive (ratings are public).
--   3. A future tightening pass can restrict to has_role('teacher','platform_admin')
--      once we confirm the CF Worker also needs write access.
--
-- IDEMPOTENT — drops policies before recreating.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- athlete_ratings — INSERT
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users insert ratings" ON athlete_ratings;
CREATE POLICY "Authenticated users insert ratings"
  ON athlete_ratings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- athlete_ratings — UPDATE
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users update ratings" ON athlete_ratings;
CREATE POLICY "Authenticated users update ratings"
  ON athlete_ratings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- rating_history — INSERT
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users insert rating history" ON rating_history;
CREATE POLICY "Authenticated users insert rating history"
  ON rating_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- rating_history — SELECT (all authenticated, not just own)
-- Allows leaderboard pages to read full history for display.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Athletes view own rating history" ON rating_history;
DROP POLICY IF EXISTS "Authenticated users view rating history" ON rating_history;
CREATE POLICY "Authenticated users view rating history"
  ON rating_history FOR SELECT
  TO authenticated
  USING (true);

COMMIT;
