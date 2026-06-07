# MathAthlone — Concept Suitability Matrix Framework
**Version:** 1.0 | **Author:** Mpingo Systems LLC | **Date:** June 2026

---

## Purpose

This document defines the universal evaluation framework for classifying every atomic concept 
across all MathAthlone courses. It applies to current courses and all future additions.

The output of applying this framework is a **Concept Suitability Matrix (CSM)** — a structured 
classification that determines exactly how each concept is served in competition heats.

---

## The Three Suitability Dimensions

Every atomic concept is evaluated on three dimensions before any question is written or built.

---

### Dimension 1: Question Delivery Format

**Question:** How should this concept be assessed in a timed competition?

| Classification | Definition | Examples |
|---|---|---|
| **Group A — Generator** | Concept can be assessed via infinite procedural generation. Parameters vary; answer is always computable. | Solve 2x+3=11, Find slope of (2,5)(4,9), Volume of prism |
| **Group B — Static MC** | Concept requires fixed question/distractor design. Cannot be meaningfully parameterized. | Identify which graph is a function, Classify a number as rational |
| **Hybrid — Both** | Concept benefits from both procedural generation AND misconception-targeted MC. | Percent change (FR for computation, MC for conceptual errors) |

**Decision rules:**

```
Is the answer computable from parameters?
  YES → Can parameters be varied without changing the concept?
          YES → Group A (Generator)
          NO  → Group B (Static MC)
  NO  → Is there a canonical misconception pattern worth testing?
          YES → Group B or Hybrid
          NO  → Exclude from question bank (not assessable in timed format)
```

**Disqualifying conditions for Group A:**
- Answer requires human judgment (e.g., "Is this a good statistical question?")
- Answer is a graph, sketch, or drawing
- Answer depends on interpretation of ambiguous context
- Concept is vocabulary/definition only (no computation)

---

### Dimension 2: Visual Requirement

**Question:** Does this concept require a visual to be fairly assessed?

| Classification | Definition | SVG Category |
|---|---|---|
| **No visual** | Question is fully self-contained in text | — |
| **Category A — Labeled diagram** | Shape, figure, or geometric diagram with measurements | Triangles, prisms, coordinate planes |
| **Category B — Data display** | Table, graph, coordinate plane, ratio table | Function graphs, scatter plots, tables |
| **Category C — Number line** | Linear representation, ordering, absolute value | Number lines, inequality graphs |
| **Category D — Statistical display** | Box plots, dot plots, histograms | Distribution displays |
| **Category E — Probabilistic display** | Tree diagrams, Venn diagrams, sample space tables | Compound probability |

**Decision rules:**

```
Can the question be answered without a visual?
  YES → No visual required (text-based generator)
  NO  → What type of visual?
    Geometric figure with measurements → Category A
    Coordinate plane or table → Category B  
    Number line or ordering → Category C
    Statistical distribution → Category D
    Probability model → Category E
```

**Critical rule:** The answer must NEVER be readable from the visual alone.
The visual provides context; the student computes the answer.

---

### Dimension 3: Answer Type

**Question:** What is the canonical form of the correct answer?

| Answer Type | Format | Example | Hint shown |
|---|---|---|---|
| `integer` | Whole number | `42` | "Enter a whole number" |
| `decimal` | Decimal number | `3.14` | "Enter a decimal number, e.g. 3.14" |
| `fraction` | a/b form | `3/4` | "Enter as a/b, e.g. 3/4" |
| `decimal_or_fraction` | Either form accepted | `0.75` or `3/4` | "Enter a number or fraction" |
| `decimal_or_integer` | Either form | `4` or `3.5` | "Enter a whole number or decimal" |
| `ordered_pair` | (x, y) | `(2, -11)` | "Enter as (x, y), e.g. (2, -11)" |
| `expression` | Simplified algebraic | `3x + 2` | "Simplify fully, e.g. 3x + 2" |
| `equation` | y = mx + b form | `y = 2x + 3` | "Enter as y = mx + b" |
| `inequality` | x > 3 form | `x > -1` | "Enter as x > 3 or x ≤ -1" |
| `interval` | Interval notation | `(2, ∞)` | "Enter as (2, ∞) or [-3, 5)" |
| `text` | Short string answer | `"linear"` | "Enter your answer as shown" |
| `MC` | Letter choice | `B` | (no hint — button selection) |

**Decision rules:**
```
Is the answer a single number?
  Is it always a whole number? → integer
  Could it be a decimal? → decimal
  Could it be a fraction? → fraction or decimal_or_fraction

Is the answer an algebraic object?
  Simplified polynomial/expression → expression
  Equation of a line → equation
  Inequality → inequality
  Interval → interval

Is the answer a coordinate? → ordered_pair
Is the answer a categorical string? → text
Is the answer a letter choice? → MC
```

**Unit rule:** If the answer carries a unit of measurement (cm², m³, mph):
- Option A (current): Strip unit, accept numeric only, show unit in question text
- Option B (future): Require unit in answer, e.g. `478 cm²`
- Decision per concept based on whether unit IS the concept being tested

---

## The Suitability Matrix Template

Apply this template to every atomic concept when building a new course:

```
CONCEPT: [lesson_number] — [concept_name]
Standard: [CCSS/NC standard code]

DIMENSION 1 — DELIVERY FORMAT
  Classification: [ Group A | Group B | Hybrid ]
  Justification: [one sentence]
  If Group A: generator_type = [snake_case_id]
  If Group B or Hybrid: misconception_targeted = [what error does the MC catch?]

DIMENSION 2 — VISUAL REQUIREMENT  
  Requires visual: [ Yes | No ]
  If Yes: category = [ A | B | C | D | E ]
  Visual spec: [brief description of what the SVG shows]
  Critical rule: [what must NOT appear in the visual]

DIMENSION 3 — ANSWER TYPE
  answer_type = [from canonical list above]
  Format hint = [exact string shown to student]
  Validation rule = [how equivalence is checked]
  Unit handling = [strip | require | N/A]

QUALITY FLAGS
  DOK level: [ 1 | 2 | 3 ]
  Cognitive demand: [ recall | procedural | application | reasoning ]
  Complexity: [ low | medium | high ]
  Context: [ abstract | real_world ]
  EOG domain weight: [% range from state specs]
  Cross-division eligible: [ Yes | No ]
  
OPEN ISSUES
  [ ] answer_type confirmed in DB
  [ ] generator tested 100x (no degenerate cases)
  [ ] static MC misconception documented
  [ ] visual spec complete
  [ ] EOG item mapped (if applicable)
```

---

## Batch Classification Process

When building a new course, classify ALL concepts before writing any code:

### Step 1: Extract concepts from curriculum map
List all atomic concepts with their lesson_numbers and standards.

### Step 2: Apply Group classification
For each concept, apply Dimension 1 decision tree.
Result: Group A / Group B / Hybrid count.

### Step 3: Flag visual requirements
For each Group A or Hybrid concept, apply Dimension 2 decision tree.
Result: Visual category or "none" per concept.

### Step 4: Assign answer types
For each Group A or Hybrid concept, apply Dimension 3 decision tree.
Result: answer_type + format hint per concept.

### Step 5: EOG/AP alignment check
Map each concept to its domain weight in state specs.
Flag concepts that are over/under-represented.

### Step 6: Approve the matrix
Review before writing any TypeScript or SQL.
The matrix is the contract — implementations must match it exactly.

---

## Quality Standards Per Classification

### Group A Generator Standards
- [ ] Generates correct answers for ALL parameter combinations
- [ ] No degenerate cases (zero denominators, trivial answers, undefined operations)
- [ ] Parameters produce varied difficulty (at least 3 difficulty tiers)
- [ ] Answer is in canonical simplified form (no unreduced fractions, no "1x")
- [ ] Real-world generators use varied, culturally representative contexts
- [ ] Tested: 1000 calls produce 0 errors (automated)
- [ ] Answer type matches DB entry in question_generators
- [ ] Format hint is unambiguous and does not leak answer

### Group B Static MC Standards
- [ ] Exactly 4 options (A, B, C, D)
- [ ] Each distractor targets a specific, documented misconception
- [ ] No "all of the above" / "none of the above"
- [ ] Correct answer is not systematically position-biased
- [ ] Question stem is self-contained (no external reference needed)
- [ ] Explanation documents WHY each wrong answer is wrong
- [ ] DOK level documented
- [ ] Difficulty integer (1-4) assigned

### Visual Generator Standards
- [ ] Answer NEVER encoded in visual
- [ ] viewBox minimum 400×300
- [ ] aria-label present for accessibility
- [ ] Answer-relevant values hidden or labeled "?"
- [ ] SVG renders correctly on mobile (no fixed pixel widths)
- [ ] Color is not the ONLY distinguishing feature (accessibility)

---

## Course Build Checklist

When adding a new course to MathAthlone:

### Pre-build (do before writing any code)
- [ ] Curriculum map created with all atomic concepts
- [ ] Group A/B/Hybrid classification complete
- [ ] Visual requirements flagged
- [ ] Answer types assigned
- [ ] EOG/AP domain alignment verified
- [ ] Concept Suitability Matrix approved

### Build phase
- [ ] Group A generators implemented from spec (exact IDs, answer_types)
- [ ] Group B static MC questions written (misconceptions documented)
- [ ] Visual specs written (answer never in visual)
- [ ] Migration SQL written (CTE+JOIN pattern, not subqueries)
- [ ] pnpm build clean after each batch

### Post-seed verification
- [ ] rows_seeded == rows_expected
- [ ] Zero cross-pool contamination (isolation check)
- [ ] No NULL concept_ids in question_generators
- [ ] answer_type corrections applied if needed
- [ ] Curriculum audit log updated

### Quality gate (before pilot)
- [ ] 100-call test per generator (no errors)
- [ ] Heat created and tested end-to-end
- [ ] Format hints display correctly
- [ ] Results page shows correct concept mastery

---

*Mpingo Systems LLC — Precision Tools built to stay.*
