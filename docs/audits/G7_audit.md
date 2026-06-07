# Generator Audit — G7
**Date:** 2026-06-07 10:42

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 300 |
| Overall accuracy | 63.3% |
| Wrong answers | 3 |
| Format issues | 0 |
| Needs review | 20 |

## ❌ Generators Requiring Review

### `g7_add_rational` — 9/12 correct

### `g7_subtract_rational` — 7/12 correct

### `g7_multiply_rational` — 9/12 correct

### `g7_divide_rational` — 5/12 correct

### `g7_find_unit_rate` — 11/12 correct

### `g7_proportional_solve` — 8/12 correct
- WRONG d1: Q='A car travels 4 miles on 12 gallons of gas. How many mi' Gen='36' Claude='4'
- WRONG d4: Q='A car travels 4 miles on 8 gallons of gas. How many mil' Gen='16' Claude='4'
- WRONG d4: Q='A car travels 3 miles on 24 gallons of gas. How many mi' Gen='96' Claude='1.5'

### `g7_percent_tax_tip_discount` — 10/12 correct

### `g7_simple_interest` — 9/12 correct

### `g7_percent_change` — 11/12 correct

### `g7_add_sub_linear_expr` — 6/12 correct

### `g7_expand_linear_expr` — 11/12 correct

### `g7_solve_linear_rational` — 5/12 correct

### `g7_solve_distrib_like_terms` — 0/12 correct

### `g7_circle_area_circumference` — 9/12 correct

### `g7_angle_equation_solve` — 0/12 correct

### `g7_composite_area` — 0/12 correct

### `g7_volume_3d_objects` — 7/12 correct

### `g7_surface_area_3d` — 8/12 correct

### `g7_experimental_probability` — 2/12 correct

### `g7_compound_probability` — 3/12 correct

## All Results

| Generator | Accuracy | Wrong% | Status |
|---|---|---|---|
| `g7_add_rational` | 9/12 | 25% | ❌ Review |
| `g7_subtract_rational` | 7/12 | 41% | ❌ Review |
| `g7_multiply_rational` | 9/12 | 25% | ❌ Review |
| `g7_divide_rational` | 5/12 | 58% | ❌ Review |
| `g7_rational_to_decimal` | 12/12 | 0% | ✅ |
| `g7_find_unit_rate` | 11/12 | 8% | ❌ Review |
| `g7_proportional_solve` | 8/12 | 33% | ❌ Review |
| `g7_percent_tax_tip_discount` | 10/12 | 16% | ❌ Review |
| `g7_simple_interest` | 9/12 | 25% | ❌ Review |
| `g7_percent_change` | 11/12 | 8% | ❌ Review |
| `g7_add_sub_linear_expr` | 6/12 | 50% | ❌ Review |
| `g7_expand_linear_expr` | 11/12 | 8% | ❌ Review |
| `g7_solve_linear_rational` | 5/12 | 58% | ❌ Review |
| `g7_solve_distrib_like_terms` | 0/12 | 100% | ❌ Review |
| `g7_fraction_decimal_percent` | 12/12 | 0% | ✅ |
| `g7_angle_relationship_solve` | 12/12 | 0% | ✅ |
| `g7_circle_area_circumference` | 9/12 | 25% | ❌ Review |
| `g7_angle_equation_solve` | 0/12 | 100% | ❌ Review |
| `g7_composite_area` | 0/12 | 100% | ❌ Review |
| `g7_area_2d_objects` | 12/12 | 0% | ✅ |
| `g7_volume_3d_objects` | 7/12 | 41% | ❌ Review |
| `g7_surface_area_3d` | 8/12 | 33% | ❌ Review |
| `g7_theoretical_probability` | 12/12 | 0% | ✅ |
| `g7_experimental_probability` | 2/12 | 83% | ❌ Review |
| `g7_compound_probability` | 3/12 | 75% | ❌ Review |