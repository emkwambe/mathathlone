# CLAUDE CODE PROMPT — Sprint 1: Heat Engine Rewrite

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — project overview, conventions, MVP definition
2. `docs/SCHEMA_AUDIT.md` — Section 1 (heats, heat_participations, heat_questions, question_submissions columns)
3. `docs/LIVE_QUERY_RESULTS.md` — actual live column names (these override SCHEMA_AUDIT migration-derived expectations)
4. `src/lib/competition/heat-engine.ts` — the file you are rewriting
5. `src/lib/competition/question-service.ts` — question generation service to integrate
6. `src/lib/competition/generators.ts` — read the GENERATORS export keys
7. `src/lib/competition/visual-generators.ts` — read the VISUAL_GENERATORS export keys
8. `src/lib/competition/validation.ts` — answer validation
9. `src/lib/supabase/client.ts` — how the Supabase client is exported

## CONTEXT

Sprint 0 is complete. The database now has:
- 5 divisions (JR, INT, ADV, JV, SV) with division_curricula linking ADV/JV/SV → NC Math 1
- 8 unit_topics, 111 atomic_concepts, 54 question_generators seeded
- heats table has new columns: division_id, unit_topic_id, is_global, division_code, auto_scheduled
- heat_awards table exists
- heat_participations uses these ACTUAL column names (from live verification):
  - `questions_attempted` (NOT questions_answered)
  - `finished_at` (NOT completed_at)
  - `total_time_ms` (NOT avg_time_ms)
  - `accuracy_score` (NOT accuracy)
  - `ranking_points_earned` (NOT total_points)
  - `focus_violations` is INTEGER (NOT JSONB)
  - NO `display_name` column — use JOIN to users.display_name
  - NO `current_question` column
  - NO `division_id` column on heat_participations
  - Has: cta_score, percentile, rank_in_heat, medal (medal_type enum), content_score, time_score

## SPRINT 1 GOAL

Rewrite `src/lib/competition/heat-engine.ts` as a clean service that matches the actual database schema. Every Supabase query must use verified column names. Integrate the question service for question generation.

## ARCHITECTURE

Split the monolithic heat-engine.ts into focused modules:

```
src/lib/competition/
├── heat-service.ts        ← NEW: CRUD operations (create, join, start, end)
├── question-delivery.ts   ← NEW: generate + insert questions for a Heat
├── scoring-service.ts     ← NEW: CTA scoring + award calculation
├── heat-realtime.ts       ← NEW: Supabase Realtime subscriptions
├── question-service.ts    ← EXISTS: modify to integrate visual generators
├── generators.ts          ← EXISTS: no changes
├── visual-generators.ts   ← EXISTS: no changes
├── validation.ts          ← EXISTS: no changes
├── focus-mode.ts          ← EXISTS: no changes
├── heat-engine.ts         ← KEEP as thin wrapper re-exporting from new modules
└── index.ts               ← UPDATE barrel exports
```

## TASK 1: heat-service.ts

Create `src/lib/competition/heat-service.ts` with these functions:

### createHeat()
```typescript
interface CreateHeatParams {
  division_id: string;
  unit_topic_id: string | null;  // null = "Mixed" (all topics)
  depth_min: number;             // 1-4 (Bronze=1, Silver=2, Gold=3, Platinum=4)
  depth_max: number;
  type: 'official' | 'practice' | 'sprint' | 'target' | 'championship';
  integrity_level: 'practice' | 'school' | 'district' | 'regional' | 'state' | 'national';
  question_count: number;
  duration_seconds: number;
  school_id?: string;
}
```

INSERT into `heats` using ONLY these verified columns:
- id, code, topic_id (set to first available topic from unit_topic's parent topic — or handle NULL), 
- division_id (NEW), unit_topic_id (NEW),
- depth_min, depth_max, type, scope (default 'class'),
- class_id, school_id, created_by, status (set to 'lobby'),
- integrity_level, requires_attestation, lockdown_required, synchronized_start_at,
- question_count, duration_seconds

Generate a unique 6-char code (MA + 4 alphanumeric). Retry on collision.

After INSERT, call `generateAndInsertQuestions()` from question-delivery.ts.

Return the created Heat with code.

**Quality benchmark:** After calling createHeat(), `SELECT * FROM heats WHERE code = 'MAXXXX'` returns 1 row with correct columns AND `SELECT COUNT(*) FROM heat_questions WHERE heat_id = X` returns the expected question_count.

### joinHeat(code)
```typescript
async function joinHeat(code: string): Promise<HeatParticipation>
```

1. Look up Heat by code: `SELECT * FROM heats WHERE code = $1`
2. Verify status is 'lobby' or 'open'
3. Get current user via `supabase.auth.getUser()`
4. INSERT into `heat_participations` using ACTUAL columns:
   - heat_id, athlete_id, status ('queued'), joined_at (now())
   - All other columns use their defaults (0 for counters, null for scores)
5. Increment heats.participant_count
6. Return the participation record

**Quality benchmark:** After joinHeat(), `SELECT * FROM heat_participations WHERE heat_id = X AND athlete_id = Y` returns 1 row.

### startHeat(heatId)
Update heats status: 'lobby' → 'countdown' (wait 5s) → 'active'
Set started_at to now().

### endHeat(heatId)
Update heats status → 'calculating'
Set ended_at to now().
Call scoring service to calculate results.
Then update status → 'complete'.

**Quality benchmark:** Status transitions work: lobby → countdown → active → calculating → complete.

## TASK 2: question-delivery.ts

Create `src/lib/competition/question-delivery.ts`:

### generateAndInsertQuestions()
```typescript
async function generateAndInsertQuestions(
  supabase: SupabaseClient,
  heatId: string,
  unitTopicId: string | null,  // null = mixed
  depthMin: number,
  depthMax: number,
  questionCount: number
): Promise<void>
```

1. Load atomic_concepts for the unit_topic (or all topics if mixed)
2. Load question_generators linked to those concepts
3. For each question slot:
   - Pick a generator (avoid repeats where possible)
   - Pick a difficulty between depthMin and depthMax
   - Call `generateQuestion(generatorType, difficulty)` from generators.ts
   - Randomly include visual generator questions (~20% of total)
   - Call `generateVisualQuestion(key)` from visual-generators.ts for those
4. INSERT all into `heat_questions` using ACTUAL columns:
   - heat_id, question_number, generator_id (from question_generators table),
   - difficulty, question_latex, question_text, correct_answer, answer_type,
   - solution_steps (JSONB), points_value (100 + (difficulty-1)*25),
   - time_limit_seconds (60 + difficulty*15)
5. For visual questions, put the SVG in question_text and a description in question_latex

**Quality benchmark:** After calling this, `SELECT COUNT(*) FROM heat_questions WHERE heat_id = X` equals questionCount. Questions have varied difficulties and generator types.

## TASK 3: scoring-service.ts

Create `src/lib/competition/scoring-service.ts`:

### calculateHeatResults()
```typescript
async function calculateHeatResults(
  supabase: SupabaseClient,
  heatId: string
): Promise<void>
```

1. Load all participations for the Heat
2. Load all submissions for each participation
3. Calculate per-participant:
   - `questions_attempted`: count of submissions
   - `questions_correct`: count where is_correct = true
   - `content_score`: (correct / attempted) * 100
   - `time_score`: based on total_time_ms vs duration_seconds
   - `accuracy_score`: first_touch_correct / questions_attempted
   - `cta_score`: content_score * 0.4 + time_score * 0.3 + accuracy_score * 0.3
4. UPDATE heat_participations with calculated scores
5. Rank participants by cta_score DESC → set rank_in_heat
6. Calculate percentile: ((total - rank) / total) * 100
7. Apply award logic (from competition rulebook):
   - accuracy < 60% → award_level = 'participation'
   - 70-80th percentile → 'bronze'
   - 80-90th → 'silver'
   - 90-96th → 'gold'
   - 96-99th → 'platinum'
   - 99-100th → 'champion'
8. INSERT into heat_awards for each participant
9. UPDATE heat_participations.medal using the medal_type enum

**Quality benchmark:** After calling this, every participation has non-null cta_score, rank_in_heat, percentile. heat_awards has one row per participant.

## TASK 4: question-service.ts updates

Modify `src/lib/competition/question-service.ts`:
- Import and integrate `VISUAL_GENERATORS` from visual-generators.ts
- Add `source_type: 'visual'` to UnifiedQuestion
- When `static_ratio` is set, include visual questions as part of the non-static portion
- Add `question_svg` field to UnifiedQuestion interface

## TASK 5: heat-realtime.ts

Create `src/lib/competition/heat-realtime.ts`:
- Subscribe to heat status changes via Supabase Realtime
- Subscribe to new participants joining
- Subscribe to submission events
- Export clean hooks: `useHeatRealtime(heatId)`, `useHeatParticipants(heatId)`
- Use Supabase channels, NOT EventEmitter

## TASK 6: heat-engine.ts (thin wrapper)

Rewrite `src/lib/competition/heat-engine.ts` to be a thin re-export:
```typescript
export { createHeat, joinHeat, startHeat, endHeat } from './heat-service';
export { generateAndInsertQuestions } from './question-delivery';
export { calculateHeatResults } from './scoring-service';
export { useHeatRealtime, useHeatParticipants } from './heat-realtime';
```

Keep `createHeatEngine()` as a factory function for backward compatibility with existing pages.

## TASK 7: Update index.ts barrel

Update `src/lib/competition/index.ts` to export all new modules.

## RULES

1. **ONLY use column names confirmed in docs/LIVE_QUERY_RESULTS.md and docs/SCHEMA_AUDIT.md**
2. heat_participations columns: `questions_attempted`, `finished_at`, `total_time_ms`, `accuracy_score`, `ranking_points_earned`, `focus_violations` (INTEGER)
3. heats columns: `division_id`, `unit_topic_id`, `type`, `status`, `duration_seconds`, `depth_min`, `depth_max`
4. No `display_name` on heat_participations — JOIN to users.display_name when needed
5. No `current_question` on heat_participations — track in client state
6. Use `createClient()` from `@/lib/supabase/client` for browser-side code
7. Use `[System.IO.File]::WriteAllText()` for BOM-free UTF-8
8. Complete file replacements, never patches
9. Zero TypeScript errors when finished
10. User-facing copy: "Mathlete" not "athlete" (DB role stays 'athlete')

## SUCCESS CRITERIA

- [ ] `heat-service.ts` — createHeat, joinHeat, startHeat, endHeat all use verified column names
- [ ] `question-delivery.ts` — generates and inserts questions mixing generators + visual + static
- [ ] `scoring-service.ts` — CTA scoring + percentile ranking + award assignment
- [ ] `heat-realtime.ts` — Supabase Realtime subscriptions (no EventEmitter)
- [ ] `question-service.ts` — visual generators integrated
- [ ] `heat-engine.ts` — thin wrapper with backward-compatible factory
- [ ] `index.ts` — all new modules exported
- [ ] Zero TypeScript errors: `npx tsc --noEmit` passes (or only pre-existing errors)
- [ ] git commit with message: "Sprint 1: Heat Engine rewrite — service layer matching actual schema"

## WHAT COMES NEXT
Sprint 2: Create Heat page UI with division-first drill-down flow.
Sprint 3: Student join + lobby.
Sprint 4: Live competition experience.
