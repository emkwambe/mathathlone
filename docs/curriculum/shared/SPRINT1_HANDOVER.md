# MathAthlone Sprint 1 — Curriculum Analysis Session Handover
**Date:** 2026-06-04  
**Session type:** Claude Chat (Planning)  
**Next step:** Claude Code (Execution)

---

## Files Uploaded vs. Processed

| File | Status | Concepts Parsed |
|------|--------|----------------|
| NC_7th_Grade_Math.json | ✅ PROCESSED | 50 concepts |
| NC_8th_Grade_Math.json | ✅ PROCESSED | 57 concepts |
| NC_6th_Grade_Math.json | ❌ UPLOAD FAILED — file not found at /mnt/user-data/uploads/ | — |
| Math_Fundamentals.json | ❌ UPLOAD FAILED — file not found | — |

**Action required:** Re-upload NC_6th_Grade_Math.json and Math_Fundamentals.json in the next session to complete Sprint 1.

---

## Outputs Generated (This Session)

```
mathathlone-curriculum/
├── grade7/
│   ├── NC_Grade_7_curriculum_map.md     ✅
│   ├── NC_Grade_7_generators.json       ✅ (54 generators)
│   ├── NC_Grade_7_static.json           ✅ (52 static items)
│   └── NC_Grade_7_visual.json           ✅ (14 visual generators)
└── grade8/
    ├── NC_Grade_8_curriculum_map.md     ✅
    ├── NC_Grade_8_generators.json       ✅ (57 generators)
    ├── NC_Grade_8_static.json           ✅ (55 static items)
    └── NC_Grade_8_visual.json           ✅ (18 visual generators)
```

---

## Concept Counts by Course

### Grade 7 (Challengers Division)
| Domain | Concepts |
|--------|----------|
| The Number System | 10 |
| Ratio & Proportional Relationships | 11 |
| Expressions & Equations | 8 |
| Geometry | 12 |
| Statistics & Probability | 11 |
| **TOTAL** | **50** |

Classification breakdown:
- Group A (Generator-only): 30 concepts → **54 generators** ✅
- Group B (Static-only): 8 concepts → **52+ static questions** ✅
- Hybrid (both): 12 concepts
- Visual generator concepts: **14**

### Grade 8 (Contenders Division)
| Domain | Concepts |
|--------|----------|
| The Real Number System | 9 |
| Expressions & Equations | 11 |
| Functions | 11 |
| Geometry: Transformations/Congruence/Similarity | 14 |
| Geometry: Pythagorean Theorem & Volume | 13 |
| Statistics & Probability | 7 |
| **TOTAL** | **57** |

Classification breakdown:
- Group A (Generator-only): 29 concepts → **57 generators** ✅
- Group B (Static-only): 11 concepts → **55+ static questions** ✅
- Hybrid (both): 17 concepts
- Visual generator concepts: **18**

---

## Division Assignments

| Course | Division | EOG Spec |
|--------|----------|----------|
| Grade 6 | Rising Stars | NCDPI April 2026 Table 2 |
| Grade 7 | Challengers | NCDPI April 2026 Table 2 |
| Grade 8 | Contenders | NCDPI April 2026 Table 2 |
| Math 1 | Varsity (existing) | — |

---

## 3-Axis Framework (Sprint 0) — Schema Applied to All Outputs

Every generator and static question in this session has been tagged with:
```json
{
  "cognitive_demand": "procedural | conceptual | application | reasoning",
  "complexity": "low | medium | high",
  "context": "abstract | real_world"
}
```

These map to the DB columns: `question_generators.cognitive_demand`, `.complexity`, `.context`

**Heat profiles:**
- Practice → DOK 1–2, procedural/conceptual, low-medium complexity
- Standard → DOK 2, mixed cognitive_demand, medium complexity
- Championship → DOK 2–3, application/reasoning, high complexity, real_world context

---

## Critical Implementation Notes for Claude Code

### Generator Pool Isolation
Each course has a unique `generator_pool_id`:
- Grade 7: `nc_grade_7`
- Grade 8: `nc_grade_8`

**The `course_id` foreign key on `question_generators` table MUST be set correctly.** Zero cross-pool reuse.

### Visual Generator Safety Rule
Every visual generator spec includes `"format_hint_rule"`. When rendering:
- **NEVER** encode the answer in the SVG (no labeled answer, no pre-drawn image result)
- For inequality number lines (g7_vis_number_line_inequality): shown only AFTER submission
- For transformation generators: pre-image shown, image NOT drawn

### Answer Type Notes
- `ordered_pair` type → stored as `{x: number, y: number}` — use exact match with tolerance ±0.01
- `text` type (simplified expressions) → normalized string comparison, strip spaces
- `decimal_or_fraction` → accept both forms; validate numerically within ±0.01

### M8.F.4.2 Exclusion
The concept "Sketching a Graph from a Qualitative Description" was flagged as **unassessable in auto-graded competition format**. It requires free-form drawing. Excluded from all generator and static banks. Consider a "sketch mode" feature for future Practicum-style courses.

### Enum Distribution Note
All generator `params` in these files use mathematically valid randomization ranges. When implementing:
- Pythagorean triple pools are **research-grounded** (canonical integer triples)
- Percent problem value ranges match real-world plausibility (tax 5–30%, interest 2–12%)
- No uniform distribution used where context demands realistic variation

---

## Missing Files — Next Session Actions

1. Re-upload `NC_6th_Grade_Math.json` → run same 6-step Sprint 1 pipeline → output to `grade6/`
2. Re-upload `Math_Fundamentals.json` → classify for foundational/remedial tier → determine if it maps to a sub-division (e.g., "Foundation" below Rising Stars)
3. When Math 2, Math 3, AP Pre-Calculus files are available → run same pipeline → Varsity/Elite divisions

---

**Mpingo Systems LLC — "Precision Tools built to stay."**
