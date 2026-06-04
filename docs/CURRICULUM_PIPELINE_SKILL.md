# MathAthlone Curriculum Pipeline
### How a JSON Curriculum Becomes Live Competition Questions

**For:** Content authors, developers adding new courses, grant reviewers
**Version:** 1.0 — June 2026
**Mpingo Systems LLC**

---

## Overview

MathAthlone delivers three types of questions in every Heat, each sourced differently from the curriculum database. Understanding this pipeline is essential for adding new courses (Math 2, Pre-Calc, Grade 7-8) and maintaining question quality.

```
JSON Curriculum File (e.g., NC_Math_1.json)
    │
    ├── divisions (grade bands)
    │     └── division_curricula (links division ↔ course)
    │
    ├── courses (e.g., NC Math 1)
    │     └── unit_topics (8 for NCM1)
    │           └── atomic_concepts (111 for NCM1)
    │                 ├── question_generators (54 procedural)  → FREE-RESPONSE
    │                 ├── static_questions (42 text MC)        → MULTIPLE CHOICE
    │                 └── VISUAL_GENERATORS (12 SVG-based)     → MULTIPLE CHOICE
    │
    └── Heat Creation
          └── question-delivery.ts mixes all three types
              at the configured FR/MC ratio (default 40/60)
```

---

## 1. The Curriculum Hierarchy

### Database Schema

```
divisions
  ├── id, name, code, grade_min, grade_max
  └── division_curricula → links to courses

courses
  ├── id, code ("NCM1"), name ("NC Math 1")
  └── unit_topics (FK: course_id)
        ├── id, name, code ("EQN", "FLF", "SYS", etc.)
        ├── display_order
        └── atomic_concepts (FK: unit_topic_id)
              ├── id, name, lesson_number ("M1.EQN.1.1")
              ├── description
              └── question_generators (FK: concept_id → atomic_concepts.id)
                    ├── id (UUID)
                    ├── generator_type ("linear_eq_two_step")
                    ├── answer_type ("integer", "fraction", "equation", etc.)
                    └── is_active (boolean)
```

### NC Math 1 Example (MVP)

| Unit Topic | Code | Atomic Concepts | Generators | Static Qs |
|---|---|---|---|---|
| Equations & Inequalities | EQN | 14 | 14 | ~8 |
| Functions & Linear Functions | FLF | 18 | 9 | ~10 |
| Systems of Eqns & Inequalities | SYS | 8 | 4 | ~6 |
| Exponents & Exponential Functions | EXP | 12 | 7 | ~4 |
| Polynomials & Factoring | POLY | 12 | 9 | ~4 |
| Quadratic Functions & Equations | QUAD | 16 | 4 | ~4 |
| Data Analysis & Statistics | DAS | 18 | 3 | ~4 |
| Geometric Transformations | GEO.TRANS | 13 | 4 | ~2 |
| **Totals** | | **111** | **54** | **42** |

Plus **12 visual (SVG) generators** covering geometry, graphing, scatter plots, and symmetry.

---

## 2. Three Question Types

### Type 1: Procedural Generators (Free-Response)

**Source:** `src/lib/competition/generators.ts`
**DB table:** `question_generators`
**Identified by:** `heat_questions.generator_id IS NOT NULL`
**CTA weight:** 2× in Content score (production vs recognition)

These are TypeScript functions that generate infinite unique questions by randomizing parameters. Every call produces a different problem with the same concept.

**Example:** `linear_eq_two_step`
```typescript
// Input: difficulty 2
// Output: "Solve: 3x + 7 = 22"
// Answer: "5" (answer_type: "integer")
// Every call generates different coefficients
```

**Generator registry (54 generators):**

| Category | Count | Generator Types | Answer Types |
|---|---|---|---|
| Equations & Inequalities | 14 | evaluate_expression, simplify_expression, linear_eq_one_step_add, linear_eq_one_step_mult, linear_eq_two_step, linear_eq_multi_step, linear_eq_both_sides, abs_value_equation, literal_equation, inequality_one_step_add, inequality_one_step_mult, inequality_multi_step, compound_inequality, abs_value_inequality | integer, fraction, inequality, interval, text |
| Linear Functions | 9 | evaluate_function, calculate_slope, write_linear_eq, write_linear_eq_points, point_slope_form, convert_linear_forms, parallel_line_slope, perp_line_slope, write_parallel_perp_eq | integer, fraction, equation, text |
| Systems | 4 | system_substitution, system_elimination_basic, system_elimination_mult, system_solution_type | ordered_pair, text |
| Exponents | 7 | evaluate_exponent, exponent_product_quotient, exponent_power_rules, exponent_zero_negative, exponent_simplify_all, identify_growth_decay, write_exponential_eq | integer, expression, text, equation |
| Polynomials | 9 | add_polynomials, subtract_polynomials, multiply_mono_poly, multiply_binomials, factor_gcf, factor_trinomial_a1, factor_trinomial_a_ne_1, factor_diff_squares, factor_perfect_square | expression |
| Quadratics | 4 | quadratic_vertex, quadratic_factor_solve, quadratic_sqrt_solve, quadratic_formula | ordered_pair, integer_pair, text |
| Statistics | 3 | calculate_central_tendency, calculate_variability, calculate_residual | integer, decimal |
| Transformations | 4 | translate_point, reflect_point, rotate_point, transform_sequence | ordered_pair |

**Answer format requirements per type:**

| answer_type | Format hint shown to student | Validation |
|---|---|---|
| integer | "Enter a whole number (e.g., 5)" | parseInt, exact match |
| decimal | "Enter a number (e.g., 3.5)" | parseFloat, ±0.01 tolerance |
| fraction | "Enter as a fraction (e.g., 3/4)" | Numeric equivalence (6/8 = 3/4) |
| equation | "Format: y = mx + b" | Parse slope-intercept, compare m and b |
| ordered_pair | "Format: (x, y)" | Parse both values, exact match |
| integer_pair | "Format: {a, b}" | Parse both, order-independent |
| expression | "Enter the simplified expression" | Strip whitespace, string compare |
| inequality | "Format: x > 5 or x ≤ -3" | Normalize operators, compare |
| interval | "Format: (a, b) or [a, b]" | Parse bracket type + endpoints |
| text | "Enter your answer exactly" | Lowercase, strip whitespace, synonym map |

**Key rules for generator creation:**
1. Every generator MUST return mathematically correct answers (verified in audit)
2. Questions specifying a form (e.g., "in slope-intercept form") shift the answer format burden to the answer key
3. Answers must be the simplest form — no unreduced fractions, no "1x" instead of "x"
4. Difficulty is controlled by parameter ranges, not by changing the concept

### Type 2: Static Questions (Multiple Choice)

**Source:** `supabase/migrations/014c_seed_static_questions.sql`
**DB table:** `static_questions`
**Identified by:** `heat_questions.generator_id IS NULL` + no SVG in question_text
**CTA weight:** 1× in Content score (recognition)

Pre-written MC questions stored in the database. Used for concepts where procedural generation isn't practical (interpretation, reasoning, real-world context).

**Schema:**
```sql
static_questions (
  id UUID,
  concept_id TEXT,          -- lesson_number e.g., "M1.DAS.1.1" (NOT a UUID FK)
  question_text TEXT,
  question_latex TEXT,
  options JSONB,            -- ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer TEXT,      -- "A", "B", "C", or "D"
  difficulty INTEGER,       -- 1-4
  is_active BOOLEAN
)
```

**Important:** `concept_id` is a TEXT field containing the lesson_number (e.g., "M1.DAS.3.2"), NOT a UUID. The loader in `question-delivery.ts` resolves this via:
```
atomic_concepts.lesson_number → static_questions.concept_id
```

**Current distribution:** 42 static questions across all 8 unit topics, difficulty 1-3. Most have only 1-2 questions per concept, which means the static pool is often exhausted and backfill to FR kicks in.

### Type 3: Visual Generators (Multiple Choice, SVG-based)

**Source:** `src/lib/competition/visual-generators.ts`
**DB table:** none — generated at runtime, stored in heat_questions with generator_id = NULL
**Identified by:** `solution_steps.kind === 'visual'`
**CTA weight:** 1× in Content score (recognition, but from visual interpretation)

SVG-generating functions that produce coordinate planes, number lines, scatter plots, and geometric figures. Always MC (4 options: A/B/C/D).

**12 visual generators:**

| Key | Concept | SVG Output |
|---|---|---|
| inequality_number_line | Graphing Inequalities | Number line with open/closed dot + shading |
| vertical_line_test | Vertical Line Test | 4 mini-graphs, identify non-function |
| slope_intercept_graph | Graphing Slope-Intercept | Coordinate plane with plotted line |
| horiz_vert_lines | Horizontal/Vertical Lines | Coordinate plane with h/v line |
| two_var_inequality | Graphing 2-var Inequalities | Coordinate plane with shaded region |
| compare_functions | Comparing Functions | f(x) equation + g(x) table |
| system_graphing | Solving Systems by Graphing | Two intersecting lines |
| system_inequalities | System of Inequalities | Overlapping shaded regions |
| scatter_plot | Interpreting Scatter Plots | Random scatter with trend |
| transformation_type | Transformations | Before/after triangle |
| line_symmetry | Line Symmetry | Regular polygon with label |
| rotational_symmetry | Rotational Symmetry | Regular polygon with marked vertex |

**Visual questions are always MC** because the answer requires interpreting an image, not producing a value. The student selects from 4 shuffled text options.

---

## 3. How Questions Are Assembled into a Heat

### The Delivery Pipeline

When a teacher clicks "Create Heat," `question-delivery.ts` runs:

```
Input: {
  heatId, unitTopicId (or null for Mixed),
  depthMin, depthMax, questionCount,
  frRatio: 0.4, mcRatio: 0.6, mcVisualShare: 0.5
}

Step 1: Compute target counts
  mcTotal     = round(questionCount × mcRatio)     // e.g., 12 for 20Q
  frTarget    = questionCount - mcTotal              // e.g., 8
  visualTarget = round(mcTotal × mcVisualShare)      // e.g., 6
  staticTarget = mcTotal - visualTarget              // e.g., 6

Step 2: Load pools
  generators  = loadEligibleGenerators(supabase, unitTopicId)  // 54 for Mixed
  staticPool  = loadStaticPool(supabase, unitTopicId, depthMin, depthMax)  // ~33 for Silver
  visualKeyCount = Object.keys(VISUAL_GENERATORS).length  // 12

Step 3: Backfill if pools are short
  If staticPool < staticTarget → push overflow to visual → then to FR
  If visual cap < visualTarget → push overflow to static → then to FR
  Generators are effectively infinite → always absorb remaining

Step 4: Generate questions
  FR loop:    Call generateQuestion(generator.generator_type, difficulty)
  Static loop: Pick random from shuffled staticPool (without replacement)
  Visual loop: Call VISUAL_GENERATORS[key]() (without replacement per generator)

Step 5: Shuffle all inserts + assign question_numbers

Step 6: Insert into heat_questions
  FR rows:     generator_id = generator.id (UUID)
  Static rows: generator_id = null, solution_steps = { kind: 'static' }
  Visual rows: generator_id = null, solution_steps = { kind: 'visual', generator_key, concept_name }
```

### FR/MC Ratio by Heat Type

| Heat Type | FR | MC | Championship Use |
|---|---|---|---|
| Sprint | 40% | 60% | Default classroom |
| Target | 40% | 60% | Focused practice |
| Practice | 30% | 70% | Low-stakes, more MC |
| Championship | 50% | 50% | High-stakes, more FR |
| Official | 40% | 60% | Standard competition |

### CTA Content Score Impact

With 40% FR and 2× weight:
```
Effective Content credit from FR = (0.4 × 2) / (0.4 × 2 + 0.6 × 1) = 57%
Effective Content credit from MC = (0.6 × 1) / (0.4 × 2 + 0.6 × 1) = 43%
```

A student who aces free-response gets more Content credit despite answering fewer questions.

---

## 4. Adding a New Course (e.g., NC Math 2)

### Step 1: Create the JSON curriculum

```json
{
  "course_code": "NCM2",
  "course_name": "NC Math 2",
  "unit_topics": [
    {
      "code": "TRIG",
      "name": "Trigonometric Functions",
      "atomic_concepts": [
        {
          "lesson_number": "M2.TRIG.1.1",
          "name": "Defining Sine, Cosine, Tangent",
          "generators": ["trig_ratio_right_triangle"],
          "answer_type": "fraction"
        }
      ]
    }
  ]
}
```

### Step 2: Write the SQL migration

```sql
-- Insert course
INSERT INTO courses (code, name) VALUES ('NCM2', 'NC Math 2');

-- Insert unit topics
INSERT INTO unit_topics (course_id, code, name, display_order)
VALUES ((SELECT id FROM courses WHERE code = 'NCM2'), 'TRIG', 'Trigonometric Functions', 1);

-- Insert atomic concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name)
VALUES ((SELECT id FROM unit_topics WHERE code = 'TRIG'), 'M2.TRIG.1.1', 'Defining Sine, Cosine, Tangent');

-- Insert generators
INSERT INTO question_generators (concept_id, generator_type, answer_type, is_active)
VALUES ((SELECT id FROM atomic_concepts WHERE lesson_number = 'M2.TRIG.1.1'), 'trig_ratio_right_triangle', 'fraction', true);

-- Link to divisions
INSERT INTO division_curricula (division_id, course_id)
VALUES ((SELECT id FROM divisions WHERE code = 'SV'), (SELECT id FROM courses WHERE code = 'NCM2'));
```

### Step 3: Implement the generator

In `generators.ts`:
```typescript
GENERATORS['trig_ratio_right_triangle'] = (difficulty) => {
  // Generate right triangle with integer sides
  // Ask: "Find sin(A) for the triangle shown"
  // Answer: "3/5" (fraction)
  // Format hint: "Enter as a fraction (e.g., 3/5)"
};
```

### Step 4: Add static questions (optional)

For concepts needing interpretation/reasoning MC questions, add to `static_questions`:
```sql
INSERT INTO static_questions (concept_id, question_text, options, correct_answer, difficulty)
VALUES ('M2.TRIG.1.1', 'Which ratio represents cosine?',
  '["A) opposite/hypotenuse", "B) adjacent/hypotenuse", "C) opposite/adjacent", "D) hypotenuse/adjacent"]',
  'B', 1);
```

### Step 5: Add visual generators (if needed)

For concepts requiring diagrams, add to `visual-generators.ts`:
```typescript
VISUAL_GENERATORS['unit_circle'] = () => {
  // Generate SVG unit circle with angle marked
  // MC options for trig value
};
```

### Step 6: Test

```sql
-- Verify concept count
SELECT COUNT(*) FROM atomic_concepts ac
JOIN unit_topics ut ON ac.unit_topic_id = ut.id
JOIN courses c ON ut.course_id = c.id WHERE c.code = 'NCM2';

-- Verify generators
SELECT qg.generator_type, ac.name
FROM question_generators qg
JOIN atomic_concepts ac ON qg.concept_id = ac.id
JOIN unit_topics ut ON ac.unit_topic_id = ut.id
JOIN courses c ON ut.course_id = c.id WHERE c.code = 'NCM2';
```

---

## 5. Quality Checklist for New Generators

Before marking a generator as `is_active = true`:

- [ ] Math is correct for all parameter ranges (edge cases: zero, negative, fractions)
- [ ] Answer key produces the simplest form
- [ ] No "1x" or "-1x" — use "x" and "-x"
- [ ] Question text specifies the required form when relevant ("in slope-intercept form")
- [ ] answer_type is correctly tagged for validation
- [ ] Format hint maps correctly in CompetitionView.tsx
- [ ] Generator never produces degenerate cases (division by zero, identical equations, etc.)
- [ ] Re-roll logic prevents infinite loops
- [ ] 3+ example inputs verified by hand

---

## 6. Glossary

| Term | Definition |
|---|---|
| **Atomic concept** | The smallest teachable unit (e.g., "Solving 2-step linear equations") |
| **Generator** | TypeScript function producing infinite unique questions for one concept |
| **Static question** | Pre-written MC question stored in DB |
| **Visual generator** | SVG-generating function for graphical MC questions |
| **Lesson number** | Hierarchical ID (e.g., M1.EQN.2.1 = Math 1, Equations, Topic 2, Concept 1) |
| **FR** | Free-response (typed answer, no options) |
| **MC** | Multiple choice (4 options: A/B/C/D) |
| **CTA** | Content × Timing × Accuracy scoring composite |
| **Heat** | A single competition session with questions, timer, and scoring |
| **Backfill** | When a pool runs short, overflow questions shift to another type |

---

*Precision tools built to stay. © 2026 Mpingo Systems LLC*
