-- =============================================================================
-- Sprint 0 — Verification Script
-- =============================================================================
-- Run this in Supabase SQL Editor AFTER applying migrations 009 through 015.
-- Every numbered check has an expected result documented below. If any check
-- fails, the migration did not complete cleanly — re-run the relevant file or
-- investigate before moving on to Sprint 1.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Check 1 — Divisions (5 rows, official codes & grades)
-- Expected: 5 rows, ordered JR (3-4), INT (5-6), ADV (7-8), JV (9-10), SV (11-12)
-- -----------------------------------------------------------------------------
SELECT name, code, grade_min, grade_max
FROM divisions
ORDER BY grade_min;


-- -----------------------------------------------------------------------------
-- Check 2 — Division curricula (3 rows: ADV / JV / SV → NC Math 1)
-- Expected: 3 rows
-- -----------------------------------------------------------------------------
SELECT d.code AS division_code,
       d.name AS division_name,
       c.code AS course_code,
       c.name AS course_name
FROM division_curricula dc
JOIN divisions d ON dc.division_id = d.id
JOIN courses   c ON dc.course_id   = c.id
ORDER BY d.display_order;


-- -----------------------------------------------------------------------------
-- Check 3 — Unit topics linked to NC Math 1 (8 rows)
-- Expected: 8 rows with codes EQN, FLF, SYS, EXP, POLY, QUAD, DAS, GEO.TRANS
-- -----------------------------------------------------------------------------
SELECT ut.code,
       ut.name,
       ut.display_order,
       c.code AS course_code
FROM unit_topics ut
JOIN courses c ON ut.course_id = c.id
WHERE c.code = 'NCM1'
ORDER BY ut.display_order;


-- -----------------------------------------------------------------------------
-- Check 4 — Atomic concepts count
-- Expected: 111 rows (full NC Math 1 curriculum from docs/NC_Math_1.json)
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS atomic_concepts_count
FROM atomic_concepts;


-- -----------------------------------------------------------------------------
-- Check 4b — Atomic concepts per unit topic (sanity check)
-- Expected: EQN=19, FLF=18, SYS=12, EXP=13, POLY=11, QUAD=10, DAS=14, GEO.TRANS=14
-- -----------------------------------------------------------------------------
SELECT ut.code, COUNT(ac.id) AS concept_count
FROM unit_topics ut
LEFT JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
JOIN courses c ON ut.course_id = c.id
WHERE c.code = 'NCM1'
GROUP BY ut.code
ORDER BY ut.code;


-- -----------------------------------------------------------------------------
-- Check 5 — Question generators count
-- Expected: 54 rows (matching src/lib/competition/generators.ts GENERATORS)
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS question_generators_count
FROM question_generators;


-- -----------------------------------------------------------------------------
-- Check 5b — Generators with valid concept FK
-- Expected: All 54 rows have a non-null concept_id
-- -----------------------------------------------------------------------------
SELECT COUNT(*) AS generators_with_concept
FROM question_generators
WHERE concept_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- Check 6 — heat_awards table exists
-- Expected: regclass returns 'heat_awards' (not NULL)
-- -----------------------------------------------------------------------------
SELECT to_regclass('public.heat_awards') AS heat_awards;


-- -----------------------------------------------------------------------------
-- Check 6b — division_curricula table exists
-- -----------------------------------------------------------------------------
SELECT to_regclass('public.division_curricula') AS division_curricula;


-- -----------------------------------------------------------------------------
-- Check 7 — heats has the 5 new columns
-- Expected: 5 rows (division_id, is_global, division_code, auto_scheduled, unit_topic_id)
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'heats'
  AND column_name IN ('division_id','is_global','division_code','auto_scheduled','unit_topic_id')
ORDER BY column_name;


-- -----------------------------------------------------------------------------
-- Check 8 — No dangling broadcast_heats policy
-- Expected: 0 rows
-- -----------------------------------------------------------------------------
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (
      COALESCE(qual::text,       '') LIKE '%broadcast_heats%'
   OR COALESCE(with_check::text, '') LIKE '%broadcast_heats%'
  );


-- -----------------------------------------------------------------------------
-- Check 9 — heat_type enum has new values
-- Expected: includes official, practice, sprint, target, championship
-- -----------------------------------------------------------------------------
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'heat_type'
ORDER BY e.enumsortorder;


-- -----------------------------------------------------------------------------
-- Check 10 — heat_status enum has lifecycle values
-- Expected: includes scheduled, open, lobby, countdown, active, in_progress,
--           calculating, complete, finished, cancelled
-- -----------------------------------------------------------------------------
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'heat_status'
ORDER BY e.enumsortorder;


-- -----------------------------------------------------------------------------
-- Check 11 — focus_violation_type enum exists with correct values
-- Expected: tab_switch, window_blur, copy_attempt, fullscreen_exit,
--           devtools_open, paste_attempt
-- -----------------------------------------------------------------------------
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'focus_violation_type'
ORDER BY e.enumsortorder;


-- -----------------------------------------------------------------------------
-- Check 12 — focus_violations column situation
-- Expected: either violation_type is now focus_violation_type, OR
--           event_type column was added with focus_violation_type
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'focus_violations'
  AND column_name IN ('violation_type','event_type')
ORDER BY column_name;


-- -----------------------------------------------------------------------------
-- Check 13 — Course count and code reconciliation
-- Expected: at least one course row with code = 'NCM1'. No M1/NCM1 split
--           unless the legacy M1 had FK refs that prevented deletion.
-- -----------------------------------------------------------------------------
SELECT id, name, code, display_order
FROM courses
ORDER BY display_order, name;


-- -----------------------------------------------------------------------------
-- Check 14 — RLS on the new tables
-- Expected: rowsecurity = true for heat_awards and division_curricula
-- -----------------------------------------------------------------------------
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('heat_awards','division_curricula');


-- -----------------------------------------------------------------------------
-- Check 15 — UNIQUE constraints required by ON CONFLICT clauses
-- Expected: 4 rows
--   atomic_concepts_lesson_number_unique  on atomic_concepts(lesson_number)
--   question_generators_generator_type_unique on question_generators(generator_type)
--   unit_topics_course_code_unique        on unit_topics(course_id, code)
--   courses_code_unique                   on courses(code)
-- (Constraint names may vary if pre-existing — just confirm all 4 exist)
-- -----------------------------------------------------------------------------
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('atomic_concepts','question_generators','unit_topics','courses')
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;


-- =============================================================================
-- END OF VERIFICATION
-- =============================================================================
-- If every check matches its expected result, Sprint 0 is complete and
-- Sprint 1 (Heat Engine rewrite) can begin.
-- =============================================================================
