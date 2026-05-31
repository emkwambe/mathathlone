-- ============================================================
-- FIX: Infinite recursion in heats RLS policies
-- Run this in Supabase SQL Editor
--
-- Root cause: RLS policies on 'heats' call functions like
-- has_role(), user_school_id(), authorize() which query
-- 'users' table. If 'users' has policies that reference
-- 'heats' (or any chain that loops back), PostgreSQL
-- detects infinite recursion.
--
-- Fix: Make all helper functions SECURITY DEFINER so they
-- bypass RLS when querying other tables.
-- ============================================================

-- 1. Fix authorize() — already done, but ensure SECURITY DEFINER
CREATE OR REPLACE FUNCTION authorize(requested_permission app_permission)
RETURNS boolean AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role
    AND permission = requested_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Fix has_role() — must bypass RLS on users
CREATE OR REPLACE FUNCTION has_role(VARIADIC roles app_role[])
RETURNS boolean AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();

  RETURN user_role = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Fix user_school_id() — must bypass RLS on users
CREATE OR REPLACE FUNCTION user_school_id()
RETURNS uuid AS $$
DECLARE
  sid uuid;
BEGIN
  SELECT school_id INTO sid
  FROM users
  WHERE id = auth.uid();

  RETURN sid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Verify: test that a teacher can insert a heat
-- (Run this after the fixes above)
-- SELECT authorize('heats.create'::app_permission);
-- Should return: true (when logged in as a teacher)

-- ============================================================
-- END OF FIX
-- ============================================================
