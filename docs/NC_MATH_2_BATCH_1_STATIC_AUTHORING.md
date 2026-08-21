# NC Math 2 — Batch 1 Static Item Authoring

**Status:** Curriculum-authoring specification  
**Companion plan:** `docs/NC_MATH_2_BATCH_1_PLAN.md`  
**Scope:** Static text and static SVG items for Polynomial/Rational Expressions and the Real Number System

## 1. Authoring Policy

These items are intentionally static. Their learning target is explanation, comparison, or visual interpretation, where random substitution could obscure the skill or create an unclear diagram. Every item states the student task directly, supplies all necessary information, and has one intended interpretation.

The existing NC Math 2 static pool already contains multiple-choice items for `M2.APR.1.3` and `M2.APR.4.4`. The new authored items below are designed as fuller teacher-assessment prompts rather than duplicates of those competition-pool questions.

## 2. Static Text Items

| ID | Concept | Student prompt | Expected answer / scoring evidence |
|---|---|---|---|
| `NCM2-B1-ST-01` | `M2.APR.1.3` — Closure property | **Division is not closed on polynomials.** Give two nonzero polynomials whose quotient is not a polynomial. Then state, in one sentence, why this example proves division is not closed. | Valid example: `x ÷ x² = 1/x`. The response must identify `1/x` as not being a polynomial. Award full credit only when both the example and conclusion are present. |
| `NCM2-B1-ST-02` | `M2.APR.1.4` — Polynomial structure analogy | Compare `(x² + 2x)(x - 1)` with `21 × 9`. Describe one way the distributive property is used in both products. **Do not evaluate either product.** | Both products split one factor into parts and multiply each part by the other factor before combining results. Accept equivalent wording that correctly names or demonstrates distribution. |
| `NCM2-B1-ST-03` | `M2.APR.4.4` — Rational-expression analogy | Explain why `1/x + 1/(x + 2)` cannot be added by adding the denominators. Then write the least common denominator and rewrite **each** fraction with that denominator. | The LCD is `x(x + 2)`. Equivalent fractions: `(x + 2)/(x(x + 2))` and `x/(x(x + 2))`. The explanation must say that unlike denominators require equivalent fractions with a common denominator. |
| `NCM2-B1-ST-04` | `M2.RNS.1.2` — Irrational numbers | The statement “the sum of two irrational numbers is always irrational” is false. Give two irrational numbers whose sum is rational, and calculate their sum. | Valid example: `√2 + (-√2) = 0`. Both addends must be irrational and the stated sum must be rational. |

## 3. Static SVG / Diagram Items

The diagram must be stored and rendered as part of the question. The visual information is not decorative; omitting labels, scale, or requested task invalidates the item.

### `NCM2-B1-SVG-01` — FOIL Area Model

| Property | Specification |
|---|---|
| Concept | `M2.APR.1.2` — Multiply polynomials |
| Diagram | A two-by-two area model. Top columns are labelled `x` and `3`. Left rows are labelled `x` and `−2`. Each interior cell is initially blank. |
| Prompt | “Use the area model to multiply `(x − 2)(x + 3)`. Write the product represented by each cell, then write the simplified product.” |
| Required answer | Cells: `x²`, `3x`, `−2x`, `−6`; simplified product: `x² + x − 6`. |
| Difficulty extension | A second version uses `2x`, `−5`, `x`, and `4`; all labels must remain legible and the prompt must still require cell products before simplification. |
| Accessibility text | “A two-by-two multiplication area model with column labels x and positive 3, row labels x and negative 2, and four blank interior cells.” |

### `NCM2-B1-SVG-02` — Factor Map for Polynomial LCM

| Property | Specification |
|---|---|
| Concept | `M2.APR.4.1` — Least common multiple of polynomials |
| Diagram | Two horizontally aligned factor trees labelled `A` and `B`. `A = (x − 2)²(x + 1)` and `B = (x − 2)(x + 1)³`. Use visibly distinct factor nodes and exponent labels. |
| Prompt | “The factor maps show two polynomials in completely factored form. Determine `LCM(A, B)`. Explain which exponent you used for each distinct factor.” |
| Required answer | `(x − 2)²(x + 1)³`. Explanation: use the greatest exponent of each distinct factor. |
| Accessibility text | “Factor map A contains x minus 2 squared and x plus 1. Factor map B contains x minus 2 and x plus 1 cubed.” |

### `NCM2-B1-SVG-03` — Real Numbers on a Number Line

| Property | Specification |
|---|---|
| Concept | `M2.RNS.1.3` — Classifying and ordering real numbers |
| Diagram | Horizontal number line from `−3` to `3`, with labelled integer tick marks and equal half-unit minor tick marks. Four draggable or blank labels are supplied: `−5/2`, `−√2`, `3/4`, and `√5`. |
| Prompt | “Place each value at its approximate location on the number line. Then list the values from least to greatest.” |
| Required answer | From least to greatest: `−5/2`, `−√2`, `3/4`, `√5`. The scale must make the locations distinguishable: `−2.5`, approximately `−1.41`, `0.75`, approximately `2.24`. |
| Accessibility text | “A number line from negative 3 to positive 3 with major marks at each integer and minor marks every one half unit.” |

## 4. Static-Item Quality Checklist

| Check | Required outcome |
|---|---|
| Explicit task | The prompt uses an action verb and tells the student exactly what to write, select, explain, calculate, or place. |
| Complete information | All expressions, values, labels, domains, scales, and restrictions appear in the prompt or diagram. |
| One intended interpretation | Each response has a defined correct answer, rubric, or set of acceptable equivalent responses. |
| Consistent notation | Fractions, radicals, signs, exponents, variable names, and diagram labels agree exactly across prompt, answer, and rubric. |
| Appropriate cognitive demand | The item measures the named mathematical skill, not reading endurance or unstated background knowledge. |
| Diagram integrity | SVG labels remain readable in print and on mobile; alternative text describes all information necessary to understand the figure. |

## 5. Publication Notes

The four static-text items above should be entered only after the static-pool schema’s answer-validation and image-rendering workflow is confirmed for the targeted experience. The three SVG specifications are ready for production artwork, but should not be converted into generic AI imagery; they require deterministic, labelled educational diagrams with accessible text.
