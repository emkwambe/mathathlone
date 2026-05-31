-- =============================================================================
-- Sprint 0 / Migration 014c — 54 question generators + division_curricula seed
-- =============================================================================
-- PART 3 of the split-up 014. Seeds all 54 question_generators from
-- src/lib/competition/generators.ts and links ADV/JV/SV divisions to NC Math 1
-- via division_curricula.
--
-- Prerequisites:
--   - 014a (NCM1 course + UNIQUE constraints)
--   - 014b (8 unit topics + 111 atomic concepts — each generator links to one
--           atomic concept by lesson_number)
--   - 012 (division_curricula table)
--   - 013 (divisions JR/INT/ADV/JV/SV upserted)
--
-- Idempotent: all INSERTs use ON CONFLICT.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Guard: warn if atomic_concepts is empty (014b not yet run)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_concept_count INT;
BEGIN
    SELECT COUNT(*) INTO v_concept_count FROM public.atomic_concepts;
    IF v_concept_count = 0 THEN
        RAISE EXCEPTION '014c prerequisite missing: atomic_concepts is empty. Run 014b_curriculum_concepts.sql first.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 1: Seed all 54 question_generators
-- -----------------------------------------------------------------------------
-- Each generator_type from src/lib/competition/generators.ts is linked to its
-- matching atomic_concept by lesson_number.

INSERT INTO public.question_generators (concept_id, generator_type, answer_type, example_question, example_answer, is_active)
SELECT ac.id, g.generator_type, g.answer_type, g.example_question, g.example_answer, true
FROM public.atomic_concepts ac
CROSS JOIN (VALUES
    -- Equations & Inequalities (14)
    ('M1.EQN.1.2',  'evaluate_expression',       'integer', '2(3) + 5',                  '11'),
    ('M1.EQN.1.3',  'simplify_expression',       'text',    '3(x + 2) + 4x',             '7x + 6'),
    ('M1.EQN.2.2',  'linear_eq_one_step_add',    'integer', 'x + 5 = 12',                '7'),
    ('M1.EQN.2.3',  'linear_eq_one_step_mult',   'integer', '3x = 15',                   '5'),
    ('M1.EQN.2.4',  'linear_eq_two_step',        'integer', '2x + 3 = 11',               '4'),
    ('M1.EQN.2.5',  'linear_eq_multi_step',      'integer', '3(x + 2) - 4 = 11',         '3'),
    ('M1.EQN.2.6',  'linear_eq_both_sides',      'integer', '5x + 3 = 2x + 12',          '3'),
    ('M1.EQN.3.1',  'abs_value_equation',        'text',    '|x - 3| = 7',               '10, -4'),
    ('M1.EQN.4.1',  'literal_equation',          'text',    'Solve A = lw for w',        'w = A/l'),
    ('M1.EQN.5.2',  'inequality_one_step_add',   'text',    'x + 4 > 9',                 'x > 5'),
    ('M1.EQN.5.3',  'inequality_one_step_mult',  'text',    '-3x < 12',                  'x > -4'),
    ('M1.EQN.5.4',  'inequality_multi_step',     'text',    '2(x - 1) <= 8',             'x <= 5'),
    ('M1.EQN.5.5',  'compound_inequality',       'text',    '2 < x + 1 < 7',             '1 < x < 6'),
    ('M1.EQN.5.6',  'abs_value_inequality',      'text',    '|x| < 5',                   '-5 < x < 5'),

    -- Linear Functions (9)
    ('M1.FLF.1.3',  'evaluate_function',         'integer', 'f(x) = 2x + 3; f(4)',       '11'),
    ('M1.FLF.2.1',  'calculate_slope',           'fraction','Slope through (1,2),(3,8)', '3'),
    ('M1.FLF.3.1',  'write_linear_eq',           'text',    'Slope 2, y-int 5',          'y = 2x + 5'),
    ('M1.FLF.3.2',  'write_linear_eq_points',    'text',    'Through (1,3) and (2,5)',   'y = 2x + 1'),
    ('M1.FLF.3.3',  'point_slope_form',          'text',    'Slope 3, point (2,4)',      'y - 4 = 3(x - 2)'),
    ('M1.FLF.3.4',  'convert_linear_forms',      'text',    '2x + 3y = 6 to y = mx + b', 'y = (-2/3)x + 2'),
    ('M1.FLF.4.1',  'parallel_line_slope',       'fraction','Parallel to y = 2x + 1',    '2'),
    ('M1.FLF.4.2',  'perp_line_slope',           'fraction','Perp to y = 2x + 1',        '-1/2'),
    ('M1.FLF.4.3',  'write_parallel_perp_eq',    'text',    'Parallel to y = x through (1,3)', 'y = x + 2'),

    -- Systems (4)
    ('M1.SYS.2.1',  'system_substitution',       'point',   'y = 2x; x + y = 6',         '(2, 4)'),
    ('M1.SYS.2.2',  'system_elimination_basic',  'point',   'x + y = 5; x - y = 1',      '(3, 2)'),
    ('M1.SYS.2.3',  'system_elimination_mult',   'point',   '2x + 3y = 12; x - y = 1',   '(3, 2)'),
    ('M1.SYS.3.1',  'system_solution_type',      'text',    'Parallel lines',            'no solution'),

    -- Exponents (7)
    ('M1.EXP.1.1',  'evaluate_exponent',         'integer', '2^5',                       '32'),
    ('M1.EXP.1.2',  'exponent_product_quotient', 'text',    'x^3 * x^4',                 'x^7'),
    ('M1.EXP.1.3',  'exponent_power_rules',      'text',    '(x^2)^3',                   'x^6'),
    ('M1.EXP.1.4',  'exponent_zero_negative',    'text',    'x^-2',                      '1/x^2'),
    ('M1.EXP.1.5',  'exponent_simplify_all',     'text',    '(2x^3)^2 / x^4',            '4x^2'),
    ('M1.EXP.2.3',  'identify_growth_decay',     'text',    'y = 3(0.5)^x',              'decay'),
    ('M1.EXP.3.2',  'write_exponential_eq',      'text',    '500 bacteria triple hourly','y = 500(3)^x'),

    -- Polynomials (9)
    ('M1.POLY.2.1', 'add_polynomials',           'text',    '(2x + 3) + (x - 5)',        '3x - 2'),
    ('M1.POLY.2.2', 'subtract_polynomials',      'text',    '(3x + 7) - (x + 2)',        '2x + 5'),
    ('M1.POLY.2.3', 'multiply_mono_poly',        'text',    '3x(x + 2)',                 '3x^2 + 6x'),
    ('M1.POLY.2.4', 'multiply_binomials',        'text',    '(x + 2)(x + 3)',            'x^2 + 5x + 6'),
    ('M1.POLY.3.1', 'factor_gcf',                'text',    '6x^2 + 9x',                 '3x(2x + 3)'),
    ('M1.POLY.4.1', 'factor_trinomial_a1',       'text',    'x^2 + 5x + 6',              '(x + 2)(x + 3)'),
    ('M1.POLY.4.2', 'factor_trinomial_a_ne_1',   'text',    '2x^2 + 7x + 3',             '(2x + 1)(x + 3)'),
    ('M1.POLY.5.1', 'factor_diff_squares',       'text',    'x^2 - 16',                  '(x + 4)(x - 4)'),
    ('M1.POLY.5.2', 'factor_perfect_square',     'text',    'x^2 + 6x + 9',              '(x + 3)^2'),

    -- Quadratics (4)
    ('M1.QUAD.1.2', 'quadratic_vertex',          'point',   'y = x^2 - 4x + 3',          '(2, -1)'),
    ('M1.QUAD.2.2', 'quadratic_factor_solve',    'text',    'x^2 + 5x + 6 = 0',          'x = -2, -3'),
    ('M1.QUAD.2.3', 'quadratic_sqrt_solve',      'text',    'x^2 = 25',                  'x = 5, -5'),
    ('M1.QUAD.2.4', 'quadratic_formula',         'text',    'x^2 + 2x - 8 = 0',          'x = 2, -4'),

    -- Statistics (3)
    ('M1.DAS.2.1',  'calculate_central_tendency','decimal', 'Mean of {2, 4, 6, 8}',      '5'),
    ('M1.DAS.2.2',  'calculate_variability',     'decimal', 'Range of {3, 7, 8, 12, 15}','12'),
    ('M1.DAS.4.3',  'calculate_residual',        'decimal', 'Actual 10, Predicted 8',    '2'),

    -- Transformations (4)
    ('M1.GEO.TRANS.2.2', 'translate_point',       'point',   'Translate (2,3) by <4,-1>','(6, 2)'),
    ('M1.GEO.TRANS.3.2', 'reflect_point',         'point',   'Reflect (3,4) over y-axis','(-3, 4)'),
    ('M1.GEO.TRANS.4.2', 'rotate_point',          'point',   'Rotate (2,3) 90 CCW',      '(-3, 2)'),
    ('M1.GEO.TRANS.5.1', 'transform_sequence',    'point',   'Reflect over x, then up 2','(2, -1)')
) AS g(lesson_number, generator_type, answer_type, example_question, example_answer)
WHERE ac.lesson_number = g.lesson_number
ON CONFLICT (generator_type) DO UPDATE SET
    concept_id       = EXCLUDED.concept_id,
    answer_type      = EXCLUDED.answer_type,
    example_question = EXCLUDED.example_question,
    example_answer   = EXCLUDED.example_answer,
    is_active        = true;

-- -----------------------------------------------------------------------------
-- PART 2: Re-seed division_curricula — ADV / JV / SV → NC Math 1
-- -----------------------------------------------------------------------------
-- Idempotent. Handles the case where 013 ran before the NCM1 course existed,
-- or where division_curricula was cascade-deleted during the M1 → NCM1
-- reconciliation in 014a.

DO $$
DECLARE
    v_ncm1_id UUID;
    v_adv_id  UUID;
    v_jv_id   UUID;
    v_sv_id   UUID;
BEGIN
    SELECT id INTO v_ncm1_id FROM public.courses WHERE code = 'NCM1';
    SELECT id INTO v_adv_id  FROM public.divisions WHERE code = 'ADV';
    SELECT id INTO v_jv_id   FROM public.divisions WHERE code = 'JV';
    SELECT id INTO v_sv_id   FROM public.divisions WHERE code = 'SV';

    IF v_ncm1_id IS NULL THEN
        RAISE EXCEPTION '014c failed: NCM1 course missing. Run 014a first.';
    END IF;

    IF v_adv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_adv_id, v_ncm1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
    ELSE
        RAISE NOTICE 'Division ADV not found — run 013_update_divisions.sql.';
    END IF;

    IF v_jv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_jv_id, v_ncm1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
    ELSE
        RAISE NOTICE 'Division JV not found — run 013_update_divisions.sql.';
    END IF;

    IF v_sv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_sv_id, v_ncm1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
    ELSE
        RAISE NOTICE 'Division SV not found — run 013_update_divisions.sql.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Verification — print totals so a re-run shows expected counts
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_courses    INT;
    v_units      INT;
    v_concepts   INT;
    v_generators INT;
    v_gens_linked INT;
    v_statics    INT;
    v_curricula  INT;
BEGIN
    SELECT COUNT(*) INTO v_courses    FROM public.courses;
    SELECT COUNT(*) INTO v_units      FROM public.unit_topics ut JOIN public.courses c ON ut.course_id = c.id WHERE c.code = 'NCM1';
    SELECT COUNT(*) INTO v_concepts   FROM public.atomic_concepts;
    SELECT COUNT(*) INTO v_generators FROM public.question_generators;
    SELECT COUNT(*) INTO v_gens_linked FROM public.question_generators WHERE concept_id IS NOT NULL;
    SELECT COUNT(*) INTO v_statics    FROM public.static_questions;
    SELECT COUNT(*) INTO v_curricula  FROM public.division_curricula;

    RAISE NOTICE '✓ 014c complete.';
    RAISE NOTICE '  courses total: %', v_courses;
    RAISE NOTICE '  unit_topics for NCM1: % (expected 8)', v_units;
    RAISE NOTICE '  atomic_concepts total: % (expected 111)', v_concepts;
    RAISE NOTICE '  question_generators total: % (expected 54)', v_generators;
    RAISE NOTICE '  question_generators with valid concept FK: % (expected 54)', v_gens_linked;
    RAISE NOTICE '  static_questions total: % (unchanged from live)', v_statics;
    RAISE NOTICE '  division_curricula total: % (expected 3)', v_curricula;
    RAISE NOTICE 'Sprint 0 curriculum seed complete. Proceed to 015_cleanup.sql.';
END $$;

COMMIT;
