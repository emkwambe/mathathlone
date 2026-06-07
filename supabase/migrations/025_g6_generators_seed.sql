-- =============================================================================
-- 025_g6_generators_seed.sql
-- =============================================================================
-- Seed the 34 NC Grade 6 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-7, g6_* block).
--
-- Same NULL-safe CTE + INNER JOIN pattern as 023/024: only lesson_numbers
-- that actually exist in atomic_concepts land. Trailing verification block
-- prints what was inserted plus a rows_seeded / rows_expected comparison.
-- =============================================================================

BEGIN;

WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    -- BATCH 1: NS — Decimal & Fraction Operations
    ('M6.NS.1.1',  'g6_ns_add_sub_decimals',         'decimal'),
    ('M6.NS.1.2',  'g6_ns_multiply_decimals',        'decimal'),
    ('M6.NS.1.3',  'g6_ns_long_division_whole',      'decimal'),
    ('M6.NS.1.4',  'g6_ns_divide_decimals',          'decimal'),
    ('M6.NS.2.2',  'g6_ns_divide_fractions',         'fraction'),
    -- BATCH 2: NS — Word Problem, GCF/LCM, Absolute Value
    ('M6.NS.2.3',  'g6_ns_fraction_division_word',   'fraction'),
    ('M6.NS.3.1',  'g6_ns_find_gcf',                 'integer'),
    ('M6.NS.3.2',  'g6_ns_find_lcm',                 'integer'),
    ('M6.NS.3.3',  'g6_ns_gcf_rewrite_expression',   'text'),
    ('M6.NS.4.4',  'g6_ns_compute_absolute_value',   'decimal'),
    -- BATCH 3: NS Compare/Distance, RP Rates & Ratios
    ('M6.NS.4.5',  'g6_ns_compare_order_rationals',  'text'),
    ('M6.NS.4.7',  'g6_ns_coordinate_distance_6',    'integer_or_decimal'),
    ('M6.RP.1.3',  'g6_rp_calculate_unit_rate',      'decimal'),
    ('M6.RP.2.1',  'g6_rp_ratio_table_solve',        'integer_or_decimal'),
    ('M6.RP.2.3',  'g6_rp_ratio_word_problem',       'integer_or_decimal'),
    -- BATCH 4: RP Percents & Conversions, EE Exponents
    ('M6.RP.3.2',  'g6_rp_percent_of_quantity',      'decimal'),
    ('M6.RP.3.3',  'g6_rp_percent_whole_part',       'decimal'),
    ('M6.RP.3.4',  'g6_rp_fraction_decimal_pct_6',   'decimal_or_fraction_or_percent'),
    ('M6.RP.4.1',  'g6_rp_unit_conversion',          'decimal'),
    ('M6.EE.1.1',  'g6_ee_eval_numerical_exponents', 'integer'),
    -- BATCH 5: EE Expressions & One-Step Equations
    ('M6.EE.1.4',  'g6_ee_evaluate_algebraic_expr',  'integer_or_decimal'),
    ('M6.EE.2.1',  'g6_ee_expand_distributive_6',    'text'),
    ('M6.EE.2.2',  'g6_ee_combine_like_terms_6',     'text'),
    ('M6.EE.3.2',  'g6_ee_solve_one_step_add_sub',   'integer_or_decimal'),
    ('M6.EE.3.3',  'g6_ee_solve_one_step_mul_div',   'decimal_or_fraction'),
    -- BATCH 6: GEO Area & Volume
    ('M6.GEO.1.1', 'g6_geo_area_triangle_6',         'decimal'),
    ('M6.GEO.1.2', 'g6_geo_area_parallelogram',      'decimal'),
    ('M6.GEO.1.3', 'g6_geo_area_trapezoid',          'decimal'),
    ('M6.GEO.3.2', 'g6_geo_volume_rect_prism_whole', 'integer'),
    ('M6.GEO.3.3', 'g6_geo_volume_rect_prism_frac',  'fraction_or_decimal'),
    -- BATCH 7: SP Statistics
    ('M6.SP.2.2',  'g6_sp_five_number_summary',      'integer_or_decimal'),
    ('M6.SP.3.1',  'g6_sp_compute_center_stats',     'decimal'),
    ('M6.SP.3.2',  'g6_sp_compute_variability',      'decimal'),
    ('M6.SP.3.3',  'g6_sp_compute_mad',              'decimal')
)
INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
SELECT
  ac.id,
  dg.generator_type,
  dg.answer_type,
  TRUE
FROM desired_generators dg
INNER JOIN public.atomic_concepts ac
  ON ac.lesson_number = dg.lesson_number
ON CONFLICT DO NOTHING;

-- Flip is_generator_ready = TRUE for every G6 concept that successfully
-- received a generator. Guarded with a column-exists check.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'atomic_concepts'
      AND column_name  = 'is_generator_ready'
  ) THEN
    UPDATE public.atomic_concepts ac
    SET    is_generator_ready = TRUE
    WHERE  ac.lesson_number LIKE 'M6.%'
      AND  EXISTS (
        SELECT 1
        FROM public.question_generators qg
        WHERE qg.concept_id = ac.id
          AND qg.is_active  = TRUE
      );
  END IF;
END $$;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT
  qg.generator_type,
  ac.lesson_number,
  qg.answer_type,
  qg.is_active
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'g6\_%' ESCAPE '\'
ORDER BY qg.generator_type;

SELECT
  (SELECT COUNT(*) FROM public.question_generators WHERE generator_type LIKE 'g6\_%' ESCAPE '\') AS rows_seeded,
  34                                                                                              AS rows_expected;

COMMIT;
