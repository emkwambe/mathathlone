-- =============================================================================
-- Migration 048 — Sprint 16C: Class Rosters & Managed Mathlete Access
-- =============================================================================
-- Establishes classroom-ready infrastructure for the three-school pilot.
--
-- This migration:
--   1. Stores a reusable managed Mathlete username on public.users.
--   2. Defines server-side class management and Heat-join authority helpers.
--   3. Enforces roster-only participation for Heat rows attached to a class.
--   4. Lets active enrolled students read their own class Heat before joining it.
--
-- Existing unscoped Heats retain their established behavior. A Heat becomes
-- roster-scoped only when it has a non-null class_id.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Managed Mathlete identity
-- -----------------------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS managed_username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_managed_username_unique
  ON public.users (lower(managed_username))
  WHERE managed_username IS NOT NULL;

COMMENT ON COLUMN public.users.managed_username IS
  'Teacher-managed classroom sign-in name. The temporary PIN remains only in Supabase Auth and is never stored here.';

-- -----------------------------------------------------------------------------
-- 2. Scoped class authority
-- -----------------------------------------------------------------------------

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
    SELECT district_id
      INTO v_actor_district_id
      FROM public.user_roles
     WHERE user_id = v_actor_id
       AND role = 'district_admin'
       AND is_active = TRUE
     ORDER BY created_at DESC
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

-- -----------------------------------------------------------------------------
-- 3. Roster-scoped Heat participation
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_join_heat(p_heat_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_class_id UUID;
  v_status TEXT;
BEGIN
  IF v_actor_id IS NULL OR p_heat_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT class_id, status::text
    INTO v_class_id, v_status
    FROM public.heats
   WHERE id = p_heat_id
   LIMIT 1;

  IF v_status IS NULL OR v_status NOT IN ('lobby', 'open', 'scheduled') THEN
    RETURN FALSE;
  END IF;

  -- Preserve existing behavior for legacy/unscoped Heats. New classroom Heats
  -- explicitly carry class_id and therefore take the protected path below.
  IF v_class_id IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public.class_enrollments ce
     WHERE ce.class_id = v_class_id
       AND ce.athlete_id = v_actor_id
       AND ce.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_join_heat(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_join_heat(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.can_join_heat(UUID) IS
  'Checks that a signed-in student is actively rostered when the Heat is attached to a class. Legacy unscoped Heats remain joinable by authenticated students.';

-- A student must be able to read the shared classroom Heat before their first
-- participation row exists, but only if they are an active roster member.
DROP POLICY IF EXISTS "Read enrolled class heats" ON public.heats;
CREATE POLICY "Read enrolled class heats"
  ON public.heats FOR SELECT
  TO authenticated
  USING (
    class_id IS NOT NULL
    AND EXISTS (
      SELECT 1
        FROM public.class_enrollments ce
       WHERE ce.class_id = heats.class_id
         AND ce.athlete_id = auth.uid()
         AND ce.status = 'active'
    )
  );

-- Replace only the participation INSERT policy. All existing SELECT/UPDATE
-- policies remain intact.
DROP POLICY IF EXISTS "Join heat as participant" ON public.heat_participations;
CREATE POLICY "Join heat as participant"
  ON public.heat_participations FOR INSERT
  TO authenticated
  WITH CHECK (
    athlete_id = auth.uid()
    AND public.can_join_heat(heat_id)
  );

-- Scoped staff need to inspect class and roster context. The roster mutation
-- APIs use the service role only after their own can_manage_class check.
DROP POLICY IF EXISTS "Scoped staff read classes" ON public.classes;
CREATE POLICY "Scoped staff read classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.can_manage_class(id));

DROP POLICY IF EXISTS "Read own active class enrollment" ON public.class_enrollments;
CREATE POLICY "Read own active class enrollment"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid() AND status = 'active');

DROP POLICY IF EXISTS "Class managers read enrollments" ON public.class_enrollments;
CREATE POLICY "Class managers read enrollments"
  ON public.class_enrollments FOR SELECT
  TO authenticated
  USING (public.can_manage_class(class_id));

-- -----------------------------------------------------------------------------
-- 4. Structural integrity for class-bound Heats
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_class_bound_heat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_school_id UUID;
BEGIN
  IF NEW.class_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT public.can_manage_class(NEW.class_id) THEN
    RAISE EXCEPTION 'You are not allowed to create or attach a Heat to this class.';
  END IF;

  SELECT school_id
    INTO v_class_school_id
    FROM public.classes
   WHERE id = NEW.class_id
     AND is_active = TRUE;

  IF v_class_school_id IS NULL THEN
    RAISE EXCEPTION 'Classroom Heat requires an active class.';
  END IF;

  IF NEW.school_id IS NULL THEN
    NEW.school_id := v_class_school_id;
  ELSIF NEW.school_id <> v_class_school_id THEN
    RAISE EXCEPTION 'The selected class belongs to a different school.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_class_bound_heat_before_write ON public.heats;
CREATE TRIGGER validate_class_bound_heat_before_write
  BEFORE INSERT OR UPDATE OF class_id, school_id
  ON public.heats
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_class_bound_heat();

COMMIT;

-- =============================================================================
-- Validation queries (run separately after successful migration)
-- =============================================================================
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'users'
--   AND column_name = 'managed_username';
-- SELECT proname FROM pg_proc
-- WHERE proname IN ('can_manage_class', 'can_join_heat', 'validate_class_bound_heat');
-- =============================================================================
