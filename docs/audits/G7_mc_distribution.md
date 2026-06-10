# MC Answer Distribution Report — G7
**Samples:** 7243 | **Method:** Fisher-Yates shuffle simulation

## Overall Distribution

| Letter | Count | % | Expected % | Status |
|---|---|---|---|---|
| A | 1790 | 24.7% | 25.0% | ✅ OK |
| B | 1808 | 25.0% | 25.0% | ✅ OK |
| C | 1796 | 24.8% | 25.0% | ✅ OK |
| D | 1849 | 25.5% | 25.0% | ✅ OK |

**Chi-square:** 1.17 (critical=7.815 at p=0.05)

**Verdict:** ✅ DISTRIBUTION OK — Chi-square=1.17 (PASS at p=0.05). Answers are evenly distributed.

## Per-Generator Results

| Generator | A% | B% | C% | D% | Max% | Status |
|---|---|---|---|---|---|---|
| `g7_add_rational` | 26.1 | 28.3 | 21.1 | 24.4 | 28.3 | ✅ OK |
| `g7_subtract_rational` | 21.4 | 24.5 | 28.1 | 26.0 | 28.1 | ✅ OK |
| `g7_multiply_rational` | 33.9 | 22.6 | 21.4 | 22.0 | 33.9 | ✅ OK |
| `g7_divide_rational` | 29.4 | 26.5 | 32.4 | 11.8 | 32.4 | ✅ OK |
| `g7_rational_to_decimal` | 27.6 | 25.4 | 24.3 | 22.8 | 27.6 | ✅ OK |
| `g7_find_unit_rate` | 26.2 | 25.5 | 24.0 | 24.2 | 26.2 | ✅ OK |
| `g7_proportional_solve` | 21.2 | 24.5 | 27.3 | 27.0 | 27.3 | ✅ OK |
| `g7_percent_tax_tip_discount` | 27.3 | 19.0 | 25.8 | 28.0 | 28.0 | ✅ OK |
| `g7_simple_interest` | 25.0 | 25.8 | 21.5 | 27.8 | 27.8 | ✅ OK |
| `g7_percent_change` | 25.9 | 25.9 | 26.5 | 21.8 | 26.5 | ✅ OK |
| `g7_add_sub_linear_expr` | 23.8 | 22.0 | 28.0 | 26.2 | 28.0 | ✅ OK |
| `g7_expand_linear_expr` | 25.0 | 24.5 | 23.5 | 27.0 | 27.0 | ✅ OK |
| `g7_solve_linear_rational` | 25.6 | 27.2 | 22.4 | 24.8 | 27.2 | ✅ OK |
| `g7_solve_distrib_like_terms` | 24.2 | 26.8 | 24.2 | 24.8 | 26.8 | ✅ OK |
| `g7_fraction_decimal_percent` | 24.8 | 24.0 | 27.3 | 24.0 | 27.3 | ✅ OK |
| `g7_angle_relationship_solve` | 21.8 | 29.0 | 25.0 | 24.2 | 29.0 | ✅ OK |
| `g7_circle_area_circumference` | 27.3 | 24.2 | 20.8 | 27.8 | 27.8 | ✅ OK |
| `g7_angle_equation_solve` | 21.0 | 25.8 | 26.5 | 26.8 | 26.8 | ✅ OK |
| `g7_composite_area` | 27.3 | 26.5 | 23.8 | 22.5 | 27.3 | ✅ OK |
| `g7_area_2d_objects` | 25.5 | 24.5 | 25.0 | 25.0 | 25.5 | ✅ OK |
| `g7_volume_3d_objects` | 19.8 | 26.2 | 25.5 | 28.5 | 28.5 | ✅ OK |
| `g7_surface_area_3d` | 24.5 | 23.8 | 26.0 | 25.8 | 26.0 | ✅ OK |

## What This Measures

- **Fisher-Yates shuffle** is used to place the correct answer randomly among 4 options
- A perfectly uniform distribution gives 25% for each of A, B, C, D
- Chi-square test checks if observed distribution is statistically different from uniform
- If bias detected: students can guess the position rather than solving the problem
- Threshold: any letter > 35% is flagged; chi-square > 7.815 at p=0.05 fails