-- ============================================================
-- 017_nc_math_3_seed.sql
-- Pool: nc_math_3 | NC Math 3 (Senior Varsity)
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('NC Math 3', 'NCM3', '10-11', 'NC', 3, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'Functions and Inverses', 'NCM3.FNI', 1),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'M3.EL', 'NCM3.EL', 2),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'M3.PR', 'NCM3.PR', 3),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'M3.TRIG', 'NCM3.TRIG', 4),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'Geometry', 'NCM3.GEO', 5),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'M3.CIR', 'NCM3.CIR', 6),
  ((SELECT id FROM courses WHERE code = 'NCM3'),
   'M3.PS', 'NCM3.PS', 7)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.1.2', 'Evaluate f(a), f(x+h), f(g(x)), or f(-x) for polynomial, rational, radical, or p', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.2.1', 'Compute [f(b) - f(a)] / (b - a) for polynomial, exponential, or rational functio', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.3.1', 'Compute (f+g)(x), (f-g)(x), or (f g)(x) algebraically and simplify', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.3.4', 'Evaluate (f g)(a) numerically or (f g)(x) algebraically', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.4.2', 'Find f  (x) by swapping x and y and solving; function types include linear, quad', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.4.4', 'Given f(x) and g(x), verify g = f   by showing (f g)(x) = x AND (g f)(x) = x', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.5.2', 'Given a piecewise function with 2-3 pieces, evaluate at a specified input by sel', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.FNI'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.FNI.1.1', 'Determine domain and/or range of a function from a graph, table, or equation (in', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.1.1', 'Simplify expressions with rational exponents (e.g., x^(2/3), x^(-1/2)) and conve', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.3.2', 'Rewrite b  = y as log_b(y) = x and vice versa', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.3.3', 'Evaluate log_b(x) for common values; includes log1 , ln, and other bases using d', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.4.1', 'Apply product rule (log MN = log M + log N) and quotient rule (log M/N = log M -', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.4.2', 'Apply power rule (log M  = p log M) and change of base: log_b(M) = log(M)/log(b)', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.4.3', 'Expand a single log into sum/difference/multiples, or condense multiple log term', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.5.1', 'Solve b  = b  by rewriting both sides with a common base; equate exponents', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.5.2', 'Solve a b  = c by taking log of both sides and applying power rule; includes bas', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.6.1', 'Solve log_b(ax + c) = d by converting to exponential form; check for extraneous ', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.6.2', 'Condense both sides to single logs, then equate arguments; check domain/extraneo', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.8.1', 'Solve A = Pe^(rt) or A = P(1 + r/n)^(nt) for any variable in a real-world contex', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.EL'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.EL.8.2', 'Apply logarithmic models: pH = -log[H ], Richter scale, decibel formula', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.2.1', 'Divide polynomial P(x) by D(x) using long division; express result as Q(x) + R(x', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.2.2', 'Use synthetic division to divide a polynomial by (x - k); express as Q(x) + R/(x', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.2.3', 'Use Remainder Theorem: evaluate P(k) to find remainder when P(x) is divided by (', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.3.1', 'List all possible rational roots +/-p/q for a polynomial equation with integer c', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.4.1', 'Find all real and complex zeros of a degree-3 or degree-4 polynomial using ratio', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.4.2', 'Construct a polynomial with given real and/or complex zeros; include conjugate p', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.5.1', 'Find the domain of f(x) = p(x)/q(x) by identifying zeros of q(x)', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.5.2', 'Find vertical asymptotes of f(x) = p(x)/q(x) after canceling common factors', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.5.3', 'Determine HA or slant asymptote by comparing degrees of numerator and denominato', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.5.4', 'Find hole(s) by identifying and canceling common factors; express as point (x, y', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.6.1', 'Multiply by LCD, solve resulting polynomial equation, check for extraneous solut', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.6.2', 'Solve p(x) > 0, p(x) < 0, etc. using sign chart; express solution in interval no', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PR.6.3', 'Solve p(x)/q(x) > 0 using sign chart, noting that q(x) = 0 creates excluded valu', 13, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.1.1', 'Find positive and negative coterminal angles for a given angle in degrees or rad', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.1.2', 'Convert angle measures between degrees and radians using pi/180 or 180/pi', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.2.1', 'Given an angle (degrees or radians), find the (cos  , sin  ) coordinates on the ', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.2.2', 'Find exact value of sin  , cos  , or tan   for any special angle using unit circ', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.2.3', 'Find the reference angle for a given angle, then compute the trig value with cor', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.4.2', 'Evaluate arcsin, arccos, arctan for exact values; answer in radians within restr', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.5.1', 'Use reciprocal, quotient, or Pythagorean identity to simplify an expression or f', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.6.1', 'Solve sin(x) = c, cos(x) = c, or tan(x) = c on a given interval [0, 2pi); give al', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.7.1', 'Solve non-right triangles using Law of Sines; includes AAS, ASA, and SSA (ambigu', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.7.2', 'Solve non-right triangles using Law of Cosines; SAS (find missing side) or SSS (', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.TRIG'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.TRIG.8.1', 'Compute the area of a triangle using Area = (1/2)ab sin(C) given two sides and i', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.1.1', 'Use distance formula to classify a triangle (scalene/isosceles/equilateral/right', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.2.1', 'Write (x - h)^2 + (y - k)^2 = r^2 given center (h, k) and radius r', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.2.2', 'Given (x - h)^2 + (y - k)^2 = r^2, identify center and radius; determine if a point', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.2.3', 'Convert x^2 + y^2 + Dx + Ey + F = 0 to standard form by completing the square twic', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.3.3', 'Apply inscribed angle theorem: inscribed angle = half the intercepted arc; inclu', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.GEO.CIR.5.1', 'Apply dilation with center (a, b) != (0,0) and scale factor k to a given point or', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.CIR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.CIR.4.1', 'Compute arc length using s = r  (radians) or s = ( /360) 2pir (degrees)', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.CIR'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.CIR.4.2', 'Compute sector area using A = (1/2)r^2  (radians) or A = ( /360) pir^2 (degrees)', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PS'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PS.1.1', 'Apply fundamental counting principle, P(n,r) = n!/(n-r)!, or C(n,r) = n!/(r!(n-r', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PS'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PS.2.2', 'Calculate E(X) =  [x   P(x)] from a probability distribution table', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PS'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PS.2.3', 'Apply B(n, k, p): P(X = k) = C(n,k)   p    (1-p)^(n-k)', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PS'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PS.3.2', 'Calculate z = (x -  ) /  ; or find x given z,  ,  ', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'NCM3.PS'
      AND course_id = (SELECT id FROM courses WHERE code = 'NCM3')),
   'M3.PS.3.3', 'Use z-score and z-table (or Empirical Rule for multiples of  ) to find probabili', 5, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('M3.FNI.1.3', 'M3.FNI.1.3', 'NCM3',
   'multiple_choice', 'A function f is shown on a graph. It is positive on (-2, 4) and increasing on (1, 5). Which statement is true at x = 3 ',
   '[{"key": "A", "text": "f is increasing AND positive"}, {"key": "B", "text": "f is increasing but may be negative"}, {"key": "C", "text": "f is positive but may be decreasing"}, {"key": "D", "text": "f must be at a maximum"}]'::jsonb, 'A', 'x = 3 falls within both (1, 5) [increasing] and (-2, 4) [positive], so f is both increasing and positive at x = 3. Increasing/decreasing and positive/negative are independent properties.',
   3, TRUE, FALSE),
  ('M3.FNI.3.3', 'M3.FNI.3.3', 'NCM3',
   'multiple_choice', 'Let f(x) = 2x + 1 and g(x) = x^2. Which statement is TRUE ',
   '[{"key": "A", "text": "(f g)(x) = (g f)(x) for all x"}, {"key": "B", "text": "(f g)(x) = 2x^2 + 1, but (g f)(x) = (2x+1)^2 = 4x^2 + 4x + 1 -- they are NOT equal"}, {"key": "C", "text": "Composition is always commutative for polynomial functions"}, {"key": "D", "text": "(f g)(x) = 2x^2 + 1 = (g f)(x)"}]'::jsonb, 'B', 'Function composition is NOT generally commutative. (f g)(x) = f(g(x)) = f(x^2) = 2x^2 + 1, while (g f)(x) = g(f(x)) = g(2x+1) = (2x+1)^2 = 4x^2 + 4x + 1. These are different functions.',
   2, TRUE, FALSE),
  ('M3.FNI.4.1', 'M3.FNI.4.1', 'NCM3',
   'multiple_choice', 'If f(x) = 3x + 2, which correctly represents f  (x) ',
   '[{"key": "A", "text": "1/(3x + 2)"}, {"key": "B", "text": "(x - 2)/3"}, {"key": "C", "text": "3x - 2"}, {"key": "D", "text": "1/3x - 2"}]'::jsonb, 'B', 'f  (x) is the INVERSE FUNCTION -- it undoes f. Swap x and y: x = 3y + 2, then solve: y = (x - 2)/3. The notation f  (x) does NOT mean 1/f(x) (that would be the multiplicative inverse).',
   2, TRUE, FALSE),
  ('M3.FNI.4.3', 'M3.FNI.4.3', 'NCM3',
   'multiple_choice', 'A function f contains the point (3, 7). Its inverse f   must contain which point ',
   '[{"key": "A", "text": "(-3, 7)"}, {"key": "B", "text": "(3, -7)"}, {"key": "C", "text": "(7, 3)"}, {"key": "D", "text": "(-3, -7)"}]'::jsonb, 'C', 'Inverse functions reflect over the line y = x. If (a, b) is on f, then (b, a) is on f  . The point (3, 7) on f becomes (7, 3) on f  .',
   2, TRUE, FALSE),
  ('M3.FNI.4.5', 'M3.FNI.4.5', 'NCM3',
   'multiple_choice', 'Why does f(x) = x^2 NOT have an inverse function over all real numbers ',
   '[{"key": "A", "text": "It is not a function"}, {"key": "B", "text": "It fails the horizontal line test -- two inputs (e.g., 3 and -3) map to the same output (9)"}, {"key": "C", "text": "It is not one-to-one because it has a minimum value"}, {"key": "D", "text": "Quadratics can never have inverse functions"}]'::jsonb, 'B', 'A function has an inverse only if it is one-to-one (each output comes from exactly one input). f(x) = x^2 fails because f(3) = f(-3) = 9. Restricting the domain to x >= 0 or x <= 0 makes it one-to-one.',
   3, TRUE, FALSE),
  ('M3.EL.3.1', 'M3.EL.3.1', 'NCM3',
   'multiple_choice', 'log2(8) =   Which reasoning is correct ',
   '[{"key": "A", "text": "log2(8) = 2 x 8 = 16"}, {"key": "B", "text": "log2(8) = 8/2 = 4"}, {"key": "C", "text": "log2(8) = 3, because 2^3 = 8"}, {"key": "D", "text": "log2(8) = log(2) + log(8)"}]'::jsonb, 'C', 'log_b(x) = y means b^y = x. So log2(8) asks: 2 to what power equals 8  Since 2^3 = 8, the answer is 3. Logarithm is an exponent, not a product.',
   2, TRUE, FALSE),
  ('M3.EL.4.1', 'Apply product rule (log MN = log M + log N) and quotient rule (log M/N = log M -', 'NCM3',
   'multiple_choice', 'Which expression correctly expands log3(5x) ',
   '[{"key": "A", "text": "log3(5) x log3(x)"}, {"key": "B", "text": "log3(5) + log3(x)"}, {"key": "C", "text": "5   log3(x)"}, {"key": "D", "text": "log3(5x^2)"}]'::jsonb, 'B', 'Product rule: log_b(MN) = log_b(M) + log_b(N). The log of a product is the SUM of logs, NOT the product of logs.',
   1, TRUE, FALSE),
  ('M3.EL.6.1', 'Solve log_b(ax + c) = d by converting to exponential form; check for extraneous ', 'NCM3',
   'multiple_choice', 'Solve log (x - 3) = 2. Which answer is correct ',
   '[{"key": "A", "text": "x = 19, and no check needed"}, {"key": "B", "text": "x = 19, after verifying x - 3 = 16 > 0  "}, {"key": "C", "text": "x = 7, because 4^2 - 3 = 13 != x"}, {"key": "D", "text": "x = 11 and x = -11"}]'::jsonb, 'B', 'Convert: 4^2 = x - 3 -> x = 19. Then check: the argument x - 3 = 16 > 0, so x = 19 is valid. Always verify that the argument of a logarithm is positive -- negative arguments produce extraneous solutions.',
   2, TRUE, FALSE),
  ('M3.EL.5.2', 'Solve a b  = c by taking log of both sides and applying power rule; includes bas', 'NCM3',
   'multiple_choice', 'Which step correctly begins solving 5^(2x+1) = 80 ',
   '[{"key": "A", "text": "2x + 1 = 80/5 = 16"}, {"key": "B", "text": "Take log of both sides: (2x+1) log(5) = log(80)"}, {"key": "C", "text": "2x + 1 = log  (5)"}, {"key": "D", "text": "5^(2x+1) - 80 = 0, then factor"}]'::jsonb, 'B', 'Take log of both sides, then apply the power rule to bring the exponent down: (2x+1) log(5) = log(80). Then solve for x.',
   2, TRUE, FALSE),
  ('M3.PR.1.2', 'M3.PR.1.2', 'NCM3',
   'multiple_choice', 'For f(x) = -2x  + 3x^2 - 1, describe the end behavior.',
   '[{"key": "A", "text": "As x -> +/-inf, f(x) -> +inf (both ends up)"}, {"key": "B", "text": "As x -> +inf, f(x) -> +inf; as x -> -inf, f(x) -> -inf"}, {"key": "C", "text": "As x -> +/-inf, f(x) -> -inf (both ends down)"}, {"key": "D", "text": "As x -> +inf, f(x) -> -inf; as x -> -inf, f(x) -> +inf"}]'::jsonb, 'C', 'Even degree (4) -> both ends go same direction. Negative leading coefficient (-2) -> both ends go DOWN. So as x -> +/-inf, f(x) -> -inf.',
   2, TRUE, FALSE),
  ('M3.PR.1.3', 'M3.PR.1.3', 'NCM3',
   'multiple_choice', 'f(x) = (x - 2)^2(x + 1). What happens at x = 2 ',
   '[{"key": "A", "text": "The graph crosses the x-axis at x = 2"}, {"key": "B", "text": "The graph touches but does not cross the x-axis at x = 2 (even multiplicity)"}, {"key": "C", "text": "The graph has a vertical asymptote at x = 2"}, {"key": "D", "text": "x = 2 is not a zero"}]'::jsonb, 'B', 'x = 2 has even multiplicity (2) -- the graph TOUCHES and bounces off the x-axis, not crosses. x = -1 has odd multiplicity (1) -- the graph crosses at that point.',
   2, TRUE, FALSE),
  ('M3.PR.2.4', 'M3.PR.2.4', 'NCM3',
   'multiple_choice', 'P(x) is a polynomial and P(3) = 0. What can you conclude ',
   '[{"key": "A", "text": "x = 3 is the only zero of P"}, {"key": "B", "text": "(x + 3) is a factor of P"}, {"key": "C", "text": "(x - 3) is a factor of P"}, {"key": "D", "text": "P(3) = 0 means 3 is not a valid input"}]'::jsonb, 'C', 'Factor Theorem: P(k) = 0 if and only if (x - k) is a factor of P. Since P(3) = 0, (x - 3) is a factor -- not (x + 3).',
   2, TRUE, FALSE),
  ('M3.PR.3.2', 'M3.PR.3.2', 'NCM3',
   'multiple_choice', 'A degree-5 polynomial with real coefficients has zeros 2, -1, and 3i. How many zeros does it have in total, and what must also be a zero ',
   '[{"key": "A", "text": "3 zeros total -- 2, -1, and 3i"}, {"key": "B", "text": "5 zeros: 2, -1, 3i, -3i, and one more real zero"}, {"key": "C", "text": "5 zeros: 2, -1, 3i, -3i, and the 5th is always 0"}, {"key": "D", "text": "Exactly 5 zeros with no constraint on type"}]'::jsonb, 'B', 'Conjugate Root Theorem: complex zeros of real-coefficient polynomials come in conjugate pairs. If 3i is a zero, so is -3i. The degree-5 polynomial has 5 zeros total: 2, -1, 3i, -3i, and one more real zero.',
   3, TRUE, FALSE),
  ('M3.PR.5.4', 'Find hole(s) by identifying and canceling common factors; express as point (x, y', 'NCM3',
   'multiple_choice', 'f(x) = (x^2 - 4)/(x - 2). What happens at x = 2 ',
   '[{"key": "A", "text": "Vertical asymptote at x = 2"}, {"key": "B", "text": "Hole at (2, 4) -- a removable discontinuity"}, {"key": "C", "text": "The function equals 4 at x = 2"}, {"key": "D", "text": "The function is undefined everywhere"}]'::jsonb, 'B', 'Factor: (x^2-4)/(x-2) = (x+2)(x-2)/(x-2). The (x-2) cancels, leaving f(x) = x + 2 with a HOLE at x = 2 (not a vertical asymptote). The hole''s y-coordinate: plug x = 2 into simplified form: 2 + 2 = 4. Hole at (2, 4).',
   2, TRUE, FALSE),
  ('M3.PR.6.1', 'Multiply by LCD, solve resulting polynomial equation, check for extraneous solut', 'NCM3',
   'multiple_choice', 'Solving 3/(x - 2) = 5 gives x = 17/5. Is this valid ',
   '[{"key": "A", "text": "No -- x = 17/5 makes the denominator zero"}, {"key": "B", "text": "Yes -- 17/5 != 2, so the original denominator is non-zero  "}, {"key": "C", "text": "No -- all rational equations have extraneous solutions"}, {"key": "D", "text": "Yes -- we always trust the algebraic solution"}]'::jsonb, 'B', 'For rational equations, the excluded value is x = 2. Since 17/5 != 2, the solution is valid. Always check that the solution doesn''t make any denominator equal to zero.',
   2, TRUE, FALSE),
  ('M3.TRIG.1.2', 'Convert angle measures between degrees and radians using pi/180 or 180/pi', 'NCM3',
   'multiple_choice', 'Convert 150deg to radians.',
   '[{"key": "A", "text": "150pi"}, {"key": "B", "text": "5pi/6"}, {"key": "C", "text": "6pi/5"}, {"key": "D", "text": "5pi/3"}]'::jsonb, 'B', 'Multiply by pi/180: 150 x (pi/180) = 150pi/180 = 5pi/6. The common error is multiplying by pi instead of dividing by 180.',
   1, TRUE, FALSE),
  ('M3.TRIG.2.2', 'Find exact value of sin  , cos  , or tan   for any special angle using unit circ', 'NCM3',
   'multiple_choice', 'On the unit circle, the point corresponding to 60deg is (1/2, sqrt3/2). What are cos(60deg) and sin(60deg) ',
   '[{"key": "A", "text": "cos(60deg) = sqrt3/2, sin(60deg) = 1/2"}, {"key": "B", "text": "cos(60deg) = 1/2, sin(60deg) = sqrt3/2"}, {"key": "C", "text": "cos(60deg) = 1/2, sin(60deg) = 1/2"}, {"key": "D", "text": "cos(60deg) = sqrt3, sin(60deg) = 1"}]'::jsonb, 'B', 'Unit circle convention: point = (cos  , sin  ). So x-coordinate = cos, y-coordinate = sin. cos(60deg) = 1/2 and sin(60deg) = sqrt3/2.',
   1, TRUE, FALSE),
  ('M3.TRIG.2.3', 'Find the reference angle for a given angle, then compute the trig value with cor', 'NCM3',
   'multiple_choice', 'Find sin(210deg).',
   '[{"key": "A", "text": "sqrt3/2"}, {"key": "B", "text": "1/2"}, {"key": "C", "text": "-1/2"}, {"key": "D", "text": "-sqrt3/2"}]'::jsonb, 'C', '210deg is in Quadrant III. Reference angle = 210deg - 180deg = 30deg. sin(30deg) = 1/2. In QII I, sine is NEGATIVE. So sin(210deg) = -1/2. (ASTC: Only sine positive in QII; Only tangent positive in QIII.)',
   2, TRUE, FALSE),
  ('M3.TRIG.4.1', 'M3.TRIG.4.1', 'NCM3',
   'multiple_choice', 'Evaluate arcsin(sin(5pi/4)).',
   '[{"key": "A", "text": "5pi/4"}, {"key": "B", "text": "-pi/4"}, {"key": "C", "text": "3pi/4"}, {"key": "D", "text": "pi/4"}]'::jsonb, 'B', 'sin(5pi/4) = -sqrt2/2. Now arcsin(-sqrt2/2) must give a result in [-pi/2, pi/2] (the restricted range). arcsin(-sqrt2/2) = -pi/4. So arcsin(sin(5pi/4)) != 5pi/4 because 5pi/4 is outside the restricted range.',
   3, TRUE, FALSE),
  ('M3.TRIG.5.1', 'Use reciprocal, quotient, or Pythagorean identity to simplify an expression or f', 'NCM3',
   'multiple_choice', 'A student writes: ''Since sin^2x + cos^2x = 1, then sin x + cos x = 1.'' Is this correct ',
   '[{"key": "A", "text": "Yes -- it follows from the Pythagorean identity"}, {"key": "B", "text": "No -- sqrt(sin^2x + cos^2x) != sin x + cos x; the identity applies to SQUARED terms only"}, {"key": "C", "text": "Yes -- it is true for all values of x"}, {"key": "D", "text": "Yes -- because sin and cos are both less than 1"}]'::jsonb, 'B', 'sin^2x + cos^2x = 1 is the Pythagorean identity. This does NOT imply sin x + cos x = 1. For example, at x = 0: sin(0) + cos(0) = 0 + 1 = 1, but at x = pi/4: sqrt2/2 + sqrt2/2 = sqrt2 != 1. The identity involves squares, not first powers.',
   3, TRUE, FALSE),
  ('M3.TRIG.6.1', 'Solve sin(x) = c, cos(x) = c, or tan(x) = c on a given interval [0, 2pi); give al', 'NCM3',
   'multiple_choice', 'Solve sin(x) = sqrt3/2 on [0, 2pi). How many solutions are there ',
   '[{"key": "A", "text": "One solution: x = pi/3"}, {"key": "B", "text": "Two solutions: x = pi/3 and x = 2pi/3"}, {"key": "C", "text": "Two solutions: x = pi/3 and x = 4pi/3"}, {"key": "D", "text": "Three solutions"}]'::jsonb, 'B', 'sin = sqrt3/2 is positive in QI and QII. QI solution: pi/3. QII solution: pi - pi/3 = 2pi/3. Both are in [0, 2pi). Missing the second quadrant solution is the most common error in trig equations.',
   2, TRUE, FALSE),
  ('M3.TRIG.7.1', 'Solve non-right triangles using Law of Sines; includes AAS, ASA, and SSA (ambigu', 'NCM3',
   'multiple_choice', 'In triangle ABC, a = 10, b = 14, and A = 30deg. How many triangles are possible ',
   '[{"key": "A", "text": "Exactly one triangle"}, {"key": "B", "text": "No triangle -- the sides are incompatible"}, {"key": "C", "text": "Two triangles are possible (ambiguous case)"}, {"key": "D", "text": "Infinitely many triangles"}]'::jsonb, 'C', 'This is SSA (given side-side-angle not the included angle). Since a < b and a > b sin(A) = 14 sin(30deg) = 7, two triangles are possible. The height h = b sin(A) = 7 < a = 10 < b = 14 -> two solutions.',
   3, TRUE, FALSE),
  ('M3.GEO.CIR.2.3', 'Convert x^2 + y^2 + Dx + Ey + F = 0 to standard form by completing the square twic', 'NCM3',
   'multiple_choice', 'To complete the square for x^2 + 6x, you add:',
   '[{"key": "A", "text": "6 (add the coefficient)"}, {"key": "B", "text": "9 (add (6/2)^2 = 3^2 = 9)"}, {"key": "C", "text": "36 (add 6^2)"}, {"key": "D", "text": "3 (add half the coefficient)"}]'::jsonb, 'B', 'Completing the square: take half the linear coefficient (6/2 = 3), then SQUARE it (3^2 = 9). So x^2 + 6x + 9 = (x + 3)^2. Adding 6 or 36 are common errors.',
   1, TRUE, FALSE),
  ('M3.GEO.CIR.3.3', 'Apply inscribed angle theorem: inscribed angle = half the intercepted arc; inclu', 'NCM3',
   'multiple_choice', 'An inscribed angle intercepts an arc of 120deg. What is the measure of the inscribed angle ',
   '[{"key": "A", "text": "120deg"}, {"key": "B", "text": "240deg"}, {"key": "C", "text": "60deg"}, {"key": "D", "text": "30deg"}]'::jsonb, 'C', 'Inscribed Angle Theorem: the inscribed angle = half the intercepted arc. 120deg/2 = 60deg. A central angle would equal the arc (120deg). Students often confuse these two.',
   1, TRUE, FALSE),
  ('M3.PS.2.1', 'M3.PS.2.1', 'NCM3',
   'multiple_choice', 'Which of the following IS a valid probability distribution for X ',
   '[{"key": "A", "text": "P(X=1)=0.4, P(X=2)=0.3, P(X=3)=0.4 (sum = 1.1)"}, {"key": "B", "text": "P(X=1)=0.5, P(X=2)=0.3, P(X=3)=0.2 (sum = 1.0, all non-negative)"}, {"key": "C", "text": "P(X=1)=0.6, P(X=2)=-0.1, P(X=3)=0.5 (negative probability)"}, {"key": "D", "text": "P(X=1)=0.3, P(X=2)=0.3, P(X=3)=0.3 (sum = 0.9)"}]'::jsonb, 'B', 'A valid probability distribution requires: (1) all probabilities >= 0, and (2) probabilities sum to exactly 1. Only B satisfies both conditions.',
   2, TRUE, FALSE),
  ('M3.PS.3.1', 'M3.PS.3.1', 'NCM3',
   'multiple_choice', 'For a NORMAL distribution with   = 70 and   = 5, approximately what percent of data falls within ONE standard deviation of the mean ',
   '[{"key": "A", "text": "50%"}, {"key": "B", "text": "68%"}, {"key": "C", "text": "95%"}, {"key": "D", "text": "99.7%"}]'::jsonb, 'B', 'Empirical Rule (68-95-99.7): 68% of data falls within 1 , 95% within 2 , 99.7% within 3 . This applies specifically to NORMAL distributions.',
   1, TRUE, FALSE),
  ('M3.PS.3.2', 'Calculate z = (x -  ) /  ; or find x given z,  ,  ', 'NCM3',
   'multiple_choice', 'A student scores 85 on a test where   = 75 and   = 10. The z-score is +1.0. What does this mean ',
   '[{"key": "A", "text": "There is a 1.0% chance the student scored 85"}, {"key": "B", "text": "The student scored exactly 1 point above the mean"}, {"key": "C", "text": "The student''''s score is 1 standard deviation above the mean"}, {"key": "D", "text": "The student scored in the top 1% of the class"}]'::jsonb, 'C', 'z = (85-75)/10 = 1.0 means the score is 1 standard deviation above the mean. A z-score is a standardized distance, NOT a probability or a point-count.',
   2, TRUE, FALSE),
  ('M3.PS.5.1', 'M3.PS.5.1', 'NCM3',
   'multiple_choice', 'A researcher rejects the null hypothesis at   = 0.05. Which conclusion is correct ',
   '[{"key": "A", "text": "The alternative hypothesis is proven to be true"}, {"key": "B", "text": "There is sufficient evidence at the 5% level to support the alternative hypothesis"}, {"key": "C", "text": "There is a 95% probability the alternative is correct"}, {"key": "D", "text": "The null hypothesis is definitely false"}]'::jsonb, 'B', 'Rejecting H  means there is sufficient statistical evidence -- NOT proof. We never ''prove'' hypotheses in statistics. We either reject or fail to reject H  based on probability thresholds.',
   3, TRUE, FALSE),
  ('M3.PS.5.2', 'M3.PS.5.2', 'NCM3',
   'multiple_choice', 'A p-value of 0.03 means:',
   '[{"key": "A", "text": "There is a 3% chance the null hypothesis is true"}, {"key": "B", "text": "There is a 97% chance the alternative hypothesis is true"}, {"key": "C", "text": "If the null hypothesis were true, there is a 3% chance of observing results at least as extreme as the data"}, {"key": "D", "text": "The effect size is 3% of the expected value"}]'::jsonb, 'C', 'The p-value is the probability of observing the data (or more extreme results) GIVEN THAT the null hypothesis is true. It is NOT the probability that H  is true or false. This is the most commonly misunderstood concept in all of statistics.',
   3, TRUE, FALSE)
ON CONFLICT (course, concept_id, question_text) DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'NCM3'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'NCM3'
GROUP BY course;

COMMIT;