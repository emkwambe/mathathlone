-- =============================================================================
-- 022_alg1_generators_seed.sql
-- =============================================================================
-- Seed the 25 Algebra 1 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-5, alg1_* block).
--
-- Pattern mirrors the g7 / g8 seeds: each row links an atomic_concept
-- (resolved by lesson_number) to a TypeScript generator via its
-- generator_type key. ON CONFLICT DO NOTHING keeps re-runs idempotent.
-- =============================================================================

BEGIN;

INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
VALUES
  -- BATCH 1: Foundations of Algebra
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.1.2'),  'alg1_eval_algebraic_expr',         'integer_or_decimal',  TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.1.3'),  'alg1_simplify_expression',         'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.1.1'),  'alg1_translate_verbal',            'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.1'),  'alg1_solve_one_step_add_sub',      'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.2'),  'alg1_solve_one_step_mult_div',     'decimal_or_fraction', TRUE),
  -- BATCH 2: Linear Equations
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.3'),  'alg1_solve_two_step',              'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.4'),  'alg1_solve_multi_step',            'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.5'),  'alg1_solve_vars_both_sides',       'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.2.6'),  'alg1_solve_literal_equation',      'equation',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.3.2'),  'alg1_write_linear_equation',       'equation',            TRUE),
  -- BATCH 3: Linear Functions
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FLF.1.1'),  'alg1_slope_from_points',           'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FLF.2.1'),  'alg1_slope_intercept_form',        'equation',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FLF.2.2'),  'alg1_graph_identify_slope',        'decimal_or_fraction', TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FLF.3.1'),  'alg1_write_equation_from_table',   'equation',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FLF.3.2'),  'alg1_write_equation_two_points',   'equation',            TRUE),
  -- BATCH 4: Systems & Inequalities
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.SYS.1.2'),  'alg1_solve_system_substitution',   'ordered_pair',        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.SYS.1.3'),  'alg1_solve_system_elimination',    'ordered_pair',        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.4.1'),  'alg1_solve_inequality_one_step',   'inequality',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.4.2'),  'alg1_solve_inequality_multi_step', 'inequality',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.FND.4.3'),  'alg1_compound_inequality',         'interval',            TRUE),
  -- BATCH 5: Exponents, Polynomials, Quadratics
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.EXP.1.1'),  'alg1_exponent_rules',              'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.POLY.1.1'), 'alg1_add_subtract_polynomials',    'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.POLY.2.1'), 'alg1_multiply_polynomials',        'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.POLY.3.1'), 'alg1_factor_trinomial',            'expression',          TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'Alg1.QUAD.2.4'), 'alg1_quadratic_formula',           'text',                TRUE)
ON CONFLICT DO NOTHING;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT
  qg.generator_type,
  ac.lesson_number,
  qg.answer_type,
  qg.is_active
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'alg1\_%' ESCAPE '\'
ORDER BY qg.generator_type;

COMMIT;
