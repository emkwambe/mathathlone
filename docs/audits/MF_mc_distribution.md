# MC Answer Distribution Report — MF
**Samples:** 8850 | **Method:** Fisher-Yates shuffle simulation

## Overall Distribution

| Letter | Count | % | Expected % | Status |
|---|---|---|---|---|
| A | 2202 | 24.9% | 25.0% | ✅ OK |
| B | 2166 | 24.5% | 25.0% | ✅ OK |
| C | 2293 | 25.9% | 25.0% | ✅ OK |
| D | 2189 | 24.7% | 25.0% | ✅ OK |

**Chi-square:** 4.206 (critical=7.815 at p=0.05)

**Verdict:** ✅ DISTRIBUTION OK — Chi-square=4.21 (PASS at p=0.05). Answers are evenly distributed.

## Per-Generator Results

| Generator | A% | B% | C% | D% | Max% | Status |
|---|---|---|---|---|---|---|
| `mf_absolute_value` | 22.5 | 32.2 | 24.0 | 21.2 | 32.2 | ✅ OK |
| `mf_integer_add_subtract` | 26.2 | 22.2 | 28.7 | 22.8 | 28.7 | ✅ OK |
| `mf_integer_multiply_divide` | 23.0 | 23.5 | 25.5 | 28.0 | 28.0 | ✅ OK |
| `mf_fraction_add_subtract` | 41.7 | 33.3 | 16.7 | 8.3 | 41.7 | ⚠️ Biased |
| `mf_fraction_multiply_divide` | 23.7 | 26.3 | 31.6 | 18.4 | 31.6 | ✅ OK |
| `mf_decimal_operations` | 25.8 | 29.2 | 24.8 | 20.2 | 29.2 | ✅ OK |
| `mf_percent_of_number` | 23.2 | 27.0 | 25.0 | 24.8 | 27.0 | ✅ OK |
| `mf_percent_change` | 24.5 | 21.5 | 27.0 | 27.0 | 27.0 | ✅ OK |
| `mf_ratio_unit_rate` | 25.2 | 23.2 | 24.0 | 27.5 | 27.5 | ✅ OK |
| `mf_proportion_solve` | 24.2 | 22.0 | 27.3 | 26.5 | 27.3 | ✅ OK |
| `mf_evaluate_expression` | 24.2 | 26.0 | 25.2 | 24.5 | 26.0 | ✅ OK |
| `mf_simplify_expression` | 27.3 | 26.2 | 26.0 | 20.5 | 27.3 | ✅ OK |
| `mf_solve_one_step_equation` | 25.2 | 24.2 | 27.5 | 23.0 | 27.5 | ✅ OK |
| `mf_solve_two_step_equation` | 25.0 | 24.0 | 26.0 | 25.0 | 26.0 | ✅ OK |
| `mf_write_expression` | 23.8 | 23.2 | 28.7 | 24.2 | 28.7 | ✅ OK |
| `mf_area_rectangle_triangle` | 23.2 | 24.8 | 26.2 | 25.8 | 26.2 | ✅ OK |
| `mf_perimeter` | 24.2 | 23.0 | 25.2 | 27.5 | 27.5 | ✅ OK |
| `mf_pythagorean_theorem` | 25.5 | 20.2 | 28.5 | 25.8 | 28.5 | ✅ OK |
| `mf_angle_relationships` | 22.8 | 28.0 | 25.2 | 24.0 | 28.0 | ✅ OK |
| `mf_volume_rectangular_prism` | 30.0 | 22.8 | 22.2 | 25.0 | 30.0 | ✅ OK |
| `mf_mean_median_mode` | 25.5 | 22.2 | 24.5 | 27.8 | 27.8 | ✅ OK |
| `mf_range_iqr` | 24.8 | 26.2 | 24.0 | 25.0 | 26.2 | ✅ OK |
| `mf_exponent_evaluate` | 27.3 | 20.0 | 29.0 | 23.8 | 29.0 | ✅ OK |
| `mf_square_cube_root` | 23.5 | 26.0 | 25.0 | 25.5 | 26.0 | ✅ OK |

## What This Measures

- **Fisher-Yates shuffle** is used to place the correct answer randomly among 4 options
- A perfectly uniform distribution gives 25% for each of A, B, C, D
- Chi-square test checks if observed distribution is statistically different from uniform
- If bias detected: students can guess the position rather than solving the problem
- Threshold: any letter > 35% is flagged; chi-square > 7.815 at p=0.05 fails