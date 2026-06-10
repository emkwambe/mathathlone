# MC Answer Distribution Report — ALG1
**Samples:** 9486 | **Method:** Fisher-Yates shuffle simulation

## Overall Distribution

| Letter | Count | % | Expected % | Status |
|---|---|---|---|---|
| A | 2356 | 24.8% | 25.0% | ✅ OK |
| B | 2384 | 25.1% | 25.0% | ✅ OK |
| C | 2381 | 25.1% | 25.0% | ✅ OK |
| D | 2365 | 24.9% | 25.0% | ✅ OK |

**Chi-square:** 0.223 (critical=7.815 at p=0.05)

**Verdict:** ✅ DISTRIBUTION OK — Chi-square=0.22 (PASS at p=0.05). Answers are evenly distributed.

## Per-Generator Results

| Generator | A% | B% | C% | D% | Max% | Status |
|---|---|---|---|---|---|---|
| `alg1_eval_algebraic_expr` | 23.5 | 28.2 | 26.5 | 21.8 | 28.2 | ✅ OK |
| `alg1_simplify_expression` | 26.5 | 25.8 | 24.0 | 23.8 | 26.5 | ✅ OK |
| `alg1_translate_verbal` | 25.8 | 25.0 | 26.2 | 23.0 | 26.2 | ✅ OK |
| `alg1_solve_one_step_add_sub` | 24.0 | 26.8 | 26.2 | 23.0 | 26.8 | ✅ OK |
| `alg1_solve_one_step_mult_div` | 22.3 | 28.7 | 24.5 | 24.5 | 28.7 | ✅ OK |
| `alg1_solve_two_step` | 28.0 | 24.7 | 21.8 | 25.5 | 28.0 | ✅ OK |
| `alg1_solve_multi_step` | 24.8 | 27.5 | 22.5 | 25.2 | 27.5 | ✅ OK |
| `alg1_solve_vars_both_sides` | 28.0 | 22.8 | 22.5 | 26.8 | 28.0 | ✅ OK |
| `alg1_solve_literal_equation` | 22.8 | 24.8 | 27.8 | 24.8 | 27.8 | ✅ OK |
| `alg1_write_linear_equation` | 25.0 | 23.0 | 26.8 | 25.2 | 26.8 | ✅ OK |
| `alg1_slope_from_points` | 25.9 | 21.6 | 23.3 | 29.3 | 29.3 | ✅ OK |
| `alg1_slope_intercept_form` | 26.0 | 26.0 | 24.8 | 23.2 | 26.0 | ✅ OK |
| `alg1_graph_identify_slope` | 26.0 | 24.5 | 25.0 | 24.5 | 26.0 | ✅ OK |
| `alg1_write_equation_from_table` | 21.5 | 23.8 | 27.8 | 27.0 | 27.8 | ✅ OK |
| `alg1_write_equation_two_points` | 21.5 | 25.5 | 23.2 | 29.8 | 29.8 | ✅ OK |
| `alg1_solve_system_substitution` | 29.8 | 25.0 | 22.0 | 23.2 | 29.8 | ✅ OK |
| `alg1_solve_system_elimination` | 27.8 | 23.2 | 24.2 | 24.8 | 27.8 | ✅ OK |
| `alg1_solve_inequality_one_step` | 27.0 | 24.8 | 28.0 | 20.2 | 28.0 | ✅ OK |
| `alg1_solve_inequality_multi_step` | 22.2 | 25.8 | 25.8 | 26.2 | 26.2 | ✅ OK |
| `alg1_compound_inequality` | 25.2 | 25.8 | 25.5 | 23.5 | 25.8 | ✅ OK |
| `alg1_exponent_rules` | 24.2 | 23.2 | 24.8 | 27.8 | 27.8 | ✅ OK |
| `alg1_add_subtract_polynomials` | 24.5 | 24.2 | 26.5 | 24.8 | 26.5 | ✅ OK |
| `alg1_multiply_polynomials` | 24.0 | 25.0 | 24.8 | 26.2 | 26.2 | ✅ OK |
| `alg1_factor_trinomial` | 21.8 | 24.0 | 26.8 | 27.5 | 27.5 | ✅ OK |
| `alg1_quadratic_formula` | 24.5 | 26.8 | 23.8 | 25.0 | 26.8 | ✅ OK |

## What This Measures

- **Fisher-Yates shuffle** is used to place the correct answer randomly among 4 options
- A perfectly uniform distribution gives 25% for each of A, B, C, D
- Chi-square test checks if observed distribution is statistically different from uniform
- If bias detected: students can guess the position rather than solving the problem
- Threshold: any letter > 35% is flagged; chi-square > 7.815 at p=0.05 fails