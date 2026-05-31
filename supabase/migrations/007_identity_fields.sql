-- ============================================================
-- MathAthlone — Competition Identity Fields
-- Migration: 007_identity_fields.sql (CORRECTED)
-- schools already has: state, district, district_id, country_code
-- users already has: grade_level
-- © Mpingo Systems LLC
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADD MISSING COLUMNS TO SCHOOLS
--    (state, district, country_code already exist)
-- ────────────────────────────────────────────────────────────

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS city            TEXT,
  ADD COLUMN IF NOT EXISTS mascot          TEXT,
  ADD COLUMN IF NOT EXISTS primary_color   TEXT,
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS state_name      TEXT,
  ADD COLUMN IF NOT EXISTS country_name    TEXT DEFAULT 'United States',
  ADD COLUMN IF NOT EXISTS country_flag    TEXT DEFAULT '🇺🇸';

-- ────────────────────────────────────────────────────────────
-- 2. VIEW: Flattened athlete identity for quick lookups
--    Uses display_name, grade_level, school.state
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW athlete_identity AS
SELECT
  u.id                AS athlete_id,
  u.display_name,
  split_part(u.display_name, ' ', 1)                          AS first_name,
  reverse(split_part(reverse(u.display_name), ' ', 1))        AS last_name,
  u.grade_level,
  u.avatar_url,
  u.school_id,
  s.name              AS school_name,
  s.mascot            AS school_mascot,
  s.primary_color,
  s.secondary_color,
  s.city,
  s.district,
  s.district_id,
  s.state             AS state_code,
  s.state_name,
  s.country_code,
  s.country_name,
  s.country_flag
FROM users u
  LEFT JOIN schools s ON u.school_id = s.id
WHERE u.role = 'athlete';

-- ────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_schools_state
  ON schools(state);
CREATE INDEX IF NOT EXISTS idx_schools_city
  ON schools(city);

-- ────────────────────────────────────────────────────────────
-- 4. RLS — schools publicly readable
-- ────────────────────────────────────────────────────────────

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
CREATE POLICY "Anyone can view schools"
  ON schools FOR SELECT USING (true);

-- ============================================================
-- END OF MIGRATION
-- ============================================================
