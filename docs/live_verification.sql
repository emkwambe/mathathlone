-- =============================================================================
-- MathAthlone Live Database Verification
-- =============================================================================
-- Purpose: Capture the ACTUAL state of the live Supabase database for the
--          mathathlone project (ref: yhqxxgqfpgcertsqibps).
--
-- HOW TO USE:
--   1. Open Supabase SQL Editor for the mathathlone project.
--   2. Paste each labeled block (or the whole file) and Run.
--   3. Copy each query's full result into docs/LIVE_QUERY_RESULTS.md under
--      a matching heading (### Query A1, ### Query A2, ...).
--   4. When all results are captured, tell Claude Code to continue Sprint 0.
--
-- These queries are READ-ONLY. None of them modifies any table or row.
-- =============================================================================


-- =============================================================================
-- QUERY A1 — heats columns
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'heats'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY A2 — heat_participations columns
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'heat_participations'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY A3 — heat_questions columns
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'heat_questions'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY A4 — question_submissions columns
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'question_submissions'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY B1 — users columns
-- =============================================================================
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY B2 — schools columns
-- =============================================================================
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'schools'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY B3 — topics columns (LEGACY — confirm if it still exists)
-- =============================================================================
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'topics'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY C — divisions current data
-- =============================================================================
SELECT id, name, code, grade_min, grade_max, description, display_order, created_at
FROM divisions
ORDER BY display_order;


-- =============================================================================
-- QUERY D — all custom enums in the public schema
-- =============================================================================
SELECT t.typname AS enum_name,
       e.enumlabel,
       e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;


-- =============================================================================
-- QUERY E — RLS policies on competition tables
-- =============================================================================
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'heats', 'heat_participations', 'heat_questions',
      'question_submissions', 'topics', 'static_questions',
      'divisions', 'heat_awards', 'division_curricula',
      'focus_violations', 'detected_anomalies'
  )
ORDER BY tablename, policyname;


-- =============================================================================
-- QUERY F — award/medal/ranking columns
-- =============================================================================
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('medals', 'achievements', 'user_achievements', 'rankings')
ORDER BY table_name, ordinal_position;


-- =============================================================================
-- QUERY G — curriculum hierarchy columns
-- =============================================================================
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('courses', 'unit_topics', 'atomic_concepts',
                     'question_generators', 'static_questions')
ORDER BY table_name, ordinal_position;


-- =============================================================================
-- QUERY G2 — curriculum data counts
-- =============================================================================
SELECT 'courses'             AS tbl, COUNT(*) AS cnt FROM courses
UNION ALL SELECT 'unit_topics',         COUNT(*) FROM unit_topics
UNION ALL SELECT 'atomic_concepts',     COUNT(*) FROM atomic_concepts
UNION ALL SELECT 'question_generators', COUNT(*) FROM question_generators
UNION ALL SELECT 'static_questions',    COUNT(*) FROM static_questions;


-- =============================================================================
-- QUERY G3 — unit_topics ↔ courses linkage
-- =============================================================================
SELECT ut.id,
       ut.name,
       ut.code,
       ut.display_order,
       c.name AS course_name,
       c.code AS course_code
FROM unit_topics ut
LEFT JOIN courses c ON ut.course_id = c.id
ORDER BY ut.display_order;


-- =============================================================================
-- QUERY G4 — orphaned topics table (rows)
-- =============================================================================
SELECT * FROM topics ORDER BY name;


-- =============================================================================
-- QUERY G5 — question_generators present
--           (expected: 54 entries, matching src/lib/competition/generators.ts)
-- =============================================================================
SELECT qg.generator_type,
       qg.answer_type,
       qg.is_active,
       ac.lesson_number,
       ac.name AS concept_name
FROM question_generators qg
LEFT JOIN atomic_concepts ac ON qg.concept_id = ac.id
ORDER BY qg.generator_type;


-- =============================================================================
-- QUERY G6 — courses currently in DB (resolve M1 vs NCM1 ambiguity)
-- =============================================================================
SELECT id, name, code, grade_band, state, description, display_order, is_active, created_at
FROM courses
ORDER BY display_order, name;


-- =============================================================================
-- QUERY H — league engine table columns
-- =============================================================================
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('athlete_ratings', 'league_standings', 'brackets', 'bracket_matches')
ORDER BY table_name, ordinal_position;


-- =============================================================================
-- QUERY I — integrity table columns
-- =============================================================================
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('integrity_configs', 'focus_violations', 'teacher_attestations')
ORDER BY table_name, ordinal_position;


-- =============================================================================
-- QUERY J — helper function source code + security mode
-- =============================================================================
SELECT proname,
       pg_get_function_identity_arguments(oid) AS args,
       prosecdef AS is_security_definer,
       provolatile,
       prosrc
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
      'authorize',
      'has_role',
      'user_school_id',
      'user_district_id',
      'user_role',
      'set_updated_at',
      'update_updated_at',
      'handle_new_user_v2',
      'custom_access_token_hook',
      'is_under_13',
      'is_minor'
  )
ORDER BY proname;


-- =============================================================================
-- QUERY K — does `broadcast_heats` table exist?
-- =============================================================================
SELECT to_regclass('public.broadcast_heats') AS broadcast_heats_exists;
-- NULL means missing. A non-null oid means it exists.


-- =============================================================================
-- QUERY L — does `heat_awards` exist?
-- =============================================================================
SELECT to_regclass('public.heat_awards') AS heat_awards_exists;


-- =============================================================================
-- QUERY M — does `division_curricula` exist?
-- =============================================================================
SELECT to_regclass('public.division_curricula') AS division_curricula_exists;


-- =============================================================================
-- QUERY N — full list of public tables (sanity check)
-- =============================================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;


-- =============================================================================
-- QUERY O — full list of public enums (sanity check)
-- =============================================================================
SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY t.typname;


-- =============================================================================
-- QUERY P — FK references to divisions (need this to know what cascades when
--           we DELETE FROM divisions in migration 013)
-- =============================================================================
SELECT tc.table_name      AS referencing_table,
       kcu.column_name    AS referencing_column,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema    = kcu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
 AND tc.table_schema    = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name     = 'divisions'
ORDER BY tc.table_name, kcu.column_name;


-- =============================================================================
-- QUERY Q — current focus_violations column types
--           (audit flagged: base says INTEGER, 003 says JSONB — which won?)
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'focus_violations'
ORDER BY ordinal_position;


-- =============================================================================
-- QUERY R — heat_participations focus_violations column type
--           (same conflict: integer vs jsonb on heat_participations.focus_violations)
-- =============================================================================
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'heat_participations'
  AND column_name = 'focus_violations';


-- =============================================================================
-- QUERY S — duplicate enum check: any 'violation_type' values referencing
--           web events would indicate 003's enum is the live one
-- =============================================================================
SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typname = 'violation_type'
GROUP BY t.typname;


-- =============================================================================
-- QUERY T — current schools.license_tier type
--           (audit flagged: base says enum, 006-auth says text — which won?)
-- =============================================================================
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'schools'
  AND column_name = 'license_tier';


-- =============================================================================
-- QUERY U — users.role current values + role_permissions seed status
-- =============================================================================
SELECT 'users.role distinct' AS scope, role::text AS value, COUNT(*) AS n
FROM users
GROUP BY role
UNION ALL
SELECT 'role_permissions row count', '*', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'user_roles active count',   '*', COUNT(*) FROM user_roles WHERE is_active = true;


-- =============================================================================
-- END OF VERIFICATION
-- =============================================================================
-- Save each result into docs/LIVE_QUERY_RESULTS.md under matching headings.
-- Then tell Claude Code: "live results saved, continue Sprint 0."
-- =============================================================================
