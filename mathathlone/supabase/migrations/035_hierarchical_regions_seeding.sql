-- =============================================================================
-- 035_hierarchical_regions_seeding.sql
-- =============================================================================
-- This migration establishes a strict geographic hierarchy for the League Engine:
-- Classroom -> School -> District -> Region -> State -> National
--
-- It introduces the `regions` and `states` tables, linking them to `districts`.
-- It also establishes a `league_advancement` table to explicitly define how
-- winners of a lower-level league advance into a higher-level league.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. HIERARCHY TABLES (States & Regions)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS states (
    code CHAR(2) PRIMARY KEY,       -- 'NC', 'CA', 'TX'
    name TEXT NOT NULL UNIQUE,      -- 'North Carolina'
    country_code CHAR(2) DEFAULT 'US'
);

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,             -- 'Charlotte EOG', 'Triangle Region'
    state_code CHAR(2) NOT NULL REFERENCES states(code) ON DELETE CASCADE,
    UNIQUE(name, state_code)
);

-- Link existing districts to regions
ALTER TABLE districts ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2. LEAGUE ADVANCEMENT PATHS
-- -----------------------------------------------------------------------------
-- Explicitly defines which lower-level league feeds into which higher-level league.
-- e.g., The winner of "Period 3 Classroom League" feeds into "School-wide Championship"
--
-- Supported levels (from leagues.level): 'school', 'district', 'regional', 'state', 'national'
-- Add 'classroom' to the valid league levels if it doesn't exist
ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_level_check;
ALTER TABLE leagues ADD CONSTRAINT leagues_level_check CHECK (level IN ('classroom', 'school', 'district', 'regional', 'state', 'national'));

CREATE TABLE IF NOT EXISTS league_advancement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    target_league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    slots_allocated INTEGER NOT NULL DEFAULT 1,  -- How many top mathletes advance?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_league_id, target_league_id)
);

-- -----------------------------------------------------------------------------
-- 3. RLS POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_advancement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read league_advancement" ON league_advancement FOR SELECT USING (true);

-- Admins manage hierarchy
CREATE POLICY "Admins manage states" ON states FOR ALL TO authenticated USING (has_role('platform_admin'));
CREATE POLICY "Admins manage regions" ON regions FOR ALL TO authenticated USING (has_role('platform_admin'));
CREATE POLICY "Admins manage advancement" ON league_advancement FOR ALL TO authenticated USING (has_role('platform_admin', 'district_admin'));

COMMIT;
