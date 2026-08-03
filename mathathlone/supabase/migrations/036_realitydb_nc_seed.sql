-- =============================================================================
-- 036_realitydb_nc_seed.sql
-- =============================================================================
-- RealityDB Synthetic Seed: North Carolina Hierarchy
-- Scale: 1 State → 2 Regions → 4 Districts → 16 Schools → 64 Classrooms → 1,024 Mathletes
--
-- This seed is IDEMPOTENT (ON CONFLICT DO NOTHING / DO UPDATE).
-- Run it against the live Supabase DB via the SQL Editor.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: STATE
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO states (code, name, country_code)
VALUES ('NC', 'North Carolina', 'US')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: REGIONS (2 in NC)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO regions (id, name, state_code) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Charlotte Area',  'NC'),
  ('11111111-0000-0000-0000-000000000002', 'Triangle Area',   'NC')
ON CONFLICT (name, state_code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: DISTRICTS (4 total, 2 per Region)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO districts (id, name, state, country_code, region_id, is_active) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Charlotte-Mecklenburg Schools', 'NC', 'US', '11111111-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-000000000002', 'Union County Public Schools',   'NC', 'US', '11111111-0000-0000-0000-000000000001', true),
  ('22222222-0000-0000-0000-000000000003', 'Wake County Public Schools',    'NC', 'US', '11111111-0000-0000-0000-000000000002', true),
  ('22222222-0000-0000-0000-000000000004', 'Durham Public Schools',         'NC', 'US', '11111111-0000-0000-0000-000000000002', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: SCHOOLS (16 total, 4 per District)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO schools (id, name, district_id, state, country_code) VALUES
  -- Charlotte-Mecklenburg
  ('33333333-0000-0000-0000-000000000001', 'Myers Park Middle',       '22222222-0000-0000-0000-000000000001', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000002', 'Eastway Middle',          '22222222-0000-0000-0000-000000000001', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000003', 'Albemarle Road Middle',   '22222222-0000-0000-0000-000000000001', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000004', 'Northridge Middle',       '22222222-0000-0000-0000-000000000001', 'NC', 'US'),
  -- Union County
  ('33333333-0000-0000-0000-000000000005', 'Piedmont Middle',         '22222222-0000-0000-0000-000000000002', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000006', 'Parkwood Middle',         '22222222-0000-0000-0000-000000000002', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000007', 'Sun Valley Middle',       '22222222-0000-0000-0000-000000000002', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000008', 'Cuthbertson Middle',      '22222222-0000-0000-0000-000000000002', 'NC', 'US'),
  -- Wake County
  ('33333333-0000-0000-0000-000000000009', 'Ligon Middle',            '22222222-0000-0000-0000-000000000003', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000010', 'Centennial Campus Middle','22222222-0000-0000-0000-000000000003', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000011', 'East Millbrook Middle',   '22222222-0000-0000-0000-000000000003', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000012', 'Reedy Creek Middle',      '22222222-0000-0000-0000-000000000003', 'NC', 'US'),
  -- Durham
  ('33333333-0000-0000-0000-000000000013', 'Githens Middle',          '22222222-0000-0000-0000-000000000004', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000014', 'Brogden Middle',          '22222222-0000-0000-0000-000000000004', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000015', 'Sherwood Githens Middle', '22222222-0000-0000-0000-000000000004', 'NC', 'US'),
  ('33333333-0000-0000-0000-000000000016', 'Neal Middle',             '22222222-0000-0000-0000-000000000004', 'NC', 'US')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: SEASONS — ensure an active season exists
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO seasons (id, name, code, starts_at, ends_at, is_active) VALUES
  ('44444444-0000-0000-0000-000000000001', '2025–2026 Season', '2026-SPRING',
   '2025-08-01', '2026-06-30', true)
ON CONFLICT (code) DO UPDATE SET is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: LEAGUES — one per level per school/district/region/state
-- ─────────────────────────────────────────────────────────────────────────────

-- 16 School-level leagues (one per school)
INSERT INTO leagues (id, name, level, region, season_id, max_schools) VALUES
  ('55555555-0000-0000-0000-000000000001', 'Myers Park School League',        'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000002', 'Eastway School League',           'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000003', 'Albemarle Road School League',    'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000004', 'Northridge School League',        'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000005', 'Piedmont School League',          'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000006', 'Parkwood School League',          'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000007', 'Sun Valley School League',        'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000008', 'Cuthbertson School League',       'school', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000009', 'Ligon School League',             'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000010', 'Centennial Campus School League', 'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000011', 'East Millbrook School League',    'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000012', 'Reedy Creek School League',       'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000013', 'Githens School League',           'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000014', 'Brogden School League',           'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000015', 'Sherwood Githens School League',  'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-0000-0000-0000-000000000016', 'Neal School League',              'school', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32)
ON CONFLICT (id) DO NOTHING;

-- 4 District-level leagues
INSERT INTO leagues (id, name, level, region, season_id, max_schools) VALUES
  ('55555555-1000-0000-0000-000000000001', 'CMS District Championship',    'district', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-1000-0000-0000-000000000002', 'Union County Championship',    'district', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-1000-0000-0000-000000000003', 'Wake County Championship',     'district', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32),
  ('55555555-1000-0000-0000-000000000004', 'Durham District Championship', 'district', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 32)
ON CONFLICT (id) DO NOTHING;

-- 2 Regional leagues
INSERT INTO leagues (id, name, level, region, season_id, max_schools) VALUES
  ('55555555-2000-0000-0000-000000000001', 'Charlotte Area Regional Championship', 'regional', 'Charlotte Area', '44444444-0000-0000-0000-000000000001', 64),
  ('55555555-2000-0000-0000-000000000002', 'Triangle Area Regional Championship',  'regional', 'Triangle Area',  '44444444-0000-0000-0000-000000000001', 64)
ON CONFLICT (id) DO NOTHING;

-- 1 State league
INSERT INTO leagues (id, name, level, region, season_id, max_schools) VALUES
  ('55555555-3000-0000-0000-000000000001', 'NC State Championship', 'state', 'NC', '44444444-0000-0000-0000-000000000001', 128)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: ADVANCEMENT PATHS
-- School → District (top 4 from each school advance)
-- District → Regional (top 8 from each district advance)
-- Regional → State (top 16 from each region advance)
-- ─────────────────────────────────────────────────────────────────────────────

-- School → District (CMS: schools 1–4 → district 1)
INSERT INTO league_advancement (source_league_id, target_league_id, slots_allocated) VALUES
  ('55555555-0000-0000-0000-000000000001', '55555555-1000-0000-0000-000000000001', 4),
  ('55555555-0000-0000-0000-000000000002', '55555555-1000-0000-0000-000000000001', 4),
  ('55555555-0000-0000-0000-000000000003', '55555555-1000-0000-0000-000000000001', 4),
  ('55555555-0000-0000-0000-000000000004', '55555555-1000-0000-0000-000000000001', 4),
  -- Union County: schools 5–8 → district 2
  ('55555555-0000-0000-0000-000000000005', '55555555-1000-0000-0000-000000000002', 4),
  ('55555555-0000-0000-0000-000000000006', '55555555-1000-0000-0000-000000000002', 4),
  ('55555555-0000-0000-0000-000000000007', '55555555-1000-0000-0000-000000000002', 4),
  ('55555555-0000-0000-0000-000000000008', '55555555-1000-0000-0000-000000000002', 4),
  -- Wake County: schools 9–12 → district 3
  ('55555555-0000-0000-0000-000000000009', '55555555-1000-0000-0000-000000000003', 4),
  ('55555555-0000-0000-0000-000000000010', '55555555-1000-0000-0000-000000000003', 4),
  ('55555555-0000-0000-0000-000000000011', '55555555-1000-0000-0000-000000000003', 4),
  ('55555555-0000-0000-0000-000000000012', '55555555-1000-0000-0000-000000000003', 4),
  -- Durham: schools 13–16 → district 4
  ('55555555-0000-0000-0000-000000000013', '55555555-1000-0000-0000-000000000004', 4),
  ('55555555-0000-0000-0000-000000000014', '55555555-1000-0000-0000-000000000004', 4),
  ('55555555-0000-0000-0000-000000000015', '55555555-1000-0000-0000-000000000004', 4),
  ('55555555-0000-0000-0000-000000000016', '55555555-1000-0000-0000-000000000004', 4)
ON CONFLICT (source_league_id, target_league_id) DO NOTHING;

-- District → Regional (top 8 from each district)
INSERT INTO league_advancement (source_league_id, target_league_id, slots_allocated) VALUES
  ('55555555-1000-0000-0000-000000000001', '55555555-2000-0000-0000-000000000001', 8),
  ('55555555-1000-0000-0000-000000000002', '55555555-2000-0000-0000-000000000001', 8),
  ('55555555-1000-0000-0000-000000000003', '55555555-2000-0000-0000-000000000002', 8),
  ('55555555-1000-0000-0000-000000000004', '55555555-2000-0000-0000-000000000002', 8)
ON CONFLICT (source_league_id, target_league_id) DO NOTHING;

-- Regional → State (top 16 from each region)
INSERT INTO league_advancement (source_league_id, target_league_id, slots_allocated) VALUES
  ('55555555-2000-0000-0000-000000000001', '55555555-3000-0000-0000-000000000001', 16),
  ('55555555-2000-0000-0000-000000000002', '55555555-3000-0000-0000-000000000001', 16)
ON CONFLICT (source_league_id, target_league_id) DO NOTHING;

COMMIT;
