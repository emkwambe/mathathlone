-- =============================================================================
-- Sprint 0 / Migration 014b — Unit topics + 111 atomic concepts
-- =============================================================================
-- PART 2 of the split-up 014. Seeds the 8 NC Math 1 unit topics and all 111
-- atomic concepts from docs/NC_Math_1.json.
--
-- Prerequisites:
--   - 014a must have run (creates NCM1 course + UNIQUE constraints)
--   - 002 created the unit_topics and atomic_concepts tables
--
-- Idempotent: all INSERTs use ON CONFLICT.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Guard: require NCM1 course to exist
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_ncm1_id UUID;
BEGIN
    SELECT id INTO v_ncm1_id FROM public.courses WHERE code = 'NCM1';
    IF v_ncm1_id IS NULL THEN
        RAISE EXCEPTION '014b prerequisite missing: NCM1 course not found. Run 014a_curriculum_schema.sql first.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 1: Seed 8 unit topics for NC Math 1
-- -----------------------------------------------------------------------------

INSERT INTO public.unit_topics (course_id, name, code, display_order)
SELECT c.id, v.name, v.code, v.display_order
FROM public.courses c
CROSS JOIN (VALUES
    ('Equations & Inequalities',                'EQN',       1),
    ('Functions & Linear Functions',            'FLF',       2),
    ('Systems of Eqns & Inequalities',          'SYS',       3),
    ('Exponents & Exponential Functions',       'EXP',       4),
    ('Polynomials & Factoring',                 'POLY',      5),
    ('Quadratic Functions & Equations',         'QUAD',      6),
    ('Data Analysis & Statistics',              'DAS',       7),
    ('Geometric Transformations & Congruence',  'GEO.TRANS', 8)
) AS v(name, code, display_order)
WHERE c.code = 'NCM1'
ON CONFLICT (course_id, code) DO UPDATE SET
    name          = EXCLUDED.name,
    display_order = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 2: Equations & Inequalities (EQN, 19 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.EQN.1.1', 'Understanding Variables and Algebraic Expressions',                                'Differentiate between constants, variables, coefficients, and terms',                                                'NC.M1.A-SSE.1', false, 1),
    ('M1.EQN.1.2', 'Evaluating Algebraic Expressions',                                                 'Substitute values for variables and simplify expressions',                                                            'NC.M1.A-SSE.1', true,  2),
    ('M1.EQN.1.3', 'Simplifying Algebraic Expressions (Combining Like Terms and Distributive Property)','Group and combine like terms; Apply the distributive property',                                                     'NC.M1.A-SSE.1', true,  3),
    ('M1.EQN.2.1', 'Understanding Equations and Solutions',                                            'Define an equation; Determine if a value is a solution',                                                              'NC.M1.A-REI.1', false, 4),
    ('M1.EQN.2.2', 'Solving One-Step Linear Equations (Addition/Subtraction)',                         'Isolate the variable using inverse operations',                                                                       'NC.M1.A-REI.3', true,  5),
    ('M1.EQN.2.3', 'Solving One-Step Linear Equations (Multiplication/Division)',                      'Isolate the variable using inverse operations',                                                                       'NC.M1.A-REI.3', true,  6),
    ('M1.EQN.2.4', 'Solving Two-Step Linear Equations',                                                'Apply inverse operations in sequence to solve',                                                                       'NC.M1.A-REI.3', true,  7),
    ('M1.EQN.2.5', 'Solving Multi-Step Linear Equations (Distribute & Combine Like Terms)',            'Use distributive property; Combine like terms; Apply inverse operations',                                              'NC.M1.A-REI.3', true,  8),
    ('M1.EQN.2.6', 'Solving Linear Equations with Variables on Both Sides',                            'Collect variable terms on one side and constant terms on the other',                                                  'NC.M1.A-REI.3', true,  9),
    ('M1.EQN.2.7', 'Identifying Equations with No Solution or Infinitely Many Solutions',              'Recognize when an equation leads to a contradiction or an identity',                                                  'NC.M1.A-REI.3', false, 10),
    ('M1.EQN.3.1', 'Solving Absolute Value Equations',                                                 'Isolate absolute value; Set up two equations; Solve and check for extraneous solutions',                              'NC.M1.A-REI.1', true,  11),
    ('M1.EQN.4.1', 'Rewriting Literal Equations (Solving for a Variable)',                             'Isolate a specified variable in a formula or equation with multiple variables',                                       'NC.M1.A-CED.4', true,  12),
    ('M1.EQN.5.1', 'Understanding and Graphing Linear Inequalities in One Variable',                   'Define inequality; Graph solutions on a number line (open/closed circles, shading)',                                  'NC.M1.A-REI.3', false, 13),
    ('M1.EQN.5.2', 'Solving One-Step Linear Inequalities (Addition/Subtraction)',                      'Apply inverse operations; Maintain inequality direction',                                                             'NC.M1.A-REI.3', true,  14),
    ('M1.EQN.5.3', 'Solving One-Step Linear Inequalities (Multiplication/Division by Negative)',       'Apply inverse operations; Reverse inequality sign when multiplying/dividing by a negative',                            'NC.M1.A-REI.3', true,  15),
    ('M1.EQN.5.4', 'Solving Multi-Step Linear Inequalities',                                           'Use distributive property; Combine like terms; Apply inverse operations; Reverse sign when necessary',                  'NC.M1.A-REI.3', true,  16),
    ('M1.EQN.5.5', 'Solving Compound Inequalities (AND/OR)',                                           'Solve each inequality; Find intersection or union of solution sets',                                                   'NC.M1.A-REI.3', true,  17),
    ('M1.EQN.5.6', 'Solving Absolute Value Inequalities',                                              'Isolate absolute value; Set up compound inequality; Solve and graph',                                                  'NC.M1.A-REI.3', true,  18),
    ('M1.EQN.6.1', 'Creating Linear Equations and Inequalities in One Variable from Context',          'Translate verbal descriptions into equations/inequalities; Define variables',                                          'NC.M1.A-CED.1', false, 19)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'EQN' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 3: Functions & Linear Functions (FLF, 18 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.FLF.1.1', 'Understanding Relations and Functions (Introduction)',                            'Differentiate between a relation and a function; Identify domain and range',                                           'NC.M1.F-IF.1',  false, 1),
    ('M1.FLF.1.2', 'Identifying Functions using Vertical Line Test and Tables',                       'Determine if a relation is a function from a graph or a table',                                                       'NC.M1.F-IF.1',  false, 2),
    ('M1.FLF.1.3', 'Using Function Notation',                                                          'Evaluate functions for given input values using f(x) notation',                                                       'NC.M1.F-IF.2',  true,  3),
    ('M1.FLF.2.1', 'Understanding Slope as a Rate of Change',                                          'Calculate slope from two points or a graph; Interpret slope in context',                                              'NC.M1.F-IF.6',  true,  4),
    ('M1.FLF.2.2', 'Graphing Linear Functions from Slope-Intercept Form (y=mx+b)',                     'Identify slope and y-intercept; Graph linear equations',                                                              'NC.M1.F-IF.7',  false, 5),
    ('M1.FLF.2.3', 'Graphing Linear Functions from Standard Form (Ax+By=C)',                           'Use intercepts to graph linear equations; Convert to slope-intercept form',                                            'NC.M1.F-IF.7',  false, 6),
    ('M1.FLF.2.4', 'Understanding Horizontal and Vertical Lines',                                      'Identify and graph equations of horizontal and vertical lines',                                                        'NC.M1.F-IF.7',  false, 7),
    ('M1.FLF.3.1', 'Writing Linear Equations in Slope-Intercept Form',                                 'Write equations given slope and y-intercept; Write equations from graphs',                                             'NC.M1.F-BF.1a', true,  8),
    ('M1.FLF.3.2', 'Writing Linear Equations from Two Points',                                         'Calculate slope; Use point-slope form or slope-intercept form to write equation',                                       'NC.M1.F-BF.1a', true,  9),
    ('M1.FLF.3.3', 'Writing Linear Equations from a Point and a Slope (Point-Slope Form)',             'Apply the point-slope formula to write linear equations',                                                              'NC.M1.F-BF.1a', true,  10),
    ('M1.FLF.3.4', 'Converting Between Forms of Linear Equations',                                     'Convert equations between slope-intercept, point-slope, and standard forms',                                           'NC.M1.A-CED.4', true,  11),
    ('M1.FLF.4.1', 'Understanding Slopes of Parallel Lines',                                           'Identify parallel lines based on equal slopes',                                                                        'NC.M1.G-GPE.5', true,  12),
    ('M1.FLF.4.2', 'Understanding Slopes of Perpendicular Lines',                                      'Identify perpendicular lines based on negative reciprocal slopes',                                                     'NC.M1.G-GPE.5', true,  13),
    ('M1.FLF.4.3', 'Writing Equations of Parallel and Perpendicular Lines',                            'Write equations for lines passing through a point and parallel/perpendicular to a given line',                          'NC.M1.G-GPE.5', true,  14),
    ('M1.FLF.5.1', 'Graphing Linear Inequalities in Two Variables',                                    'Graph boundary line; Determine shading region; Understand solution set',                                                'NC.M1.A-REI.12', false, 15),
    ('M1.FLF.6.1', 'Interpreting Key Features of Linear Functions in Context',                         'Analyze intercepts, slope, and domain/range in real-world problems',                                                    'NC.M1.F-IF.4',  false, 16),
    ('M1.FLF.6.2', 'Constructing Linear Functions to Model Relationships from Context',                'Translate verbal descriptions, tables, or graphs into linear functions',                                                'NC.M1.F-BF.1',  false, 17),
    ('M1.FLF.7.1', 'Comparing Properties of Two Linear Functions Represented in Different Ways',       'Compare rates of change, intercepts, and domains/ranges from various representations',                                  'NC.M1.F-IF.9',  false, 18)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'FLF' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 4: Systems of Eqns & Inequalities (SYS, 12 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.SYS.1.1', 'Understanding Systems of Linear Equations and their Solutions',                   'Define a system of equations; Identify a solution to a system',                                                       'NC.M1.A-REI.5',  false, 1),
    ('M1.SYS.1.2', 'Solving Systems of Linear Equations by Graphing',                                  'Graph two linear equations; Identify the point of intersection as the solution',                                       'NC.M1.A-REI.6',  false, 2),
    ('M1.SYS.2.1', 'Solving Systems of Linear Equations by Substitution',                              'Solve one equation for a variable; Substitute into the other equation; Solve for both variables',                       'NC.M1.A-REI.6',  true,  3),
    ('M1.SYS.2.2', 'Solving Systems of Linear Equations by Elimination (Addition/Subtraction)',        'Add or subtract equations to eliminate a variable; Solve for remaining variables',                                      'NC.M1.A-REI.6',  true,  4),
    ('M1.SYS.2.3', 'Solving Systems of Linear Equations by Elimination (Multiplication First)',        'Multiply one or both equations to create opposite coefficients; Add/subtract to eliminate',                              'NC.M1.A-REI.6',  true,  5),
    ('M1.SYS.3.1', 'Identifying Types of Solutions to Systems of Linear Equations',                    'Recognize when a system has one solution, no solution, or infinitely many solutions (graphically and algebraically)',    'NC.M1.A-REI.6',  true,  6),
    ('M1.SYS.4.1', 'Creating Systems of Linear Equations from Word Problems',                          'Define variables; Write two linear equations to represent real-world scenarios',                                         'NC.M1.A-CED.2',  false, 7),
    ('M1.SYS.4.2', 'Solving Real-World Problems Using Systems of Linear Equations',                    'Apply graphical or algebraic methods to solve contextual problems',                                                       'NC.M1.A-CED.2',  false, 8),
    ('M1.SYS.5.1', 'Understanding Systems of Linear Inequalities and their Solution Sets',             'Define a system of inequalities; Recognize that the solution is a region of intersection',                               'NC.M1.A-REI.12', false, 9),
    ('M1.SYS.5.2', 'Solving Systems of Linear Inequalities by Graphing',                               'Graph each linear inequality; Identify and shade the overlapping feasible region',                                       'NC.M1.A-REI.12', false, 10),
    ('M1.SYS.6.1', 'Creating Systems of Linear Inequalities from Word Problems',                       'Define variables; Write two or more linear inequalities to represent real-world constraints',                            'NC.M1.A-CED.3',  false, 11),
    ('M1.SYS.6.2', 'Solving Real-World Problems Using Systems of Linear Inequalities',                 'Apply graphing methods to solve contextual problems involving constraints',                                              'NC.M1.A-CED.3',  false, 12)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'SYS' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 5: Exponents & Exponential Functions (EXP, 13 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.EXP.1.1', 'Review: Understanding Integer Exponents',                                          'Define base and exponent; Evaluate expressions with integer exponents',                                                'NC.M1.N-RN.1',                  true,  1),
    ('M1.EXP.1.2', 'Properties of Exponents: Product of Powers and Quotient of Powers',                'Simplify expressions by adding exponents for multiplication and subtracting for division',                              'NC.M1.N-RN.1',                  true,  2),
    ('M1.EXP.1.3', 'Properties of Exponents: Power of a Power and Power of a Product/Quotient',        'Simplify expressions by multiplying exponents for power of a power; Apply power to each factor in product/quotient',     'NC.M1.N-RN.1',                  true,  3),
    ('M1.EXP.1.4', 'Understanding Zero Exponents and Negative Exponents',                              'Define a^0=1; Define a^-n = 1/a^n; Simplify expressions with zero or negative exponents',                                 'NC.M1.N-RN.1',                  true,  4),
    ('M1.EXP.1.5', 'Simplifying Expressions Using All Properties of Integer Exponents',                'Apply all exponent rules to simplify complex expressions',                                                              'NC.M1.N-RN.1',                  true,  5),
    ('M1.EXP.2.1', 'Understanding Exponential Functions (Definition and Key Characteristics)',         'Identify exponential functions from equations, graphs, or tables; Recognize constant ratio of y-values',                 'NC.M1.F-IF.7, NC.M1.F-LE.1',    false, 6),
    ('M1.EXP.2.2', 'Graphing Basic Exponential Functions (y=a • b^x)',                                 'Create tables of values; Plot points; Sketch graphs; Identify y-intercept, asymptote, domain, and range',                'NC.M1.F-IF.7',                  false, 7),
    ('M1.EXP.2.3', 'Identifying Exponential Growth and Decay',                                         'Determine if an exponential function represents growth or decay based on the base b',                                    'NC.M1.F-LE.1',                  true,  8),
    ('M1.EXP.3.1', 'Writing Exponential Functions from Tables or Graphs',                              'Identify initial value and common ratio; Write equation in y=a • b^x form',                                              'NC.M1.F-BF.1',                  false, 9),
    ('M1.EXP.3.2', 'Writing Exponential Functions from Verbal Descriptions (Growth/Decay Models)',     'Translate real-world scenarios into exponential function equations; Define variables',                                   'NC.M1.F-BF.1',                  true,  10),
    ('M1.EXP.4.1', 'Solving Real-World Problems Involving Exponential Growth and Decay',               'Apply exponential growth/decay models to solve contextual problems',                                                     'NC.M1.F-LE.1, NC.M1.A-CED.1',   false, 11),
    ('M1.EXP.5.1', 'Comparing Linear and Exponential Functions (Tables and Graphs)',                   'Analyze differences in growth patterns (constant difference vs. constant ratio); Compare key features',                  'NC.M1.F-LE.3, NC.M1.F-LE.2',    false, 12),
    ('M1.EXP.5.2', 'Comparing Linear and Exponential Functions (Equations and Context)',               'Formulate and compare linear vs. exponential functions from equations and real-world contexts',                          'NC.M1.F-LE.3, NC.M1.F-LE.2',    false, 13)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'EXP' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 6: Polynomials & Factoring (POLY, 11 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.POLY.1.1', 'Understanding Polynomials (Terms, Coefficients, Degree, Standard Form)',         'Define what a polynomial is; Identify its parts; Write in standard form',                                              'NC.M1.A-SSE.1',                false, 1),
    ('M1.POLY.2.1', 'Adding Polynomials',                                                              'Combine like terms of two or more polynomials',                                                                         'NC.M1.A-APR.1',                true,  2),
    ('M1.POLY.2.2', 'Subtracting Polynomials',                                                         'Distribute the negative sign; Combine like terms',                                                                       'NC.M1.A-APR.1',                true,  3),
    ('M1.POLY.2.3', 'Multiplying Monomial by Polynomial',                                              'Apply the distributive property to multiply a monomial by any polynomial',                                              'NC.M1.A-APR.1',                true,  4),
    ('M1.POLY.2.4', 'Multiplying Binomial by Binomial (FOIL/Box Method)',                              'Apply distributive property or methods like FOIL/Box to multiply two binomials',                                        'NC.M1.A-APR.1',                true,  5),
    ('M1.POLY.3.1', 'Factoring the Greatest Common Factor (GCF) from Polynomials',                     'Identify the greatest common monomial factor; Factor it out from an expression',                                       'NC.M1.A-SSE.1, NC.M1.A-SSE.2', true,  6),
    ('M1.POLY.4.1', 'Factoring Quadratic Expressions of the Form x^2 + bx + c',                        'Find two numbers that multiply to c and add to b; Write as binomial factors',                                            'NC.M1.A-SSE.2',                true,  7),
    ('M1.POLY.4.2', 'Factoring Quadratic Expressions of the Form ax^2 + bx + c (where a is not 1)',    'Use methods like grouping, trial and error, or the slide and divide method to factor',                                  'NC.M1.A-SSE.2',                true,  8),
    ('M1.POLY.5.1', 'Factoring the Difference of Two Squares (a^2 - b^2)',                             'Recognize and factor expressions in the form (a-b)(a+b)',                                                                'NC.M1.A-SSE.2',                true,  9),
    ('M1.POLY.5.2', 'Factoring Perfect Square Trinomials (a^2 +/- 2ab + b^2)',                         'Recognize and factor expressions into (a +/- b)^2',                                                                      'NC.M1.A-SSE.2',                true,  10),
    ('M1.POLY.6.1', 'Choosing the Best Factoring Method (Mixed Practice)',                             'Determine the most efficient factoring method for a given quadratic expression',                                         'NC.M1.A-SSE.2',                false, 11)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'POLY' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 7: Quadratic Functions & Equations (QUAD, 10 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.QUAD.1.1', 'Understanding Quadratic Functions (Definition, Standard Form)',                  'Identify quadratic functions; Recognize coefficients a, b, c',                                                          'NC.M1.F-IF.7',                false, 1),
    ('M1.QUAD.1.2', 'Graphing Quadratic Functions (y=ax^2+bx+c) and Identifying Key Features',         'Identify vertex, axis of symmetry, x- and y-intercepts from graph; Graph parabolas',                                    'NC.M1.F-IF.4, NC.M1.F-IF.7',  true,  2),
    ('M1.QUAD.1.3', 'Interpreting Key Features of Quadratic Functions in Context',                    'Analyze the meaning of vertex, intercepts, and intervals in real-world problems',                                       'NC.M1.F-IF.4',                false, 3),
    ('M1.QUAD.2.1', 'Understanding the Relationship between Zeros, Roots, and X-Intercepts',           'Define zero, root, and x-intercept as interchangeable terms for solutions',                                              'NC.M1.A-REI.4',               false, 4),
    ('M1.QUAD.2.2', 'Solving Quadratic Equations by Factoring',                                        'Factor quadratic expressions; Apply the Zero Product Property to find solutions',                                       'NC.M1.A-REI.4b',              true,  5),
    ('M1.QUAD.2.3', 'Solving Quadratic Equations by Taking Square Roots',                              'Isolate the squared term; Apply the square root property to solve equations',                                            'NC.M1.A-REI.4b',              true,  6),
    ('M1.QUAD.2.4', 'Solving Quadratic Equations using the Quadratic Formula (Real Solutions)',        'Identify a, b, c; Substitute into the quadratic formula; Simplify to find real solutions',                              'NC.M1.A-REI.4b',              true,  7),
    ('M1.QUAD.3.1', 'Creating Quadratic Equations from Graphs, Tables, or Verbal Descriptions',        'Write quadratic equations from given data points or descriptions; Define variables',                                    'NC.M1.A-CED.1, NC.M1.F-BF.1', false, 8),
    ('M1.QUAD.4.1', 'Comparing Linear, Exponential, and Quadratic Functions (Tables and Graphs)',     'Analyze patterns of change in tables (constant 1st, 2nd differences, common ratio); Compare shapes of graphs',           'NC.M1.F-LE.3',                false, 9),
    ('M1.QUAD.4.2', 'Comparing Linear, Exponential, and Quadratic Functions (Equations and Context)', 'Formulate and compare linear vs. exponential functions from equations and real-world contexts',                          'NC.M1.F-LE.3',                false, 10)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'QUAD' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 8: Data Analysis & Statistics (DAS, 14 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.DAS.1.1', 'Understanding Types of Data (Quantitative vs. Categorical)',                      'Differentiate between types of data; Identify appropriate data for statistical questions',                              'NC.M1.S-ID.1', false, 1),
    ('M1.DAS.1.2', 'Representing One-Variable Data (Dot Plots and Histograms)',                        'Create and interpret dot plots and histograms; Describe distribution shape',                                            'NC.M1.S-ID.1', false, 2),
    ('M1.DAS.1.3', 'Representing One-Variable Data (Box Plots/Box-and-Whisker Plots)',                 'Create and interpret box plots; Identify quartiles, median, and range',                                                 'NC.M1.S-ID.1', false, 3),
    ('M1.DAS.2.1', 'Calculating Measures of Central Tendency (Mean, Median, Mode)',                    'Compute mean, median, and mode for a data set; Interpret their meaning',                                                'NC.M1.S-ID.2', true,  4),
    ('M1.DAS.2.2', 'Calculating Measures of Variability (Range and Interquartile Range)',              'Compute range and IQR; Understand how they describe data spread',                                                       'NC.M1.S-ID.2', true,  5),
    ('M1.DAS.2.3', 'Understanding Standard Deviation (Introduction)',                                  'Understand standard deviation as a measure of typical distance from the mean',                                          'NC.M1.S-ID.2', false, 6),
    ('M1.DAS.2.4', 'Comparing Data Sets (Using Measures of Center and Variability)',                  'Compare and contrast two or more data sets using calculated statistics',                                                'NC.M1.S-ID.2', false, 7),
    ('M1.DAS.3.1', 'Representing Two-Variable Data with Scatter Plots',                                'Create scatter plots from bivariate data; Label axes correctly',                                                        'NC.M1.S-ID.6', false, 8),
    ('M1.DAS.3.2', 'Interpreting Scatter Plots (Correlation, Outliers, Clusters)',                    'Describe the direction, form, and strength of association; Identify outliers',                                          'NC.M1.S-ID.6', false, 9),
    ('M1.DAS.4.1', 'Understanding and Calculating the Line of Best Fit (Linear Regression)',           'Draw a line of best fit by eye; Use technology to calculate the least-squares regression line',                          'NC.M1.S-ID.6', false, 10),
    ('M1.DAS.4.2', 'Using the Line of Best Fit for Prediction and Interpretation',                    'Predict values using the linear model; Interpret the slope and y-intercept in context',                                  'NC.M1.S-ID.7', false, 11),
    ('M1.DAS.4.3', 'Understanding Residuals',                                                          'Calculate residuals; Interpret residuals in relation to the line of best fit',                                          'NC.M1.S-ID.6', true,  12),
    ('M1.DAS.5.1', 'Understanding the Correlation Coefficient (Introduction to r-value)',              'Interpret the meaning of the correlation coefficient (strength and direction)',                                         'NC.M1.S-ID.8', false, 13),
    ('M1.DAS.5.2', 'Distinguishing Between Correlation and Causation',                                'Explain that correlation does not imply causation; Identify potential lurking variables',                                'NC.M1.S-ID.9', false, 14)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'DAS' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 9: Geometric Transformations & Congruence (GEO.TRANS, 14 concepts)
-- -----------------------------------------------------------------------------

INSERT INTO public.atomic_concepts
    (unit_topic_id, lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
SELECT ut.id, v.lesson_number, v.name, v.key_skills, v.state_standard, v.is_generator_ready, v.display_order
FROM public.unit_topics ut
JOIN public.courses c ON ut.course_id = c.id
CROSS JOIN (VALUES
    ('M1.GEO.TRANS.1.1', 'Understanding Transformations (Introduction to Rigid Motions/Isometries)',                       'Define transformation; Identify rigid motions that preserve distance and angle measure',                                       'NC.M1.G-CO.2',                false, 1),
    ('M1.GEO.TRANS.2.1', 'Understanding Translations (Vector Notation and Coordinate Rules)',                              'Define translation; Represent translations using vectors or coordinate rules',                                                  'NC.M1.G-CO.2, NC.M1.G-CO.4', false, 2),
    ('M1.GEO.TRANS.2.2', 'Performing and Graphing Translations in the Coordinate Plane',                                  'Translate figures on the coordinate plane based on given rules or vectors',                                                     'NC.M1.G-CO.2',                true,  3),
    ('M1.GEO.TRANS.3.1', 'Understanding Reflections Across Axes and the Lines y=x and y=-x',                               'Define reflection; Identify lines of reflection (x-axis, y-axis, y=x, y=-x)',                                                   'NC.M1.G-CO.2, NC.M1.G-CO.4', false, 4),
    ('M1.GEO.TRANS.3.2', 'Performing and Graphing Reflections in the Coordinate Plane',                                    'Reflect figures across given lines on the coordinate plane',                                                                    'NC.M1.G-CO.2',                true,  5),
    ('M1.GEO.TRANS.3.3', 'Understanding Reflections Across Horizontal and Vertical Lines (Not Axes)',                      'Identify and apply rules for reflections across y=k and x=h',                                                                   'NC.M1.G-CO.2',                false, 6),
    ('M1.GEO.TRANS.4.1', 'Understanding Rotations About the Origin (90, 180, 270 degrees)',                                'Define rotation; Understand angle and direction of rotation; Use coordinate rules',                                             'NC.M1.G-CO.2, NC.M1.G-CO.4', false, 7),
    ('M1.GEO.TRANS.4.2', 'Performing and Graphing Rotations About the Origin',                                            'Rotate figures on the coordinate plane using rules for specific angles',                                                        'NC.M1.G-CO.2',                true,  8),
    ('M1.GEO.TRANS.5.1', 'Understanding Sequences of Transformations',                                                     'Perform a composition of two or more rigid transformations',                                                                    'NC.M1.G-CO.5',                true,  9),
    ('M1.GEO.TRANS.6.1', 'Identifying Congruent Figures Based on Rigid Motions',                                          'Determine if two figures are congruent by identifying a sequence of rigid motions',                                             'NC.M1.G-CO.6',                false, 10),
    ('M1.GEO.TRANS.7.1', 'Understanding Definitions of Geometric Figures in Terms of Rigid Motions',                       'Understand how rigid motions relate to definitions of angles, perpendicular lines, parallel lines, and line segments',           'NC.M1.G-CO.1',                false, 11),
    ('M1.GEO.TRANS.7.2', 'Understanding Definitions of Circles and Polygons in Terms of Rigid Motions',                    'Understand how rigid motions relate to definitions of circles and polygons',                                                    'NC.M1.G-CO.1',                false, 12),
    ('M1.GEO.TRANS.8.1', 'Understanding Line Symmetry',                                                                   'Identify lines of symmetry in two-dimensional figures',                                                                          'NC.M1.G-CO.3',                false, 13),
    ('M1.GEO.TRANS.8.2', 'Understanding Rotational Symmetry',                                                             'Identify rotational symmetry in two-dimensional figures; Determine angle of rotation',                                          'NC.M1.G-CO.3',                false, 14)
) AS v(lesson_number, name, key_skills, state_standard, is_generator_ready, display_order)
WHERE ut.code = 'GEO.TRANS' AND c.code = 'NCM1'
ON CONFLICT (lesson_number) DO UPDATE SET
    name                = EXCLUDED.name,
    key_skills          = EXCLUDED.key_skills,
    state_standard      = EXCLUDED.state_standard,
    is_generator_ready  = EXCLUDED.is_generator_ready,
    display_order       = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 10: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_unit_count    INT;
    v_concept_count INT;
BEGIN
    SELECT COUNT(*) INTO v_unit_count
    FROM public.unit_topics ut JOIN public.courses c ON ut.course_id = c.id
    WHERE c.code = 'NCM1';

    SELECT COUNT(*) INTO v_concept_count FROM public.atomic_concepts;

    RAISE NOTICE '✓ 014b complete. unit_topics for NCM1: % (expected 8)', v_unit_count;
    RAISE NOTICE '✓ atomic_concepts total: % (expected 111)', v_concept_count;
    RAISE NOTICE 'Next: run 014c_curriculum_generators.sql';
END $$;

COMMIT;
