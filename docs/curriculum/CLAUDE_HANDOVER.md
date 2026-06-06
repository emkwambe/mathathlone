# MathAthlone Sprint 1 — Claude Code Handover
**Generated:** 2026-06-05 02:08
**Repo:** C:\Users\HP\Documents\mathathlone-app
**Author:** Mpingo Systems LLC — "Precision Tools built to stay."

---

## What This Directory Contains

All Sprint 1 curriculum artifacts for MathAthlone's question engine.
Located at: `docs/curriculum/`

Each pool has 4 files:
1. `_curriculum_map.md` — Concept table with Group A/B/Hybrid, generator type, answer type, visual category, DOK, 3-axis tags (cognitive_demand / complexity / context)
2. `_generators.json` — Full generator registry with params and difficulty variants
3. `_static.json` — Misconception-targeted static question bank
4. `_visual.json` — Visual generator specs with SVG/HTML rendering rules

---

## Completed Pools

| Pool ID | Division | Folder | Concepts | Generators | Visuals |
|---------|----------|--------|----------|------------|---------|
| math_fundamentals | Foundation | math-fundamentals/ | 124 | 91 | 18 |
| nc_grade_6 | Rising Stars | grade6/ | 64 | 58 | 15 |
| nc_grade_7 | Challengers | grade7/ | 50 | 54 | 14 |
| nc_grade_8 | Contenders | grade8/ | 57 | 57 | 18 |
| algebra_1 | Varsity | algebra1/ | 99 | 82 | 24 |
| nc_math_3 | Varsity+ | nc-math3/ | 101 | 72 | 30 |
| **TOTAL** | | | **495** | **414** | **119** |

---

## Pending Pools (next Claude Chat sessions)

| Pool ID | Division | Status |
|---------|----------|--------|
| algebra_2 | Varsity++ | Next — JSON ready to upload |
| nc_math_2 | Varsity | Pending |
| ap_precalc | Elite | Pending |
| ap_calc_ab | Elite+ | Pending |

---

## Critical Architecture Rules (Claude Code must follow)

### Isolation Rule
ZERO shared generator IDs across any pools. Every generator ID is pool-prefixed:
- math_fundamentals: `mf_*`
- nc_grade_6: `g6_*`
- nc_grade_7: `g7_*`
- nc_grade_8: `g8_*`
- algebra_1: `alg1_*`
- nc_math_3: `m3_*`

### 3-Axis Schema
Every generator and static question has:
`json
{
  "three_axis": {
    "cognitive_demand": "procedural | conceptual | application | reasoning",
    "complexity": "low | medium | high",
    "context": "abstract | real_world"
  }
}
`
These map to DB columns on `question_generators` and `static_questions` tables.

### Heat Profile → DOK Mapping
| Heat Type | DOK 1 | DOK 2 | DOK 3 |
|-----------|-------|-------|-------|
| Practice | 50% | 45% | 5% |
| Standard | 30% | 60% | 10% |
| Championship | 15% | 65% | 20% |

### Cross-Division Pool
`math_fundamentals` is the ONLY pool eligible across all divisions.
Flag: `cross_division_eligible = TRUE` in DB.
Tier weights: Tier 1 (60%), Tier 2 (30%), Tier 3 (10%).

### User-Facing Language
- DB column: `athlete`
- UI display: `Mathlete`
- Never expose DB terminology in UI

---

## Supabase Seeding Order (Claude Code sprint)

Run migrations in this order to avoid FK violations:

`
1. courses table (course_id, pool_id, division)
2. question_generators table (all 414 generators)
3. static_questions table (all static items)
4. atomic_concepts table — seed from:
   SELECT DISTINCT concept_id, concept_name FROM static_questions
5. Heat engine: reference tier weights from math_fundamentals pool
`

### atomic_concepts seed SQL to build:
`sql
-- Run per pool after static_questions are loaded
INSERT INTO atomic_concepts (concept_id, concept_name, pool_id, cross_division_eligible, tier)
SELECT DISTINCT
  concept_id,
  concept_name,
  pool_id,
  FALSE as cross_division_eligible,
  NULL as tier
FROM static_questions
ON CONFLICT (concept_id) DO NOTHING;

-- Math Fundamentals special case
UPDATE atomic_concepts
SET cross_division_eligible = TRUE
WHERE pool_id = 'math_fundamentals';
`

---

## PowerShell Conventions (all Claude Code commands must follow)

- Always use absolute paths: `C:\Users\HP\Documents\mathathlone-app\...`
- All file writes: `[System.IO.File]::WriteAllText(path, content, [System.Text.Encoding]::UTF8)`
- No BOM: use `System.Text.UTF8Encoding(False)` where needed
- Never run `pnpm add` or `pnpm remove` inside `apps/cli/` — breaks workspace junction
- If junction broken: `New-Item -ItemType Junction -Path node_modules\@realitydb\engine -Target packages\engine -Force`

---

## EOG Calibration (Grade 7 Verified)

Grade 7 generators were audited against the 2026 NCDPI Released Form.
Full audit: `docs/curriculum/shared/NC_Grade_7_EOG_Calibration_Audit.md`

Required generator patches (implement before heat testing):
1. `g7_rp_find_unit_rate` — add fraction÷fraction×integer pattern
2. `g7_ns_rational_word_problem` — add 5 sub-patterns (mean-of-signed, tax+divide, etc.)
3. `g7_geo_angle_rectangle_diagonal` — NEW generator for DOK 3 rectangle diagonal angle
4. `g7_vis_box_plot_comparison` — equal-IQR/unequal-range scenario required
5. `g7_sp_theoretical_probability` — add complement-of-sum pattern
6. `g7_rp_proportional_solve` — add chain-ratio DOK 3 pattern

Platform-level EOG config: `docs/curriculum/shared/EOG_Alignment_Reference.md`

---

## Next Session Handover Prompt (for Claude Chat)

Paste this at the start of the next Claude Chat session:

> Continuing MathAthlone Sprint 1 curriculum build for Mpingo Systems LLC.
> Completed pools: math_fundamentals, nc_grade_6, nc_grade_7 (EOG audited), nc_grade_8, algebra_1, nc_math_3.
> All artifacts saved to: C:\Users\HP\Documents\mathathlone-app\docs\curriculum\
> Handover reference: CLAUDE_HANDOVER.md in that directory.
> Next pool: algebra_2 (Division: Varsity++). Run full 4-file pipeline.
> Key rules: isolated pool IDs, 3-axis tags, misconception-targeted statics, answer never in visual.

---

*Generated by Save-CurriculumArtifacts.ps1 — Mpingo Systems LLC*