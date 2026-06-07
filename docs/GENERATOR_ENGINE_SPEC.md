# MathAthlone — Generator Quality & Validation Engine Specification
**Version:** 1.0 | **Author:** Mpingo Systems LLC | **Date:** June 2026

---

## Purpose

This document specifies the quality standards, validation rules, and testing requirements 
for the MathAthlone question generation engine. It serves as the contract between curriculum 
design and engineering implementation.

---

## 1. Generator Architecture

### 1.1 Generator Registry

Every generator must be registered in `GENERATORS` in `src/lib/competition/generators.ts`:

```typescript
// Correct registration pattern
GENERATORS['g7_add_rational'] = g7AddRational;

// Each generator function signature
type GeneratorFn = (difficulty: number) => GeneratedQuestion;

interface GeneratedQuestion {
  question: string;          // Human-readable question text
  answer: string;            // Canonical correct answer
  solution_steps: string[];  // Step-by-step solution
  concept_name: string;      // Human-readable concept name
  answer_type: AnswerType;   // Must match question_generators.answer_type in DB
}
```

### 1.2 Naming Convention

| Course | Prefix | Example |
|---|---|---|
| NC Math 1 (legacy) | `m1_` | `m1_linear_eq_two_step` |
| Math Fundamentals | `mf_` | `mf_absolute_value` |
| NC Grade 6 | `g6_` | `g6_ns_add_sub_decimals` |
| NC Grade 7 | `g7_` | `g7_add_rational` |
| NC Grade 8 | `g8_` | `g8_eval_roots` |
| Algebra 1 | `alg1_` | `alg1_solve_two_step` |
| NC Math 2 | `m2_` | `m2_quadratic_vertex` |
| NC Math 3 | `m3_` | `m3_evaluate_function` |
| Algebra 2 | `alg2_` | `alg2_polynomial_zeros` |
| AP Precalc | `appc_` | `appc_unit_circle` |

**Rule:** The `generator_type` key in `GENERATORS` must exactly match the `generator_type` 
column in `question_generators` table. No exceptions.

### 1.3 ID Source of Truth

The generator ID comes from the `id` field in the course's `_generators.json` file.
**Never invent a new ID.** If the JSON spec has `g6_ns_add_sub_decimals`, that is the ID.

---

## 2. Answer Correctness Requirements

### 2.1 Mathematical Correctness

Every generator must produce mathematically correct answers for ALL parameter combinations.

**Verification method:** Run 1000 calls at each difficulty level, check:
- Answer parses correctly to the declared answer_type
- Answer matches the result of independently computing from the question parameters
- No floating-point drift (use integer arithmetic internally when possible)

### 2.2 Canonical Form Rules

| Answer Type | Canonical Form | Examples |
|---|---|---|
| `integer` | No decimal point, no leading zeros | `42` not `42.0` |
| `decimal` | Max 2 decimal places unless precision required | `3.14` not `3.1415926` |
| `fraction` | Fully reduced | `3/4` not `6/8` |
| `expression` | Simplified, no coefficient of 1 | `x + 2` not `1x + 2` |
| `equation` | Slope-intercept unless specified | `y = 2x + 3` not `2x - y = -3` |
| `ordered_pair` | Space after comma | `(2, -11)` not `(2,-11)` |
| `inequality` | Variable on left | `x > 3` not `3 < x` |

### 2.3 Degeneracy Guards

Every generator must guard against:

```typescript
// Required checks before returning a question
const DEGENERACY_GUARDS = {
  division_by_zero: 'Re-roll if any denominator could be 0',
  trivial_answer: 'Re-roll if answer is 0 when concept requires non-zero',
  coefficient_one: 'Re-roll if leading coefficient is 1 for factoring questions',
  identical_operands: 'Re-roll if both operands are the same (trivial)',
  degenerate_geometry: 'Re-roll if shape dimensions produce area/volume of 0',
  negative_probability: 'Re-roll if any probability would be negative',
  imaginary_result: 'Re-roll if square root of negative (unless complex numbers)',
  overflow: 'Cap parameter ranges to prevent answers > 10,000',
};
```

### 2.4 Difficulty Scaling

Every generator must produce meaningfully different questions at each difficulty:

| Difficulty | Parameter range | Answer complexity |
|---|---|---|
| 1 (Bronze) | Small integers, simple fractions | Single step, integer answer |
| 2 (Silver) | Multi-digit, mixed numbers | 2-3 steps, decimal/fraction |
| 3 (Gold) | Larger numbers, negative values | Multi-step, careful arithmetic |
| 4 (Platinum) | Edge cases, mixed types | Complex multi-step |

---

## 3. Validation Engine

### 3.1 Answer Validation Rules by Type

```typescript
// src/lib/competition/validation.ts — required cases

'integer': (student, correct) => 
  parseInt(student.trim()) === parseInt(correct),

'decimal': (student, correct) => 
  Math.abs(parseFloat(student) - parseFloat(correct)) < 0.01,

'fraction': (student, correct) => 
  toDecimal(student) === toDecimal(correct),  // 3/4 == 6/8 == 0.75

'decimal_or_fraction': (student, correct) =>
  Math.abs(toDecimal(student) - toDecimal(correct)) < 0.01,

'ordered_pair': (student, correct) => {
  const s = parsePair(student);  // handles (2,-11), (2, -11), 2,-11
  const c = parsePair(correct);
  return s[0] === c[0] && s[1] === c[1];
},

'expression': (student, correct) =>
  normalizeExpression(student) === normalizeExpression(correct),
  // normalizeExpression: sort terms, remove spaces, canonical form

'equation': (student, correct) =>
  parseSlope(student) === parseSlope(correct) &&
  parseIntercept(student) === parseIntercept(correct),

'inequality': (student, correct) =>
  normalizeInequality(student) === normalizeInequality(correct),
  // handles >=, ≥, <=, ≤, >, <

'text': (student, correct) =>
  student.trim().toLowerCase() === correct.trim().toLowerCase(),
```

### 3.2 Unit Handling (Option B — Future Implementation)

When unit-bearing answer types are added:

```typescript
'integer_with_unit': (student, correct) => {
  const studentVal = parseNumericPart(student);    // "478 cm²" → 478
  const studentUnit = parseUnitPart(student);      // "478 cm²" → "cm²"
  const correctVal = parseNumericPart(correct);
  const correctUnit = parseUnitPart(correct);
  return studentVal === correctVal && unitsEquivalent(studentUnit, correctUnit);
  // unitsEquivalent: "cm²" == "cm2" == "sq cm" == "square centimeters"
},
```

---

## 4. The Reconciliation Standard

When implementing generators from JSON specs:

### 4.1 Faithfulness Requirements

| Field | Requirement |
|---|---|
| `id` / `generator_type` | Must match JSON `id` field exactly |
| `answer_type` | Must match JSON `answer_type` field exactly |
| `concept_id` | Must link to correct `atomic_concepts.lesson_number` |
| `params` | Must use JSON `params` object to drive randomization |
| `description` | Must implement the described behavior (not a simplified version) |

### 4.2 Reconciliation Audit Query

Run this after every generator sprint to confirm faithfulness:

```sql
-- Generators in DB that DON'T match their JSON spec answer_type
-- (requires manual comparison with JSON file)
SELECT generator_type, answer_type
FROM question_generators
WHERE generator_type LIKE 'g7_%'
ORDER BY generator_type;
-- Compare output against NC_Grade_7_generators.json answer_type fields
```

### 4.3 Reconciliation Priority Order

When TypeScript ID ≠ JSON spec ID:

1. **Update DB:** `UPDATE question_generators SET generator_type = 'json_id' WHERE generator_type = 'ts_id'`
2. **Update GENERATORS map:** rename key in generators.ts
3. **Update format hints:** if answer_type changed, verify formatHintFor() coverage
4. **Re-run isolation check:** confirm pool isolation still holds

---

## 5. Migration SQL Standards

### 5.1 Use CTE+JOIN Pattern (Required)

```sql
-- CORRECT — NULL-safe CTE+JOIN pattern
WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES 
    ('M7.NS.1.2', 'g7_add_rational', 'decimal_or_fraction'),
    -- ... more rows
)
INSERT INTO question_generators (concept_id, generator_type, answer_type, is_active)
SELECT ac.id, dg.generator_type, dg.answer_type, TRUE
FROM desired_generators dg
INNER JOIN atomic_concepts ac ON ac.lesson_number = dg.lesson_number
ON CONFLICT (generator_type) DO NOTHING;
```

```sql
-- WRONG — subquery NULL trap (never use)
INSERT INTO question_generators (concept_id, generator_type, answer_type, is_active)
VALUES (
  (SELECT id FROM atomic_concepts WHERE lesson_number = 'M7.NS.1.2'),
  'g7_add_rational', 'decimal_or_fraction', TRUE
);
-- If lesson_number doesn't exist, concept_id is NULL — silent failure
```

### 5.2 Required Verification Block

Every migration must end with:

```sql
SELECT 
  COUNT(*) AS rows_seeded,
  25 AS rows_expected  -- update to match actual count
FROM question_generators qg
JOIN atomic_concepts ac ON ac.id = qg.concept_id
JOIN unit_topics ut ON ut.id = ac.unit_topic_id
JOIN courses c ON c.id = ut.course_id
WHERE c.code = 'G7';  -- update to match course
```

### 5.3 Isolation Check (Required After Every Migration)

```sql
-- Must return 0 rows
SELECT qg.generator_type, c.code
FROM question_generators qg
JOIN atomic_concepts ac ON ac.id = qg.concept_id
JOIN unit_topics ut ON ut.id = ac.unit_topic_id
JOIN courses c ON c.id = ut.course_id
WHERE qg.generator_type LIKE 'g7_%'  -- update prefix
  AND c.code != 'G7';                 -- update course code
```

---

## 6. Session Handover Protocol

At the end of every development session involving generators:

### 6.1 State to Record

```
GENERATORS BUILT THIS SESSION:
  Course: [code]
  TypeScript functions: [list of generator_types]
  Migration file: [filename]
  rows_seeded: [n] / rows_expected: [n]
  Isolation check: PASS / FAIL
  answer_type corrections needed: [list or none]
  NULL concept_ids: [list or none]

DEFERRED ITEMS:
  [ ] Generators not yet built from JSON spec: [list]
  [ ] Reconciliation needed: [list of ID mismatches]
  [ ] answer_type corrections in DB: [SQL to run]

NEXT SESSION SHOULD:
  1. [specific next action]
  2. [specific next action]
```

### 6.2 Audit Log Update

After every session, regenerate `docs/CURRICULUM_AUDIT_LOG.md`:

```
Chat: regenerate docs/CURRICULUM_AUDIT_LOG.md 
reflecting current DB state for all 9 pools
```

---

## 7. Future Engine Improvements

### 7.1 3-Axis Question Delivery (Planned)

Add columns to `question_generators`:
```sql
ALTER TABLE question_generators ADD COLUMN cognitive_demand TEXT;
ALTER TABLE question_generators ADD COLUMN complexity TEXT;
ALTER TABLE question_generators ADD COLUMN context TEXT;
```

Heat creation uses 3-axis to match questions to preset profiles:
- Warm-Up: cognitive_demand=recall OR procedural, complexity=low
- Standard: cognitive_demand=procedural, complexity=low OR medium
- Challenge: cognitive_demand=application, complexity=medium OR high
- Championship: cognitive_demand=reasoning, complexity=high

### 7.2 Automated Generator Test Runner (Planned)

```typescript
// scripts/test-generators.ts
async function testAllGenerators() {
  for (const [generatorType, fn] of Object.entries(GENERATORS)) {
    const errors = [];
    for (let i = 0; i < 1000; i++) {
      const difficulty = [1,2,3,4][i % 4];
      try {
        const result = fn(difficulty);
        // Verify answer parses to declared answer_type
        // Verify answer matches computed value
        // Verify no degenerate output
      } catch (e) {
        errors.push({ i, difficulty, error: e.message });
      }
    }
    console.log(`${generatorType}: ${errors.length === 0 ? 'PASS' : 'FAIL'} (${errors.length} errors)`);
  }
}
```

### 7.3 Visual Generator Pipeline (Planned)

When visual generators are built:
1. Read specs from `*_visual.json` files
2. Implement SVG generation in `visual-generators.ts`
3. Link to `question_generators` via `visual_category` field
4. Verify: answer NOT readable from SVG alone

---

*Mpingo Systems LLC — Precision Tools built to stay.*
