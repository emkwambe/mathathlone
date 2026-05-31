# CLAUDE CODE PROMPT — Pre-Sprint: Schema Audit

## ROLE
You are building MathAthlone, a real-time competitive math platform (Next.js 14 + Supabase + Tailwind CSS). Before writing any application code, you must audit the actual database schema and document it so all future sprints use verified column names — never guesses.

## REPO
- Location: `C:\Users\HP\Documents\mathathlone-app`
- Supabase project: check `.env.local` for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Database access: Use the Supabase Management API or run SQL via the Supabase CLI. If CLI isn't set up, output the SQL queries for the developer to run manually in Supabase SQL Editor.

## GOAL
Produce `docs/SCHEMA_AUDIT.md` — a comprehensive document of every table, column, type, enum, and RLS policy relevant to the competition flow.

## TASKS

### 1. Read existing docs
Read these files to understand the system:
- `docs/MATHATHLONE_OPEN_PLATFORM_VISION.md`
- `docs/MATHATHLONE_PRICING_STRATEGY.md`
- `supabase/migrations/` — scan all `.sql` files for table definitions

### 2. Generate and run these SQL queries
Output each query and its results into `docs/SCHEMA_AUDIT.md`:

```sql
-- A. Core competition tables
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'heats' ORDER BY ordinal_position;

SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'heat_participations' ORDER BY ordinal_position;

SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'heat_questions' ORDER BY ordinal_position;

SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'question_submissions' ORDER BY ordinal_position;

-- B. User/school tables
SELECT column_name, data_type, udt_name
FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

SELECT column_name, data_type, udt_name
FROM information_schema.columns WHERE table_name = 'schools' ORDER BY ordinal_position;

SELECT column_name, data_type, udt_name
FROM information_schema.columns WHERE table_name = 'topics' ORDER BY ordinal_position;

-- C. Divisions current data
SELECT * FROM divisions ORDER BY display_order;

-- D. All custom enums and their values
SELECT t.typname, e.enumlabel
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;

-- E. RLS policies on competition tables
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('heats', 'heat_participations', 'heat_questions',
  'question_submissions', 'topics', 'static_questions', 'divisions')
ORDER BY tablename, policyname;

-- F. Award/medal tables
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name IN ('medals', 'achievements', 'user_achievements', 'rankings')
ORDER BY table_name, ordinal_position;

-- G. League engine tables
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name IN ('athlete_ratings', 'league_standings', 'brackets', 'bracket_matches')
ORDER BY table_name, ordinal_position;

-- H. Integrity tables
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name IN ('integrity_configs', 'focus_violations', 'teacher_attestations')
ORDER BY table_name, ordinal_position;

-- I. Helper functions
SELECT proname, prosrc FROM pg_proc
WHERE proname IN ('authorize', 'has_role', 'user_school_id', 'set_updated_at');
```

### 3. Document the schema

Format `docs/SCHEMA_AUDIT.md` as:

```markdown
# MathAthlone Schema Audit
**Generated:** [date]

## heats
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| ... | ... | ... | ... |

## heat_participations
...

## Enums
### heat_type
- official
- practice
- sprint
- target
- championship

### heat_status
...

## RLS Policies
### heats
| Policy | Command | Condition |
|--------|---------|-----------|
| ... | SELECT | ... |

## Helper Functions
### authorize(permission)
...
```

### 4. Identify gaps

After documenting the schema, compare against these requirements and note any missing columns or tables:

**heats needs:** `id, code, type, topic_id, depth_min, depth_max, question_count, duration_seconds, status, integrity_level, created_by, school_id, requires_attestation, lockdown_required, synchronized_start_at, is_global, division_code, auto_scheduled, started_at, ended_at, created_at, updated_at`

**heat_participations needs:** `id, heat_id, athlete_id, display_name, division_id, questions_answered, questions_correct, total_points, cta_score, accuracy, avg_time_ms, current_question, status, joined_at, completed_at`

**heat_awards (may not exist yet) needs:** `id, heat_id, athlete_id, division_id, raw_score, accuracy_pct, percentile, award_level, created_at`

Document any gaps as "MISSING — needs migration" in the audit.

### 5. Save the file

Write to: `C:\Users\HP\Documents\mathathlone-app\docs\SCHEMA_AUDIT.md`

Use `[System.IO.File]::WriteAllText()` for BOM-free UTF-8.

## RULES
1. Do NOT write any application code in this sprint — audit only
2. Do NOT modify any database tables — document only
3. If you cannot run SQL directly, output the queries for the developer to run manually and format the results
4. Every column name in SCHEMA_AUDIT.md must come from actual query results, never from assumptions
5. Flag any discrepancy between migration files and actual database state

## SUCCESS CRITERIA
- `docs/SCHEMA_AUDIT.md` exists and contains verified column definitions for all 10+ tables
- All custom enum values are documented
- All RLS policies are documented
- Missing columns/tables are identified with "NEEDS MIGRATION" tags
- The document can be used as the single source of truth for all future sprints
