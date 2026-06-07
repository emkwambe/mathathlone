-- =============================================================================
-- 024_mf_generators_seed.sql
-- =============================================================================
-- Seed the 25 Math Fundamentals procedural generators implemented in
-- src/lib/competition/generators.ts (Batches 1-5, mf_* block).
--
-- Same NULL-safe CTE+JOIN pattern as 023: only lesson_numbers that actually
-- exist in atomic_concepts land. Trailing verification block prints what
-- was inserted plus a rows_seeded / rows_expected comparison.
--
-- MF is the only pool flagged `cross_division_eligible = TRUE` — generators
-- here serve every division (Rising Stars → Varsity). The migration also
-- flips `is_generator_ready = TRUE` for every MF concept that successfully
-- received a generator, so downstream pipelines can filter on that flag.
-- =============================================================================

BEGIN;

WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    -- BATCH 1: Number Basics & Arithmetic
    ('MF.ANT.1.1',   'mf_absolute_value',           'integer'),
    ('MF.ANT.1.2',   'mf_integer_add_subtract',     'integer'),
    ('MF.ANT.2.1',   'mf_integer_multiply_divide',  'integer'),
    ('MF.FDP.2.1',   'mf_fraction_add_subtract',    'decimal_or_fraction'),
    ('MF.FDP.2.2',   'mf_fraction_multiply_divide', 'decimal_or_fraction'),
    -- BATCH 2: Decimals, Percents & Ratios
    ('MF.FDP.3.1',   'mf_decimal_operations',       'decimal'),
    ('MF.FDP.4.1',   'mf_percent_of_number',        'decimal'),
    ('MF.RPBA.2.1',  'mf_percent_change',           'decimal'),
    ('MF.RPBA.1.1',  'mf_ratio_unit_rate',          'decimal'),
    ('MF.RPBA.1.2',  'mf_proportion_solve',         'integer'),
    -- BATCH 3: Algebraic Reasoning
    ('MF.AP.1.1',    'mf_evaluate_expression',      'integer_or_decimal'),
    ('MF.AP.2.1',    'mf_simplify_expression',      'expression'),
    ('MF.AP.4.1',    'mf_solve_one_step_equation',  'integer'),
    ('MF.AP.4.2',    'mf_solve_two_step_equation',  'integer'),
    ('MF.AP.3.1',    'mf_write_expression',         'expression'),
    -- BATCH 4: Geometry
    ('MF.GEO.1.1',   'mf_area_rectangle_triangle',  'integer'),
    ('MF.GEO.1.2',   'mf_perimeter',                'integer'),
    ('MF.GEO.3.2',   'mf_pythagorean_theorem',      'integer'),
    ('MF.GEO.2.2',   'mf_angle_relationships',      'integer'),
    ('MF.GEO.4.1',   'mf_volume_rectangular_prism', 'integer'),
    -- BATCH 5: Data, Statistics & Sets
    ('MF.S.1.1',     'mf_mean_median_mode',         'decimal'),
    ('MF.S.2.1',     'mf_range_iqr',                'integer'),
    ('MF.RAD.1.1',   'mf_probability_basic',        'fraction'),
    ('MF.ER.1.1',    'mf_exponent_evaluate',        'integer'),
    ('MF.ER.2.1',    'mf_square_cube_root',         'integer')
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

-- Flip is_generator_ready = TRUE for every MF concept that now has at
-- least one active generator wired up. Guarded with a column-exists check
-- so the migration is safe if the column hasn't been added yet.
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
    WHERE  ac.lesson_number LIKE 'MF.%'
      AND  EXISTS (
        SELECT 1
        FROM public.question_generators qg
        WHERE qg.concept_id = ac.id
          AND qg.is_active  = TRUE
      );
  END IF;
END $$;

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
WHERE qg.generator_type LIKE 'mf\_%' ESCAPE '\'
ORDER BY qg.generator_type;

SELECT
  (SELECT COUNT(*) FROM public.question_generators WHERE generator_type LIKE 'mf\_%' ESCAPE '\') AS rows_seeded,
  25                                                                                              AS rows_expected;

COMMIT;
