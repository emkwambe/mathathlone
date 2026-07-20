# MathAthlone — Next Sprint Plan (Post-Pilot Polish & Scaling)

Based on the `MATHATHLONE_HANDOVER_SUMMARY.md` and `FUTURE_SESSIONS_REFERENCE.md`, the core MVP flow (Teacher creates heat → Students join → Competition → Results) is functional and has been piloted. The next phase must bridge the gap between "technical proof of concept" and "production-ready platform," focusing on UX resilience, remaining feature gaps, and preparing for scale.

Here are 3 focused sprints designed to be executed sequentially. Each sprint is scoped to 1-2 sessions and will end with a Session Compass document to ensure perfect handover.

---

## Sprint 1: Production Resilience & UX Polish
**Goal:** Fix the remaining edge cases and UX rough edges discovered during the pilot to ensure a flawless experience for the next wave of users.

### Tasks
1. **Join Window Enforcement:** Update `/compete/page.tsx` and the backend `joinHeat` logic to explicitly reject students trying to join a Heat that has already transitioned out of the `lobby` state (e.g., show "This Heat has already started. Ask your teacher for the next one.") instead of failing silently or showing an infinite spinner.
2. **Session Keep-Alive / Timeout Handling:** Implement a background heartbeat or token refresh strategy so students don't get logged out if they leave the lobby tab open too long. If the session does expire, gracefully redirect to `/auth/login?next=/compete` instead of hanging.
3. **Clean Up Dashboard Links:** Remove the stale `/analytics` and `/class/create` links from the teacher dashboard (`src/app/dashboard/teacher/page.tsx`) that currently return 404s.
4. **Answer Format Hints:** Implement the `ANSWER_TYPE_HINTS` system (e.g., "Enter fractions as 3/4 or mixed numbers as 2 3/4") without leaking the expected answer type (leveraging the new `number_or_fraction` type).
5. **Cosmetic Generator Fixes:** Fix the 4 generators that currently output `1x` or `-1x` instead of `x` or `-x` when the coefficient is ±1.

### Exit Criteria
- Students cannot join an active heat and receive a clear error message.
- Teacher dashboard contains only working links.
- Answer format hints are visible and helpful without spoiling the question type.
- A Session Compass document is generated and saved.

---

## Sprint 2: The League & ELO Engine Wiring
**Goal:** Connect the already-built backend League Engine (`src/lib/league-engine.ts`) to the frontend, replacing mock data with real Supabase queries.

### Tasks
1. **League Routing:** Create the missing `/league/[id]` dynamic route.
2. **Dashboard Wiring:** Update `src/components/league/LeagueDashboard.tsx` to replace `generateMockBracket()`, `generateMockStandings()`, and `generateMockChampionship()` with real calls to the `LeagueEngineService`.
3. **Teacher League Management UI:** Build the UI for teachers to create a new league and assign specific Heats to that league.
4. **Student League View:** Build the UI for students to view their current league standings, bracket position, and ELO rating history.
5. **ELO Verification:** Confirm that the RLS policies allow the `EloEngine` to successfully write rating updates to the `athlete_ratings` table at the end of a Heat.

### Exit Criteria
- The League Dashboard displays real data from the database.
- Teachers can create leagues and students can view their standings.
- A Session Compass document is generated and saved.

---

## Sprint 3: Difficulty Calibration & Assessment Framework Prep
**Goal:** Backfill the new 3-axis difficulty metrics into the database to prepare for the MathPivot assessment framework and ensure Heats pull appropriately scaled questions.

### Tasks
1. **Backfill Script:** Write and execute `scripts/backfill-three-axis.ts` to read the `three_axis` data (cognitive demand, complexity, context) from the curriculum JSON files and UPSERT it into the `question_generators` table.
2. **Question Delivery Tuning:** Update `src/lib/competition/question-delivery.ts` to utilize these new columns. Ensure that "Warm-Up" Heats and "Challenge" Heats pull distinctly different generators based on their complexity/demand profiles.
3. **Validator Cleanup:** Audit the remaining `_or_text` validation types (`decimal_or_text`, `integer_or_text`, etc.) in `src/lib/competition/validation.ts`. Fix routing for any that are actively used by generators, or deprecate them if they are dead code.
4. **Topic Tree Polish:** Fix the issue where some concepts in the Create Heat topic tree show raw IDs (e.g., `M6.NS.4.1`) instead of description text by backfilling the `description` field in the `atomic_concepts` table.

### Exit Criteria
- All `question_generators` have populated `cognitive_demand`, `complexity`, and `context` fields.
- Heat difficulty settings demonstrably affect the types of questions generated.
- The Create Heat topic tree displays human-readable descriptions for all concepts.
- A Session Compass document is generated and saved.

---

## Session Compass Template

*To be filled out at the end of every sprint session.*

```markdown
# MathAthlone — Session Compass & Handover

**Sprint:** [Sprint Name/Number]
**Date:** [Date]

## 1. What Was Built / Fixed
- [Feature/Fix 1]: Brief description of the change and the problem it solved.
- [Feature/Fix 2]: Brief description of the change and the problem it solved.

## 2. Key Files Modified
- `path/to/file1.ts`: [What changed here]
- `path/to/file2.tsx`: [What changed here]

## 3. Database / Schema Changes (if any)
- [Table Name]: [Columns added/modified, or new rows inserted]
- *Reference:* `supabase/migrations/[migration_file].sql`

## 4. Verification Steps Performed
- [Test 1]: [Expected outcome] → ✅ Verified
- [Test 2]: [Expected outcome] → ✅ Verified

## 5. Handover Summary & Next Steps
[2-3 paragraphs summarizing the current state of the platform, any blockers encountered, and the immediate next steps for the following session.]
```
