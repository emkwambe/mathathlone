-- =============================================================================
-- 023_ncm3_generators_seed.sql
-- =============================================================================
-- Seed the 25 NC Math 3 procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-5, m3_* block).
--
-- NULL-TRAP-PROOF PATTERN:
-- The earlier g7/g8/alg1 seeds used a per-row subquery
--   (SELECT id FROM atomic_concepts WHERE lesson_number = '…')
-- which silently INSERTed NULL when the lesson_number didn't exist
-- (then the FK constraint would either drop the row or — worse —
-- if concept_id allowed NULL — leave a corrupt row).
--
-- This migration uses CTE + INNER JOIN instead. Only rows where the
-- lesson_number matches an existing atomic_concepts entry actually get
-- inserted; everything else is silently skipped. The trailing SELECT
-- prints what landed so you can diff against the expected 25.
-- =============================================================================

BEGIN;

WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    -- BATCH 1: Functions & Inverses
    ('M3.FNI.1.1',  'm3_evaluate_function',          'integer_or_decimal'),
    ('M3.FNI.1.2',  'm3_compose_functions',          'integer_or_decimal'),
    ('M3.FNI.1.3',  'm3_inverse_function',           'equation'),
    ('M3.FNI.1.4',  'm3_domain_range',               'text'),
    ('M3.FNI.1.5',  'm3_transformation_describe',    'text'),
    -- BATCH 2: Exponential & Logarithmic
    ('M3.EL.1.1',   'm3_evaluate_exponential',       'integer_or_decimal'),
    ('M3.EL.1.2',   'm3_solve_exponential_eq',       'decimal'),
    ('M3.EL.2.1',   'm3_evaluate_logarithm',         'integer'),
    ('M3.EL.2.2',   'm3_expand_condense_log',        'expression'),
    ('M3.EL.3.1',   'm3_exponential_growth_decay',   'decimal'),
    -- BATCH 3: Polynomial Functions
    ('M3.POL.1.1',  'm3_polynomial_end_behavior',    'text'),
    ('M3.POL.1.2',  'm3_polynomial_zeros',           'text'),
    ('M3.POL.2.1',  'm3_factor_polynomial',          'expression'),
    ('M3.POL.2.2',  'm3_divide_polynomial',          'expression'),
    ('M3.POL.2.3',  'm3_rational_root_theorem',      'text'),
    -- BATCH 4: Rational, Radical, Complex
    ('M3.RAT.1.1',  'm3_simplify_rational_expr',     'expression'),
    ('M3.RAT.2.1',  'm3_solve_rational_eq',          'decimal_or_fraction'),
    ('M3.RAD.1.1',  'm3_simplify_radical_expr',      'expression'),
    ('M3.RAD.2.1',  'm3_solve_radical_eq',           'decimal_or_fraction'),
    ('M3.CIR.1.1',  'm3_complex_numbers',            'expression'),
    -- BATCH 5: Trigonometry & Statistics
    ('M3.TRIG.1.1', 'm3_unit_circle_values',         'text'),
    ('M3.TRIG.2.1', 'm3_trig_equation_solve',        'text'),
    ('M3.TRIG.3.1', 'm3_law_of_sines',               'decimal'),
    ('M3.PS.1.1',   'm3_normal_distribution',        'decimal'),
    ('M3.PS.2.1',   'm3_confidence_interval',        'interval')
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

-- ── Verification ────────────────────────────────────────────────────────────
-- Should print 25 rows. If fewer, the missing lesson_numbers don't yet
-- exist in atomic_concepts — add a Group-B concept patch migration to
-- close the gap, then re-run.
SELECT
  qg.generator_type,
  ac.lesson_number,
  qg.answer_type,
  qg.is_active
FROM public.question_generators qg
JOIN public.atomic_concepts ac ON ac.id = qg.concept_id
WHERE qg.generator_type LIKE 'm3\_%' ESCAPE '\'
ORDER BY qg.generator_type;

-- And a count of what landed vs what was expected:
SELECT
  (SELECT COUNT(*) FROM public.question_generators WHERE generator_type LIKE 'm3\_%' ESCAPE '\') AS rows_seeded,
  25                                                                                              AS rows_expected;

COMMIT;
