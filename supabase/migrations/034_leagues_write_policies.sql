-- =============================================================================
-- MathAthlone — Leagues Write Policies
-- =============================================================================
-- File: 034_leagues_write_policies.sql
-- Run AFTER: 002_league_system.sql
--
-- The leagues table was created with RLS enabled but no INSERT policy for
-- teachers. This migration adds:
--   • leagues INSERT  — teachers and platform_admins
--   • leagues SELECT  — all authenticated users (for /league/[id] page)
--   • leagues UPDATE  — only the teacher who created it (via created_by)
--
-- Note: The leagues table in migration 002 does not have a created_by column.
-- We add one here so teachers can manage their own leagues.
--
-- IDEMPOTENT — uses IF NOT EXISTS / IF EXISTS guards.
-- =============================================================================

BEGIN;

-- Add created_by column to leagues if it doesn't exist
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- ─────────────────────────────────────────────────────────────
-- leagues — SELECT (all authenticated users)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users view leagues" ON leagues;
CREATE POLICY "Authenticated users view leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- leagues — INSERT (teachers and platform_admins only)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Teachers insert leagues" ON leagues;
CREATE POLICY "Teachers insert leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('teacher', 'platform_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- leagues — UPDATE (creator only)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "League creator can update" ON leagues;
CREATE POLICY "League creator can update"
  ON leagues FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

COMMIT;
