# Generator Quality Audit — G6
**Date:** 2026-06-10 00:02 | **Evaluator:** DEEPSEEK | **Mode:** STRICT zero-tolerance

## Summary

| Metric | Value |
|---|---|
| Generators tested | 34 |
| Total evaluations | 1360 |
| Overall accuracy | 98.9% |
| True wrong answers | 14 |
| Format-only diffs | 0 |
| Wording issues | 30 |
| ✅ Pilot-ready | 32 / 34 |
| ❌ Blocked | 2 |

## ✅ Pilot-Ready Generators (32)

- `g6_ns_add_sub_decimals`
- `g6_ns_multiply_decimals`
- `g6_ns_long_division_whole`
- `g6_ns_divide_decimals`
- `g6_ns_divide_fractions`
- `g6_ns_fraction_division_word`
- `g6_ns_find_gcf`
- `g6_ns_find_lcm`
- `g6_ns_gcf_rewrite_expression`
- `g6_ns_compare_order_rationals`
- `g6_ns_coordinate_distance_6`
- `g6_rp_ratio_table_solve`
- `g6_rp_ratio_word_problem`
- `g6_rp_percent_of_quantity`
- `g6_rp_percent_whole_part`
- `g6_rp_fraction_decimal_pct_6`
- `g6_rp_unit_conversion`
- `g6_ee_eval_numerical_exponents`
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


## ❌ Blocked — Fix Before Pilot (2)

### `g6_ns_compute_absolute_value` — 38/40 correct (5% wrong)
- ❌ WRONG d1: Q='Find: |-6/6|' | Gen='6/6' | Should='1' | Conf=high
- ❌ WRONG d1: Q='Find: |-4/2|' | Gen='4/2' | Should='2' | Conf=high

### `g6_rp_calculate_unit_rate` — 28/40 correct (30% wrong)
- ❌ WRONG d1: Q='A box of 90 apples costs $ 3 apples. What is the unit rate in dol' | Gen='30' | Should='0.0333...' | Conf=high
- ❌ WRONG d1: Q='A box of 48 apples costs $ 2 apples. What is the unit rate in dol' | Gen='24' | Should='0.041666...' | Conf=high
- ❌ WRONG d1: Q='A box of 104 apples costs $ 4 apples. What is the unit rate in do' | Gen='26' | Should='0.0384615' | Conf=high
- ❌ WRONG d1: Q='A box of 15 apples costs $ 3 apples. What is the unit rate in dol' | Gen='5' | Should='0.2' | Conf=high
- ❌ WRONG d2: Q='A box of 152 apples costs $ 4 apples. What is the unit rate in do' | Gen='38' | Should='0.0263' | Conf=high
- ❌ WRONG d2: Q='A box of 576 apples costs $ 12 apples. What is the unit rate in d' | Gen='48' | Should='0.0208333...' | Conf=high


## ⚠️ Wording Issues

### `g6_ns_fraction_division_word`
- WORDING d1: The word 'foots' is grammatically incorrect; should be 'feet'. | Q='A ribbon is 4/6 foots long. How many 1/6-foot pieces can be cut f'
- WORDING d2: The word 'foots' is grammatically incorrect; should be 'feet'. | Q='A ribbon is 4/6 foots long. How many 1/6-foot pieces can be cut f'
- WORDING d2: The word 'foots' is grammatically incorrect; should be 'feet'. | Q='A ribbon is 5/2 foots long. How many 1/2-foot pieces can be cut f'
- WORDING d2: The word 'foots' is grammatically incorrect; should be 'feet'. | Q='A ribbon is 4/8 foots long. How many 1/8-foot pieces can be cut f'

### `g6_rp_calculate_unit_rate`
- WORDING d1: The question says 'costs $3 apples' which is ambiguous; likely meant 'costs $3' or 'costs $3 per box'. | Q='A box of 90 apples costs $ 3 apples. What is the unit rate in dol'
- WORDING d1: The question says 'costs $2 apples' which is nonsensical; it should be 'costs $2' or 'costs $2 per box'. | Q='A box of 48 apples costs $ 2 apples. What is the unit rate in dol'
- WORDING d1: The question states 'costs $4 apples' which is nonsensical; it should be 'costs $4' or 'costs $4 per box'. | Q='A box of 104 apples costs $ 4 apples. What is the unit rate in do'
- WORDING d1: The question says 'costs $3 apples' which is nonsensical; it should be 'costs $3' or 'costs $3 per box'. | Q='A box of 15 apples costs $ 3 apples. What is the unit rate in dol'


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
| `g6_ns_compute_absolute_value` | 38/40 | 5% | 0 | ❌ |
| `g6_ns_compare_order_rationals` | 40/40 | 0% | 0 | ✅ |
| `g6_ns_coordinate_distance_6` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_calculate_unit_rate` | 28/40 | 30% | 0 | ❌ |
| `g6_rp_ratio_table_solve` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_ratio_word_problem` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_percent_of_quantity` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_percent_whole_part` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_fraction_decimal_pct_6` | 40/40 | 0% | 0 | ✅ |
| `g6_rp_unit_conversion` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_eval_numerical_exponents` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_evaluate_algebraic_expr` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_expand_distributive_6` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_combine_like_terms_6` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_solve_one_step_add_sub` | 40/40 | 0% | 0 | ✅ |
| `g6_ee_solve_one_step_mul_div` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_area_triangle_6` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_area_parallelogram` | 39/40 | 0% | 0 | ✅ |
| `g6_geo_area_trapezoid` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_volume_rect_prism_whole` | 40/40 | 0% | 0 | ✅ |
| `g6_geo_volume_rect_prism_frac` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_five_number_summary` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_center_stats` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_variability` | 40/40 | 0% | 0 | ✅ |
| `g6_sp_compute_mad` | 40/40 | 0% | 0 | ✅ |