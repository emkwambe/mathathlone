# MathAthlone Question Categorization Reference
**Mpingo Systems LLC** | Last updated: June 2026

---

## Overview

Every question in MathAthlone falls into one of **three source types**
and one of **two format types**. The combination determines how it is
generated, validated, delivered, and scored.

```
Source:  Generator-based  OR  Static (handcrafted)  OR  Visual/SVG
Format:  Free Response    OR  Multiple Choice
```

In the current system:
- **Generator-based** → Free Response (FR) — dynamic, infinite variety
- **Static** → Multiple Choice (MC) — fixed, misconception-targeted
- **Visual/SVG** → Free Response (FR) — SVG diagram + computed answer
  *(planned for v2 — specs exist but not yet built)*

In the assessment generator, generator-based questions can also be
wrapped as MC by adding computed distractors.

> **Summary:** If a concept requires computation → Generator FR.
> If a concept requires a diagram to be meaningful → Visual FR.
> If a concept tests definition, classification, or reasoning → Static MC.

---

## Part 1 — Why FR for Generator-Based Questions

Generator-based questions are dynamically computed from TypeScript
functions. Each call produces a unique question with different
numbers, parameters, or contexts — but always from the same
mathematical concept.

**FR is the correct format for generator questions because:**

1. **Infinite variety** — if the same question could appear twice,
   MC options could be memorized. FR forces genuine computation
   every time.

2. **No pattern gaming** — with MC, students can eliminate options
   or guess. FR requires a real answer, making the CTA score
   (Content × Time × Accuracy) meaningful.

3. **Validates deeper understanding** — typing `3/4` rather than
   selecting it from options requires the student to actually
   compute the result.

4. **Answer type precision** — each generator declares its
   `answer_type` exactly, and the validator checks mathematical
   equivalence (e.g. `3/4 = 0.75 = 75%`).

---

## Part 2 — Why MC for Static Questions

Static questions are handcrafted by curriculum authors to target
specific misconceptions. They are fixed — same question, same
options, every time.

**MC is the correct format for static questions because:**

1. **Misconception targeting** — the wrong answer options (distractors)
   are carefully designed to match common student errors. For example:
   - Correct: `(x-3)(x-2)(x+2)`
   - Distractor A: `(x-3)(x²-4)` — stops at grouping, doesn't factor
   - Distractor B: `(x-3)(x+4)` — sign error
   - Distractor C: `(x+3)(x-2)(x+2)` — wrong sign on first factor

   These distractors reveal *which* misconception a student has,
   not just *whether* they got it wrong.

2. **Stable diagnostic value** — because the question never changes,
   accuracy rates across many students on the same question reveal
   genuine curriculum gaps, not question variability.

3. **Concept-level targeting** — each static question is tagged to
   a single `concept_id` (e.g. `M7.EE.2.2`), making it a precise
   probe of one specific skill.

---

## Part 3 — Which Concepts Get Generator Questions vs Static Questions

### Concepts suited to GENERATOR questions (FR)

These are procedural and computational concepts where:
- The answer is a specific number, expression, or value
- The validator can check mathematical equivalence
- Variety in parameters is pedagogically valuable
- The same procedure applies regardless of the numbers used

| Category | Examples | Why Generator |
|---|---|---|
| Arithmetic with rationals | Add/subtract/multiply/divide fractions and decimals | Different numbers each time, same procedure |
| Algebraic solving | One-step, two-step, multi-step equations | Infinite parameter combinations |
| Proportional reasoning | Unit rate, proportions, percent change | Word problem contexts vary |
| Geometry measurement | Area, perimeter, volume, surface area | Different dimensions each time |
| Probability | Theoretical, experimental, compound | Different event combinations |
| Exponential/logarithmic | Evaluate, solve, growth/decay | Different bases and values |
| Polynomial operations | Factor, divide, evaluate | Different coefficients |
| Systems of equations | Substitution, elimination | Different coefficients |
| Statistics | Mean, median, mode, MAD, IQR | Different data sets |
| Coordinate geometry | Distance, slope, intercepts | Different points |

### Concepts suited to STATIC questions (MC)

These are conceptual and reasoning concepts where:
- The question tests understanding of a definition or principle
- Distractors can be designed around known misconceptions
- The question cannot be parameterized without losing meaning
- Recognition and reasoning matter more than computation

| Category | Examples | Why Static |
|---|---|---|
| Number classification | Is √2 rational or irrational? | Definition-based, not computational |
| Vocabulary and definitions | What is standard form? What is a function? | Tests conceptual understanding |
| Process identification | Which property justifies this step? | Recognizing mathematical structure |
| Graph interpretation | Which graph shows a linear function? | Visual pattern recognition |
| Error analysis | A student evaluated 3+4×2=14. What went wrong? | Requires understanding of PEMDAS misconception |
| Net/shape recognition | Which net folds into a cube? | Spatial reasoning, fixed answer set |
| Transformation identification | What transformation maps figure A to B? | Category recognition |
| Statistical interpretation | Which statement about this data set is correct? | Reasoning about context |
| Equation type classification | Is this linear, quadratic, or exponential? | Pattern recognition |
| Proof/justification | Which theorem applies here? | Conceptual not computational |

---

## Part 4 — The Three-Axis Tag System

Every generator is tagged on three dimensions that control which
questions appear at which profile level.

### cognitive_demand
| Value | Meaning | Profile |
|---|---|---|
| `procedural` | Single algorithm, recall a rule | Warm-Up |
| `conceptual` | Understand why, not just how | Standard |
| `application` | Apply to a real context | Standard/Challenge |
| `reasoning` | Analyze, justify, multi-step logic | Challenge/Deep |

### complexity
| Value | Meaning | Profile |
|---|---|---|
| `low` | One step, small numbers, direct | Warm-Up |
| `medium` | Two or more steps, moderate numbers | Standard/Challenge |
| `high` | Multi-concept, multi-step, edge cases | Deep |

### context
| Value | Meaning | Profile |
|---|---|---|
| `abstract` | Pure math, no real-world story | Warm-Up |
| `real_world` | Embedded in a real-world scenario | Deep |
| `mixed` | Some abstract, some contextual | Standard/Challenge |

### How profiles map to axes

| Profile | cognitive_demand | complexity | context |
|---|---|---|---|
| 🌱 Warm-Up | procedural | low | abstract |
| 📐 Standard | application | medium | mixed |
| ⚡ Challenge | reasoning | medium | mixed |
| 🔬 Deep | reasoning | high | real_world |

### Current status
As of June 2026, the `cognitive_demand`, `complexity`, and `context`
columns in the `question_generators` table are all NULL. Migration 032
added the columns but no backfill has been run yet.

**Effect:** All heats fall through to the depth-range fallback
regardless of which profile the teacher selects. Warm-Up and Deep
heats currently draw from the same generator pool.

**Fix needed:** Backfill migration that reads `three_axis` from each
`*_generators.json` spec file and writes to the DB columns.

---

## Part 5 — Answer Type to Validator Mapping

Each generator declares an `answer_type` that tells the validator
what form of answer to accept.

| answer_type | Accepts | Example |
|---|---|---|
| `integer` | Whole numbers only, exact | `42` |
| `decimal` | Decimal numbers, ±0.01 tolerance | `3.14` |
| `fraction` | Fraction form, reduced or not | `3/4` = `6/8` |
| `percent` | Number with % symbol | `20%` |
| `decimal_or_fraction` | Either form | `0.75` = `3/4` |
| `decimal_or_fraction_or_percent` | Any of the three | `75%` = `0.75` = `3/4` |
| `expression` | Algebraic expression, simplified | `3x + 2` = `2 + 3x` |
| `equation` | Full equation with variable | `x = -5` or `-5` |
| `ordered_pair` | Coordinate pair | `(3, -4)` |
| `interval` | Inequality interval notation | `(1, 3)` or `1 < x < 3` |

### Known validator edge cases (P2 on pending list)
- `3x + 2` vs `2 + 3x` — algebraic equivalence
- `-3/4` vs `-(3/4)` — negative fraction forms
- `x = -5` vs `-5` — equation vs value
- `20` vs `20%` for `percent` type

---

## Part 6 — Heat Question Mix by Type

The `question-delivery.ts` service assembles each heat's question set
from three pools:

| Pool | Source | Format | Notes |
|---|---|---|---|
| Generator pool | `question_generators` table | FR | Profile-filtered, shuffle-without-replacement |
| Static pool | `static_questions` table | MC | Concept-matched to selected topics |
| Visual pool | Visual generators (future) | FR | SVG-rendered geometry/graph questions |

### FR/MC ratio by heat type

| Heat Type | FR % | MC % |
|---|---|---|
| Sprint | 40% | 60% |
| Target | 50% | 50% |
| Practice | 40% | 60% |
| Championship | 50% | 50% |
| Quiz (assessment) | 40% | 60% |
| Test (assessment) | 50% | 50% |

---

## Part 7 — Assessment Generator Question Selection

When a teacher uses the standalone assessment generator
(`/assessment/generate`), questions are selected differently from
heats:

1. Teacher selects concepts from the topic tree
2. System queries `question_generators` filtered by `concept_id IN (selected)`
3. Generator types are extracted and deduplicated
4. `assembleAssessment()` calls each generator at the selected difficulty
5. FR/MC split applied per document type:
   - Review: 40% FR / 60% MC
   - Quiz: 40% FR / 60% MC
   - Homework: 60% FR / 40% MC
   - Test: 50% FR / 50% MC
   - Makeup: 50% FR / 50% MC
6. MC options built via `buildMCOptions()`:
   - Numeric: ±10%, ±25%, ±50% of correct answer
   - Expression: re-run generator 6 times for organic distractors

**Key difference from heats:** Assessment generator questions are
fresh-generated at assembly time — not pre-inserted into
`heat_questions`. The document is ephemeral (sessionStorage) and
disappears when the tab closes.

---

## Part 8 — Question Difficulty Calibration

Each generator accepts a `difficulty` parameter (1–4):

| Level | Label | Number range | Complexity |
|---|---|---|---|
| 1 | Easy | Small integers (1–10) | Single step, direct |
| 2 | Medium | Larger integers (10–50) | One complication |
| 3 | Hard | Fractions/decimals involved | Multi-step |
| 4 | Expert | Mixed negatives, edge cases | Multi-step, boundary |

**Current issue:** Many generators use difficulty as a parameter range
but don't consistently scale complexity with difficulty level. Some
generators at difficulty 4 produce problems equivalent to difficulty 1.
This is a known gap (P3 — difficulty calibration backfill).

The depth-range fallback in question delivery maps profiles to
difficulty ranges:
- Warm-Up: depth 1–2
- Standard: depth 1–3
- Challenge: depth 2–4
- Deep: depth 3–4

---

## Quick Reference Card

```
QUESTION TYPE DECISION TREE

Is the answer a specific computed value?
  YES → Generator (FR)
    Examples: solve equation, find area, calculate percent
  NO → Consider static (MC)
    Is it testing a definition, classification, or concept?
      YES → Static (MC) with misconception distractors
        Examples: identify transformation, classify function,
                  interpret graph, find error in student work
      NO → May need visual generator (future)
        Examples: identify shape from diagram, read coordinate graph
```


---

## Part 9 — Visual/SVG Questions (Third Category)

Visual questions are a planned third source type that renders
geometric diagrams, coordinate grids, probability spinners, or
data displays as inline SVG alongside the question text.

### Why a separate category

Generator questions and static questions both deliver text.
Some mathematical concepts cannot be assessed meaningfully
without a visual:

| Concept | Why visual is required |
|---|---|
| Composite area | Student must see the L-shape or cutout to decompose it |
| Coordinate transformations | Student must see the pre-image and image |
| Pythagorean context | Student must see the right triangle labeled |
| Probability spinners | Student must see sector sizes to compute probability |
| Scatter plot interpretation | Student must see the data distribution |
| Net identification | Student must see the 2D net to judge if it folds |
| Similar figures | Student must see both figures with labeled sides |
| Graph reading | Student must see the plotted function |

Without the visual, these questions either become impossible
(no information to work with) or require the student to imagine
something that should be shown — introducing construct-irrelevant
difficulty.

### Visual question specs (planned)

Each course has a `*_visual.json` file in `docs/curriculum/`
defining visual generator specs:

| Course | Visual specs | Status |
|---|---|---|
| G6 | 18 visual specs | ❌ Not built |
| G7 | 14 visual specs | ❌ Not built |
| G8 | 15 visual specs | ❌ Not built |
| ALG1 | TBD | ❌ Not built |
| MF | TBD | ❌ Not built |

### Architecture (when built)

```
Visual generator function
  → generates question parameters (dimensions, coordinates, etc.)
  → renders SVG string from parameters
  → returns { question_text, svg_markup, answer, answer_type }

CompetitionView
  → detects svg_markup field on question
  → renders <div dangerouslySetInnerHTML={{ __html: svg_markup }} />
  → above the question text
```

### Format: FR with visual context

Visual questions are Free Response — the SVG provides context,
the student types a computed answer. Example:

```
[SVG: L-shaped figure with dimensions labeled]
Question: "What is the area of the composite shape shown?"
Answer type: integer
Student types: 111
```

### SVG design standards (from GENERATOR_ENGINE_SPEC.md)

- ViewBox: 200×200 for simple shapes, 300×200 for complex
- Stroke: #1e293b (dark slate), strokeWidth: 1.5
- Fill: #e0f2fe (light blue) for shapes
- Labels: 12pt, font-family: monospace
- Dimension lines: dashed, #64748b
- All measurements labeled explicitly
- No external fonts or images — pure SVG primitives only

### Why visual questions are deferred to v2

1. SVG rendering in a competitive heat requires careful sizing
   across different screen sizes (phone vs laptop vs tablet)
2. Print rendering in the assessment generator needs SVG to
   scale correctly to letter paper
3. The answer validator must handle visual-specific answer types
   (e.g. reading coordinates, identifying angle measures)
4. 47 visual specs across 3 courses is a significant build —
   each spec needs unique SVG generation logic

Visual questions are the highest-value improvement to student
experience after pilot launch. Students who struggle with text-only
geometry questions often succeed when they can see the figure.

---

## Updated Quick Reference Card

```
QUESTION TYPE DECISION TREE

Is the answer a specific computed value?
  YES → Does the question require a diagram to be meaningful?
    NO  → Generator-based FR (text only)
          Examples: solve equation, find area from dimensions,
                    calculate percent, evaluate expression
    YES → Visual Generator FR (SVG + text)
          Examples: composite area from L-shape, coordinate
                    distance, probability spinner, scatter plot
  NO  → Is it testing definition, classification, or concept?
    YES → Static MC with misconception distractors
          Examples: identify transformation, classify function,
                    interpret description, find error in work
    NO  → Static MC with visual context (future)
          Examples: "which graph matches this equation?"
```

---

*Mpingo Systems LLC — Precision Tools built to stay.*
*Contact: eddy@mpingo.ai | Repo: github.com/emkwambe/mathathlone*
