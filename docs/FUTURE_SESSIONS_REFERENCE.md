# MathAthlone — Future Sessions Reference
**Single entry point for new Claude Chat sessions.**
Last updated: June 11, 2026

---

## Quick Context

MathAthlone is a real-time competitive math platform — "Chess.com for math."
Built by Eddy Mkwambe / Mpingo Systems LLC, Charlotte NC.
Live at: https://mathathlone.vercel.app
Repo: github.com/emkwambe/mathathlone (private)
Local: C:\Users\HP\Documents\mathathlone-app
Stack: Next.js 14.2.21 / TypeScript / Supabase (yhqxxgqfpgcertsqibps) / Vercel
Deploy: `vercel --prod` (Git webhook blocked — manual only)

---

## Session History References

| Topic | Transcript / Chat |
|---|---|
| Full curriculum quality sprint (generators, static, validator, assessment generator) | /mnt/transcripts/2026-06-07-16-40-36-mathathlone-curriculum-quality-sprint.txt |
| Current session (June 10-11 2026) | Active — see below for full summary |

---

## What Was Completed (June 10-11, 2026 Session)

### Generator Quality — ALL 6 COURSES CLEARED
213 generators verified by DeepSeek AI (strict mode, 10-20 samples/difficulty):

| Course | Generators | Key Fixes |
|---|---|---|
| G7 | 25 ✅ | Proportion formula, unit_rate wording, deduplication, compound_probability variety |
| MF | 25 ✅ | Zero bugs |
| G8 | 25 ✅ | Volume rounding (toFixed→Math.round × 10 sites) |
| ALG1 | 25 ✅ | Zero true bugs (DeepSeek false positives only) |
| NCM3 | 25 ✅ | factor_polynomial difference-of-squares completion |
| G6 | 34 ✅ | Absolute value simplification, unit_rate direction/wording, "feet" plural |

### Static Question Audit — 197/197 CLEARED
All active pilot course static MC questions verified:
- G7: 27/27, G6: 33/33, G8: 27/27, ALG1: 32/32, MF: 49/49, NCM3: 29/29
- Fixed: G6 distractor errors (3), ALG1 standard form ambiguity, JSON comment cleanup
- Scripts: `scripts/static_question_auditor.py`, `scripts/fix_static_flags.py`

### MC Answer Distribution — CERTIFIED FAIR
Chi-square test across 40,000+ simulated MC placements:
- G7: χ²=1.17, G8: χ²=5.58, ALG1: χ²=0.22, MF: χ²=4.21
- All well below critical value 7.815 (p=0.05, df=3)
- Tool: `scripts/mc_distribution_analyzer.py`

### DB ↔ GENERATORS Map Integrity — VERIFIED
- 213/213 generator_types in DB have matching functions in GENERATORS map
- Zero gaps in both directions
- Tool: `scripts/check-db-generators.ts`
- Run: `npx tsx --env-file=.env.local scripts/check-db-generators.ts`

### Assessment Generator — BUILT AND LIVE
Standalone tool at `/assessment/generate` — sibling to Create Heat:
- Document types: Review (10Q), Quiz (12Q), Homework (8Q), Test (20Q), Makeup (20Q)
- KaTeX math rendering (direct katex, not react-katex)
- Print CSS: Georgia serif, letter size, 0.75in margins
- Answer key on separate page (quiz/test/makeup only)
- Continuous question numbering across sections
- sessionStorage handoff to `/assessment/preview`
- Key files:
  - `src/lib/assessment/assembler.ts`
  - `src/lib/assessment/katex-helpers.ts`
  - `src/app/assessment/generate/page.tsx`
  - `src/app/assessment/preview/page.tsx`
  - `src/components/assessment/AssessmentDoc.tsx`

### Answer Validator Fixes — CRITICAL
Two bugs fixed in `src/lib/competition/validation.ts`:
1. **Mixed number input** — `2 3/4` now correctly converts to `11/4`
   before comparison (was stripping space → `23/4`)
2. **Routing gap** — `decimal_or_fraction` and related types now
   route to `validateNumberOrFraction` (were falling through to
   `validateText`, so `11/4` ≠ `2.75` even when mathematically equal)

### Assessment Mode Fixes
- No live feedback during quiz/test heats (no correct/wrong flash,
  no score, no streak shown to student mid-heat)
- Letter grade hidden from student results (teacher only)
- CTA score hidden from student results
- Realtime heartbeat: `heartbeatIntervalMs: 15000` in `client.ts`

### Migration 032 Applied to Live DB
- Added: `concept_ids TEXT[]`, `is_assessment BOOLEAN`,
  `results_released BOOLEAN`, `question_profile TEXT`,
  `grade_bands JSONB` to heats table
- Added: `quiz` and `test` to heat_type ENUM
- Added: `cognitive_demand`, `complexity`, `context` to
  question_generators (all NULL — needs backfill)
- Fixed: "Could not find concept_ids column" error on Create Heat

### Bracket/League Engine — VERIFIED EXISTS
`src/lib/league-engine.ts` (1,467 lines) — fully built:
- BracketGenerator: single + double elimination with seeding/byes
- StandingsCalculator with tiebreaker handling
- EloEngine for 1v1 bracket match rating updates
- LeagueEngineService with full Supabase integration
- Championship points, advancement rules, play-in system
- DB tables migrated: `leagues`, `brackets`, `bracket_matches`,
  `league_standings`, `championship_points`
- **Gap:** LeagueDashboard.tsx uses mock data (`generateMockBracket()`)
- **Gap:** No route `/league/[id]` exists

### Reference Documents Added to Repo
- `docs/MathAthlone_Question_Categorization_Reference.md`
  — FR vs MC, generator vs static, answer types, 3-axis profiles,
  SVG/visual third category, decision tree
- `docs/MathAthlone_State_Exam_Alignment_Reference.md`
  — Released NC EOG/EOC URLs, DOK mapping, domain weights,
  wording standards, gridded response format, calibration protocol
- `docs/MathAthlone_Sponsorship_Plan.md`
  — 36-month funding roadmap, stakeholder map, application timeline

### Quality Pipeline Tools (all in `scripts/`)
- `generator_evaluator.py` — v4, LLM-agnostic (DeepSeek/Claude/OpenAI)
- `sample-generators.ts` — TypeScript sampler
- `mc_distribution_analyzer.py` — Chi-square distribution test
- `static_question_auditor.py` — Static JSON question auditor
- `check-db-generators.ts` — DB integrity checker
- `generate_worksheet.py` — HTML worksheet for human review

---

## Recent Commits (latest first)

| Commit | Description |
|---|---|
| cefaf7a | fix: mixed number input + decimal_or_fraction routing in validator |
| dd285eb | fix: hide assessment feedback + letter grade from students, realtime heartbeat |
| a329b58 | debug: add startHeat error logging (can revert) |
| c905004 | fix: remove CSS page counter (double page numbers in Chrome) |
| b7f94a2 | fix: continuous numbering, page numbers, remove workspace label |
| d6b8f96 | feat: standalone assessment generator (decoupled from heats) |
| 495242e | feat: take-home assessment generator initial build |
| ab97f85 | fix: static question flags — G6 distractors, ALG1 standard form |
| f5dcd89 | docs: static audits G6-NCM3 cleared, JSON comment cleanup |
| 7df41d0 | docs: state exam alignment reference |
| c32e240 | docs: question categorization reference (3 source types) |
| 1f26ac5 | docs: G6 audit complete — all 6 courses cleared |
| 1d96ad3 | fix: G6 absolute value, unit_rate, feet plural |
| c41757d | fix: NCM3 factor_polynomial difference of squares |
| 8478afd | fix: G8 volume rounding toFixed→Math.round |
| 4ab60f1 | fix: 5 generator quality issues (proportion, wording, dedup) |

---

## PENDING — Priority Order for Next Session

### P1 — decimal_or_fraction_or_percent routing gap
Claude Code flagged this: `decimal_or_fraction_or_percent` and
`_or_text` types still fall through to `validateText`.
Affects percent answer types — `20` and `20%` may not match.

**Fix:** In `src/lib/competition/validation.ts`, route
`decimal_or_fraction_or_percent` to `validateNumberOrFraction`
with percent normalization (strip `%`, divide by 100 for comparison).

**Verify:**
```powershell
npx tsx --env-file=.env.local --eval "import { validateAnswer } from './src/lib/competition/validation'; console.log(validateAnswer('20%', '20', 'decimal_or_fraction_or_percent')); console.log(validateAnswer('20', '20%', 'decimal_or_fraction_or_percent'));"
```

### P2 — Difficulty Calibration Backfill
Migration 032 added `cognitive_demand`, `complexity`, `context`
columns to `question_generators` but they're all NULL.
All heats fall through to depth-range fallback — Warm-Up and
Deep heats draw from the same pool.

**Fix:** Write a migration that reads `three_axis` from each
`docs/curriculum/*/_generators.json` and UPSERTs into DB.

Each JSON entry has:
```json
{
  "generator_type": "g7_add_rational",
  "three_axis": {
    "cognitive_demand": "procedural",
    "complexity": "low",
    "context": "abstract"
  }
}
```

Script to write: `scripts/backfill-three-axis.ts`
Run with: `npx tsx --env-file=.env.local scripts/backfill-three-axis.ts`

### P3 — League Dashboard Wired to Real Data
**File:** `src/components/league/LeagueDashboard.tsx`
**Issue:** Uses mock data — `generateMockBracket()`,
`generateMockStandings()`, `generateMockChampionship()`
**Engine:** `src/lib/league-engine.ts` is fully built
**DB:** Tables migrated and ready
**Missing:**
1. Route `/league/[id]` — doesn't exist
2. Dashboard queries need to replace mock functions with
   real Supabase calls via `LeagueEngineService`
3. Teacher UI to create a league and assign heats to it
4. Student UI to see their league standing

### P4 — Concept Names Showing IDs in Topic Tree
Some concepts in the Create Heat topic tree show raw IDs
(e.g. `M6.NS.4.1`) instead of description text.

**Cause:** `atomic_concepts` table has `concept_id` but
`description` field is null for some rows.

**Check:**
```sql
SELECT concept_id, description
FROM atomic_concepts
WHERE description IS NULL OR description = ''
LIMIT 20;
```
Run in Supabase SQL editor.

**Fix:** Backfill descriptions from the curriculum JSON files
in `docs/curriculum/*/`.

### P5 — Landing Page Stats Update
**File:** `src/app/page.tsx`
Currently shows outdated hardcoded numbers:
- "111 NC Math 1 concepts" → should be "699 concepts"
- "66+ Question generators" → should be "213 generators"
- "5 Divisions" → correct (5 divisions)
- "6 Competition levels" → should be "7 heat types"

Simple string replace — 10 minutes.

### P6 — FR Answer Validator Remaining Types
Per Claude Code's note, these types still fall through to
`validateText` and may have gaps:
- `decimal_or_fraction_or_percent`
- `decimal_or_text`
- `integer_or_text`
- `text_or_fraction`
- `integer_or_MC`

Audit each one — do any generators actually use these types?
If yes, fix routing. If no, they're dead code.

### P7 — Mixed Number in NC EOG Style
NC allows: `2 3/4` (whole number space fraction) — now fixed ✅
Also consider: should we show students the input hint
"Enter fractions as 3/4 or mixed numbers as 2 3/4"?
Add to the answer format hint system in `ANSWER_TYPE_HINTS`.

### P8 — Visual Generators (v2)
47 visual specs across G6/G7/G8 in `*_visual.json` files.
None built yet. High student experience value — deferred to
post-pilot.

---

## Key Technical Conventions

```powershell
# ALWAYS run first after restart
cd C:\Users\HP\Documents\mathathlone-app
$env:DEEPSEEK_API_KEY = "sk-05045210c5f9472d8c4b8617b4687652"
git pull

# Deploy
vercel --prod

# TypeScript scripts with Supabase
npx tsx --env-file=.env.local scripts/filename.ts

# Never run pnpm add/remove in apps/cli/ — breaks @realitydb/engine
# BOM-free UTF-8 writes:
[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))

# One-line PowerShell only — no backtick continuation
command1; command2; command3
```

## Dev Accounts

| Email | Password | Role |
|---|---|---|
| mrmkwambe@mathathlone.dev | TestHeat2026! | Teacher |
| dev.teacher@test.com | devpass123 | Teacher (dev) |
| dev.mathlete.g7@test.com | devpass123 | Student G7 |
| student1-4@mathathlone.dev | TestHeat2026! | Students |

## Supabase
- Project: yhqxxgqfpgcertsqibps
- SQL Editor: https://supabase.com/dashboard/project/yhqxxgqfpgcertsqibps/editor
- Migrations folder: `supabase/migrations/`
- Latest migration applied: `032_heat_design_overhaul.sql`

---

## Recommended Next Sprint Order

**Sprint A — Validator completion (1 session)**
1. Fix `decimal_or_fraction_or_percent` routing (P1)
2. Audit remaining `_or_text` types (P6)
3. Add mixed number hint to ANSWER_TYPE_HINTS (P7)
4. Update landing page stats (P5)
5. Fix concept names showing IDs in topic tree (P4)

**Sprint B — Difficulty backfill (1 session)**
1. Write `scripts/backfill-three-axis.ts`
2. Run backfill, verify in DB
3. Test Warm-Up vs Challenge heats pull different generators
4. Update question-delivery.ts if relaxation chain needs tuning

**Sprint C — League system (2 sessions)**
1. Add route `/league/[id]`
2. Wire LeagueDashboard to real Supabase data
3. Teacher UI: create league, add participants
4. Student UI: see standing, bracket position
5. Test bracket generation with real heat data

**Sprint D — Pilot preparation (1 session)**
1. End-to-end pilot simulation (teacher + 5 students)
2. Load test (5 simultaneous students, 1 heat)
3. Timer auto-end verification under load
4. Document teacher onboarding flow

---

*Mpingo Systems LLC — Precision Tools built to stay.*
*eddy@mpingo.ai | github.com/emkwambe/mathathlone*
