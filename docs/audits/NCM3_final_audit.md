# Generator Quality Audit — NCM3
**Date:** 2026-06-09 22:07 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 1000 |
| Overall accuracy | 98.4% |
| True wrong answers | 16 |
| Format-only diffs | 0 |
| Wording issues | 0 |
| ✅ Pilot-ready | 21 / 25 |
| ❌ Blocked | 4 |

## ✅ Pilot-Ready Generators (21)

- `m3_evaluate_function`
- `m3_compose_functions`
- `m3_inverse_function`
- `m3_domain_range`
- `m3_transformation_describe`
- `m3_evaluate_exponential`
- `m3_evaluate_logarithm`
- `m3_expand_condense_log`
- `m3_exponential_growth_decay`
- `m3_polynomial_end_behavior`
- `m3_divide_polynomial`
- `m3_rational_root_theorem`
- `m3_simplify_rational_expr`
- `m3_solve_rational_eq`
- `m3_simplify_radical_expr`
- `m3_solve_radical_eq`
- `m3_unit_circle_values`
- `m3_trig_equation_solve`
- `m3_law_of_sines`
- `m3_normal_distribution`
- `m3_confidence_interval`


## ❌ Blocked — Fix Before Pilot (4)

### `m3_solve_exponential_eq` — 33/40 correct (17% wrong)
- ❌ WRONG d1: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high
- ❌ WRONG d1: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high
- ❌ WRONG d1: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high
- ❌ WRONG d2: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high
- ❌ WRONG d2: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high
- ❌ WRONG d2: Q='Solve 6^x = 100. Round your answer to 3 decimal places.' | Gen='2.570' | Should='2.571' | Conf=high

### `m3_polynomial_zeros` — 39/40 correct (2% wrong)
- ❌ WRONG d4: Q='Find all zeros of f(x) = (x - 4)(x + 1)(x + 3). Enter the zeros s' | Gen='-3, -1, 4' | Should='-3, -1, 4' | Conf=high

### `m3_factor_polynomial` — 35/40 correct (12% wrong)
- ❌ WRONG d1: Q='Factor by grouping: x³ - 3x² - 4x + 12' | Gen='(x - 3)(x² - 4)' | Should='(x - 3)(x - 2)(x + 2)' | Conf=high
- ❌ WRONG d3: Q='Factor by grouping: x³ - 4x² - 4x + 16' | Gen='(x - 4)(x² - 4)' | Should='(x - 4)(x - 2)(x + 2)' | Conf=high
- ❌ WRONG d3: Q='Factor by grouping: x³ - 2x² - 4x + 8' | Gen='(x - 2)(x² - 4)' | Should='(x - 2)(x - 2)(x + 2)' | Conf=high
- ❌ WRONG d3: Q='Factor by grouping: x³ + 2x² - 4x - 8' | Gen='(x + 2)(x² - 4)' | Should='(x+2)(x-2)(x+2) or (x+2)^2(x-2)' | Conf=high
- ❌ WRONG d3: Q='Factor by grouping: x³ - 1x² - 4x + 4' | Gen='(x - 1)(x² - 4)' | Should='(x - 1)(x - 2)(x + 2)' | Conf=high

### `m3_complex_numbers` — 37/40 correct (7% wrong)
- ❌ WRONG d1: Q='Simplify: (-2 - i)(-2 + 4i)' | Gen='8 - 6i' | Should='8 - 6i' | Conf=high
- ❌ WRONG d4: Q='Simplify: (2 + 4i)(-2 - 3i)' | Gen='8 - 14i' | Should='8 - 14i' | Conf=high
- ❌ WRONG d4: Q='Simplify: (7 + 6i)(-2 - 5i)' | Gen='16 - 47i' | Should='16 - 47i' | Conf=high


## Full Results

| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |
|---|---|---|---|---|
| `m3_evaluate_function` | 40/40 | 0% | 0 | ✅ |
| `m3_compose_functions` | 40/40 | 0% | 0 | ✅ |
| `m3_inverse_function` | 40/40 | 0% | 0 | ✅ |
| `m3_domain_range` | 40/40 | 0% | 0 | ✅ |
| `m3_transformation_describe` | 40/40 | 0% | 0 | ✅ |
| `m3_evaluate_exponential` | 40/40 | 0% | 0 | ✅ |
| `m3_solve_exponential_eq` | 33/40 | 17% | 0 | ❌ |
| `m3_evaluate_logarithm` | 40/40 | 0% | 0 | ✅ |
| `m3_expand_condense_log` | 40/40 | 0% | 0 | ✅ |
| `m3_exponential_growth_decay` | 40/40 | 0% | 0 | ✅ |
| `m3_polynomial_end_behavior` | 40/40 | 0% | 0 | ✅ |
| `m3_polynomial_zeros` | 39/40 | 2% | 0 | ❌ |
| `m3_factor_polynomial` | 35/40 | 12% | 0 | ❌ |
| `m3_divide_polynomial` | 40/40 | 0% | 0 | ✅ |
| `m3_rational_root_theorem` | 40/40 | 0% | 0 | ✅ |
| `m3_simplify_rational_expr` | 40/40 | 0% | 0 | ✅ |
| `m3_solve_rational_eq` | 40/40 | 0% | 0 | ✅ |
| `m3_simplify_radical_expr` | 40/40 | 0% | 0 | ✅ |
| `m3_solve_radical_eq` | 40/40 | 0% | 0 | ✅ |
| `m3_complex_numbers` | 37/40 | 7% | 0 | ❌ |
| `m3_unit_circle_values` | 40/40 | 0% | 0 | ✅ |
| `m3_trig_equation_solve` | 40/40 | 0% | 0 | ✅ |
| `m3_law_of_sines` | 40/40 | 0% | 0 | ✅ |
| `m3_normal_distribution` | 40/40 | 0% | 0 | ✅ |
| `m3_confidence_interval` | 40/40 | 0% | 0 | ✅ |