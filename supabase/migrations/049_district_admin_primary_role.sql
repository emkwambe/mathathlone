-- =============================================================================
-- Migration 049 — District Coordinator Primary Role Compatibility
-- =============================================================================
-- The legacy public.users.role enum predates the scoped app_role model and did
-- not include district_admin. Sprint 16B already treats district_admin as a
-- valid staff role in user_roles, dashboard routing, and organization-scoped
-- authorization. Adding the missing legacy enum value aligns that profile
-- column with the established app_role enum without changing any user record.
--
-- This migration intentionally does not wrap ALTER TYPE in BEGIN/COMMIT: a new
-- PostgreSQL enum value must be committed before it can safely be used by later
-- writes in a deployment or SQL-editor session.
-- =============================================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'district_admin';

-- Sprint 16C's helper correctly looks up district coordinator assignments in
-- public.user_roles, but it used column names from the legacy draft schema.
-- user_roles is scope-based, so the district is scope_id and recency is
-- granted_at. Keep the existing teacher, school coordinator, and platform
-- administrator checks unchanged.
CREATE OR REPLACE FUNCTION public.can_manage_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_actor_role TEXT;
  v_actor_school_id UUID;
  v_actor_district_id UUID;
  v_class_teacher_id UUID;
  v_class_school_id UUID;
  v_class_district_id UUID;
BEGIN
  IF v_actor_id IS NULL OR p_class_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role::text, school_id
    INTO v_actor_role, v_actor_school_id
    FROM public.users
   WHERE id = v_actor_id
     AND COALESCE(is_active, TRUE) = TRUE
   LIMIT 1;

  IF v_actor_role IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT c.teacher_id, c.school_id, s.district_id
    INTO v_class_teacher_id, v_class_school_id, v_class_district_id
    FROM public.classes c
    JOIN public.schools s ON s.id = c.school_id
   WHERE c.id = p_class_id
     AND c.is_active = TRUE
   LIMIT 1;

  IF v_class_school_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_actor_role = 'platform_admin' THEN
    RETURN TRUE;
  END IF;

  IF v_class_teacher_id = v_actor_id THEN
    RETURN TRUE;
  END IF;

  IF v_actor_role = 'school_admin' AND v_actor_school_id = v_class_school_id THEN
    RETURN TRUE;
  END IF;

  IF v_actor_role = 'district_admin' THEN
    SELECT scope_id
      INTO v_actor_district_id
      FROM public.user_roles
     WHERE user_id = v_actor_id
       AND role = 'district_admin'::public.app_role
       AND scope_type = 'district'
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY granted_at DESC
     LIMIT 1;

    IF v_actor_district_id IS NULL THEN
      SELECT s.district_id
        INTO v_actor_district_id
        FROM public.schools s
       WHERE s.id = v_actor_school_id;
    END IF;

    RETURN v_actor_district_id IS NOT NULL
       AND v_actor_district_id = v_class_district_id;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_class(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_class(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.can_manage_class(UUID) IS
  'Returns true only for the active class teacher, a scoped school/district coordinator, or a platform administrator.';

-- Read-only verification after applying this migration:
-- SELECT EXISTS (
--   SELECT 1
--   FROM pg_enum e
--   JOIN pg_type t ON t.oid = e.enumtypid
--   JOIN pg_namespace n ON n.oid = t.typnamespace
--   WHERE n.nspname = 'public' AND t.typname = 'user_role'
--     AND e.enumlabel = 'district_admin'
-- ) AS district_admin_primary_role_available;
