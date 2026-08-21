# NC Math 2 — Batch 1 Content Plan

**Status:** Approved for implementation  
**Scope:** Polynomial and rational expressions; real number system  
**Source blueprint:** `NC2_all_units.md`, supplied by the curriculum owner  
**Authoring principle:** Mathematical reasoning—not ambiguous language, missing data, or inconsistent notation—must create the difficulty.

## 1. Purpose and Scope

NC Math 2 currently has a static-question pool but no active procedural generators. Batch 1 establishes the course’s first generator-backed assessment and competition pathway by implementing the high-yield skills in two prerequisite-rich units: **Arithmetic with Polynomial & Rational Expressions** and **The Real Number System**.

The implementation will use the three approved item types. Generator-suitable skills will receive procedural question functions. Conceptual prompts will remain static text questions. Skills that require a labelled number line, area model, or other visual structure will receive a static SVG specification rather than a forced text-only generator.

| Item type | Batch 1 use | Release standard |
|---|---|---|
| Dynamic generator | 23 procedural skills | All tested variations must be mathematically valid, grammatically complete, unambiguous, and accompanied by a correct answer and solution path. |
| Static text | Conceptual closure and structural-analogy prompts | Each prompt explicitly defines the student task and contains all information required for a defensible answer. |
| Static SVG / diagram | FOIL area model, polynomial LCM factor map, and real-number line placement | Diagram labels, symbols, scale, and constraints are part of the item and must be sufficient to solve it. |

## 2. Curriculum Mapping and Generator Scope

### 2.1 Arithmetic with Polynomial & Rational Expressions

| Blueprint concept | Generator key | Required task and difficulty progression |
|---|---|---|
| `M2.APR.1.1` | `m2_add_subtract_polynomials` | Combine like terms in two polynomials; then three polynomials; then missing-term forms with zero coefficients omitted from the prompt. |
| `M2.APR.1.2` | `m2_multiply_polynomials` | Expand monomial × polynomial; then binomial × binomial; then binomial × trinomial and simplify. |
| `M2.APR.2.1` | `m2_polynomial_long_division` | Divide a cubic by a linear factor without remainder; then include a remainder; then express the complete quotient-and-remainder result. |
| `M2.APR.2.2` | `m2_synthetic_division` | Divide by a linear factor; then identify the remainder as `P(k)`; then use a rational root to factor. |
| `M2.APR.3.1` | `m2_simplify_rational_expression` | Factor and cancel common factors while retaining domain restrictions. |
| `M2.APR.3.2` | `m2_multiply_rational_expressions` | Multiply and simplify two expressions; then factor before cancellation; then use a three-expression product. |
| `M2.APR.3.3` | `m2_divide_rational_expressions` | Divide by multiplying by the reciprocal; then include factor-before-cancel cases; then use a mixed multiplication/division chain. |
| `M2.APR.4.1` | `m2_lcm_polynomials` | Find an LCM for monomials; then factor binomials; then use three polynomial expressions. |
| `M2.APR.4.2` | `m2_add_rational_like_denominators` | Combine numerators over a common denominator, then simplify; later include three terms. |
| `M2.APR.4.3` | `m2_add_rational_unlike_denominators` | Find an LCD, rewrite, combine, and simplify two rational expressions; later include factorable or three-denominator cases. |

### 2.2 The Real Number System

The existing database contains `M2.RNS.1.3` through `M2.RNS.4.3`, but the supplied blueprint also classifies `M2.RNS.1.1` and `M2.RNS.1.2` as generator-suitable. Migration `044_ncm2_batch1_generators.sql` will add those two missing atomic concepts to the existing NC Math 2 Real Number System unit before mapping their generators.

| Blueprint concept | Generator key | Required task and difficulty progression |
|---|---|---|
| `M2.RNS.1.1` | `m2_fraction_decimal_classify` | Convert a fraction to a decimal and classify it as terminating or repeating; then convert a repeating decimal to a fraction. |
| `M2.RNS.1.2` | `m2_rational_irrational_classify` | Classify a number, then test square roots using perfect squares, then require a brief mathematical justification. |
| `M2.RNS.1.3` | `m2_classify_real_numbers` | Classify mixed real numbers within the most specific set; then classify a full set; then provide an example satisfying a requested classification. |
| `M2.RNS.2.1` | `m2_rational_exponent_evaluate` | Convert rational exponents to radicals and evaluate exact values; then use product or quotient rules. |
| `M2.RNS.2.2` | `m2_simplify_rational_exponents` | Apply fractional exponent rules, including quotient, negative-exponent, and power-of-a-power cases. |
| `M2.RNS.3.1` | `m2_simplify_radicals` | Simplify square roots; then simplify variable radicals; then simplify cube-root expressions. |
| `M2.RNS.3.2` | `m2_add_subtract_radicals` | Combine like radicals; then simplify first; then handle a four-term expression. |
| `M2.RNS.3.3` | `m2_multiply_radicals` | Multiply monomial radicals; then distribute through a binomial; then use FOIL and combine like terms. |
| `M2.RNS.3.4` | `m2_rationalize_monomial_denominator` | Rationalize a monomial radical denominator and simplify to lowest terms. |
| `M2.RNS.3.5` | `m2_rationalize_conjugate_denominator` | Rationalize a binomial denominator using its conjugate and simplify exactly. |
| `M2.RNS.4.1` | `m2_solve_rational_exponent_equation` | Isolate the expression, apply the reciprocal exponent, and verify the exact solution. |
| `M2.RNS.4.2` | `m2_solve_one_radical_equation` | Solve a square- or cube-root equation and check for extraneous solutions when squaring is used. |
| `M2.RNS.4.3` | `m2_solve_multiple_radical_equation` | Isolate and square systematically; retain only verified real solutions. |

## 3. Static Text and SVG Deliverables

Existing NC Math 2 static questions will be reviewed before duplicates are inserted. Batch 1 will add only items that serve a distinct blueprint requirement and are not already represented clearly.

| Blueprint target | Item type | Authoring requirement |
|---|---|---|
| `M2.APR.1.3` — closure property | Static text | Ask whether a named operation is closed on polynomials and require a counterexample or justification as appropriate. |
| `M2.APR.1.4` — structural analogy | Static text | State the two expressions being compared and ask for one specific structural similarity; do not rely on vague “how is it like” wording. |
| `M2.APR.4.4` — rational-expression analogy | Static text | Explicitly require a comparison between fraction addition and rational-expression addition. |
| `M2.APR.1.2` — FOIL area model | Static SVG | Label side lengths and cell areas; ask a single, explicit task such as identify the product or complete a missing term. |
| `M2.APR.4.1` — polynomial LCM factor map | Static SVG | Show factor multiplicities clearly and state which polynomial LCM the student must determine. |
| `M2.RNS.1.3` — number-line placement | Static SVG | Use a labelled number line with a stated scale and ask students to place or order the listed values. |

## 4. Mandatory Content-Quality Release Gate

Every item must meet the following checks before publication.

| Dimension | Test |
|---|---|
| Task clarity | The first sentence states exactly what the student must determine, calculate, explain, compare, prove, select, or enter. |
| Mathematical completeness | The prompt supplies all values, restrictions, units, labels, definitions, and answer-format requirements needed for a solution. |
| Single interpretation | There is one intended mathematical meaning. A multiple-solution or open-response task says so explicitly. |
| Notation | Variables, signs, fractions, radicals, exponent notation, and diagrams remain consistent from prompt through solution. |
| Difficulty integrity | Difficulty changes by reasoning demand and structure, not merely by larger numbers. |
| Generator safety | At least 20 outputs per difficulty are checked for valid arithmetic, grammar, domain restrictions, answer leakage, repeated values, and malformed notation. |
| Solution quality | Each answer is exact unless rounding is explicitly requested. Worked steps explain the method without introducing unstated facts. |

## 5. Implementation Sequence

| Step | Deliverable |
|---:|---|
| 1 | Create migration `044_ncm2_batch1_generators.sql`, including missing RNS concepts and idempotent `question_generators` mappings. |
| 2 | Add the 23 `m2_` procedural generator functions to the central registry. |
| 3 | Add reviewed static text items and a versioned diagram-specification document; do not insert duplicates from the existing pool. |
| 4 | Run automated generator execution across all four difficulty levels and perform a manual quality sample. |
| 5 | Run TypeScript validation, commit the dedicated branch, and supply Supabase/Vercel deployment instructions. |

## 6. Success Criteria

Batch 1 succeeds when NC Math 2 has at least **23 active, concept-mapped generators** covering the two selected units; all functions return valid, clear questions and exact answers at every difficulty; static items are non-duplicative and rubric-ready; and the assessment generator can create documents from the new mapped concepts after migration `044` is applied.
