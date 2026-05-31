# CLAUDE CODE PROMPT — Sprint 2: Create Heat Page (Division-First)

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — MVP definition (20-step flow), naming conventions
2. `docs/SCHEMA_AUDIT.md` — heats columns, enums
3. `docs/LIVE_QUERY_RESULTS.md` — actual live column names
4. `src/lib/competition/heat-service.ts` — the createHeat() function from Sprint 1
5. `src/lib/competition/question-delivery.ts` — generateAndInsertQuestions()
6. `src/app/compete/create/page.tsx` — current create-heat page (to be REWRITTEN)
7. `src/contexts/AuthContext.tsx` — useAuth() hook, useRequireAuth()

## CONTEXT

Sprint 1 delivered a clean service layer. `createHeat()` in heat-service.ts accepts `division_id`, `unit_topic_id`, `depth_min`, `depth_max`, `type`, `integrity_level`, `question_count`, `duration_seconds`. After creating the Heat, it calls `generateAndInsertQuestions()` which inserts questions into `heat_questions`.

The current `create/page.tsx` is broken — it queries the legacy `topics` table and sends wrong column names. It must be fully replaced.

## SPRINT 2 GOAL

Build a beautiful, functional Create Heat page with a **division-first drill-down flow**:

```
Step 1: Pick DIVISION (5 cards — 3 active, 2 greyed "Coming soon")
Step 2: COURSE auto-loads (MVP: only "NC Math 1" appears)
Step 3: Pick UNIT TOPIC (8 topics + "Mixed" option)
Step 4: Pick DIFFICULTY (Bronze / Silver / Gold / Platinum)
Step 5: Pick HEAT PRESET (Sprint / Target / Practice / Championship)
Step 6: Pick INTEGRITY LEVEL (Practice → National, 6 levels)
Step 7: Review summary → Click "Create Heat 🔥"
Step 8: Redirect to /compete/[code] (lobby)
```

## TASK 1: Rewrite src/app/compete/create/page.tsx

### Requirements

1. **Must be a 'use client' component** — uses hooks and Supabase client
2. **Protect the route** — only teachers can create Heats. Use `useRequireAuth()` or check `hasRole('teacher')` from AuthContext. If not authenticated or not a teacher, redirect to login.
3. **Division picker (Step 1)**
   - Query `divisions` table: `SELECT id, name, code, grade_min, grade_max FROM divisions ORDER BY grade_min`
   - Query `division_curricula` with JOIN to check which divisions have courses: `SELECT dc.division_id FROM division_curricula dc`
   - Display 5 cards in a grid. Divisions WITH linked courses are clickable. Divisions WITHOUT are greyed with "Coming soon" badge.
   - Default selection: JV (grades 9-10)
   - Each card shows: division name, grade range, icon

4. **Course display (Step 2)**
   - After division selected, query: `SELECT c.id, c.name, c.code FROM division_curricula dc JOIN courses c ON dc.course_id = c.id WHERE dc.division_id = $1`
   - If only 1 course, auto-select it and skip to Step 3
   - If multiple courses (future), show course picker

5. **Unit Topic picker (Step 3)**
   - Query: `SELECT id, name, code FROM unit_topics WHERE course_id = $1 ORDER BY display_order`
   - Display as pill buttons + a "Mixed" button
   - "Mixed" passes null to createHeat (pulls from all topics)
   - Show unit topic names from DB: "Equations & Inequalities", "Functions & Linear Functions", etc.

6. **Difficulty picker (Step 4)**
   - 4 cards: Bronze (depth 1-2), Silver (depth 2-3), Gold (depth 3-4), Platinum (depth 4-4)
   - Each with a color accent matching the award tiers
   - Default: Silver

7. **Heat preset picker (Step 5)**
   - 4 cards: Sprint (15min/20Q), Target (20min/10Q), Practice (30min/15Q), Championship (25min/25Q)
   - Allow custom override of question_count (5-50) and duration_minutes (5-60)
   - Show as icon + label + description

8. **Integrity level picker (Step 6)**
   - 6 rows: Practice → School → District → Regional → State → National
   - Each row shows: icon, label, description, active enforcement badges
   - Enforcement badges: Focus Mode, Fullscreen, Copy Block, Anomaly Detection, Attestation, Lockdown, Recording
   - Default: Practice

9. **Summary panel (Step 7)**
   - Shows: Division name, Course name, Unit Topic (or "Mixed"), Difficulty, Preset, Integrity level, Question count, Duration
   - Active integrity badges displayed
   - "Create Heat 🔥" button

10. **Create flow (Step 8)**
    - Call `createHeat()` from heat-service.ts with all parameters
    - Show loading spinner during creation
    - On success: redirect to `/compete/${heat.code}`
    - On error: show error message in a red alert box

### Design requirements

- Use Tailwind CSS only (no external UI libraries except lucide-react for icons)
- Responsive: works on desktop and tablet (768px+)
- Clean, professional look matching the landing page style
- Progress indicator showing which step the teacher is on
- Smooth transitions between steps
- User-facing text: "Mathlete" not "athlete"
- Error states: show friendly messages, not raw error objects

### Data flow

```typescript
import { createClient } from '@/lib/supabase/client';
import { createHeat } from '@/lib/competition/heat-service';

// In the create handler:
const supabase = createClient();
const heat = await createHeat(supabase, {
  division_id: selectedDivision.id,
  unit_topic_id: selectedTopic?.id || null,  // null for "Mixed"
  depth_min: difficultyTier.depthMin,
  depth_max: difficultyTier.depthMax,
  type: heatPreset,                          // 'sprint' | 'target' | 'practice' | 'championship'
  integrity_level: selectedIntegrity,
  question_count: questionCount,
  duration_seconds: durationMinutes * 60,
  school_id: user.school_id,
});

router.push(`/compete/${heat.code}`);
```

## TASK 2: Verify createHeat() accepts these params

Read `src/lib/competition/heat-service.ts` and confirm `createHeat()` accepts the params the page sends. If the interface doesn't match (e.g., missing fields, different param names), update heat-service.ts to match. Do NOT change the page to match a broken service — fix the service.

Key checks:
- Does createHeat accept `division_id`?
- Does it accept `unit_topic_id`?
- Does it handle the legacy `topic_id` NOT NULL constraint? (heats.topic_id is NOT NULL FK to topics — if unit_topic_id is used, topic_id still needs a valid value)
- Does it call `generateAndInsertQuestions()` after creating the Heat?

## TASK 3: Handle the topic_id legacy constraint

The `heats.topic_id` column is `NOT NULL` with a FK to the legacy `topics` table. The new flow uses `unit_topic_id` instead. Two options:

**Option A (preferred):** Make `topic_id` nullable:
```sql
ALTER TABLE heats ALTER COLUMN topic_id DROP NOT NULL;
```
Output this as a note for the developer to run, or create `supabase/migrations/016_topic_id_nullable.sql`.

**Option B:** Map unit_topic to a legacy topic row. Less clean but no schema change needed.

Choose Option A and create the migration file.

## RULES

1. Read docs/PROJECT_CONTEXT.md and docs/SCHEMA_AUDIT.md before writing any code
2. Only use column names from LIVE_QUERY_RESULTS.md
3. Use `createClient()` from `@/lib/supabase/client` (not `supabase` singleton)
4. Use `useAuth()` from `@/contexts/AuthContext` for auth checks
5. Complete file replacement for create/page.tsx — do not patch
6. All user-facing text: "Mathlete" not "athlete"
7. Tailwind CSS only — no inline styles, no CSS modules
8. `[System.IO.File]::WriteAllText()` for BOM-free UTF-8

## SUCCESS CRITERIA

- [ ] Create Heat page loads with 5 division cards (3 active, 2 greyed)
- [ ] Selecting a division loads its courses → auto-selects if only one
- [ ] Unit topics load from DB, "Mixed" option available
- [ ] Difficulty, preset, and integrity pickers all functional
- [ ] Summary panel shows all selections
- [ ] Clicking "Create Heat" calls createHeat() from heat-service.ts
- [ ] Questions are generated and inserted into heat_questions
- [ ] Redirects to /compete/[code] on success
- [ ] Non-teachers are redirected to login
- [ ] `016_topic_id_nullable.sql` migration created
- [ ] Zero TypeScript errors from this sprint's files
- [ ] git commit: "Sprint 2: Create Heat page — division-first drill-down with curriculum filtering"
