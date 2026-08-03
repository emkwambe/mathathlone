-- =============================================================================
-- 040_m3_generators_backfill.sql
-- =============================================================================
-- Sprint 7: Seed the 46 new NC Math 3 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 6-12, m3_* block).
--
-- Uses the NULL-TRAP-PROOF CTE+INNER JOIN pattern from migration 023:
-- Only rows where the lesson_number matches an existing atomic_concepts entry
-- are inserted; everything else is silently skipped.
--
-- Expected insertions: up to 46 rows (one per new generator).
-- The trailing SELECT shows what actually landed.
-- =============================================================================
BEGIN;

WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    -- BATCH 6: Functions — Rate of Change, Operations, Piecewise
    ('M3.FNI.2.1',      'm3_average_rate_of_change',    'integer_or_fraction'),
    ('M3.FNI.3.1',      'm3_function_operations',       'integer'),
    ('M3.FNI.3.4',      'm3_compose_evaluate',          'integer'),
    ('M3.FNI.4.2',      'm3_find_inverse',              'expression'),
    ('M3.FNI.4.4',      'm3_verify_inverse',            'integer'),
    ('M3.FNI.5.2',      'm3_piecewise_evaluate',        'integer'),

    -- BATCH 7: Exponential & Logarithmic
    ('M3.EL.3.2',       'm3_log_exp_convert',           'expression'),
    ('M3.EL.3.3',       'm3_evaluate_log',              'integer'),
    ('M3.EL.4.1',       'm3_log_product_quotient',      'integer'),
    ('M3.EL.4.2',       'm3_log_power_change_base',     'integer_or_decimal'),
    ('M3.EL.4.3',       'm3_expand_condense_logs',      'expression'),
    ('M3.EL.5.1',       'm3_solve_exp_common_base',     'integer'),
    ('M3.EL.5.2',       'm3_solve_exp_log_method',      'decimal'),
    ('M3.EL.6.1',       'm3_solve_log_eq',              'integer'),
    ('M3.EL.6.2',       'm3_solve_log_eq_condense',     'integer'),
    ('M3.EL.8.1',       'm3_compound_interest',         'decimal'),
    ('M3.EL.8.2',       'm3_log_model',                 'integer'),

    -- BATCH 8: Polynomial & Rational Functions
    ('M3.PR.2.1',       'm3_polynomial_long_division',  'expression'),
    ('M3.PR.2.2',       'm3_synthetic_division',        'expression'),
    ('M3.PR.2.3',       'm3_remainder_theorem',         'integer'),
    ('M3.PR.3.1',       'm3_rational_roots_list',       'integer'),
    ('M3.PR.4.1',       'm3_polynomial_zeros_find',     'text'),
    ('M3.PR.5.1',       'm3_rational_domain',           'integer'),
    ('M3.PR.5.2',       'm3_vertical_asymptote',        'equation'),
    ('M3.PR.5.3',       'm3_horizontal_asymptote',      'equation'),
    ('M3.PR.5.4',       'm3_rational_hole',             'ordered_pair'),
    ('M3.PR.6.1',       'm3_solve_rational_equation',   'integer'),
    ('M3.PR.6.2',       'm3_polynomial_inequality',     'interval'),
    ('M3.PR.6.3',       'm3_rational_inequality',       'interval'),

    -- BATCH 9: Trigonometry
    ('M3.TRIG.1.2',     'm3_degrees_to_radians',        'expression'),
    ('M3.TRIG.2.3',     'm3_reference_angle_trig',      'expression'),
    ('M3.TRIG.5.1',     'm3_trig_identity_simplify',    'expression'),
    ('M3.TRIG.7.2',     'm3_law_of_cosines',            'decimal'),
    ('M3.TRIG.8.1',     'm3_triangle_area_trig',        'decimal'),

    -- BATCH 10: Geometry — Circles, Distance, Dilation
    ('M3.GEO.CIR.1.1',  'm3_distance_formula_classify', 'text'),
    ('M3.GEO.CIR.2.1',  'm3_circle_equation_write',    'equation'),
    ('M3.GEO.CIR.2.2',  'm3_circle_equation_read',     'integer'),
    ('M3.GEO.CIR.2.3',  'm3_circle_complete_square',   'integer'),
    ('M3.GEO.CIR.3.3',  'm3_inscribed_angle',          'integer'),
    ('M3.GEO.CIR.5.1',  'm3_dilation_non_origin',      'ordered_pair'),

    -- BATCH 11: Arc Length and Sector Area
    ('M3.CIR.4.1',      'm3_arc_length',               'decimal'),
    ('M3.CIR.4.2',      'm3_sector_area',              'decimal'),

    -- BATCH 12: Probability & Statistics
    ('M3.PS.2.2',       'm3_expected_value',           'decimal'),
    ('M3.PS.2.3',       'm3_binomial_probability',     'decimal'),
    ('M3.PS.3.2',       'm3_zscore_calculate',         'integer_or_decimal'),
    ('M3.PS.3.3',       'm3_zscore_probability',       'percent')
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.question_generators qg
  WHERE qg.concept_id = ac.id
    AND qg.generator_type = dg.generator_type
);

-- Verify: show what landed
SELECT
  ac.lesson_number,
  qg.generator_type,
  qg.answer_type
FROM public.question_generators qg
INNER JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type IN (
  'm3_average_rate_of_change', 'm3_function_operations', 'm3_compose_evaluate',
  'm3_find_inverse', 'm3_verify_inverse', 'm3_piecewise_evaluate',
  'm3_log_exp_convert', 'm3_evaluate_log', 'm3_log_product_quotient',
  'm3_log_power_change_base', 'm3_expand_condense_logs', 'm3_solve_exp_common_base',
  'm3_solve_exp_log_method', 'm3_solve_log_eq', 'm3_solve_log_eq_condense',
  'm3_compound_interest', 'm3_log_model',
  'm3_polynomial_long_division', 'm3_synthetic_division', 'm3_remainder_theorem',
  'm3_rational_roots_list', 'm3_polynomial_zeros_find', 'm3_rational_domain',
  'm3_vertical_asymptote', 'm3_horizontal_asymptote', 'm3_rational_hole',
  'm3_solve_rational_equation', 'm3_polynomial_inequality', 'm3_rational_inequality',
  'm3_degrees_to_radians', 'm3_reference_angle_trig', 'm3_trig_identity_simplify',
  'm3_law_of_cosines', 'm3_triangle_area_trig',
  'm3_distance_formula_classify', 'm3_circle_equation_write', 'm3_circle_equation_read',
  'm3_circle_complete_square', 'm3_inscribed_angle', 'm3_dilation_non_origin',
  'm3_arc_length', 'm3_sector_area',
  'm3_expected_value', 'm3_binomial_probability', 'm3_zscore_calculate', 'm3_zscore_probability'
)
ORDER BY ac.lesson_number;

COMMIT;
