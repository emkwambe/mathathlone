-- ============================================================
-- 015_nc_grade_6_seed.sql
-- Pool: nc_grade_6 (Rising Stars) | EOG-aligned NCDPI April 2026
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('NC Grade 6 Math', 'G6', '6', 'NC', 6, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'G6'),
   'The Number System', 'G6.NS', 1),
  ((SELECT id FROM courses WHERE code = 'G6'),
   'Ratios and Proportional Relationships', 'G6.RP', 2),
  ((SELECT id FROM courses WHERE code = 'G6'),
   'Expressions and Equations', 'G6.EE', 3),
  ((SELECT id FROM courses WHERE code = 'G6'),
   'Geometry', 'G6.GEO', 4),
  ((SELECT id FROM courses WHERE code = 'G6'),
   'Statistics and Probability', 'G6.SP', 5)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.1.1', 'Add or subtract two multi-digit decimals (up to thousandths) using the standard ', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.1.2', 'Multiply two multi-digit decimals; factors have at most 4 total digits combined', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.1.3', 'Divide a multi-digit whole number by a 1- or 2-digit whole number; remainder pos', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.1.4', 'Divide a decimal by a whole number or a decimal by a decimal (tenths/hundredths ', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.2.2', 'Divide a fraction by a fraction using the invert-and-multiply algorithm; simplif', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.2.3', 'Real-world problem requiring fraction / fraction (e.g., ''How many 1/4-cup servin', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.3.1', 'Find the Greatest Common Factor of two whole numbers <= 100', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.3.2', 'Find the Least Common Multiple of two whole numbers <= 12', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.3.3', 'Given sum a + b where GCF > 1, rewrite using distributive property: e.g. 12 + 18', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.4.4', 'Compute |x| for a given rational number (integer, fraction, or decimal) includin', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.4.5', 'Given 3-5 rational numbers (mix of integers, fractions, decimals), order them fr', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.4.6', 'Given coordinates, identify the correct quadrant or ordered pair; or given a plo', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.NS.4.7', 'Find the distance between two points that share an x-coordinate or y-coordinate ', 13, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.1.3', 'Given a rate (e.g., 150 miles in 3 hours), compute the unit rate (50 miles per h', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.2.1', 'Given a ratio table with one missing entry, compute the missing equivalent ratio', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.2.3', 'Real-world ratio problem: given part-to-part or part-to-whole ratio plus one qua', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.3.2', 'Calculate p% of n (e.g., 30% of 250 = 75)', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.3.3', 'Solve percent problems: find whole given part+percent; or find percent given par', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.3.4', 'Convert between fraction, decimal, and percent -- Grade 6 level values (clean fra', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.RP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.RP.4.1', 'Convert between measurement units using ratio reasoning (e.g., feet to inches, k', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.1.1', 'Evaluate an expression with whole-number exponents (e.g., 3^2 + 4, 2^3 x 5); no va', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.1.4', 'Substitute a given integer or decimal value for the variable and evaluate the ex', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.2.1', 'Apply the distributive property to expand a(b + c) or a(b - c); whole-number coe', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.2.2', 'Simplify an expression by combining like terms (whole-number coefficients, one o', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.3.2', 'Solve x + p = q or x - p = q where p, q are non-negative integers or decimals', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.3.3', 'Solve px = q or x/p = q where p, q are positive integers; solution is rational', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.EE.5.2', 'Given a real-world context with a rate (e.g., d = 45t), write the equation relat', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.1.1', 'Compute area of a triangle given base and height using A = 1/2bh', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.1.2', 'Compute area of a parallelogram given base and height using A = bh', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.1.3', 'Compute area of a trapezoid given b1, b2, and h using A = 1/2(b1 + b2)h', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.1.4', 'Find area of a composite polygon by decomposing into triangles and rectangles', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.2.2', 'Given dimensions of a rectangular or triangular prism, compute total surface are', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.2.3', 'Compute surface area of a right square or rectangular pyramid using its net (bas', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.3.2', 'Compute volume of a rectangular prism V = lwh with whole-number edge lengths', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.3.3', 'Compute volume of a rectangular prism with fractional edge lengths (e.g., 21/2 x 3', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.4.1', 'Real-world area problem (e.g., flooring cost, garden space, painting a wall) usi', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.GEO.4.3', 'Real-world volume problem for rectangular prisms (e.g., box capacity, sand in a ', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.SP.3.1', 'Given a data set of 5-9 values, compute the mean, median, or mode as specified', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.SP.3.2', 'Given a data set or five-number summary, compute range and IQR', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.SP.3.3', 'Compute Mean Absolute Deviation for a small data set (5-7 values with clean inte', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G6.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G6')),
   'M6.SP.2.2', 'Given a sorted or unsorted data set, identify min, Q1, median, Q3, max', 4, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('M6.NS.2.1', 'M6.NS.2.1', 'G6',
   'multiple_choice', 'Which expression represents the question: ''How many 1/3-cup servings are in 2 cups ''',
   '[{"key": "A", "text": "2 x 1/3"}, {"key": "B", "text": "2 / 1/3"}, {"key": "C", "text": "1/3 / 2"}, {"key": "D", "text": "2 - 1/3"}]'::jsonb, 'B', 'Dividing the total by the serving size gives the number of servings: 2 / 1/3 = 6.',
   2, TRUE, FALSE),
  ('M6.NS.2.1', 'M6.NS.2.1', 'G6',
   'multiple_choice', 'On a number line, which model shows 3/4 / 1/4 ',
   '[{"key": "A", "text": "Starting at 0, jumping 1/4 three times"}, {"key": "B", "text": "Starting at 3/4, going back 1/4 once"}, {"key": "C", "text": "Starting at 0 and jumping 3/4 four times"}, {"key": "D", "text": "Dividing the segment from 0 to 3/4 into equal parts of 1/4 and counting them"}]'::jsonb, 'D', 'Fraction division 3/4 / 1/4 asks: how many 1/4-size pieces fit in 3/4  Answer: 3.',
   2, TRUE, FALSE),
  ('M6.NS.2.1', 'M6.NS.2.1', 'G6',
   'multiple_choice', 'A recipe calls for 1/2 cup of oil. Marcos only has a 1/8 cup measuring cup. Which expression gives the number of times he must fill it ',
   '[{"key": "A", "text": "1/2 x 1/8"}, {"key": "B", "text": "1/8 / 1/2"}, {"key": "C", "text": "1/2 / 1/8"}, {"key": "D", "text": "1/2 + 1/8"}]'::jsonb, 'C', '1/2 / 1/8 = 1/2 x 8 = 4. He fills the 1/8-cup measure 4 times.',
   2, TRUE, FALSE),
  ('M6.NS.4.1', 'M6.NS.4.1', 'G6',
   'multiple_choice', 'A city''s elevation is -48 feet. Which statement correctly interprets this value ',
   '[{"key": "A", "text": "The city is 48 feet above sea level"}, {"key": "B", "text": "The city is 48 feet below sea level"}, {"key": "C", "text": "The city is at sea level"}, {"key": "D", "text": "The city is 48 miles from the coast"}]'::jsonb, 'B', 'Negative elevation means below sea level; -48 feet means 48 feet below sea level.',
   1, TRUE, FALSE),
  ('M6.NS.4.1', 'M6.NS.4.1', 'G6',
   'multiple_choice', 'Which situation is best represented by the number +$35 ',
   '[{"key": "A", "text": "Spending $35 at a store"}, {"key": "B", "text": "Owing $35 on a bill"}, {"key": "C", "text": "Earning $35 from babysitting"}, {"key": "D", "text": "Losing $35 from a wallet"}]'::jsonb, 'C', 'Positive values represent gains or increases; earning $35 is a gain.',
   1, TRUE, FALSE),
  ('M6.NS.4.2', 'M6.NS.4.2', 'G6',
   'multiple_choice', 'What is the opposite of -15 ',
   '[{"key": "A", "text": "0"}, {"key": "B", "text": "15"}, {"key": "C", "text": "-(-15) which equals -15"}, {"key": "D", "text": "1/15"}]'::jsonb, 'B', 'The opposite of a number is its reflection over 0 on the number line. Opposite of -15 is +15.',
   1, TRUE, FALSE),
  ('M6.NS.4.2', 'M6.NS.4.2', 'G6',
   'multiple_choice', 'Which two numbers on a number line are both 7 units from zero ',
   '[{"key": "A", "text": "7 and 14"}, {"key": "B", "text": "7 and 0"}, {"key": "C", "text": "7 and -7"}, {"key": "D", "text": "0 and -7"}]'::jsonb, 'C', 'Opposites are equidistant from zero; both 7 and -7 are exactly 7 units from 0.',
   1, TRUE, FALSE),
  ('M6.RP.1.1', 'M6.RP.1.1', 'G6',
   'multiple_choice', 'A class has 12 boys and 16 girls. Which correctly expresses the ratio of boys to the total number of students ',
   '[{"key": "A", "text": "12:16"}, {"key": "B", "text": "16:12"}, {"key": "C", "text": "12:28"}, {"key": "D", "text": "28:12"}]'::jsonb, 'C', 'Ratio of boys to total = 12 : (12 + 16) = 12 : 28.',
   1, TRUE, FALSE),
  ('M6.RP.1.1', 'M6.RP.1.1', 'G6',
   'multiple_choice', 'Which of the following is NOT an equivalent way to write the ratio 3 to 5 ',
   '[{"key": "A", "text": "3:5"}, {"key": "B", "text": "3/5"}, {"key": "C", "text": "5/3"}, {"key": "D", "text": "3 to 5"}]'::jsonb, 'C', '3 to 5, 3:5, and 3/5 are all equivalent. 5/3 reverses the relationship.',
   1, TRUE, FALSE),
  ('M6.RP.1.2', 'M6.RP.1.2', 'G6',
   'multiple_choice', 'Which statement BEST defines a unit rate ',
   '[{"key": "A", "text": "A ratio that compares two quantities with the same units"}, {"key": "B", "text": "A rate with a denominator of 1"}, {"key": "C", "text": "Any fraction less than 1"}, {"key": "D", "text": "A rate that equals exactly 100"}]'::jsonb, 'B', 'A unit rate expresses the value per 1 unit of the second quantity (denominator = 1).',
   1, TRUE, FALSE),
  ('M6.RP.3.1', 'M6.RP.3.1', 'G6',
   'multiple_choice', 'Which correctly expresses 45% as a rate per 100 ',
   '[{"key": "A", "text": "45/10"}, {"key": "B", "text": "45/1000"}, {"key": "C", "text": "45/100"}, {"key": "D", "text": "4.5/100"}]'::jsonb, 'C', 'Percent means ''per hundred,'' so 45% = 45 per 100 = 45/100.',
   1, TRUE, FALSE),
  ('M6.RP.3.1', 'M6.RP.3.1', 'G6',
   'multiple_choice', 'A store says 3 out of every 100 items are returned. What percent of items are returned ',
   '[{"key": "A", "text": "0.03%"}, {"key": "B", "text": "3%"}, {"key": "C", "text": "30%"}, {"key": "D", "text": "300%"}]'::jsonb, 'B', '3 out of 100 = 3/100 = 3%.',
   1, TRUE, FALSE),
  ('M6.EE.1.3', 'M6.EE.1.3', 'G6',
   'multiple_choice', 'In the expression 5x^2 + 3x - 7, what is the coefficient of x ',
   '[{"key": "A", "text": "5"}, {"key": "B", "text": "2"}, {"key": "C", "text": "3"}, {"key": "D", "text": "-7"}]'::jsonb, 'C', 'The coefficient is the number multiplied by the variable. In 3x, the coefficient is 3.',
   1, TRUE, FALSE),
  ('M6.EE.1.3', 'M6.EE.1.3', 'G6',
   'multiple_choice', 'In the expression 4y^3, what is the exponent ',
   '[{"key": "A", "text": "4"}, {"key": "B", "text": "y"}, {"key": "C", "text": "3"}, {"key": "D", "text": "4y"}]'::jsonb, 'C', 'The exponent tells how many times the base is multiplied by itself. In y^3, the exponent is 3.',
   1, TRUE, FALSE),
  ('M6.EE.1.3', 'M6.EE.1.3', 'G6',
   'multiple_choice', 'Which of the following are like terms ',
   '[{"key": "A", "text": "3x and 3y"}, {"key": "B", "text": "5x^2 and 5x"}, {"key": "C", "text": "4ab and 7ab"}, {"key": "D", "text": "2x and 2x^2"}]'::jsonb, 'C', 'Like terms have identical variable parts. 4ab and 7ab both have the variable ab.',
   1, TRUE, FALSE),
  ('M6.EE.3.1', 'M6.EE.3.1', 'G6',
   'multiple_choice', 'Which value of x makes the equation 2x + 5 = 17 true ',
   '[{"key": "A", "text": "x = 4"}, {"key": "B", "text": "x = 6"}, {"key": "C", "text": "x = 11"}, {"key": "D", "text": "x = 7"}]'::jsonb, 'B', '2(6) + 5 = 12 + 5 = 17  . Use substitution to verify.',
   1, TRUE, FALSE),
  ('M6.EE.3.1', 'M6.EE.3.1', 'G6',
   'multiple_choice', 'Which value of n is a solution to the inequality n + 3 > 10 ',
   '[{"key": "A", "text": "n = 5"}, {"key": "B", "text": "n = 7"}, {"key": "C", "text": "n = 8"}, {"key": "D", "text": "n = 6"}]'::jsonb, 'C', '8 + 3 = 11 > 10  . Check: 5+3=8, 7+3=10 (not strictly greater), 6+3=9.',
   1, TRUE, FALSE),
  ('M6.EE.4.1', 'M6.EE.4.1', 'G6',
   'multiple_choice', 'A roller coaster has a minimum height requirement. Which inequality best represents ''riders must be at least 48 inches tall'' where h = height ',
   '[{"key": "A", "text": "h < 48"}, {"key": "B", "text": "h > 48"}, {"key": "C", "text": "h >= 48"}, {"key": "D", "text": "h <= 48"}]'::jsonb, 'C', '''At least 48'' means 48 or more, so h >= 48.',
   2, TRUE, FALSE),
  ('M6.EE.4.1', 'M6.EE.4.1', 'G6',
   'multiple_choice', 'An elevator can hold at most 2,000 pounds. If w = total weight, which inequality represents the safe load ',
   '[{"key": "A", "text": "w > 2000"}, {"key": "B", "text": "w >= 2000"}, {"key": "C", "text": "w < 2000"}, {"key": "D", "text": "w <= 2000"}]'::jsonb, 'D', '''At most 2,000'' means 2,000 or less, so w <= 2000.',
   2, TRUE, FALSE),
  ('M6.EE.5.1', 'M6.EE.5.1', 'G6',
   'multiple_choice', 'In the relationship ''total earnings depends on hours worked'', which is the independent variable ',
   '[{"key": "A", "text": "Total earnings"}, {"key": "B", "text": "Hours worked"}, {"key": "C", "text": "Hourly pay rate"}, {"key": "D", "text": "Number of days"}]'::jsonb, 'B', 'The independent variable is the input -- what you control. Hours worked determines earnings, so it is independent.',
   2, TRUE, FALSE),
  ('M6.EE.5.1', 'M6.EE.5.1', 'G6',
   'multiple_choice', 'A plant''s height (y) grows 2 cm per week (x). Which variable is dependent ',
   '[{"key": "A", "text": "Weeks (x)"}, {"key": "B", "text": "Height (y)"}, {"key": "C", "text": "Both are dependent"}, {"key": "D", "text": "Neither"}]'::jsonb, 'B', 'Height depends on the number of weeks, so height (y) is the dependent variable.',
   2, TRUE, FALSE),
  ('M6.GEO.2.1', 'M6.GEO.2.1', 'G6',
   'multiple_choice', 'Which net correctly folds into a cube ',
   '[{"key": "A", "text": "A cross shape made of 6 squares"}, {"key": "B", "text": "A row of 4 squares with 2 attached at one end"}, {"key": "C", "text": "A T-shape made of 6 squares"}, {"key": "D", "text": "All of the above"}]'::jsonb, 'D', 'There are 11 valid nets for a cube. Crosses, T-shapes, and L-shapes can all fold into cubes.',
   2, TRUE, FALSE),
  ('M6.GEO.2.1', 'M6.GEO.2.1', 'G6',
   'multiple_choice', 'A rectangular prism has 6 faces. How many pairs of congruent (identical) faces does it have ',
   '[{"key": "A", "text": "2"}, {"key": "B", "text": "3"}, {"key": "C", "text": "6"}, {"key": "D", "text": "1"}]'::jsonb, 'B', 'A rectangular prism has 3 pairs of congruent faces: top/bottom, front/back, left/right.',
   2, TRUE, FALSE),
  ('M6.GEO.3.1', 'M6.GEO.3.1', 'G6',
   'multiple_choice', 'A rectangular prism is filled with unit cubes. Each layer has 4 x 3 = 12 cubes and there are 5 layers. What is the volume ',
   '[{"key": "A", "text": "12 cubic units"}, {"key": "B", "text": "17 cubic units"}, {"key": "C", "text": "60 cubic units"}, {"key": "D", "text": "7 cubic units"}]'::jsonb, 'C', 'Volume = base area x height = 12 x 5 = 60 cubic units. This demonstrates V = Bh.',
   1, TRUE, FALSE),
  ('M6.GEO.4.2', 'M6.GEO.4.2', 'G6',
   'multiple_choice', 'Mia wants to wrap a gift box that is 10 cm x 8 cm x 5 cm. Approximately how many square centimeters of wrapping paper does she need (surface area) ',
   '[{"key": "A", "text": "400 cm^2"}, {"key": "B", "text": "340 cm^2"}, {"key": "C", "text": "300 cm^2"}, {"key": "D", "text": "160 cm^2"}]'::jsonb, 'B', 'SA = 2(10x8) + 2(10x5) + 2(8x5) = 160 + 100 + 80 = 340 cm^2.',
   2, TRUE, FALSE),
  ('M6.SP.1.1', 'M6.SP.1.1', 'G6',
   'multiple_choice', 'Which of the following is a statistical question ',
   '[{"key": "A", "text": "How many students are in Ms. Taylor''''s class today "}, {"key": "B", "text": "What is 8 x 7 "}, {"key": "C", "text": "How many minutes do 6th graders spend on homework each night "}, {"key": "D", "text": "What is the capital of North Carolina "}]'::jsonb, 'C', 'A statistical question anticipates variability across individuals -- different students will have different homework times.',
   1, TRUE, FALSE),
  ('M6.SP.1.2', 'M6.SP.1.2', 'G6',
   'multiple_choice', 'A data set shows test scores: 72, 85, 90, 68, 91, 85, 77. What makes this a data SET rather than a single data point ',
   '[{"key": "A", "text": "The values are all different"}, {"key": "B", "text": "It contains multiple values from multiple observations"}, {"key": "C", "text": "All values are greater than 50"}, {"key": "D", "text": "The values are whole numbers"}]'::jsonb, 'B', 'A data set is a collection of values gathered from multiple observations or individuals.',
   1, TRUE, FALSE),
  ('M6.SP.2.1', 'M6.SP.2.1', 'G6',
   'multiple_choice', 'Which type of display is BEST suited for showing the frequency of data grouped into intervals (e.g., ages 10-12, 13-15) ',
   '[{"key": "A", "text": "Dot plot"}, {"key": "B", "text": "Box plot"}, {"key": "C", "text": "Histogram"}, {"key": "D", "text": "Stem-and-leaf plot"}]'::jsonb, 'C', 'Histograms display data grouped into intervals (bins) with bar heights showing frequency.',
   2, TRUE, FALSE),
  ('M6.SP.4.1', 'M6.SP.4.1', 'G6',
   'multiple_choice', 'A histogram shows most data clustered on the right with a long tail to the left. This distribution is best described as:',
   '[{"key": "A", "text": "Symmetric"}, {"key": "B", "text": "Skewed right"}, {"key": "C", "text": "Skewed left"}, {"key": "D", "text": "Uniform"}]'::jsonb, 'C', 'Skewed left (negatively skewed) means most data is on the right with the tail extending to the left.',
   2, TRUE, FALSE),
  ('M6.SP.4.2', 'M6.SP.4.2', 'G6',
   'multiple_choice', 'A data set has values: 12, 14, 15, 13, 11, 14, 87. What is likely the outlier and what measure of center does it most affect ',
   '[{"key": "A", "text": "87 is an outlier; it greatly affects the mean"}, {"key": "B", "text": "87 is an outlier; it greatly affects the median"}, {"key": "C", "text": "11 is an outlier; it affects the mode"}, {"key": "D", "text": "There is no outlier"}]'::jsonb, 'A', '87 is far from the cluster 11-15; it is an outlier. Outliers have a large impact on the mean but minimal impact on the median.',
   2, TRUE, FALSE),
  ('M6.SP.5.1', 'M6.SP.5.1', 'G6',
   'multiple_choice', 'A researcher collects the ages of 150 people at a community center. Which statement about this data set is appropriate ',
   '[{"key": "A", "text": "The data has 1 observation"}, {"key": "B", "text": "The data was collected in a context where age varies among individuals"}, {"key": "C", "text": "The data has no variability"}, {"key": "D", "text": "The data can only be displayed in a bar graph"}]'::jsonb, 'B', 'Summarizing a data set in context begins by noting that the data varies across the 150 individuals surveyed.',
   2, TRUE, FALSE),
  ('M6.SP.5.2', 'M6.SP.5.2', 'G6',
   'multiple_choice', 'A data set is heavily skewed right (with a few very large values). Which measure of center BEST represents the typical value ',
   '[{"key": "A", "text": "Mean"}, {"key": "B", "text": "Median"}, {"key": "C", "text": "Mode"}, {"key": "D", "text": "Range"}]'::jsonb, 'B', 'When data is skewed, the median is less affected by extreme values than the mean and better represents the typical observation.',
   3, TRUE, FALSE),
  ('M6.SP.5.2', 'M6.SP.5.2', 'G6',
   'multiple_choice', 'A data set is symmetric and bell-shaped with no outliers. Which measure of center is MOST appropriate ',
   '[{"key": "A", "text": "Median only"}, {"key": "B", "text": "Mode only"}, {"key": "C", "text": "Mean (or median -- they are approximately equal)"}, {"key": "D", "text": "Range"}]'::jsonb, 'C', 'For symmetric distributions with no outliers, mean and median are approximately equal -- either is appropriate. The mean is often preferred.',
   3, TRUE, FALSE)
ON CONFLICT (course, concept_id, question_text) DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'G6'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'G6'
GROUP BY course;

COMMIT;