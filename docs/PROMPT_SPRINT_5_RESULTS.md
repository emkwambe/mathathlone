# CLAUDE CODE PROMPT — Sprint 5: Results + Awards

## READ FIRST (mandatory, in this order)
1. `docs/PROJECT_CONTEXT.md` — MVP flow steps 17-20, competition rulebook (award bands)
2. `docs/SCHEMA_AUDIT.md` — heat_participations, heat_awards, question_submissions columns
3. `docs/LIVE_QUERY_RESULTS.md` — actual column names
4. `src/lib/competition/scoring-service.ts` — calculateHeatResults() (already built in Sprint 1)
5. `src/lib/league-engine.ts` — EloEngine.updateFromHeat()
6. `src/lib/identity-resolver.ts` — resolveIdentity() for name display by level
7. `src/app/compete/[code]/page.tsx` — the 'complete' state placeholder to replace

## CONTEXT

Sprint 4 delivered the competition experience. When a Heat ends:
1. Teacher clicks "End Heat" (or timer expires)
2. heat-service.ts `endHeat()` calls `calculateHeatResults()` from scoring-service.ts
3. Status transitions: active → calculating → complete
4. The `[code]/page.tsx` 'complete' state currently shows a placeholder

scoring-service.ts `calculateHeatResults()` already:
- Calculates CTA scores (content × timing × accuracy)
- Ranks participants by cta_score
- Calculates percentiles
- Applies award bands (participation/<60%, bronze 70-80th, silver 80-90th, gold 90-96th, platinum 96-99th, champion 99-100th)
- Inserts into heat_awards
- Updates heat_participations (cta_score, rank_in_heat, percentile, medal)

This sprint builds the **UI** to display those results.

## SPRINT 5 GOAL

Build results views that replace the 'complete' placeholder:
1. **Student Results** — personal performance + leaderboard position + award
2. **Teacher Results** — class analytics, concept mastery heatmap, individual drill-down

## TASK 1: Student Results Component

Create `src/components/competition/StudentResults.tsx`

### Props
```typescript
interface StudentResultsProps {
  heatId: string;
  participationId: string;
  userId: string;
  integrityLevel: string;
  heatCode: string;
}
```

### Data to load
```typescript
// 1. Own participation (with scores)
const myResult = await supabase
  .from('heat_participations')
  .select('*, users!inner(display_name, school_id, grade_level)')
  .eq('id', participationId)
  .single();

// 2. Own award
const myAward = await supabase
  .from('heat_awards')
  .select('*')
  .eq('heat_id', heatId)
  .eq('athlete_id', userId)
  .single();

// 3. Full leaderboard (all participants ranked)
const leaderboard = await supabase
  .from('heat_participations')
  .select('*, users!inner(display_name, school_id, grade_level), heat_awards!inner(*)')
  .eq('heat_id', heatId)
  .order('rank_in_heat');

// 4. Own submissions (for question-by-question review)
const mySubmissions = await supabase
  .from('question_submissions')
  .select('*, heat_questions!inner(*)')
  .eq('heat_participation_id', participationId)
  .order('heat_questions(question_number)');
```

### Layout — Personal Summary Card
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🏆 GOLD                                           │
│  (large award badge with color)                     │
│                                                     │
│  Amara Osei                                         │
│  #3 of 24 Mathletes · 92nd percentile              │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ CTA      │ │ Accuracy │ │ Time     │            │
│  │ 847      │ │ 85%      │ │ 12:34    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Correct  │ │ Streak   │ │ Points   │            │
│  │ 17/20    │ │ Best: 7  │ │ 2,450    │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Award badge styling
| Award | Background | Border | Icon |
|---|---|---|---|
| Participation | gray-100 | gray-300 | 📜 |
| Bronze | amber-100 | amber-600 | 🥉 |
| Silver | gray-100 | gray-400 | 🥈 |
| Gold | yellow-100 | yellow-500 | 🥇 |
| Platinum | indigo-100 | indigo-400 | 💎 |
| Champion | gradient amber→orange | amber-500 | 🏆 |

### Leaderboard section
```
┌─────────────────────────────────────────────────────┐
│  Leaderboard                                        │
│                                                     │
│  #  Mathlete          CTA    Accuracy  Award        │
│  ─────────────────────────────────────────────      │
│  🥇 Amara O.          912    90%       🏆 Champion │
│  🥈 Jordan C.         847    85%       💎 Platinum  │
│  🥉 Priya S.          823    82%       🥇 Gold     │
│  4  Marcus W.         756    78%       🥈 Silver    │
│  ✦  YOU ARE HERE                                    │
│  5  Yuki T.           701    75%       🥉 Bronze   │
│  ...                                                │
│  24 Tyler W.          312    45%       📜 Particip. │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Highlight the current user's row
- Show top 3 with medal emoji
- If user is not in top 10, show top 5 + "..." + user's row + surrounding 2
- Use identity resolver for name display based on integrity_level

### Question Review section (collapsible)
```
┌─────────────────────────────────────────────────────┐
│  Question Review  [Expand ▼]                        │
│                                                     │
│  Q1 ✓  3x + 7 = 22          Your: 5  ✓  +125      │
│  Q2 ✓  Factor x² - 9        Your: (x+3)(x-3) +100 │
│  Q3 ✗  Slope of 2x + 3y = 6 Your: 2  Ans: -2/3    │
│  Q4 ✓  [SVG graph]          Your: B  ✓  +150       │
│  ...                                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Show each question with student's answer and correct answer
- Green check for correct, red X for wrong
- Points earned per question
- For visual/SVG questions: show the thumbnail or description

## TASK 2: Teacher Results Component

Create `src/components/competition/TeacherResults.tsx`

### Props
```typescript
interface TeacherResultsProps {
  heatId: string;
  heatCode: string;
  integrityLevel: string;
}
```

### Data to load
```typescript
// 1. All participations with user info and awards
const results = await supabase
  .from('heat_participations')
  .select('*, users!inner(display_name, grade_level, school_id)')
  .eq('heat_id', heatId)
  .order('rank_in_heat');

// 2. All awards
const awards = await supabase
  .from('heat_awards')
  .select('*')
  .eq('heat_id', heatId);

// 3. All submissions with question info (for concept analysis)
const submissions = await supabase
  .from('question_submissions')
  .select('*, heat_questions!inner(question_text, correct_answer, answer_type, difficulty, generator_id, question_generators(concept_id, atomic_concepts(name, lesson_number, unit_topics(name))))')
  .in('heat_participation_id', results.data.map(r => r.id));
```

### Layout — Overview Stats
```
┌──────────────────────────────────────────────────────┐
│  Heat MA-7X4K Results                    [Export CSV] │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ 24     │ │ 78%    │ │ 847    │ │ 3:12   │        │
│  │Competed│ │Avg Acc │ │Avg CTA │ │Avg Time│        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                      │
│  Award Distribution                                  │
│  🏆 1  💎 2  🥇 5  🥈 6  🥉 4  📜 6               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Concept Mastery Heatmap
```
┌──────────────────────────────────────────────────────┐
│  Concept Mastery                                     │
│                                                      │
│  Linear equations (1-step)     ████████████ 92%  ✓  │
│  Linear equations (2-step)     ██████████░░ 78%  ⚠  │
│  Solving absolute value        ████████░░░░ 65%  ⚠  │
│  Quadratic factoring           █████░░░░░░░ 45%  ✗  │
│  Exponential growth            ████░░░░░░░░ 38%  ✗  │
│                                                      │
│  ✓ = mastered (80%+)  ⚠ = developing  ✗ = needs work│
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Aggregate submissions by concept (via question_generators → atomic_concepts)
- Calculate accuracy per concept
- Color: green 80%+, amber 60-80%, red <60%
- Sort by accuracy ascending (weakest concepts first — most actionable)

### Full Leaderboard (same as student view but with more columns)
- Rank, Name, Grade, CTA Score, Accuracy, Questions, Time, Award, Flagged
- Clickable rows to drill into individual student performance
- Export CSV button

### Individual Drill-Down (modal or expandable)
When teacher clicks a student row:
- Show that student's question-by-question results
- Time per question
- Which concepts they got wrong

## TASK 3: Wire into [code]/page.tsx

Update the 'complete'/'finished' branch in `src/app/compete/[code]/page.tsx`:
- Teacher → `<TeacherResults heatId={...} heatCode={...} integrityLevel={...} />`
- Student → `<StudentResults heatId={...} participationId={...} userId={...} integrityLevel={...} heatCode={...} />`

## TASK 4: ELO Rating Updates

After results are calculated, update ELO ratings:

In `scoring-service.ts` `calculateHeatResults()` (or create a new post-processing step):
1. Load all participants' current ratings from `athlete_ratings`
2. For each participant, call `EloEngine.updateFromHeat()` from league-engine.ts
3. Update `athlete_ratings` with new rating
4. Insert into `rating_history` for audit trail

If `athlete_ratings` doesn't have a row for a participant yet, create one with defaults (rating: 1200, rd: 350, volatility: 0.06).

Handle gracefully: if league-engine.ts import fails or EloEngine doesn't exist with the right interface, skip ELO updates and log a warning. Don't block results display.

## TASK 5: Share Result Card

After viewing results, students should be able to share:

Create a "Share Result" button that generates a shareable text:
```
🏟️ MathAthlone Result
Amara O. — 🥇 Gold
#3 of 24 Mathletes
CTA: 847 · Accuracy: 85%
NC Math 1 · Equations & Inequalities
Can you beat my score? mathathlone.com/compete
```

Use the Web Share API if available, otherwise copy to clipboard.

## RULES

1. Read docs/PROJECT_CONTEXT.md and docs/SCHEMA_AUDIT.md before any code
2. Use ACTUAL column names: `questions_attempted`, `finished_at`, `accuracy_score`, `ranking_points_earned`, `cta_score`, `percentile`, `rank_in_heat`, `medal`
3. heat_awards columns: `heat_id`, `athlete_id`, `division_id`, `raw_score`, `accuracy_pct`, `percentile`, `award_level`
4. Identity: use `resolveIdentity()` from identity-resolver.ts based on integrity_level
5. "Mathlete" in all user-facing text
6. Complete file replacements for new components
7. `[System.IO.File]::WriteAllText()` for BOM-free UTF-8
8. Tailwind CSS only
9. Handle missing data gracefully (empty results, no submissions, etc.)

## SUCCESS CRITERIA

- [ ] StudentResults.tsx shows personal summary card with award badge
- [ ] Leaderboard with rank, name, CTA, accuracy, award — current user highlighted
- [ ] Question review section (collapsible) with per-question breakdown
- [ ] TeacherResults.tsx shows overview stats + award distribution
- [ ] Concept mastery heatmap showing accuracy per concept
- [ ] Full leaderboard with all columns + CSV export
- [ ] Student drill-down on teacher view
- [ ] ELO ratings updated in athlete_ratings (or graceful skip)
- [ ] Share result button (Web Share API or clipboard)
- [ ] [code]/page.tsx 'complete' state renders correct view per role
- [ ] Mobile responsive
- [ ] Zero new TypeScript errors
- [ ] git commit: "Sprint 5: Results + Awards — leaderboard, concept mastery, ELO, share cards"
