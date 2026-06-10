# MC Answer Distribution Report — G8
**Samples:** 9855 | **Method:** Fisher-Yates shuffle simulation

## Overall Distribution

| Letter | Count | % | Expected % | Status |
|---|---|---|---|---|
| A | 2488 | 25.2% | 25.0% | ✅ OK |
| B | 2537 | 25.7% | 25.0% | ✅ OK |
| C | 2376 | 24.1% | 25.0% | ✅ OK |
| D | 2454 | 24.9% | 25.0% | ✅ OK |

**Chi-square:** 5.58 (critical=7.815 at p=0.05)

**Verdict:** ✅ DISTRIBUTION OK — Chi-square=5.58 (PASS at p=0.05). Answers are evenly distributed.

## Per-Generator Results

| Generator | A% | B% | C% | D% | Max% | Status |
|---|---|---|---|---|---|---|
| `g8_eval_roots` | 27.3 | 25.2 | 21.8 | 25.8 | 27.3 | ✅ OK |
| `g8_solve_square_eq` | 26.0 | 25.8 | 23.0 | 25.2 | 26.0 | ✅ OK |
| `g8_solve_cube_eq` | 27.8 | 25.5 | 21.0 | 25.8 | 27.8 | ✅ OK |
| `g8_compare_irrationals` | 25.0 | 25.8 | 26.8 | 22.5 | 26.8 | ✅ OK |
| `g8_simplify_exponents` | 26.2 | 27.0 | 19.8 | 27.0 | 27.0 | ✅ OK |
| `g8_solve_linear_multistep` | 24.7 | 25.5 | 24.3 | 25.5 | 25.5 | ✅ OK |
| `g8_solve_vars_both_sides` | 25.5 | 24.8 | 26.2 | 23.5 | 26.2 | ✅ OK |
| `g8_evaluate_function_notation` | 24.8 | 24.0 | 25.2 | 26.0 | 26.0 | ✅ OK |
| `g8_classify_equation_type` | 26.2 | 24.0 | 26.8 | 23.0 | 26.8 | ✅ OK |
| `g8_solve_system_substitution` | 24.8 | 29.8 | 22.0 | 23.5 | 29.8 | ✅ OK |
| `g8_solve_system_elimination` | 26.2 | 27.8 | 22.2 | 23.8 | 27.8 | ✅ OK |
| `g8_construct_linear_function` | 27.0 | 22.8 | 24.5 | 25.8 | 27.0 | ✅ OK |
| `g8_coordinate_dilation` | 22.8 | 25.8 | 24.0 | 27.5 | 27.5 | ✅ OK |
| `g8_similar_figures_solve` | 24.5 | 25.8 | 23.5 | 26.2 | 26.2 | ✅ OK |
| `g8_triangle_angle_sum` | 23.5 | 24.2 | 25.0 | 27.3 | 27.3 | ✅ OK |
| `g8_pythagorean_missing_side` | 25.0 | 28.2 | 22.5 | 24.2 | 28.2 | ✅ OK |
| `g8_pythagorean_2d_context` | 23.8 | 25.2 | 25.2 | 25.8 | 25.8 | ✅ OK |
| `g8_pythagorean_converse` | 25.2 | 26.2 | 26.0 | 22.5 | 26.2 | ✅ OK |
| `g8_coordinate_distance` | 25.0 | 25.0 | 24.2 | 25.8 | 25.8 | ✅ OK |
| `g8_volume_cylinder` | 23.5 | 22.5 | 27.3 | 26.8 | 27.3 | ✅ OK |
| `g8_volume_cone` | 23.8 | 25.0 | 27.5 | 23.8 | 27.5 | ✅ OK |
| `g8_volume_sphere` | 26.2 | 28.5 | 20.8 | 24.5 | 28.5 | ✅ OK |
| `g8_volume_3d_word_problem` | 26.5 | 27.8 | 25.0 | 20.8 | 27.8 | ✅ OK |
| `g8_relative_frequency_table` | 24.5 | 27.3 | 25.0 | 23.2 | 27.3 | ✅ OK |
| `g8_pythagorean_3d_context` | 25.2 | 24.2 | 23.2 | 27.3 | 27.3 | ✅ OK |

## What This Measures

- **Fisher-Yates shuffle** is used to place the correct answer randomly among 4 options
- A perfectly uniform distribution gives 25% for each of A, B, C, D
- Chi-square test checks if observed distribution is statistically different from uniform
- If bias detected: students can guess the position rather than solving the problem
- Threshold: any letter > 35% is flagged; chi-square > 7.815 at p=0.05 fails