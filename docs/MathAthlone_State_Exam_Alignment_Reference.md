# MathAthlone — State Exam Alignment Reference
**Mpingo Systems LLC** | Last updated: June 2026

---

## Purpose

This document maps MathAthlone's question generators and static
questions to the North Carolina released state assessments. It serves
three purposes:

1. **Rigor validation** — confirms our difficulty calibration and
   DOK levels match what NC actually tests
2. **Wording standards** — NC EOG/EOC questions have a specific
   register and style that teachers and students recognize; our
   generators should match this style
3. **Grant and sponsor credibility** — "aligned to released NC
   state assessments" is a verifiable, fundable claim

---

## Released Assessment Sources

All forms below are publicly available from the NC Department of
Public Instruction. Released forms are built using the same
operational test specifications as the real exam.

| Course | Exam | Released Form URL | Last Updated |
|---|---|---|---|
| G6 | EOG Grade 6 Math | https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-6-released-form | 2025-26 |
| G7 | EOG Grade 7 Math | https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-7-released-form | 2025-26 |
| G8 | EOG Grade 8 Math | https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grade-8-released-form | 2025-26 |
| ALG1 | EOC NC Math 1 | https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-released-form | 2025-26 |
| NCM3 | EOC NC Math 3 | https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-3-released-form | 2025-26 |
| All | EOG Specs G6-8 | https://www.dpi.nc.gov/documents/accountability/testing/eog/eog-mathematics-grades-3-8-test-specifications | Current |
| ALG1/NCM3 | EOC Specs | https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-and-nc-math-3-test-specifications | Current |
| All G3-8 | EOG Main Page | https://www.dpi.nc.gov/districts-schools/accountability-and-testing/state-tests/end-grade-eog | Current |

---

## NC EOG/EOC Question Format vs MathAthlone

Understanding how NC formats its questions informs how we should
word ours.

### NC EOG answer types (from released forms)
The EOG uses three item types:
1. **Multiple choice** — 4 options (A/B/C/D)
2. **Gridded response / Numeric entry** — student types a number
3. **Technology-enhanced** — drag-and-drop, matching, ordering

MathAthlone maps to these as:
- Static questions → **Multiple choice** (exact match)
- Generator questions → **Gridded response / Numeric entry** (exact match)
- Visual generators (future) → **Technology-enhanced** (partial match)

### NC EOG wording conventions
From reviewing released forms, NC uses these wording patterns:

| Context | NC wording style | MathAthlone example |
|---|---|---|
| Solve for a value | "What is the value of x?" | "Solve for x: 3x + 7 = 22" |
| Find a measurement | "What is the area, in square centimeters?" | "Find the area of the triangle." |
| Real-world rate | "A cafeteria orders milk in a ratio of 1 to 3. What is the ratio of..." | "A car travels 4 miles on 6 gallons. How many miles on 12 gallons?" |
| Percent | "What is the percent decrease?" | "A value changed from 100 to 80. What is the percent decrease?" |
| Identify/classify | "Which of the following is an irrational number?" | Static MC question |
| Error analysis | "A student evaluated 3+4×2=14. What did the student do wrong?" | Static MC question |

**Key wording alignment issues to address:**
- NC uses "What is the value of..." — our generators often say "Find..."
  Both are acceptable but "What is the value of" is more EOG-aligned
- NC specifies units in the question ("in square centimeters") —
  our generators should match this
- NC uses "approximately" when rounding is expected —
  our generators should use this for π-based calculations

---

## DOK Distribution Alignment

NC EOG specifies item distribution by Webb's Depth of Knowledge:

### EOG Mathematics Grades 6–8 DOK targets
| DOK Level | Description | Target % |
|---|---|---|
| DOK 1 | Recall and Reproduction | ~25% |
| DOK 2 | Skills and Concepts | ~55% |
| DOK 3 | Strategic Thinking | ~20% |
| DOK 4 | Extended Thinking | 0% (not on EOG) |

### MathAthlone profile to DOK mapping
| MathAthlone Profile | DOK equivalent | % of heat |
|---|---|---|
| Warm-Up (procedural, low) | DOK 1 | ~25% |
| Standard (application, medium) | DOK 2 | ~55% |
| Challenge (reasoning, medium) | DOK 2-3 | ~20% |
| Deep (synthesis, high) | DOK 3 | Rare |

**Status:** This alignment is theoretical. The `cognitive_demand`,
`complexity`, and `context` columns in `question_generators` are
currently NULL. A backfill migration is needed to activate
profile-driven question selection and make this alignment real.

---

## EOG Domain Weight Distribution — Grades 6–8

NC specifies how many questions come from each domain. MathAthlone
should match these proportions in Mixed heats.

### Grade 6
| Domain | NC Weight | MathAthlone generators |
|---|---|---|
| The Number System | ~30% | 12 generators (g6_ns_*) |
| Ratios & Proportional Relationships | ~25% | 7 generators (g6_rp_*) |
| Expressions & Equations | ~25% | 6 generators (g6_ee_*) |
| Geometry | ~10% | 5 generators (g6_geo_*) |
| Statistics & Probability | ~10% | 4 generators (g6_sp_*) |

### Grade 7
| Domain | NC Weight | MathAthlone generators |
|---|---|---|
| Ratios & Proportional Relationships | ~25% | 5 generators (g7_rp_*) |
| The Number System | ~20% | 4 generators (g7_ns_*) |
| Expressions & Equations | ~25% | 6 generators (g7_ee_*) |
| Geometry | ~20% | 6 generators (g7_geo_*) |
| Statistics & Probability | ~10% | 4 generators (g7_sp_*) |

### Grade 8
| Domain | NC Weight | MathAthlone generators |
|---|---|---|
| Expressions & Equations | ~35% | 8 generators (g8_ee_*) |
| Functions | ~25% | 5 generators (g8_f_*) |
| The Number System | ~10% | 4 generators (g8_ns_*) |
| Geometry | ~20% | 7 generators (g8_geo_*) |
| Statistics & Probability | ~10% | 2 generators (g8_sp_*) |

**Note:** These weights are approximate from the EOG specifications.
A Mixed heat drawing equally from all generators will not match
these proportions exactly. A future enhancement is to weight the
generator deck by domain to match EOG distribution.

---

## Specific Alignment Checks — Released Item Examples

These are paraphrased examples from NC released forms that
directly correspond to MathAthlone generators. Use them to
verify wording and difficulty calibration.

### G6 — Ratios (g6_rp_calculate_unit_rate)
NC EOG style: "A school cafeteria orders plain milk and
chocolate milk in a ratio of 1 to 3. What is the ratio of
plain milk to total milk ordered?"

MathAthlone style: "A box of 90 apples costs $3.
What is the unit rate in dollars per apple?"

Alignment: ✅ Both are ratio/rate word problems at DOK 2.
Note: NC uses "ratio" vocabulary explicitly — consider adding
ratio framing to unit rate questions.

### G7 — Circle measurements (g7_circle_area_circumference)
NC EOG style: "Circle G has a radius of 6.5 cm. The area of
the shaded portion is 25.7 cm². What is the approximate length
of the shortest distance on the circle from point N to point P?"

MathAthlone style: "Find the circumference of a circle with
radius 5 cm. Use π ≈ 3.14159."

Alignment: ⚠️ NC uses visual context (shaded regions, arc length)
which requires a diagram. Our generator is text-only and simpler.
This is a strong candidate for a visual generator upgrade.

### G7 — Statistics (g7_experimental_probability)
NC EOG style: "The table shows the quiz grades for students
in two biology classes. Which statement correctly compares
the two classes?"

MathAthlone style: Generator produces probability fraction
from frequency table data.

Alignment: ✅ Both are data interpretation at DOK 2.

### G8 — Expressions (g8_simplify_exponents)
NC EOG style: "Two expressions are shown. In Expression Two,
x is a positive integer. The value of Expression Two is 25
times the value of Expression One. What is the value of x?"

MathAthlone style: Generator produces exponent simplification
problems.

Alignment: ⚠️ NC uses comparative/relational framing at DOK 2-3.
Our generators are more procedural (DOK 1-2). Consider adding
comparative question variants at higher difficulty levels.

---

## NC Gridded Response Format — Validator Alignment

NC EOG numeric entry specifies:
> "Only 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ., -, and / are allowed
> in your answer. Mixed numbers are entered by adding a space
> after the whole number."

MathAthlone validator must accept the same formats:
- Integers: `42`
- Decimals: `3.14`
- Fractions: `3/4`
- Negative numbers: `-5`
- Mixed numbers: `2 3/4` (space between whole number and fraction)

**Current gap:** The MathAthlone validator may not accept
`2 3/4` (mixed number with space). This should be tested
and added if missing. NC students are trained to enter
mixed numbers this way.

---

## NC Math 1 EOC Alignment (ALG1)

NC Math 1 EOC covers:
- Linear functions and equations
- Systems of equations
- Exponential functions
- Statistics (regression, correlation)
- Sequences

MathAthlone ALG1 generators cover all of these.
EOC released form available at:
https://www.dpi.nc.gov/documents/accountability/testing/eoc/eoc-nc-math-1-released-form

---

## How to Use Released Items for Generator Calibration

**Step 1 — Download the released form**
Go to the URL for the relevant course above and download the PDF.

**Step 2 — Map each released item to a generator**
For each released item, identify which MathAthlone generator
produces the same type of question. Note the DOK level NC assigns.

**Step 3 — Run the generator at equivalent difficulty**
Call the generator at the difficulty level that should match the
released item's DOK. Compare:
- Is the mathematical concept the same?
- Is the difficulty comparable?
- Is the wording style similar?
- Does the answer type match NC's gridded response format?

**Step 4 — Flag mismatches**
Three types of mismatches:
1. **Too easy** — generator difficulty 4 produces a DOK 1 problem
   → difficulty calibration fix needed
2. **Wrong format** — NC uses "What is the ratio of X to Y?"
   but generator says "Find the unit rate" → wording update
3. **Missing visual** — NC question requires a diagram but
   generator is text-only → visual generator needed

**Step 5 — Update generators or add static questions**
- If wording is off → update the generator template
- If difficulty is wrong → update the difficulty parameter ranges
- If visual is needed → add to visual generator backlog
- If concept is missing → add new generator or static question

---

## Priority Alignment Actions

These are the highest-value improvements based on the released
form review:

| Priority | Action | Course | Impact |
|---|---|---|---|
| 1 | Backfill cognitive_demand/complexity/context in DB | All | Activates profile-driven selection |
| 2 | Add mixed number validator support (`2 3/4`) | All | Matches NC gridded response format |
| 3 | Add comparative question variants to exponent generators | G8 | Raises DOK level to match EOC |
| 4 | Add arc length / shaded region visual generator | G7 | Matches circle EOG items |
| 5 | Weight generator deck by domain to match EOG distribution | G6-8 | Mixed heat better mirrors EOG |
| 6 | Add ratio vocabulary to unit rate generators | G6 | Matches NC terminology |

---

## NC Check-Ins Alignment (Formative)

NC also provides Check-In assessments (NC Check-Ins 2.0) for
grades 3–8, administered 3 times per year as formative checkpoints.

Specs: https://www.dpi.nc.gov (search "NC Check-Ins Mathematics Specifications")

MathAthlone heats function similarly to Check-Ins:
- Short duration (15–25 min vs full EOG at 180 min)
- Concept-targeted (teacher selects topics)
- Immediate results

This is a strong pedagogical alignment argument for school
partnerships: "MathAthlone heats function as competitive
Check-In replacements — same rigor, more engagement."

---

## NAEP Alignment (National)

For grant applications targeting federal funding, NAEP
(National Assessment of Educational Progress) alignment
strengthens the case.

NAEP Grade 8 Math released items:
https://www.nationsreportcard.gov/nqt/

NAEP uses the same DOK framework and similar domain
distributions to NC EOG. Any question aligned to NC EOG
is implicitly aligned to NAEP at the same grade level.

---

*Mpingo Systems LLC — Precision Tools built to stay.*
*Contact: eddy@mpingo.ai*
