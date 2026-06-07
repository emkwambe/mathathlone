# Generator Quality Audit — G7
**Date:** 2026-06-07 19:34 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 2000 |
| Overall accuracy | 100.0% |
| Wrong answers | 1 |
| Wording issues | 0 |
| Difficulty calibration issues | 853 |
| ✅ Pilot-ready | 24 / 25 |
| ❌ Blocked | 1 |

## ✅ Pilot-Ready Generators (24)

- `g7_subtract_rational`
- `g7_multiply_rational`
- `g7_divide_rational`
- `g7_rational_to_decimal`
- `g7_find_unit_rate`
- `g7_proportional_solve`
- `g7_percent_tax_tip_discount`
- `g7_simple_interest`
- `g7_percent_change`
- `g7_add_sub_linear_expr`
- `g7_expand_linear_expr`
- `g7_solve_linear_rational`
- `g7_solve_distrib_like_terms`
- `g7_fraction_decimal_percent`
- `g7_angle_relationship_solve`
- `g7_circle_area_circumference`
- `g7_angle_equation_solve`
- `g7_composite_area`
- `g7_area_2d_objects`
- `g7_volume_3d_objects`
- `g7_surface_area_3d`
- `g7_theoretical_probability`
- `g7_experimental_probability`
- `g7_compound_probability`


## ❌ Blocked — Fix Before Pilot (1)

### `g7_add_rational` — 79/80 correct (1% wrong)
- ❌ WRONG d2: Q='Add: -1 + 8' | Gen='7' | Should='6' | Conf=high


## ⚠️ Difficulty Calibration Issues

### `g7_add_rational`
- DIFFICULTY d3: Difficulty 3 is too high; adding a whole number and a fraction with a common denominator is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a simple fraction addition with a common denominator, suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; adding fractions with same denominator is a basic skill, typically level 1 or 2.

### `g7_subtract_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; subtracting two single-digit integers is a level 1 task.
- DIFFICULTY d2: Difficulty level 2 is too high; subtracting two single-digit integers is a level 1 task.
- DIFFICULTY d3: The problem is a simple single-digit subtraction (10-9=1), which is typically difficulty level 1, not 3.

### `g7_multiply_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; 9×2 is a basic multiplication fact typically taught at difficulty 1.
- DIFFICULTY d2: Difficulty level 2 is too high; 7×2 is a basic multiplication fact typically taught at difficulty 1.
- DIFFICULTY d3: Difficulty level 3 is too high; multiplying a positive integer by a negative integer is a basic skill typically taught at level 1 or 2.

### `g7_divide_rational`
- DIFFICULTY d3: Difficulty level 3 is too high; dividing a positive integer by a negative integer is a basic operation typically taught at level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; dividing integers with a negative result is a basic skill typically taught at level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; dividing two integers with same sign is a basic skill, typically difficulty 1 or 2.

### `g7_rational_to_decimal`
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction like 9/10 to a decimal is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; converting a simple fraction like 3/25 to a decimal is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction to a decimal is typically a level 1 or 2 task.

### `g7_find_unit_rate`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a simple division problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a simple division problem suitable for difficulty 1 or 2.

### `g7_proportional_solve`
- DIFFICULTY d3: The problem is a straightforward proportion, typically appropriate for difficulty 2 (e.g., middle school), not 3.
- DIFFICULTY d3: The problem is a straightforward proportion, typically appropriate for difficulty 2 (basic ratio/proportion) rather than 3.
- DIFFICULTY d3: The problem is a simple proportion, typically appropriate for difficulty 1 or 2, not 3.

### `g7_percent_tax_tip_discount`
- DIFFICULTY d3: The problem is a straightforward single-step percentage discount, which is typically difficulty level 1 or 2, not 3.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward percentage calculation suitable for level 1 or 2.

### `g7_simple_interest`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.

### `g7_percent_change`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward percentage increase problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage increase problem, typically appropriate for level 1 or 2.
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it is a straightforward single-step percentage increase, typically level 1 or 2.

### `g7_add_sub_linear_expr`
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it involves only basic distribution and combining like terms, which is typically level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simplification with no distribution over parentheses beyond a single sign change, suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward simplification of linear expressions with integer coefficients, suitable for difficulty 1 or 2.

### `g7_expand_linear_expr`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward single-step distribution with no negative signs or fractions, more appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a basic distributive property problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a basic distributive property problem suitable for difficulty 1 or 2.

### `g7_solve_linear_rational`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a simple one-step linear equation, typically difficulty 1 or 2.
- DIFFICULTY d3: The problem is a simple one-step linear equation, typically rated difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is a simple two-step linear equation, which is typically difficulty 1 or 2, not 3.

### `g7_solve_distrib_like_terms`
- DIFFICULTY d3: The problem is a straightforward linear equation with one variable, requiring distribution and combining like terms. This is typically a level 2 difficulty, not level 3.
- DIFFICULTY d3: The problem is a simple linear equation with one variable and integer coefficients, which is typically difficulty level 1 or 2, not 3.
- DIFFICULTY d3: The problem is a simple linear equation with one variable and one distribution step, typically appropriate for difficulty level 2, not 3.

### `g7_fraction_decimal_percent`
- DIFFICULTY d3: Difficulty 3 is too high; converting a fraction with denominator 10 to a decimal is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; converting a decimal to a percent is a basic skill typically taught at lower levels (e.g., difficulty 1 or 2).
- DIFFICULTY d3: Difficulty level 3 is too high; converting a simple percentage to a fraction is typically a level 1 or 2 task.

### `g7_angle_relationship_solve`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward one-step subtraction problem, more appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward one-step subtraction problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic geometry fact (vertical angles are equal) suitable for difficulty 1 or 2.

### `g7_circle_area_circumference`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of the circumference formula with given diameter, suitable for difficulty 1 or 2.
- DIFFICULTY d3: The problem is a straightforward application of the circumference formula with given diameter and π, which is typically taught at a lower difficulty level (e.g., 1 or 2) rather than 3.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of the circumference formula with given diameter, suitable for difficulty 1 or 2.

### `g7_angle_equation_solve`
- DIFFICULTY d3: The problem is a simple linear equation, typically difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it only requires solving a linear equation with one step, which is more appropriate for level 1 or 2.
- DIFFICULTY d3: The problem is a simple one-step linear equation, which is more appropriate for difficulty level 1 or 2, not 3.

### `g7_composite_area`
- DIFFICULTY d4: The problem is a straightforward area subtraction, typically appropriate for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is a straightforward area subtraction, typically suitable for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is a straightforward area subtraction, typically suitable for elementary or middle school, not the hardest level (4).

### `g7_area_2d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a simple formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a standard formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a basic formula, typically difficulty 1 or 2.

### `g7_volume_3d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a standard formula with simple arithmetic, more appropriate for difficulty 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a simple formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward multiplication problem suitable for difficulty 1 or 2.

### `g7_surface_area_3d`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of a formula, suitable for difficulty 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula, typically appropriate for difficulty 1 or 2.

### `g7_theoretical_probability`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for difficulty 1 or 2.

### `g7_experimental_probability`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward experimental probability calculation suitable for difficulty 1 or 2.
- DIFFICULTY d3: The problem is straightforward calculation of experimental probability from given data, which is typically difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it is a basic probability calculation suitable for level 1 or 2.

### `g7_compound_probability`
- DIFFICULTY d3: The problem is straightforward (single multiplication of two simple probabilities) and should be rated difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is straightforward (single multiplication of two independent probabilities), which is more appropriate for difficulty level 1 or 2, not 3.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic independent events problem suitable for level 1 or 2.


## Full Results

| Generator | Accuracy | Wrong% | Pilot Ready |
|---|---|---|---|
| `g7_add_rational` | 79/80 | 1% | ❌ |
| `g7_subtract_rational` | 80/80 | 0% | ✅ |
| `g7_multiply_rational` | 80/80 | 0% | ✅ |
| `g7_divide_rational` | 80/80 | 0% | ✅ |
| `g7_rational_to_decimal` | 80/80 | 0% | ✅ |
| `g7_find_unit_rate` | 80/80 | 0% | ✅ |
| `g7_proportional_solve` | 80/80 | 0% | ✅ |
| `g7_percent_tax_tip_discount` | 80/80 | 0% | ✅ |
| `g7_simple_interest` | 80/80 | 0% | ✅ |
| `g7_percent_change` | 80/80 | 0% | ✅ |
| `g7_add_sub_linear_expr` | 80/80 | 0% | ✅ |
| `g7_expand_linear_expr` | 80/80 | 0% | ✅ |
| `g7_solve_linear_rational` | 80/80 | 0% | ✅ |
| `g7_solve_distrib_like_terms` | 80/80 | 0% | ✅ |
| `g7_fraction_decimal_percent` | 80/80 | 0% | ✅ |
| `g7_angle_relationship_solve` | 80/80 | 0% | ✅ |
| `g7_circle_area_circumference` | 80/80 | 0% | ✅ |
| `g7_angle_equation_solve` | 80/80 | 0% | ✅ |
| `g7_composite_area` | 80/80 | 0% | ✅ |
| `g7_area_2d_objects` | 80/80 | 0% | ✅ |
| `g7_volume_3d_objects` | 80/80 | 0% | ✅ |
| `g7_surface_area_3d` | 80/80 | 0% | ✅ |
| `g7_theoretical_probability` | 80/80 | 0% | ✅ |
| `g7_experimental_probability` | 80/80 | 0% | ✅ |
| `g7_compound_probability` | 80/80 | 0% | ✅ |