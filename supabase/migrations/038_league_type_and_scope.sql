-- =============================================================================
-- Migration 038 — League Type, Content Scope, Bracket Format
-- =============================================================================
-- Sprint 5b: Adds the structural columns that define what kind of league a
-- teacher is running and what content it covers.
--
-- New columns on leagues:
--   league_type    — 'showdown' | 'campaign' | 'season'
--   bracket_format — 'single_elimination' | 'double_elimination' |
--                    'round_robin' | 'swiss'
--   content_scope  — JSONB describing the content coverage
--                    e.g. { "type": "unit", "unit_topic_id": "...", "unit_name": "Ratios" }
--                    e.g. { "type": "course", "course_id": "...", "course_name": "Grade 7" }
--                    e.g. { "type": "standard", "lesson_number": "M7.RP.1.1" }
--   max_participants — replaces max_schools with a proper open integer
--                      (max_schools is kept for backwards compatibility)
-- =============================================================================

-- ── Add league_type ───────────────────────────────────────────────────────────
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS league_type TEXT
    CHECK (league_type IN ('showdown', 'campaign', 'season'))
    DEFAULT 'campaign';

-- ── Add bracket_format ────────────────────────────────────────────────────────
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS bracket_format TEXT
    CHECK (bracket_format IN (
      'single_elimination', 'double_elimination', 'round_robin', 'swiss'
    ))
    DEFAULT 'single_elimination';

-- ── Add content_scope (JSONB — flexible, no FK constraint needed) ─────────────
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS content_scope JSONB DEFAULT NULL;

-- ── Add max_participants (open integer, replaces the 4/8/16/32 dropdown) ──────
-- max_schools is kept for backwards compatibility with existing rows.
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT NULL;

-- Backfill max_participants from max_schools for existing rows
UPDATE leagues
  SET max_participants = max_schools
  WHERE max_participants IS NULL AND max_schools IS NOT NULL;

-- ── Comment the new columns ───────────────────────────────────────────────────
COMMENT ON COLUMN leagues.league_type IS
  'showdown = one-day tournament; campaign = unit-length (2-4 weeks); season = semester-long';

COMMENT ON COLUMN leagues.bracket_format IS
  'Bracket format chosen at creation. Validated against level constraints in the app layer.';

COMMENT ON COLUMN leagues.content_scope IS
  'JSONB describing content coverage. Keys: type (course|unit|standard), plus relevant id/name fields.';

COMMENT ON COLUMN leagues.max_participants IS
  'Open integer cap on participants. NULL = no cap (advancement-determined leagues). Replaces max_schools for classroom/school leagues.';
