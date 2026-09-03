-- Sprint 17 — Read-only production schema and DEMO roster baseline
-- Purpose: confirm the live contract before writing or applying any Sprint 17 migration.
-- Safety: this script performs SELECT queries only. It does not create, alter,
-- update, delete, or expose any temporary PIN, password, API key, or secret.

-- 1. Columns that the classroom roster workflow may use.
SELECT
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'users' AND column_name IN (
      'id', 'email', 'display_name', 'role', 'school_id', 'grade_level',
      'is_active', 'managed', 'managed_username', 'deleted_at'
    ))
    OR (table_name = 'classes' AND column_name IN (
      'id', 'name', 'school_id', 'teacher_id', 'grade_level', 'join_code',
      'is_active', 'created_at', 'updated_at'
    ))
    OR (table_name = 'class_enrollments' AND column_name IN (
      'id', 'class_id', 'athlete_id', 'status', 'enrolled_at'
    ))
    OR table_name = 'roster_operations'
    OR table_name = 'auth_events'
  )
ORDER BY table_name, ordinal_position;

-- 2. Enum values that control enrollment and audit behavior.
SELECT
  t.typname AS enum_name,
  e.enumsortorder AS sort_order,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname IN ('enrollment_status', 'app_role', 'user_role', 'auth_event_type')
ORDER BY t.typname, e.enumsortorder;

-- 3. Existing indexes relevant to usernames, classes, and class enrollment.
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'classes', 'class_enrollments', 'roster_operations', 'auth_events')
ORDER BY tablename, indexname;

-- 4. Active Row Level Security policies for the classroom tables.
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'classes', 'class_enrollments', 'roster_operations', 'auth_events')
ORDER BY tablename, policyname;

-- 5. Required classroom authorization helpers. Definitions are intentionally
-- omitted here; only existence and return type are needed for the baseline.
SELECT
  p.proname AS function_name,
  pg_get_function_result(p.oid) AS returns,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('can_manage_class', 'can_join_heat', 'validate_class_bound_heat')
ORDER BY p.proname;

-- 6. Current controlled DEMO class state. This contains no student credentials.
SELECT
  c.id AS class_id,
  c.name AS class_name,
  c.grade_level,
  c.is_active AS class_is_active,
  COUNT(ce.id) FILTER (WHERE ce.status = 'active') AS active_roster_count,
  COUNT(ce.id) FILTER (WHERE ce.status <> 'active') AS non_active_enrollment_count
FROM public.classes c
LEFT JOIN public.class_enrollments ce ON ce.class_id = c.id
WHERE c.name = 'DEMO Northstar Grade 6 — Period 1'
GROUP BY c.id, c.name, c.grade_level, c.is_active
ORDER BY c.name;

-- 7. Ensure no class-bound Heat is currently associated with the controlled class.
SELECT
  c.name AS class_name,
  h.code AS heat_code,
  h.status AS heat_status,
  h.created_at
FROM public.classes c
LEFT JOIN public.heats h ON h.class_id = c.id
WHERE c.name = 'DEMO Northstar Grade 6 — Period 1'
ORDER BY h.created_at DESC NULLS LAST;
