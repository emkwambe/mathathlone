-- ============================================================
-- 016_nc_grade_8_seed.sql
-- Pool: nc_grade_8 (Contenders) | EOG-aligned NCDPI April 2026
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================

BEGIN;

-- Section 1: course
INSERT INTO courses (name, code, grade_band, state, display_order, is_active) VALUES
  ('NC Grade 8 Math', 'G8', '8', 'NC', 8, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Section 2: unit_topics
INSERT INTO unit_topics (course_id, name, code, display_order) VALUES
  ((SELECT id FROM courses WHERE code = 'G8'),
   'The Real Number System', 'G8.NS', 1),
  ((SELECT id FROM courses WHERE code = 'G8'),
   'Expressions and Equations', 'G8.EE', 2),
  ((SELECT id FROM courses WHERE code = 'G8'),
   'Functions', 'G8.F', 3),
  ((SELECT id FROM courses WHERE code = 'G8'),
   'Geometry', 'G8.GEO', 4),
  ((SELECT id FROM courses WHERE code = 'G8'),
   'Statistics and Probability', 'G8.SP', 5)
ON CONFLICT (course_id, code) DO NOTHING;

-- Section 3: atomic_concepts
INSERT INTO atomic_concepts (unit_topic_id, lesson_number, name, display_order, is_generator_ready) VALUES
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.NS.2.1', 'Evaluate the square root of a perfect square (1-225) or cube root of a perfect c', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.NS.2.2', 'Solve x^2 = p for p a positive rational; express both positive and negative roots', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.NS.2.3', 'Solve x^3 = p for p a rational number (positive or negative perfect cubes)', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.NS.3.1', 'Given an irrational number (non-perfect-square root), approximate to the nearest', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.NS'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.NS.3.3', 'Given two irrational numbers, identify which is larger; may include pi compariso', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.EE.1.1', 'Simplify expressions using product rule, quotient rule, power-of-power, zero exp', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.EE.2.1', 'Solve multi-step linear equations with rational coefficients requiring distribut', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.EE.2.2', 'Solve equations with variable terms on both sides; answer is a rational number', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.EE.3.3', 'Solve a system of two linear equations using substitution; solution is an ordere', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.EE'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.EE.3.4', 'Solve a system of two linear equations using elimination (addition/subtraction o', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.F'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.F.1.4', 'Given f(x) as a linear or quadratic expression, evaluate f(a) for a specific inp', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.F'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.F.2.3', 'Given an equation, classify as linear or nonlinear; identifies presence of x^2, 1', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.F'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.F.3.2', 'Given a table of (x, y) values, write the linear equation in slope-intercept for', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.1.2', 'Given a point or triangle vertices, apply translation (h, k) and find new coordi', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.1.3', 'Given a point or shape vertices, reflect across x-axis, y-axis, or y=x', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.1.4', 'Rotate a point or shape 90deg, 180deg, or 270deg clockwise/counterclockwise about the ', 3, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.3.2', 'Apply a dilation with center at origin and scale factor k to a point or shape', 4, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.5.1', 'Given two similar figures with some sides labeled, identify corresponding side p', 5, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.5.2', 'Given two similar figures with a missing side length, set up and solve a proport', 6, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.TRANS.6.2', 'Given two angles of a triangle (some as expressions), find the third using angle', 7, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.1.2', 'Given two sides of a right triangle, find the missing side using a^2 + b^2 = c^2', 8, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.1.3', 'Real-world 2D application of Pythagorean theorem (ladder/wall, diagonal of recta', 9, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.1.4', 'Apply Pythagorean theorem in 3D (e.g., diagonal of rectangular prism, height of ', 10, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.1.5', 'Given three side lengths, determine if they form a right triangle by testing a^2 ', 11, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.2.1', 'Find the distance between two points in the coordinate plane using the distance ', 12, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.3.2', 'Compute volume of a cylinder V = pir^2h given radius and height', 13, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.3.4', 'Compute volume of a cone V = (1/3)pir^2h given radius and height', 14, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.3.6', 'Compute volume of a sphere V = (4/3)pir^3 given radius or diameter', 15, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.GEO'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.GEO.PV.4.1', 'Real-world volume problem involving one of: cylinder, cone, or sphere in context', 16, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.SP.3.1', 'Given a two-way frequency table, read joint and marginal frequencies to answer q', 1, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.SP.3.2', 'Given a two-way frequency table, compute row, column, or total relative frequenc', 2, TRUE),
  ((SELECT id FROM unit_topics
    WHERE code = 'G8.SP'
      AND course_id = (SELECT id FROM courses WHERE code = 'G8')),
   'M8.SP.2.2', 'Given the equation of a line of best fit, substitute an x-value to make a predic', 3, TRUE)
ON CONFLICT (lesson_number) DO NOTHING;

-- Section 4: static_questions
-- 5 concepts have 2 questions each (27 total across 22 concept_ids) -- all legitimate
INSERT INTO static_questions
  (concept_id, concept_name, course,
   question_type, question_text,
   options, correct_answer, explanation,
   difficulty, is_active, is_verified)
VALUES
  ('M8.NS.1.1', 'M8.NS.1.1', 'G8',
   'multiple_choice', 'Which of the following is a rational number ',
   '[{"key": "A", "text": "sqrt2"}, {"key": "B", "text": "pi"}, {"key": "C", "text": "0.333..."}, {"key": "D", "text": "sqrt5"}]'::jsonb, 'C', '0.333... = 1/3, which is a ratio of two integers -- rational. The others are irrational.',
   1, TRUE, FALSE),
  ('M8.NS.1.2', 'M8.NS.1.2', 'G8',
   'multiple_choice', 'Which statement BEST defines an irrational number ',
   '[{"key": "A", "text": "A number that cannot be written as a fraction"}, {"key": "B", "text": "A number that cannot be expressed as a ratio of two integers and has a non-terminating, non-repeating decimal expansion"}, {"key": "C", "text": "Any negative number"}, {"key": "D", "text": "A number with an infinite decimal expansion"}]'::jsonb, 'B', 'Irrational numbers have non-terminating, non-repeating decimals and cannot be expressed as p/q where p, q are integers and q != 0.',
   1, TRUE, FALSE),
  ('M8.NS.1.2', 'M8.NS.1.2', 'G8',
   'multiple_choice', 'Which of the following is irrational ',
   '[{"key": "A", "text": "4/9"}, {"key": "B", "text": "sqrt16"}, {"key": "C", "text": "0.75"}, {"key": "D", "text": "sqrt7"}]'::jsonb, 'D', 'sqrt7 ~= 2.6457... -- non-terminating, non-repeating. The others simplify to rational numbers.',
   1, TRUE, FALSE),
  ('M8.NS.1.3', 'M8.NS.1.3', 'G8',
   'multiple_choice', 'Which set correctly classifies all three numbers: -7, sqrt9, and pi ',
   '[{"key": "A", "text": "All rational"}, {"key": "B", "text": "All irrational"}, {"key": "C", "text": "-7 and sqrt9 are rational; pi is irrational"}, {"key": "D", "text": "-7 is rational; sqrt9 and pi are irrational"}]'::jsonb, 'C', '-7 = -7/1 (rational); sqrt9 = 3 (rational); pi ~= 3.14159... (irrational).',
   2, TRUE, FALSE),
  ('M8.EE.2.3', 'M8.EE.2.3', 'G8',
   'multiple_choice', 'Which equation has NO solution ',
   '[{"key": "A", "text": "2x + 3 = 2x + 5"}, {"key": "B", "text": "3x + 1 = 3x + 1"}, {"key": "C", "text": "2x + 4 = 6"}, {"key": "D", "text": "x + 2 = 2 + x -- wait, re-read options"}]'::jsonb, 'A', '2x + 3 = 2x + 5 simplifies to 3 = 5, a false statement -- no solution.',
   2, TRUE, FALSE),
  ('M8.EE.2.3', 'M8.EE.2.3', 'G8',
   'multiple_choice', 'Which equation has INFINITELY MANY solutions ',
   '[{"key": "A", "text": "4x + 2 = 4x + 5"}, {"key": "B", "text": "3(x + 2) = 3x + 6"}, {"key": "C", "text": "2x + 1 = 3x + 1"}, {"key": "D", "text": "5x - 3 = 5x + 3"}]'::jsonb, 'B', '3(x + 2) = 3x + 6 simplifies to 3x + 6 = 3x + 6, a true statement for all x -- infinitely many solutions.',
   2, TRUE, FALSE),
  ('M8.EE.3.1', 'M8.EE.3.1', 'G8',
   'multiple_choice', 'On a graph of a system of two linear equations, if the lines are parallel and distinct, the system has:',
   '[{"key": "A", "text": "Exactly one solution"}, {"key": "B", "text": "No solution"}, {"key": "C", "text": "Infinitely many solutions"}, {"key": "D", "text": "Two solutions"}]'::jsonb, 'B', 'Parallel lines never intersect, so there is no point that satisfies both equations.',
   2, TRUE, FALSE),
  ('M8.EE.3.1', 'M8.EE.3.1', 'G8',
   'multiple_choice', 'If the graph of a system shows two lines that are identical (overlapping), the system has:',
   '[{"key": "A", "text": "Exactly one solution"}, {"key": "B", "text": "No solution"}, {"key": "C", "text": "Infinitely many solutions"}, {"key": "D", "text": "No real solutions"}]'::jsonb, 'C', 'Coincident lines share every point -- infinitely many solutions.',
   2, TRUE, FALSE),
  ('M8.EE.3.5', 'M8.EE.3.5', 'G8',
   'multiple_choice', 'Given the system: y = 3x + 2 and y = 3x - 4. What type of solution does this system have ',
   '[{"key": "A", "text": "One solution"}, {"key": "B", "text": "No solution"}, {"key": "C", "text": "Infinitely many solutions"}, {"key": "D", "text": "Two solutions"}]'::jsonb, 'B', 'Same slope (3), different y-intercepts -- parallel lines -- no solution.',
   2, TRUE, FALSE),
  ('M8.F.1.1', 'M8.F.1.1', 'G8',
   'multiple_choice', 'Which set of ordered pairs represents a function ',
   '[{"key": "A", "text": "{(1,2), (2,3), (1,4)}"}, {"key": "B", "text": "{(3,5), (4,5), (5,5)}"}, {"key": "C", "text": "{(2,7), (2,8), (2,9)}"}, {"key": "D", "text": "{(0,1), (1,0), (0,-1)}"}]'::jsonb, 'B', 'In B, each input (3, 4, 5) maps to exactly one output. The same output (5) is allowed; the same input with different outputs is not.',
   1, TRUE, FALSE),
  ('M8.F.1.1', 'M8.F.1.1', 'G8',
   'multiple_choice', 'Which statement BEST describes why a vertical line test determines if a graph represents a function ',
   '[{"key": "A", "text": "A vertical line can only cross a function once because functions have unique outputs for each input"}, {"key": "B", "text": "Functions must be straight lines"}, {"key": "C", "text": "Vertical lines test for slope"}, {"key": "D", "text": "A function must pass through the origin"}]'::jsonb, 'A', 'If a vertical line crosses the graph more than once, one x-value maps to multiple y-values -- not a function.',
   2, TRUE, FALSE),
  ('M8.F.2.1', 'M8.F.2.1', 'G8',
   'multiple_choice', 'Which of the following BEST describes a linear function ',
   '[{"key": "A", "text": "A function whose graph curves"}, {"key": "B", "text": "A function with a constant rate of change represented by a straight line"}, {"key": "C", "text": "A function that always passes through the origin"}, {"key": "D", "text": "A function with a positive slope"}]'::jsonb, 'B', 'Linear functions have a constant rate of change (slope) and produce a straight-line graph.',
   1, TRUE, FALSE),
  ('M8.F.3.1', 'M8.F.3.1', 'G8',
   'multiple_choice', 'Function A is represented by the equation y = 2x + 1. Function B is represented by the table: x: 0,1,2,3 | y: 5,8,11,14. Which function has a greater rate of change ',
   '[{"key": "A", "text": "Function A (slope 2)"}, {"key": "B", "text": "Function B (slope 3)"}, {"key": "C", "text": "They have equal rates of change"}, {"key": "D", "text": "Cannot be determined"}]'::jsonb, 'B', 'Function B: (14-5)/(3-0) = 9/3 = 3, which is greater than Function A''s slope of 2.',
   2, TRUE, FALSE),
  ('M8.F.3.3', 'M8.F.3.3', 'G8',
   'multiple_choice', 'A linear model for a ride-share trip is C = 0.85m + 3.50 where C is cost and m is miles. What does the value 3.50 represent ',
   '[{"key": "A", "text": "The cost per mile"}, {"key": "B", "text": "The total cost of the trip"}, {"key": "C", "text": "The flat fee charged at the start of every trip"}, {"key": "D", "text": "The number of miles traveled"}]'::jsonb, 'C', 'The y-intercept (3.50) is the value of C when m = 0 -- the base/flat fee before any miles are traveled.',
   3, TRUE, FALSE),
  ('M8.F.3.3', 'M8.F.3.3', 'G8',
   'multiple_choice', 'Using the same model C = 0.85m + 3.50, what does the value 0.85 represent ',
   '[{"key": "A", "text": "The total trip cost"}, {"key": "B", "text": "The starting fee"}, {"key": "C", "text": "The additional cost charged for each mile driven"}, {"key": "D", "text": "The maximum distance allowed"}]'::jsonb, 'C', 'The slope (0.85) is the rate of change -- cost increases by $0.85 for each additional mile.',
   3, TRUE, FALSE),
  ('M8.F.4.1', 'M8.F.4.1', 'G8',
   'multiple_choice', 'A graph shows a person''s distance from home over time. The graph starts at 0, increases steeply, levels off, then decreases back to 0. Which qualitative description BEST matches ',
   '[{"key": "A", "text": "The person walks fast, stops, then returns home"}, {"key": "B", "text": "The person stays home the whole time"}, {"key": "C", "text": "The person walks at a constant pace with no stops"}, {"key": "D", "text": "The person''''s speed increases continuously"}]'::jsonb, 'A', 'Steep increase = fast walking away, flat section = stopped, decrease back to 0 = returning home.',
   2, TRUE, FALSE),
  ('M8.GEO.TRANS.1.1', 'M8.GEO.TRANS.1.1', 'G8',
   'multiple_choice', 'Which of the following is NOT preserved under a rigid transformation ',
   '[{"key": "A", "text": "Angle measures"}, {"key": "B", "text": "Side lengths"}, {"key": "C", "text": "Shape"}, {"key": "D", "text": "Size of the entire figure after dilation"}]'::jsonb, 'D', 'Rigid transformations (translation, reflection, rotation) preserve distance and angle measures. Dilation changes size -- but dilation is NOT a rigid transformation.',
   1, TRUE, FALSE),
  ('M8.GEO.TRANS.2.1', 'M8.GEO.TRANS.2.1', 'G8',
   'multiple_choice', 'Which statement BEST defines congruent figures ',
   '[{"key": "A", "text": "Figures that have the same shape but different sizes"}, {"key": "B", "text": "Figures that can be mapped onto each other using only dilations"}, {"key": "C", "text": "Figures that can be mapped onto each other by a sequence of rigid transformations"}, {"key": "D", "text": "Figures that have the same area"}]'::jsonb, 'C', 'Congruent figures have identical size and shape; one can be mapped to the other through translations, reflections, and/or rotations.',
   2, TRUE, FALSE),
  ('M8.GEO.TRANS.3.1', 'M8.GEO.TRANS.3.1', 'G8',
   'multiple_choice', 'A dilation with scale factor k = 0.5 centered at the origin will:',
   '[{"key": "A", "text": "Enlarge the figure by 50%"}, {"key": "B", "text": "Reduce the figure to half its original size"}, {"key": "C", "text": "Reflect the figure over the x-axis"}, {"key": "D", "text": "Rotate the figure 90deg"}]'::jsonb, 'B', 'Scale factor k < 1 shrinks the figure; k = 0.5 reduces each coordinate to half.',
   1, TRUE, FALSE),
  ('M8.GEO.TRANS.4.1', 'M8.GEO.TRANS.4.1', 'G8',
   'multiple_choice', 'Which sequence of transformations would prove two figures are SIMILAR (but NOT necessarily congruent) ',
   '[{"key": "A", "text": "Two reflections only"}, {"key": "B", "text": "A translation followed by a rotation"}, {"key": "C", "text": "A dilation followed by a reflection"}, {"key": "D", "text": "A translation followed by another translation"}]'::jsonb, 'C', 'Similarity requires a dilation (plus any rigid motions). Rigid motions alone produce congruence, not merely similarity.',
   2, TRUE, FALSE),
  ('M8.GEO.PV.1.1', 'M8.GEO.PV.1.1', 'G8',
   'multiple_choice', 'In a right triangle, the side opposite the right angle is called the:',
   '[{"key": "A", "text": "Leg"}, {"key": "B", "text": "Base"}, {"key": "C", "text": "Hypotenuse"}, {"key": "D", "text": "Altitude"}]'::jsonb, 'C', 'The hypotenuse is always opposite the right angle and is the longest side of a right triangle.',
   1, TRUE, FALSE),
  ('M8.GEO.PV.3.1', 'M8.GEO.PV.3.1', 'G8',
   'multiple_choice', 'Which formula correctly gives the volume of a cylinder with radius r and height h ',
   '[{"key": "A", "text": "V = pirh"}, {"key": "B", "text": "V = 2pir^2h"}, {"key": "C", "text": "V = pir^2h"}, {"key": "D", "text": "V = (4/3)pir^2h"}]'::jsonb, 'C', 'Volume of a cylinder = base area x height = pir^2 x h.',
   1, TRUE, FALSE),
  ('M8.GEO.PV.3.3', 'M8.GEO.PV.3.3', 'G8',
   'multiple_choice', 'A cone and a cylinder have the same base radius and height. How does the volume of the cone compare to the volume of the cylinder ',
   '[{"key": "A", "text": "The cone has the same volume"}, {"key": "B", "text": "The cone has twice the volume"}, {"key": "C", "text": "The cone has one-third the volume"}, {"key": "D", "text": "The cone has half the volume"}]'::jsonb, 'C', 'V_cone = (1/3)pir^2h = (1/3) x V_cylinder',
   1, TRUE, FALSE),
  ('M8.GEO.PV.3.5', 'M8.GEO.PV.3.5', 'G8',
   'multiple_choice', 'Which formula gives the volume of a sphere with radius r ',
   '[{"key": "A", "text": "V = pir^3"}, {"key": "B", "text": "V = (4/3)pir^3"}, {"key": "C", "text": "V = 4pir^2"}, {"key": "D", "text": "V = (2/3)pir^3"}]'::jsonb, 'B', 'Volume of a sphere = (4/3)pir^3',
   1, TRUE, FALSE),
  ('M8.SP.1.2', 'M8.SP.1.2', 'G8',
   'multiple_choice', 'A scatter plot shows that as study time increases, test scores also increase. This is an example of a:',
   '[{"key": "A", "text": "Negative association"}, {"key": "B", "text": "No association"}, {"key": "C", "text": "Positive association"}, {"key": "D", "text": "Nonlinear association"}]'::jsonb, 'C', 'When both variables increase together, the association is positive.',
   2, TRUE, FALSE),
  ('M8.SP.2.1', 'M8.SP.2.1', 'G8',
   'multiple_choice', 'A line of best fit is drawn on a scatter plot. Which statement BEST describes what this line represents ',
   '[{"key": "A", "text": "A line connecting all the data points"}, {"key": "B", "text": "A line that models the general trend of the data"}, {"key": "C", "text": "A line that only goes through the highest and lowest data points"}, {"key": "D", "text": "A line with a slope of exactly 1"}]'::jsonb, 'B', 'A line of best fit (trend line) captures the general direction and magnitude of the data''s linear trend.',
   2, TRUE, FALSE),
  ('M8.SP.2.3', 'M8.SP.2.3', 'G8',
   'multiple_choice', 'A model predicts test score (y) from study hours (x): y = 8x + 45. What does the y-intercept 45 represent ',
   '[{"key": "A", "text": "Score improves by 45 points per hour"}, {"key": "B", "text": "A student who studies 0 hours is predicted to score 45"}, {"key": "C", "text": "Maximum possible score"}, {"key": "D", "text": "Average score across all students"}]'::jsonb, 'B', 'The y-intercept is the predicted value of y when x = 0 -- the baseline score with no study time.',
   3, TRUE, FALSE)
ON CONFLICT (course, concept_id, question_text) DO NOTHING;

-- Section 5: Verify
SELECT c.code, c.grade_band,
       COUNT(DISTINCT ut.id) AS units,
       COUNT(DISTINCT ac.id) AS concepts
FROM courses c
JOIN unit_topics ut ON ut.course_id = c.id
JOIN atomic_concepts ac ON ac.unit_topic_id = ut.id
WHERE c.code = 'G8'
GROUP BY c.code, c.grade_band;

SELECT course, COUNT(*) AS static_questions
FROM static_questions WHERE course = 'G8'
GROUP BY course;

COMMIT;