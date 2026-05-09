-- =============================================================================
-- MathAthlone Auth v2 — Seed & User Migration
-- =============================================================================
-- File: 008_auth_v2_seed.sql
-- Run AFTER: 006_auth_v2_schema.sql, 007_auth_v2_rls.sql
--
-- 1. Seeds role_permissions table (the role → permission mapping)
-- 2. Migrates existing users.role values into the new user_roles table
-- 3. Creates a default district for legacy schools
-- 4. Sets data_minimization_tier on existing users based on age
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: SEED role_permissions
-- -----------------------------------------------------------------------------

INSERT INTO role_permissions (role, permission) VALUES
  -- mathlete: no permissions (RLS handles "read own data")

  -- parent: consent + delete own children's data
  ('parent', 'consent.grant.parent'),
  ('parent', 'data.delete.minor'),

  -- teacher: classroom operations
  ('teacher', 'heats.create'),
  ('teacher', 'heats.proctor'),
  ('teacher', 'users.read.school'),
  ('teacher', 'users.invite.mathlete'),

  -- school_admin: teacher's perms + school management
  ('school_admin', 'heats.create'),
  ('school_admin', 'heats.proctor'),
  ('school_admin', 'heats.delete'),
  ('school_admin', 'users.read.school'),
  ('school_admin', 'users.invite.mathlete'),
  ('school_admin', 'users.invite.teacher'),
  ('school_admin', 'data.export.school'),
  ('school_admin', 'data.delete.minor'),
  ('school_admin', 'integrity.review'),

  -- district_admin: school's perms + district management + regional attestation
  ('district_admin', 'heats.create'),
  ('district_admin', 'heats.proctor'),
  ('district_admin', 'heats.delete'),
  ('district_admin', 'users.read.school'),
  ('district_admin', 'users.read.district'),
  ('district_admin', 'users.invite.mathlete'),
  ('district_admin', 'users.invite.teacher'),
  ('district_admin', 'attest.regional'),
  ('district_admin', 'data.export.school'),
  ('district_admin', 'data.export.district'),
  ('district_admin', 'data.delete.minor'),
  ('district_admin', 'integrity.review'),

  -- platform_admin: ALL permissions
  ('platform_admin', 'heats.create'),
  ('platform_admin', 'heats.delete'),
  ('platform_admin', 'heats.proctor'),
  ('platform_admin', 'heats.broadcast'),
  ('platform_admin', 'users.read.school'),
  ('platform_admin', 'users.read.district'),
  ('platform_admin', 'users.read.platform'),
  ('platform_admin', 'users.invite.mathlete'),
  ('platform_admin', 'users.invite.teacher'),
  ('platform_admin', 'attest.regional'),
  ('platform_admin', 'attest.state'),
  ('platform_admin', 'integrity.review'),
  ('platform_admin', 'data.export.school'),
  ('platform_admin', 'data.export.district'),
  ('platform_admin', 'data.delete.minor'),
  ('platform_admin', 'consent.grant.parent'),

  -- broadcast_host: heat creation + broadcasting
  ('broadcast_host', 'heats.create'),
  ('broadcast_host', 'heats.broadcast')
ON CONFLICT (role, permission) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 2: CREATE DEFAULT DISTRICT (for legacy schools that have no district yet)
-- -----------------------------------------------------------------------------

INSERT INTO districts (id, name, state, is_active, license_tier)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Unassigned (Legacy)',
  'NC',
  true,
  'free'
)
ON CONFLICT (id) DO NOTHING;

-- Link any school without a district to the legacy district
UPDATE schools
SET district_id = '00000000-0000-0000-0000-000000000001'
WHERE district_id IS NULL;

-- -----------------------------------------------------------------------------
-- PART 3: MIGRATE EXISTING USERS INTO user_roles
-- -----------------------------------------------------------------------------
-- The legacy system stored role as a single text value on users.role.
-- We map each existing user to a user_roles entry, scoped appropriately.
-- -----------------------------------------------------------------------------

-- Mathletes (athletes) — scope = self (no school scope needed since RLS uses school_id)
INSERT INTO user_roles (user_id, role, scope_type, scope_id, granted_at, is_active)
SELECT
  u.id,
  'mathlete'::app_role,
  'self',
  u.id,
  NOW(),
  true
FROM users u
WHERE u.role = 'athlete'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'mathlete'
  )
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

-- Teachers — scope = their school
INSERT INTO user_roles (user_id, role, scope_type, scope_id, granted_at, is_active)
SELECT
  u.id,
  'teacher'::app_role,
  'school',
  u.school_id,
  NOW(),
  true
FROM users u
WHERE u.role = 'teacher'
  AND u.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'teacher'
  )
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

-- Parents — global scope
INSERT INTO user_roles (user_id, role, scope_type, scope_id, granted_at, is_active)
SELECT
  u.id,
  'parent'::app_role,
  'self',
  u.id,
  NOW(),
  true
FROM users u
WHERE u.role = 'parent'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'parent'
  )
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

-- School admins — scope = their school
INSERT INTO user_roles (user_id, role, scope_type, scope_id, granted_at, is_active)
SELECT
  u.id,
  'school_admin'::app_role,
  'school',
  u.school_id,
  NOW(),
  true
FROM users u
WHERE u.role = 'school_admin'
  AND u.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role = 'school_admin'
  )
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PART 4: SET DATA MINIMIZATION TIERS BASED ON AGE
-- -----------------------------------------------------------------------------

-- Adults: full
UPDATE users
SET data_minimization_tier = 'full'
WHERE date_of_birth IS NULL  -- assume adult if no DOB
   OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years');

-- Teens 13-17: standard (allow PII for educational use)
UPDATE users
SET data_minimization_tier = 'standard'
WHERE date_of_birth > (CURRENT_DATE - INTERVAL '18 years')
  AND date_of_birth <= (CURRENT_DATE - INTERVAL '13 years');

-- Under-13: minimal until VPC verified
UPDATE users
SET data_minimization_tier = 'minimal'
WHERE date_of_birth > (CURRENT_DATE - INTERVAL '13 years');

-- -----------------------------------------------------------------------------
-- PART 5: SET FERPA AUTHORIZATION FOR EXISTING SCHOOL-LINKED MATHLETES
-- -----------------------------------------------------------------------------
-- Existing mathletes who joined via teachers (school_id is set) are presumed
-- to be operating under the FERPA school official exception.
-- New users joining via class code will get this set in real-time.

UPDATE users u
SET 
  ferpa_authorized_at = NOW(),
  ferpa_authorizing_school_id = u.school_id
WHERE u.role = 'athlete'
  AND u.school_id IS NOT NULL
  AND u.ferpa_authorized_at IS NULL;

-- -----------------------------------------------------------------------------
-- PART 6: AUTO-PROFILE TRIGGER (updated for v2)
-- -----------------------------------------------------------------------------
-- When a new auth.users row is created, this trigger creates the public.users
-- row AND assigns the appropriate role in user_roles.

CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_role text;
  app_role_val app_role;
  v_school_id uuid;
BEGIN
  -- Read desired role from raw_user_meta_data, default to 'mathlete'
  desired_role := COALESCE(
    NEW.raw_user_meta_data->>'desired_role',
    NEW.raw_user_meta_data->>'role',
    'mathlete'
  );

  -- Validate role
  BEGIN
    app_role_val := desired_role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    app_role_val := 'mathlete'::app_role;
  END;

  -- Block self-registration as admin roles via signup metadata
  IF app_role_val IN ('platform_admin', 'district_admin', 'school_admin') THEN
    app_role_val := 'mathlete'::app_role;  -- downgrade silently
  END IF;

  -- School ID from metadata if provided
  v_school_id := NULLIF(NEW.raw_user_meta_data->>'school_id', '')::uuid;

  -- Insert into public.users
  INSERT INTO public.users (
    id, email, role, display_name, country_code, school_id,
    fair_play_acknowledged_at,
    data_minimization_tier
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Map app_role back to the legacy users.role enum if possible
    CASE app_role_val
      WHEN 'mathlete' THEN 'athlete'
      ELSE app_role_val::text
    END,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'US',
    v_school_id,
    CASE WHEN app_role_val IN ('teacher','school_admin','parent','district_admin')
         THEN NOW() ELSE NULL END,
    'minimal'  -- starts minimal, upgrades after verification
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into user_roles
  INSERT INTO user_roles (user_id, role, scope_type, scope_id, granted_at, is_active)
  VALUES (
    NEW.id,
    app_role_val,
    CASE
      WHEN app_role_val IN ('teacher','school_admin') AND v_school_id IS NOT NULL THEN 'school'
      WHEN app_role_val = 'mathlete' AND v_school_id IS NOT NULL THEN 'school'
      ELSE 'self'
    END,
    COALESCE(v_school_id, NEW.id),
    NOW(),
    true
  )
  ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

  -- Audit event
  INSERT INTO auth_events (user_id, event_type, event_data)
  VALUES (
    NEW.id,
    'login_success',  -- registration is implicitly first login
    jsonb_build_object(
      'event', 'signup',
      'role', app_role_val,
      'school_id', v_school_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user_v2 error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Replace the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_v2();

-- -----------------------------------------------------------------------------
-- VERIFY
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_role_perm_count INT;
  v_user_role_count INT;
  v_district_count INT;
  v_users_tier_minimal INT;
  v_users_tier_standard INT;
  v_users_tier_full INT;
BEGIN
  SELECT COUNT(*) INTO v_role_perm_count FROM role_permissions;
  SELECT COUNT(*) INTO v_user_role_count FROM user_roles WHERE is_active = true;
  SELECT COUNT(*) INTO v_district_count FROM districts;
  SELECT COUNT(*) INTO v_users_tier_minimal FROM users WHERE data_minimization_tier = 'minimal';
  SELECT COUNT(*) INTO v_users_tier_standard FROM users WHERE data_minimization_tier = 'standard';
  SELECT COUNT(*) INTO v_users_tier_full FROM users WHERE data_minimization_tier = 'full';

  RAISE NOTICE '✅ Auth v2 seed complete:';
  RAISE NOTICE '   role_permissions: %', v_role_perm_count;
  RAISE NOTICE '   user_roles (active): %', v_user_role_count;
  RAISE NOTICE '   districts: %', v_district_count;
  RAISE NOTICE '   users by tier: minimal=%, standard=%, full=%',
    v_users_tier_minimal, v_users_tier_standard, v_users_tier_full;
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION ACTIONS REQUIRED:
-- =============================================================================
-- 1. Enable Custom Access Token Hook in Supabase Dashboard
--    (Authentication → Hooks → Custom Access Token Hook → Enable)
--    Schema: public  |  Function: custom_access_token_hook
--
-- 2. ALL existing user sessions need to log out and log back in to receive
--    the new JWT claims (user_role, permissions, school_id, district_id).
--    Existing tokens will continue to work for RLS that doesn't need claims,
--    but new RBAC-aware policies will treat them as 'mathlete' until refresh.
--
-- 3. Test /api/debug/whoami (provided in code) to verify claims work.
-- =============================================================================
