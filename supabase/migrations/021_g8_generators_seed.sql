-- =============================================================================
-- 021_g8_generators_seed.sql
-- =============================================================================
-- Seed the 25 NC Grade 8 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-5, g8_* block).
--
-- Pattern mirrors 020_g7_generators_seed.sql: each row links an
-- atomic_concept (resolved by lesson_number) to a TypeScript generator
-- via its generator_type key. ON CONFLICT DO NOTHING keeps re-runs idempotent.
-- =============================================================================

BEGIN;

INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
VALUES
  -- BATCH 1: Real Number System
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.NS.2.1'),         'g8_eval_roots',                  'integer',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.NS.2.2'),         'g8_solve_square_eq',             'text',                TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.NS.2.3'),         'g8_solve_cube_eq',               'integer',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.NS.3.3'),         'g8_compare_irrationals',         'text',                TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.EE.1.1'),         'g8_simplify_exponents',          'expression',          TRUE),
  -- BATCH 2: Expressions & Equations
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.EE.2.1'),         'g8_solve_linear_multistep',      'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.EE.2.2'),         'g8_solve_vars_both_sides',       'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.F.1.4'),          'g8_evaluate_function_notation',  'integer_or_decimal',  TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.F.2.3'),          'g8_classify_equation_type',      'text',                TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.EE.3.3'),         'g8_solve_system_substitution',   'ordered_pair',        TRUE),
  -- BATCH 3: Functions & Geometry
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.EE.3.4'),         'g8_solve_system_elimination',    'ordered_pair',        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.F.3.2'),          'g8_construct_linear_function',   'equation',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.TRANS.3.2'),  'g8_coordinate_dilation',         'ordered_pair',        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.TRANS.5.2'),  'g8_similar_figures_solve',       'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.TRANS.6.2'),  'g8_triangle_angle_sum',          'integer',             TRUE),
  -- BATCH 4: Pythagorean Theorem
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.1.2'),     'g8_pythagorean_missing_side',    'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.1.3'),     'g8_pythagorean_2d_context',      'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.1.5'),     'g8_pythagorean_converse',        'text',                TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.2.1'),     'g8_coordinate_distance',         'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.3.2'),     'g8_volume_cylinder',             'decimal',             TRUE),
  -- BATCH 5: Volume & Statistics
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.3.4'),     'g8_volume_cone',                 'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.3.6'),     'g8_volume_sphere',               'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.4.1'),     'g8_volume_3d_word_problem',      'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.SP.3.2'),         'g8_relative_frequency_table',    'decimal',             TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M8.GEO.PV.1.4'),     'g8_pythagorean_3d_context',      'decimal',             TRUE)
ON CONFLICT DO NOTHING;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT
  qg.generator_type,
  ac.lesson_number,
  qg.answer_type,
  qg.is_active
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'g8\_%' ESCAPE '\'
ORDER BY qg.generator_type;

COMMIT;
