# Generator Quality Audit — G7
**Date:** 2026-06-07 12:54 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 1000 |
| Overall accuracy | 99.0% |
| Wrong answers | 10 |
| Wording issues | 15 |
| Difficulty calibration issues | 440 |
| ✅ Pilot-ready | 24 / 25 |
| ❌ Blocked | 1 |

## ✅ Pilot-Ready Generators (24)

- `g7_add_rational`
- `g7_subtract_rational`
- `g7_multiply_rational`
- `g7_divide_rational`
- `g7_rational_to_decimal`
- `g7_find_unit_rate`
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

### `g7_proportional_solve` — 30/40 correct (25% wrong)
- ❌ WRONG d1: Q='A car travels 3 miles on 6 gallons of gas. How many miles can it ' | Gen='24' | Should='6' | Conf=high
- ❌ WRONG d2: Q='A car travels 4 miles on 8 gallons of gas. How many miles can it ' | Gen='56' | Should='14' | Conf=high
- ❌ WRONG d2: Q='A car travels 3 miles on 18 gallons of gas. How many miles can it' | Gen='108' | Should='3' | Conf=high
- ❌ WRONG d2: Q='A car travels 2 miles on 18 gallons of gas. How many miles can it' | Gen='36' | Should='0.444...' | Conf=high
- ❌ WRONG d2: Q='A car travels 2 miles on 22 gallons of gas. How many miles can it' | Gen='44' | Should='0.363636...' | Conf=high


## ⚠️ Wording Issues

### `g7_find_unit_rate`
- WORDING d1: The phrase 'Apples cost travels 24 dollars in 4 pounds' is grammatically incorrect and unclear. It should be 'Apples cost 24 dollars for 4 pounds.' | Q='Apples cost travels 24 dollars in 4 pounds. What is the unit rate'
- WORDING d1: The phrase 'A pump moves travels 18 liters' is grammatically incorrect; it should be 'A pump moves 18 liters' or 'A pump travels 18 liters'. | Q='A pump moves travels 18 liters in 3 minutes. What is the unit rat'
- WORDING d1: Typo: 'moves travels' should be 'moves' or 'travels', not both. | Q='A pump moves travels 10 liters in 2 minutes. What is the unit rat'
- WORDING d1: The phrase 'Apples cost travels 8 dollars in 2 pounds' is grammatically incorrect and unclear. It should be 'Apples cost 8 dollars for 2 pounds' or 'Apples cost 8 dollars per 2 pounds'. | Q='Apples cost travels 8 dollars in 2 pounds. What is the unit rate '


## ⚠️ Difficulty Calibration Issues

### `g7_add_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; adding single-digit integers is typically difficulty 1.
- DIFFICULTY d3: Difficulty level 3 is too high; adding a whole number to a fraction is a basic skill typically at level 1 or 2.
- DIFFICULTY d3: The problem is a simple addition of two negative numbers with a common denominator, which is more appropriate for difficulty level 1 or 2, not 3.

### `g7_subtract_rational`
- DIFFICULTY d3: Difficulty 3 is too high; subtracting an integer and a fraction with same denominator is a basic skill, typically difficulty 1 or 2.
- DIFFICULTY d3: The problem is a simple integer subtraction with a negative number, which is typically taught at a lower difficulty level (e.g., 1 or 2) rather than 3.
- DIFFICULTY d3: Difficulty level 3 is too high; subtracting two small integers is a basic skill typically taught at level 1.

### `g7_multiply_rational`
- DIFFICULTY d3: Difficulty level 3 is too high; 7×8 is a basic multiplication fact typically taught at difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; multiplying a fraction by a whole number is a basic skill typically at difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; multiplying two integers with one negative is a basic skill, typically difficulty 1 or 2.

### `g7_divide_rational`
- DIFFICULTY d2: Difficulty level 2 is too high; 10 ÷ 10 is a basic fact suitable for difficulty 1.
- DIFFICULTY d3: The problem is a straightforward fraction division with integers, typically taught at a lower difficulty level (e.g., 1 or 2). Rating it as 3 (hardest) overestimates the complexity.
- DIFFICULTY d3: The problem is a simple division of two integers, which is typically taught at a lower difficulty level (e.g., 1 or 2) rather than 3.

### `g7_rational_to_decimal`
- DIFFICULTY d3: Difficulty level 3 is too high; converting a simple fraction like 1/5 to a decimal is a basic skill typically taught at lower levels (e.g., difficulty 1 or 2).
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction to a repeating decimal is typically a level 1 or 2 task.
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple fraction like 1/3 to a decimal is typically a level 1 or 2 task.

### `g7_find_unit_rate`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: The problem is a simple division (18 ÷ 3) which is typically taught at a lower difficulty level (e.g., 1 or 2), not 3.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward division problem suitable for difficulty 1 or 2.

### `g7_proportional_solve`
- DIFFICULTY d2: The question is trivial (answer is given in the question), so difficulty should be 1, not 2.
- DIFFICULTY d2: The problem is straightforward but the generator's solution steps contain a fundamental error; difficulty should reflect correct reasoning, not the flawed steps.
- DIFFICULTY d2: The problem is trivial (simple division) but the generator's solution steps are incorrect, making the difficulty misaligned.

### `g7_percent_tax_tip_discount`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward percentage calculation suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage application, typically appropriate for level 1 or 2.
- DIFFICULTY d4: The problem involves a single-step percentage discount, which is typically appropriate for difficulty level 2 or 3, not 4 (hardest).

### `g7_simple_interest`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation with given values, suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation, typically level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward simple interest calculation suitable for level 1 or 2.

### `g7_percent_change`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward single-step percentage decrease, typically appropriate for level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward percent decrease problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward percent decrease problem suitable for difficulty 1 or 2.

### `g7_add_sub_linear_expr`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward linear expression simplification suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward linear expression simplification suitable for level 1 or 2.
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it involves only basic distribution and integer subtraction, suitable for level 1 or 2.

### `g7_expand_linear_expr`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic distributive property problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; expanding a simple linear expression like 3(2x+1) is typically a level 1 or 2 skill.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward distribution of a constant, suitable for difficulty 1 or 2.

### `g7_solve_linear_rational`
- DIFFICULTY d3: The problem is a simple one-step linear equation, which is typically difficulty level 1 or 2, not 3.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a simple one-step linear equation, appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a simple one-step linear equation, typically difficulty 1 or 2.

### `g7_solve_distrib_like_terms`
- DIFFICULTY d3: The problem is a straightforward linear equation with one variable, requiring distribution and combining like terms. This is typically a level 2 difficulty, not level 3.
- DIFFICULTY d3: The problem is a simple linear equation with one variable and no fractions or decimals, which is typically difficulty 1 or 2, not 3.
- DIFFICULTY d3: The problem is a straightforward linear equation with distribution, typically appropriate for difficulty 2, not 3.

### `g7_fraction_decimal_percent`
- DIFFICULTY d3: Difficulty level 3 is too high; converting a simple percentage to a fraction is typically a level 1 or 2 task.
- DIFFICULTY d3: Difficulty level 3 is too high; converting 0.1 to 1/10 is a basic skill typically taught at difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; converting a simple percentage to a fraction is typically a level 1 or 2 task.

### `g7_angle_relationship_solve`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic recall of vertical angles theorem, typically level 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward one-step problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward one-step subtraction problem suitable for difficulty 1 or 2.

### `g7_circle_area_circumference`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward formula application with rounding, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula with given π, suitable for difficulty 1 or 2.
- DIFFICULTY d3: The problem is too easy for difficulty level 3; it only requires basic area formula and rounding, suitable for level 1 or 2.

### `g7_angle_equation_solve`
- DIFFICULTY d3: The problem is straightforward: set up a linear equation from supplementary angles and solve. This is typical for a difficulty level 2, not 3.
- DIFFICULTY d3: The problem is straightforward: one-step linear equation after setting up the supplementary angle condition. Difficulty 3 (hardest) is too high; it should be 1 or 2.
- DIFFICULTY d3: The problem is a simple linear equation, typically appropriate for difficulty level 1 or 2, not 3.

### `g7_composite_area`
- DIFFICULTY d4: The problem is straightforward area subtraction, typically suitable for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is straightforward area subtraction, typically suitable for difficulty level 2 or 3, not 4.
- DIFFICULTY d4: The problem is straightforward area subtraction, typically suitable for difficulty 2 or 3, not 4.

### `g7_area_2d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a simple formula, typically appropriate for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a basic formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a basic formula, typically difficulty 1 or 2.

### `g7_volume_3d_objects`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a single formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a standard formula, typically appropriate for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula with simple arithmetic, more appropriate for difficulty 2.

### `g7_surface_area_3d`
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward application of a formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula, typically difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward application of a formula, typically appropriate for difficulty 1 or 2.

### `g7_theoretical_probability`
- DIFFICULTY d3: The problem is too simple for difficulty level 3; it is a basic probability calculation suitable for level 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a basic probability problem suitable for level 1 or 2.

### `g7_experimental_probability`
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward experimental probability calculation suitable for level 1 or 2.
- DIFFICULTY d3: The problem is straightforward: count favorable outcomes over total trials and simplify. This is typical for difficulty 1 or 2, not 3.
- DIFFICULTY d3: Difficulty level 3 is too high; this is a straightforward experimental probability calculation from given frequencies, typically difficulty 1 or 2.

### `g7_compound_probability`
- DIFFICULTY d3: Difficulty 3 is too high; this is a basic independent events problem suitable for difficulty 1 or 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward independent events problem suitable for difficulty 2.
- DIFFICULTY d3: Difficulty 3 is too high; this is a straightforward independent events problem suitable for difficulty 2.


## Full Results

| Generator | Accuracy | Wrong% | Pilot Ready |
|---|---|---|---|
| `g7_add_rational` | 40/40 | 0% | ✅ |
| `g7_subtract_rational` | 40/40 | 0% | ✅ |
| `g7_multiply_rational` | 40/40 | 0% | ✅ |
| `g7_divide_rational` | 40/40 | 0% | ✅ |
| `g7_rational_to_decimal` | 40/40 | 0% | ✅ |
| `g7_find_unit_rate` | 40/40 | 0% | ✅ |
| `g7_proportional_solve` | 30/40 | 25% | ❌ |
| `g7_percent_tax_tip_discount` | 40/40 | 0% | ✅ |
| `g7_simple_interest` | 40/40 | 0% | ✅ |
| `g7_percent_change` | 40/40 | 0% | ✅ |
| `g7_add_sub_linear_expr` | 40/40 | 0% | ✅ |
| `g7_expand_linear_expr` | 40/40 | 0% | ✅ |
| `g7_solve_linear_rational` | 40/40 | 0% | ✅ |
| `g7_solve_distrib_like_terms` | 40/40 | 0% | ✅ |
| `g7_fraction_decimal_percent` | 40/40 | 0% | ✅ |
| `g7_angle_relationship_solve` | 40/40 | 0% | ✅ |
| `g7_circle_area_circumference` | 40/40 | 0% | ✅ |
| `g7_angle_equation_solve` | 40/40 | 0% | ✅ |
| `g7_composite_area` | 40/40 | 0% | ✅ |
| `g7_area_2d_objects` | 40/40 | 0% | ✅ |
| `g7_volume_3d_objects` | 40/40 | 0% | ✅ |
| `g7_surface_area_3d` | 40/40 | 0% | ✅ |
| `g7_theoretical_probability` | 40/40 | 0% | ✅ |
| `g7_experimental_probability` | 40/40 | 0% | ✅ |
| `g7_compound_probability` | 40/40 | 0% | ✅ |