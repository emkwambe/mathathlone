-- =============================================================================
-- Migration 050 — Repair Auth Profile Trigger & Backfill DEMO Staff Profiles
-- =============================================================================
-- Fixes the type mismatch that prevented public.users profile creation whenever
-- Supabase Auth inserted a new account. The prior function supplied a TEXT CASE
-- expression to public.users.role (public.user_role enum), then suppressed the
-- resulting error. This migration restores explicit enum casting and backfills
-- only the seven confirmed synthetic DEMO staff identities.
--
-- No password, Auth credential, real user, school, organization, or existing
-- profile is modified. Existing profiles are never overwritten.
-- =============================================================================

BEGIN;

-- Keep the Auth-to-profile trigger usable for all future registrations.
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_role TEXT;
  app_role_val public.app_role;
  v_legacy_role public.user_role;
  v_school_id UUID;
BEGIN
  desired_role := COALESCE(
    NEW.raw_user_meta_data->>'desired_role',
    NEW.raw_user_meta_data->>'role',
    'mathlete'
  );

  BEGIN
    app_role_val := desired_role::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    app_role_val := 'mathlete'::public.app_role;
  END;

  -- Public self-registration must never grant an administrative role.
  IF app_role_val IN ('platform_admin', 'district_admin', 'school_admin') THEN
    app_role_val := 'mathlete'::public.app_role;
  END IF;

  -- Ignore malformed optional school metadata rather than blocking profile
  -- creation. School assignment is still validated by its own workflows.
  BEGIN
    v_school_id := NULLIF(NEW.raw_user_meta_data->>'school_id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_school_id := NULL;
  END;

  -- Explicitly cast the CASE result to the legacy public.user_role enum.
  -- app_role continues to be authoritative for multi-role/scoped authorization.
  v_legacy_role := CASE
    WHEN app_role_val = 'mathlete' THEN 'athlete'::public.user_role
    WHEN app_role_val::TEXT IN (
      'teacher', 'parent', 'school_admin', 'district_admin', 'platform_admin'
    ) THEN app_role_val::TEXT::public.user_role
    ELSE 'athlete'::public.user_role
  END;

  INSERT INTO public.users (
    id, email, role, display_name, country_code, school_id,
    fair_play_acknowledged_at, data_minimization_tier
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_legacy_role,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'US',
    v_school_id,
    CASE WHEN app_role_val IN ('teacher', 'school_admin', 'parent', 'district_admin')
      THEN NOW() ELSE NULL END,
    'minimal'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (
    user_id, role, scope_type, scope_id, granted_at, is_active
  )
  VALUES (
    NEW.id,
    app_role_val,
    CASE
      WHEN app_role_val IN ('teacher', 'school_admin') AND v_school_id IS NOT NULL THEN 'school'
      WHEN app_role_val = 'mathlete' AND v_school_id IS NOT NULL THEN 'school'
      ELSE 'self'
    END,
    COALESCE(v_school_id, NEW.id),
    NOW(),
    TRUE
  )
  ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

  INSERT INTO public.auth_events (user_id, event_type, event_data)
  VALUES (
    NEW.id,
    'login_success',
    jsonb_build_object('event', 'signup', 'role', app_role_val, 'school_id', v_school_id)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Preserve Auth account creation, but retain server-side diagnostics.
  RAISE LOG 'handle_new_user_v2 error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Guard against applying this targeted repair to the wrong project or after the
-- requested identities were changed. All seven approved Auth identities must
-- exist; profiles are backfilled only when missing.
DO $$
DECLARE
  v_expected_count INTEGER := 7;
  v_auth_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO v_auth_count
    FROM auth.users
   WHERE lower(email) IN (
     'demo.district.coordinator@mathathlone.test',
     'demo.northstar.coordinator@mathathlone.test',
     'demo.riverbend.coordinator@mathathlone.test',
     'demo.northstar.grade6@mathathlone.test',
     'demo.northstar.grade7@mathathlone.test',
     'demo.riverbend.grade6@mathathlone.test',
     'demo.riverbend.grade7@mathathlone.test'
   );

  IF v_auth_count <> v_expected_count THEN
    RAISE EXCEPTION 'Expected % confirmed DEMO Auth identities, found %. No profile repair was applied.',
      v_expected_count, v_auth_count;
  END IF;
END
$$;

-- Backfill only missing profiles for the seven explicitly named DEMO accounts.
-- Each begins at the least-privileged baseline; the protected pilot console
-- performs the later teacher/coordinator scope assignments.
WITH labels(email, display_name) AS (
  VALUES
    ('demo.district.coordinator@mathathlone.test', 'DEMO District Coordinator'),
    ('demo.northstar.coordinator@mathathlone.test', 'DEMO Northstar Coordinator'),
    ('demo.riverbend.coordinator@mathathlone.test', 'DEMO Riverbend Coordinator'),
    ('demo.northstar.grade6@mathathlone.test', 'DEMO Northstar Grade 6 Teacher'),
    ('demo.northstar.grade7@mathathlone.test', 'DEMO Northstar Grade 7 Teacher'),
    ('demo.riverbend.grade6@mathathlone.test', 'DEMO Riverbend Grade 6 Teacher'),
    ('demo.riverbend.grade7@mathathlone.test', 'DEMO Riverbend Grade 7 Teacher')
), missing_profiles AS (
  SELECT au.id, au.email, labels.display_name
  FROM labels
  JOIN auth.users AS au ON lower(au.email) = labels.email
  LEFT JOIN public.users AS u ON u.id = au.id
  WHERE u.id IS NULL
), inserted_profiles AS (
  INSERT INTO public.users (
    id, email, role, display_name, country_code, school_id,
    fair_play_acknowledged_at, data_minimization_tier
  )
  SELECT
    id,
    email,
    'athlete'::public.user_role,
    display_name,
    'US',
    NULL,
    NULL,
    'minimal'
  FROM missing_profiles
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO public.user_roles (
  user_id, role, scope_type, scope_id, granted_at, is_active, notes
)
SELECT
  inserted_profiles.id,
  'mathlete'::public.app_role,
  'self',
  inserted_profiles.id,
  NOW(),
  TRUE,
  'Migration 050 baseline role for dedicated DEMO pilot account'
FROM inserted_profiles
ON CONFLICT (user_id, role, scope_type, scope_id) DO NOTHING;

-- Add a clear audit entry once per repaired identity without creating duplicates
-- if this migration is re-run after a partial interruption.
INSERT INTO public.auth_events (user_id, event_type, event_data)
SELECT
  au.id,
  'login_success',
  jsonb_build_object('event', 'demo_profile_backfill', 'role', 'mathlete')
FROM auth.users AS au
WHERE lower(au.email) IN (
  'demo.district.coordinator@mathathlone.test',
  'demo.northstar.coordinator@mathathlone.test',
  'demo.riverbend.coordinator@mathathlone.test',
  'demo.northstar.grade6@mathathlone.test',
  'demo.northstar.grade7@mathathlone.test',
  'demo.riverbend.grade6@mathathlone.test',
  'demo.riverbend.grade7@mathathlone.test'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.auth_events AS ae
  WHERE ae.user_id = au.id
    AND ae.event_data ->> 'event' = 'demo_profile_backfill'
);

COMMIT;

-- Read-only verification after applying this migration:
-- SELECT
--   au.email,
--   (u.id IS NOT NULL) AS profile_exists,
--   u.display_name,
--   u.role::text AS primary_role,
--   ur.role::text AS baseline_scoped_role,
--   ur.scope_type,
--   ur.scope_id,
--   ur.is_active
-- FROM auth.users AS au
-- LEFT JOIN public.users AS u ON u.id = au.id
-- LEFT JOIN public.user_roles AS ur
--   ON ur.user_id = au.id
--  AND ur.role = 'mathlete'::public.app_role
--  AND ur.scope_type = 'self'
-- WHERE lower(au.email) LIKE 'demo.%@mathathlone.test'
-- ORDER BY au.email;
