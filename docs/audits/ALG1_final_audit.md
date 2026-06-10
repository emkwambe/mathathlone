# Generator Quality Audit — ALG1
**Date:** 2026-06-09 21:27 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 1000 |
| Overall accuracy | 99.7% |
| True wrong answers | 3 |
| Format-only diffs | 0 |
| Wording issues | 0 |
| ✅ Pilot-ready | 22 / 25 |
| ❌ Blocked | 2 |

## ✅ Pilot-Ready Generators (22)

- `alg1_eval_algebraic_expr`
- `alg1_simplify_expression`
- `alg1_translate_verbal`
- `alg1_solve_one_step_add_sub`
- `alg1_solve_one_step_mult_div`
- `alg1_solve_two_step`
- `alg1_solve_multi_step`
- `alg1_solve_vars_both_sides`
- `alg1_solve_literal_equation`
- `alg1_write_linear_equation`
- `alg1_slope_from_points`
- `alg1_slope_intercept_form`
- `alg1_graph_identify_slope`
- `alg1_write_equation_from_table`
- `alg1_write_equation_two_points`
- `alg1_solve_inequality_one_step`
- `alg1_solve_inequality_multi_step`
- `alg1_compound_inequality`
- `alg1_exponent_rules`
- `alg1_add_subtract_polynomials`
- `alg1_factor_trinomial`
- `alg1_quadratic_formula`


## ❌ Blocked — Fix Before Pilot (2)

### `alg1_solve_system_substitution` — 39/40 correct (2% wrong)
- ❌ WRONG d2: Q='Solve the system by substitution:
y = -3x - 7
y = -x - 13

Enter ' | Gen='(3, -16)' | Should='(3, -16)' | Conf=high

### `alg1_solve_system_elimination` — 38/40 correct (5% wrong)
- ❌ WRONG d1: Q='Solve the system by elimination:
4x + 5y = -12
3x + 5y = -14

Ent' | Gen='(2, -4)' | Should='(2, -4)' | Conf=high
- ❌ WRONG d3: Q='Solve the system by elimination:
2x + y = 2
-4x - 4y = 0

Enter t' | Gen='(2, -2)' | Should='(2, -2)' | Conf=high


## Full Results

| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |
|---|---|---|---|---|
| `alg1_eval_algebraic_expr` | 40/40 | 0% | 0 | ✅ |
| `alg1_simplify_expression` | 40/40 | 0% | 0 | ✅ |
| `alg1_translate_verbal` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_one_step_add_sub` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_one_step_mult_div` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_two_step` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_multi_step` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_vars_both_sides` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_literal_equation` | 40/40 | 0% | 0 | ✅ |
| `alg1_write_linear_equation` | 40/40 | 0% | 0 | ✅ |
| `alg1_slope_from_points` | 40/40 | 0% | 0 | ✅ |
| `alg1_slope_intercept_form` | 40/40 | 0% | 0 | ✅ |
| `alg1_graph_identify_slope` | 40/40 | 0% | 0 | ✅ |
| `alg1_write_equation_from_table` | 40/40 | 0% | 0 | ✅ |
| `alg1_write_equation_two_points` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_system_substitution` | 39/40 | 2% | 0 | ❌ |
| `alg1_solve_system_elimination` | 38/40 | 5% | 0 | ❌ |
| `alg1_solve_inequality_one_step` | 40/40 | 0% | 0 | ✅ |
| `alg1_solve_inequality_multi_step` | 40/40 | 0% | 0 | ✅ |
| `alg1_compound_inequality` | 40/40 | 0% | 0 | ✅ |
| `alg1_exponent_rules` | 40/40 | 0% | 0 | ✅ |
| `alg1_add_subtract_polynomials` | 40/40 | 0% | 0 | ✅ |
| `alg1_multiply_polynomials` | 40/40 | 0% | 0 | ❌ |
| `alg1_factor_trinomial` | 40/40 | 0% | 0 | ✅ |
| `alg1_quadratic_formula` | 40/40 | 0% | 0 | ✅ |