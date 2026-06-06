-- =============================================================================
-- 020_g7_generators_seed.sql
-- =============================================================================
-- Seed the 25 NC Grade 7 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-5).
--
-- Each row links an atomic_concept (resolved by lesson_number) to a
-- TypeScript generator function via its generator_type key. The
-- question-delivery pipeline pulls active rows, picks ones whose key
-- exists in the in-code GENERATORS map, and invokes them at heat time.
--
-- Generator IDs are unprefixed in the registry (e.g. `g7_add_rational`)
-- so they're stable across pool reorganizations.
-- =============================================================================

BEGIN;

INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
VALUES
  -- BATCH 1: Number System
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.NS.1.2'),  'g7_add_rational',                'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.NS.1.4'),  'g7_subtract_rational',           'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.NS.2.2'),  'g7_multiply_rational',           'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.NS.2.4'),  'g7_divide_rational',             'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.NS.3.1'),  'g7_rational_to_decimal',         'decimal',                        TRUE),
  -- BATCH 2: Ratios & Proportional Relationships
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.1.2'),  'g7_find_unit_rate',              'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.2.1'),  'g7_proportional_solve',          'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.3.1'),  'g7_percent_tax_tip_discount',    'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.3.2'),  'g7_simple_interest',             'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.3.3'),  'g7_percent_change',              'decimal',                        TRUE),
  -- BATCH 3: Expressions & Equations
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.EE.1.1'),  'g7_add_sub_linear_expr',         'text',                           TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.EE.1.3'),  'g7_expand_linear_expr',          'text',                           TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.EE.2.1'),  'g7_solve_linear_rational',       'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.EE.2.2'),  'g7_solve_distrib_like_terms',    'decimal_or_fraction',            TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.RP.3.4'),  'g7_fraction_decimal_percent',    'decimal_or_fraction_or_percent', TRUE),
  -- BATCH 4: Geometry — angles, circles, area
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.1.1'), 'g7_angle_relationship_solve',    'integer',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.2.3'), 'g7_circle_area_circumference',   'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.3.1'), 'g7_angle_equation_solve',        'integer',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.4.1'), 'g7_composite_area',              'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.4.2'), 'g7_area_2d_objects',             'decimal',                        TRUE),
  -- BATCH 5: Volume, Surface Area, Probability
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.4.3'), 'g7_volume_3d_objects',           'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.GEO.4.4'), 'g7_surface_area_3d',             'decimal',                        TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.SP.3.3'),  'g7_theoretical_probability',     'fraction',                       TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.SP.3.2'),  'g7_experimental_probability',    'fraction',                       TRUE),
  ((SELECT id FROM public.atomic_concepts WHERE lesson_number = 'M7.SP.4.1'),  'g7_compound_probability',        'fraction',                       TRUE)
ON CONFLICT DO NOTHING;

-- ── Verification ────────────────────────────────────────────────────────────
-- Show the inserted rows so an operator running this migration can confirm
-- every concept_id resolved (no NULLs from a missing atomic_concepts row).
SELECT
  qg.generator_type,
  ac.lesson_number,
  qg.answer_type,
  qg.is_active
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'g7\_%' ESCAPE '\'
ORDER BY qg.generator_type;

COMMIT;
