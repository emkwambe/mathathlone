-- =============================================================================
-- MathAthlone — NC Math 2 Batch 1: Procedural Generators
-- =============================================================================
-- Adds the two Real Number System concepts absent from the original NCM2 seed,
-- then maps 23 approved Batch 1 generator families to their atomic concepts.
--
-- Source blueprint: docs/NC_MATH_2_BATCH_1_PLAN.md
-- Authoring rule: dynamic generators are used only for skills that remain clear,
-- mathematically valid, and appropriately variable after substitution.
--
-- Safe to run once in Supabase SQL Editor. All inserts are idempotent.
-- =============================================================================

BEGIN;

-- The original NCM2 seed included M2.RNS.1.3 onward but omitted the two
-- generator-suitable prerequisite concepts supplied in the curriculum blueprint.
INSERT INTO public.atomic_concepts
  (unit_topic_id, lesson_number, name, display_order, is_generator_ready)
VALUES
  (
    (SELECT id FROM public.unit_topics
     WHERE code = 'NCM2.REALNUMBER'
       AND course_id = (SELECT id FROM public.courses WHERE code = 'NCM2')),
    'M2.RNS.1.1',
    'Understanding Rational Numbers',
    1,
    TRUE
  ),
  (
    (SELECT id FROM public.unit_topics
     WHERE code = 'NCM2.REALNUMBER'
       AND course_id = (SELECT id FROM public.courses WHERE code = 'NCM2')),
    'M2.RNS.1.2',
    'Understanding Irrational Numbers',
    2,
    TRUE
  ),
  (
    (SELECT id FROM public.unit_topics
     WHERE code = 'NCM2.POLYNOMIAL'
       AND course_id = (SELECT id FROM public.courses WHERE code = 'NCM2')),
    'M2.APR.1.3',
    'Closure Property of Polynomials',
    3,
    FALSE
  ),
  (
    (SELECT id FROM public.unit_topics
     WHERE code = 'NCM2.POLYNOMIAL'
       AND course_id = (SELECT id FROM public.courses WHERE code = 'NCM2')),
    'M2.APR.1.4',
    'Polynomial Structure Analogies',
    4,
    FALSE
  ),
  (
    (SELECT id FROM public.unit_topics
     WHERE code = 'NCM2.POLYNOMIAL'
       AND course_id = (SELECT id FROM public.courses WHERE code = 'NCM2')),
    'M2.APR.4.4',
    'Rational Expression Analogies',
    11,
    FALSE
  )
ON CONFLICT (lesson_number) DO UPDATE
  SET name = EXCLUDED.name,
      is_generator_ready = EXCLUDED.is_generator_ready;

-- Correct two legacy static-pool rows discovered during the Batch 1 quality
-- review. Their original answer/explanation calculations were inconsistent.
UPDATE public.static_questions
SET
  question_text = 'Simplify: (x² − 4)/(x + 3) ÷ (x − 2)/(x² + x − 6). Which simplified expression is correct?',
  options = '[{"key":"A","text":"x + 2"},{"key":"B","text":"(x − 2)(x + 2)/(x + 3)"},{"key":"C","text":"x² − 4"},{"key":"D","text":"(x − 2)²"}]'::jsonb,
  correct_answer = 'C',
  explanation = 'Factor x² − 4 = (x − 2)(x + 2) and x² + x − 6 = (x + 3)(x − 2). Rewrite division as multiplication by the reciprocal, then cancel common nonzero factors. The result is (x − 2)(x + 2) = x² − 4.',
  is_verified = TRUE
WHERE course = 'NCM2'
  AND concept_id = 'M2.APR.3.3';

UPDATE public.static_questions
SET
  options = '[{"key":"A","text":"13x² − 43x + 13"},{"key":"B","text":"13x² − 31x + 13"},{"key":"C","text":"x + 3"},{"key":"D","text":"29x² + 13"}]'::jsonb,
  correct_answer = 'A',
  explanation = 'Use LCD = (4x + 3)(7x − 2). The numerator is (3x − 5)(7x − 2) + (−2x + 1)(4x + 3) = 13x² − 43x + 13.',
  is_verified = TRUE
WHERE course = 'NCM2'
  AND concept_id = 'M2.APR.4.3';

-- Add the missing static conceptual item for the polynomial-structure analogy.
-- This uses the existing static-question schema's multiple-choice format while
-- the richer teacher-assessment version remains in the authoring document.
INSERT INTO public.static_questions
  (concept_id, concept_name, course, question_type, question_text, options,
   correct_answer, explanation, difficulty, is_active, is_verified)
SELECT
  'M2.APR.1.4',
  'Polynomial Structure Analogies',
  'NCM2',
  'multiple_choice',
  'Which statement correctly describes a shared use of the distributive property in (x² + 2x)(x − 1) and 21 × 9?',
  '[{"key":"A","text":"Both products divide the first factor by the second factor."},{"key":"B","text":"Both products multiply each part of one factor by the other factor before combining results."},{"key":"C","text":"Both products require cancelling a common factor before multiplying."},{"key":"D","text":"Both products can be solved by adding the exponents."}]'::jsonb,
  'B',
  'In each product, one factor is treated as a sum or difference of parts. Each part is multiplied by the other factor, and the partial products are combined.',
  2,
  TRUE,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.static_questions
  WHERE course = 'NCM2'
    AND concept_id = 'M2.APR.1.4'
    AND question_text = 'Which statement correctly describes a shared use of the distributive property in (x² + 2x)(x − 1) and 21 × 9?'
);

-- Each mapping connects an atomic curriculum concept to a registry key in
-- src/lib/competition/ncm2-generators.ts.
WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    -- Arithmetic with Polynomial & Rational Expressions (M2.APR)
    ('M2.APR.1.1', 'm2_add_subtract_polynomials',            'expression'),
    ('M2.APR.1.2', 'm2_multiply_polynomials',                'expression'),
    ('M2.APR.2.1', 'm2_polynomial_long_division',            'expression'),
    ('M2.APR.2.2', 'm2_synthetic_division',                  'integer'),
    ('M2.APR.3.1', 'm2_simplify_rational_expression',        'text'),
    ('M2.APR.3.2', 'm2_multiply_rational_expressions',       'expression'),
    ('M2.APR.3.3', 'm2_divide_rational_expressions',         'expression'),
    ('M2.APR.4.1', 'm2_lcm_polynomials',                     'expression'),
    ('M2.APR.4.2', 'm2_add_rational_like_denominators',      'expression'),
    ('M2.APR.4.3', 'm2_add_rational_unlike_denominators',    'expression'),

    -- The Real Number System (M2.RNS)
    ('M2.RNS.1.1', 'm2_fraction_decimal_classify',           'text'),
    ('M2.RNS.1.2', 'm2_rational_irrational_classify',        'text'),
    ('M2.RNS.1.3', 'm2_classify_real_numbers',               'text'),
    ('M2.RNS.2.1', 'm2_rational_exponent_evaluate',          'integer'),
    ('M2.RNS.2.2', 'm2_simplify_rational_exponents',         'expression'),
    ('M2.RNS.3.1', 'm2_simplify_radicals',                   'expression'),
    ('M2.RNS.3.2', 'm2_add_subtract_radicals',               'expression'),
    ('M2.RNS.3.3', 'm2_multiply_radicals',                   'expression'),
    ('M2.RNS.3.4', 'm2_rationalize_monomial_denominator',    'expression'),
    ('M2.RNS.3.5', 'm2_rationalize_conjugate_denominator',   'expression'),
    ('M2.RNS.4.1', 'm2_solve_rational_exponent_equation',    'integer'),
    ('M2.RNS.4.2', 'm2_solve_one_radical_equation',          'integer'),
    ('M2.RNS.4.3', 'm2_solve_multiple_radical_equation',     'integer')
)
INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
SELECT
  ac.id,
  dg.generator_type,
  dg.answer_type,
  TRUE
FROM desired_generators dg
JOIN public.atomic_concepts ac ON ac.lesson_number = dg.lesson_number
WHERE NOT EXISTS (
  SELECT 1
  FROM public.question_generators qg
  WHERE qg.concept_id = ac.id
    AND qg.generator_type = dg.generator_type
);

-- Make the curriculum UI recognize the mapped concepts as ready.
UPDATE public.atomic_concepts ac
SET is_generator_ready = TRUE
WHERE ac.lesson_number IN (
  'M2.APR.1.1', 'M2.APR.1.2', 'M2.APR.2.1', 'M2.APR.2.2',
  'M2.APR.3.1', 'M2.APR.3.2', 'M2.APR.3.3', 'M2.APR.4.1',
  'M2.APR.4.2', 'M2.APR.4.3', 'M2.RNS.1.1', 'M2.RNS.1.2',
  'M2.RNS.1.3', 'M2.RNS.2.1', 'M2.RNS.2.2', 'M2.RNS.3.1',
  'M2.RNS.3.2', 'M2.RNS.3.3', 'M2.RNS.3.4', 'M2.RNS.3.5',
  'M2.RNS.4.1', 'M2.RNS.4.2', 'M2.RNS.4.3'
);

COMMIT;

-- Post-run verification: this should return 23 active mappings.
SELECT
  ac.lesson_number,
  qg.generator_type,
  qg.answer_type
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'm2_%'
ORDER BY ac.lesson_number, qg.generator_type;
