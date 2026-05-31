# CLAUDE CODE PROMPT — Sprint 4: Competition Experience

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — MVP flow steps 14-16, competition rulebook
2. `docs/SCHEMA_AUDIT.md` — heat_questions, question_submissions columns
3. `docs/LIVE_QUERY_RESULTS.md` — actual column names
4. `src/app/compete/[code]/page.tsx` — current lobby page (Sprint 3 — extend the 'active' state)
5. `src/lib/competition/heat-service.ts` — endHeat()
6. `src/lib/competition/heat-realtime.ts` — realtime hooks
7. `src/lib/competition/scoring-service.ts` — scoreSubmission(), calculateHeatResults()
8. `src/lib/competition/validation.ts` — answer validation
9. `src/lib/competition/visual-generators.ts` — SVG question format
10. `src/lib/competition/focus-mode.ts` — FocusMode class
11. `src/components/competition/focus-mode-ui.tsx` — warning overlays

## CONTEXT

Sprint 3 delivered the lobby with countdown. When status transitions to 'active', the page currently shows a placeholder. This sprint replaces that placeholder with the full competition experience.

The heat_questions are already generated and stored in the DB (Sprint 1/2). The student needs to:
1. Fetch questions for this Heat
2. See them one at a time
3. Answer (free-text for generators, MC for static/visual)
4. Get instant feedback
5. See a running timer
6. See their score and streak
7. When timer expires or all questions answered → Heat ends

## SPRINT 4 GOAL

Build the live competition UI inside `/compete/[code]/page.tsx` — the 'active' state shows questions, accepts answers, provides feedback, tracks time, and handles Focus Mode.

## TASK 1: Competition View Component

Create `src/components/competition/CompetitionView.tsx` — the main gameplay component.

### Props
```typescript
interface CompetitionViewProps {
  heatId: string;
  participationId: string;
  durationSeconds: number;
  integrityLevel: string;
  isTeacher: boolean;
}
```

### Data loading
On mount, fetch all questions for this Heat:
```typescript
const { data: questions } = await supabase
  .from('heat_questions')
  .select('*')
  .eq('heat_id', heatId)
  .order('question_number');
```

### Question display
- Show one question at a time
- Question number + total: "Question 3 of 20"
- Points value badge: "100 pts" / "125 pts" / "150 pts" / "175 pts"
- Question text (plain text)
- Question LaTeX rendering (if question_latex exists — use a simple regex-based renderer or dangerouslySetInnerHTML with basic math formatting. Do NOT add KaTeX dependency — keep it simple with superscript/subscript HTML for MVP)
- SVG rendering: if question_text contains `<svg`, render with dangerouslySetInnerHTML
- For visual/static questions: show MC options as clickable buttons (A/B/C/D)
- For generator questions: show free-text input

### Answer submission
When student submits an answer:
1. Call validation logic to check correctness
2. INSERT into `question_submissions` using ACTUAL columns:
   - `heat_participation_id`, `heat_question_id`, `submitted_answer`, `is_correct`, `time_taken_ms`, `attempt_number` (always 1 for competition), `points_earned`
3. Show instant feedback:
   - Correct: green flash, "+100 pts", move to next question after 0.8s
   - Wrong: red flash, show correct answer, move to next after 1.2s
4. Update running score total
5. Track streak (consecutive correct answers)
6. Auto-advance to next question

### Scoring per question
```typescript
const basePoints = question.points_value;  // 100, 125, 150, or 175
const timeBonus = Math.max(0, Math.floor((question.time_limit_seconds * 1000 - timeTakenMs) / 1000));
const pointsEarned = isCorrect ? basePoints + Math.min(timeBonus, 50) : 0;
```

### Timer
- Global countdown timer: starts at `durationSeconds`, counts down to 0
- Displayed as MM:SS in top-right corner
- Changes color: green (>50%), amber (25-50%), red (<25%, pulses)
- When timer hits 0:
  1. Auto-submit current question if answer entered
  2. Mark Heat as complete from student side
  3. Call `endHeat()` ONLY if user is the teacher (students don't end Heats)
  4. Transition to 'calculating' / 'complete' view

### Progress bar
- Visual progress: filled bar showing questions completed / total
- Current score display
- Streak counter: "🔥 3x streak" (resets on wrong answer)

### UI layout
```
┌─────────────────────────────────────────────────┐
│  Q 3/20          Score: 450          ⏱ 12:34   │
│  ████████░░░░░░░░░░░░  (progress)   🔥 3x      │
├─────────────────────────────────────────────────┤
│                                                 │
│  [125 pts]                                      │
│                                                 │
│  Solve for x:                                   │
│  3x + 7 = 22                                    │
│                                                 │
│  ┌─────────────────────────────────┐            │
│  │  Your answer: [          ]  [→] │            │
│  └─────────────────────────────────┘            │
│                                                 │
│  ✓ Correct! +125 pts (+12 time bonus)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

For MC questions:
```
│  Which inequality matches the graph?            │
│                                                 │
│  [SVG graph rendered here]                      │
│                                                 │
│  ┌─────────┐  ┌─────────┐                      │
│  │ A) x > 3│  │ B) x ≤ 3│                      │
│  └─────────┘  └─────────┘                      │
│  ┌─────────┐  ┌─────────┐                      │
│  │ C) x < 3│  │ D) x ≥ 3│                      │
│  └─────────┘  └─────────┘                      │
```

## TASK 2: Focus Mode Integration

Activate Focus Mode based on the Heat's integrity_level:

```typescript
// In CompetitionView, on mount:
if (['school', 'district', 'regional', 'state', 'national'].includes(integrityLevel)) {
  focusMode.start();
}

// District+: request fullscreen
if (['district', 'regional', 'state', 'national'].includes(integrityLevel)) {
  document.documentElement.requestFullscreen?.();
}
```

- Import `FocusMode` from `src/lib/competition/focus-mode.ts`
- Import focus mode UI components from `src/components/competition/focus-mode-ui.tsx`
- Show warning overlay on first violation
- Show penalty timer on second violation
- Flag participant on third violation (update `heat_participations.is_flagged = true`)
- Log violations to `heat_participations.focus_violation_count` (INTEGER — increment)

If focus-mode.ts or focus-mode-ui.tsx have import issues or don't match the current architecture, fix them.

## TASK 3: Teacher Monitoring View

When the teacher views the 'active' state, show a different view:

```
┌─────────────────────────────────────────────────┐
│  🔥 Heat MA-7X4K — LIVE          ⏱ 12:34      │
├─────────────────────────────────────────────────┤
│  Mathletes competing: 24                        │
│                                                 │
│  Live Progress                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Amara O.     ████████████░░░░░  18/20   │   │
│  │ Jordan C.    ██████████░░░░░░░  14/20   │   │
│  │ Priya S.     ████████░░░░░░░░░  12/20   │   │
│  │ ...                                      │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ⚠️ Focus Violations: 2 Mathletes flagged       │
│                                                 │
│  [ End Heat Early ]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Show participant progress in realtime (questions attempted / total)
- Show flagged participants
- "End Heat Early" button calls `endHeat()`
- Teacher does NOT see questions or answers

## TASK 4: Wire into [code]/page.tsx

Update the 'active'/'in_progress' branch in `src/app/compete/[code]/page.tsx`:
- Replace placeholder with `<CompetitionView />` for students
- Replace placeholder with teacher monitoring view for the teacher
- Pass required props: heatId, participationId, durationSeconds, integrityLevel, isTeacher

## TASK 5: End-of-Heat transition

When the Heat ends (timer expires or teacher ends early):
1. Student's CompetitionView shows "Time's up!" overlay
2. All pending answer inputs are disabled
3. Status transitions to 'calculating' (if teacher) or student waits for status change
4. The 'calculating' state shows a spinner: "Calculating results..."
5. Call `calculateHeatResults()` from scoring-service.ts (teacher-side only)
6. After calculation, status → 'complete'
7. 'complete' state shows placeholder for Sprint 5: "Results ready — coming next sprint"

## RULES

1. Read docs/PROJECT_CONTEXT.md and docs/SCHEMA_AUDIT.md before writing any code
2. question_submissions columns: `heat_participation_id`, `heat_question_id`, `submitted_answer`, `is_correct`, `time_taken_ms`, `attempt_number`, `points_earned`
3. heat_participations: `questions_attempted`, `focus_violation_count` (INTEGER), `is_flagged`
4. Do NOT add KaTeX or MathJax dependencies — use simple HTML math rendering for MVP
5. SVG questions: render with dangerouslySetInnerHTML (the SVG is generated server-side and trusted)
6. Complete file for CompetitionView.tsx — do not patch existing files
7. `[System.IO.File]::WriteAllText()` for BOM-free UTF-8
8. User-facing: "Mathlete" not "athlete"
9. Use `createClient()` from `@/lib/supabase/client`

## SUCCESS CRITERIA

- [ ] CompetitionView.tsx renders questions one at a time
- [ ] Free-text input for generator questions, MC buttons for static/visual
- [ ] SVG visual questions render inline
- [ ] Answer submission → instant feedback (green/red) → auto-advance
- [ ] Running score + streak counter
- [ ] Global countdown timer with color changes
- [ ] Progress bar showing questions completed
- [ ] Focus Mode activates at correct integrity levels
- [ ] Teacher sees monitoring view (progress per student, flagged count, End Heat button)
- [ ] Timer expiry → "Time's up!" → transition to calculating/complete
- [ ] question_submissions rows created with correct column names
- [ ] Mobile responsive
- [ ] Zero new TypeScript errors
- [ ] git commit: "Sprint 4: Competition experience — questions, answers, timer, scoring, focus mode"
