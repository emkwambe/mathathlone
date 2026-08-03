# Sprint 11: Generator Quality Review Report

## Executive Summary
As part of Sprint 11, we conducted a programmatic quality review of all 262 math question generators across the Mathathlone platform. The goal was to audit coverage, spot-check question quality, identify bugs, and provide a prioritized fix report.

- **Total Generators Analyzed:** 262
- **Errors Encountered:** 0 (All generators ran successfully)
- **Total Potential Issues Identified:** 139 (across 72 generators)
- **Primary Issue Category:** `ANSWER_IN_QUESTION`

## Coverage Analysis
The generators are distributed across various courses and grade levels. Below is the breakdown of generator coverage:

| Course | Prefix | Count |
|---|---|---|
| Math Fundamentals | `mf_` | 25 |
| NC Grade 6 | `g6_` | 34 |
| NC Grade 7 | `g7_` | 28 |
| NC Grade 8 | `g8_` | 25 |
| Algebra 1 / Math 1 | `alg1_` | 25 |
| NC Math 3 / Algebra 2 | `m3_` | 71 |
| Legacy (Algebra 1 era) | *none* | 54 |
| **Total** | | **262** |

*Note: NC Math 1 / Algebra 1 has relatively low coverage (25 generators) compared to NC Math 3 (71 generators). We recommend a backfill for Algebra 1 in a future sprint.*

## Quality Findings
The automated analysis checked for several issue categories, including empty questions/answers, lack of variety, bad answer values (e.g., NaN, undefined), raw LaTeX leaks, template leaks, and trivial give-aways (`ANSWER_IN_QUESTION`).

**Only one category of issues was detected: `ANSWER_IN_QUESTION`.**

### `ANSWER_IN_QUESTION` Analysis
This issue occurs when the correct answer appears verbatim inside the question text. While the initial script flagged 139 instances across 72 generators, many of these are "false positives" due to the simple substring matching logic (e.g., the answer `7` appearing as a coefficient in the question `1x ≥ 7`).

However, there are genuine cases where the full answer string is a meaningful give-away or indicates poor formatting.

#### Examples of Findings:
- **`linear_eq_one_step_add`**: `Q='Solve for x: x - -6 = -2'` | `A='-8'` (False positive: `-8` is not in the question, but the script flagged it likely due to a substring match in another difficulty level, e.g., `A='-6'`).
- **`linear_eq_two_step`**: `Q='Solve for x: -8x - 12 = 52'` | `A='-8'` (False positive: `-8` is a coefficient, not the intended give-away).
- **`inequality_one_step_mult`**: `Q='Solve: 1x ≥ 7'` | `A='x ≥ 7'` (True issue: Formatting is poor (`1x` instead of `x`), and the answer is embedded in the question).
- **`parallel_line_slope`**: `Q='What is the slope of a line parallel to y = 1x + 4?'` | `A='1'` (True issue: Poor formatting `1x`, and the answer is trivially the coefficient).
- **`identify_growth_decay`**: `Q='Is y = 7(1.3)^x exponential growth or decay?'` | `A='growth'` (True issue: The answer is a word that might be implicitly suggested or the script flagged it if the word appeared in the question prompt).

## Recommended Fixes (Prioritized)

### High Priority (Formatting & Trivial Give-aways)
1. **Fix `1x` formatting issues:** Generators like `inequality_one_step_mult` and `parallel_line_slope` are generating terms with a coefficient of `1` (e.g., `1x`). This should be formatted simply as `x` or `-x` for `-1`.
2. **Review True Positives for `ANSWER_IN_QUESTION`:** Manually review the 72 flagged generators to identify cases where the answer is truly given away (e.g., multiple-choice questions where the answer is embedded in the prompt).

### Medium Priority (Coverage Gaps)
3. **Backfill Algebra 1 / Math 1:** With only 25 generators, this course is underrepresented. A dedicated sprint should focus on adding more generators to match the depth of NC Math 3.

### Low Priority (Analysis Script Refinement)
4. **Improve Detection Logic:** Update the `analyze_generators.py` script to use regex or AST parsing to distinguish between answers that are standalone solutions vs. numbers that happen to be coefficients or constants in the question text.

## Next Steps
- Implement fixes for the high-priority formatting issues (e.g., `1x`).
- Merge `sprint9` and `sprint10` branches to `main` and deploy via `vercel --prod`.
- Run migrations `040`, `041`, and `042` in the Supabase SQL editor.
