# CLAUDE CODE PROMPT — Sprint 0: Fix Foundations

## ROLE
You are building MathAthlone, a real-time competitive math platform (Next.js 14 + Supabase + Tailwind CSS). This sprint fixes the database foundations so all subsequent sprints can build reliably.

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — project overview, tech stack, conventions
2. `docs/SCHEMA_AUDIT.md` — the full schema audit (Section 14 lists 7 needed migrations)
3. `docs/MVP_BLUEPRINT_SPRINTS.md` — Sprint 0 task definitions
4. `docs/NC_Math_1.json` — full curriculum (97 concepts, 8 unit topics)

## CONTEXT
The schema audit (produced by the previous sprint) found critical gaps between migration files and what the MVP needs. The audit was migration-file-derived, NOT live-verified. The live Supabase database at project ref `yhqxxgqfpgcertsqibps` may differ from migration expectations.

**Key findings from the audit:**
- `heat_awards` table does not exist
- `division_curricula` table does not exist
- `heats` table is missing: `division_id`, `is_global`, `division_code`, `auto_scheduled`
- `heat_participations` column names differ from code expectations (see audit Section 1)
- `focus_violations` column type conflict (integer vs JSONB)
- Only 5 of 54 question generators are seeded in the DB
- Only 5 of ~97 atomic concepts are seeded
- `courses` may be seeded with conflicting codes (M1 vs NCM1)
- `violation_type` enum may not accept web-event values
- Dangling RLS policy references `broadcast_heats` (table doesn't exist)
- Migration filename collisions (multiple 006, 007, 008 files exist)
- Division data uses old D1-D4 names, needs updating to Junior/Intermediate/Advanced/JV/SV

## SPRINT 0 GOAL
Fix every database-level blocker so Sprint 1 (Heat Engine rewrite) can safely INSERT/SELECT on all competition tables.

## STEP 1: Live verification (REQUIRED FIRST)

Generate a single SQL file `docs/live_verification.sql` containing ALL queries from SCHEMA_AUDIT.md Section 12 (Queries A1 through O). Output them so the developer can run them in Supabase SQL Editor.

Then STOP and tell the developer:
> "Run docs/live_verification.sql in Supabase SQL Editor. Paste the full output into a file at docs/LIVE_QUERY_RESULTS.md. Then tell me to continue."

**Do NOT proceed to Step 2 until the developer confirms live results are saved.**

## STEP 2: Create fix migrations

Based on the audit findings AND the live verification results, create these migrations. Use `IF NOT EXISTS`, `IF EXISTS`, and `DO $$ ... EXCEPTION` blocks so every migration is safe to run regardless of current DB state.

### Migration 009: Fix violation type enum
File: `supabase/migrations/009_fix_violation_enum.sql`
- Create a new enum `focus_violation_type` with values: `tab_switch`, `window_blur`, `copy_attempt`, `fullscreen_exit`, `devtools_open`, `paste_attempt`
- ALTER `focus_violations.violation_type` to use the new enum (or add a new column if the existing one can't be altered)
- Keep the old `violation_type` enum for `detected_anomalies` if it uses it

### Migration 010: Fix heats table
File: `supabase/migrations/010_fix_heats.sql`
- ADD COLUMN IF NOT EXISTS `division_id UUID REFERENCES divisions(id)`
- ADD COLUMN IF NOT EXISTS `is_global BOOLEAN DEFAULT false`
- ADD COLUMN IF NOT EXISTS `division_code TEXT`
- ADD COLUMN IF NOT EXISTS `auto_scheduled BOOLEAN DEFAULT false`
- ADD COLUMN IF NOT EXISTS `unit_topic_id UUID` (FK to unit_topics — replaces topic_id for new code)
- Keep `topic_id` for backward compatibility but add `unit_topic_id` as the forward path
- Drop the dangling RLS policy "Read public broadcast heats" IF the `broadcast_heats` table does not exist
- Add heat_type enum values if missing: `sprint`, `target`, `championship`
- Add heat_status enum values if missing: `lobby`, `countdown`, `active`, `finished`
- Create indexes: `idx_heats_global_lobby` on `(division_code, status, scheduled_at) WHERE is_global = true`

### Migration 011: Create heat_awards
File: `supabase/migrations/011_heat_awards.sql`
- CREATE TABLE `heat_awards`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `heat_id UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE`
  - `athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `division_id UUID REFERENCES divisions(id)`
  - `raw_score DECIMAL(10,2)`
  - `accuracy_pct DECIMAL(5,2)`
  - `percentile DECIMAL(5,2)`
  - `award_level TEXT NOT NULL` — values: 'participation', 'bronze', 'silver', 'gold', 'platinum', 'champion'
  - `created_at TIMESTAMPTZ DEFAULT now()`
  - UNIQUE(heat_id, athlete_id)
- Enable RLS, add public SELECT policy
- Create indexes on (heat_id, award_level) and (athlete_id)

### Migration 012: Create division_curricula
File: `supabase/migrations/012_division_curricula.sql`
- CREATE TABLE `division_curricula`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE`
  - `course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE`
  - `created_at TIMESTAMPTZ DEFAULT now()`
  - UNIQUE(division_id, course_id)
- Enable RLS, add public SELECT policy

### Migration 013: Update divisions + seed division_curricula
File: `supabase/migrations/013_update_divisions.sql`
- DELETE all existing division rows
- INSERT 5 new divisions matching the official rulebook:
  - Junior (JR): grades 3-4
  - Intermediate (INT): grades 5-6
  - Advanced (ADV): grades 7-8
  - Junior Varsity (JV): grades 9-10
  - Senior Varsity (SV): grades 11-12
- Look up the NC Math 1 course ID (from `courses` table)
- INSERT into `division_curricula`: Advanced → NC Math 1, JV → NC Math 1, SV → NC Math 1
- Handle the case where `league_memberships` or other tables have FK refs to divisions by using ON DELETE CASCADE or checking first

### Migration 014: Full curriculum seed
File: `supabase/migrations/014_full_curriculum_seed.sql`
- Read `docs/NC_Math_1.json` and ensure ALL 97 atomic concepts exist in `atomic_concepts`
- Ensure all 8 unit topics exist in `unit_topics` and are linked to the NC Math 1 course
- Fix the courses code conflict: ensure only ONE course record for NC Math 1 exists with code 'NCM1'
- For each of the 54 generator types in `src/lib/competition/generators.ts`, ensure a row exists in `question_generators` linked to the correct `atomic_concept`
- Use ON CONFLICT DO NOTHING for all INSERTs so this is re-runnable
- At the end, output counts: `RAISE NOTICE` with courses, unit_topics, atomic_concepts, question_generators, static_questions

### Migration 015: Drop dangling policy
File: `supabase/migrations/015_cleanup.sql`
- Drop RLS policy "Read public broadcast heats" on `heats` IF EXISTS
- Fix `focus_violations.focus_violations` column type if it's integer (should be JSONB or a separate counter)
- Any other cleanup items identified during live verification

## STEP 3: Verify

After ALL migrations are created, generate a verification script `docs/sprint0_verification.sql`:

```sql
-- Run after all Sprint 0 migrations
-- Every query should return the expected result

-- 1. Divisions (5 rows)
SELECT name, code, grade_min, grade_max FROM divisions ORDER BY grade_min;

-- 2. Division curricula (3 rows: ADV, JV, SV → NC Math 1)
SELECT d.name, c.name FROM division_curricula dc
JOIN divisions d ON dc.division_id = d.id
JOIN courses c ON dc.course_id = c.id;

-- 3. Unit topics (8 rows linked to NC Math 1)
SELECT ut.name, c.name FROM unit_topics ut
JOIN courses c ON ut.course_id = c.id;

-- 4. Atomic concepts count (97)
SELECT COUNT(*) FROM atomic_concepts;

-- 5. Question generators count (54+)
SELECT COUNT(*) FROM question_generators;

-- 6. heat_awards table exists
SELECT to_regclass('public.heat_awards');

-- 7. heats has division_id column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'heats' AND column_name = 'division_id';

-- 8. No dangling broadcast_heats policy
SELECT policyname FROM pg_policies
WHERE tablename = 'heats' AND policyname = 'Read public broadcast heats';
-- Should return 0 rows
```

## RULES
1. Read `docs/SCHEMA_AUDIT.md` completely before writing any SQL
2. Every migration must be idempotent (safe to run multiple times)
3. Use `IF NOT EXISTS`, `IF EXISTS`, `DO $$ EXCEPTION` blocks everywhere
4. Never DROP a table without checking for FK references first
5. Never assume a column exists — verify from the audit or live results
6. Use `[System.IO.File]::WriteAllText()` for BOM-free UTF-8 file writes
7. All files go in `supabase/migrations/` with sequential numbering starting at 009
8. Do NOT modify any TypeScript/React code in this sprint — schema only
9. Match the actual column names from the LIVE verification, not from migration expectations

## SUCCESS CRITERIA
- [ ] `docs/live_verification.sql` created and developer ran it
- [ ] `docs/LIVE_QUERY_RESULTS.md` saved with actual DB state
- [ ] 7 migration files created (009–015)
- [ ] All migrations are idempotent
- [ ] `docs/sprint0_verification.sql` created
- [ ] Developer ran verification and all checks pass
- [ ] git commit with message: "Sprint 0: Fix foundations — divisions, curriculum seed, heat_awards, division_curricula, cleanup"

## WHAT COMES NEXT
After Sprint 0, the architect (Claude Chat) generates the Sprint 1 prompt: Heat Engine rewrite. Sprint 1 will rewrite `src/lib/competition/heat-engine.ts` using ONLY column names confirmed by the live verification + Sprint 0 migrations.
