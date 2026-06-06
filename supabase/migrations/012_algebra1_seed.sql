-- ============================================================
-- 012_algebra1_seed.sql  (v2 - Unicode-safe)
-- Pool: algebra_1 (Varsity) | 51 concepts | 32 static Qs
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('Algebra 1', 'ALG1', '8-9', 'NC', 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Foundations of Algebra', 'ALG1.FND', 1),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Functions and Linear Functions', 'ALG1.FLF', 2),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Systems of Equations and Inequalities', 'ALG1.SYS', 3),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Exponents and Exponential Functions', 'ALG1.EXP', 4),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Polynomials and Factoring', 'ALG1.POLY', 5),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Quadratic Functions and Equations', 'ALG1.QUAD', 6),
  ((SELECT id FROM courses WHERE code = 'ALG1'),
   'Data Analysis and Statistics', 'ALG1.DAS', 7)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.1.2', 'Substitute given rational values (integers, fractions, negatives) for variables ', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.1.3', 'Combine like terms and/or distribute; answer is a simplified polynomial expressi', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.2.2', 'Solve x + a = b or x - a = b with rational coefficients; solution may be negativ', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.2.3', 'Solve ax = b or x/a = b with rational a; solution may be a fraction', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.2.4', 'Solve ax + b = c with rational coefficients; undo addition/subtraction then mult', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.2.5', 'Solve equations requiring distribution and combining like terms before isolating', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.2.6', 'Solve equations with variable terms on both sides; may require distribution firs', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.3.1', 'Solve |ax + b| = c by splitting into two equations; check for extraneous solutio', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.4.1', 'Solve a multi-variable formula for a specified variable (e.g., solve A = lw for ', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.5.2', 'Solve x + a < b or x - a >= b; solution is a number line description', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.5.3', 'Solve -ax op b where a > 0; tests if Mathlete flips the inequality sign', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.5.4', 'Solve multi-step inequalities including distribution and like-term combining; so', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.5.5', 'Solve AND/OR compound inequalities; AND produces an interval, OR produces a unio', 13, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FND'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FND.5.6', 'Solve |ax + b| < c (AND compound) or |ax + b| > c (OR compound)', 14, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.1.3', 'Evaluate f(a) for linear, quadratic, or piecewise functions; includes f(x+1), f(', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.2.1', 'Find slope from two points, a table, or a graph; includes zero slope, undefined ', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.3.1', 'Write the equation of a line in slope-intercept form given slope + y-intercept, ', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.3.2', 'Given two coordinate points, compute slope then write the equation in slope-inte', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.3.3', 'Given a point and slope, write the equation in point-slope form: y - y  = m(x - ', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.3.4', 'Convert a linear equation between slope-intercept, point-slope, and standard for', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.4.2', 'Given slope m, compute -1/m (negative reciprocal); includes fractions and intege', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.FLF'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.FLF.4.3', 'Write the equation of a line through a given point and parallel/perpendicular to', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.SYS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.SYS.2.1', 'Solve 2x2 system using substitution; one equation is already solved for a variab', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.SYS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.SYS.2.2', 'Solve 2x2 system by elimination where one variable cancels directly by adding/su', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.SYS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.SYS.2.3', 'Solve 2x2 system by multiplying one or both equations to create opposite coeffic', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.SYS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.SYS.4.2', 'Real-world two-variable system problem; Mathlete sets up and solves', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.1.1', 'Evaluate expressions with integer exponents involving numeric and variable bases', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.1.2', 'Simplify product/quotient of powers with variable bases and multi-term expressio', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.1.3', 'Apply power-of-power and power-of-product/quotient rules to multi-variable expre', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.1.4', 'Simplify expressions with zero and negative exponents involving variables; rewri', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.1.5', 'Apply multiple exponent rules in sequence; multi-variable, includes negative and', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.3.1', 'Given a table with a constant ratio between y-values, identify a and b to write ', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.EXP'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.EXP.4.1', 'Evaluate or write an exponential growth/decay model for a real-world scenario', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.2.1', 'Add two polynomials by combining like terms; degree <= 3', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.2.2', 'Subtract polynomials by distributing the negative then combining like terms; tes', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.2.3', 'Multiply a monomial by a binomial or trinomial using the distributive property', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.2.4', 'Multiply two binomials using FOIL; simplify all like terms; includes special pro', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.3.1', 'Factor the GCF from a polynomial; GCF may include a variable with an exponent', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.4.1', 'Factor x^2 + bx + c by finding two numbers that multiply to c and add to b', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.4.2', 'Factor ax^2 + bx + c where a != 1 using grouping, trial-and-error, or AC method', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.5.1', 'Factor a^2 - b^2 = (a + b)(a - b); includes numeric and variable perfect squares', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.POLY'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.POLY.5.2', 'Recognize and factor a^2 +/- 2ab + b^2 = (a +/- b)^2', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.QUAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.QUAD.2.2', 'Solve ax^2 + bx + c = 0 by factoring; apply zero product property; solutions may ', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.QUAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.QUAD.2.3', 'Solve ax^2 + c = 0 or (x + b)^2 = c by taking square roots; simplify radical solut', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.QUAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.QUAD.2.4', 'Apply quadratic formula to ax^2 + bx + c = 0; identify a, b, c; compute discrimin', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.QUAD'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.QUAD.4.1', 'Given a table of values, identify whether the function is linear (constant 1st d', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.DAS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.DAS.2.1', 'Compute mean, median, and mode for real data sets at Algebra 1 level; includes w', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.DAS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.DAS.2.2', 'Compute range and IQR from a data set or box plot; includes outlier identificati', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.DAS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.DAS.1.3', 'Read Q1, Q3, median, min, max from a box plot; compute IQR; identify distributio', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.DAS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.DAS.4.2', 'Given y = mx + b regression equation, predict y for a given x; interpret slope a', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'ALG1.DAS'
      AND course_id = (SELECT id FROM courses WHERE code = 'ALG1')),
   'Alg1.DAS.4.3', 'Calculate residual = actual y - predicted y; interpret whether the model overest', 5, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('Alg1.FND.1.1', 'Alg1.FND.1.1', 'ALG1',
   'multiple_choice', 'In the expression 7x^2 - 3x + 5, which part is the constant term ',
   '["A. 7", "B. x", "C. 3", "D. 5"]'::jsonb, 'D', 'A constant term has no variable. The constant here is 5. The coefficients are 7 and -3; x is the variable.',
   1, TRUE, FALSE),
  ('Alg1.FND.1.4', 'Alg1.FND.1.4', 'ALG1',
   'multiple_choice', 'Which property justifies rewriting 3(x + 5) as 3x + 15 ',
   '["A. Commutative Property of Multiplication", "B. Associative Property of Addition", "C. Distributive Property", "D. Additive Identity Property"]'::jsonb, 'C', 'The Distributive Property states a(b + c) = ab + ac. Here, 3 distributes over (x + 5).',
   1, TRUE, FALSE),
  ('Alg1.FND.2.7', 'Alg1.FND.2.7', 'ALG1',
   'multiple_choice', 'Solve: 4(x + 2) = 4x + 9',
   '["A. x = 1", "B. x = 0", "C. No solution \u2014 the equation is a contradiction", "D. All real numbers \u2014 the equation is always true"]'::jsonb, 'C', 'Expanding: 4x + 8 = 4x + 9 -> 8 = 9. This is always false -- no solution.',
   2, TRUE, FALSE),
  ('Alg1.FND.2.7', 'Alg1.FND.2.7', 'ALG1',
   'multiple_choice', 'Solve: 3(x - 2) = 3x - 6',
   '["A. x = 0", "B. x = 6", "C. No solution", "D. Infinitely many solutions \u2014 true for all real x"]'::jsonb, 'D', 'Expanding: 3x - 6 = 3x - 6 -> -6 = -6. This is always true -- infinite solutions.',
   2, TRUE, FALSE),
  ('Alg1.FND.3.1', 'Solve |ax + b| = c by splitting into two equations; check for extraneous solutio', 'ALG1',
   'multiple_choice', 'Which correctly sets up the solution to |2x - 3| = 7 ',
   '["A. 2x \u2212 3 = 7 only", "B. 2x \u2212 3 = 7 AND 2x \u2212 3 = \u22127", "C. |2x| = 10", "D. 2x \u2212 3 = 7 OR \u2212(2x \u2212 3) = \u22127"]'::jsonb, 'B', 'Absolute value equations split into two cases: the expression equals the positive value AND the expression equals the negative value.',
   2, TRUE, FALSE),
  ('Alg1.FND.3.1', 'Solve |ax + b| = c by splitting into two equations; check for extraneous solutio', 'ALG1',
   'multiple_choice', 'Solve |x + 4| = -2.',
   '["A. x = \u22126 and x = \u22122", "B. x = 6 and x = \u22122", "C. No solution", "D. x = 2 and x = \u22126"]'::jsonb, 'C', 'Absolute value is always non-negative. No expression inside an absolute value can equal -2. There is no solution.',
   2, TRUE, FALSE),
  ('Alg1.FND.5.3', 'Solve -ax op b where a > 0; tests if Mathlete flips the inequality sign', 'ALG1',
   'multiple_choice', 'Solve: -3x > 12',
   '["A. x > \u22124", "B. x < \u22124", "C. x > 4", "D. x < 4"]'::jsonb, 'B', 'Dividing both sides by -3 REVERSES the inequality: x < -4. Failure to flip is the most common error in inequality solving.',
   2, TRUE, FALSE),
  ('Alg1.FND.5.5', 'Solve AND/OR compound inequalities; AND produces an interval, OR produces a unio', 'ALG1',
   'multiple_choice', 'What is the solution to: x + 1 < 4 AND x - 2 > -1 ',
   '["A. x < 3 or x > 1 (all real numbers > 1)", "B. 1 < x < 3 (values between 1 and 3)", "C. x < 3 only", "D. x > 1 only"]'::jsonb, 'B', 'x < 3 AND x > 1 -- AND means intersection: both must be true simultaneously. Solution: 1 < x < 3.',
   2, TRUE, FALSE),
  ('Alg1.FLF.1.1', 'Alg1.FLF.1.1', 'ALG1',
   'multiple_choice', 'Which set of ordered pairs represents a function ',
   '["A. {(1,2), (2,3), (1,4)} \u2014 x=1 maps to both 2 and 4", "B. {(3,5), (4,5), (5,5)} \u2014 all map to 5", "C. {(\u22121,1), (0,0), (\u22121,\u22121)} \u2014 x=\u22121 maps to both 1 and \u22121", "D. {(2,3), (2,4), (2,5)} \u2014 x=2 maps to three values"]'::jsonb, 'B', 'A function requires each input to map to EXACTLY ONE output. In B, different inputs (3, 4, 5) each map to one output (5). Multiple inputs sharing an output is allowed.',
   2, TRUE, FALSE),
  ('Alg1.FLF.2.1', 'Find slope from two points, a table, or a graph; includes zero slope, undefined ', 'ALG1',
   'multiple_choice', 'Find the slope of the line through (2, 5) and (6, 13).',
   '["A. 1/2", "B. 2", "C. 8", "D. \u22122"]'::jsonb, 'B', 'slope = (y  - y )/(x  - x ) = (13 - 5)/(6 - 2) = 8/4 = 2. Reversing the fraction ( x/ y) gives 1/2 -- the common error.',
   1, TRUE, FALSE),
  ('Alg1.FLF.2.4', 'Alg1.FLF.2.4', 'ALG1',
   'multiple_choice', 'Which equation represents a vertical line passing through (3, 7) ',
   '["A. y = 7", "B. y = 3", "C. x = 3", "D. x = 7"]'::jsonb, 'C', 'A vertical line has an undefined slope; its equation is x = constant. The point (3, 7) has x = 3, so x = 3 is the vertical line.',
   1, TRUE, FALSE),
  ('Alg1.FLF.4.1', 'Alg1.FLF.4.1', 'ALG1',
   'multiple_choice', 'Are the lines y = 3x + 5 and y = 3x - 2 parallel ',
   '["A. No \u2014 they have different y-intercepts", "B. Yes \u2014 they have equal slopes and different y-intercepts", "C. No \u2014 parallel lines must have the same y-intercept", "D. Yes \u2014 they are the same line"]'::jsonb, 'B', 'Parallel lines have equal slopes (both m = 3 here) and DIFFERENT y-intercepts. Same y-intercept would make them the same line.',
   2, TRUE, FALSE),
  ('Alg1.FLF.4.2', 'Given slope m, compute -1/m (negative reciprocal); includes fractions and intege', 'ALG1',
   'multiple_choice', 'A line has slope 2/3. What is the slope of a line perpendicular to it ',
   '["A. \u22122/3", "B. 3/2", "C. \u22123/2", "D. 2/3"]'::jsonb, 'C', 'Perpendicular slope = negative reciprocal. Reciprocal of 2/3 is 3/2; negate to get -3/2. Just negating (-2/3) is wrong -- that''s the additive inverse, not perpendicular.',
   1, TRUE, FALSE),
  ('Alg1.FLF.6.1', 'Alg1.FLF.6.1', 'ALG1',
   'multiple_choice', 'A plumber charges $80 per hour plus a $50 service fee. In C = 80h + 50, what does the value 50 represent ',
   '["A. The cost per hour", "B. The flat service fee charged regardless of hours", "C. The total cost", "D. The number of hours worked"]'::jsonb, 'B', 'The y-intercept (50) is the value of C when h = 0 -- the cost before any hours are worked, i.e., the flat service fee.',
   3, TRUE, FALSE),
  ('Alg1.SYS.1.1', 'Alg1.SYS.1.1', 'ALG1',
   'multiple_choice', 'When solving a system of two linear equations graphically, the solution is:',
   '["A. Any point on the first line", "B. Any point on the second line", "C. The point(s) where both lines intersect \u2014 satisfying BOTH equations simultaneously", "D. The y-intercept of both lines"]'::jsonb, 'C', 'The solution to a system must satisfy ALL equations simultaneously -- it is the intersection point.',
   1, TRUE, FALSE),
  ('Alg1.SYS.3.1', 'Alg1.SYS.3.1', 'ALG1',
   'multiple_choice', 'A system has equations y = 2x + 3 and y = 2x + 3. How many solutions does it have ',
   '["A. No solution \u2014 they are parallel", "B. One solution \u2014 at (0, 3)", "C. Infinitely many solutions \u2014 they are the same line", "D. Two solutions \u2014 one for each equation"]'::jsonb, 'C', 'Identical equations represent the SAME line -- every point is a solution (infinitely many). Parallel lines have the SAME slope but DIFFERENT intercepts.',
   2, TRUE, FALSE),
  ('Alg1.EXP.1.2', 'Simplify product/quotient of powers with variable bases and multi-term expressio', 'ALG1',
   'multiple_choice', 'Simplify x    x^3.',
   '["A. x\u00b9\u00b2", "B. x\u2077", "C. x\u00b9", "D. 2x\u2077"]'::jsonb, 'B', 'Product rule: same base, ADD exponents. x    x^3 = x^(4+3) = x . Multiplying (x ^2) applies the power-of-a-power rule wrongly.',
   1, TRUE, FALSE),
  ('Alg1.EXP.2.3', 'Alg1.EXP.2.3', 'ALG1',
   'multiple_choice', 'Which condition on b determines whether y = a   b  represents exponential DECAY ',
   '["A. b < 0", "B. a < 0", "C. 0 < b < 1", "D. b > 1"]'::jsonb, 'C', 'Exponential decay requires the base b to be between 0 and 1 (exclusive). b > 1 gives growth. The value of a determines vertical stretch, not growth/decay.',
   2, TRUE, FALSE),
  ('Alg1.EXP.2.1', 'Alg1.EXP.2.1', 'ALG1',
   'multiple_choice', 'Which table represents an EXPONENTIAL function ',
   '["A. x: 0,1,2,3 | y: 2,5,8,11 (constant +3 difference)", "B. x: 0,1,2,3 | y: 1,2,4,8 (ratio = 2 each time)", "C. x: 0,1,2,3 | y: 0,1,4,9 (squared pattern)", "D. x: 0,1,2,3 | y: 10,8,6,4 (constant \u22122 difference)"]'::jsonb, 'B', 'Exponential functions have a CONSTANT RATIO between consecutive y-values. In B, each y value is multiplied by 2. A and D have constant differences (linear); C has constant second differences (quadratic).',
   2, TRUE, FALSE),
  ('Alg1.POLY.2.2', 'Subtract polynomials by distributing the negative then combining like terms; tes', 'ALG1',
   'multiple_choice', 'Simplify: (5x^2 + 3x - 2) - (2x^2 - 4x + 1)',
   '["A. 3x\u00b2 \u2212 x \u2212 3", "B. 3x\u00b2 + 7x \u2212 3", "C. 3x\u00b2 \u2212 x \u2212 1", "D. 7x\u00b2 \u2212 x \u2212 1"]'::jsonb, 'B', 'Distribute the minus: -(2x^2 - 4x + 1) = -2x^2 + 4x - 1. Then: (5x^2 + 3x - 2) + (-2x^2 + 4x - 1) = 3x^2 + 7x - 3. The most common error is not flipping the sign of -4x to +4x.',
   1, TRUE, FALSE),
  ('Alg1.POLY.4.1', 'Factor x^2 + bx + c by finding two numbers that multiply to c and add to b', 'ALG1',
   'multiple_choice', 'Factor x^2 - 7x + 12.',
   '["A. (x + 3)(x + 4)", "B. (x \u2212 3)(x \u2212 4)", "C. (x \u2212 6)(x \u2212 2)", "D. (x + 12)(x \u2212 1)"]'::jsonb, 'B', 'Find two numbers that MULTIPLY to 12 and ADD to -7: that''s -3 and -4. So (x - 3)(x - 4). The reversed error (add to 12, multiply to -7) would give different numbers.',
   1, TRUE, FALSE),
  ('Alg1.POLY.5.1', 'Factor a^2 - b^2 = (a + b)(a - b); includes numeric and variable perfect squares', 'ALG1',
   'multiple_choice', 'Which expression is a difference of two squares and can be factored ',
   '["A. x\u00b2 + 9", "B. x\u00b2 \u2212 9", "C. x\u00b2 + 6x + 9", "D. x\u00b2 \u2212 6x + 9"]'::jsonb, 'B', 'A difference of two squares: a^2 - b^2 = (a+b)(a-b). x^2 - 9 = x^2 - 3^2 = (x+3)(x-3). Note: x^2 + 9 is a SUM of squares -- not factorable over the reals.',
   2, TRUE, FALSE),
  ('Alg1.POLY.6.1', 'Alg1.POLY.6.1', 'ALG1',
   'multiple_choice', 'What is the BEST first step to factor 6x^2 - 24 ',
   '["A. Look for two numbers that multiply to \u221224 and add to 0", "B. Factor out the GCF: 6(x\u00b2 \u2212 4)", "C. Use the quadratic formula", "D. Apply the difference of squares immediately to 6x\u00b2 \u2212 24"]'::jsonb, 'B', 'Always check for a GCF first. GCF = 6: 6(x^2 - 4). Then x^2 - 4 is a difference of squares: 6(x+2)(x-2). Skipping the GCF step makes the remaining factoring harder.',
   3, TRUE, FALSE),
  ('Alg1.QUAD.1.1', 'Alg1.QUAD.1.1', 'ALG1',
   'multiple_choice', 'Which is a quadratic function in STANDARD FORM ',
   '["A. y = (x \u2212 3)\u00b2", "B. y = 2x\u00b2 \u2212 5x + 3", "C. y = (x + 1)(x \u2212 4)", "D. y = x\u00b2 (this is also standard form) \u2014 wait, what about vertex form "]'::jsonb, 'B', 'Standard form is y = ax^2 + bx + c. Only B is written in this form. A is vertex form, C is factored form. y = x^2 is technically standard form with b = c = 0.',
   1, TRUE, FALSE),
  ('Alg1.QUAD.2.1', 'Alg1.QUAD.2.1', 'ALG1',
   'multiple_choice', 'A quadratic has zeros at x = 2 and x = -5. What do these zeros represent graphically ',
   '["A. The y-intercept of the parabola", "B. The vertex coordinates", "C. The x-coordinates where the parabola crosses the x-axis", "D. The value of a, b, or c in standard form"]'::jsonb, 'C', 'Zeros are x-values where f(x) = 0 -- meaning the graph crosses (or touches) the x-axis. They are NOT the y-intercept.',
   2, TRUE, FALSE),
  ('Alg1.QUAD.2.4', 'Apply quadratic formula to ax^2 + bx + c = 0; identify a, b, c; compute discrimin', 'ALG1',
   'multiple_choice', 'For 2x^2 - 3x - 5 = 0, which correctly identifies a, b, and c for the quadratic formula ',
   '["A. a = 2, b = 3, c = 5", "B. a = 2, b = \u22123, c = \u22125", "C. a = 2, b = \u22123, c = 5", "D. a = 2, b = 3, c = \u22125"]'::jsonb, 'B', 'Standard form ax^2 + bx + c: here a = 2, b = -3 (the coefficient of x including its sign), c = -5 (the constant including its sign). Sign errors in b or c cause wrong discriminant and wrong solutions.',
   2, TRUE, FALSE),
  ('Alg1.QUAD.4.1', 'Given a table of values, identify whether the function is linear (constant 1st d', 'ALG1',
   'multiple_choice', 'A table shows x: 0,1,2,3,4 and y: 1,2,4,8,16. The first differences are 1,2,4,8. What type of function is this ',
   '["A. Linear \u2014 the values increase", "B. Quadratic \u2014 the second differences might be constant", "C. Exponential \u2014 the y-values have a constant ratio of 2", "D. Cubic \u2014 it grows faster than linear"]'::jsonb, 'C', 'Check consecutive ratios: 2/1=2, 4/2=2, 8/4=2, 16/8=2. Constant multiplicative ratio -> exponential. The second differences (1,2,4,8) are NOT constant (that''s quadratic).',
   3, TRUE, FALSE),
  ('Alg1.DAS.2.3', 'Alg1.DAS.2.3', 'ALG1',
   'multiple_choice', 'Data Set A: {5, 5, 5, 5, 5} and Data Set B: {1, 3, 5, 7, 9} both have a mean of 5. Which has a larger standard deviation ',
   '["A. Data Set A \u2014 it has more values equal to the mean", "B. Data Set B \u2014 its values are more spread out from the mean", "C. They have equal standard deviation \u2014 same mean", "D. Standard deviation cannot be compared across sets"]'::jsonb, 'B', 'Standard deviation measures the average distance from the mean. All values in A equal the mean (SD = 0). Values in B vary from 4 units below to 4 units above the mean. B has a larger standard deviation.',
   2, TRUE, FALSE),
  ('Alg1.DAS.5.2', 'Alg1.DAS.5.2', 'ALG1',
   'multiple_choice', 'A study finds a strong positive correlation (r = 0.95) between ice cream sales and drowning incidents. Which conclusion is valid ',
   '["A. Eating ice cream causes drowning", "B. Drowning causes people to buy ice cream", "C. Both are likely associated with a third variable (hot weather), but one does not cause the other", "D. The data is invalid because the correlation is too high"]'::jsonb, 'C', 'Correlation measures the strength of association -- NOT causation. Both variables are likely driven by temperature (a lurking variable). This is a classic example of correlation != causation.',
   3, TRUE, FALSE),
  ('Alg1.DAS.4.2', 'Given y = mx + b regression equation, predict y for a given x; interpret slope a', 'ALG1',
   'multiple_choice', 'A regression model predicts final exam score: y = 7.5x + 40, where x is hours studied. What does 40 represent ',
   '["A. The score improves by 40 points per hour of study", "B. The predicted score for a student who studies 7.5 hours", "C. The predicted score if a student studies 0 hours", "D. The maximum possible score"]'::jsonb, 'C', 'The y-intercept (40) is the predicted y when x = 0 -- the model''s predicted score with zero study hours. The slope (7.5) tells us how much the score increases per additional hour.',
   3, TRUE, FALSE),
  ('Alg1.DAS.4.3', 'Calculate residual = actual y - predicted y; interpret whether the model overest', 'ALG1',
   'multiple_choice', 'A student studied 4 hours. The model predicts y = 70 but their actual score was 65. What is the residual and what does it mean ',
   '["A. Residual = +5; the model underestimated the score", "B. Residual = \u22125; the model overestimated \u2014 actual score was below prediction", "C. Residual = \u22125; the model underestimated", "D. Residual = 70; the predicted score"]'::jsonb, 'B', 'Residual = actual - predicted = 65 - 70 = -5. A NEGATIVE residual means the actual value fell BELOW the prediction -- the model overestimated.',
   2, TRUE, FALSE),
  ('Alg1.DAS.5.1', 'Alg1.DAS.5.1', 'ALG1',
   'multiple_choice', 'An r-value of 0 indicates:',
   '["A. A perfect positive linear relationship", "B. A perfect negative linear relationship", "C. No linear relationship (though a non-linear pattern may still exist)", "D. The data has no pattern at all"]'::jsonb, 'C', 'r = 0 means no LINEAR correlation. A perfect parabola has r ~= 0 because it has no linear trend, yet it clearly follows a pattern.',
   2, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'ALG1'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'ALG1'
GROUP BY course;

COMMIT;

-- Expected: ALG1 | grade_band=8-9 | units=7 | concepts=51 | static_questions=32