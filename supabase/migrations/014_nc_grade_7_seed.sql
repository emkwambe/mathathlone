-- ============================================================
-- 014_nc_grade_7_seed.sql
-- Pool: nc_grade_7 (Challengers) | 33 concepts | 27 static Qs
-- EOG-aligned: NCDPI April 2026 Grade 7
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('NC Grade 7 Math', 'G7', '7', 'NC', 7, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'G7'),
   'The Number System', 'G7.NS', 1),
  ((SELECT id FROM courses WHERE code = 'G7'),
   'Ratios and Proportional Relationships', 'G7.RP', 2),
  ((SELECT id FROM courses WHERE code = 'G7'),
   'Expressions and Equations', 'G7.EE', 3),
  ((SELECT id FROM courses WHERE code = 'G7'),
   'Geometry', 'G7.GEO', 4),
  ((SELECT id FROM courses WHERE code = 'G7'),
   'Statistics and Probability', 'G7.SP', 5)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.1.2', 'Add two rational numbers (integers, fractions, or decimals with mixed signs)', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.1.4', 'Subtract two rational numbers with mixed signs', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.2.2', 'Multiply two rational numbers (integers, fractions, decimals), applying sign rul', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.2.4', 'Divide two rational numbers with mixed signs, including fraction / fraction', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.3.1', 'Convert a fraction to its decimal form; Mathletes identify if it terminates or r', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.NS.4.1', 'One-step or two-step real-world scenario requiring operations with rational numb', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.1.2', 'Given a proportional table or two values, compute k = y/x (unit rate / constant ', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.1.3', 'Given k, write the equation y = kx; or given equation, identify k', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.2.1', 'Solve for a missing value in a proportion within a real-world context', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.3.1', 'Calculate final price after applying a tax, tip, or discount percentage', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.3.2', 'Calculate simple interest I = Prt or final amount; or find missing P, r, or t', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.3.3', 'Compute percent increase or decrease; or find new/original value given percent c', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.3.4', 'Convert between fraction, decimal, and percent representations', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.RP.4.2', 'Given scale factor and drawing measurement, compute actual length or area', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.1.1', 'Add or subtract two linear expressions with rational coefficients and simplify', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.1.2', 'Factor a linear expression by pulling out the GCF (e.g., 6x + 9 -> 3(2x + 3))', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.1.3', 'Expand an expression using the distributive property with rational coefficients', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.2.1', 'Solve ax + b = c or ax/n + b = c where a, b, c are rational numbers', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.2.2', 'Solve equations requiring distributive property and combining like terms', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.3.1', 'Solve a one-step inequality; Mathlete identifies the solution set description', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.EE.3.2', 'Solve a two-step inequality with rational coefficients', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.1.1', 'Given one angle measure, find a missing angle using supplementary, complementary', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.2.3', 'Given radius or diameter, compute area or circumference; or solve for radius giv', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.3.1', 'Two angles in a relationship (complementary/supplementary/vertical) expressed wi', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.3.2', 'Given one angle formed by parallel lines cut by a transversal, find all named an', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.4.1', 'Find the area of a composite figure made of rectangles, triangles, or semicircle', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.4.2', 'Compute area of a named 2-D shape (triangle, parallelogram, trapezoid) given dim', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.4.3', 'Calculate volume of a right prism or right pyramid given base area and height', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.GEO.4.4', 'Compute surface area of a right prism or right pyramid by summing face areas', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.SP.3.3', 'Compute P(event) from a simple uniform sample space (dice, coins, marbles, spinn', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.SP.3.2', 'Given a frequency table of experimental results, compute P(event) as a fraction ', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.SP.4.1', 'Compute probability of a compound event using multiplication rule or sample spac', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G7.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G7')),
   'M7.SP.2.1', 'Given two data sets, compute and compare mean/median and IQR/MAD', 4, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions (27 rows; 9 concepts have 2-3 questions -- all legitimate)
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('M7.NS.1.1', 'M7.NS.1.1', 'G7',
   'multiple_choice', 'On a number line, adding a negative number to a positive number always results in a movement to the ___ from the starting position.',
   '["A. right", "B. left", "C. origin", "D. same position"]'::jsonb, 'B', 'Adding a negative number moves left on the number line (toward lesser values).',
   1, TRUE, FALSE),
  ('M7.NS.1.1', 'M7.NS.1.1', 'G7',
   'multiple_choice', 'Which expression is best modeled by starting at -3 on a number line and moving 5 units to the right ',
   '["A. \u22123 \u2212 5", "B. \u22123 + (\u22125)", "C. \u22123 + 5", "D. 3 + 5"]'::jsonb, 'C', 'Moving right on a number line means adding a positive number.',
   1, TRUE, FALSE),
  ('M7.NS.1.1', 'M7.NS.1.1', 'G7',
   'multiple_choice', 'Which statement about p + q is ALWAYS true when p > 0 and q < 0 ',
   '["A. p + q > 0", "B. p + q < 0", "C. p + q = 0", "D. The sign of p + q depends on the absolute values of p and q"]'::jsonb, 'D', 'The sign depends on which value has a larger absolute value.',
   2, TRUE, FALSE),
  ('M7.NS.1.3', 'M7.NS.1.3', 'G7',
   'multiple_choice', 'Which expression is equivalent to p - q ',
   '["A. p + q", "B. p + (\u2212q)", "C. \u2212p + q", "D. \u2212p \u2212 q"]'::jsonb, 'B', 'Subtraction is defined as adding the additive inverse: p - q = p + (-q).',
   1, TRUE, FALSE),
  ('M7.NS.1.3', 'M7.NS.1.3', 'G7',
   'multiple_choice', 'A diver is at -12 feet. She ascends to -5 feet. Which expression represents the change in her depth ',
   '["A. \u221212 \u2212 (\u22125)", "B. \u22125 \u2212 (\u221212)", "C. \u22125 + (\u221212)", "D. \u221212 + 5"]'::jsonb, 'B', 'Change = final - initial = -5 - (-12) = -5 + 12 = 7 feet upward.',
   2, TRUE, FALSE),
  ('M7.NS.2.1', 'M7.NS.2.1', 'G7',
   'multiple_choice', 'Which rule correctly describes the sign of a product ',
   '["A. positive \u00d7 negative = positive", "B. negative \u00d7 negative = negative", "C. negative \u00d7 negative = positive", "D. positive \u00d7 positive = negative"]'::jsonb, 'C', 'Two negatives multiplied yield a positive product.',
   1, TRUE, FALSE),
  ('M7.NS.2.3', 'M7.NS.2.3', 'G7',
   'multiple_choice', 'Which of the following expressions is UNDEFINED ',
   '["A. \u22128 \u00f7 4", "B. 0 \u00f7 (\u22125)", "C. \u22123 \u00f7 0", "D. \u22121 \u00f7 (\u22121)"]'::jsonb, 'C', 'Division by zero is undefined.',
   1, TRUE, FALSE),
  ('M7.NS.2.3', 'M7.NS.2.3', 'G7',
   'multiple_choice', 'Which statement explains why -15 / 3 = -5 ',
   '["A. Because \u22125 \u00d7 (\u22123) = 15", "B. Because \u22125 \u00d7 3 = \u221215", "C. Because 5 \u00d7 3 = 15", "D. Because \u221215 + 3 = \u221212"]'::jsonb, 'B', 'Division is the inverse of multiplication; -5 x 3 = -15 confirms the quotient.',
   1, TRUE, FALSE),
  ('M7.RP.1.1', 'M7.RP.1.1', 'G7',
   'multiple_choice', 'Which table represents a proportional relationship ',
   '["A. x: 1,2,3,4 | y: 3,5,7,9 (y = 2x+1)", "B. x: 2,4,6,8 | y: 6,12,18,24 (y = 3x)", "C. x: 1,2,3,4 | y: 1,3,6,10 (triangular numbers)", "D. x: 0,1,2,3 | y: 2,4,6,8 (y = 2x+2)"]'::jsonb, 'B', 'Table B has a constant ratio y/x = 3 and passes through the origin when extended.',
   2, TRUE, FALSE),
  ('M7.RP.1.1', 'M7.RP.1.1', 'G7',
   'multiple_choice', 'A graph of a proportional relationship MUST pass through which point ',
   '["A. (1, 1)", "B. (0, 0)", "C. (1, 0)", "D. (0, 1)"]'::jsonb, 'B', 'Proportional relationships have the form y = kx and always pass through the origin.',
   1, TRUE, FALSE),
  ('M7.RP.1.4', 'M7.RP.1.4', 'G7',
   'multiple_choice', 'In a proportional relationship between hours worked (x) and dollars earned (y), the point (1, 12.50) is on the graph. What does this point mean ',
   '["A. You earn $1 per hour", "B. You earn $12.50 per hour", "C. You work 12.50 hours total", "D. You earned $12.50 in total over 1 week"]'::jsonb, 'B', 'The point (1, r) represents the unit rate -- the value of y when x = 1.',
   2, TRUE, FALSE),
  ('M7.RP.1.4', 'M7.RP.1.4', 'G7',
   'multiple_choice', 'On a proportional graph for cups of flour (y) per batch of cookies (x), what does the point (0, 0) tell you ',
   '["A. You start with 0 cups and it doesn''t change", "B. If you make 0 batches, you need 0 cups", "C. The recipe uses equal cups and batches", "D. The graph has a y-intercept at the origin"]'::jsonb, 'B', '(0,0) means that when x = 0 (no batches), y = 0 (no flour needed) -- a property of proportional relationships.',
   2, TRUE, FALSE),
  ('M7.RP.4.1', 'M7.RP.4.1', 'G7',
   'multiple_choice', 'A map uses a scale of 1 inch : 50 miles. If two cities are 3.5 inches apart on the map, what is their actual distance ',
   '["A. 53.5 miles", "B. 46.5 miles", "C. 175 miles", "D. 150 miles"]'::jsonb, 'C', '3.5 x 50 = 175 miles.',
   2, TRUE, FALSE),
  ('M7.RP.4.1', 'M7.RP.4.1', 'G7',
   'multiple_choice', 'A blueprint has a scale of 1 cm : 4 m. A room on the blueprint is 3 cm x 5 cm. What is the AREA of the actual room ',
   '["A. 15 m\u00b2", "B. 60 m\u00b2", "C. 240 m\u00b2", "D. 120 m\u00b2"]'::jsonb, 'C', 'Actual dimensions: 12 m x 20 m = 240 m^2. Scale factor for area = 4^2 = 16; 15 x 16 = 240.',
   3, TRUE, FALSE),
  ('M7.EE.2.3', 'M7.EE.2.3', 'G7',
   'multiple_choice', 'Jamie has $120 and spends $15 per week on lunch. Which equation models how many weeks (w) until Jamie has $30 left ',
   '["A. 120 + 15w = 30", "B. 120 \u2212 15w = 30", "C. 15w \u2212 120 = 30", "D. 15(w \u2212 120) = 30"]'::jsonb, 'B', 'Start with $120, subtract $15 each week, set equal to $30.',
   2, TRUE, FALSE),
  ('M7.GEO.1.2', 'M7.GEO.1.2', 'G7',
   'multiple_choice', 'Which conditions are sufficient to draw exactly ONE unique triangle ',
   '["A. Three angle measures that sum to 180\u00b0", "B. Side lengths 3, 4, and 5", "C. Two angles measuring 60\u00b0 each", "D. Three angles each measuring 45\u00b0"]'::jsonb, 'B', 'Three specific side lengths (SSS) determine a unique triangle. Angle conditions alone determine shape but not size.',
   2, TRUE, FALSE),
  ('M7.GEO.1.2', 'M7.GEO.1.2', 'G7',
   'multiple_choice', 'Which condition would make it IMPOSSIBLE to draw a triangle ',
   '["A. Sides 5, 7, 9", "B. Angles 90\u00b0, 45\u00b0, 45\u00b0", "C. Sides 2, 3, 10", "D. Angles 30\u00b0, 60\u00b0, 90\u00b0"]'::jsonb, 'C', 'Triangle inequality: 2 + 3 = 5 < 10, so these sides cannot form a triangle.',
   2, TRUE, FALSE),
  ('M7.GEO.1.3', 'M7.GEO.1.3', 'G7',
   'multiple_choice', 'A right rectangular prism is sliced horizontally (parallel to the base). What 2-D shape is the cross-section ',
   '["A. Triangle", "B. Circle", "C. Rectangle", "D. Trapezoid"]'::jsonb, 'C', 'A horizontal slice of a right rectangular prism parallel to its base produces a rectangle.',
   2, TRUE, FALSE),
  ('M7.GEO.1.3', 'M7.GEO.1.3', 'G7',
   'multiple_choice', 'A right rectangular pyramid is sliced vertically through its apex. What 2-D shape is the cross-section ',
   '["A. Square", "B. Triangle", "C. Pentagon", "D. Trapezoid"]'::jsonb, 'B', 'A vertical slice through the apex of a rectangular pyramid produces a triangular cross-section.',
   2, TRUE, FALSE),
  ('M7.GEO.2.1', 'M7.GEO.2.1', 'G7',
   'multiple_choice', 'Which formula correctly gives the area of a circle with radius r ',
   '["A. A = \u03c0d", "B. A = 2\u03c0r", "C. A = \u03c0r\u00b2", "D. A = 4\u03c0r"]'::jsonb, 'C', 'Area of a circle = pir^2.',
   1, TRUE, FALSE),
  ('M7.GEO.2.2', 'M7.GEO.2.2', 'G7',
   'multiple_choice', 'Which expression gives the circumference of a circle with diameter d ',
   '["A. C = \u03c0d\u00b2", "B. C = 2\u03c0r\u00b2", "C. C = \u03c0d", "D. C = \u03c0r\u00b2"]'::jsonb, 'C', 'Circumference = pid = 2pir.',
   1, TRUE, FALSE),
  ('M7.SP.1.1', 'M7.SP.1.1', 'G7',
   'multiple_choice', 'Which of the following is a STATISTICAL question ',
   '["A. How tall is the Empire State Building ", "B. What is 7 \u00d7 8 ", "C. How many hours do 7th graders sleep on school nights ", "D. What is the capital of North Carolina "]'::jsonb, 'C', 'A statistical question anticipates variability -- different students will have different sleep amounts.',
   1, TRUE, FALSE),
  ('M7.SP.1.1', 'M7.SP.1.1', 'G7',
   'multiple_choice', 'Why is ''How much does a gallon of milk cost at one specific store today '' NOT a statistical question ',
   '["A. It involves money", "B. It has one definite answer with no variability", "C. It is too difficult to answer", "D. It uses units of measurement"]'::jsonb, 'B', 'Statistical questions anticipate variability. A question with a single fixed answer is not statistical.',
   2, TRUE, FALSE),
  ('M7.SP.3.1', 'M7.SP.3.1', 'G7',
   'multiple_choice', 'A bag has 5 red marbles and 5 blue marbles. Which word best describes the probability of drawing a red marble ',
   '["A. Impossible", "B. Unlikely", "C. Equally likely", "D. Certain"]'::jsonb, 'C', 'P(red) = 5/10 = 0.5, which is at the midpoint of 0 to 1 -- equally likely.',
   1, TRUE, FALSE),
  ('M7.SP.3.4', 'M7.SP.3.4', 'G7',
   'multiple_choice', 'A coin is flipped 40 times. Heads appears 26 times. Which statement best explains the difference from the expected 20 heads ',
   '["A. The coin is definitely unfair", "B. The coin is definitely fair \u2014 results always vary", "C. Natural variability in trials can cause results to differ from theoretical probability", "D. The experiment was done incorrectly"]'::jsonb, 'C', 'Experimental results vary due to chance; more trials bring results closer to the theoretical probability.',
   2, TRUE, FALSE),
  ('M7.SP.4.2', 'M7.SP.4.2', 'G7',
   'multiple_choice', 'Which tool is BEST for systematically listing all outcomes when flipping a coin AND rolling a die ',
   '["A. Bar graph", "B. Circle graph", "C. Tree diagram", "D. Number line"]'::jsonb, 'C', 'Tree diagrams systematically show all combinations in multi-stage experiments.',
   2, TRUE, FALSE),
  ('M7.SP.4.3', 'M7.SP.4.3', 'G7',
   'multiple_choice', 'You want to simulate randomly selecting a day of the week. Which tool is BEST suited for this simulation ',
   '["A. Flipping a coin", "B. Rolling a standard 6-sided die", "C. Using a random number generator from 1\u20137", "D. Drawing a card from a standard 52-card deck"]'::jsonb, 'C', 'There are 7 days; a random number generator from 1-7 gives each day an equal probability.',
   3, TRUE, FALSE)
ON CONFLICT (course, concept_id, question_text) DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'G7'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'G7'
GROUP BY course;

COMMIT;

-- Expected: G7 | grade_band=7 | units=5 | concepts=33 | static_questions=27