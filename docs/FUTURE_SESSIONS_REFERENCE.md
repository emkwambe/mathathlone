# MathAthlone — Future Sessions Reference Guide
**Version:** 1.0 | **Author:** Mpingo Systems LLC | **Date:** June 2026

---

## Purpose

This document is the single entry point for any new Claude chat session working on MathAthlone.
Read this first. It contains current state, critical rules, known issues, and the exact next steps.

---

## 1. Platform State (June 6, 2026)

### What's Live
- **URL:** mathathlone.vercel.app
- **Repo:** github.com/emkwambe/mathathlone (private)
- **Local:** C:\Users\HP\Documents\mathathlone-app
- **Stack:** Next.js 14.2.21 + TypeScript + Supabase + Vercel
- **Supabase project:** yhqxxgqfpgcertsqibps (Mathathlone-v2)

### Full Flow (Verified)
```
Teacher login → Create Heat (division→course→unit→difficulty→type) →
Share 6-char code → Students join lobby → Teacher starts →
Countdown → Questions (FR + MC) → Timer → Student finishes →
"You're done!" → Teacher ends heat → Results: CTA score, 
accuracy, concept mastery, awards, leaderboard
```

### Courses in DB
| Code | Course | Division | Grade | Gen in DB | Static in DB | Status |
|---|---|---|---|---|---|---|
| MF | Math Fundamentals | Foundation | 6-8 | 25 | 49 | ✅ FR+MC |
| G6 | NC Grade 6 Math | Rising Stars | 6 | 0 | 33 | 🔷 MC only |
| G7 | NC Grade 7 Math | Challengers | 7 | 25 | 27 | ✅ FR+MC |
| G8 | NC Grade 8 Math | Contenders | 8 | 25 | 27 | ✅ FR+MC |
| ALG1 | Algebra 1 | Varsity | 8-9 | 25 | 32 | ✅ FR+MC |
| NCM1 | NC Math 1 | Junior Varsity | 9-10 | 54 | 42 | ✅ FR+MC |
| NCM2 | NC Math 2 | Junior Varsity | 9-10 | 0 | 78 | 🔷 MC only |
| NCM3 | NC Math 3 | Senior Varsity | 10-11 | 25 | 29 | ✅ FR+MC |
| ALG2 | Algebra 2 | Senior Varsity | 10-11 | 0 | 50 | 🔷 MC only |
| APPC | AP Precalculus | Senior Varsity | 11-12 | 0 | 72 | 🔷 MC only |

### Generator Implementation Status
| Course | In JSON spec | Implemented in TS | Spec-faithful | Gap |
|---|---|---|---|---|
| NCM1 | 54 | 54 | ✅ Yes | 0 |
| MF | 90 | 25 | ❌ No (0/25 match spec IDs) | 65 |
| G6 | 41 | 0 | — | 41 |
| G7 | 33 | 25 | ⚠️ Partial (22/25 match) | 11 |
| G8 | 32 | 25 | ⚠️ Partial (16/25 match) | 16 |
| ALG1 | 51 | 25 | ⚠️ Partial | 26 |
| NCM2 | 83 | 0 | — | 83 |
| NCM3 | 57 | 25 | ⚠️ Partial (1/25 match) | 56 |
| ALG2 | 182 | 0 | — | 182 |
| APPC | 65 | 0 | — | 65 |

---

## 2. Critical Rules (Never Violate)

### Database
- **NEVER insert into question_generators with subquery** — use CTE+JOIN pattern (NULL trap)
- **Always run isolation check** after seeding — zero cross-pool rows required
- **Check rows_seeded == rows_expected** — mismatch means missing atomic_concepts
- **RLS is enabled** on all 4 curriculum tables — SQL Editor runs as postgres (bypasses)
- **unique constraint** on question_generators.generator_type — ON CONFLICT (generator_type)
- **unique constraint** on static_questions (course, concept_id, question_text)
- **unique constraint** on atomic_concepts.lesson_number

### Code
- **PowerShell only** — always use absolute paths
- **pnpm** (never npm) — `pnpm dev:turbo` for fast dev, `pnpm build` to verify
- **pnpm build after every batch** — catch TypeScript errors immediately
- **Generator IDs come from JSON spec** — never invent new IDs
- **answer_type in TS must match DB** — always verify after seeding
- **BOM-free UTF-8** for file writes: `[System.IO.File]::WriteAllText()`

### Curriculum
- **JSON spec is authoritative** — `*_generators.json` defines IDs, answer_types, params
- **Curriculum map is the suitability evaluation** — Group A/B/Hybrid already decided
- **Pool isolation is non-negotiable** — g7_ generators only in G7, g8_ only in G8, etc.
- **Static questions target misconceptions** — each one documents the error it catches
- **Answer NEVER in visual** — SVG provides context, student computes

---

## 3. Known Issues & Technical Debt

### High Priority (Fix Before Pilot)
| Issue | Location | Fix |
|---|---|---|
| Generator IDs don't match JSON spec | generators.ts | Reconciliation sprint |
| MF generators not spec-faithful (0/25 match) | generators.ts | Reimplement from MF_generators.json |
| NCM3 generators not spec-faithful (1/25 match) | generators.ts | Reimplement from NCM3_generators.json |
| G6 has 0 generators in DB | question_generators | Build G6 generators from spec |
| NCM2, ALG2, APPC have 0 generators | question_generators | Build from JSON specs |
| Race condition in auto-end heat | heat-realtime.ts | Make endHeat conditional on status=active |

### Medium Priority (Before Scale)
| Issue | Location | Fix |
|---|---|---|
| Unit-of-measurement missing in geometry answers | generators.ts | Option B implementation |
| No automated generator test runner | — | Build scripts/test-generators.ts |
| 3-axis columns missing from question_generators table | DB | ALTER TABLE + backfill |
| Visual generators not built | visual-generators.ts | Phase 3 sprint |
| Generator count below 40 minimum on most courses | question_generators | Expansion sprint |

### Low Priority (Future)
| Issue | Location | Fix |
|---|---|---|
| CURRICULUM_AUDIT_LOG.md not auto-regenerated | docs/ | Add to post-migration script |
| "NC Math 1 concepts" hardcoded on landing page | src/app/page.tsx | Update with real counts |
| Stale dashboard links (/analytics, /class/create) | dashboard | Remove links |
| CTA score cap at 100 (streak can exceed) | scoring-service.ts | Cap at 100 |

---

## 4. File Locations

### Key Source Files
```
src/lib/competition/generators.ts         — ALL procedural generators (GENERATORS map)
src/lib/competition/visual-generators.ts  — SVG visual generators (VISUAL_GENERATORS map)
src/lib/competition/question-delivery.ts  — Heat assembly: FR/MC ratio, backfill logic
src/lib/competition/validation.ts         — Answer validation per answer_type
src/lib/competition/heat-service.ts       — createHeat, endHeat, joinHeat
src/lib/competition/heat-realtime.ts      — Supabase Realtime subscriptions
src/app/compete/create/page.tsx           — Create Heat UI (division→course→unit)
src/app/compete/[code]/page.tsx           — Lobby → Active → Results
src/components/competition/CompetitionView.tsx — Main gameplay component
src/components/competition/StudentResults.tsx  — Personal results + awards
src/components/competition/TeacherResults.tsx  — Class results + concept mastery
```

### Curriculum Files
```
docs/curriculum/[folder]/
  [PREFIX]_curriculum_map.md    — Authoritative spec: concepts, Group A/B/Hybrid, 3-axis
  [PREFIX]_generators.json      — Generator specs: IDs, params, answer_types (SOURCE OF TRUTH)
  [PREFIX]_static.json          — Static MC questions with misconceptions
  [PREFIX]_visual.json          — SVG visual generator specs
docs/CURRICULUM_AUDIT_LOG.md    — Coverage gap analysis (regenerate after each sprint)
docs/CONCEPT_SUITABILITY_MATRIX_FRAMEWORK.md — Universal evaluation framework
docs/GENERATOR_ENGINE_SPEC.md   — Quality standards and validation rules
docs/FUTURE_SESSIONS_REFERENCE.md — This file
```

### Migration Files
```
supabase/migrations/
  011_sprint1_pools_seed.sql     — NCM2, APPC, ALG2 courses + static_questions
  012_algebra1_seed.sql          — ALG1 atomic_concepts + static_questions
  013_math_fundamentals_seed.sql — MF atomic_concepts + static_questions
  014_nc_grade_7_seed.sql        — G7 atomic_concepts + static_questions
  015_nc_grade_6_seed.sql        — G6 atomic_concepts + static_questions
  016_nc_grade_8_seed.sql        — G8 atomic_concepts + static_questions
  017_nc_math_3_seed.sql         — NCM3 atomic_concepts + static_questions
  018_g7_missing_concepts_patch.sql — G7 Group B concept patch
  019_groupB_concepts_patch.sql  — All pools Group B concept patch
  020_g7_generators_seed.sql     — G7 generators (25 rows)
  021_g8_generators_seed.sql     — G8 generators (25 rows)
  022_alg1_generators_seed.sql   — ALG1 generators (25 rows)
  023_ncm3_generators_seed.sql   — NCM3 generators (25 rows)
  024_mf_generators_seed.sql     — MF generators (25 rows)
```

---

## 5. Dev Accounts

| Email | Password | Role |
|---|---|---|
| mrmkwambe@mathathlone.dev | TestHeat2026! | Teacher |
| mshodges@mathathlone.dev | TestHeat2026! | Teacher |
| student1@mathathlone.dev | TestHeat2026! | Student (Amara Osei, G9) |
| student2@mathathlone.dev | TestHeat2026! | Student (Jordan Chen, G10) |
| student3@mathathlone.dev | TestHeat2026! | Student (Priya Sharma, G8) |
| student4@mathathlone.dev | TestHeat2026! | Student (Marcus Williams, G9) |
| dev.teacher@test.com | devpass123 | Teacher (dev) |
| dev.mathlete.g7@test.com | devpass123 | Student G7 (dev) |

---

## 6. Immediate Next Steps (Priority Order)

### Sprint: Generator Reconciliation
1. Audit MF generators — reimplement from MF_generators.json (90 specs, 0 currently match)
2. Audit NCM3 generators — reimplement from NCM3_generators.json (57 specs, 1 matches)
3. Audit G7/G8 generators — patch IDs that don't match JSON spec
4. Build G6 generators from NC_Grade_6_generators.json (41 specs, using exact IDs)
5. Build NCM2 generators from NCM2_generators.json
6. Build ALG2 generators from ALG2_generators.json  
7. Build APPC generators from AP_Precalculus_generators.json

### Sprint: Quality Gate
1. Build scripts/test-generators.ts (1000-call test per generator)
2. Fix any generators that fail the test
3. Add 3-axis columns to question_generators table
4. Backfill 3-axis tags from JSON specs

### Sprint: Pilot Preparation
1. Test G7 heat end-to-end on production (mathathlone.vercel.app)
2. Verify format hints display correctly for all answer types
3. Fix CTA score cap at 100
4. Remove stale dashboard links
5. Brief Ms. Hodges on pilot protocol (all students join BEFORE teacher starts)

### Sprint: Visual Generators (Phase 3)
1. Implement SVG generators for G7 (14 visual specs in NC_Grade_7_visual.json)
2. Implement SVG generators for G6 (15 visual specs)
3. Implement SVG generators for G8 (18 visual specs)
4. Add to visual-generators.ts following existing patterns

---

## 7. How to Start a New Session

### For generator work (Claude Chat):
```
I'm building MathAthlone. Read docs/FUTURE_SESSIONS_REFERENCE.md
and docs/CURRICULUM_AUDIT_LOG.md for current state.

Today's task: [specific task]
```

### For code changes (Claude Code):
```
Read:
1. C:\Users\HP\Documents\mathathlone-app\docs\FUTURE_SESSIONS_REFERENCE.md
2. C:\Users\HP\Documents\mathathlone-app\src\lib\competition\generators.ts
3. C:\Users\HP\Documents\mathathlone-app\docs\curriculum\[folder]\[PREFIX]_generators.json

Task: [specific implementation task]
Rules: Use exact IDs from JSON spec. pnpm build after each batch.
```

### Isolation check template (run after every generator migration):
```sql
-- Replace g7_/G7 with correct prefix/code
SELECT qg.generator_type, c.code
FROM question_generators qg
JOIN atomic_concepts ac ON ac.id = qg.concept_id
JOIN unit_topics ut ON ut.id = ac.unit_topic_id
JOIN courses c ON c.id = ut.course_id
WHERE qg.generator_type LIKE 'g7_%'
  AND c.code != 'G7';
-- Expected: 0 rows
```

---

## 8. Architecture Decisions Locked

| Decision | Rationale |
|---|---|
| JSON spec is source of truth for generator IDs | Built with full curriculum analysis; prevents ID drift |
| CTE+JOIN for migrations (not subqueries) | Prevents silent NULL inserts |
| Pool isolation enforced via course_id FK chain | Structural guarantee, not code-level check |
| answer_type in TS must match DB | Single source of truth; format hints depend on it |
| Static questions target documented misconceptions | Curriculum quality standard |
| Answer never in visual | Pedagogically required; visual provides context only |
| MF is cross-division eligible | Diagnostic pool for all divisions |
| 40+ generators minimum per course | Variety threshold for school-year freshness |
| FR weighted 2× in CTA | Production vs recognition (research-backed) |
| CTA = Content×0.40 + Time×0.30 + Accuracy×0.30 | Grant-documented scoring framework |

---

*Mpingo Systems LLC — Precision Tools built to stay.*
