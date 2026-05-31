# MathAthlone — Technical Problem Description

**Version:** 1.0
**Date:** May 31, 2026
**Status:** Pre-MVP audit
**Purpose:** Catalog every known issue blocking a functional MVP

---

## Summary

MathAthlone has substantial infrastructure built — database tables, TypeScript engines, React components, and a landing page. However, the system has **never completed a full Heat end-to-end** (teacher creates → students join → questions served → answers submitted → results displayed). Multiple layers of misalignment between code and database, missing flows, and design drift prevent this.

This document catalogs every known issue organized by severity.

---

## CRITICAL — Blocks any Heat from running

### C1. Heat creation schema mismatch (PARTIALLY FIXED)

**Status:** Enum values added (`sprint`, `target`, `championship`, `lobby`, `countdown`, `active`, `finished`). RLS recursion fixed. But `heat-engine.ts` still sends wrong column names.

**File:** `src/lib/competition/heat-engine.ts`
**Problem:** The HeatEngine class (used by `compete/page.tsx` and `compete/[code]/page.tsx`) sends:
- `heat_type` → column is `type`
- `name` → column doesn't exist on `heats`
- `time_limit_minutes` → column is `duration_seconds`
- `status: 'draft'` → enum has no `'draft'` (valid: `scheduled`, `open`, `lobby`, `in_progress`, etc.)
- `max_participants` → column doesn't exist (it's `participant_count`)
- `actual_start` → column is `started_at`

**Impact:** `createHeat()`, `openLobby()`, `startHeat()`, `endHeat()` all fail.

**Fix required:** Rewrite all Supabase queries in `heat-engine.ts` to match actual `heats` table columns.

---

### C2. Student join flow broken

**File:** `src/lib/competition/heat-engine.ts` → `joinHeat()` method
**Problem:** Inserts into `heat_participations` with columns that may not match:
- `display_name` → need to verify column exists
- `questions_answered`, `questions_correct`, `current_question`, `total_points`, `cta_score` → need verification
- Join logic checks `heat.allow_late_join` → column doesn't exist

**Impact:** Students cannot join a Heat even if one is successfully created.

**Fix required:** Audit `heat_participations` columns and align `joinHeat()`.

---

### C3. Question delivery flow broken

**File:** `src/lib/competition/heat-engine.ts` → `generateQuestions()` method
**Problem:**
- Calls `generateQuestion()` from generators but never writes to `heat_questions` table correctly
- `heat_questions` table has `question_latex`, `question_text`, `correct_answer`, `answer_type`, `solution_steps`, `difficulty`, `points_value`, `time_limit_seconds` — need to verify the insert matches
- Static questions from `question-service.ts` query `static_questions` table — this exists and has data
- Visual generators (`visual-generators.ts`) are new and not yet integrated into the question service

**Impact:** Even if a Heat creates successfully, no questions are served to students.

**Fix required:** Wire `question-service.ts` + `visual-generators.ts` into the Heat creation flow, verify `heat_questions` insert schema.

---

### C4. No compete/[code] page flow

**File:** `src/app/compete/[code]/page.tsx`
**Problem:** This page handles the actual competition experience (lobby → countdown → questions → results). It likely uses `heat-engine.ts` methods that are broken (C1). The entire student experience depends on this page working.

**Impact:** No student can compete even if they join successfully.

**Fix required:** Audit this page against actual schema, fix all engine method calls.

---

### C5. Division structure mismatch

**Database:** Current `divisions` table has:
```
Rising Stars (D1): Grades 4-5
Challengers (D2): Grades 6-7
Contenders (D3): Grades 8-9
Varsity (D4): Grades 10-12
```

**Competition Rulebook (final design):**
```
Junior: Grades 3-4
Intermediate: Grades 5-6
Advanced: Grades 7-8
Junior Varsity (JV): Grades 9-10
Senior Varsity (SV): Grades 11-12
```

**Impact:** 5 divisions in the rulebook vs 4 in the database. Grade ranges don't match. Grade 3 is excluded from current DB. The landing page and LeagueDashboard reference the old D1-D4 structure.

**Fix required:** Update `divisions` table to match the official rulebook. Update all UI references.

---

### C6. Award system not implemented

**Rulebook defines:**
- Eligibility gate: ≥60% score required
- Percentile-based awards within division: Bronze (70-80th), Silver (80-90th), Gold (90-96th), Platinum (96-99th), Champion (99-100th)
- Participation Certificate for <60%

**Current state:** No award calculation code exists. The `medals` table exists but may not have the right structure. No percentile calculation. No eligibility gate logic.

**Impact:** Competition results have no awards — defeating the core purpose.

**Fix required:** Build award engine (eligibility check → percentile calculation → award assignment) and results UI.

---

## HIGH — Blocks pilot readiness

### H1. `heat-engine.ts` is a monolith with wrong assumptions

**Lines:** ~740+
**Problems:**
- Uses EventEmitter pattern that doesn't work in Next.js server components
- Realtime subscription logic mixed with CRUD operations
- References non-existent columns throughout
- `HeatType` enum in code doesn't match DB enum
- `HeatStatus` enum in code doesn't match DB enum

**Fix required:** Rewrite as a clean service layer with methods that match the actual DB schema. Separate concerns: CRUD, realtime, scoring.

---

### H2. Results/leaderboard flow doesn't exist

**Current state:** After a Heat ends, there's no:
- CTA score calculation
- Leaderboard generation
- Results page for students
- Results page for teachers
- Award assignment

**Fix required:** Build post-Heat processing: calculate CTA scores → rank participants → assign awards → display results.

---

### H3. `question-service.ts` not integrated with Heat creation

**Problem:** `QuestionService` class exists and can generate mixed question sets (generator + static + visual). But the create-heat page doesn't use it — it just inserts a Heat record with no questions.

**Fix required:** After Heat creation, call `QuestionService.generateHeatQuestions()` → insert results into `heat_questions` table.

---

### H4. Visual generators not wired into question service

**File:** `src/lib/competition/visual-generators.ts` — 12 generators built but `question-service.ts` doesn't import or use them.

**Fix required:** Add visual question type to `UnifiedQuestion`, integrate `VISUAL_GENERATORS` into `generateHeatQuestions()`.

---

### H5. `heat_participations` schema unknown

**Problem:** We never audited this table's actual columns. The `joinHeat()` method inserts specific columns that may not exist.

**Fix required:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'heat_participations'` and align code.

---

## MEDIUM — Needed for quality MVP

### M1. Landing page pricing section missing

**Current state:** Landing page has all sections except pricing. Pricing strategy doc is complete with researched tiers.

**Fix required:** Add pricing cards section (Free / Pro / Family / School / District) to the landing page.

---

### M2. `content.js:18` browser extension error

**Error:** `Cannot destructure property 'isAuthenticated' of 'object null'`
**Source:** A browser extension (`content.js`), NOT app code.
**Impact:** Cosmetic — fills console with red errors but doesn't affect functionality.

**Fix:** Ignore. Can add a note to README about disabling extensions during development.

---

### M3. No favicon

**Error:** `GET /favicon.ico 404`
**Impact:** Cosmetic.

**Fix:** Add a favicon to `public/favicon.ico`.

---

### M4. Global auto-heats not built

**Vision doc defines:** Auto-scheduled Heats every 20-30 minutes, division-matched, country representation.
**Current state:** Only teacher-initiated Heats exist.

**Fix required:** Build cron-based Heat scheduler (Phase 2 — not MVP blocker).

---

### M5. League Engine not connected to Heat results

**Current state:** League tables deployed (brackets, standings, ratings, championship points). But no code triggers standing updates when a Heat completes.

**Fix required:** Wire `LeagueEngineService.processHeatResult()` into post-Heat processing.

---

### M6. Identity resolver not connected to UI

**Current state:** `identity-resolver.ts` exists with `resolveIdentity()` function. `athlete_identity` view exists in DB. But no UI component uses them.

**Fix required:** Wire identity tags into leaderboard, bracket, and results components based on `integrity_level`.

---

## LOW — Polish items

### L1. Landing page division names outdated
Landing page shows Rising Stars/Challengers/Contenders/Varsity. Rulebook defines Junior/Intermediate/Advanced/JV/SV.

### L2. Dashboard uses mock data
`LeagueDashboard.tsx` has hardcoded mock data instead of Supabase queries.

### L3. No Stripe integration
Pricing tiers defined but no payment flow.

### L4. No teacher dashboard analytics
Concept mastery reports, student tracking — referenced on landing page but not built.

### L5. Next.js version outdated
Running 14.2.21, should upgrade to latest 14.x stable.

---

## Schema Verification Needed

The following tables need column audits before any code can be reliably written:

| Table | Why |
|---|---|
| `heat_participations` | `joinHeat()` inserts into it |
| `question_submissions` | `submitAnswer()` inserts into it |
| `medals` | Award system needs it |
| `achievements` | May relate to awards |
| `rankings` | May overlap with `league_standings` |

**Action:** Run column queries on each and document actual schema before Sprint 1.

---

## Summary Table

| ID | Severity | Issue | Blocks |
|---|---|---|---|
| C1 | CRITICAL | heat-engine.ts wrong columns | Heat creation |
| C2 | CRITICAL | Student join flow broken | Student experience |
| C3 | CRITICAL | Question delivery broken | Competition content |
| C4 | CRITICAL | compete/[code] page broken | Live competition |
| C5 | CRITICAL | Division structure mismatch | Fair competition |
| C6 | CRITICAL | Award system missing | Competition purpose |
| H1 | HIGH | heat-engine.ts monolith | All engine operations |
| H2 | HIGH | No results flow | Post-competition |
| H3 | HIGH | Question service not integrated | Question delivery |
| H4 | HIGH | Visual generators not wired | Visual questions |
| H5 | HIGH | heat_participations unknown | Student join |
| M1 | MEDIUM | No pricing on landing page | Conversion |
| M2 | MEDIUM | Browser extension error | Developer confusion |
| M3 | MEDIUM | No favicon | Polish |
| M4 | MEDIUM | No global auto-heats | Open platform vision |
| M5 | MEDIUM | League engine disconnected | League features |
| M6 | MEDIUM | Identity resolver unused | Competition identity |

**Total: 6 CRITICAL, 5 HIGH, 6 MEDIUM, 5 LOW**

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
