# Generator Quality Audit — G7
**Date:** 2026-06-07 16:00 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 2000 |
| Overall accuracy | 99.7% |
| Wrong answers | 5 |
| Wording issues | 1 |
| Difficulty calibration issues | 851 |
| ✅ Pilot-ready | 21 / 25 |
| ❌ Blocked | 3 |

## ✅ Pilot-Ready Generators (21)

- `g7_add_rational`
- `g7_subtract_rational`
- `g7_multiply_rational`
- `g7_rational_to_decimal`
- `g7_find_unit_rate`
- `g7_percent_tax_tip_discount`
- `g7_simple_interest`
- `g7_add_sub_linear_expr`
- `g7_expand_linear_expr`
- `g7_solve_linear_rational`
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


## ❌ Blocked — Fix Before Pilot (3)

### `g7_proportional_solve` — 79/80 correct (1% wrong)

### `g7_percent_change` — 76/80 correct (5% wrong)
- ❌ WRONG d1: Q='A value changed from 100 to 80. What is the percent decrease?' | Gen='20' | Should='20%' | Conf=high
- ❌ WRONG d3: Q='A value changed from 100 to 80. What is the percent decrease?' | Gen='20' | Should='20%' | Conf=high
- ❌ WRONG d4: Q='A value changed from 100 to 85. What is the percent decrease?' | Gen='15' | Should='15%' | Conf=high
- ❌ WRONG d4: Q='A value changed from 100 to 80. What is the percent decrease?' | Gen='20' | Should='20%' | Conf=high

### `g7_solve_distrib_like_terms` — 79/80 correct (1% wrong)
- ❌ WRONG d2: Q='Solve for x: 5(3x + 0) + 1x = -16' | Gen='-1' | Should='-2' | Conf=high


## ⚠️ Wording Issues

### `g7_divide_rational`
- WORDING d4: The expression '7 ÷ 31/3' is ambiguous. It could be interpreted as (7 ÷ 31)/3 or 7 ÷ (31/3). The intended meaning is 7 ÷ (31/3), but the notation without parentheses is unclear. | Q='Divide: 7 ÷ 31/3'


## ⚠️ Difficulty Calibration Issues

### `g7_add_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; adding two single-digit integers is a level 1 task.
- DIFFICULTY d2: Difficulty level 2 is too high; single-digit addition is typically level 1.
- DIFFICULTY d2: Difficulty level 2 is too high; simple single-digit addition is typically difficulty 1.

### `g7_subtract_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; subtracting two small integers is a level 1 task.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward subtraction of a fraction from a whole number, suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; subtracting a negative integer is a basic skill typically taught at level 1 or 2.

### `g7_multiply_rational`
- DIFFICULTY d3: Difficulty 3 is too high; multiplying a fraction by an integer is a basic skill typically at level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; multiplying two negative integers is a basic skill typically taught at level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; multiplying an integer by a fraction is a basic skill typically at level 1 or 2.

### `g7_divide_rational`
- DIFFICULTY d3: Difficulty level 3 is too high; dividing two integers with same sign is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; dividing 1 by 4 is a basic fraction concept typically taught at lower levels (e.g., difficulty 1 or 2).
- DIFFICULTY d3: Difficulty level 3 is too high; dividing a positive integer by a negative integer is a basic skill typically taught at level 1 or 2.

### `g7_rational_to_decimal`
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction like 3/20 to a decimal is typically a level 1 or 2 task.
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction like 3/16 to a decimal is typically a level 1 or 2 task, as it involves basic division and a terminating decimal.
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple repeating decimal like 1/11 is typically a level 1 or 2 task.

### `g7_find_unit_rate`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for level 1 or 2.

### `g7_proportional_solve`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward proportion or unit rate problem suitable for level 2.
- DIFFICULTY d3: The problem is a straightforward proportion or unit rate calculation, typically appropriate for difficulty level 2 (e.g., grades 4-5), not 3.
- DIFFICULTY d3: The problem is a simple unit rate or proportion problem, typically appropriate for difficulty 1 or 2, not 3.

### `g7_percent_tax_tip_discount`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward percentage calculation suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage application, typically appropriate for level 1 or 2.

### `g7_simple_interest`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of simple interest formula, typically taught at a lower level (e.g., level 2).
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.

### `g7_percent_change`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward percent decrease problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: The problem is a straightforward single-step percentage decrease, which is typically difficulty 1 or 2, not 3.
- DIFFICULTY d3: Difficulty is rated 3 (hardest on a 1-4 scale), but this is a basic percent decrease problem, typically difficulty 1 or 2.

### `g7_add_sub_linear_expr`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward linear expression simplification suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward linear expression simplification suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward linear expression simplification with no distribution or negative signs beyond a simple addition, suitable for difficulty 1 or 2.

### `g7_expand_linear_expr`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward distribution with no negative signs or like terms, suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; expanding a single linear expression is typically a level 1 or 2 task.
- DIFFICULTY d3: Difficulty 3 is too high; this is a simple distribution with no negative signs or like terms, appropriate for difficulty 1 or 2.

### `g7_solve_linear_rational`
- DIFFICULTY d3: The problem is a simple one-step linear equation, which is typically difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is a simple one-step linear equation, which is typically difficulty level 1, not 3.
- DIFFICULTY d3: The problem is a simple one-step linear equation, typically difficulty 1 or 2, not 3.

### `g7_solve_distrib_like_terms`
- DIFFICULTY d3: The problem is a straightforward linear equation with one distribution step, which is typically difficulty 2, not 3.
- DIFFICULTY d3: The problem is a straightforward linear equation with distribution and combining like terms, which is typically difficulty 2, not 3.
- DIFFICULTY d3: The problem is a straightforward linear equation with one variable, requiring distribution and combining like terms. This is typically a level 1 or 2 difficulty, not 3.

### `g7_fraction_decimal_percent`
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple percentage to a decimal is typically a level 1 or 2 task.
- DIFFICULTY d3: Difficulty level 3 is too high; converting a terminating decimal to a fraction is typically a level 1 or 2 skill.
- DIFFICULTY d3: Difficulty level 3 is too high; converting a simple fraction to a percent is typically a level 1 or 2 task.

### `g7_angle_relationship_solve`
- DIFFICULTY d3: Difficulty 3 is too high; this is a basic fact recall (vertical angles are equal) suitable for difficulty 1.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward one-step subtraction problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step subtraction problem, more appropriate for level 1 or 2.

### `g7_circle_area_circumference`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward formula application, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of area formula requiring only division and multiplication, suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward formula application with given radius and π, suitable for difficulty 1 or 2.

### `g7_angle_equation_solve`
- DIFFICULTY d3: The problem is straightforward: one-step linear equation after recalling supplementary angles sum to 180. This is typical for difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is straightforward and typical for early algebra; difficulty should be 2, not 3.
- DIFFICULTY d3: The problem is straightforward and typical for early algebra; difficulty 3 (hardest) is too high. It should be difficulty 1 or 2.

### `g7_composite_area`
- DIFFICULTY d4: The problem is straightforward area subtraction, typically appropriate for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is a straightforward subtraction of areas, which is more appropriate for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is straightforward area subtraction, typically suitable for difficulty level 2 or 3, not 4.

### `g7_area_2d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a basic formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of the trapezoid area formula, typically taught at a basic level (difficulty 1 or 2).
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a basic formula, typically difficulty 1 or 2.

### `g7_volume_3d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a simple formula, typically appropriate for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a standard formula, typically appropriate for level 1 or 2.

### `g7_surface_area_3d`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of a formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of a formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of a formula, suitable for difficulty 1 or 2.

### `g7_theoretical_probability`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for level 1 or 2.

### `g7_experimental_probability`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward experimental probability calculation suitable for level 1 or 2.
- DIFFICULTY d3: The problem is straightforward calculation of experimental probability from given frequencies, which is typically at difficulty 1 or 2, not 3.

### `g7_compound_probability`
- DIFFICULTY d3: Difficulty level 3 is too high; the problem involves simple independent events with basic probability, suitable for level 1 or 2.
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it is a straightforward multiplication of two independent probabilities, suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a basic independent events problem suitable for difficulty 1 or 2.


## Full Results

| Generator | Accuracy | Wrong% | Pilot Ready |
|---|---|---|---|
| `g7_add_rational` | 80/80 | 0% | ✅ |
| `g7_subtract_rational` | 80/80 | 0% | ✅ |
| `g7_multiply_rational` | 80/80 | 0% | ✅ |
| `g7_divide_rational` | 80/80 | 0% | ❌ |
| `g7_rational_to_decimal` | 80/80 | 0% | ✅ |
| `g7_find_unit_rate` | 80/80 | 0% | ✅ |
| `g7_proportional_solve` | 79/80 | 1% | ❌ |
| `g7_percent_tax_tip_discount` | 80/80 | 0% | ✅ |
| `g7_simple_interest` | 80/80 | 0% | ✅ |
| `g7_percent_change` | 76/80 | 5% | ❌ |
| `g7_add_sub_linear_expr` | 80/80 | 0% | ✅ |
| `g7_expand_linear_expr` | 80/80 | 0% | ✅ |
| `g7_solve_linear_rational` | 80/80 | 0% | ✅ |
| `g7_solve_distrib_like_terms` | 79/80 | 1% | ❌ |
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