-- ============================================================
-- 013_math_fundamentals_seed.sql
-- Pool: math_fundamentals (Foundation) | 90 concepts | 49 static Qs
-- SPECIAL: cross_division_eligible = TRUE (only pool eligible across all divisions)
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('Math Fundamentals', 'MF', '6-8', 'NC', 0, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Foundations & Number Basics', 'MF.FB', 1),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Algebraic Properties', 'MF.AP', 2),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Arithmetic with Negative Numbers', 'MF.ANT', 3),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Fractions, Decimals & Percents', 'MF.FDP', 4),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Ratios, Proportions & Basic Algebra', 'MF.RPBA', 5),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Unit Conversions & Measurement', 'MF.UC', 6),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Exponents & Roots', 'MF.ER', 7),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Geometry Foundations', 'MF.GEO', 8),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Statistics & Data', 'MF.S', 9),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Rational & Algebraic Reasoning', 'MF.RAD', 10),
  ((SELECT id FROM courses WHERE code = 'MF'),
   'Sets & Venn Diagrams', 'MF.SETS', 11)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
-- is_generator_ready = TRUE for all MF concepts (cross-division eligible)
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.1.1', 'Recall product of two single-digit numbers where at least one factor is 1-6', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.1.2', 'Recall product of two numbers where at least one factor is 7-12', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.1.3', 'Recall basic division fact where dividend <= 144 and divisor <= 12; answer is a wh', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.1.4', 'Mixed multiplication and division fact problems; randomizes between the two', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.2.1', 'Divide a multi-digit number by a 1-digit divisor with no remainder', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.2.2', 'Divide a multi-digit number by a 1- or 2-digit divisor; express remainder as R o', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FB'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FB.3.5', 'Given a number (integer, fraction, decimal, radical, or pi), classify it into th', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.AP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.AP.3.1', 'Expand a(b + c) using the distributive property; coefficients are integers or si', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.AP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.AP.3.2', 'Expand a(b - c) using the distributive property; includes negative outer coeffic', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.AP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.AP.5.1', 'Given a number n, find -n (additive inverse) such that n + (-n) = 0', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.AP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.AP.5.2', 'Given a number a (integer or fraction), find 1/a such that a x (1/a) = 1', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.AP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.AP.6.1', 'Simplify a numerical or algebraic expression by identifying and applying the cor', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.1.1', 'Evaluate |x| for integers, fractions, and decimals; includes expressions like |-', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.1.2', 'Add two or three integers with mixed signs; includes same-sign and opposite-sign', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.1.3', 'Subtract integers using add-the-opposite method; covers all sign combinations', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.1.4', 'Multiply two integers applying sign rules; answer requires sign determination', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.1.5', 'Divide two integers applying sign rules; dividend divisible by divisor; division', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.2.2', 'Find the prime factorization of a composite number; express in exponential form', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.2.3', 'Find the GCF of two (or three) whole numbers using prime factorization or listin', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.2.4', 'Find the LCM of two whole numbers; used for common denominators in fraction addi', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.3.2', 'Evaluate a multi-operation numerical expression following the correct order of o', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ANT'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ANT.3.3', 'Evaluate expressions with absolute value treated as grouping symbol within PEMDA', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.1.1', 'Given a fraction and a target denominator (or numerator), find the equivalent fr', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.1.2', 'Reduce a fraction to lowest terms by dividing numerator and denominator by GCF', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.1.3', 'Convert a mixed number to an improper fraction or vice versa', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.2.1', 'Add or subtract two fractions with the same denominator; simplify result', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.2.2', 'Add or subtract two fractions with different denominators; find LCD, convert, si', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.3.1', 'Multiply two fractions (or mixed numbers at hard level); simplify before or afte', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.3.2', 'Divide a fraction by a fraction using Keep-Change-Flip; simplify result', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.4.2', 'Add or subtract decimals; align decimal points; operands up to thousandths place', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.4.3', 'Multiply two decimals; total decimal places <= 4; count and place decimal point', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.4.4', 'Divide a decimal by a whole number or decimal by decimal; shift decimal, divide ', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.5.2', 'Convert between any two forms of fraction, decimal, and percent; both clean and ', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.6.1', 'Calculate P% of N (e.g., 35% of 80 = 28)', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.FDP'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.FDP.6.2', 'Find the whole given part and percent; or find the percent given part and whole', 13, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RPBA'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RPBA.1.2', 'Reduce a ratio a:b to its simplest form by dividing both terms by GCF', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RPBA'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RPBA.2.2', 'Solve a/b = c/  or a/   = c/d using cross-multiplication', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RPBA'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RPBA.2.3', 'Real-world proportion problem: set up and solve using cross-multiplication', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RPBA'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RPBA.3.2', 'Solve x + a = b or x - a = b using inverse operations', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RPBA'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RPBA.3.3', 'Solve ax = b or x/a = b using inverse operations', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.1.2', 'Convert between metric length units (mm, cm, m, km) using powers of 10', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.1.4', 'Convert between g and kg', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.1.6', 'Convert between mL and L', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.2.2', 'Convert between inches, feet, yards, and miles', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.2.4', 'Convert between ounces, pounds, and tons', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.2.6', 'Convert between fl oz, cups, pints, quarts, and gallons', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.3.2', 'Convert a quantity using a single conversion factor; set up with unit fraction m', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.3.3', 'Convert a quantity through a chain of 2-3 conversion factors (e.g., miles to inc', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.UC'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.UC.3.4', 'Convert compound rate units (e.g., miles/hour -> feet/second) using dimensional a', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.1', 'Evaluate b^n for whole-number base and exponent; includes b=0 and b=1 cases', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.2', 'Simplify x^a x x^b = x^(a+b) and x^a / x^b = x^(a-b)', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.3', 'Simplify (x^a)^b = x^(ab)', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.5', 'Evaluate any non-zero base raised to the power 0; confirm answer is always 1', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.6', 'Evaluate x^(-n) = 1/x^n; rewrite negative exponents as positive fractions', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.1.7', 'Apply multiple exponent laws in sequence to simplify complex expressions', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.2.1', 'Find sqrtn for perfect squares; connect to squaring as inverse operations', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.2.2', 'Find  n for perfect cubes; connect to cubing as inverse', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.ER'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.ER.2.4', 'Estimate sqrtn for non-perfect squares between two consecutive integers; refine to ', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.1.1', 'Compute perimeter of squares, rectangles, triangles, and regular polygons', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.1.2', 'Compute area of squares (A = s^2) and rectangles (A = lw)', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.1.3', 'Compute area of a triangle A = 1/2bh; includes right, acute, and obtuse triangles', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.2.2', 'Given one angle, find its complement (sum = 90deg)', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.2.3', 'Given one angle, find its supplement (sum = 180deg)', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.2.4', 'Given one angle at an intersection, find vertical or adjacent angles using their', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.3.2', 'Find the missing side of a right triangle using a^2 + b^2 = c^2', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.GEO.3.3', 'Real-world Pythagorean problem (ladder, diagonal, direct path)', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.1.2', 'Compute the arithmetic mean of a data set of 4-8 values; answer may be non-integ', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.1.3', 'Order values and identify the median; handles both odd and even dataset sizes', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.1.4', 'Identify mode(s) in a data set; includes no-mode, unimodal, and bimodal cases', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.2.1', 'Calculate range = max - min for a data set', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.2.2', 'Find Q1, Q3, and IQR = Q3 - Q1 for a dataset; odd-size datasets only to avoid in', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.3.1', 'Calculate P(event) from a clearly defined uniform sample space (dice, marbles, c', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.3.2', 'List all outcomes in a sample space for a simple or two-stage experiment', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.S'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.S.3.4', 'Given P(event) and number of trials, predict expected frequency of the event', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.1.1', 'Simplify sqrtn by extracting the largest perfect-square factor (e.g., sqrt72 = 6sqrt2)', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.1.2', 'Simplify sqrt(ax^n) by extracting perfect-square variable factors (e.g., sqrt(x ) = x^3', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.1.3', 'Simplify cube roots and nth roots by extracting perfect-cube/nth-power factors', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.2.1', 'Add/subtract radical terms with identical radicands (e.g., 3sqrt5 + 2sqrt5 = 5sqrt5)', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.2.2', 'Simplify unlike radicals first, then combine like terms (e.g., sqrt8 + sqrt18 = 5sqrt2)', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.3.1', 'Multiply two radical monomials: (asqrtm)(bsqrtn) = absqrt(mn); simplify result', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.3.2', 'Multiply asqrtm x (bsqrtn + csqrtp) using distribution; simplify each term', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.3.3', 'FOIL two binomial radical expressions; collect like terms; simplify all radicals', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.4.1', 'Rationalize a fraction with sqrtn in the denominator by multiplying by sqrtn/sqrtn', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.RAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.RAD.4.2', 'Rationalize a fraction with binomial denominator (a + sqrtb) by multiplying by conj', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.2.1', 'Find A union B (all elements in A or B or both); list in roster notation', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.2.2', 'Find A intersect B (elements in BOTH A and B)', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.2.3', 'Find A'' (elements in universal set U but NOT in A)', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.1.2', 'Given a set A, identify subsets or count the number of subsets (2^n formula)', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.4.1', 'Count elements in a set expressed in roster or set-builder notation', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'MF.SETS'
      AND course_id = (SELECT id FROM courses WHERE code = 'MF')),
   'MF.SETS.4.2', 'Apply n(A union B) = n(A) + n(B) - n(A intersect B) to find a missing cardinality', 6, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('MF.FB.3.1', 'MF.FB.3.1', 'MF',
   'multiple_choice', 'Which set includes the number 0 but does NOT include negative numbers ',
   '["A. Natural numbers", "B. Whole numbers", "C. Integers", "D. Rational numbers"]'::jsonb, 'B', 'Whole numbers = {0, 1, 2, 3, ...}. Natural numbers start at 1. Both exclude negatives, but only whole numbers include 0.',
   1, TRUE, FALSE),
  ('MF.FB.3.1', 'MF.FB.3.1', 'MF',
   'multiple_choice', 'A student says ''0 is a natural number.'' Which response is correct ',
   '["A. Correct \u2014 0 is the first natural number", "B. Incorrect \u2014 natural numbers begin at 1 and do not include 0", "C. Incorrect \u2014 natural numbers begin at \u22121", "D. Correct \u2014 0 is natural because it is not negative"]'::jsonb, 'B', 'Natural (counting) numbers begin at 1: {1, 2, 3, ...}. The set that adds 0 is the whole numbers.',
   2, TRUE, FALSE),
  ('MF.FB.3.3', 'MF.FB.3.3', 'MF',
   'multiple_choice', 'Which of the following is a rational number ',
   '["A. \u221a3", "B. \u03c0", "C. 0.4545\u0304 (0.45 repeating)", "D. \u221a11"]'::jsonb, 'C', 'Repeating decimals are rational because they can be expressed as fractions (0.45  = 5/11). All non-repeating, non-terminating decimals are irrational.',
   2, TRUE, FALSE),
  ('MF.FB.3.4', 'MF.FB.3.4', 'MF',
   'multiple_choice', 'Is sqrt4 rational or irrational ',
   '["A. Irrational \u2014 it has a square root symbol", "B. Rational \u2014 because \u221a4 = 2, which is an integer", "C. Neither \u2014 it equals 2, which is not a fraction", "D. Irrational \u2014 it equals 2 which is not a decimal"]'::jsonb, 'B', 'sqrt4 = 2, a whole number. Integers are rational (2 = 2/1). The radical symbol alone does not make a number irrational.',
   2, TRUE, FALSE),
  ('MF.FB.3.5', 'Given a number (integer, fraction, decimal, radical, or pi), classify it into th', 'MF',
   'multiple_choice', 'Which is the MOST complete and accurate classification of -8 ',
   '["A. Integer only", "B. Rational only", "C. Integer, rational, and real", "D. Negative number only"]'::jsonb, 'C', '-8 is an integer. All integers are rational (-8 = -8/1). All rational numbers are real. The correct classification includes all three.',
   2, TRUE, FALSE),
  ('MF.AP.1.1', 'MF.AP.1.1', 'MF',
   'multiple_choice', 'Which operation is NOT commutative ',
   '["A. Addition", "B. Multiplication", "C. Subtraction", "D. Both A and B"]'::jsonb, 'C', 'a - b != b - a in general (e.g., 10 - 3 = 7 but 3 - 10 = -7). Subtraction is not commutative.',
   2, TRUE, FALSE),
  ('MF.AP.2.1', 'MF.AP.2.1', 'MF',
   'multiple_choice', 'Which property justifies rewriting (3 + 5) + 7 as 3 + (5 + 7) ',
   '["A. Commutative Property of Addition", "B. Distributive Property", "C. Associative Property of Addition", "D. Identity Property of Addition"]'::jsonb, 'C', 'The associative property changes the GROUPING (parentheses), not the order. Commutative changes the order of the numbers.',
   1, TRUE, FALSE),
  ('MF.AP.3.1', 'Expand a(b + c) using the distributive property; coefficients are integers or si', 'MF',
   'multiple_choice', 'Which expression correctly applies the distributive property to 4(3x + 7) ',
   '["A. 12x + 7", "B. 12x + 28", "C. 4x + 28", "D. 12 + 28x"]'::jsonb, 'B', '4 must multiply BOTH terms: 4 x 3x = 12x and 4 x 7 = 28. Answer: 12x + 28.',
   1, TRUE, FALSE),
  ('MF.AP.3.2', 'Expand a(b - c) using the distributive property; includes negative outer coeffic', 'MF',
   'multiple_choice', 'Which correctly expands -3(2x - 5) ',
   '["A. \u22126x \u2212 15", "B. \u22126x + 15", "C. 6x \u2212 15", "D. 6x + 15"]'::jsonb, 'B', '-3 x 2x = -6x; -3 x (-5) = +15. Distributing a negative flips the sign of each term inside.',
   1, TRUE, FALSE),
  ('MF.AP.5.1', 'Given a number n, find -n (additive inverse) such that n + (-n) = 0', 'MF',
   'multiple_choice', 'The additive inverse of -2/3 is:',
   '["A. 2/3", "B. \u22123/2", "C. 3/2", "D. 1"]'::jsonb, 'A', 'The additive inverse of a number n is -n, so that n + (-n) = 0. The additive inverse of -2/3 is +2/3 (NOT the reciprocal).',
   1, TRUE, FALSE),
  ('MF.AP.5.2', 'Given a number a (integer or fraction), find 1/a such that a x (1/a) = 1', 'MF',
   'multiple_choice', 'What is the multiplicative inverse of 5 ',
   '["A. \u22125", "B. 5", "C. 1/5", "D. 0"]'::jsonb, 'C', 'The multiplicative inverse (reciprocal) of n is 1/n, so n x (1/n) = 1. The inverse of 5 is 1/5.',
   1, TRUE, FALSE),
  ('MF.ANT.1.1', 'Evaluate |x| for integers, fractions, and decimals; includes expressions like |-', 'MF',
   'multiple_choice', 'What is |-12| ',
   '["A. \u221212", "B. 12", "C. 0", "D. \u22121/12"]'::jsonb, 'B', 'Absolute value measures distance from zero, which is always non-negative. |-12| = 12.',
   1, TRUE, FALSE),
  ('MF.ANT.1.1', 'Evaluate |x| for integers, fractions, and decimals; includes expressions like |-', 'MF',
   'multiple_choice', 'Which expression has the GREATEST value ',
   '["A. |\u22128 + 3|", "B. |\u22128| + |3|", "C. \u2212|8 + 3|", "D. |8| \u2212 |3|"]'::jsonb, 'B', '|-8| + |3| = 8 + 3 = 11. |-8 + 3| = |-5| = 5. The triangle inequality tells us |a + b| <= |a| + |b|.',
   2, TRUE, FALSE),
  ('MF.ANT.3.1', 'MF.ANT.3.1', 'MF',
   'multiple_choice', 'A student evaluates 3 + 4 x 2 and gets 14. What did they do wrong ',
   '["A. Nothing \u2014 14 is correct", "B. They added before multiplying; the correct answer is 11", "C. They multiplied before adding; the correct answer is 10", "D. They forgot to use a calculator"]'::jsonb, 'B', 'PEMDAS: multiplication before addition. 4 x 2 = 8 first, then 3 + 8 = 11. Computing left-to-right gives 7 x 2 = 14 -- wrong.',
   2, TRUE, FALSE),
  ('MF.ANT.3.2', 'Evaluate a multi-operation numerical expression following the correct order of o', 'MF',
   'multiple_choice', 'Evaluate: 20 / 4 x 5',
   '["A. 1", "B. 25", "C. 4", "D. 100"]'::jsonb, 'B', 'Division and multiplication have equal priority -- evaluate left to right. 20 / 4 = 5, then 5 x 5 = 25. NOT 20 / (4 x 5) = 1.',
   2, TRUE, FALSE),
  ('MF.ANT.2.1', 'MF.ANT.2.1', 'MF',
   'multiple_choice', 'Which of the following is a prime number ',
   '["A. 1", "B. 9", "C. 15", "D. 17"]'::jsonb, 'D', '17 has exactly two factors: 1 and 17. The number 1 is neither prime nor composite by definition. 9 = 3x3 and 15 = 3x5 are composite.',
   1, TRUE, FALSE),
  ('MF.FDP.1.2', 'Reduce a fraction to lowest terms by dividing numerator and denominator by GCF', 'MF',
   'multiple_choice', 'Simplify 12/18.',
   '["A. 6/9 \u2014 divide both by 2", "B. 2/3 \u2014 divide both by 6 (GCF)", "C. 1/6 \u2014 subtract 6 from both", "D. 6/12 \u2014 divide both by 2"]'::jsonb, 'B', 'GCF(12, 18) = 6. 12 / 6 = 2 and 18 / 6 = 3. The fully simplified fraction is 2/3. Dividing by 2 gives 6/9, which is not fully simplified.',
   1, TRUE, FALSE),
  ('MF.FDP.2.2', 'Add or subtract two fractions with different denominators; find LCD, convert, si', 'MF',
   'multiple_choice', 'A student adds 1/3 + 1/4 and gets 2/7. What did they do wrong ',
   '["A. Nothing \u2014 2/7 is correct", "B. They added the numerators and denominators separately; they must first find a common denominator", "C. They should have multiplied instead", "D. They forgot to simplify"]'::jsonb, 'B', '1/3 + 1/4 requires LCD = 12: 4/12 + 3/12 = 7/12. Adding numerators and denominators directly (1+1)/(3+4) is a fundamental fraction error.',
   2, TRUE, FALSE),
  ('MF.FDP.3.2', 'Divide a fraction by a fraction using Keep-Change-Flip; simplify result', 'MF',
   'multiple_choice', 'Which correctly sets up the division 2/3 / 4/5 ',
   '["A. 3/2 \u00d7 4/5", "B. 2/3 \u00d7 5/4", "C. 3/2 \u00d7 5/4", "D. 2/3 \u00d7 4/5"]'::jsonb, 'B', 'Keep-Change-Flip: KEEP 2/3, CHANGE / to x, FLIP the SECOND fraction (4/5 becomes 5/4). Result: 2/3 x 5/4.',
   1, TRUE, FALSE),
  ('MF.FDP.5.1', 'MF.FDP.5.1', 'MF',
   'multiple_choice', 'Which correctly converts 35% to a decimal ',
   '["A. 35.0", "B. 3.5", "C. 0.35", "D. 0.035"]'::jsonb, 'C', 'Percent means ''per 100.'' 35% = 35/100 = 0.35. Divide the percent value by 100 (move decimal two places left).',
   1, TRUE, FALSE),
  ('MF.FDP.5.2', 'Convert between any two forms of fraction, decimal, and percent; both clean and ', 'MF',
   'multiple_choice', 'Convert 3/8 to a percent.',
   '["A. 38%", "B. 300/8 %", "C. 37.5%", "D. 83%"]'::jsonb, 'C', '3 / 8 = 0.375, then x 100 = 37.5%. Alternatively: 3/8 x 100 = 300/8 = 37.5%.',
   1, TRUE, FALSE),
  ('MF.FDP.6.2', 'Find the whole given part and percent; or find the percent given part and whole', 'MF',
   'multiple_choice', '18 is 30% of what number ',
   '["A. 5.4", "B. 54", "C. 60", "D. 600"]'::jsonb, 'C', '18 = 0.30 x W -> W = 18 / 0.30 = 60. Common error: multiplying 18 x 0.30 = 5.4 (which finds the part of a part, not the whole).',
   2, TRUE, FALSE),
  ('MF.FDP.1.3', 'Convert a mixed number to an improper fraction or vice versa', 'MF',
   'multiple_choice', 'Convert 2 3/4 to an improper fraction.',
   '["A. 9/4", "B. 11/4", "C. 3/4", "D. 23/4"]'::jsonb, 'B', '2 x 4 = 8, then 8 + 3 = 11. Improper fraction: 11/4. (2 3/4 means 2 whole + 3/4 = 8/4 + 3/4 = 11/4)',
   1, TRUE, FALSE),
  ('MF.ER.1.1', 'Evaluate b^n for whole-number base and exponent; includes b=0 and b=1 cases', 'MF',
   'multiple_choice', 'Evaluate 3^2.',
   '["A. 6", "B. 8", "C. 9", "D. 12"]'::jsonb, 'C', '3^2 means 3 x 3 = 9. Exponentiation is repeated multiplication, NOT multiplying the base by the exponent (3 x 2 = 6 is wrong).',
   1, TRUE, FALSE),
  ('MF.ER.1.5', 'Evaluate any non-zero base raised to the power 0; confirm answer is always 1', 'MF',
   'multiple_choice', 'Evaluate 7 .',
   '["A. 0", "B. 7", "C. 1", "D. Undefined"]'::jsonb, 'C', 'Any non-zero number raised to the power 0 equals 1. This is a rule of exponents: x^0 = 1 for x != 0.',
   1, TRUE, FALSE),
  ('MF.ER.1.6', 'Evaluate x^(-n) = 1/x^n; rewrite negative exponents as positive fractions', 'MF',
   'multiple_choice', 'Evaluate 2 ^3.',
   '["A. \u22128", "B. \u22126", "C. 1/8", "D. 1/6"]'::jsonb, 'C', '2 ^3 = 1/2^3 = 1/8. A negative exponent means ''take the reciprocal,'' NOT make the result negative.',
   1, TRUE, FALSE),
  ('MF.ER.1.2', 'Simplify x^a x x^b = x^(a+b) and x^a / x^b = x^(a-b)', 'MF',
   'multiple_choice', 'Simplify x^3 x x .',
   '["A. x\u00b9\u2075", "B. x\u2078", "C. x\u00b2", "D. 2x\u2078"]'::jsonb, 'B', 'Product rule: same base, ADD exponents. x^3 x x  = x^(3+5) = x . Multiplying exponents (x  ) is the power-of-a-power rule, not the product rule.',
   1, TRUE, FALSE),
  ('MF.ER.2.1', 'Find sqrtn for perfect squares; connect to squaring as inverse operations', 'MF',
   'multiple_choice', 'Evaluate sqrt64.',
   '["A. 32", "B. 4096", "C. 8", "D. 16"]'::jsonb, 'C', 'sqrt64 = 8 because 8^2 = 64. Square root asks ''what number times itself equals 64 '' Not 64 / 2 = 32.',
   1, TRUE, FALSE),
  ('MF.RAD.1.1', 'Simplify sqrtn by extracting the largest perfect-square factor (e.g., sqrt72 = 6sqrt2)', 'MF',
   'multiple_choice', 'Simplify sqrt72.',
   '["A. 6\u221a2", "B. 2\u221a18", "C. 3\u221a8", "D. 36\u221a2"]'::jsonb, 'A', 'sqrt72 = sqrt(36 x 2) = 6sqrt2. Options B (2sqrt18) and C (3sqrt8) are partially simplified but not fully -- sqrt18 and sqrt8 can be simplified further. Always extract the LARGEST perfect-square factor.',
   2, TRUE, FALSE),
  ('MF.RAD.2.1', 'Add/subtract radical terms with identical radicands (e.g., 3sqrt5 + 2sqrt5 = 5sqrt5)', 'MF',
   'multiple_choice', 'Simplify 5sqrt3 + 2sqrt3.',
   '["A. 7\u221a6", "B. 7\u221a3", "C. 10\u221a3", "D. 7\u221a9"]'::jsonb, 'B', 'Like radicals are like terms -- add the COEFFICIENTS, keep the radicand. 5 + 2 = 7, so 5sqrt3 + 2sqrt3 = 7sqrt3. Adding radicands (5sqrt3 + 2sqrt3 = 7sqrt6) is incorrect.',
   1, TRUE, FALSE),
  ('MF.RAD.4.1', 'Rationalize a fraction with sqrtn in the denominator by multiplying by sqrtn/sqrtn', 'MF',
   'multiple_choice', 'Rationalize 5/sqrt5.',
   '["A. (5 + \u221a5)/\u221a5", "B. 5\u221a5/5 = \u221a5", "C. 25/\u221a5", "D. 5/5 = 1"]'::jsonb, 'B', 'Multiply numerator and denominator by sqrt5/sqrt5: (5 x sqrt5)/(sqrt5 x sqrt5) = 5sqrt5/5 = sqrt5. The denominator becomes sqrt5 x sqrt5 = 5.',
   2, TRUE, FALSE),
  ('MF.RAD.3.3', 'FOIL two binomial radical expressions; collect like terms; simplify all radicals', 'MF',
   'multiple_choice', 'Expand (sqrt3 + sqrt2)(sqrt3 - sqrt2).',
   '["A. 3 \u2212 2 = 1", "B. \u221a3 \u2212 \u221a2", "C. 5", "D. 1 \u2212 2\u221a6"]'::jsonb, 'A', 'This is a difference of squares: (a + b)(a - b) = a^2 - b^2. Here a = sqrt3, b = sqrt2. (sqrt3)^2 - (sqrt2)^2 = 3 - 2 = 1. The middle terms cancel.',
   2, TRUE, FALSE),
  ('MF.UC.3.1', 'MF.UC.3.1', 'MF',
   'multiple_choice', 'To convert 48 inches to feet, which setup is correct ',
   '["A. 48 inches \u00d7 (12 inches/1 foot)", "B. 48 inches \u00d7 (1 foot/12 inches)", "C. 48 inches + 12", "D. 48 inches \u2212 12"]'::jsonb, 'B', 'The conversion factor must cancel the original unit (inches). Use: 48 in x (1 ft/12 in) = 4 ft. Option A would give in^2, not ft.',
   2, TRUE, FALSE),
  ('MF.UC.3.2', 'Convert a quantity using a single conversion factor; set up with unit fraction m', 'MF',
   'multiple_choice', 'Convert 3.5 km to meters.',
   '["A. 0.0035 m", "B. 350 m", "C. 3500 m", "D. 35 m"]'::jsonb, 'C', '1 km = 1000 m. 3.5 x 1000 = 3500 m. When converting to a smaller unit, multiply (more of the smaller unit needed).',
   1, TRUE, FALSE),
  ('MF.RPBA.2.1', 'MF.RPBA.2.1', 'MF',
   'multiple_choice', 'Do 2/5 and 6/14 form a proportion ',
   '["A. Yes \u2014 both are fractions less than 1", "B. No \u2014 2/5 = 0.4 but 6/14 \u2248 0.4286; they are not equal", "C. Yes \u2014 2 \u00d7 14 = 28 and 5 \u00d7 6 = 30, so they are close enough", "D. Yes \u2014 the numerators are both multiples of 2"]'::jsonb, 'B', 'Two ratios form a proportion only if they are EQUAL. Cross-multiply: 2 x 14 = 28 and 5 x 6 = 30. 28 != 30, so they are NOT proportional.',
   2, TRUE, FALSE),
  ('MF.RPBA.2.2', 'Solve a/b = c/  or a/   = c/d using cross-multiplication', 'MF',
   'multiple_choice', 'Solve for x: 3/4 = x/12.',
   '["A. x = 16", "B. x = 9", "C. x = 3", "D. x = 4"]'::jsonb, 'B', 'Cross-multiply: 3 x 12 = 4 x x -> 36 = 4x -> x = 9.',
   1, TRUE, FALSE),
  ('MF.RPBA.3.1', 'MF.RPBA.3.1', 'MF',
   'multiple_choice', 'What does the variable n represent in the expression ''a number n increased by 8'' ',
   '["A. The letter n", "B. The number 8", "C. An unknown quantity that the expression adds 8 to", "D. The word ''number''"]'::jsonb, 'C', 'A variable is a symbol representing an unknown or changing quantity. Here n is the unknown number, and the expression n + 8 represents it increased by 8.',
   1, TRUE, FALSE),
  ('MF.SETS.1.1', 'MF.SETS.1.1', 'MF',
   'multiple_choice', 'A student writes the set of letters in the word ''MISSISSIPPI.'' Which is correct ',
   '["A. {M, I, S, S, I, S, S, I, P, P, I} \u2014 11 elements", "B. {M, I, S, P} \u2014 4 elements", "C. {M, I, I, S, P} \u2014 5 elements", "D. {Mississippi}"]'::jsonb, 'B', 'A set contains only DISTINCT elements -- duplicates are not listed multiple times. The unique letters are M, I, S, P -> 4 elements.',
   2, TRUE, FALSE),
  ('MF.SETS.2.1', 'Find A union B (all elements in A or B or both); list in roster notation', 'MF',
   'multiple_choice', 'A = {1, 2, 3, 4} and B = {3, 4, 5, 6}. What is A union B ',
   '["A. {3, 4}", "B. {1, 2, 5, 6}", "C. {1, 2, 3, 4, 5, 6}", "D. {1, 2, 3, 4, 3, 4, 5, 6}"]'::jsonb, 'C', 'Union (union) means ALL elements from BOTH sets (no duplicates). A union B = {1, 2, 3, 4, 5, 6}. Option A is the intersection (elements in BOTH).',
   1, TRUE, FALSE),
  ('MF.SETS.2.2', 'Find A intersect B (elements in BOTH A and B)', 'MF',
   'multiple_choice', 'A = {2, 4, 6, 8} and B = {4, 6, 10, 12}. What is A intersect B ',
   '["A. {2, 4, 6, 8, 10, 12}", "B. {4, 6}", "C. {2, 8, 10, 12}", "D. {}"]'::jsonb, 'B', 'Intersection (intersect) means ONLY elements in BOTH sets. Both A and B contain 4 and 6. Answer: {4, 6}.',
   1, TRUE, FALSE),
  ('MF.SETS.4.2', 'Apply n(A union B) = n(A) + n(B) - n(A intersect B) to find a missing cardinality', 'MF',
   'multiple_choice', 'In a class, 15 students play soccer, 12 play basketball, and 5 play both. How many students play soccer OR basketball ',
   '["A. 27", "B. 32", "C. 22", "D. 7"]'::jsonb, 'C', 'n(S union B) = n(S) + n(B) - n(S intersect B) = 15 + 12 - 5 = 22. Subtracting the intersection prevents double-counting those who play both.',
   2, TRUE, FALSE),
  ('MF.GEO.2.1', 'MF.GEO.2.1', 'MF',
   'multiple_choice', 'Which correctly describes an obtuse angle ',
   '["A. Greater than 180\u00b0", "B. Exactly 90\u00b0", "C. Between 90\u00b0 and 180\u00b0", "D. Less than 90\u00b0"]'::jsonb, 'C', 'Obtuse angles measure between 90deg (exclusive) and 180deg (exclusive). Greater than 180deg is a reflex angle.',
   1, TRUE, FALSE),
  ('MF.GEO.2.2', 'Given one angle, find its complement (sum = 90deg)', 'MF',
   'multiple_choice', 'Angles A and B are complementary. If angle A = 38deg, what is angle B ',
   '["A. 142\u00b0", "B. 52\u00b0", "C. 62\u00b0", "D. 152\u00b0"]'::jsonb, 'B', 'Complementary angles sum to 90deg. B = 90deg - 38deg = 52deg. If they summed to 180deg (supplementary), B = 142deg.',
   1, TRUE, FALSE),
  ('MF.GEO.3.1', 'MF.GEO.3.1', 'MF',
   'multiple_choice', 'For which type of triangle does a^2 + b^2 = c^2 apply ',
   '["A. All triangles", "B. Equilateral triangles only", "C. Right triangles only", "D. Obtuse triangles only"]'::jsonb, 'C', 'The Pythagorean theorem ONLY applies to right triangles, where c is the hypotenuse (side opposite the right angle).',
   1, TRUE, FALSE),
  ('MF.GEO.3.2', 'Find the missing side of a right triangle using a^2 + b^2 = c^2', 'MF',
   'multiple_choice', 'A right triangle has legs of 6 and 8. What is the length of the hypotenuse ',
   '["A. 100", "B. 14", "C. 10", "D. 28"]'::jsonb, 'C', '6^2 + 8^2 = 36 + 64 = 100. Then c = sqrt100 = 10. Many students stop at 100, forgetting the final square root step.',
   1, TRUE, FALSE),
  ('MF.S.1.2', 'Compute the arithmetic mean of a data set of 4-8 values; answer may be non-integ', 'MF',
   'multiple_choice', 'A data set is: 4, 5, 5, 6, 100. Which measure of center is most affected by the value 100 ',
   '["A. Mode", "B. Median", "C. Mean", "D. Range"]'::jsonb, 'C', 'Mean = (4+5+5+6+100)/5 = 120/5 = 24. Median = 5. The outlier 100 dramatically pulls the mean but barely affects the median.',
   2, TRUE, FALSE),
  ('MF.S.1.3', 'Order values and identify the median; handles both odd and even dataset sizes', 'MF',
   'multiple_choice', 'Find the median of: 8, 3, 7, 1, 5.',
   '["A. 7 (the middle number as listed)", "B. 5 (sorted middle)", "C. 4.8 (the mean)", "D. 3"]'::jsonb, 'B', 'First sort: 1, 3, 5, 7, 8. The middle value (3rd of 5) is 5. Reading the middle of the unsorted list (7) is a common error.',
   1, TRUE, FALSE),
  ('MF.S.3.1', 'Calculate P(event) from a clearly defined uniform sample space (dice, marbles, c', 'MF',
   'multiple_choice', 'A bag contains 8 red, 4 blue, and 3 green marbles. What is the probability of drawing a red marble ',
   '["A. 8", "B. 8/15", "C. 8/7", "D. 8/12"]'::jsonb, 'B', 'P(red) = favorable outcomes / total outcomes = 8 / (8+4+3) = 8/15 ~= 0.533. Probability must always be between 0 and 1.',
   2, TRUE, FALSE),
  ('MF.S.3.3', 'MF.S.3.3', 'MF',
   'multiple_choice', 'A fair coin is flipped 10 times and lands heads 7 times. Which statement is TRUE ',
   '["A. The coin must be unfair because heads appeared more than 50% of the time", "B. The theoretical probability of heads is still 1/2, and experimental results naturally vary", "C. The experimental probability of heads is now always 7/10 for this coin", "D. Getting 7 heads means the next 3 flips must be tails"]'::jsonb, 'B', 'Theoretical probability (1/2) is fixed by the nature of the coin. Experimental results vary, especially with few trials. As trials increase, experimental probability approaches theoretical probability (Law of Large Numbers).',
   2, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'MF'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'MF'
GROUP BY course;

COMMIT;

-- Expected: MF | grade_band=6-8 | units=11 | concepts=90 | static_questions=49