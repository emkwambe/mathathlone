# Generator Quality Audit — G8
**Date:** 2026-06-09 03:06 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 25 |
| Total evaluations | 1000 |
| Overall accuracy | 98.9% |
| True wrong answers | 11 |
| Format-only diffs | 0 |
| Wording issues | 0 |
| ✅ Pilot-ready | 21 / 25 |
| ❌ Blocked | 4 |

## ✅ Pilot-Ready Generators (21)

- `g8_eval_roots`
- `g8_solve_square_eq`
- `g8_solve_cube_eq`
- `g8_compare_irrationals`
- `g8_simplify_exponents`
- `g8_solve_linear_multistep`
- `g8_solve_vars_both_sides`
- `g8_evaluate_function_notation`
- `g8_classify_equation_type`
- `g8_solve_system_elimination`
- `g8_construct_linear_function`
- `g8_coordinate_dilation`
- `g8_similar_figures_solve`
- `g8_triangle_angle_sum`
- `g8_pythagorean_missing_side`
- `g8_pythagorean_2d_context`
- `g8_pythagorean_converse`
- `g8_coordinate_distance`
- `g8_volume_cone`
- `g8_relative_frequency_table`
- `g8_pythagorean_3d_context`


## ❌ Blocked — Fix Before Pilot (4)

### `g8_solve_system_substitution` — 39/40 correct (2% wrong)
- ❌ WRONG d1: Q='Solve the system by substitution:
y = -2x - 2
y = -x - 6

Enter t' | Gen='(4, -10)' | Should='(4, -10)' | Conf=high

### `g8_volume_cylinder` — 39/40 correct (2% wrong)
- ❌ WRONG d4: Q='Find the volume of a cylinder with radius 10 cm and height 17 cm.' | Gen='5340.7' | Should='5340.70' | Conf=high

### `g8_volume_sphere` — 32/40 correct (20% wrong)
- ❌ WRONG d1: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d2: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d3: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high
- ❌ WRONG d3: Q='Find the volume of a sphere with radius 7 cm. Use π ≈ 3.14159 and' | Gen='1436.75' | Should='1436.76' | Conf=high

### `g8_volume_3d_word_problem` — 39/40 correct (2% wrong)
- ❌ WRONG d3: Q='A water tank is shaped like a cylinder with radius 3 m and height' | Gen='424.11' | Should='424.12' | Conf=high


## Full Results

| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |
|---|---|---|---|---|
| `g8_eval_roots` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_square_eq` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_cube_eq` | 40/40 | 0% | 0 | ✅ |
| `g8_compare_irrationals` | 40/40 | 0% | 0 | ✅ |
| `g8_simplify_exponents` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_linear_multistep` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_vars_both_sides` | 40/40 | 0% | 0 | ✅ |
| `g8_evaluate_function_notation` | 40/40 | 0% | 0 | ✅ |
| `g8_classify_equation_type` | 40/40 | 0% | 0 | ✅ |
| `g8_solve_system_substitution` | 39/40 | 2% | 0 | ❌ |
| `g8_solve_system_elimination` | 40/40 | 0% | 0 | ✅ |
| `g8_construct_linear_function` | 40/40 | 0% | 0 | ✅ |
| `g8_coordinate_dilation` | 40/40 | 0% | 0 | ✅ |
| `g8_similar_figures_solve` | 40/40 | 0% | 0 | ✅ |
| `g8_triangle_angle_sum` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_missing_side` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_2d_context` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_converse` | 40/40 | 0% | 0 | ✅ |
| `g8_coordinate_distance` | 40/40 | 0% | 0 | ✅ |
| `g8_volume_cylinder` | 39/40 | 2% | 0 | ❌ |
| `g8_volume_cone` | 40/40 | 0% | 0 | ✅ |
| `g8_volume_sphere` | 32/40 | 20% | 0 | ❌ |
| `g8_volume_3d_word_problem` | 39/40 | 2% | 0 | ❌ |
| `g8_relative_frequency_table` | 40/40 | 0% | 0 | ✅ |
| `g8_pythagorean_3d_context` | 40/40 | 0% | 0 | ✅ |