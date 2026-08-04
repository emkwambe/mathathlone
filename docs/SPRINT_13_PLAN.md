# Sprint 13 Plan: Grade-Cohort Ranking & Advancement

## 1. The Core Philosophy

The MathAthlone ranking system is being updated to reflect a fundamental pedagogical principle: **a student's standing, recognition, and advancement are always measured against their grade-level peers and higher.** 

Competing in prior-grade material (especially at the start of the school year) is a valid, ranked event—but the ranking is computed among the student's grade-level cohort, not the cohort of the material. A Grade 8 student completing a heat on Grade 7 material is ranked against other Grade 8 students. They are never ranked below a Grade 7 student on their home leaderboard. 

Advancing to a higher division is earned by **individual performance** (excelling beyond grade level), not by waiting for classmates to catch up.

---

## 2. The Data Model Change: Content vs. Ranking Division

Currently, the `heats` table has a single `division_id` column. This conflates the material being tested with the cohort being ranked. In Sprint 13, we split this into two independent columns:

| Column | Meaning | Impact |
|---|---|---|
| `content_division_id` | The division whose curriculum the questions are drawn from (e.g., Grade 7 material). | Used exclusively by the question assembler. |
| `ranking_division_id` | The division whose ELO pool and standings receive the results (e.g., Grade 8 cohort). | Used exclusively by the scoring service and leaderboards. |

When a Grade 8 teacher creates a heat using Grade 7 material at the start of the year:
- `content_division_id` = INT (Grade 7)
- `ranking_division_id` = ADV (Grade 8)

The scoring service (`src/lib/competition/scoring-service.ts`) will write ELO to `athlete_ratings` where `division_id = ranking_division_id`. The students are ranked against their Grade 8 peers. The heat counts fully toward their Grade 8 season record.

---

## 3. The Three-Layer Eligibility Model

This schema change supports a clean three-layer progression system for every student:

### Layer 1: The Practice Pool (Prior Grade)
- **What it is:** Material from the grade immediately below the student's enrolled grade.
- **When it is used:** Heavily at the start of the school year before current-grade topics are covered.
- **How it ranks:** The heat is run with `content_division_id` = Prior Grade, but `ranking_division_id` = Home Grade. The student earns ELO in their home division.

### Layer 2: The Home Division (Current Grade)
- **What it is:** Material from the student's currently enrolled grade.
- **When it is used:** Throughout the year as the teacher covers new topics.
- **How it ranks:** `content_division_id` and `ranking_division_id` are identical.

### Layer 3: The Advancement Pool (Above Grade Level)
- **What it is:** Material from the grade above the student's enrolled grade.
- **When it is used:** When a student demonstrates mastery of their home division.
- **How it works:** A student who excels (e.g., reaches the top 10% ELO in their home division) earns an "Advancement Eligible" badge. The teacher unlocks the higher division for them. When competing in the higher division, they start with a fresh 1200 ELO in that new `ranking_division_id` slot, competing against older peers.

---

## 4. Implementation Roadmap

### Phase 1: Schema Migration
Create a new Supabase migration (e.g., `043_ranking_division.sql`):
- Rename `heats.division_id` to `heats.ranking_division_id`.
- Add `heats.content_division_id` (nullable UUID, references `divisions`).
- Update `heat_awards` to ensure it references `ranking_division_id`.

### Phase 2: Scoring Service Updates
Update `src/lib/competition/scoring-service.ts`:
- Ensure `calculateHeatResults` and `updateAthleteRatingsFromHeat` use `ranking_division_id` for all ELO calculations and award distributions.
- Ensure the percentiles and `award_level` (Champion, Gold, Silver, Bronze) are computed strictly within the `ranking_division_id` cohort.

### Phase 3: Heat Config Builder UI
Update `src/app/compete/create/page.tsx` (the Sprint 12 split-pane builder):
- The existing Division selector becomes the **Content Division** selector ("What material do you want to test?").
- The UI automatically derives the **Ranking Division** from the teacher's class profile.
- The Sticky Summary pane explicitly displays: *"Results count toward: Grade X standings."*

### Phase 4: Leaderboard & Advancement UI
- Update `src/app/leaderboard/page.tsx` to ensure queries filter strictly by `ranking_division_id`.
- Add the `advancement_eligible` threshold logic (e.g., ELO > 1350) to flag students on the teacher dashboard who are ready to compete above grade level.
