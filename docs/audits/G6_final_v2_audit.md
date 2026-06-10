# Generator Quality Audit — G6
**Date:** 2026-06-10 00:59 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 34 |
| Total evaluations | 1360 |
| Overall accuracy | 99.9% |
| True wrong answers | 1 |
| Format-only diffs | 0 |
| Wording issues | 0 |
| ✅ Pilot-ready | 33 / 34 |
| ❌ Blocked | 1 |

## ✅ Pilot-Ready Generators (33)

- `g6_ns_add_sub_decimals`
- `g6_ns_multiply_decimals`
- `g6_ns_long_division_whole`
- `g6_ns_divide_decimals`
- `g6_ns_divide_fractions`
- `g6_ns_fraction_division_word`
- `g6_ns_find_gcf`
- `g6_ns_find_lcm`
- `g6_ns_gcf_rewrite_expression`
- `g6_ns_compute_absolute_value`
- `g6_ns_compare_order_rationals`
- `g6_ns_coordinate_distance_6`
- `g6_rp_calculate_unit_rate`
- `g6_rp_ratio_table_solve`
- `g6_rp_ratio_word_problem`
- `g6_rp_percent_of_quantity`
- `g6_rp_percent_whole_part`
- `g6_rp_fraction_decimal_pct_6`
- `g6_rp_unit_conversion`
- `g6_ee_evaluate_algebraic_expr`
- `g6_ee_expand_distributive_6`
- `g6_ee_combine_like_terms_6`
- `g6_ee_solve_one_step_add_sub`
- `g6_ee_solve_one_step_mul_div`
- `g6_geo_area_triangle_6`
- `g6_geo_area_parallelogram`
- `g6_geo_area_trapezoid`
- `g6_geo_volume_rect_prism_whole`
- `g6_geo_volume_rect_prism_frac`
- `g6_sp_five_number_summary`
- `g6_sp_compute_center_stats`
- `g6_sp_compute_variability`
- `g6_sp_compute_mad`


## ❌ Blocked — Fix Before Pilot (1)

### `g6_ee_eval_numerical_exponents` — 39/40 correct (2% wrong)
- ❌ WRONG d1: Q='Evaluate: 2^2 + 18' | Gen='22' | Should='22' | Conf=high


## Full Results

| Generator | Accuracy | Wrong% | Format Diffs | Pilot Ready |
|---|---|---|---|---|
| `g6_ns_add_sub_decimals` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_multiply_decimals` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_long_division_whole` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_divide_decimals` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_divide_fractions` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_fraction_division_word` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_find_gcf` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_find_lcm` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_gcf_rewrite_expression` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_compute_absolute_value` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_compare_order_rationals` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_coordinate_distance_6` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_calculate_unit_rate` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_ratio_table_solve` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_ratio_word_problem` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_percent_of_quantity` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_percent_whole_part` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_fraction_decimal_pct_6` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_unit_conversion` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_eval_numerical_exponents` | 39/40 | 2% | 0 | ❌ |
| `g6_ee_evaluate_algebraic_expr` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_expand_distributive_6` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_combine_like_terms_6` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_solve_one_step_add_sub` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_solve_one_step_mul_div` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_area_triangle_6` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_area_parallelogram` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_area_trapezoid` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_volume_rect_prism_whole` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_volume_rect_prism_frac` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_five_number_summary` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_center_stats` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_variability` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_mad` | 40/40 | 0% | 0 | ✅ |