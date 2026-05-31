# MathAthlone — MVP Blueprint & Sprint Plan

**Version:** 1.0
**Date:** May 31, 2026
**Goal:** One complete Heat flow: Teacher creates → Students join → Questions served → Answers graded → Results + Awards displayed
**Method:** Claude Chat (architect/prompt engineer) → Claude Code (execution) → Eddy (verify + push)

---

## MVP Definition

The MVP is reached when this scenario works end-to-end:

```
1. Teacher logs in at /auth/login
2. Teacher navigates to /compete/create
3. Teacher selects topic, difficulty, integrity level → clicks Create
4. System generates questions (generator + visual + static mix)
5. Heat code displayed (e.g., MA-7X4K)
6. Student logs in, enters code at /compete
7. Student enters lobby, sees other participants
8. Countdown starts → Heat begins
9. Student sees questions one at a time with timer
10. Student submits answers → instant feedback
11. Heat timer expires → Heat closes
12. CTA scores calculated
13. Percentile ranking within division
14. Awards assigned (Participation / Bronze / Silver / Gold / Platinum / Champion)
15. Results page shows leaderboard + individual performance
16. Teacher sees results dashboard
```

**Nothing else matters until this works.**

---

## Pre-Sprint: Schema Audit (Day 0)

Before any code sprint, Claude Code must run these queries and document results. This prevents building against assumed schemas.

```sql
-- Run ALL of these, save output to docs/SCHEMA_AUDIT.md

-- 1. heats columns
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'heats' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. heat_participations columns
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'heat_participations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. heat_questions columns
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'heat_questions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. question_submissions columns
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'question_submissions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. users columns (needed for join flow)
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. topics columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'topics' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. divisions current data
SELECT * FROM divisions ORDER BY display_order;

-- 8. All custom enums
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;

-- 9. All RLS policies on competition tables
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('heats', 'heat_participations', 'heat_questions',
  'question_submissions', 'topics', 'static_questions')
ORDER BY tablename, policyname;

-- 10. medals / achievements tables
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('medals', 'achievements')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

**Output:** `docs/SCHEMA_AUDIT.md` — the source of truth for every sprint.

---

## Sprint 0: Fix Foundations
**Duration:** 1 session
**Goal:** Division alignment + missing schema patches

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S0.1 | Update `divisions` table to match rulebook (5 divisions: Junior 3-4, Intermediate 5-6, Advanced 7-8, JV 9-10, SV 11-12) | `SELECT * FROM divisions` returns 5 rows with correct grade ranges |
| S0.2 | Add missing columns to `heats` if needed (from schema audit) | All columns referenced by code exist |
| S0.3 | Add missing columns to `heat_participations` if needed | All columns referenced by code exist |
| S0.4 | Verify RLS policies allow teacher INSERT on `heats`, `heat_questions` and student INSERT on `heat_participations`, `question_submissions` | Test INSERT for each table with correct role succeeds |
| S0.5 | Create `heat_awards` table for award results | Table exists with: `heat_id, athlete_id, division_id, raw_score, percentile, award_level, created_at` |

### Exit criteria
- All competition tables have verified, documented schemas
- A teacher can INSERT into heats (test via SQL with `auth.uid()` set)
- Division data matches the official rulebook

---

## Sprint 1: Heat Engine Rewrite
**Duration:** 1–2 sessions
**Goal:** Clean `heat-engine.ts` that matches actual schema

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S1.1 | Rewrite `createHeat()` using actual `heats` columns from SCHEMA_AUDIT.md | Teacher creates a Heat, row appears in `heats` table with correct columns |
| S1.2 | Rewrite `generateAndInsertQuestions()` — calls `QuestionService.generateHeatQuestions()` then inserts into `heat_questions` | After Heat creation, `SELECT COUNT(*) FROM heat_questions WHERE heat_id = X` returns the expected question count |
| S1.3 | Integrate visual generators into `QuestionService` — add `source_type: 'visual'` support | `generateHeatQuestions()` returns a mix of generator + static + visual questions |
| S1.4 | Rewrite `joinHeat()` using actual `heat_participations` columns | Student joins Heat, row appears in `heat_participations` |
| S1.5 | Rewrite `submitAnswer()` using actual `question_submissions` columns | Answer submission creates row in `question_submissions` with `is_correct` computed |
| S1.6 | Rewrite status transitions: `open` → `lobby` → `countdown` → `active` → `calculating` → `complete` | Status updates propagate correctly via Supabase realtime |
| S1.7 | Remove EventEmitter pattern, use Supabase Realtime channels only | No `this.emit()` calls remain |

### Exit criteria
- `createHeat()` → row in `heats` + rows in `heat_questions`
- `joinHeat(code)` → row in `heat_participations`
- `submitAnswer()` → row in `question_submissions`
- All methods use columns verified in SCHEMA_AUDIT.md
- Zero TypeScript errors

---

## Sprint 2: Create Heat Page (Final)
**Duration:** 1 session
**Goal:** `/compete/create` creates a fully populated Heat

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S2.1 | Create Heat page calls rewritten `createHeat()` + `generateAndInsertQuestions()` | Clicking "Create Heat" produces a Heat with code + questions in DB |
| S2.2 | After creation, redirect to `/compete/[code]` (teacher lobby view) | Teacher sees lobby with Heat code, participant count, "Start" button |
| S2.3 | Show generated question count + topic + difficulty in lobby | Lobby displays "20 questions ready · Linear Equations · Silver" |

### Exit criteria
- Teacher can create a Heat and land in the lobby
- `heat_questions` table has the correct number of rows
- Questions include a mix of generator and visual types

---

## Sprint 3: Student Join + Lobby
**Duration:** 1 session
**Goal:** Students join via code and see the lobby

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S3.1 | `/compete` page: student enters code → `joinHeat()` → redirects to `/compete/[code]` | Student enters valid code, sees lobby |
| S3.2 | `/compete/[code]` lobby: show participants list (realtime) | When a new student joins, all lobby participants see the list update |
| S3.3 | Teacher "Start Heat" button → status changes to `countdown` → 5s countdown → `active` | All connected clients see countdown and Heat starts simultaneously |
| S3.4 | Non-authenticated users redirected to `/auth/login?next=/compete` | Unauthenticated access is handled gracefully |

### Exit criteria
- 2+ accounts can join the same Heat via code
- Lobby shows realtime participant list
- Teacher starts Heat and all clients transition to competition view

---

## Sprint 4: Competition Experience
**Duration:** 2 sessions
**Goal:** Students see questions, submit answers, get feedback

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S4.1 | Question display component: renders `question_text`, `question_latex`, `question_svg`, and MC options | All three question types render correctly |
| S4.2 | LaTeX rendering: integrate KaTeX or similar for `question_latex` fields | Equations like `3x + 7 = 22` render as formatted math |
| S4.3 | SVG rendering: visual generator questions display inline SVG | Coordinate planes, number lines, scatter plots render in browser |
| S4.4 | Answer submission: free-text input for generators, button selection for MC | Both input types work |
| S4.5 | Answer validation: check against `correct_answer` with tolerance for equivalent forms | `5`, `5.0`, `x = 5`, `x=5` all accepted for answer "5" |
| S4.6 | Instant feedback: correct (green flash + points) / incorrect (red flash + correct answer) | Visual feedback appears for 1 second |
| S4.7 | Timer: countdown based on `duration_seconds`, auto-submit when time expires | Timer visible, Heat auto-closes at 0:00 |
| S4.8 | Progress: current question number, score running total, streak counter | Student sees "Q 7/20 · Score: 450 · 🔥 3x streak" |
| S4.9 | Focus Mode activation based on `integrity_level` | School+ level activates tab detection, District+ adds fullscreen |

### Exit criteria
- Student sees questions one at a time
- All three question types render (text, LaTeX, SVG)
- Answers are validated and scored
- Timer works and auto-closes
- Focus Mode activates at correct integrity levels

---

## Sprint 5: Results + Awards
**Duration:** 1–2 sessions
**Goal:** After Heat ends, display results with awards

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S5.1 | CTA score calculation: Content × Timing × Accuracy composite | Each participant has a `cta_score` in `heat_participations` |
| S5.2 | Eligibility gate: students with <60% accuracy get "Participation" only | Below-threshold students excluded from award ranking |
| S5.3 | Percentile calculation within division | Each eligible student has a percentile rank |
| S5.4 | Award assignment: Bronze (70-80th), Silver (80-90th), Gold (90-96th), Platinum (96-99th), Champion (99-100th) | Awards inserted into `heat_awards` table |
| S5.5 | Results page: leaderboard with rank, name, school, CTA score, award badge | Students see their position and award |
| S5.6 | Individual results: questions answered, accuracy, time analysis, concept breakdown | Student can review their performance |
| S5.7 | Teacher results: class-level view, concept mastery heatmap, flagged students | Teacher sees which concepts need reteaching |
| S5.8 | ELO rating update: call `EloEngine.updateFromHeat()` for each participant | `athlete_ratings` table updated |

### Exit criteria
- Heat ends → CTA scores calculated → percentiles assigned → awards displayed
- Results page shows leaderboard with award badges
- Teacher sees concept-level analytics
- ELO ratings update

---

## Sprint 6: Integration + Polish
**Duration:** 1 session
**Goal:** Connect all systems, handle edge cases

### Tasks

| ID | Task | Quality benchmark |
|---|---|---|
| S6.1 | Identity resolver wired into results (show name + school based on integrity level) | District Heat shows "Amara Osei · Lincoln MS" |
| S6.2 | Landing page: update division names to match rulebook | Junior / Intermediate / Advanced / JV / SV |
| S6.3 | Landing page: add pricing section | Free / Pro / Family / School / District cards |
| S6.4 | Error handling: graceful failures for network issues, auth expiry, no questions | User sees friendly error messages, not blank screens |
| S6.5 | Mobile responsive: compete flow works on phone/tablet | Heat playable on 375px+ viewport |
| S6.6 | Add favicon | No more 404 on favicon.ico |

### Exit criteria
- Full Heat flow works on mobile
- Landing page reflects final division structure and pricing
- No unhandled errors in console during normal flow

---

## Sprint Dependency Chain

```
Pre-Sprint (Schema Audit)
    │
    ▼
Sprint 0 (Fix Foundations)
    │
    ▼
Sprint 1 (Heat Engine Rewrite)
    │
    ├──────────────────┐
    ▼                  ▼
Sprint 2              Sprint 3
(Create Heat)         (Student Join)
    │                  │
    └────────┬─────────┘
             ▼
         Sprint 4
    (Competition Experience)
             │
             ▼
         Sprint 5
      (Results + Awards)
             │
             ▼
         Sprint 6
    (Integration + Polish)
```

---

## Claude Code Prompt Engineering Strategy

Each sprint gets a dedicated prompt that:

1. **Opens with context:** What files exist, what schema is confirmed, what the sprint goal is
2. **Lists tasks with exact file paths and function signatures**
3. **Includes quality benchmarks as testable assertions**
4. **Provides the schema audit data** so Claude Code doesn't guess column names
5. **Forbids assumptions:** "If a column name is uncertain, query the database first"

### Prompt structure template:

```
ROLE: You are building MathAthlone, a competitive math platform.

CONTEXT:
- Repo: C:\Users\HP\Documents\mathathlone-app (Next.js 14, Supabase, Tailwind)
- Supabase URL: [from .env.local]
- SCHEMA_AUDIT.md attached below with verified column names
- Previous sprint completed: [summary]

SPRINT [N] GOAL: [one sentence]

TASKS:
[numbered list with file paths, function signatures, and exact column names]

QUALITY BENCHMARKS:
[testable assertions — "after this task, running X should return Y"]

RULES:
1. Use ONLY column names from SCHEMA_AUDIT.md — never guess
2. Use PowerShell absolute paths for all file operations
3. Use [System.IO.File]::WriteAllText() for BOM-free UTF-8
4. Complete file replacements over patches
5. Test each function against Supabase before declaring done
```

---

## Post-MVP Roadmap (after Sprint 6)

| Phase | Feature | Timeline |
|---|---|---|
| Phase 2 | Global auto-Heats (every 20-30 min) | Week 3-6 post-MVP |
| Phase 2 | Country flags + global leaderboard | Week 3-6 |
| Phase 3 | Family plan + homeschool onboarding | Week 7-10 |
| Phase 3 | Creator affiliate program | Week 7-10 |
| Phase 4 | School license + admin dashboard | Week 11-14 |
| Phase 4 | SSO (Google, Clever) | Week 11-14 |
| Phase 5 | Tournament series | Week 15-20 |
| Phase 5 | Stripe payment integration | Week 15-20 |

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
