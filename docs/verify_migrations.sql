-- =============================================================================
-- MathAthlone: Migration Verification Queries
-- =============================================================================
-- Run after each migration to confirm success. Each block is independent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VERIFY 1: After preflight (000_preflight_rename_legacy.sql)
-- -----------------------------------------------------------------------------
-- Expected: question_generators_legacy exists, question_generators does NOT exist
-- (or exists with new uuid concept_id from a previous run)

SELECT
  EXISTS(SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='question_generators_legacy') AS legacy_exists,
  EXISTS(SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='heat_questions_legacy') AS heat_q_legacy_exists;

-- -----------------------------------------------------------------------------
-- VERIFY 2: After 004 (NC-MATH-1-COMPLETE.sql)
-- -----------------------------------------------------------------------------
-- Expected: 8 new tables, 4 divisions, 4 templates, 1 course, ~40 static questions

SELECT 'courses' AS tbl, COUNT(*) AS rows FROM courses
UNION ALL SELECT 'unit_topics', COUNT(*) FROM unit_topics
UNION ALL SELECT 'atomic_concepts', COUNT(*) FROM atomic_concepts
UNION ALL SELECT 'question_generators', COUNT(*) FROM question_generators
UNION ALL SELECT 'divisions', COUNT(*) FROM divisions
UNION ALL SELECT 'seasons', COUNT(*) FROM seasons
UNION ALL SELECT 'heat_templates', COUNT(*) FROM heat_templates
UNION ALL SELECT 'static_questions', COUNT(*) FROM static_questions
UNION ALL SELECT 'heat_questions', COUNT(*) FROM heat_questions
UNION ALL SELECT 'question_submissions', COUNT(*) FROM question_submissions;

-- Confirm new question_generators schema is correct
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'question_generators'
ORDER BY ordinal_position;

-- -----------------------------------------------------------------------------
-- VERIFY 3: After 003 (003_integrity_system.sql)
-- -----------------------------------------------------------------------------
-- Expected: 5 integrity tables, 6 integrity_configs (practice → national)

SELECT 'integrity_configs' AS tbl, COUNT(*) AS rows FROM integrity_configs
UNION ALL SELECT 'focus_violations', COUNT(*) FROM focus_violations
UNION ALL SELECT 'detected_anomalies', COUNT(*) FROM detected_anomalies
UNION ALL SELECT 'teacher_attestations', COUNT(*) FROM teacher_attestations
UNION ALL SELECT 'qualification_reviews', COUNT(*) FROM qualification_reviews;

-- Confirm all 6 integrity levels seeded
SELECT level, display_name, focus_mode_enabled, lockdown_browser_required
FROM integrity_configs
ORDER BY
  CASE level
    WHEN 'practice' THEN 1
    WHEN 'school' THEN 2
    WHEN 'district' THEN 3
    WHEN 'regional' THEN 4
    WHEN 'state' THEN 5
    WHEN 'national' THEN 6
  END;

-- -----------------------------------------------------------------------------
-- VERIFY 4: Final state — full table inventory
-- -----------------------------------------------------------------------------

SELECT
  table_name,
  CASE
    WHEN table_name LIKE '%_legacy' THEN 'LEGACY (preserved)'
    WHEN table_name IN ('users', 'schools', 'profiles', 'family_members',
                        'parent_links', 'subscriptions', 'classes',
                        'class_enrollments') THEN '01_base'
    WHEN table_name IN ('courses', 'unit_topics', 'atomic_concepts',
                        'question_generators', 'heat_questions',
                        'question_submissions', 'divisions', 'seasons',
                        'leagues', 'league_memberships', 'heat_templates',
                        'static_questions') THEN '04_nc_math_1'
    WHEN table_name IN ('integrity_configs', 'focus_violations',
                        'detected_anomalies', 'teacher_attestations',
                        'qualification_reviews') THEN '03_integrity'
    WHEN table_name IN ('heats', 'heat_participations', 'submissions',
                        'problem_templates', 'topics', 'broadcast_heats',
                        'medals', 'achievements', 'user_achievements',
                        'rankings', 'violations', 'self_reports',
                        'league_heats') THEN 'pre_existing'
    ELSE 'other'
  END AS migration_source
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY migration_source, table_name;
