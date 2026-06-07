// =============================================================================
// MathAthlone Question Generator System - COMPLETE NC MATH 1
// =============================================================================
// ALL 67 generator-capable concepts for NC Math 1
// Organized by unit topic with difficulty scaling
// =============================================================================

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type AnswerType =
  | 'integer'
  | 'decimal'
  | 'fraction'
  | 'ordered_pair'
  | 'integer_pair'
  | 'expression'
  | 'equation'
  | 'inequality'
  | 'interval'
  | 'number_or_fraction'  // accepts integer / decimal / fraction equivalently —
                          // used when the answer COULD be any of those forms,
                          // so the format hint can't narrow the answer space.
  | 'text'
  | 'MC'
  | 'multiple_choice'
  // Multi-shape answer types — used by pools where a single generator may
  // produce answers in more than one canonical form. Validation accepts any
  // of the named forms.
  | 'decimal_or_fraction'
  | 'decimal_or_integer'
  | 'integer_or_fraction'
  | 'integer_or_MC'
  | 'integer_or_text'
  | 'text_or_fraction'
  | 'decimal_or_fraction_or_percent'
  | 'percent'
  | 'decimal_or_text'
  | 'fraction_or_decimal'
  | 'integer_or_decimal';

// =============================================================================
// ANSWER FORMAT HINTS
// =============================================================================
// Single shared map of answer_type → student-facing format hint. Consumed by
// the in-game question UI (CompetitionView, index.tsx). Empty string means
// "no hint" — used for MC-style questions where the student picks a button.
//
// Display convention at the call sites: "📝 Format: <hint>" — only render
// the line when the hint is non-empty.
// =============================================================================

export const ANSWER_TYPE_HINTS: Record<AnswerType, string> = {
  integer:                          'Enter a whole number, e.g. 42',
  decimal:                          'Enter a decimal number, e.g. 3.14',
  fraction:                         'Enter as a/b, e.g. 3/4',
  ordered_pair:                     'Enter as (x, y), e.g. (2, -11)',
  integer_pair:                     'Enter as {a, b}, e.g. {3, 5}',
  expression:                       'Simplify fully, e.g. 3x + 2',
  equation:                         'Enter as y = mx + b, e.g. y = 2x + 3',
  inequality:                       'Enter as x > 3 or x ≤ -1',
  interval:                         'Enter as interval, e.g. (2, ∞) or [-3, 5)',
  number_or_fraction:               'Enter a number or fraction, e.g. 5 or 3/4',
  text:                             '',
  MC:                               '',
  multiple_choice:                  '',
  decimal_or_fraction:              'Enter a decimal or fraction, e.g. 0.75 or 3/4',
  decimal_or_integer:               'Enter a whole number or decimal, e.g. 4 or 3.5',
  integer_or_fraction:              'Enter a whole number or fraction, e.g. 6 or 5/3',
  integer_or_decimal:               'Enter a whole number or decimal, e.g. 4 or 2.5',
  decimal_or_fraction_or_percent:   'Enter a decimal, fraction, or percent, e.g. 0.5 or 1/2 or 50%',
  percent:                          'Enter as a percent with %, e.g. 25%',
  decimal_or_text:                  'Enter a number or short answer',
  integer_or_text:                  'Enter a number or short answer',
  text_or_fraction:                 'Enter a short answer or fraction',
  integer_or_MC:                    'Enter a whole number or select A/B/C/D',
  // Semantic synonym of decimal_or_fraction — give it the same hint.
  fraction_or_decimal:              'Enter a decimal or fraction, e.g. 0.75 or 3/4',
};

/**
 * Resolve a raw answer_type string (from heat_questions.answer_type) to a
 * student-facing hint. Returns '' for unknown types so callers can
 * conditionally render the hint line.
 */
export function hintForAnswerType(answerType: string | null | undefined): string {
  if (!answerType) return '';
  return ANSWER_TYPE_HINTS[answerType as AnswerType] ?? '';
}

export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface GeneratedQuestion {
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: AnswerType;
  solution_steps: string[];
  difficulty: DifficultyLevel;
  concept_id: string;
  generator_type: string;
  /**
   * External-tooling aliases. The pipeline (question-delivery,
   * heat_questions schema) uses `correct_answer` / `question_text` —
   * those remain canonical. `answer` and `question` are duplicate-
   * value mirrors so test scripts, REPLs, and curriculum-evaluator
   * tools that read the friendlier names get the value instead of
   * `undefined`. g7Wrap (and a backfill loop in GENERATORS init)
   * populates them on every generator output.
   */
  answer?: string;
  question?: string;
}

// -----------------------------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZeroInt(min: number, max: number): number {
  let n = 0;
  while (n === 0) {
    n = randomInt(min, max);
  }
  return n;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function simplifyFraction(num: number, den: number): [number, number] {
  if (den === 0) return [num, den];
  const divisor = gcd(num, den);
  let sNum = num / divisor;
  let sDen = den / divisor;
  if (sDen < 0) { sNum = -sNum; sDen = -sDen; }
  return [sNum, sDen];
}

function formatCoef(c: number, isFirst: boolean = false, showOne: boolean = false): string {
  if (c === 0) return '';
  if (c === 1 && !showOne) return isFirst ? '' : '+ ';
  if (c === -1 && !showOne) return isFirst ? '-' : '- ';
  if (c > 0) return isFirst ? `${c}` : `+ ${c}`;
  return isFirst ? `${c}` : `- ${Math.abs(c)}`;
}

function formatConst(c: number): string {
  if (c === 0) return '';
  if (c > 0) return `+ ${c}`;
  return `- ${Math.abs(c)}`;
}

function formatSign(c: number): string {
  return c >= 0 ? '+' : '-';
}

// =============================================================================
// CATEGORY 1: EQUATIONS & EXPRESSIONS (14 generators)
// =============================================================================

// 1. M1.EQN.1.2 - Evaluating Algebraic Expressions
export function generate_evaluate_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const configs = {
    1: { vars: 1, range: [1, 5], ops: ['+', '-'] },
    2: { vars: 1, range: [1, 10], ops: ['+', '-', '*'] },
    3: { vars: 2, range: [-5, 10], ops: ['+', '-', '*'] },
    4: { vars: 2, range: [-10, 10], ops: ['+', '-', '*', '/'] },
  };
  const cfg = configs[difficulty];
  
  const x = randomInt(cfg.range[0], cfg.range[1]);
  const a = randomNonZeroInt(2, 6);
  const b = randomInt(-10, 10);
  
  const result = a * x + b;
  const signB = b >= 0 ? '+' : '-';
  
  return {
    question_latex: `\\text{Evaluate } ${a}x ${signB} ${Math.abs(b)} \\text{ when } x = ${x}`,
    question_text: `Evaluate ${a}x ${signB} ${Math.abs(b)} when x = ${x}`,
    correct_answer: String(result),
    answer_type: 'integer',
    solution_steps: [
      `Substitute x = ${x}`,
      `${a}(${x}) ${signB} ${Math.abs(b)}`,
      `${a * x} ${signB} ${Math.abs(b)}`,
      `= ${result}`
    ],
    difficulty,
    concept_id: 'M1.EQN.1.2',
    generator_type: 'evaluate_expression',
  };
}

// 2. M1.EQN.1.3 - Simplifying Expressions
export function generate_simplify_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const a1 = randomInt(1, 5);
  const a2 = randomInt(1, 5);
  const b1 = randomInt(-8, 8);
  const b2 = randomInt(-8, 8);
  
  const aSum = a1 + a2;
  const bSum = b1 + b2;
  
  const expr1 = `${a1}x ${formatConst(b1)}`;
  const expr2 = `${a2}x ${formatConst(b2)}`;
  
  let answer = '';
  if (aSum !== 0) answer += `${aSum}x`;
  if (bSum !== 0) answer += (aSum !== 0 ? formatConst(bSum) : String(bSum));
  if (answer === '') answer = '0';
  
  return {
    question_latex: `\\text{Simplify: } (${expr1}) + (${expr2})`,
    question_text: `Simplify: (${expr1}) + (${expr2})`,
    correct_answer: answer.trim(),
    answer_type: 'expression',
    solution_steps: [
      `Combine like terms`,
      `x terms: ${a1}x + ${a2}x = ${aSum}x`,
      `Constants: ${b1} + ${b2} = ${bSum}`,
      `= ${answer}`
    ],
    difficulty,
    concept_id: 'M1.EQN.1.3',
    generator_type: 'simplify_expression',
  };
}

// 3. M1.EQN.2.2 - One-Step Equations (Add/Sub)
export function generate_linear_eq_one_step_add(difficulty: DifficultyLevel): GeneratedQuestion {
  const ranges = { 1: [1, 10], 2: [-10, 15], 3: [-20, 20], 4: [-30, 30] };
  const [min, max] = ranges[difficulty];
  
  const x = randomInt(min, max);
  const b = randomNonZeroInt(min, max);
  const c = x + b;
  
  const sign = b > 0 ? '+' : '-';
  const absB = Math.abs(b);
  
  return {
    question_latex: `x ${sign} ${absB} = ${c}`,
    question_text: `Solve for x: x ${sign} ${absB} = ${c}`,
    correct_answer: String(x),
    answer_type: 'integer',
    solution_steps: [
      `x ${sign} ${absB} = ${c}`,
      b > 0 ? `x = ${c} - ${absB}` : `x = ${c} + ${absB}`,
      `x = ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.2.2',
    generator_type: 'linear_eq_one_step_add',
  };
}

// 4. M1.EQN.2.3 - One-Step Equations (Mult/Div)
export function generate_linear_eq_one_step_mult(difficulty: DifficultyLevel): GeneratedQuestion {
  const ranges = { 1: [2, 5], 2: [2, 10], 3: [-10, 10], 4: [-12, 12] };
  const [min, max] = ranges[difficulty];
  
  const a = randomNonZeroInt(min, max);
  const x = randomInt(-10, 10);
  const c = a * x;
  
  return {
    question_latex: `${a}x = ${c}`,
    question_text: `Solve for x: ${a}x = ${c}`,
    correct_answer: String(x),
    answer_type: 'integer',
    solution_steps: [`${a}x = ${c}`, `x = ${c} ÷ ${a}`, `x = ${x}`],
    difficulty,
    concept_id: 'M1.EQN.2.3',
    generator_type: 'linear_eq_one_step_mult',
  };
}

// 5. M1.EQN.2.4 - Two-Step Equations
export function generate_linear_eq_two_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const configs = {
    1: { coef: [2, 5], const: [1, 10], ans: [1, 10] },
    2: { coef: [2, 10], const: [-15, 15], ans: [-10, 10] },
    3: { coef: [-10, 10], const: [-20, 20], ans: [-15, 15] },
    4: { coef: [-15, 15], const: [-30, 30], ans: [-20, 20] },
  };
  const cfg = configs[difficulty];
  
  const a = randomNonZeroInt(cfg.coef[0], cfg.coef[1]);
  const x = randomInt(cfg.ans[0], cfg.ans[1]);
  const b = randomNonZeroInt(cfg.const[0], cfg.const[1]);
  const c = a * x + b;
  
  const sign = b > 0 ? '+' : '-';
  const absB = Math.abs(b);
  
  return {
    question_latex: `${a}x ${sign} ${absB} = ${c}`,
    question_text: `Solve for x: ${a}x ${sign} ${absB} = ${c}`,
    correct_answer: String(x),
    answer_type: 'integer',
    solution_steps: [
      `${a}x ${sign} ${absB} = ${c}`,
      `${a}x = ${c - b}`,
      `x = ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.2.4',
    generator_type: 'linear_eq_two_step',
  };
}

// 6. M1.EQN.2.5 - Multi-Step Equations
export function generate_linear_eq_multi_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(2, 5);
  const b = randomInt(-5, 5);
  const c = randomInt(-10, 10);
  const x = randomInt(-8, 8);
  const result = a * (x + b) + c;
  
  const innerSign = b >= 0 ? '+' : '-';
  const outerSign = c >= 0 ? '+' : '-';
  
  return {
    question_latex: `${a}(x ${innerSign} ${Math.abs(b)}) ${outerSign} ${Math.abs(c)} = ${result}`,
    question_text: `Solve for x: ${a}(x ${innerSign} ${Math.abs(b)}) ${outerSign} ${Math.abs(c)} = ${result}`,
    correct_answer: String(x),
    answer_type: 'integer',
    solution_steps: [
      `Distribute: ${a}x ${formatConst(a * b)} ${outerSign} ${Math.abs(c)} = ${result}`,
      `Combine: ${a}x ${formatConst(a * b + c)} = ${result}`,
      `${a}x = ${result - (a * b + c)}`,
      `x = ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.2.5',
    generator_type: 'linear_eq_multi_step',
  };
}

// 7. M1.EQN.2.6 - Variables on Both Sides
export function generate_linear_eq_both_sides(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomNonZeroInt(-8, 8);
  let a = randomNonZeroInt(3, 8);
  let c = randomNonZeroInt(1, a - 1);
  if (a <= c) [a, c] = [c + 1, a];
  
  const b = randomInt(-10, 10);
  const d = a * x + b - c * x;
  
  return {
    question_latex: `${a}x ${formatConst(b)} = ${c}x ${formatConst(d)}`,
    question_text: `Solve for x: ${a}x ${formatConst(b)} = ${c}x ${formatConst(d)}`,
    correct_answer: String(x),
    answer_type: 'integer',
    solution_steps: [
      `Subtract ${c}x from both sides`,
      `${a - c}x ${formatConst(b)} = ${d}`,
      `${a - c}x = ${d - b}`,
      `x = ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.2.6',
    generator_type: 'linear_eq_both_sides',
  };
}

// 8. M1.EQN.3.1 - Absolute Value Equations
export function generate_abs_value_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(-8, 8);
  const b = randomInt(1, 10);
  
  // |x + a| = b has solutions x = -a + b and x = -a - b
  const sol1 = -a + b;
  const sol2 = -a - b;
  const solutions = [Math.min(sol1, sol2), Math.max(sol1, sol2)];
  
  const sign = a >= 0 ? '+' : '-';
  
  return {
    question_latex: `|x ${sign} ${Math.abs(a)}| = ${b}`,
    question_text: `Solve: |x ${sign} ${Math.abs(a)}| = ${b}`,
    correct_answer: `{${solutions[0]}, ${solutions[1]}}`,
    answer_type: 'integer_pair',
    solution_steps: [
      `|x ${sign} ${Math.abs(a)}| = ${b}`,
      `Case 1: x ${sign} ${Math.abs(a)} = ${b} → x = ${sol1}`,
      `Case 2: x ${sign} ${Math.abs(a)} = -${b} → x = ${sol2}`,
      `Solutions: {${solutions[0]}, ${solutions[1]}}`
    ],
    difficulty,
    concept_id: 'M1.EQN.3.1',
    generator_type: 'abs_value_equation',
  };
}

// 9. M1.EQN.4.1 - Literal Equations
export function generate_literal_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const formulas = [
    { eq: 'A = lw', solve: 'w', answer: 'w = A/l', steps: ['A = lw', 'A/l = w', 'w = A/l'] },
    { eq: 'd = rt', solve: 't', answer: 't = d/r', steps: ['d = rt', 'd/r = t', 't = d/r'] },
    { eq: 'P = 2l + 2w', solve: 'w', answer: 'w = (P - 2l)/2', steps: ['P = 2l + 2w', 'P - 2l = 2w', '(P - 2l)/2 = w'] },
    { eq: 'y = mx + b', solve: 'x', answer: 'x = (y - b)/m', steps: ['y = mx + b', 'y - b = mx', '(y - b)/m = x'] },
  ];
  
  const formula = formulas[randomInt(0, formulas.length - 1)];
  
  return {
    question_latex: `\\text{Solve } ${formula.eq} \\text{ for } ${formula.solve}`,
    question_text: `Solve ${formula.eq} for ${formula.solve}`,
    correct_answer: formula.answer,
    answer_type: 'equation',
    solution_steps: formula.steps,
    difficulty,
    concept_id: 'M1.EQN.4.1',
    generator_type: 'literal_equation',
  };
}

// 10. M1.EQN.5.2 - One-Step Inequalities (Add/Sub)
export function generate_inequality_one_step_add(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-10, 10);
  const b = randomNonZeroInt(-10, 10);
  const c = x + b;
  const ops = ['<', '>', '≤', '≥'];
  const op = ops[randomInt(0, 3)];
  
  const sign = b > 0 ? '+' : '-';
  const invOp = b > 0 ? '-' : '+';
  
  return {
    question_latex: `x ${sign} ${Math.abs(b)} ${op} ${c}`,
    question_text: `Solve: x ${sign} ${Math.abs(b)} ${op} ${c}`,
    correct_answer: `x ${op} ${x}`,
    answer_type: 'inequality',
    solution_steps: [
      `x ${sign} ${Math.abs(b)} ${op} ${c}`,
      `x ${op} ${c} ${invOp} ${Math.abs(b)}`,
      `x ${op} ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.5.2',
    generator_type: 'inequality_one_step_add',
  };
}

// 11. M1.EQN.5.3 - One-Step Inequalities (Mult/Div)
export function generate_inequality_one_step_mult(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = difficulty >= 3 ? randomNonZeroInt(-8, 8) : randomNonZeroInt(2, 8);
  const x = randomInt(-10, 10);
  const c = a * x;
  const ops = ['<', '>', '≤', '≥'];
  const op = ops[randomInt(0, 3)];
  
  // Flip inequality if dividing by negative
  const flipOps: Record<string, string> = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  const resultOp = a < 0 ? flipOps[op] : op;
  
  return {
    question_latex: `${a}x ${op} ${c}`,
    question_text: `Solve: ${a}x ${op} ${c}`,
    correct_answer: `x ${resultOp} ${x}`,
    answer_type: 'inequality',
    solution_steps: [
      `${a}x ${op} ${c}`,
      `Divide both sides by ${a}`,
      a < 0 ? `(flip inequality when dividing by negative)` : '',
      `x ${resultOp} ${x}`
    ].filter(s => s),
    difficulty,
    concept_id: 'M1.EQN.5.3',
    generator_type: 'inequality_one_step_mult',
  };
}

// 12. M1.EQN.5.4 - Multi-Step Inequalities
export function generate_inequality_multi_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(2, 6);
  const b = randomInt(-10, 10);
  const x = randomInt(-8, 8);
  const c = a * x + b;
  const op = ['<', '>', '≤', '≥'][randomInt(0, 3)];
  
  return {
    question_latex: `${a}x ${formatConst(b)} ${op} ${c}`,
    question_text: `Solve: ${a}x ${formatConst(b)} ${op} ${c}`,
    correct_answer: `x ${op} ${x}`,
    answer_type: 'inequality',
    solution_steps: [
      `${a}x ${formatConst(b)} ${op} ${c}`,
      `${a}x ${op} ${c - b}`,
      `x ${op} ${x}`
    ],
    difficulty,
    concept_id: 'M1.EQN.5.4',
    generator_type: 'inequality_multi_step',
  };
}

// 13. M1.EQN.5.5 - Compound Inequalities
export function generate_compound_inequality(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(-5, 0);
  const b = randomInt(1, 8);
  const c = randomInt(a + 1, b - 1);
  
  // a < x + c < b  →  a - c < x < b - c
  const left = a - c;
  const right = b - c;
  
  return {
    question_latex: `${a} < x + ${c} < ${b}`,
    question_text: `Solve: ${a} < x + ${c} < ${b}`,
    correct_answer: `(${left}, ${right})`,
    answer_type: 'interval',
    solution_steps: [
      `${a} < x + ${c} < ${b}`,
      `Subtract ${c} from all parts`,
      `${left} < x < ${right}`,
      `Interval: (${left}, ${right})`
    ],
    difficulty,
    concept_id: 'M1.EQN.5.5',
    generator_type: 'compound_inequality',
  };
}

// 14. M1.EQN.5.6 - Absolute Value Inequalities
export function generate_abs_value_inequality(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(-5, 5);
  const b = randomInt(2, 8);
  
  // |x + a| < b  →  -b < x + a < b  →  -b - a < x < b - a
  const left = -b - a;
  const right = b - a;
  
  const sign = a >= 0 ? '+' : '-';
  
  return {
    question_latex: `|x ${sign} ${Math.abs(a)}| < ${b}`,
    question_text: `Solve: |x ${sign} ${Math.abs(a)}| < ${b}`,
    correct_answer: `(${left}, ${right})`,
    answer_type: 'interval',
    solution_steps: [
      `|x ${sign} ${Math.abs(a)}| < ${b}`,
      `-${b} < x ${sign} ${Math.abs(a)} < ${b}`,
      `${left} < x < ${right}`,
      `Interval: (${left}, ${right})`
    ],
    difficulty,
    concept_id: 'M1.EQN.5.6',
    generator_type: 'abs_value_inequality',
  };
}

// =============================================================================
// CATEGORY 2: LINEAR FUNCTIONS (9 generators)
// =============================================================================

// 15. M1.FLF.1.3 - Function Notation
export function generate_evaluate_function(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(2, 6);
  const b = randomInt(-10, 10);
  const input = randomInt(-5, 8);
  const result = m * input + b;
  
  const signB = b >= 0 ? '+' : '-';
  
  return {
    question_latex: `\\text{If } f(x) = ${m}x ${signB} ${Math.abs(b)}, \\text{ find } f(${input})`,
    question_text: `If f(x) = ${m}x ${signB} ${Math.abs(b)}, find f(${input})`,
    correct_answer: String(result),
    answer_type: 'integer',
    solution_steps: [
      `f(x) = ${m}x ${signB} ${Math.abs(b)}`,
      `f(${input}) = ${m}(${input}) ${signB} ${Math.abs(b)}`,
      `= ${m * input} ${signB} ${Math.abs(b)}`,
      `= ${result}`
    ],
    difficulty,
    concept_id: 'M1.FLF.1.3',
    generator_type: 'evaluate_function',
  };
}

// 16. M1.FLF.2.1 - Slope Calculation
export function generate_calculate_slope(difficulty: DifficultyLevel): GeneratedQuestion {
  const x1 = randomInt(-5, 5);
  const y1 = randomInt(-5, 5);
  const rise = randomNonZeroInt(-6, 6);
  const run = randomNonZeroInt(1, 4);
  const x2 = x1 + run;
  const y2 = y1 + rise;
  
  const [sNum, sDen] = simplifyFraction(rise, run);
  const slopeStr = sDen === 1 ? String(sNum) : `${sNum}/${sDen}`;
  
  return {
    question_latex: `\\text{Find the slope through } (${x1}, ${y1}) \\text{ and } (${x2}, ${y2})`,
    question_text: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})`,
    correct_answer: slopeStr,
    // Slope can be integer or fraction; using number_or_fraction so the hint
    // doesn't reveal which one this random instance produced.
    answer_type: 'number_or_fraction',
    solution_steps: [
      `m = (y₂ - y₁) / (x₂ - x₁)`,
      `m = (${y2} - ${y1}) / (${x2} - ${x1})`,
      `m = ${rise} / ${run}`,
      `m = ${slopeStr}`
    ],
    difficulty,
    concept_id: 'M1.FLF.2.1',
    generator_type: 'calculate_slope',
  };
}

// 17. M1.FLF.3.1 - Write Equation (given m and b)
export function generate_write_linear_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-5, 5);
  const b = randomInt(-8, 8);
  
  const signB = b >= 0 ? '+' : '-';
  const equation = b === 0 ? `y = ${m}x` : `y = ${m}x ${signB} ${Math.abs(b)}`;
  
  return {
    question_latex: `\\text{Write the equation with slope } ${m} \\text{ and y-intercept } ${b}`,
    question_text: `Write the equation of a line with slope ${m} and y-intercept ${b}`,
    correct_answer: equation,
    answer_type: 'equation',
    solution_steps: [
      `Slope-intercept form: y = mx + b`,
      `m = ${m}, b = ${b}`,
      equation
    ],
    difficulty,
    concept_id: 'M1.FLF.3.1',
    generator_type: 'write_linear_eq',
  };
}

// 18. M1.FLF.3.2 - Write Equation (two points)
export function generate_write_linear_eq_points(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-4, 4);
  const b = randomInt(-8, 8);
  const x1 = randomInt(0, 5);
  const y1 = m * x1 + b;
  const x2 = x1 + randomInt(1, 3);
  const y2 = m * x2 + b;
  
  const signB = b >= 0 ? '+' : '-';
  const equation = b === 0 ? `y = ${m}x` : `y = ${m}x ${signB} ${Math.abs(b)}`;
  
  return {
    question_latex: `\\text{Write the equation through } (${x1}, ${y1}) \\text{ and } (${x2}, ${y2})`,
    question_text: `Write the equation of the line through (${x1}, ${y1}) and (${x2}, ${y2})`,
    correct_answer: equation,
    answer_type: 'equation',
    solution_steps: [
      `Slope: m = (${y2} - ${y1}) / (${x2} - ${x1}) = ${m}`,
      `Use point-slope: y - ${y1} = ${m}(x - ${x1})`,
      `Simplify: ${equation}`
    ],
    difficulty,
    concept_id: 'M1.FLF.3.2',
    generator_type: 'write_linear_eq_points',
  };
}

// 19. M1.FLF.3.3 - Point-Slope Form
export function generate_point_slope_form(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-5, 5);
  const x1 = randomInt(-5, 5);
  const y1 = randomInt(-5, 5);
  
  const signX = x1 >= 0 ? '-' : '+';
  const signY = y1 >= 0 ? '-' : '+';
  
  return {
    question_latex: `\\text{Write point-slope form through } (${x1}, ${y1}) \\text{ with slope } ${m}`,
    question_text: `Write the point-slope form through (${x1}, ${y1}) with slope ${m}`,
    correct_answer: `y ${signY} ${Math.abs(y1)} = ${m}(x ${signX} ${Math.abs(x1)})`,
    answer_type: 'equation',
    solution_steps: [
      `Point-slope form: y - y₁ = m(x - x₁)`,
      `y - ${y1} = ${m}(x - ${x1})`,
      `y ${signY} ${Math.abs(y1)} = ${m}(x ${signX} ${Math.abs(x1)})`
    ],
    difficulty,
    concept_id: 'M1.FLF.3.3',
    generator_type: 'point_slope_form',
  };
}

// 20. M1.FLF.3.4 - Convert Linear Forms
export function generate_convert_linear_forms(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-4, 4);
  const b = randomInt(-6, 6);
  
  // Standard form: Ax + By = C where A is positive
  const A = -m;
  const B = 1;
  const C = b;
  
  const signC = C >= 0 ? '' : '-';
  const standard = `${A}x + y = ${C}`;
  const slopeInt = `y = ${m}x ${formatConst(b)}`;
  
  return {
    question_latex: `\\text{Convert } ${standard} \\text{ to slope-intercept form}`,
    question_text: `Convert ${standard} to slope-intercept form`,
    correct_answer: slopeInt.trim(),
    answer_type: 'equation',
    solution_steps: [
      standard,
      `y = -${A}x + ${C}`,
      slopeInt
    ],
    difficulty,
    concept_id: 'M1.FLF.3.4',
    generator_type: 'convert_linear_forms',
  };
}

// 21. M1.FLF.4.1 - Parallel Line Slope
export function generate_parallel_line_slope(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-5, 5);
  const b = randomInt(-8, 8);
  const signB = b >= 0 ? '+' : '-';
  
  return {
    question_latex: `\\text{Find the slope parallel to } y = ${m}x ${signB} ${Math.abs(b)}`,
    question_text: `What is the slope of a line parallel to y = ${m}x ${signB} ${Math.abs(b)}?`,
    correct_answer: String(m),
    // Use number_or_fraction so the hint doesn't tip off the student that
    // the answer is necessarily an integer — slopes in general can be either.
    answer_type: 'number_or_fraction',
    solution_steps: [
      `Parallel lines have equal slopes`,
      `Given line has slope ${m}`,
      `Parallel slope = ${m}`
    ],
    difficulty,
    concept_id: 'M1.FLF.4.1',
    generator_type: 'parallel_line_slope',
  };
}

// 22. M1.FLF.4.2 - Perpendicular Line Slope
export function generate_perp_line_slope(difficulty: DifficultyLevel): GeneratedQuestion {
  const num = randomNonZeroInt(1, 5);
  const den = randomNonZeroInt(1, 5);
  const [sNum, sDen] = simplifyFraction(num, den);
  const givenSlope = sDen === 1 ? String(sNum) : `${sNum}/${sDen}`;
  
  // Perpendicular slope is negative reciprocal
  const [pNum, pDen] = simplifyFraction(-sDen, sNum);
  const perpSlope = pDen === 1 ? String(pNum) : `${pNum}/${pDen}`;
  
  return {
    question_latex: `\\text{Find the slope perpendicular to a line with slope } ${givenSlope}`,
    question_text: `What is the slope perpendicular to a line with slope ${givenSlope}?`,
    correct_answer: perpSlope,
    // Perpendicular slope can be integer (when given slope is 1/k) or
    // fraction (when given is k/1). Don't leak which case via the hint.
    answer_type: 'number_or_fraction',
    solution_steps: [
      `Perpendicular slopes are negative reciprocals`,
      `Given slope: ${givenSlope}`,
      `Perpendicular slope: ${perpSlope}`
    ],
    difficulty,
    concept_id: 'M1.FLF.4.2',
    generator_type: 'perp_line_slope',
  };
}

// 23. M1.FLF.4.3 - Write Parallel/Perpendicular Equation
//
// Self-test:
//   parallel to y=2x, through (1,3)  → m=2,  b=3-2·1=1  → "y = 2x + 1"
//   parallel to y=-3x, through (0,4) → m=-3, b=4       → "y = -3x + 4"
//   perp to y=x,    through (2,5)    → m=-1, b=5-(-1)·2=7 → "y = -1x + 7"
//   perp to y=-x,   through (3,1)    → m=1,  b=1-1·3=-2  → "y = 1x - 2"
//
// The perpendicular slope of m is -1/m. For arbitrary integer m other than ±1,
// the perpendicular is fractional ("-1/2", "-1/3"), which our equation
// validator (parseLinearEquation) does NOT accept — it expects integer slopes.
// To keep the answer machine-checkable we constrain the original slope to ±1
// for perpendicular questions, so the perpendicular is also an integer (∓1).
// Parallel questions keep the broader integer range.
export function generate_write_parallel_perp_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  const isParallel = randomInt(0, 1) === 0;
  // For perpendicular: restrict m to ±1 so newM = -1/m is also ±1 (integer).
  // For parallel: full integer range is fine since newM = m.
  const m = isParallel
    ? randomNonZeroInt(-4, 4)
    : (randomInt(0, 1) === 0 ? 1 : -1);
  const x1 = randomInt(-5, 5);
  const y1 = randomInt(-5, 5);

  // Perpendicular slope is the NEGATIVE RECIPROCAL of m.
  // (Constrained above so -1/m is always integer here.)
  const newM = isParallel ? m : -1 / m;
  const newB = y1 - newM * x1;
  
  const signB = newB >= 0 ? '+' : '-';
  const equation = newB === 0 ? `y = ${newM}x` : `y = ${newM}x ${signB} ${Math.abs(newB)}`;
  const type = isParallel ? 'parallel' : 'perpendicular';
  
  return {
    question_latex: `\\text{Write equation ${type} to } y = ${m}x \\text{ through } (${x1}, ${y1})`,
    question_text: `Write the equation ${type} to y = ${m}x through (${x1}, ${y1})`,
    correct_answer: equation,
    answer_type: 'equation',
    solution_steps: [
      `${type} slope: ${newM}`,
      `Through (${x1}, ${y1}): y - ${y1} = ${newM}(x - ${x1})`,
      equation
    ],
    difficulty,
    concept_id: 'M1.FLF.4.3',
    generator_type: 'write_parallel_perp_eq',
  };
}

// =============================================================================
// CATEGORY 3: SYSTEMS OF EQUATIONS (4 generators)
// =============================================================================

// 24. M1.SYS.2.1 - Substitution
//
// Self-test:
//   x=2, y=3, a=1, c=2 → eq1: y=x+1, eq2: 2x+y=7. Check: (2,3) → 3=2+1✓, 4+3=7✓
//   x=-1, y=2, a=-2, c=3 → eq1: y=-2x+0, eq2: 3x+y=-1. Check: (-1,2) → 2=2+0✓, -3+2=-1✓
//
// Avoid a+c=0: that makes the system either inconsistent or degenerate.
// Substituting eq1 into eq2: (a+c)x = e - b. If a+c=0, no unique x.
export function generate_system_substitution(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-5, 5);
  const y = randomInt(-5, 5);
  const a = randomNonZeroInt(-3, 3);
  const b = y - a * x;
  // Re-roll c until a + c ≠ 0 so the linear combination has a unique solution.
  let c = randomNonZeroInt(1, 4);
  while (a + c === 0) c = randomNonZeroInt(1, 4);
  const e = c * x + y;
  
  const signB = b >= 0 ? '+' : '-';
  
  return {
    question_latex: `\\begin{cases} y = ${a}x ${signB} ${Math.abs(b)} \\\\ ${c}x + y = ${e} \\end{cases}`,
    question_text: `Solve: y = ${a}x ${signB} ${Math.abs(b)} and ${c}x + y = ${e}`,
    correct_answer: `(${x}, ${y})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `Substitute y = ${a}x ${signB} ${Math.abs(b)} into second equation`,
      `${c}x + (${a}x ${signB} ${Math.abs(b)}) = ${e}`,
      `${c + a}x = ${e - b}`,
      `x = ${x}, y = ${y}`
    ],
    difficulty,
    concept_id: 'M1.SYS.2.1',
    generator_type: 'system_substitution',
  };
}

// 25. M1.SYS.2.2 - Elimination (Basic)
export function generate_system_elimination_basic(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-6, 6);
  const y = randomInt(-6, 6);
  const sum = x + y;
  const diff = x - y;
  
  return {
    question_latex: `\\begin{cases} x + y = ${sum} \\\\ x - y = ${diff} \\end{cases}`,
    question_text: `Solve: x + y = ${sum} and x - y = ${diff}`,
    correct_answer: `(${x}, ${y})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `Add equations: 2x = ${sum + diff}`,
      `x = ${x}`,
      `Substitute: ${x} + y = ${sum}`,
      `y = ${y}`
    ],
    difficulty,
    concept_id: 'M1.SYS.2.2',
    generator_type: 'system_elimination_basic',
  };
}

// 26. M1.SYS.2.3 - Elimination (Multiply First)
export function generate_system_elimination_mult(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-4, 4);
  const y = randomInt(-4, 4);
  
  const a1 = 2, b1 = 3;
  const a2 = 4, b2 = 1;
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  
  return {
    question_latex: `\\begin{cases} ${a1}x + ${b1}y = ${c1} \\\\ ${a2}x + ${b2}y = ${c2} \\end{cases}`,
    question_text: `Solve: ${a1}x + ${b1}y = ${c1} and ${a2}x + ${b2}y = ${c2}`,
    correct_answer: `(${x}, ${y})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `Multiply first equation by 2: ${a1*2}x + ${b1*2}y = ${c1*2}`,
      `Subtract from second (×1): eliminate x`,
      `Solve for y, then back-substitute`,
      `(${x}, ${y})`
    ],
    difficulty,
    concept_id: 'M1.SYS.2.3',
    generator_type: 'system_elimination_mult',
  };
}

// 27. M1.SYS.3.1 - Types of Solutions
export function generate_system_solution_type(difficulty: DifficultyLevel): GeneratedQuestion {
  const types = ['one', 'none', 'infinite'];
  const type = types[randomInt(0, 2)];
  
  let eq1: string, eq2: string, answer: string;
  
  if (type === 'one') {
    eq1 = `x + y = 5`;
    eq2 = `x - y = 1`;
    answer = 'one solution';
  } else if (type === 'none') {
    eq1 = `2x + y = 4`;
    eq2 = `2x + y = 6`;
    answer = 'no solution';
  } else {
    eq1 = `x + 2y = 4`;
    eq2 = `2x + 4y = 8`;
    answer = 'infinitely many solutions';
  }
  
  return {
    question_latex: `\\text{How many solutions: } ${eq1}, ${eq2}`,
    question_text: `How many solutions does the system have: ${eq1} and ${eq2}?`,
    correct_answer: answer,
    answer_type: 'text',
    solution_steps: [
      type === 'one' ? 'Different slopes → one intersection' :
      type === 'none' ? 'Same slope, different intercept → parallel, no intersection' :
      'Same line → infinitely many solutions'
    ],
    difficulty,
    concept_id: 'M1.SYS.3.1',
    generator_type: 'system_solution_type',
  };
}

// =============================================================================
// CATEGORY 4: EXPONENTS (7 generators)
// =============================================================================

// 28. M1.EXP.1.1 - Evaluate Integer Exponents
export function generate_evaluate_exponent(difficulty: DifficultyLevel): GeneratedQuestion {
  const configs = {
    1: { base: [2, 4], exp: [2, 3] },
    2: { base: [2, 5], exp: [2, 4] },
    3: { base: [2, 6], exp: [2, 5] },
    4: { base: [-5, 6], exp: [2, 5] },
  };
  const cfg = configs[difficulty];
  
  const base = randomInt(cfg.base[0], cfg.base[1]);
  const exp = randomInt(cfg.exp[0], cfg.exp[1]);
  const result = Math.pow(base, exp);
  
  return {
    question_latex: `${base}^{${exp}}`,
    question_text: `Evaluate: ${base}^${exp}`,
    correct_answer: String(result),
    answer_type: 'integer',
    solution_steps: [
      `${base}^${exp} = ${Array(exp).fill(base).join(' × ')}`,
      `= ${result}`
    ],
    difficulty,
    concept_id: 'M1.EXP.1.1',
    generator_type: 'evaluate_exponent',
  };
}

// 29. M1.EXP.1.2 - Product/Quotient Rules
export function generate_exponent_product_quotient(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomInt(2, 6);
  const n = randomInt(2, 5);
  const isProduct = randomInt(0, 1) === 0;
  
  const result = isProduct ? m + n : m - n;
  const op = isProduct ? '·' : '÷';
  const rule = isProduct ? `${m} + ${n}` : `${m} - ${n}`;
  
  return {
    question_latex: `x^{${m}} ${op} x^{${n}}`,
    question_text: `Simplify: x^${m} ${op} x^${n}`,
    correct_answer: `x^${result}`,
    answer_type: 'expression',
    solution_steps: [
      isProduct ? `Product rule: x^m · x^n = x^(m+n)` : `Quotient rule: x^m ÷ x^n = x^(m-n)`,
      `x^(${rule}) = x^${result}`
    ],
    difficulty,
    concept_id: 'M1.EXP.1.2',
    generator_type: 'exponent_product_quotient',
  };
}

// 30. M1.EXP.1.3 - Power Rules
export function generate_exponent_power_rules(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomInt(2, 4);
  const n = randomInt(2, 3);
  const result = m * n;
  
  return {
    question_latex: `(x^{${m}})^{${n}}`,
    question_text: `Simplify: (x^${m})^${n}`,
    correct_answer: `x^${result}`,
    answer_type: 'expression',
    solution_steps: [
      `Power rule: (x^m)^n = x^(m·n)`,
      `x^(${m}·${n}) = x^${result}`
    ],
    difficulty,
    concept_id: 'M1.EXP.1.3',
    generator_type: 'exponent_power_rules',
  };
}

// 31. M1.EXP.1.4 - Zero/Negative Exponents
export function generate_exponent_zero_negative(difficulty: DifficultyLevel): GeneratedQuestion {
  const isZero = difficulty <= 2 && randomInt(0, 1) === 0;
  
  if (isZero) {
    const base = randomInt(2, 10);
    return {
      question_latex: `${base}^{0}`,
      question_text: `Evaluate: ${base}^0`,
      correct_answer: '1',
      // number_or_fraction so the zero-exponent branch (answer "1") and the
      // negative-exponent branch (answer "1/N") share the same hint and the
      // student can't infer the branch from the format hint.
      answer_type: 'number_or_fraction',
      solution_steps: [`Any non-zero number to the 0 power = 1`, `${base}^0 = 1`],
      difficulty,
      concept_id: 'M1.EXP.1.4',
      generator_type: 'exponent_zero_negative',
    };
  } else {
    const base = randomInt(2, 5);
    const exp = randomInt(1, 3);
    const result = Math.pow(base, exp);

    return {
      question_latex: `${base}^{-${exp}}`,
      question_text: `Evaluate: ${base}^-${exp}`,
      correct_answer: `1/${result}`,
      answer_type: 'number_or_fraction',
      solution_steps: [
        `Negative exponent: a^-n = 1/a^n`,
        `${base}^-${exp} = 1/${base}^${exp} = 1/${result}`
      ],
      difficulty,
      concept_id: 'M1.EXP.1.4',
      generator_type: 'exponent_zero_negative',
    };
  }
}

// 32. M1.EXP.1.5 - Mixed Exponent Rules
export function generate_exponent_simplify_all(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomInt(2, 4);
  const n = randomInt(2, 3);
  const p = randomInt(1, 3);
  
  // (x^m · x^n) / x^p
  const result = m + n - p;
  
  return {
    question_latex: `\\frac{x^{${m}} \\cdot x^{${n}}}{x^{${p}}}`,
    question_text: `Simplify: (x^${m} · x^${n}) / x^${p}`,
    correct_answer: `x^${result}`,
    answer_type: 'expression',
    solution_steps: [
      `Numerator: x^${m} · x^${n} = x^${m + n}`,
      `Divide: x^${m + n} / x^${p} = x^${m + n - p}`,
      `= x^${result}`
    ],
    difficulty,
    concept_id: 'M1.EXP.1.5',
    generator_type: 'exponent_simplify_all',
  };
}

// 33. M1.EXP.2.3 - Identify Growth vs Decay
export function generate_identify_growth_decay(difficulty: DifficultyLevel): GeneratedQuestion {
  const isGrowth = randomInt(0, 1) === 0;
  const a = randomInt(1, 10);
  const b = isGrowth ? (1 + randomInt(1, 9) / 10) : (randomInt(1, 9) / 10);
  const bStr = b.toFixed(1);
  
  return {
    question_latex: `y = ${a}(${bStr})^x`,
    question_text: `Is y = ${a}(${bStr})^x exponential growth or decay?`,
    correct_answer: isGrowth ? 'growth' : 'decay',
    answer_type: 'text',
    solution_steps: [
      `Base b = ${bStr}`,
      isGrowth ? `b > 1 → exponential growth` : `0 < b < 1 → exponential decay`
    ],
    difficulty,
    concept_id: 'M1.EXP.2.3',
    generator_type: 'identify_growth_decay',
  };
}

// 34. M1.EXP.3.1 - Write Exponential Equation
export function generate_write_exponential_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(2, 8);
  const b = randomInt(0, 1) === 0 ? 2 : 3;
  
  // Give two points: (0, a) and (1, a*b)
  const y0 = a;
  const y1 = a * b;
  
  return {
    question_latex: `\\text{Write equation through } (0, ${y0}) \\text{ and } (1, ${y1})`,
    question_text: `Write the exponential equation through (0, ${y0}) and (1, ${y1})`,
    correct_answer: `y = ${a}(${b})^x`,
    answer_type: 'equation',
    solution_steps: [
      `At x=0: y = ${y0} → a = ${a}`,
      `At x=1: y = ${y1} → ${a}·b = ${y1} → b = ${b}`,
      `y = ${a}(${b})^x`
    ],
    difficulty,
    concept_id: 'M1.EXP.3.1',
    generator_type: 'write_exponential_eq',
  };
}

// =============================================================================
// CATEGORY 5: POLYNOMIALS & FACTORING (9 generators)
// =============================================================================

// 35. M1.POLY.2.1 - Add Polynomials
export function generate_add_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const a1 = randomInt(1, 5), b1 = randomInt(-8, 8);
  const a2 = randomInt(1, 5), b2 = randomInt(-8, 8);
  
  const aSum = a1 + a2;
  const bSum = b1 + b2;
  
  return {
    question_latex: `(${a1}x ${formatConst(b1)}) + (${a2}x ${formatConst(b2)})`,
    question_text: `Add: (${a1}x ${formatConst(b1)}) + (${a2}x ${formatConst(b2)})`,
    correct_answer: `${aSum}x ${formatConst(bSum)}`.trim(),
    answer_type: 'expression',
    solution_steps: [
      `Combine like terms`,
      `x terms: ${a1}x + ${a2}x = ${aSum}x`,
      `Constants: ${b1} + ${b2} = ${bSum}`
    ],
    difficulty,
    concept_id: 'M1.POLY.2.1',
    generator_type: 'add_polynomials',
  };
}

// 36. M1.POLY.2.2 - Subtract Polynomials
export function generate_subtract_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const a1 = randomInt(2, 7), b1 = randomInt(-8, 8);
  const a2 = randomInt(1, 5), b2 = randomInt(-8, 8);
  
  const aDiff = a1 - a2;
  const bDiff = b1 - b2;
  
  return {
    question_latex: `(${a1}x ${formatConst(b1)}) - (${a2}x ${formatConst(b2)})`,
    question_text: `Subtract: (${a1}x ${formatConst(b1)}) - (${a2}x ${formatConst(b2)})`,
    correct_answer: `${aDiff}x ${formatConst(bDiff)}`.trim(),
    answer_type: 'expression',
    solution_steps: [
      `Distribute the negative`,
      `${a1}x ${formatConst(b1)} - ${a2}x ${formatConst(-b2)}`,
      `= ${aDiff}x ${formatConst(bDiff)}`
    ],
    difficulty,
    concept_id: 'M1.POLY.2.2',
    generator_type: 'subtract_polynomials',
  };
}

// 37. M1.POLY.2.3 - Monomial × Polynomial
export function generate_multiply_mono_poly(difficulty: DifficultyLevel): GeneratedQuestion {
  const mono = randomInt(2, 5);
  const a = randomInt(1, 4);
  const b = randomInt(-6, 6);
  
  const ra = mono * a;
  const rb = mono * b;
  
  return {
    question_latex: `${mono}(${a}x ${formatConst(b)})`,
    question_text: `Expand: ${mono}(${a}x ${formatConst(b)})`,
    correct_answer: `${ra}x ${formatConst(rb)}`.trim(),
    answer_type: 'expression',
    solution_steps: [
      `Distribute ${mono}`,
      `${mono} · ${a}x = ${ra}x`,
      `${mono} · ${b} = ${rb}`,
      `= ${ra}x ${formatConst(rb)}`
    ],
    difficulty,
    concept_id: 'M1.POLY.2.3',
    generator_type: 'multiply_mono_poly',
  };
}

// 38. M1.POLY.2.4 - Binomial × Binomial (FOIL)
export function generate_multiply_binomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(-5, 5);
  const b = randomNonZeroInt(-5, 5);
  
  const middle = a + b;
  const last = a * b;
  
  let answer = 'x²';
  if (middle !== 0) answer += ` ${formatConst(middle)}x`;
  if (last !== 0) answer += ` ${formatConst(last)}`;
  
  return {
    question_latex: `(x ${formatConst(a)})(x ${formatConst(b)})`,
    question_text: `Expand: (x ${formatConst(a)})(x ${formatConst(b)})`,
    correct_answer: answer.trim(),
    answer_type: 'expression',
    solution_steps: [
      `FOIL: First, Outer, Inner, Last`,
      `x² + ${b}x + ${a}x + ${a * b}`,
      `= ${answer}`
    ],
    difficulty,
    concept_id: 'M1.POLY.2.4',
    generator_type: 'multiply_binomials',
  };
}

// 39. M1.POLY.3.1 - Factor GCF
//
// Self-test:
//   gcf=3, a=4, b=5 → 12x + 15  ⇒  3(4x + 5)   (gcd(4,5)=1 ✓ greatest)
//   gcf=4, a=3, b=2 → 12x +  8  ⇒  4(3x + 2)   (gcd(3,2)=1 ✓ greatest)
//   gcf=2, a=2, b=4 → would yield 4x + 8 — actual GCF is 4, not 2. We
//   require gcd(a,b)=1 so the chosen "gcf" really is the greatest factor.
export function generate_factor_gcf(difficulty: DifficultyLevel): GeneratedQuestion {
  const gcf = randomInt(2, 6);
  // Re-roll until a and b are coprime so `gcf` is the true greatest factor
  // (otherwise the "factored" answer wouldn't be fully simplified).
  let a = randomInt(1, 5);
  let b = randomInt(1, 5);
  while (gcd(a, b) !== 1) {
    a = randomInt(1, 5);
    b = randomInt(1, 5);
  }

  const term1 = gcf * a;
  const term2 = gcf * b;
  
  return {
    question_latex: `${term1}x + ${term2}`,
    question_text: `Factor: ${term1}x + ${term2}`,
    correct_answer: `${gcf}(${a}x + ${b})`,
    answer_type: 'expression',
    solution_steps: [
      `GCF of ${term1} and ${term2} is ${gcf}`,
      `${term1}x ÷ ${gcf} = ${a}x`,
      `${term2} ÷ ${gcf} = ${b}`,
      `= ${gcf}(${a}x + ${b})`
    ],
    difficulty,
    concept_id: 'M1.POLY.3.1',
    generator_type: 'factor_gcf',
  };
}

// 40. M1.POLY.4.1 - Factor x² + bx + c (a=1)
export function generate_factor_trinomial_a1(difficulty: DifficultyLevel): GeneratedQuestion {
  const r1 = randomNonZeroInt(-6, 6);
  const r2 = randomNonZeroInt(-6, 6);
  
  const b = r1 + r2;
  const c = r1 * r2;
  
  return {
    question_latex: `x^2 ${formatConst(b)}x ${formatConst(c)}`,
    question_text: `Factor: x² ${formatConst(b)}x ${formatConst(c)}`,
    correct_answer: `(x ${formatConst(r1)})(x ${formatConst(r2)})`,
    answer_type: 'expression',
    solution_steps: [
      `Find two numbers that multiply to ${c} and add to ${b}`,
      `${r1} × ${r2} = ${c} ✓`,
      `${r1} + ${r2} = ${b} ✓`,
      `= (x ${formatConst(r1)})(x ${formatConst(r2)})`
    ],
    difficulty,
    concept_id: 'M1.POLY.4.1',
    generator_type: 'factor_trinomial_a1',
  };
}

// 41. M1.POLY.4.2 - Factor ax² + bx + c (a≠1)
export function generate_factor_trinomial_a_ne_1(difficulty: DifficultyLevel): GeneratedQuestion {
  // (2x + r1)(x + r2) = 2x² + (2r2 + r1)x + r1*r2
  const r1 = randomNonZeroInt(-4, 4);
  const r2 = randomNonZeroInt(-4, 4);
  
  const a = 2;
  const b = 2 * r2 + r1;
  const c = r1 * r2;
  
  return {
    question_latex: `${a}x^2 ${formatConst(b)}x ${formatConst(c)}`,
    question_text: `Factor: ${a}x² ${formatConst(b)}x ${formatConst(c)}`,
    correct_answer: `(2x ${formatConst(r1)})(x ${formatConst(r2)})`,
    answer_type: 'expression',
    solution_steps: [
      `Use AC method or trial: a·c = ${a * c}`,
      `Find factors of ${a * c} that add to ${b}`,
      `= (2x ${formatConst(r1)})(x ${formatConst(r2)})`
    ],
    difficulty,
    concept_id: 'M1.POLY.4.2',
    generator_type: 'factor_trinomial_a_ne_1',
  };
}

// 42. M1.POLY.5.1 - Difference of Squares
export function generate_factor_diff_squares(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(2, 9);
  const aSquared = a * a;
  
  return {
    question_latex: `x^2 - ${aSquared}`,
    question_text: `Factor: x² - ${aSquared}`,
    correct_answer: `(x + ${a})(x - ${a})`,
    answer_type: 'expression',
    solution_steps: [
      `Recognize as a² - b²`,
      `x² - ${aSquared} = x² - ${a}²`,
      `= (x + ${a})(x - ${a})`
    ],
    difficulty,
    concept_id: 'M1.POLY.5.1',
    generator_type: 'factor_diff_squares',
  };
}

// 43. M1.POLY.5.2 - Perfect Square Trinomial
export function generate_factor_perfect_square(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(2, 6);
  const sign = randomInt(0, 1) === 0 ? 1 : -1;
  
  // (x + a)² = x² + 2ax + a²  or  (x - a)² = x² - 2ax + a²
  const middle = 2 * a * sign;
  const last = a * a;
  
  return {
    question_latex: `x^2 ${formatConst(middle)}x + ${last}`,
    question_text: `Factor: x² ${formatConst(middle)}x + ${last}`,
    correct_answer: `(x ${formatConst(a * sign)})²`,
    answer_type: 'expression',
    solution_steps: [
      `Recognize as perfect square trinomial`,
      `x² + 2(${a * sign})x + ${a}²`,
      `= (x ${formatConst(a * sign)})²`
    ],
    difficulty,
    concept_id: 'M1.POLY.5.2',
    generator_type: 'factor_perfect_square',
  };
}

// =============================================================================
// CATEGORY 6: QUADRATICS (4 generators)
// =============================================================================

// 44. M1.QUAD.1.2 - Identify Vertex
export function generate_quadratic_vertex(difficulty: DifficultyLevel): GeneratedQuestion {
  const h = randomInt(-5, 5);
  const k = randomInt(-8, 8);
  const a = randomNonZeroInt(-3, 3);
  
  const signH = h >= 0 ? '-' : '+';
  const signK = k >= 0 ? '+' : '-';
  
  return {
    question_latex: `y = ${a}(x ${signH} ${Math.abs(h)})^2 ${signK} ${Math.abs(k)}`,
    question_text: `Find the vertex of y = ${a}(x ${signH} ${Math.abs(h)})² ${signK} ${Math.abs(k)}`,
    correct_answer: `(${h}, ${k})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `Vertex form: y = a(x - h)² + k`,
      `h = ${h}, k = ${k}`,
      `Vertex: (${h}, ${k})`
    ],
    difficulty,
    concept_id: 'M1.QUAD.1.2',
    generator_type: 'quadratic_vertex',
  };
}

// 45. M1.QUAD.2.2 - Solve by Factoring
export function generate_quadratic_factor_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  const r1 = randomNonZeroInt(-6, 6);
  const r2 = randomNonZeroInt(-6, 6);
  
  const b = -(r1 + r2);
  const c = r1 * r2;
  
  const roots = [Math.min(r1, r2), Math.max(r1, r2)];
  
  return {
    question_latex: `x^2 ${formatConst(b)}x ${formatConst(c)} = 0`,
    question_text: `Solve: x² ${formatConst(b)}x ${formatConst(c)} = 0`,
    correct_answer: `{${roots[0]}, ${roots[1]}}`,
    answer_type: 'integer_pair',
    solution_steps: [
      `Factor: (x - ${r1})(x - ${r2}) = 0`,
      `x - ${r1} = 0 → x = ${r1}`,
      `x - ${r2} = 0 → x = ${r2}`
    ],
    difficulty,
    concept_id: 'M1.QUAD.2.2',
    generator_type: 'quadratic_factor_solve',
  };
}

// 46. M1.QUAD.2.3 - Solve by Square Roots
export function generate_quadratic_sqrt_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  const root = randomInt(2, 12);
  const c = root * root;
  
  return {
    question_latex: `x^2 = ${c}`,
    question_text: `Solve: x² = ${c}`,
    correct_answer: `{-${root}, ${root}}`,
    answer_type: 'integer_pair',
    solution_steps: [
      `x² = ${c}`,
      `x = ±√${c}`,
      `x = ±${root}`
    ],
    difficulty,
    concept_id: 'M1.QUAD.2.3',
    generator_type: 'quadratic_sqrt_solve',
  };
}

// 47. M1.QUAD.2.4 - Quadratic Formula
export function generate_quadratic_formula(difficulty: DifficultyLevel): GeneratedQuestion {
  // Generate with nice discriminant
  const r1 = randomInt(-5, 5);
  const r2 = randomInt(-5, 5);
  
  const a = 1;
  const b = -(r1 + r2);
  const c = r1 * r2;
  
  const roots = [Math.min(r1, r2), Math.max(r1, r2)];
  
  return {
    question_latex: `x^2 ${formatConst(b)}x ${formatConst(c)} = 0 \\text{ (use quadratic formula)}`,
    question_text: `Solve using quadratic formula: x² ${formatConst(b)}x ${formatConst(c)} = 0`,
    correct_answer: `{${roots[0]}, ${roots[1]}}`,
    answer_type: 'integer_pair',
    solution_steps: [
      `x = (-b ± √(b² - 4ac)) / 2a`,
      `x = (${-b} ± √(${b*b} - ${4*c})) / 2`,
      `x = (${-b} ± √${b*b - 4*c}) / 2`,
      `x = ${roots[0]} or ${roots[1]}`
    ],
    difficulty,
    concept_id: 'M1.QUAD.2.4',
    generator_type: 'quadratic_formula',
  };
}

// =============================================================================
// CATEGORY 7: STATISTICS (3 generators)
// =============================================================================

// 48. M1.DAS.2.1 - Central Tendency
// computeMedian — handles odd AND even length arrays.
//   {3, 5, 7}            → 5        (odd: middle element)
//   {2, 4, 6, 8}         → 5        (even: (4+6)/2)
//   {6, 9, 9, 13, 14, 18}→ 11       (even: (9+13)/2)
//   {5}                  → 5
//   {3, 7}               → 5
function computeMedian(sortedArr: number[]): number {
  const n = sortedArr.length;
  if (n === 0) return 0;
  if (n % 2 === 1) return sortedArr[Math.floor(n / 2)]!;
  return (sortedArr[n / 2 - 1]! + sortedArr[n / 2]!) / 2;
}

export function generate_calculate_central_tendency(difficulty: DifficultyLevel): GeneratedQuestion {
  const measure = ['mean', 'median'][randomInt(0, 1)];
  // Allow even AND odd counts so the median branch exercises both formulas.
  const n = randomInt(5, 8);

  let data: number[];
  let answer: number;

  if (measure === 'mean') {
    const targetMean = randomInt(8, 20);
    const targetSum = targetMean * n;
    data = [];
    let sum = 0;
    for (let i = 0; i < n - 1; i++) {
      const val = randomInt(targetMean - 6, targetMean + 6);
      data.push(val);
      sum += val;
    }
    data.push(targetSum - sum);
    data.sort((a, b) => a - b);
    answer = targetMean;
  } else {
    data = Array.from({ length: n }, () => randomInt(5, 25)).sort((a, b) => a - b);
    answer = computeMedian(data);
  }

  const isWhole = Number.isInteger(answer);
  // Print one decimal place when fractional (e.g. 5.5), no decimals when whole.
  const answerStr = isWhole ? String(answer) : answer.toFixed(1);

  return {
    question_latex: `\\text{Find the ${measure} of } \\{${data.join(', ')}\\}`,
    question_text: `Find the ${measure} of {${data.join(', ')}}`,
    correct_answer: answerStr,
    // Mean is always integer here; median of even-length data can be
    // fractional. Use number_or_fraction so the hint doesn't tell the
    // student whether their answer should be whole or a half-integer.
    answer_type: 'number_or_fraction',
    solution_steps:
      measure === 'mean'
        ? [`Sum = ${data.reduce((a, b) => a + b)}`, `Mean = Sum ÷ ${n} = ${answer}`]
        : n % 2 === 1
        ? [`Ordered: {${data.join(', ')}}`, `Middle value = ${answerStr}`]
        : [
            `Ordered: {${data.join(', ')}}`,
            `Even count — average of two middle values: (${data[n / 2 - 1]} + ${data[n / 2]}) / 2 = ${answerStr}`,
          ],
    difficulty,
    concept_id: 'M1.DAS.2.1',
    generator_type: 'calculate_central_tendency',
  };
}

// 49. M1.DAS.2.2 - Range and IQR
export function generate_calculate_variability(difficulty: DifficultyLevel): GeneratedQuestion {
  const data = Array.from({ length: 9 }, () => randomInt(10, 40)).sort((a, b) => a - b);
  
  const measure = ['range', 'IQR'][randomInt(0, 1)];
  
  let answer: number;
  if (measure === 'range') {
    answer = data[8] - data[0];
  } else {
    const q1 = data[2];
    const q3 = data[6];
    answer = q3 - q1;
  }
  
  return {
    question_latex: `\\text{Find the ${measure} of } \\{${data.join(', ')}\\}`,
    question_text: `Find the ${measure} of {${data.join(', ')}}`,
    correct_answer: String(answer),
    answer_type: 'integer',
    solution_steps: measure === 'range'
      ? [`Max = ${data[8]}, Min = ${data[0]}`, `Range = ${data[8]} - ${data[0]} = ${answer}`]
      : [`Q1 = ${data[2]}, Q3 = ${data[6]}`, `IQR = ${data[6]} - ${data[2]} = ${answer}`],
    difficulty,
    concept_id: 'M1.DAS.2.2',
    generator_type: 'calculate_variability',
  };
}

// 50. M1.DAS.4.3 - Calculate Residuals
export function generate_calculate_residual(difficulty: DifficultyLevel): GeneratedQuestion {
  const actual = randomInt(20, 50);
  const predicted = actual + randomInt(-8, 8);
  const residual = actual - predicted;
  
  return {
    question_latex: `\\text{Actual: } ${actual}, \\text{ Predicted: } ${predicted}. \\text{ Find residual.}`,
    question_text: `If the actual value is ${actual} and predicted value is ${predicted}, find the residual.`,
    correct_answer: String(residual),
    answer_type: 'integer',
    solution_steps: [
      `Residual = Actual - Predicted`,
      `= ${actual} - ${predicted}`,
      `= ${residual}`
    ],
    difficulty,
    concept_id: 'M1.DAS.4.3',
    generator_type: 'calculate_residual',
  };
}

// =============================================================================
// CATEGORY 8: TRANSFORMATIONS (4 generators)
// =============================================================================

// 51. M1.GEO.TRANS.2.2 - Translation
export function generate_translate_point(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-8, 8);
  const y = randomInt(-8, 8);
  const dx = randomInt(-5, 5);
  const dy = randomInt(-5, 5);
  
  return {
    question_latex: `\\text{Translate } (${x}, ${y}) \\text{ by } \\langle ${dx}, ${dy} \\rangle`,
    question_text: `Translate (${x}, ${y}) by <${dx}, ${dy}>`,
    correct_answer: `(${x + dx}, ${y + dy})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `(x, y) → (x + ${dx}, y + ${dy})`,
      `(${x}, ${y}) → (${x + dx}, ${y + dy})`
    ],
    difficulty,
    concept_id: 'M1.GEO.TRANS.2.2',
    generator_type: 'translate_point',
  };
}

// 52. M1.GEO.TRANS.3.2 - Reflection
export function generate_reflect_point(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-8, 8);
  const y = randomNonZeroInt(-8, 8);
  const axes = ['x-axis', 'y-axis', 'origin'];
  const axis = axes[randomInt(0, 2)];
  
  let newX: number, newY: number;
  if (axis === 'x-axis') { newX = x; newY = -y; }
  else if (axis === 'y-axis') { newX = -x; newY = y; }
  else { newX = -x; newY = -y; }
  
  return {
    question_latex: `\\text{Reflect } (${x}, ${y}) \\text{ across the ${axis}}`,
    question_text: `Reflect (${x}, ${y}) across the ${axis}`,
    correct_answer: `(${newX}, ${newY})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      axis === 'x-axis' ? '(x, y) → (x, -y)' :
      axis === 'y-axis' ? '(x, y) → (-x, y)' : '(x, y) → (-x, -y)',
      `(${x}, ${y}) → (${newX}, ${newY})`
    ],
    difficulty,
    concept_id: 'M1.GEO.TRANS.3.2',
    generator_type: 'reflect_point',
  };
}

// 53. M1.GEO.TRANS.4.2 - Rotation
export function generate_rotate_point(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(-6, 6);
  const y = randomInt(-6, 6);
  const angles = [90, 180, 270];
  const angle = angles[randomInt(0, 2)];
  
  let newX: number, newY: number;
  if (angle === 90) { newX = -y; newY = x; }
  else if (angle === 180) { newX = -x; newY = -y; }
  else { newX = y; newY = -x; }
  
  return {
    question_latex: `\\text{Rotate } (${x}, ${y}) \\text{ ${angle}° CCW about origin}`,
    question_text: `Rotate (${x}, ${y}) ${angle}° counterclockwise about the origin`,
    correct_answer: `(${newX}, ${newY})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      angle === 90 ? '(x, y) → (-y, x)' :
      angle === 180 ? '(x, y) → (-x, -y)' : '(x, y) → (y, -x)',
      `(${x}, ${y}) → (${newX}, ${newY})`
    ],
    difficulty,
    concept_id: 'M1.GEO.TRANS.4.2',
    generator_type: 'rotate_point',
  };
}

// 54. M1.GEO.TRANS.5.1 - Sequence of Transformations
export function generate_transform_sequence(difficulty: DifficultyLevel): GeneratedQuestion {
  const x = randomInt(1, 5);
  const y = randomInt(1, 5);
  
  // Translate then reflect across x-axis
  const dx = randomInt(-3, 3);
  const dy = randomInt(-3, 3);
  
  const afterTrans = [x + dx, y + dy];
  const afterReflect = [afterTrans[0], -afterTrans[1]];
  
  return {
    question_latex: `\\text{Translate } (${x}, ${y}) \\text{ by } \\langle ${dx}, ${dy} \\rangle, \\text{ then reflect across x-axis}`,
    question_text: `Translate (${x}, ${y}) by <${dx}, ${dy}>, then reflect across the x-axis`,
    correct_answer: `(${afterReflect[0]}, ${afterReflect[1]})`,
    answer_type: 'ordered_pair',
    solution_steps: [
      `Step 1: Translate (${x}, ${y}) by <${dx}, ${dy}> → (${afterTrans[0]}, ${afterTrans[1]})`,
      `Step 2: Reflect across x-axis → (${afterReflect[0]}, ${afterReflect[1]})`
    ],
    difficulty,
    concept_id: 'M1.GEO.TRANS.5.1',
    generator_type: 'transform_sequence',
  };
}

// =============================================================================
// =============================================================================
// NC GRADE 7 — CHALLENGERS DIVISION (pool: nc_grade_7)
// =============================================================================
// =============================================================================
// Every generator below uses the `g7_` prefix on its `generator_type` key
// so identifiers never collide with other pools. Concept IDs follow the
// `M7.<UNIT>.<TOPIC>.<CONCEPT>` lesson_number scheme used in the
// docs/curriculum/grade7/*.json artifacts.
//
// Internally each function builds an object matching the user's spec —
// { question, answer, solution_steps, concept_name, answer_type } — and
// passes it through g7Wrap() to produce the GeneratedQuestion shape that
// the existing question-delivery pipeline expects.

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS (Grade 7 only — prefixed g7* to avoid collisions)
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical rational number: simplified, denominator > 0. */
type G7Rational = { num: number; den: number };

function g7Rat(num: number, den: number = 1): G7Rational {
  if (den === 0) throw new Error('g7Rat: zero denominator');
  const [n, d] = simplifyFraction(num, den);
  return { num: n, den: d };
}

function g7RatAdd(a: G7Rational, b: G7Rational): G7Rational {
  return g7Rat(a.num * b.den + b.num * a.den, a.den * b.den);
}
function g7RatSub(a: G7Rational, b: G7Rational): G7Rational {
  return g7Rat(a.num * b.den - b.num * a.den, a.den * b.den);
}
function g7RatMul(a: G7Rational, b: G7Rational): G7Rational {
  return g7Rat(a.num * b.num, a.den * b.den);
}
function g7RatDiv(a: G7Rational, b: G7Rational): G7Rational {
  if (b.num === 0) throw new Error('g7RatDiv: divide by zero');
  return g7Rat(a.num * b.den, a.den * b.num);
}

/** Format as the simplest exact form: integer if denominator is 1, else a/b. */
function g7FmtRat(r: G7Rational): string {
  return r.den === 1 ? String(r.num) : `${r.num}/${r.den}`;
}

/** Wrap a negative value in parentheses for inline display in operators. */
function g7Paren(r: G7Rational): string {
  const s = g7FmtRat(r);
  return r.num < 0 ? `(${s})` : s;
}

/**
 * Sample a random rational. Returns an integer ~50% of the time and a
 * simple fraction (denominator 2-6) otherwise, so the resulting problems
 * mix the operand types the curriculum specifies.
 */
function g7RandomRational(
  range: number = 10,
  includeFractions: boolean = true,
  allowNegative: boolean = true
): G7Rational {
  const useFrac = includeFractions && Math.random() < 0.5;
  if (useFrac) {
    const den = randomInt(2, 6);
    const min = allowNegative ? -range * den : 1;
    const max = range * den;
    let num = randomNonZeroInt(min, max);
    // Avoid degenerate "fraction that's secretly an integer"
    if (num % den === 0) num += Math.sign(num) || 1;
    return g7Rat(num, den);
  }
  const min = allowNegative ? -range : 1;
  return g7Rat(randomNonZeroInt(min, range));
}

/** Build a GeneratedQuestion for a Grade 7 generator from the user's shape. */
function g7Wrap(
  difficulty: DifficultyLevel,
  generator_type: string,
  concept_id: string,
  _concept_name: string,                 // documentation only; concept_id is the live FK
  q: { question: string; answer: string; solution_steps: string[]; answer_type: AnswerType }
): GeneratedQuestion {
  return {
    question_latex: q.question,
    question_text: q.question,
    correct_answer: q.answer,
    answer_type: q.answer_type,
    solution_steps: q.solution_steps,
    difficulty,
    concept_id,
    generator_type,
    // External-tooling aliases — same values as correct_answer / question_text.
    // Pipeline code reads correct_answer / question_text; test scripts and
    // REPLs that follow the user's { question, answer, ... } shape get the
    // populated value here instead of `undefined`.
    answer: q.answer,
    question: q.question,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: The Number System — rational arithmetic + fraction-to-decimal
// ─────────────────────────────────────────────────────────────────────────────

// 1. M7.NS.1.2 — Adding Rational Numbers
export function generate_g7_add_rational(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 6 : difficulty === 2 ? 10 : 15;
  let a: G7Rational;
  let b: G7Rational;
  let sum: G7Rational;
  // Reject trivial zero sums and identical operands.
  for (let tries = 0; tries < 10; tries++) {
    a = g7RandomRational(range, difficulty >= 2);
    b = g7RandomRational(range, difficulty >= 2);
    sum = g7RatAdd(a, b);
    if (sum.num !== 0 && (a.num !== b.num || a.den !== b.den)) break;
  }
  a = a!; b = b!; sum = sum!;
  return g7Wrap(difficulty, 'g7_add_rational', 'M7.NS.1.2', 'Adding Rational Numbers', {
    question: `Add: ${g7FmtRat(a)} + ${g7Paren(b)}`,
    answer: g7FmtRat(sum),
    solution_steps: [
      `Find a common denominator: ${a.den * b.den}`,
      `Rewrite: ${a.num * b.den}/${a.den * b.den} + ${b.num * a.den}/${a.den * b.den}`,
      `Add numerators: ${a.num * b.den + b.num * a.den}/${a.den * b.den}`,
      `Simplify: ${g7FmtRat(sum)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 2. M7.NS.1.4 — Subtracting Rational Numbers
export function generate_g7_subtract_rational(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 6 : difficulty === 2 ? 10 : 15;
  let a: G7Rational;
  let b: G7Rational;
  let diff: G7Rational;
  for (let tries = 0; tries < 10; tries++) {
    a = g7RandomRational(range, difficulty >= 2);
    b = g7RandomRational(range, difficulty >= 2);
    diff = g7RatSub(a, b);
    if (diff.num !== 0 && (a.num !== b.num || a.den !== b.den)) break;
  }
  a = a!; b = b!; diff = diff!;
  return g7Wrap(difficulty, 'g7_subtract_rational', 'M7.NS.1.4', 'Subtracting Rational Numbers', {
    question: `Subtract: ${g7FmtRat(a)} − ${g7Paren(b)}`,
    answer: g7FmtRat(diff),
    solution_steps: [
      `Find a common denominator: ${a.den * b.den}`,
      `Rewrite: ${a.num * b.den}/${a.den * b.den} − ${b.num * a.den}/${a.den * b.den}`,
      `Subtract numerators: ${a.num * b.den - b.num * a.den}/${a.den * b.den}`,
      `Simplify: ${g7FmtRat(diff)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 3. M7.NS.2.2 — Multiplying Rational Numbers
export function generate_g7_multiply_rational(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 6 : 10;
  let a: G7Rational;
  let b: G7Rational;
  let prod: G7Rational;
  for (let tries = 0; tries < 10; tries++) {
    a = g7RandomRational(range, true);
    b = g7RandomRational(range, true);
    prod = g7RatMul(a, b);
    // Skip ±1 multipliers (trivial)
    if (Math.abs(a.num) !== 1 || a.den !== 1) {
      if (Math.abs(b.num) !== 1 || b.den !== 1) break;
    }
  }
  a = a!; b = b!; prod = prod!;
  return g7Wrap(difficulty, 'g7_multiply_rational', 'M7.NS.2.2', 'Multiplying Rational Numbers', {
    question: `Multiply: ${g7Paren(a)} × ${g7Paren(b)}`,
    answer: g7FmtRat(prod),
    solution_steps: [
      `Multiply numerators: ${a.num} × ${b.num} = ${a.num * b.num}`,
      `Multiply denominators: ${a.den} × ${b.den} = ${a.den * b.den}`,
      `Simplify ${a.num * b.num}/${a.den * b.den}: ${g7FmtRat(prod)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 4. M7.NS.2.4 — Dividing Rational Numbers
export function generate_g7_divide_rational(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 6 : 10;
  let a: G7Rational;
  let b: G7Rational;
  let quot: G7Rational;
  for (let tries = 0; tries < 10; tries++) {
    a = g7RandomRational(range, true);
    b = g7RandomRational(range, true);
    if (b.num === 0) continue;
    quot = g7RatDiv(a, b);
    if (Math.abs(b.num) !== 1 || b.den !== 1) break;
  }
  a = a!; b = b!; quot = quot!;
  const bReciprocal = g7Rat(b.den * (b.num < 0 ? -1 : 1), Math.abs(b.num));
  return g7Wrap(difficulty, 'g7_divide_rational', 'M7.NS.2.4', 'Dividing Rational Numbers', {
    question: `Divide: ${g7Paren(a)} ÷ ${g7Paren(b)}`,
    answer: g7FmtRat(quot),
    solution_steps: [
      `Multiply by the reciprocal of ${g7Paren(b)}`,
      `${g7Paren(a)} × ${g7FmtRat(bReciprocal)}`,
      `Simplify: ${g7FmtRat(quot)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 5. M7.NS.3.1 — Converting Rational Numbers to Decimals (Terminating/Repeating)
// BUG 3 — module-scoped sliding-window dedup for g7_rational_to_decimal.
// Independent random picks from a small pool collide often. This window
// remembers the last N fraction keys issued (across heats — generators
// don't know about heat boundaries) so the next call retries until it
// finds a key not in the window. Window length 8 = at least 8 distinct
// fractions before any repeat.
const g7RationalRecentFractions: string[] = [];
const G7_RATIONAL_WINDOW = 8;

export function generate_g7_rational_to_decimal(difficulty: DifficultyLevel): GeneratedQuestion {
  // BUG 3 fix: pools expanded to ≥ 8 entries each so the sliding-window
  // dedup below never starves. Terminating denominators factor into 2s
  // and 5s only; repeating decimals get a "..." marker so students aren't
  // fishing for the exact long-form value.
  const terminating: Array<{ num: number; den: number; dec: string }> = [
    { num: 1, den: 2,  dec: '0.5'   },
    { num: 1, den: 4,  dec: '0.25'  },
    { num: 3, den: 4,  dec: '0.75'  },
    { num: 1, den: 5,  dec: '0.2'   },
    { num: 2, den: 5,  dec: '0.4'   },
    { num: 3, den: 5,  dec: '0.6'   },
    { num: 4, den: 5,  dec: '0.8'   },
    { num: 1, den: 8,  dec: '0.125' },
    { num: 3, den: 8,  dec: '0.375' },
    { num: 5, den: 8,  dec: '0.625' },
    { num: 7, den: 8,  dec: '0.875' },
    { num: 1, den: 10, dec: '0.1'   },
    { num: 3, den: 10, dec: '0.3'   },
    { num: 7, den: 10, dec: '0.7'   },
    { num: 9, den: 10, dec: '0.9'   },
    { num: 1, den: 16, dec: '0.0625' },
    { num: 3, den: 16, dec: '0.1875' },
    { num: 1, den: 20, dec: '0.05'  },
    { num: 3, den: 20, dec: '0.15'  },
    { num: 1, den: 25, dec: '0.04'  },
    { num: 3, den: 25, dec: '0.12'  },
  ];
  const repeating: Array<{ num: number; den: number; dec: string; bar: string }> = [
    { num: 1, den: 3,  dec: '0.333...',    bar: '3'      },
    { num: 2, den: 3,  dec: '0.666...',    bar: '6'      },
    { num: 1, den: 6,  dec: '0.1666...',   bar: '6'      },
    { num: 5, den: 6,  dec: '0.8333...',   bar: '3'      },
    { num: 1, den: 9,  dec: '0.111...',    bar: '1'      },
    { num: 2, den: 9,  dec: '0.222...',    bar: '2'      },
    { num: 4, den: 9,  dec: '0.444...',    bar: '4'      },
    { num: 5, den: 9,  dec: '0.555...',    bar: '5'      },
    { num: 7, den: 9,  dec: '0.777...',    bar: '7'      },
    { num: 8, den: 9,  dec: '0.888...',    bar: '8'      },
    { num: 1, den: 7,  dec: '0.142857...', bar: '142857' },
    { num: 1, den: 11, dec: '0.0909...',   bar: '09'     },
    { num: 2, den: 11, dec: '0.1818...',   bar: '18'     },
  ];

  const useTerm = difficulty === 1 || Math.random() < 0.6;
  const pool = useTerm ? terminating : repeating;

  // Sliding-window pick: retry up to 12 times to find a key not in the
  // recent set. If every retry collides (rare — would mean the entire pool
  // is in the window), fall through with whatever the last pick was.
  let pick = pool[randomInt(0, pool.length - 1)]!;
  for (let tries = 0; tries < 12; tries++) {
    const key = `${pick.num}/${pick.den}`;
    if (!g7RationalRecentFractions.includes(key)) break;
    pick = pool[randomInt(0, pool.length - 1)]!;
  }
  const pickKey = `${pick.num}/${pick.den}`;
  g7RationalRecentFractions.push(pickKey);
  while (g7RationalRecentFractions.length > G7_RATIONAL_WINDOW) {
    g7RationalRecentFractions.shift();
  }

  const negate = Math.random() < 0.3;
  const numDisplay = `${negate ? '-' : ''}${pick.num}/${pick.den}`;
  const answer = `${negate ? '-' : ''}${pick.dec}`;
  return g7Wrap(difficulty, 'g7_rational_to_decimal', 'M7.NS.3.1', 'Converting Rational Numbers to Decimals', {
    question: `Convert to a decimal: ${numDisplay}`,
    answer,
    solution_steps: [
      `Divide ${negate ? '-' : ''}${pick.num} by ${pick.den}`,
      useTerm
        ? `The decimal terminates: ${answer}`
        : `The decimal repeats (digit${(pick as any).bar.length > 1 ? 's' : ''} ${(pick as any).bar}): ${answer}`,
    ],
    answer_type: 'decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: Ratios & Proportional Relationships
// ─────────────────────────────────────────────────────────────────────────────

// 6. M7.RP.1.2 — Identifying the Constant of Proportionality (unit rate)
export function generate_g7_find_unit_rate(difficulty: DifficultyLevel): GeneratedQuestion {
  // BUG 2 fix: each context owns its own grammatical sentence. The old
  // template hardcoded "travels" between subject and amount, producing
  // garbled output like "A typist averages travels 10 words in 2 minutes".
  // Now every context is a self-contained template((y, x) => string) so
  // the verb stays scenario-appropriate.
  const contexts: Array<{
    item: string;
    per: string;
    template: (y: number, x: number) => string;
  }> = [
    { item: 'miles', per: 'hour',
      template: (y, x) => `A car travels ${y} miles in ${x} hour${x === 1 ? '' : 's'}.` },
    { item: 'miles', per: 'hour',
      template: (y, x) => `A runner covers ${y} miles in ${x} hour${x === 1 ? '' : 's'}.` },
    { item: 'words', per: 'minute',
      template: (y, x) => `A typist types ${y} words in ${x} minute${x === 1 ? '' : 's'}.` },
    { item: 'pages', per: 'minute',
      template: (y, x) => `A printer outputs ${y} pages in ${x} minute${x === 1 ? '' : 's'}.` },
    { item: 'liters', per: 'minute',
      template: (y, x) => `A pump moves ${y} liters in ${x} minute${x === 1 ? '' : 's'}.` },
    { item: 'dollars', per: 'pound',
      template: (y, x) => `Apples cost ${y} dollars for ${x} pound${x === 1 ? '' : 's'}.` },
  ];
  const ctx = contexts[randomInt(0, contexts.length - 1)]!;
  // Clean integer unit rates first, then scale x.
  const k = difficulty === 1 ? randomInt(2, 8) : randomInt(3, 20);
  const xMultiplier = randomInt(2, difficulty === 1 ? 5 : 12);
  const x = xMultiplier;
  const y = k * x;
  return g7Wrap(difficulty, 'g7_find_unit_rate', 'M7.RP.1.2', 'Identifying the Constant of Proportionality', {
    question: `${ctx.template(y, x)} What is the unit rate in ${ctx.item} per ${ctx.per}?`,
    answer: String(k),
    solution_steps: [
      `Unit rate = total ÷ number of units`,
      `${y} ÷ ${x} = ${k}`,
      `Answer: ${k} ${ctx.item} per ${ctx.per}`,
    ],
    answer_type: 'decimal',
  });
}

// 7. M7.RP.2.1 — Using Proportional Relationships to Solve Real-World Problems
export function generate_g7_proportional_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // BUG 1 fix: the car scenario wording reads "A car travels ${a} miles on
  // ${b} gallons" — here `a` is the OUTPUT unit (miles) and `b` is the INPUT
  // unit (gallons). All other scenarios have `a` as input and `b` as output.
  // The old uniform formula `newInput × k` (= newInput × known2/known1)
  // produced the wrong answer for the car case. Now each scenario carries
  // a `direction` flag and the cross-multiplication branches accordingly.
  const scenarios = [
    { setup: (a: number, b: number) => `A recipe uses ${a} cups of flour to make ${b} cookies.`,
      ask: (n: number) => `How many cookies can be made with ${n} cups of flour?`,
      unit: 'cookies', direction: 'forward' as const },
    { setup: (a: number, b: number) => `A car travels ${a} miles on ${b} gallons of gas.`,
      ask: (n: number) => `How many miles can it travel on ${n} gallons?`,
      unit: 'miles', direction: 'inverted' as const },
    { setup: (a: number, b: number) => `${a} oranges cost $${b}.`,
      ask: (n: number) => `How much do ${n} oranges cost in dollars?`,
      unit: 'dollars', direction: 'forward' as const },
    { setup: (a: number, b: number) => `On a map, ${a} cm represents ${b} miles.`,
      ask: (n: number) => `How many miles do ${n} cm represent?`,
      unit: 'miles', direction: 'forward' as const },
  ];
  const sc = scenarios[randomInt(0, scenarios.length - 1)]!;
  // Build a clean ratio that scales to an integer answer.
  const k = randomInt(2, difficulty === 1 ? 6 : 12);
  const base = randomInt(2, 5);
  const known1 = base;
  const known2 = base * k;
  const m = randomInt(2, difficulty === 1 ? 4 : 8);

  let newInput: number;
  let answer: number;
  if (sc.direction === 'inverted') {
    // newInput is in known2's units; answer is in known1's units.
    // To keep the answer integer, newInput must be a multiple of known2.
    // Cross-multiply: known1/known2 = answer/newInput → answer = known1 × newInput / known2.
    newInput = known2 * m;
    answer = Math.round((known1 * newInput) / known2 * 10000) / 10000;
  } else {
    // Forward: newInput in known1's units; answer in known2's units.
    newInput = base * m;
    answer = newInput * k;
  }

  return g7Wrap(difficulty, 'g7_proportional_solve', 'M7.RP.2.1', 'Solving Proportions in Real-World Problems', {
    question: `${sc.setup(known1, known2)} ${sc.ask(newInput)}`,
    answer: String(answer),
    solution_steps: sc.direction === 'inverted'
      ? [
          `Set up the proportion: ${known1}/${known2} = x/${newInput}`,
          `Cross-multiply: ${known1} × ${newInput} = ${known2} × x`,
          `Solve: x = (${known1} × ${newInput}) / ${known2} = ${answer}`,
          `Answer: ${answer} ${sc.unit}`,
        ]
      : [
          `Set up the proportion: ${known1}/${known2} = ${newInput}/x`,
          `Find the unit rate: ${known2} ÷ ${known1} = ${k}`,
          `Multiply: ${newInput} × ${k} = ${answer}`,
          `Answer: ${answer} ${sc.unit}`,
        ],
    answer_type: 'decimal',
  });
}

// 8. M7.RP.3.1 — Multi-Step Percent Problems (Tax, Tip, Discount)
export function generate_g7_percent_tax_tip_discount(difficulty: DifficultyLevel): GeneratedQuestion {
  const kinds = ['tax', 'tip', 'discount'] as const;
  const kind = kinds[randomInt(0, 2)]!;
  // Round base prices so the final total is a clean two-decimal number.
  const base = randomInt(difficulty === 1 ? 10 : 20, difficulty === 1 ? 80 : 200);
  const pct = kind === 'tax' ? randomInt(4, 10)
            : kind === 'tip' ? randomInt(10, 20)
            : /* discount */    randomInt(10, 40);
  const delta = +(base * pct / 100).toFixed(2);
  const total = kind === 'discount'
    ? +(base - delta).toFixed(2)
    : +(base + delta).toFixed(2);
  const item = kind === 'tip' ? 'meal' : kind === 'discount' ? 'jacket' : 'purchase';
  const verb = kind === 'discount' ? 'is on sale for' : 'costs';
  const ask = kind === 'discount'
    ? `What is the sale price after the ${pct}% discount?`
    : kind === 'tip'
    ? `What is the total bill after a ${pct}% tip?`
    : `What is the total cost after ${pct}% sales tax?`;
  return g7Wrap(difficulty, 'g7_percent_tax_tip_discount', 'M7.RP.3.1', 'Tax, Tip, and Discount', {
    question: `A ${item} ${verb} $${base.toFixed(2)}. ${ask}`,
    answer: total.toFixed(2),
    solution_steps: [
      `Compute ${pct}% of $${base.toFixed(2)}: ${base} × ${(pct / 100).toFixed(2)} = $${delta.toFixed(2)}`,
      kind === 'discount'
        ? `Subtract: $${base.toFixed(2)} − $${delta.toFixed(2)} = $${total.toFixed(2)}`
        : `Add: $${base.toFixed(2)} + $${delta.toFixed(2)} = $${total.toFixed(2)}`,
    ],
    answer_type: 'decimal',
  });
}

// 9. M7.RP.3.2 — Simple Interest (I = Prt)
export function generate_g7_simple_interest(difficulty: DifficultyLevel): GeneratedQuestion {
  // Solve for I, A, or P. Keep ranges so answer is a clean two-decimal number.
  const P = randomInt(2, 20) * 100;                        // $200 … $2000
  const ratePct = [2, 3, 4, 5, 6, 8, 10][randomInt(0, 6)]!;
  const r = ratePct / 100;
  const t = randomInt(1, difficulty === 1 ? 4 : 8);
  const I = +(P * r * t).toFixed(2);
  const A = +(P + I).toFixed(2);
  const ask = difficulty === 1 || Math.random() < 0.5
    ? { key: 'I', text: 'How much interest is earned?', val: I }
    : { key: 'A', text: 'What is the total amount in the account?', val: A };
  return g7Wrap(difficulty, 'g7_simple_interest', 'M7.RP.3.2', 'Simple Interest', {
    question: `$${P} is deposited at a simple interest rate of ${ratePct}% per year for ${t} year${t === 1 ? '' : 's'}. ${ask.text}`,
    answer: ask.val.toFixed(2),
    solution_steps: [
      `Use I = Prt`,
      `I = ${P} × ${r} × ${t} = $${I.toFixed(2)}`,
      ask.key === 'A'
        ? `A = P + I = $${P} + $${I.toFixed(2)} = $${A.toFixed(2)}`
        : `Interest earned: $${I.toFixed(2)}`,
    ],
    answer_type: 'decimal',
  });
}

// 10. M7.RP.3.3 — Percent Increase / Decrease
export function generate_g7_percent_change(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a clean integer percent change by choosing a friendly multiplier.
  const original = randomInt(2, 10) * 10;                   // 20…100
  const direction: 'increase' | 'decrease' = Math.random() < 0.5 ? 'increase' : 'decrease';
  const pct = [10, 15, 20, 25, 30, 40, 50][randomInt(0, 6)]!;
  const delta = +(original * pct / 100).toFixed(2);
  const newVal = direction === 'increase'
    ? +(original + delta).toFixed(2)
    : +(original - delta).toFixed(2);
  // Half the time we ask for the percent; the rest we ask for the new value.
  const askPercent = Math.random() < 0.5 || difficulty === 1;
  if (askPercent) {
    return g7Wrap(difficulty, 'g7_percent_change', 'M7.RP.3.3', 'Percent Increase or Decrease', {
      question: `A value changed from ${original} to ${newVal}. What is the percent ${direction}?`,
      answer: `${pct}%`,
      solution_steps: [
        `Find the change: |${newVal} − ${original}| = ${delta}`,
        `Divide by the original: ${delta} ÷ ${original} = ${(delta / original).toFixed(4)}`,
        `Convert to percent: ${pct}%`,
      ],
      answer_type: 'percent',
    });
  }
  return g7Wrap(difficulty, 'g7_percent_change', 'M7.RP.3.3', 'Percent Increase or Decrease', {
    question: `${original} is ${direction}d by ${pct}%. What is the new value?`,
    answer: String(newVal),
    solution_steps: [
      `Compute ${pct}% of ${original}: ${delta}`,
      direction === 'increase'
        ? `Add: ${original} + ${delta} = ${newVal}`
        : `Subtract: ${original} − ${delta} = ${newVal}`,
    ],
    answer_type: 'decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: Expressions & Equations
// ─────────────────────────────────────────────────────────────────────────────

/** Format a linear term "cx" with sign-aware leading and middle handling. */
function g7FmtTerm(coef: number, variable: string, isFirst: boolean): string {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const coefPart = abs === 1 ? '' : String(abs);
  if (isFirst) {
    return `${coef < 0 ? '-' : ''}${coefPart}${variable}`;
  }
  return `${coef < 0 ? '- ' : '+ '}${coefPart}${variable}`;
}

/** Format a constant with sign-aware middle handling (returns '' when zero). */
function g7FmtConst(c: number, isFirst: boolean): string {
  if (c === 0) return '';
  if (isFirst) return String(c);
  return c < 0 ? `- ${Math.abs(c)}` : `+ ${c}`;
}

/** Format a full ax + b expression, omitting zero terms. */
function g7FmtLinear(a: number, b: number, variable: string = 'x'): string {
  const aPart = g7FmtTerm(a, variable, true);
  if (a === 0 && b === 0) return '0';
  if (a === 0) return String(b);
  if (b === 0) return aPart;
  return `${aPart} ${g7FmtConst(b, false)}`;
}

// 11. M7.EE.1.1 — Adding/Subtracting Linear Expressions
export function generate_g7_add_sub_linear_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 6 : 10;
  let a1: number, a2: number, b1: number, b2: number;
  let op: '+' | '-';
  // Reject trivial (everything cancels) outcomes.
  for (let tries = 0; tries < 8; tries++) {
    a1 = randomNonZeroInt(-range, range);
    a2 = randomNonZeroInt(-range, range);
    b1 = randomInt(-range, range);
    b2 = randomInt(-range, range);
    op = Math.random() < 0.5 ? '+' : '-';
    const aSum = op === '+' ? a1 + a2 : a1 - a2;
    const bSum = op === '+' ? b1 + b2 : b1 - b2;
    if (aSum !== 0 || bSum !== 0) break;
  }
  a1 = a1!; a2 = a2!; b1 = b1!; b2 = b2!; op = op!;
  const aSum = op === '+' ? a1 + a2 : a1 - a2;
  const bSum = op === '+' ? b1 + b2 : b1 - b2;
  const e1 = g7FmtLinear(a1, b1);
  const e2 = g7FmtLinear(a2, b2);
  const answer = g7FmtLinear(aSum, bSum).replace(/\+ /g, '+ ').replace(/- /g, '- ');
  return g7Wrap(difficulty, 'g7_add_sub_linear_expr', 'M7.EE.1.1', 'Adding/Subtracting Linear Expressions', {
    question: `Simplify: (${e1}) ${op} (${e2})`,
    answer,
    solution_steps: [
      `Distribute the sign: ${op === '-' ? `${e1} - ${e2}` : `${e1} + ${e2}`}`,
      `Combine x-terms: ${a1}x ${op} ${a2}x = ${aSum}x`,
      `Combine constants: ${b1} ${op} ${b2} = ${bSum}`,
      `Result: ${answer}`,
    ],
    answer_type: 'expression',
  });
}

// 12. M7.EE.1.3 — Expanding Linear Expressions (Distributive Property)
export function generate_g7_expand_linear_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  const k = randomNonZeroInt(difficulty === 1 ? -5 : -8, difficulty === 1 ? 5 : 8);
  const a = randomNonZeroInt(-6, 6);
  const b = randomNonZeroInt(-8, 8);
  const ka = k * a;
  const kb = k * b;
  const innerSign = b < 0 ? '-' : '+';
  const innerExpr = `${a}x ${innerSign} ${Math.abs(b)}`;
  const kDisplay = k < 0 ? `(${k})` : String(k);
  return g7Wrap(difficulty, 'g7_expand_linear_expr', 'M7.EE.1.3', 'Expanding Linear Expressions', {
    question: `Expand: ${kDisplay}(${innerExpr})`,
    answer: g7FmtLinear(ka, kb),
    solution_steps: [
      `Distribute ${k} across both terms`,
      `${k} × ${a}x = ${ka}x`,
      `${k} × ${b} = ${kb}`,
      `Result: ${g7FmtLinear(ka, kb)}`,
    ],
    answer_type: 'expression',
  });
}

// 13. M7.EE.2.1 — Solving Multi-Step Linear Equations with Rational Coefficients
export function generate_g7_solve_linear_rational(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build ax + b = c. Choose integer solutions for difficulty 1 and
  // rational solutions for difficulty ≥ 2.
  const a = randomNonZeroInt(2, difficulty === 1 ? 6 : 9);
  const xRat = difficulty === 1
    ? g7Rat(randomNonZeroInt(-8, 8))
    : g7RandomRational(6, true);
  const b = randomInt(-10, 10);
  // c = a * x + b
  const cRat = g7RatAdd(g7RatMul(g7Rat(a), xRat), g7Rat(b));
  const aDisplay = a === 1 ? '' : String(a);
  const bSign = b < 0 ? '-' : '+';
  const bDisplay = b === 0 ? '' : ` ${bSign} ${Math.abs(b)}`;
  return g7Wrap(difficulty, 'g7_solve_linear_rational', 'M7.EE.2.1', 'Solving Multi-Step Linear Equations with Rational Coefficients', {
    question: `Solve for x: ${aDisplay}x${bDisplay} = ${g7FmtRat(cRat)}`,
    answer: g7FmtRat(xRat),
    solution_steps: [
      b !== 0
        ? `Subtract ${b > 0 ? b : `(${b})`} from both sides: ${aDisplay}x = ${g7FmtRat(g7RatSub(cRat, g7Rat(b)))}`
        : `Equation is ${aDisplay}x = ${g7FmtRat(cRat)}`,
      a !== 1
        ? `Divide both sides by ${a}: x = ${g7FmtRat(xRat)}`
        : `x = ${g7FmtRat(xRat)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 14. M7.EE.2.2 — Solving Linear Equations with Distribution + Like Terms
export function generate_g7_solve_distrib_like_terms(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build k(ax + b) + dx = e. Choose integer solution to keep step count manageable.
  const k = randomNonZeroInt(2, 5);
  const a = randomNonZeroInt(1, 4);
  const b = randomInt(-6, 6);
  const d = randomNonZeroInt(1, 5);
  const x = randomNonZeroInt(-6, 6);
  // After distribution: ka·x + kb + dx = e  →  (ka + d)x + kb = e
  const lhsCoef = k * a + d;
  if (lhsCoef === 0) return generate_g7_solve_distrib_like_terms(difficulty);
  const lhsConst = k * b;
  const e = lhsCoef * x + lhsConst;
  const innerSign = b < 0 ? '-' : '+';
  const inner = b === 0 ? `${a}x` : `${a}x ${innerSign} ${Math.abs(b)}`;
  const tail = `${d > 0 ? '+ ' : '- '}${Math.abs(d)}x`;
  return g7Wrap(difficulty, 'g7_solve_distrib_like_terms', 'M7.EE.2.2', 'Solving Linear Equations (Distribute + Like Terms)', {
    question: `Solve for x: ${k}(${inner}) ${tail} = ${e}`,
    answer: String(x),
    solution_steps: [
      `Distribute ${k}: ${k * a}x ${k * b >= 0 ? '+' : '-'} ${Math.abs(k * b)} ${tail} = ${e}`,
      `Combine like terms: ${lhsCoef}x ${lhsConst >= 0 ? '+' : '-'} ${Math.abs(lhsConst)} = ${e}`,
      lhsConst !== 0
        ? `Move constant: ${lhsCoef}x = ${e - lhsConst}`
        : `Equation is ${lhsCoef}x = ${e}`,
      `Divide by ${lhsCoef}: x = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 15. M7.RP.3.4 — Converting Between Fraction, Decimal, and Percent
export function generate_g7_fraction_decimal_percent(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated pool of values that have exact conversions for all three forms.
  const pool: Array<{ frac: string; dec: string; pct: string }> = [
    { frac: '1/2',  dec: '0.5',   pct: '50'   },
    { frac: '1/4',  dec: '0.25',  pct: '25'   },
    { frac: '3/4',  dec: '0.75',  pct: '75'   },
    { frac: '1/5',  dec: '0.2',   pct: '20'   },
    { frac: '2/5',  dec: '0.4',   pct: '40'   },
    { frac: '3/5',  dec: '0.6',   pct: '60'   },
    { frac: '4/5',  dec: '0.8',   pct: '80'   },
    { frac: '1/8',  dec: '0.125', pct: '12.5' },
    { frac: '3/8',  dec: '0.375', pct: '37.5' },
    { frac: '5/8',  dec: '0.625', pct: '62.5' },
    { frac: '1/10', dec: '0.1',   pct: '10'   },
    { frac: '3/10', dec: '0.3',   pct: '30'   },
    { frac: '7/10', dec: '0.7',   pct: '70'   },
    { frac: '9/10', dec: '0.9',   pct: '90'   },
  ];
  const pick = pool[randomInt(0, pool.length - 1)]!;
  const forms: Array<{ key: 'frac' | 'dec' | 'pct'; label: string; suffix: string }> = [
    { key: 'frac', label: 'fraction',  suffix: '' },
    { key: 'dec',  label: 'decimal',   suffix: '' },
    { key: 'pct',  label: 'percent',   suffix: '%' },
  ];
  // Pick an input form, then a different output form.
  const inputForm = forms[randomInt(0, 2)]!;
  let outputForm = forms[randomInt(0, 2)]!;
  while (outputForm.key === inputForm.key) outputForm = forms[randomInt(0, 2)]!;
  const inputValue = inputForm.key === 'pct' ? `${pick[inputForm.key]}%` : pick[inputForm.key];
  const answerValue = outputForm.key === 'pct' ? `${pick[outputForm.key]}%` : pick[outputForm.key];
  return g7Wrap(difficulty, 'g7_fraction_decimal_percent', 'M7.RP.3.4', 'Converting Between Fraction, Decimal, and Percent', {
    question: `Convert ${inputValue} to a ${outputForm.label}.`,
    answer: answerValue,
    solution_steps: [
      `Recognise: ${pick.frac} = ${pick.dec} = ${pick.pct}%`,
      `${inputValue} as a ${outputForm.label} is ${answerValue}`,
    ],
    answer_type: 'decimal_or_fraction_or_percent',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: Geometry — angle relationships, circles, area
// ─────────────────────────────────────────────────────────────────────────────

// 16. M7.GEO.1.1 — Angle Relationships (supplementary / complementary / vertical)
export function generate_g7_angle_relationship_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  const relationships: Array<{ kind: string; total: number | null; rule: string }> = [
    { kind: 'supplementary', total: 180,  rule: 'sum to 180°' },
    { kind: 'complementary', total: 90,   rule: 'sum to 90°'  },
    { kind: 'vertical',      total: null, rule: 'are equal'   },
  ];
  const rel = relationships[randomInt(0, 2)]!;
  if (rel.kind === 'vertical') {
    const a = randomInt(15, 165);
    return g7Wrap(difficulty, 'g7_angle_relationship_solve', 'M7.GEO.1.1', 'Angle Relationships', {
      question: `Two vertical angles are formed by intersecting lines. One angle measures ${a}°. What is the measure of the other angle?`,
      answer: String(a),
      solution_steps: [
        `Vertical angles ${rel.rule}.`,
        `The other angle is ${a}°.`,
      ],
      answer_type: 'integer',
    });
  }
  // complementary / supplementary: pick one angle, second = total - first
  const total = rel.total!;
  const a = randomInt(rel.kind === 'complementary' ? 10 : 20, total - (rel.kind === 'complementary' ? 10 : 20));
  const b = total - a;
  return g7Wrap(difficulty, 'g7_angle_relationship_solve', 'M7.GEO.1.1', 'Angle Relationships', {
    question: `Two angles are ${rel.kind}. One angle measures ${a}°. What is the measure of the other angle?`,
    answer: String(b),
    solution_steps: [
      `${rel.kind[0].toUpperCase() + rel.kind.slice(1)} angles ${rel.rule}.`,
      `${total} − ${a} = ${b}°`,
    ],
    answer_type: 'integer',
  });
}

// 17. M7.GEO.2.3 — Circle Area / Circumference
export function generate_g7_circle_area_circumference(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = Math.PI;
  const r = randomInt(difficulty === 1 ? 2 : 3, difficulty === 1 ? 10 : 15);
  const given: 'radius' | 'diameter' = Math.random() < 0.5 ? 'radius' : 'diameter';
  const givenValue = given === 'radius' ? r : 2 * r;
  const solveFor: 'area' | 'circumference' = Math.random() < 0.5 ? 'area' : 'circumference';
  const value = solveFor === 'area' ? PI * r * r : 2 * PI * r;
  const answer = value.toFixed(2);
  return g7Wrap(difficulty, 'g7_circle_area_circumference', 'M7.GEO.2.3', 'Area and Circumference of a Circle', {
    question: `A circle has a ${given} of ${givenValue} cm. Find the ${solveFor}. Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer,
    solution_steps: [
      given === 'diameter'
        ? `Radius = diameter ÷ 2 = ${givenValue} ÷ 2 = ${r}`
        : `Radius = ${r}`,
      solveFor === 'area'
        ? `Area = π × r² = 3.14159 × ${r}² = 3.14159 × ${r * r} ≈ ${answer} cm²`
        : `Circumference = 2 × π × r = 2 × 3.14159 × ${r} ≈ ${answer} cm`,
    ],
    answer_type: 'decimal',
  });
}

// 18. M7.GEO.3.1 — Angle Equations (relationship + algebra)
export function generate_g7_angle_equation_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // Two angles in a relationship: angle1 = ax + b, angle2 = some integer.
  // Solve for x, then report x (the user's spec uses integer answer_type).
  const rels: Array<{ kind: 'supplementary' | 'complementary' | 'vertical'; total: number | 'equal' }> = [
    { kind: 'supplementary', total: 180 },
    { kind: 'complementary', total: 90  },
    { kind: 'vertical',      total: 'equal' },
  ];
  const rel = rels[randomInt(0, 2)]!;
  const a = randomInt(2, difficulty === 1 ? 5 : 8);
  const b = randomInt(5, 30);
  const x = randomInt(3, difficulty === 1 ? 10 : 20);
  const angle1 = a * x + b;
  let angle2: number;
  let setup: string;
  if (rel.total === 'equal') {
    angle2 = angle1;
    setup = `${a}x + ${b} = ${angle2}`;
  } else {
    angle2 = rel.total - angle1;
    if (angle2 <= 0) return generate_g7_angle_equation_solve(difficulty);
    setup = `${a}x + ${b} + ${angle2} = ${rel.total}`;
  }
  return g7Wrap(difficulty, 'g7_angle_equation_solve', 'M7.GEO.3.1', 'Angle Equations with Algebra', {
    question: rel.total === 'equal'
      ? `Two vertical angles measure (${a}x + ${b})° and ${angle2}°. Find x.`
      : `Two ${rel.kind} angles measure (${a}x + ${b})° and ${angle2}°. Find x.`,
    answer: String(x),
    solution_steps: [
      `Set up the equation: ${setup}`,
      rel.total === 'equal'
        ? `Subtract ${b}: ${a}x = ${angle2 - b}`
        : `Combine: ${a}x + ${b + angle2} = ${rel.total}, then ${a}x = ${rel.total - (b + angle2)}`,
      `Divide by ${a}: x = ${x}`,
    ],
    answer_type: 'integer',
  });
}

// 19. M7.GEO.4.1 — Composite Area (rectangle + cutout / L-shape)
export function generate_g7_composite_area(difficulty: DifficultyLevel): GeneratedQuestion {
  // L-shape: large rectangle minus a smaller rectangle cut from one corner.
  const W = randomInt(8, 20);                  // big-rect width
  const H = randomInt(6, 16);                  // big-rect height
  const cw = randomInt(2, Math.max(2, W - 4)); // cutout width
  const ch = randomInt(2, Math.max(2, H - 4)); // cutout height
  const totalArea = W * H - cw * ch;
  return g7Wrap(difficulty, 'g7_composite_area', 'M7.GEO.4.1', 'Composite Area', {
    question: `An L-shape is formed by removing a ${cw} × ${ch} rectangle from one corner of a ${W} × ${H} rectangle. Find the area of the L-shape in square units.`,
    answer: String(totalArea),
    solution_steps: [
      `Area of the large rectangle: ${W} × ${H} = ${W * H}`,
      `Area of the cutout: ${cw} × ${ch} = ${cw * ch}`,
      `Composite area = ${W * H} − ${cw * ch} = ${totalArea}`,
    ],
    answer_type: 'integer',
  });
}

// 20. M7.GEO.4.2 — Area of 2D Shapes (triangle, parallelogram, trapezoid)
export function generate_g7_area_2d_objects(difficulty: DifficultyLevel): GeneratedQuestion {
  const shape = (['triangle', 'parallelogram', 'trapezoid'] as const)[randomInt(0, 2)]!;
  if (shape === 'triangle') {
    // Force even base × height so area is an integer.
    let base = randomInt(4, 20);
    const height = randomInt(3, 16);
    if ((base * height) % 2 !== 0) base += 1;
    const area = (base * height) / 2;
    return g7Wrap(difficulty, 'g7_area_2d_objects', 'M7.GEO.4.2', 'Area of 2D Shapes', {
      question: `Find the area of a triangle with base ${base} cm and height ${height} cm.`,
      answer: String(area),
      solution_steps: [
        `Area of a triangle = ½ × base × height`,
        `= ½ × ${base} × ${height}`,
        `= ${area} cm²`,
      ],
      answer_type: 'integer',
    });
  }
  if (shape === 'parallelogram') {
    const base = randomInt(4, 20);
    const height = randomInt(3, 15);
    const area = base * height;
    return g7Wrap(difficulty, 'g7_area_2d_objects', 'M7.GEO.4.2', 'Area of 2D Shapes', {
      question: `Find the area of a parallelogram with base ${base} cm and height ${height} cm.`,
      answer: String(area),
      solution_steps: [
        `Area of a parallelogram = base × height`,
        `= ${base} × ${height}`,
        `= ${area} cm²`,
      ],
      answer_type: 'integer',
    });
  }
  // trapezoid
  let b1 = randomInt(4, 14);
  let b2 = randomInt(6, 20);
  if (b1 === b2) b2 += 2;
  const height = randomInt(3, 12);
  // Force (b1 + b2) * h to be even so area is an integer.
  if (((b1 + b2) * height) % 2 !== 0) b1 += 1;
  const area = ((b1 + b2) * height) / 2;
  return g7Wrap(difficulty, 'g7_area_2d_objects', 'M7.GEO.4.2', 'Area of 2D Shapes', {
    question: `Find the area of a trapezoid with parallel side lengths ${b1} cm and ${b2} cm, and height ${height} cm.`,
    answer: String(area),
    solution_steps: [
      `Area of a trapezoid = ½ × (b₁ + b₂) × h`,
      `= ½ × (${b1} + ${b2}) × ${height}`,
      `= ½ × ${b1 + b2} × ${height}`,
      `= ${area} cm²`,
    ],
    answer_type: 'integer',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: 3D Volume / Surface Area + Probability
// ─────────────────────────────────────────────────────────────────────────────

// 21. M7.GEO.4.3 — Volume of 3D Objects (rect prism, triangular prism, pyramid)
export function generate_g7_volume_3d_objects(difficulty: DifficultyLevel): GeneratedQuestion {
  const shape = (['rectangular_prism', 'triangular_prism', 'rectangular_pyramid'] as const)[randomInt(0, 2)]!;
  if (shape === 'rectangular_prism') {
    const l = randomInt(3, 12);
    const w = randomInt(3, 12);
    const h = randomInt(2, 10);
    const V = l * w * h;
    return g7Wrap(difficulty, 'g7_volume_3d_objects', 'M7.GEO.4.3', 'Volume of 3D Objects', {
      question: `Find the volume of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm.`,
      answer: String(V),
      solution_steps: [
        `Volume = length × width × height`,
        `= ${l} × ${w} × ${h}`,
        `= ${V} cm³`,
      ],
      answer_type: 'integer',
    });
  }
  if (shape === 'triangular_prism') {
    let b = randomInt(4, 14);
    const trH = randomInt(3, 10);
    const prismH = randomInt(4, 12);
    if ((b * trH) % 2 !== 0) b += 1;
    const baseArea = (b * trH) / 2;
    const V = baseArea * prismH;
    return g7Wrap(difficulty, 'g7_volume_3d_objects', 'M7.GEO.4.3', 'Volume of 3D Objects', {
      question: `A triangular prism has a triangular base with base ${b} cm and height ${trH} cm. The prism is ${prismH} cm long. Find the volume.`,
      answer: String(V),
      solution_steps: [
        `Area of triangular base = ½ × ${b} × ${trH} = ${baseArea} cm²`,
        `Volume = base area × prism length`,
        `= ${baseArea} × ${prismH}`,
        `= ${V} cm³`,
      ],
      answer_type: 'integer',
    });
  }
  // rectangular_pyramid
  let l = randomInt(3, 12);
  let w = randomInt(3, 12);
  const h = randomInt(3, 12);
  // Force (l * w * h) divisible by 3 for an integer volume.
  while ((l * w * h) % 3 !== 0) { l += 1; }
  const V = (l * w * h) / 3;
  return g7Wrap(difficulty, 'g7_volume_3d_objects', 'M7.GEO.4.3', 'Volume of 3D Objects', {
    question: `Find the volume of a rectangular pyramid with base ${l} cm by ${w} cm and height ${h} cm.`,
    answer: String(V),
    solution_steps: [
      `Volume of a pyramid = ⅓ × base area × height`,
      `Base area = ${l} × ${w} = ${l * w} cm²`,
      `Volume = ⅓ × ${l * w} × ${h} = ${V} cm³`,
    ],
    answer_type: 'integer',
  });
}

// 22. M7.GEO.4.4 — Surface Area of 3D Objects (rectangular / triangular prism)
export function generate_g7_surface_area_3d(difficulty: DifficultyLevel): GeneratedQuestion {
  const shape = (['rectangular_prism', 'triangular_prism'] as const)[randomInt(0, 1)]!;
  if (shape === 'rectangular_prism') {
    const l = randomInt(3, 12);
    const w = randomInt(3, 12);
    const h = randomInt(2, 10);
    const SA = 2 * (l * w + l * h + w * h);
    return g7Wrap(difficulty, 'g7_surface_area_3d', 'M7.GEO.4.4', 'Surface Area of 3D Objects', {
      question: `Find the surface area of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm.`,
      answer: String(SA),
      solution_steps: [
        `Surface area = 2(lw + lh + wh)`,
        `= 2(${l}·${w} + ${l}·${h} + ${w}·${h})`,
        `= 2(${l * w} + ${l * h} + ${w * h})`,
        `= 2 × ${l * w + l * h + w * h}`,
        `= ${SA} cm²`,
      ],
      answer_type: 'integer',
    });
  }
  // triangular prism (3-4-5 or 6-8-10 right-triangle base for clean numbers)
  const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13]];
  const [a, b, c] = triples[randomInt(0, 2)]!;
  const len = randomInt(5, 15);
  const baseArea = (a * b) / 2;
  const perim = a + b + c;
  const SA = 2 * baseArea + perim * len;
  return g7Wrap(difficulty, 'g7_surface_area_3d', 'M7.GEO.4.4', 'Surface Area of 3D Objects', {
    question: `A triangular prism has a right-triangle base with legs ${a} cm and ${b} cm (hypotenuse ${c} cm) and is ${len} cm long. Find the surface area.`,
    answer: String(SA),
    solution_steps: [
      `Two triangular bases: 2 × ½ × ${a} × ${b} = ${2 * baseArea} cm²`,
      `Three rectangular faces, total: (${a} + ${b} + ${c}) × ${len} = ${perim} × ${len} = ${perim * len} cm²`,
      `Surface area = ${2 * baseArea} + ${perim * len} = ${SA} cm²`,
    ],
    answer_type: 'integer',
  });
}

// 23. M7.SP.3.3 — Theoretical Probability
export function generate_g7_theoretical_probability(difficulty: DifficultyLevel): GeneratedQuestion {
  const exp = (['dice', 'coins', 'marbles', 'spinner'] as const)[randomInt(0, 3)]!;
  if (exp === 'dice') {
    const targets: Array<{ desc: string; favorable: number; total: number; reduce: [number, number] }> = [
      { desc: 'rolling a number greater than 4',  favorable: 2, total: 6, reduce: [1, 3] },
      { desc: 'rolling an even number',           favorable: 3, total: 6, reduce: [1, 2] },
      { desc: 'rolling a prime number',           favorable: 3, total: 6, reduce: [1, 2] },
      { desc: 'rolling a multiple of 3',          favorable: 2, total: 6, reduce: [1, 3] },
      { desc: 'rolling less than 3',              favorable: 2, total: 6, reduce: [1, 3] },
    ];
    const t = targets[randomInt(0, targets.length - 1)]!;
    const [rn, rd] = t.reduce;
    return g7Wrap(difficulty, 'g7_theoretical_probability', 'M7.SP.3.3', 'Theoretical Probability', {
      question: `What is the probability of ${t.desc} on a fair six-sided die?`,
      answer: `${rn}/${rd}`,
      solution_steps: [
        `Favorable outcomes: ${t.favorable}`,
        `Total outcomes: ${t.total}`,
        `P = ${t.favorable}/${t.total} = ${rn}/${rd}`,
      ],
      answer_type: 'fraction',
    });
  }
  if (exp === 'coins') {
    // Three coin flips — probability of exactly N heads.
    const target = randomInt(0, 3);
    // Combinations: C(3,0)=1, C(3,1)=3, C(3,2)=3, C(3,3)=1
    const combos = [1, 3, 3, 1][target]!;
    const total = 8;
    const [rn, rd] = simplifyFraction(combos, total);
    return g7Wrap(difficulty, 'g7_theoretical_probability', 'M7.SP.3.3', 'Theoretical Probability', {
      question: `Three fair coins are flipped. What is the probability of getting exactly ${target} head${target === 1 ? '' : 's'}?`,
      answer: `${rn}/${rd}`,
      solution_steps: [
        `Total outcomes: 2³ = 8`,
        `Favorable: C(3, ${target}) = ${combos}`,
        `P = ${combos}/8 = ${rn}/${rd}`,
      ],
      answer_type: 'fraction',
    });
  }
  if (exp === 'marbles') {
    const red = randomInt(2, 6);
    const blue = randomInt(2, 6);
    const green = randomInt(1, 4);
    const total = red + blue + green;
    const colors: Array<['red'|'blue'|'green', number]> = [['red', red], ['blue', blue], ['green', green]];
    const pick = colors[randomInt(0, 2)]!;
    const [rn, rd] = simplifyFraction(pick[1], total);
    return g7Wrap(difficulty, 'g7_theoretical_probability', 'M7.SP.3.3', 'Theoretical Probability', {
      question: `A bag contains ${red} red, ${blue} blue, and ${green} green marbles. What is the probability of drawing a ${pick[0]} marble?`,
      answer: `${rn}/${rd}`,
      solution_steps: [
        `Total marbles: ${red} + ${blue} + ${green} = ${total}`,
        `Favorable: ${pick[1]} ${pick[0]} marbles`,
        `P = ${pick[1]}/${total} = ${rn}/${rd}`,
      ],
      answer_type: 'fraction',
    });
  }
  // spinner — equal sectors
  const sectors = [4, 5, 6, 8][randomInt(0, 3)]!;
  const favorable = randomInt(1, sectors - 1);
  const [rn, rd] = simplifyFraction(favorable, sectors);
  return g7Wrap(difficulty, 'g7_theoretical_probability', 'M7.SP.3.3', 'Theoretical Probability', {
    question: `A spinner is divided into ${sectors} equal sectors. ${favorable} sector${favorable === 1 ? ' is' : 's are'} shaded. What is the probability of landing on a shaded sector?`,
    answer: `${rn}/${rd}`,
    solution_steps: [
      `Favorable outcomes: ${favorable}`,
      `Total outcomes: ${sectors}`,
      `P = ${favorable}/${sectors} = ${rn}/${rd}`,
    ],
    answer_type: 'fraction',
  });
}

// 24. M7.SP.3.2 — Experimental Probability (frequency table)
export function generate_g7_experimental_probability(difficulty: DifficultyLevel): GeneratedQuestion {
  const total = [20, 25, 40, 50][randomInt(0, 3)]!;
  // Generate 4 outcomes whose counts sum to total.
  const outcomes = ['A', 'B', 'C', 'D'];
  const c1 = randomInt(2, Math.floor(total / 3));
  const c2 = randomInt(2, Math.floor(total / 3));
  const c3 = randomInt(2, Math.floor(total / 3));
  const c4 = total - c1 - c2 - c3;
  if (c4 <= 0) return generate_g7_experimental_probability(difficulty);
  const counts = [c1, c2, c3, c4];
  const idx = randomInt(0, 3);
  const target = outcomes[idx]!;
  const favorable = counts[idx]!;
  const [rn, rd] = simplifyFraction(favorable, total);
  const tableLines = outcomes.map((o, i) => `${o}: ${counts[i]}`).join(', ');
  return g7Wrap(difficulty, 'g7_experimental_probability', 'M7.SP.3.2', 'Experimental Probability', {
    question: `A spinner was spun ${total} times with the results — ${tableLines}. Based on the data, what is the experimental probability of landing on ${target}?`,
    answer: `${rn}/${rd}`,
    solution_steps: [
      `Total trials: ${total}`,
      `Outcomes matching ${target}: ${favorable}`,
      `P = ${favorable}/${total} = ${rn}/${rd}`,
    ],
    answer_type: 'fraction',
  });
}

// 25. M7.SP.4.1 — Compound Probability (independent events)
export function generate_g7_compound_probability(difficulty: DifficultyLevel): GeneratedQuestion {
  // BUG 4 fix: scenario pool expanded to 24+ entries (4 spinner sizes × 3
  // coin types × 3 die types + custom mixes) so repeated outputs from
  // independent calls are statistically rare. Sub-event descriptions are
  // varied too so two scenarios sharing P=1/12 still read differently.
  type Event = { desc: string; num: number; den: number };
  const dieTypes: Array<{ sides: number; targets: Event[] }> = [
    { sides: 4, targets: [
      { desc: 'rolling a 4 on a 4-sided die',            num: 1, den: 4 },
      { desc: 'rolling an even number on a 4-sided die', num: 1, den: 2 },
    ]},
    { sides: 6, targets: [
      { desc: 'rolling a 6 on a 6-sided die',            num: 1, den: 6 },
      { desc: 'rolling an even number on a 6-sided die', num: 1, den: 2 },
      { desc: 'rolling a number greater than 4 on a 6-sided die', num: 1, den: 3 },
    ]},
    { sides: 8, targets: [
      { desc: 'rolling an 8 on an 8-sided die',          num: 1, den: 8 },
      { desc: 'rolling a multiple of 3 on an 8-sided die', num: 1, den: 4 },
    ]},
  ];
  const coinTypes: Event[] = [
    { desc: 'flipping heads on a fair coin', num: 1, den: 2 },
    { desc: 'flipping tails on a penny',     num: 1, den: 2 },
    { desc: 'flipping heads on a quarter',   num: 1, den: 2 },
  ];
  const spinners: Array<{ sectors: number; targets: Event[] }> = [
    { sectors: 3, targets: [
      { desc: 'landing on red on a 3-sector spinner',    num: 1, den: 3 },
      { desc: 'landing on green on a 3-sector spinner',  num: 1, den: 3 },
    ]},
    { sectors: 4, targets: [
      { desc: 'landing on red on a 4-sector spinner',    num: 1, den: 4 },
      { desc: 'landing on blue on a 4-sector spinner',   num: 1, den: 4 },
    ]},
    { sectors: 5, targets: [
      { desc: 'landing on sector 3 on a 5-sector spinner', num: 1, den: 5 },
      { desc: 'landing on yellow on a 5-sector spinner', num: 1, den: 5 },
    ]},
    { sectors: 6, targets: [
      { desc: 'landing on sector 6 on a 6-sector spinner', num: 1, den: 6 },
      { desc: 'landing on purple on a 6-sector spinner', num: 1, den: 6 },
    ]},
  ];

  const dieT = dieTypes[randomInt(0, dieTypes.length - 1)]!;
  const coinT = coinTypes[randomInt(0, coinTypes.length - 1)]!;
  const spinT = spinners[randomInt(0, spinners.length - 1)]!;
  const dieEvt = dieT.targets[randomInt(0, dieT.targets.length - 1)]!;
  const spinEvt = spinT.targets[randomInt(0, spinT.targets.length - 1)]!;

  // Three scenario shapes: die+coin, coin+spinner, die+spinner.
  const shapes: Array<{ desc: string; eventA: Event; eventB: Event }> = [
    {
      desc: `a fair ${dieT.sides}-sided die and a coin`,
      eventA: dieEvt,
      eventB: coinT,
    },
    {
      desc: `a coin and a ${spinT.sectors}-sector spinner`,
      eventA: coinT,
      eventB: spinEvt,
    },
    {
      desc: `a fair ${dieT.sides}-sided die and a ${spinT.sectors}-sector spinner`,
      eventA: dieEvt,
      eventB: spinEvt,
    },
  ];
  const sc = shapes[randomInt(0, shapes.length - 1)]!;
  const num = sc.eventA.num * sc.eventB.num;
  const den = sc.eventA.den * sc.eventB.den;
  const [rn, rd] = simplifyFraction(num, den);
  return g7Wrap(difficulty, 'g7_compound_probability', 'M7.SP.4.1', 'Compound Probability', {
    question: `Using ${sc.desc}, what is the probability of ${sc.eventA.desc} AND ${sc.eventB.desc}?`,
    answer: `${rn}/${rd}`,
    solution_steps: [
      `P(A) = ${sc.eventA.num}/${sc.eventA.den}`,
      `P(B) = ${sc.eventB.num}/${sc.eventB.den}`,
      `Independent events: P(A and B) = P(A) × P(B) = ${num}/${den} = ${rn}/${rd}`,
    ],
    answer_type: 'fraction',
  });
}

// =============================================================================
// =============================================================================
// NC GRADE 8 — CONTENDERS DIVISION (pool: nc_grade_8)
// =============================================================================
// =============================================================================
// Same wrapping pattern as the G7 block — every generator returns a
// GeneratedQuestion via g7Wrap() so it plugs into the existing pipeline.
// Pool isolation: every generator_type uses the `g8_` prefix.

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: Real Number System
// ─────────────────────────────────────────────────────────────────────────────

// 1. M8.NS.2.1 — Evaluate Square Roots and Cube Roots of Perfect Powers
export function generate_g8_eval_roots(difficulty: DifficultyLevel): GeneratedQuestion {
  const squareBases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const cubeBases   = [1, 2, 3, 4, 5, 6, 7, 8];
  const useCube = difficulty >= 2 && Math.random() < 0.5;
  if (useCube) {
    const k = cubeBases[randomInt(0, cubeBases.length - 1)]!;
    const n = k * k * k;
    return g7Wrap(difficulty, 'g8_eval_roots', 'M8.NS.2.1', 'Evaluate Square and Cube Roots', {
      question: `Evaluate: ∛${n}`,
      answer: String(k),
      solution_steps: [
        `Find the integer whose cube is ${n}.`,
        `${k}³ = ${k} × ${k} × ${k} = ${n}`,
        `Therefore ∛${n} = ${k}.`,
      ],
      answer_type: 'integer',
    });
  }
  const k = squareBases[randomInt(0, squareBases.length - 1)]!;
  const n = k * k;
  return g7Wrap(difficulty, 'g8_eval_roots', 'M8.NS.2.1', 'Evaluate Square and Cube Roots', {
    question: `Evaluate: √${n}`,
    answer: String(k),
    solution_steps: [
      `Find the non-negative integer whose square is ${n}.`,
      `${k} × ${k} = ${n}`,
      `Therefore √${n} = ${k}.`,
    ],
    answer_type: 'integer',
  });
}

// 2. M8.NS.2.2 — Solve x² = p
export function generate_g8_solve_square_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use perfect squares so the answer is a clean ±k integer pair.
  const squareBases = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const k = squareBases[randomInt(0, squareBases.length - 1)]!;
  const p = k * k;
  const answer = `±${k}`;
  return g7Wrap(difficulty, 'g8_solve_square_eq', 'M8.NS.2.2', 'Solving x² = p', {
    question: `Solve for x: x² = ${p}`,
    answer,
    solution_steps: [
      `Take the square root of both sides: x = ±√${p}`,
      `√${p} = ${k} (since ${k}² = ${p})`,
      `So x = ±${k}.`,
    ],
    answer_type: 'text',
  });
}

// 3. M8.NS.2.3 — Solve x³ = p
export function generate_g8_solve_cube_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  const cubeBases = [-8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8];
  const k = cubeBases[randomInt(0, cubeBases.length - 1)]!;
  const p = k * k * k;
  return g7Wrap(difficulty, 'g8_solve_cube_eq', 'M8.NS.2.3', 'Solving x³ = p', {
    question: `Solve for x: x³ = ${p}`,
    answer: String(k),
    solution_steps: [
      `Take the cube root of both sides: x = ∛${p}`,
      `Look for the integer whose cube is ${p}: ${k}³ = ${p}.`,
      `So x = ${k}.`,
    ],
    answer_type: 'integer',
  });
}

// 4. M8.NS.3.3 — Compare Two Irrational Numbers
export function generate_g8_compare_irrationals(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated pairs where the answer is well-defined and easy to verify
  // (decimal approximations only used for the solution_steps, never in the
  // question itself).
  const pairs: Array<{ a: string; aVal: number; b: string; bVal: number }> = [
    { a: '√2',  aVal: Math.SQRT2,        b: '√3',  bVal: Math.sqrt(3) },
    { a: '√5',  aVal: Math.sqrt(5),       b: 'π/2', bVal: Math.PI / 2  },
    { a: '√10', aVal: Math.sqrt(10),      b: '3.1', bVal: 3.1          },
    { a: '√7',  aVal: Math.sqrt(7),       b: '2.6', bVal: 2.6          },
    { a: '∛8',  aVal: 2,                  b: '√3',  bVal: Math.sqrt(3) },
    { a: '√50', aVal: Math.sqrt(50),      b: '7',   bVal: 7            },
    { a: 'π',   aVal: Math.PI,            b: '√10', bVal: Math.sqrt(10) },
    { a: '∛27', aVal: 3,                  b: '√8',  bVal: Math.sqrt(8) },
  ];
  const p = pairs[randomInt(0, pairs.length - 1)]!;
  const larger = p.aVal > p.bVal ? p.a : p.b;
  return g7Wrap(difficulty, 'g8_compare_irrationals', 'M8.NS.3.3', 'Comparing Irrational Numbers', {
    question: `Which is greater: ${p.a} or ${p.b}? (Enter the larger expression exactly as shown.)`,
    answer: larger,
    solution_steps: [
      `Approximate each value:`,
      `${p.a} ≈ ${p.aVal.toFixed(3)}`,
      `${p.b} ≈ ${p.bVal.toFixed(3)}`,
      `Therefore ${larger} is greater.`,
    ],
    answer_type: 'text',
  });
}

// 5. M8.EE.1.1 — Simplify Integer-Exponent Expressions
export function generate_g8_simplify_exponents(difficulty: DifficultyLevel): GeneratedQuestion {
  const rules = ['product', 'quotient', 'power_of_power', 'zero', 'negative'] as const;
  const rule = rules[randomInt(0, rules.length - 1)]!;

  if (rule === 'product') {
    const a = randomInt(2, difficulty === 1 ? 4 : 7);
    const b = randomInt(2, difficulty === 1 ? 4 : 7);
    return g7Wrap(difficulty, 'g8_simplify_exponents', 'M8.EE.1.1', 'Integer Exponent Rules', {
      question: `Simplify: x^${a} · x^${b}`,
      answer: `x^${a + b}`,
      solution_steps: [
        `Product rule: x^a · x^b = x^(a+b)`,
        `${a} + ${b} = ${a + b}`,
        `= x^${a + b}`,
      ],
      answer_type: 'expression',
    });
  }
  if (rule === 'quotient') {
    const a = randomInt(4, difficulty === 1 ? 8 : 12);
    const b = randomInt(1, a - 1);
    return g7Wrap(difficulty, 'g8_simplify_exponents', 'M8.EE.1.1', 'Integer Exponent Rules', {
      question: `Simplify: x^${a} / x^${b}`,
      answer: `x^${a - b}`,
      solution_steps: [
        `Quotient rule: x^a / x^b = x^(a-b)`,
        `${a} − ${b} = ${a - b}`,
        `= x^${a - b}`,
      ],
      answer_type: 'expression',
    });
  }
  if (rule === 'power_of_power') {
    const a = randomInt(2, difficulty === 1 ? 4 : 6);
    const b = randomInt(2, difficulty === 1 ? 3 : 5);
    return g7Wrap(difficulty, 'g8_simplify_exponents', 'M8.EE.1.1', 'Integer Exponent Rules', {
      question: `Simplify: (x^${a})^${b}`,
      answer: `x^${a * b}`,
      solution_steps: [
        `Power of a power: (x^a)^b = x^(a·b)`,
        `${a} × ${b} = ${a * b}`,
        `= x^${a * b}`,
      ],
      answer_type: 'expression',
    });
  }
  if (rule === 'zero') {
    const a = randomNonZeroInt(2, 9);
    return g7Wrap(difficulty, 'g8_simplify_exponents', 'M8.EE.1.1', 'Integer Exponent Rules', {
      question: `Simplify: ${a}x^0`,
      answer: String(a),
      solution_steps: [
        `Zero-exponent rule: any non-zero base raised to 0 equals 1.`,
        `x^0 = 1`,
        `${a} × 1 = ${a}`,
      ],
      answer_type: 'expression',
    });
  }
  // negative
  const n = randomInt(2, difficulty === 1 ? 4 : 6);
  return g7Wrap(difficulty, 'g8_simplify_exponents', 'M8.EE.1.1', 'Integer Exponent Rules', {
    question: `Write with a positive exponent: x^-${n}`,
    answer: `1/x^${n}`,
    solution_steps: [
      `Negative-exponent rule: x^-n = 1/x^n`,
      `So x^-${n} = 1/x^${n}.`,
    ],
    answer_type: 'expression',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: Expressions & Equations (G8)
// ─────────────────────────────────────────────────────────────────────────────

// 6. M8.EE.2.1 — Solve Multi-Step Linear Equations with Rational Coefficients
export function generate_g8_solve_linear_multistep(difficulty: DifficultyLevel): GeneratedQuestion {
  // Structure: a(bx + c) = d  →  expand, then solve.
  const a = randomNonZeroInt(2, 5);
  const b = randomNonZeroInt(1, difficulty === 1 ? 4 : 7);
  const c = randomInt(-8, 8);
  // Pick a clean rational solution
  const xRat = difficulty === 1
    ? g7Rat(randomNonZeroInt(-6, 6))
    : g7RandomRational(6, true);
  // d = a * (b * x + c)
  const innerVal = g7RatAdd(g7RatMul(g7Rat(b), xRat), g7Rat(c));
  const d = g7RatMul(g7Rat(a), innerVal);
  const cSign = c >= 0 ? '+' : '-';
  return g7Wrap(difficulty, 'g8_solve_linear_multistep', 'M8.EE.2.1', 'Multi-Step Linear Equations', {
    question: `Solve for x: ${a}(${b}x ${cSign} ${Math.abs(c)}) = ${g7FmtRat(d)}`,
    answer: g7FmtRat(xRat),
    solution_steps: [
      `Distribute ${a}: ${a * b}x ${cSign} ${Math.abs(a * c)} = ${g7FmtRat(d)}`,
      c !== 0
        ? `Subtract ${a * c >= 0 ? a * c : `(${a * c})`} from both sides: ${a * b}x = ${g7FmtRat(g7RatSub(d, g7Rat(a * c)))}`
        : `Equation is ${a * b}x = ${g7FmtRat(d)}`,
      a * b !== 1
        ? `Divide by ${a * b}: x = ${g7FmtRat(xRat)}`
        : `x = ${g7FmtRat(xRat)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 7. M8.EE.2.2 — Solve Equations with Variables on Both Sides
export function generate_g8_solve_vars_both_sides(difficulty: DifficultyLevel): GeneratedQuestion {
  // ax + b = cx + d, with a != c so the equation has a unique solution.
  let a: number, c: number;
  do {
    a = randomNonZeroInt(-6, 6);
    c = randomNonZeroInt(-6, 6);
  } while (a === c);
  const b = randomInt(-12, 12);
  const x = randomInt(-6, 6);
  const d = a * x + b - c * x;
  const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  const cPart = c === 1 ? 'x' : c === -1 ? '-x' : `${c}x`;
  const bPart = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  const dPart = d === 0 ? '' : d > 0 ? ` + ${d}` : ` - ${Math.abs(d)}`;
  return g7Wrap(difficulty, 'g8_solve_vars_both_sides', 'M8.EE.2.2', 'Variables on Both Sides', {
    question: `Solve for x: ${aPart}${bPart} = ${cPart}${dPart}`,
    answer: String(x),
    solution_steps: [
      `Subtract ${cPart} from both sides: ${a - c}x${bPart} = ${d}`,
      b !== 0
        ? `Subtract ${b} from both sides: ${a - c}x = ${d - b}`
        : `Equation is ${a - c}x = ${d - b}`,
      `Divide both sides by ${a - c}: x = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 8. M8.F.1.4 — Evaluate Function Notation
export function generate_g8_evaluate_function_notation(difficulty: DifficultyLevel): GeneratedQuestion {
  const useQuadratic = difficulty >= 2 && Math.random() < 0.4;
  const input = randomNonZeroInt(-5, 8);
  if (useQuadratic) {
    const a = randomNonZeroInt(1, 3);
    const b = randomInt(-6, 6);
    const c = randomInt(-8, 8);
    const result = a * input * input + b * input + c;
    const bSign = b >= 0 ? '+' : '-';
    const cSign = c >= 0 ? '+' : '-';
    const fStr = `${a === 1 ? '' : a}x² ${bSign} ${Math.abs(b)}x ${cSign} ${Math.abs(c)}`;
    return g7Wrap(difficulty, 'g8_evaluate_function_notation', 'M8.F.1.4', 'Evaluating Function Notation', {
      question: `If f(x) = ${fStr}, find f(${input}).`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${input}: ${a}(${input})² ${bSign} ${Math.abs(b)}(${input}) ${cSign} ${Math.abs(c)}`,
        `= ${a * input * input} ${bSign} ${Math.abs(b * input)} ${cSign} ${Math.abs(c)}`,
        `= ${result}`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  const a = randomNonZeroInt(-5, 5);
  const b = randomInt(-10, 10);
  const result = a * input + b;
  const bSign = b >= 0 ? '+' : '-';
  const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  return g7Wrap(difficulty, 'g8_evaluate_function_notation', 'M8.F.1.4', 'Evaluating Function Notation', {
    question: `If f(x) = ${aPart} ${bSign} ${Math.abs(b)}, find f(${input}).`,
    answer: String(result),
    solution_steps: [
      `Substitute x = ${input}: ${a}(${input}) ${bSign} ${Math.abs(b)}`,
      `= ${a * input} ${bSign} ${Math.abs(b)}`,
      `= ${result}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 9. M8.F.2.3 — Classify Equation as Linear or Nonlinear
export function generate_g8_classify_equation_type(difficulty: DifficultyLevel): GeneratedQuestion {
  const linearExamples = [
    'y = 3x - 2',
    'y = -x + 5',
    '2x + y = 7',
    'y = (1/2)x + 4',
    'y = 0.5x',
    '3x - 4y = 12',
  ];
  const nonlinearExamples = [
    'y = x²',
    'y = 1/x',
    'y = √x',
    'y = 2^x',
    'y = x² + 3x - 1',
    'y = x³ - 2',
    'xy = 6',
  ];
  const isLinear = Math.random() < 0.5;
  const pool = isLinear ? linearExamples : nonlinearExamples;
  const eqn = pool[randomInt(0, pool.length - 1)]!;
  const answer = isLinear ? 'linear' : 'nonlinear';
  return g7Wrap(difficulty, 'g8_classify_equation_type', 'M8.F.2.3', 'Classifying Linear vs Nonlinear', {
    question: `Classify the equation as linear or nonlinear: ${eqn}\n\nEnter exactly "linear" or "nonlinear".`,
    answer,
    solution_steps: [
      isLinear
        ? `The equation only contains x and y raised to the first power, so it is linear.`
        : `The equation contains x or y raised to a power other than 1 (or has variables in a denominator / exponent / root), so it is nonlinear.`,
      `Answer: ${answer}`,
    ],
    answer_type: 'text',
  });
}

// 10. M8.EE.3.3 — Solve 2x2 System by Substitution
export function generate_g8_solve_system_substitution(difficulty: DifficultyLevel): GeneratedQuestion {
  // System:  y = mx + b
  //          y = nx + c    (n ≠ m so the system has a unique solution)
  let m: number, n: number;
  do {
    m = randomNonZeroInt(-4, 4);
    n = randomNonZeroInt(-4, 4);
  } while (n === m);
  // Choose integer solution
  const x = randomInt(-5, 5);
  const yIntercept1 = randomInt(-8, 8);
  const y = m * x + yIntercept1;
  // Back-solve b for equation 2 so it passes through (x, y)
  const yIntercept2 = y - n * x;
  const fmt = (slope: number, intercept: number): string => {
    const slopePart = slope === 1 ? 'x' : slope === -1 ? '-x' : `${slope}x`;
    if (intercept === 0) return `y = ${slopePart}`;
    return `y = ${slopePart} ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept)}`;
  };
  return g7Wrap(difficulty, 'g8_solve_system_substitution', 'M8.EE.3.3', 'Solving Systems by Substitution', {
    question: `Solve the system by substitution:\n${fmt(m, yIntercept1)}\n${fmt(n, yIntercept2)}\n\nEnter the solution as an ordered pair (x, y).`,
    answer: `(${x}, ${y})`,
    solution_steps: [
      `Both equations are solved for y. Set them equal: ${m}x ${yIntercept1 >= 0 ? '+' : '-'} ${Math.abs(yIntercept1)} = ${n}x ${yIntercept2 >= 0 ? '+' : '-'} ${Math.abs(yIntercept2)}`,
      `Combine x-terms: ${m - n}x = ${yIntercept2 - yIntercept1}`,
      `Divide: x = ${x}`,
      `Substitute back: y = ${m}(${x}) ${yIntercept1 >= 0 ? '+' : '-'} ${Math.abs(yIntercept1)} = ${y}`,
      `Solution: (${x}, ${y})`,
    ],
    answer_type: 'ordered_pair',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: Functions & Geometry (G8)
// ─────────────────────────────────────────────────────────────────────────────

// 11. M8.EE.3.4 — Solve 2x2 System by Elimination
export function generate_g8_solve_system_elimination(difficulty: DifficultyLevel): GeneratedQuestion {
  // Standard form: a1·x + b1·y = c1, a2·x + b2·y = c2
  // Force unique solution: determinant a1*b2 - a2*b1 ≠ 0.
  let a1: number, b1: number, a2: number, b2: number;
  let det = 0;
  for (let tries = 0; tries < 10; tries++) {
    a1 = randomNonZeroInt(1, 5);
    b1 = randomNonZeroInt(1, 5);
    a2 = randomNonZeroInt(-5, 5);
    b2 = randomNonZeroInt(-5, 5);
    det = a1 * b2 - a2 * b1;
    if (det !== 0) break;
  }
  a1 = a1!; b1 = b1!; a2 = a2!; b2 = b2!;
  // Integer solution for cleanliness
  const x = randomInt(-5, 5);
  const y = randomInt(-5, 5);
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  // Multiplier to eliminate x: scale eq2 by a1, scale eq1 by a2, subtract.
  const eq = (a: number, b: number, c: number): string => {
    const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
    const bPart = b === 1 ? 'y' : b === -1 ? '-y' : `${b}y`;
    const sign = b >= 0 ? '+' : '-';
    return `${aPart} ${sign} ${Math.abs(b)}y = ${c}`.replace(`${Math.abs(b)}y`, b === 1 || b === -1 ? 'y' : `${Math.abs(b)}y`);
  };
  return g7Wrap(difficulty, 'g8_solve_system_elimination', 'M8.EE.3.4', 'Solving Systems by Elimination', {
    question: `Solve the system by elimination:\n${eq(a1, b1, c1)}\n${eq(a2, b2, c2)}\n\nEnter the solution as an ordered pair (x, y).`,
    answer: `(${x}, ${y})`,
    solution_steps: [
      `Multiply equation 1 by ${a2} and equation 2 by ${a1} so the x-coefficients match.`,
      `Subtract to eliminate x and solve for y: y = ${y}`,
      `Substitute y = ${y} into either equation to find x = ${x}`,
      `Solution: (${x}, ${y})`,
    ],
    answer_type: 'ordered_pair',
  });
}

// 12. M8.F.3.2 — Construct Linear Function from a Table
export function generate_g8_construct_linear_function(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-5, 5);
  const b = randomInt(-10, 10);
  const xs = [0, 1, 2, 3];
  const ys = xs.map((x) => m * x + b);
  const tableLines = xs.map((x, i) => `  x=${x}, y=${ys[i]}`).join('\n');
  const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  const answer = b === 0
    ? `y = ${slopePart}`
    : `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  return g7Wrap(difficulty, 'g8_construct_linear_function', 'M8.F.3.2', 'Constructing a Linear Function from a Table', {
    question: `The table below shows a linear relationship. Write the equation in slope-intercept form y = mx + b.\n\n${tableLines}`,
    answer,
    solution_steps: [
      `Slope: (${ys[1]} − ${ys[0]}) / (1 − 0) = ${m}`,
      `y-intercept (at x = 0): ${ys[0]}`,
      `Equation: ${answer}`,
    ],
    answer_type: 'equation',
  });
}

// 13. M8.GEO.TRANS.3.2 — Apply Dilation to a Point
export function generate_g8_coordinate_dilation(difficulty: DifficultyLevel): GeneratedQuestion {
  // Choose a scale factor that keeps integer coordinates: integers 2,3,4 or
  // 1/2 with even original coords.
  const useFraction = difficulty >= 2 && Math.random() < 0.4;
  let k: number;
  let x: number, y: number;
  if (useFraction) {
    k = 0.5;
    x = randomNonZeroInt(-5, 5) * 2;
    y = randomNonZeroInt(-5, 5) * 2;
  } else {
    k = [2, 3, 4][randomInt(0, 2)]!;
    x = randomNonZeroInt(-6, 6);
    y = randomNonZeroInt(-6, 6);
  }
  const newX = k * x;
  const newY = k * y;
  const kDisplay = k === 0.5 ? '1/2' : String(k);
  return g7Wrap(difficulty, 'g8_coordinate_dilation', 'M8.GEO.TRANS.3.2', 'Dilation about the Origin', {
    question: `The point (${x}, ${y}) is dilated about the origin with scale factor ${kDisplay}. What are the coordinates of its image? Enter as (x, y).`,
    answer: `(${newX}, ${newY})`,
    solution_steps: [
      `Dilation about the origin maps (x, y) → (kx, ky).`,
      `New x = ${kDisplay} × ${x} = ${newX}`,
      `New y = ${kDisplay} × ${y} = ${newY}`,
      `Image: (${newX}, ${newY})`,
    ],
    answer_type: 'ordered_pair',
  });
}

// 14. M8.GEO.TRANS.5.2 — Similar Figures: Find a Missing Side
export function generate_g8_similar_figures_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // Two similar triangles; given 3 sides plus 1 side on the bigger, find the
  // fourth. Use a clean scale factor.
  const scaleFactors = [2, 3, 1.5, 2.5, 4];
  const k = scaleFactors[randomInt(0, scaleFactors.length - 1)]!;
  const smallA = randomInt(3, 8);
  const smallB = randomInt(4, 10);
  const smallC = randomInt(5, 12);
  const bigA = +(smallA * k).toFixed(2);
  const bigBKnown = +(smallB * k).toFixed(2);
  // missing side: bigC
  const bigC = +(smallC * k).toFixed(2);
  return g7Wrap(difficulty, 'g8_similar_figures_solve', 'M8.GEO.TRANS.5.2', 'Similar Figures — Missing Side', {
    question: `Triangle ABC is similar to triangle DEF. AB = ${smallA}, BC = ${smallB}, AC = ${smallC}. DE = ${bigA} and EF = ${bigBKnown}. Find DF.`,
    answer: String(bigC),
    solution_steps: [
      `Set up the ratio of corresponding sides: DE/AB = ${bigA}/${smallA} = ${k}`,
      `Verify: EF/BC = ${bigBKnown}/${smallB} = ${k} ✓`,
      `DF/AC = ${k}, so DF = ${k} × ${smallC} = ${bigC}`,
    ],
    answer_type: 'decimal',
  });
}

// 15. M8.GEO.TRANS.6.2 — Triangle Angle Sum
export function generate_g8_triangle_angle_sum(difficulty: DifficultyLevel): GeneratedQuestion {
  // Two angles given as integers; find the third.
  const a = randomInt(20, 100);
  const b = randomInt(20, Math.min(140, 175 - a));
  const c = 180 - a - b;
  if (c < 5) return generate_g8_triangle_angle_sum(difficulty);
  return g7Wrap(difficulty, 'g8_triangle_angle_sum', 'M8.GEO.TRANS.6.2', 'Triangle Angle Sum', {
    question: `Two angles of a triangle measure ${a}° and ${b}°. What is the measure of the third angle?`,
    answer: String(c),
    solution_steps: [
      `The angles of a triangle sum to 180°.`,
      `Third angle = 180° − ${a}° − ${b}° = ${c}°`,
    ],
    answer_type: 'integer',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: Pythagorean Theorem (G8)
// ─────────────────────────────────────────────────────────────────────────────

// 16. M8.GEO.PV.1.2 — Pythagorean: Find Missing Side
export function generate_g8_pythagorean_missing_side(difficulty: DifficultyLevel): GeneratedQuestion {
  const triples: Array<[number, number, number]> = [
    [3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [9, 40, 41],
  ];
  const [a, b, c] = triples[randomInt(0, triples.length - 1)]!;
  const findHypotenuse = Math.random() < 0.5;
  if (findHypotenuse) {
    return g7Wrap(difficulty, 'g8_pythagorean_missing_side', 'M8.GEO.PV.1.2', 'Pythagorean Theorem — Find Missing Side', {
      question: `A right triangle has legs of length ${a} and ${b}. Find the length of the hypotenuse.`,
      answer: String(c),
      solution_steps: [
        `Pythagorean theorem: a² + b² = c²`,
        `${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}`,
        `c = √${a * a + b * b} = ${c}`,
      ],
      answer_type: 'decimal',
    });
  }
  // find a leg given the other leg and hypotenuse
  const missingIsA = Math.random() < 0.5;
  const knownLeg = missingIsA ? b : a;
  const missing = missingIsA ? a : b;
  return g7Wrap(difficulty, 'g8_pythagorean_missing_side', 'M8.GEO.PV.1.2', 'Pythagorean Theorem — Find Missing Side', {
    question: `A right triangle has a hypotenuse of ${c} and one leg of ${knownLeg}. Find the length of the other leg.`,
    answer: String(missing),
    solution_steps: [
      `Pythagorean theorem: leg² + ${knownLeg}² = ${c}²`,
      `leg² = ${c * c} − ${knownLeg * knownLeg} = ${c * c - knownLeg * knownLeg}`,
      `leg = √${c * c - knownLeg * knownLeg} = ${missing}`,
    ],
    answer_type: 'decimal',
  });
}

// 17. M8.GEO.PV.1.3 — Pythagorean 2D Word Problem
export function generate_g8_pythagorean_2d_context(difficulty: DifficultyLevel): GeneratedQuestion {
  const triples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]];
  const [a, b, c] = triples[randomInt(0, triples.length - 1)]!;
  const scenarios = [
    {
      build: () => ({
        question: `A ${c}-foot ladder leans against a wall. The base of the ladder is ${a} feet from the wall. How high up the wall does the ladder reach?`,
        answer: String(b),
        steps: [
          `Treat the ladder as the hypotenuse, the distance from the wall as one leg, the height as the other.`,
          `height² + ${a}² = ${c}²`,
          `height² = ${c * c} − ${a * a} = ${b * b}`,
          `height = ${b} feet`,
        ],
      }),
    },
    {
      build: () => ({
        question: `A rectangular field is ${a} meters wide and ${b} meters long. How long is the diagonal walking path across the field?`,
        answer: String(c),
        steps: [
          `The diagonal is the hypotenuse of a right triangle with legs equal to the sides.`,
          `${a}² + ${b}² = ${a * a + b * b}`,
          `diagonal = √${a * a + b * b} = ${c} meters`,
        ],
      }),
    },
    {
      build: () => ({
        question: `On a baseball diamond, the bases form a square. From home plate to first base is ${a * 10} feet, and from first base to second base is ${b * 10} feet (treat them as legs of a right triangle). What is the straight-line distance from home plate to second base?`,
        answer: String(c * 10),
        steps: [
          `Diagonal = √((${a * 10})² + (${b * 10})²) = √${(a * 10) ** 2 + (b * 10) ** 2} = ${c * 10} feet`,
        ],
      }),
    },
  ];
  const sc = scenarios[randomInt(0, scenarios.length - 1)]!.build();
  return g7Wrap(difficulty, 'g8_pythagorean_2d_context', 'M8.GEO.PV.1.3', 'Pythagorean Theorem — 2D Real-World', {
    question: sc.question,
    answer: sc.answer,
    solution_steps: sc.steps,
    answer_type: 'decimal',
  });
}

// 18. M8.GEO.PV.1.5 — Pythagorean Converse: Is it a Right Triangle?
export function generate_g8_pythagorean_converse(difficulty: DifficultyLevel): GeneratedQuestion {
  const rightTriples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]];
  const nonRightTriples: Array<[number, number, number]> = [[3, 4, 6], [5, 7, 9], [2, 3, 4], [4, 5, 7]];
  const isRight = Math.random() < 0.5;
  const pool = isRight ? rightTriples : nonRightTriples;
  const [a, b, c] = pool[randomInt(0, pool.length - 1)]!;
  const answer = isRight ? 'yes' : 'no';
  return g7Wrap(difficulty, 'g8_pythagorean_converse', 'M8.GEO.PV.1.5', 'Pythagorean Converse', {
    question: `Do side lengths ${a}, ${b}, and ${c} form a right triangle? Enter "yes" or "no".`,
    answer,
    solution_steps: [
      `Test the largest side as the hypotenuse: does ${a}² + ${b}² = ${c}²?`,
      `${a * a} + ${b * b} = ${a * a + b * b}, and ${c}² = ${c * c}`,
      isRight
        ? `${a * a + b * b} = ${c * c}, so the sides DO form a right triangle.`
        : `${a * a + b * b} ≠ ${c * c}, so the sides do NOT form a right triangle.`,
      `Answer: ${answer}`,
    ],
    answer_type: 'text',
  });
}

// 19. M8.GEO.PV.2.1 — Distance Between Two Points on the Coordinate Plane
export function generate_g8_coordinate_distance(difficulty: DifficultyLevel): GeneratedQuestion {
  // Choose points so the distance is a clean integer (use Pythagorean triples for leg deltas)
  const triples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]];
  const [dx, dy, d] = triples[randomInt(0, triples.length - 1)]!;
  const x1 = randomInt(-6, 6);
  const y1 = randomInt(-6, 6);
  // Apply random sign to the deltas
  const sx = Math.random() < 0.5 ? 1 : -1;
  const sy = Math.random() < 0.5 ? 1 : -1;
  const x2 = x1 + sx * dx;
  const y2 = y1 + sy * dy;
  return g7Wrap(difficulty, 'g8_coordinate_distance', 'M8.GEO.PV.2.1', 'Distance Between Two Points', {
    question: `Find the distance between (${x1}, ${y1}) and (${x2}, ${y2}).`,
    answer: String(d),
    solution_steps: [
      `Distance formula: d = √((x₂ − x₁)² + (y₂ − y₁)²)`,
      `Δx = ${x2} − ${x1} = ${sx * dx},  Δy = ${y2} − ${y1} = ${sy * dy}`,
      `d = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} = ${d}`,
    ],
    answer_type: 'decimal',
  });
}

// 20. M8.GEO.PV.3.2 — Volume of a Cylinder
export function generate_g8_volume_cylinder(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const r = randomInt(2, difficulty === 1 ? 8 : 12);
  const h = randomInt(3, difficulty === 1 ? 12 : 20);
  const V = +(PI * r * r * h).toFixed(2);
  return g7Wrap(difficulty, 'g8_volume_cylinder', 'M8.GEO.PV.3.2', 'Volume of a Cylinder', {
    question: `Find the volume of a cylinder with radius ${r} cm and height ${h} cm. Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer: V.toFixed(2),
    solution_steps: [
      `V = π × r² × h`,
      `V = 3.14159 × ${r}² × ${h}`,
      `V = 3.14159 × ${r * r} × ${h}`,
      `V ≈ ${V.toFixed(2)} cm³`,
    ],
    answer_type: 'decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: Volume & Statistics (G8)
// ─────────────────────────────────────────────────────────────────────────────

// 21. M8.GEO.PV.3.4 — Volume of a Cone
export function generate_g8_volume_cone(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const r = randomInt(2, difficulty === 1 ? 7 : 10);
  const h = randomInt(3, difficulty === 1 ? 10 : 15);
  const V = +(PI * r * r * h / 3).toFixed(2);
  return g7Wrap(difficulty, 'g8_volume_cone', 'M8.GEO.PV.3.4', 'Volume of a Cone', {
    question: `Find the volume of a cone with radius ${r} cm and height ${h} cm. Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer: V.toFixed(2),
    solution_steps: [
      `V = (1/3) × π × r² × h`,
      `V = (1/3) × 3.14159 × ${r}² × ${h}`,
      `V = (1/3) × 3.14159 × ${r * r} × ${h}`,
      `V ≈ ${V.toFixed(2)} cm³`,
    ],
    answer_type: 'decimal',
  });
}

// 22. M8.GEO.PV.3.6 — Volume of a Sphere
export function generate_g8_volume_sphere(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const r = randomInt(2, difficulty === 1 ? 7 : 10);
  const V = +((4 / 3) * PI * r * r * r).toFixed(2);
  return g7Wrap(difficulty, 'g8_volume_sphere', 'M8.GEO.PV.3.6', 'Volume of a Sphere', {
    question: `Find the volume of a sphere with radius ${r} cm. Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer: V.toFixed(2),
    solution_steps: [
      `V = (4/3) × π × r³`,
      `V = (4/3) × 3.14159 × ${r}³`,
      `V = (4/3) × 3.14159 × ${r * r * r}`,
      `V ≈ ${V.toFixed(2)} cm³`,
    ],
    answer_type: 'decimal',
  });
}

// 23. M8.GEO.PV.4.1 — Real-World Volume Problem
export function generate_g8_volume_3d_word_problem(difficulty: DifficultyLevel): GeneratedQuestion {
  const PI = 3.14159;
  const shape = (['cylinder', 'cone', 'sphere'] as const)[randomInt(0, 2)]!;
  if (shape === 'cylinder') {
    const r = randomInt(2, 6);
    const h = randomInt(5, 15);
    const V = +(PI * r * r * h).toFixed(2);
    return g7Wrap(difficulty, 'g8_volume_3d_word_problem', 'M8.GEO.PV.4.1', '3D Volume — Real-World', {
      question: `A water tank is shaped like a cylinder with radius ${r} m and height ${h} m. How many cubic meters of water can it hold? Use π ≈ 3.14159 and round to 2 decimal places.`,
      answer: V.toFixed(2),
      solution_steps: [
        `Cylinder volume: V = πr²h`,
        `V = 3.14159 × ${r * r} × ${h}`,
        `V ≈ ${V.toFixed(2)} m³`,
      ],
      answer_type: 'decimal',
    });
  }
  if (shape === 'cone') {
    const r = randomInt(2, 5);
    const h = randomInt(4, 12);
    const V = +(PI * r * r * h / 3).toFixed(2);
    return g7Wrap(difficulty, 'g8_volume_3d_word_problem', 'M8.GEO.PV.4.1', '3D Volume — Real-World', {
      question: `An ice-cream cone has radius ${r} cm and height ${h} cm. How much ice cream (in cm³) can it hold when filled level to the top? Use π ≈ 3.14159 and round to 2 decimal places.`,
      answer: V.toFixed(2),
      solution_steps: [
        `Cone volume: V = (1/3)πr²h`,
        `V = (1/3) × 3.14159 × ${r * r} × ${h}`,
        `V ≈ ${V.toFixed(2)} cm³`,
      ],
      answer_type: 'decimal',
    });
  }
  // sphere — basketball
  const r = randomInt(10, 16);
  const V = +((4 / 3) * PI * r * r * r).toFixed(2);
  return g7Wrap(difficulty, 'g8_volume_3d_word_problem', 'M8.GEO.PV.4.1', '3D Volume — Real-World', {
    question: `A basketball is approximately spherical with radius ${r} cm. What is its volume (in cm³)? Use π ≈ 3.14159 and round to 2 decimal places.`,
    answer: V.toFixed(2),
    solution_steps: [
      `Sphere volume: V = (4/3)πr³`,
      `V = (4/3) × 3.14159 × ${r * r * r}`,
      `V ≈ ${V.toFixed(2)} cm³`,
    ],
    answer_type: 'decimal',
  });
}

// 24. M8.SP.3.2 — Relative Frequency from a Two-Way Table
export function generate_g8_relative_frequency_table(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a 2×2 table: e.g., rows = {plays sport, doesn't}, cols = {grade 7, 8}
  const a = randomInt(8, 30);
  const b = randomInt(8, 30);
  const c = randomInt(8, 30);
  const d = randomInt(8, 30);
  const total = a + b + c + d;
  const variants: Array<{
    desc: string;
    favorable: number;
    denominator: number;
    descNum: string;
    descDen: string;
  }> = [
    { desc: 'a student is in Grade 7',
      favorable: a + c,                 // column 1 total
      denominator: total,
      descNum: 'Grade 7 students',
      descDen: 'total students',
    },
    { desc: 'a student plays a sport',
      favorable: a + b,                 // row 1 total
      denominator: total,
      descNum: 'sport-playing students',
      descDen: 'total students',
    },
    { desc: 'a Grade 7 student plays a sport',
      favorable: a,
      denominator: a + c,
      descNum: 'Grade 7 students who play a sport',
      descDen: 'Grade 7 students',
    },
    { desc: 'a sport-playing student is in Grade 8',
      favorable: b,
      denominator: a + b,
      descNum: 'sport-playing Grade 8 students',
      descDen: 'sport-playing students',
    },
  ];
  const v = variants[randomInt(0, variants.length - 1)]!;
  const value = +(v.favorable / v.denominator).toFixed(2);
  const table =
    `                Grade 7  Grade 8\n` +
    `Plays sport     ${String(a).padStart(7)}  ${String(b).padStart(7)}\n` +
    `No sport        ${String(c).padStart(7)}  ${String(d).padStart(7)}`;
  return g7Wrap(difficulty, 'g8_relative_frequency_table', 'M8.SP.3.2', 'Relative Frequency from Two-Way Table', {
    question: `Use the two-way table to find the relative frequency that ${v.desc}. Round your decimal answer to 2 decimal places.\n\n${table}`,
    answer: value.toFixed(2),
    solution_steps: [
      `Identify the numerator (${v.descNum}): ${v.favorable}`,
      `Identify the denominator (${v.descDen}): ${v.denominator}`,
      `Relative frequency = ${v.favorable} / ${v.denominator} ≈ ${value.toFixed(2)}`,
    ],
    answer_type: 'decimal',
  });
}

// 25. M8.GEO.PV.1.4 — Pythagorean 3D (space diagonal of a box)
export function generate_g8_pythagorean_3d_context(difficulty: DifficultyLevel): GeneratedQuestion {
  // Pick dimensions so the space diagonal is an integer.
  // 3D space diagonal: d = √(l² + w² + h²).
  // Examples with integer d: (1,2,2) → 3, (2,3,6) → 7, (4,4,7) → 9, (3,4,12) → 13, (2,3,6) → 7
  const triples: Array<[number, number, number, number]> = [
    [1, 2, 2, 3],
    [2, 3, 6, 7],
    [4, 4, 7, 9],
    [3, 4, 12, 13],
    [6, 6, 7, 11],
    [4, 5, 20, 21],
  ];
  const [l, w, h, d] = triples[randomInt(0, triples.length - 1)]!;
  return g7Wrap(difficulty, 'g8_pythagorean_3d_context', 'M8.GEO.PV.1.4', 'Pythagorean Theorem in 3D', {
    question: `A rectangular box has length ${l} cm, width ${w} cm, and height ${h} cm. Find the length of the space diagonal of the box (corner to opposite corner).`,
    answer: String(d),
    solution_steps: [
      `Apply the 3D Pythagorean theorem: d² = l² + w² + h²`,
      `d² = ${l * l} + ${w * w} + ${h * h} = ${l * l + w * w + h * h}`,
      `d = √${l * l + w * w + h * h} = ${d} cm`,
    ],
    answer_type: 'decimal',
  });
}

// =============================================================================
// =============================================================================
// ALGEBRA 1 — VARSITY DIVISION (pool: algebra_1)
// =============================================================================
// =============================================================================
// All generators use the `alg1_` prefix on their generator_type. Wrapped via
// g7Wrap() (helper is pool-agnostic despite the name) so each function plugs
// into the existing question-delivery pipeline.

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: Foundations of Algebra
// ─────────────────────────────────────────────────────────────────────────────

// 1. Alg1.FND.1.2 — Evaluate Algebraic Expressions for Given Variable Values
export function generate_alg1_eval_algebraic_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  // Forms grow with difficulty: ax + b → ax² + bx → ax² + bx + c
  const form = difficulty === 1 ? 'linear' : difficulty === 2 ? 'quad_two' : 'quad_three';
  const x = randomNonZeroInt(-6, 8);
  const a = randomNonZeroInt(-5, 5);
  const b = randomNonZeroInt(-10, 10);
  const c = randomInt(-10, 10);

  if (form === 'linear') {
    const result = a * x + b;
    const bSign = b >= 0 ? '+' : '-';
    return g7Wrap(difficulty, 'alg1_eval_algebraic_expr', 'Alg1.FND.1.2', 'Evaluating Algebraic Expressions', {
      question: `Evaluate ${a}x ${bSign} ${Math.abs(b)} when x = ${x}.`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x}) ${bSign} ${Math.abs(b)}`,
        `= ${a * x} ${bSign} ${Math.abs(b)}`,
        `= ${result}`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  if (form === 'quad_two') {
    const result = a * x * x + b * x;
    const bSign = b >= 0 ? '+' : '-';
    return g7Wrap(difficulty, 'alg1_eval_algebraic_expr', 'Alg1.FND.1.2', 'Evaluating Algebraic Expressions', {
      question: `Evaluate ${a}x² ${bSign} ${Math.abs(b)}x when x = ${x}.`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x})² ${bSign} ${Math.abs(b)}(${x})`,
        `= ${a * x * x} ${bSign} ${Math.abs(b * x)}`,
        `= ${result}`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  // quad_three: ax² + bx + c
  const result = a * x * x + b * x + c;
  const bSign = b >= 0 ? '+' : '-';
  const cSign = c >= 0 ? '+' : '-';
  return g7Wrap(difficulty, 'alg1_eval_algebraic_expr', 'Alg1.FND.1.2', 'Evaluating Algebraic Expressions', {
    question: `Evaluate ${a}x² ${bSign} ${Math.abs(b)}x ${cSign} ${Math.abs(c)} when x = ${x}.`,
    answer: String(result),
    solution_steps: [
      `Substitute x = ${x}: ${a}(${x})² ${bSign} ${Math.abs(b)}(${x}) ${cSign} ${Math.abs(c)}`,
      `= ${a * x * x} ${bSign} ${Math.abs(b * x)} ${cSign} ${Math.abs(c)}`,
      `= ${result}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 2. Alg1.FND.1.3 — Simplify Algebraic Expressions (combine + distribute)
export function generate_alg1_simplify_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use the existing g7FmtLinear helper for sign-aware formatting.
  if (difficulty === 1) {
    // Combine like terms: (ax + b) + (cx + d)
    const a1 = randomNonZeroInt(-7, 7);
    const a2 = randomNonZeroInt(-7, 7);
    const b1 = randomInt(-10, 10);
    const b2 = randomInt(-10, 10);
    const aSum = a1 + a2;
    const bSum = b1 + b2;
    if (aSum === 0 && bSum === 0) return generate_alg1_simplify_expression(difficulty);
    const e1 = g7FmtLinear(a1, b1);
    const e2 = g7FmtLinear(a2, b2);
    return g7Wrap(difficulty, 'alg1_simplify_expression', 'Alg1.FND.1.3', 'Simplifying Algebraic Expressions', {
      question: `Simplify: (${e1}) + (${e2})`,
      answer: g7FmtLinear(aSum, bSum),
      solution_steps: [
        `Drop the parentheses: ${e1} + ${e2}`,
        `Combine x-terms: ${a1}x + ${a2}x = ${aSum}x`,
        `Combine constants: ${b1} + ${b2} = ${bSum}`,
        `Result: ${g7FmtLinear(aSum, bSum)}`,
      ],
      answer_type: 'expression',
    });
  }
  // Difficulty 2-3: distribute then combine — k(ax + b) + (cx + d)
  const k = randomNonZeroInt(2, 5);
  const a = randomNonZeroInt(-5, 5);
  const b = randomInt(-6, 6);
  const c = randomNonZeroInt(-5, 5);
  const d = randomInt(-8, 8);
  const xCoef = k * a + c;
  const constSum = k * b + d;
  if (xCoef === 0 && constSum === 0) return generate_alg1_simplify_expression(difficulty);
  const e1 = `${k}(${g7FmtLinear(a, b)})`;
  const e2 = g7FmtLinear(c, d);
  return g7Wrap(difficulty, 'alg1_simplify_expression', 'Alg1.FND.1.3', 'Simplifying Algebraic Expressions', {
    question: `Simplify: ${e1} + (${e2})`,
    answer: g7FmtLinear(xCoef, constSum),
    solution_steps: [
      `Distribute ${k}: ${g7FmtLinear(k * a, k * b)} + ${e2}`,
      `Combine x-terms: ${k * a}x + ${c}x = ${xCoef}x`,
      `Combine constants: ${k * b} + ${d} = ${constSum}`,
      `Result: ${g7FmtLinear(xCoef, constSum)}`,
    ],
    answer_type: 'expression',
  });
}

// 3. Alg1.FND.1.1 — Translate a Verbal Phrase into an Algebraic Expression
export function generate_alg1_translate_verbal(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated phrase templates so the canonical answer is unambiguous.
  const a = randomInt(2, 9);
  const b = randomInt(2, 12);
  const templates: Array<{ phrase: string; answer: string; steps: string[] }> = [
    {
      phrase: `${a} more than a number n`,
      answer: `n + ${a}`,
      steps: [`"More than" means addition.`, `n + ${a}`],
    },
    {
      phrase: `${a} less than a number x`,
      answer: `x - ${a}`,
      steps: [`"Less than" reverses the order: x − ${a}`, `Result: x - ${a}`],
    },
    {
      phrase: `the product of ${a} and a number y`,
      answer: `${a}y`,
      steps: [`"Product" means multiplication.`, `${a} × y = ${a}y`],
    },
    {
      phrase: `a number n divided by ${a}`,
      answer: `n/${a}`,
      steps: [`"Divided by" means division.`, `n ÷ ${a} = n/${a}`],
    },
    {
      phrase: `${a} times a number n, increased by ${b}`,
      answer: `${a}n + ${b}`,
      steps: [`"${a} times n" → ${a}n`, `"Increased by ${b}" → ${a}n + ${b}`],
    },
    {
      phrase: `the quantity of x plus ${a}, multiplied by ${b}`,
      answer: `${b}(x + ${a})`,
      steps: [`"x plus ${a}" → x + ${a}`, `"Multiplied by ${b}" → ${b}(x + ${a})`],
    },
  ];
  const pool = difficulty === 1 ? templates.slice(0, 4) : templates;
  const t = pool[randomInt(0, pool.length - 1)]!;
  return g7Wrap(difficulty, 'alg1_translate_verbal', 'Alg1.FND.1.1', 'Translating Verbal Phrases', {
    question: `Translate into an algebraic expression: ${t.phrase}.`,
    answer: t.answer,
    solution_steps: t.steps,
    answer_type: 'expression',
  });
}

// 4. Alg1.FND.2.1 — Solve One-Step Equations (Addition / Subtraction)
export function generate_alg1_solve_one_step_add_sub(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 12 : 25;
  const x = randomNonZeroInt(-range, range);
  const a = randomNonZeroInt(-range, range);
  const useSubtract = Math.random() < 0.5;
  const c = useSubtract ? x - a : x + a;
  const opDisplay = useSubtract ? `- ${a >= 0 ? a : `(${a})`}` : `+ ${a >= 0 ? a : `(${a})`}`;
  const inverseOp = useSubtract ? `Add ${a >= 0 ? a : `(${a})`}` : `Subtract ${a >= 0 ? a : `(${a})`}`;
  return g7Wrap(difficulty, 'alg1_solve_one_step_add_sub', 'Alg1.FND.2.1', 'One-Step Equations: Add/Subtract', {
    question: `Solve for x:  x ${opDisplay} = ${c}`,
    answer: String(x),
    solution_steps: [
      `${inverseOp} from both sides to isolate x.`,
      `x = ${c} ${useSubtract ? '+' : '-'} ${a >= 0 ? a : `(${a})`}`,
      `x = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 5. Alg1.FND.2.2 — Solve One-Step Equations (Multiplication / Division)
export function generate_alg1_solve_one_step_mult_div(difficulty: DifficultyLevel): GeneratedQuestion {
  // ax = c  (clean integer or rational answer)
  const useDivision = Math.random() < 0.5;
  if (useDivision) {
    // x / a = c
    const a = randomNonZeroInt(2, 8);
    const x = randomNonZeroInt(-12, 12);
    const c = g7Rat(x, a);                          // x/a as a rational
    return g7Wrap(difficulty, 'alg1_solve_one_step_mult_div', 'Alg1.FND.2.2', 'One-Step Equations: Mult/Div', {
      question: `Solve for x:  x / ${a} = ${g7FmtRat(c)}`,
      answer: String(x),
      solution_steps: [
        `Multiply both sides by ${a}.`,
        `x = ${g7FmtRat(c)} × ${a}`,
        `x = ${x}`,
      ],
      answer_type: 'decimal_or_fraction',
    });
  }
  const a = randomNonZeroInt(-9, 9);
  const xRat = difficulty === 1
    ? g7Rat(randomNonZeroInt(-10, 10))
    : g7RandomRational(8, true);
  const c = g7RatMul(g7Rat(a), xRat);
  return g7Wrap(difficulty, 'alg1_solve_one_step_mult_div', 'Alg1.FND.2.2', 'One-Step Equations: Mult/Div', {
    question: `Solve for x:  ${a}x = ${g7FmtRat(c)}`,
    answer: g7FmtRat(xRat),
    solution_steps: [
      `Divide both sides by ${a}.`,
      `x = ${g7FmtRat(c)} / ${a}`,
      `x = ${g7FmtRat(xRat)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: Linear Equations (ALG1)
// ─────────────────────────────────────────────────────────────────────────────

// 6. Alg1.FND.2.3 — Solve Two-Step Linear Equations (ax + b = c)
export function generate_alg1_solve_two_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(2, difficulty === 1 ? 7 : 12);
  const b = randomInt(-15, 15);
  const xRat = difficulty === 1
    ? g7Rat(randomNonZeroInt(-10, 10))
    : g7RandomRational(8, true);
  const c = g7RatAdd(g7RatMul(g7Rat(a), xRat), g7Rat(b));
  const bSign = b >= 0 ? '+' : '-';
  return g7Wrap(difficulty, 'alg1_solve_two_step', 'Alg1.FND.2.3', 'Two-Step Linear Equations', {
    question: `Solve for x:  ${a}x ${bSign} ${Math.abs(b)} = ${g7FmtRat(c)}`,
    answer: g7FmtRat(xRat),
    solution_steps: [
      b !== 0
        ? `Subtract ${b >= 0 ? b : `(${b})`} from both sides: ${a}x = ${g7FmtRat(g7RatSub(c, g7Rat(b)))}`
        : `${a}x = ${g7FmtRat(c)}`,
      a !== 1
        ? `Divide both sides by ${a}: x = ${g7FmtRat(xRat)}`
        : `x = ${g7FmtRat(xRat)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 7. Alg1.FND.2.4 — Solve Multi-Step Linear Equations (distribute + combine)
export function generate_alg1_solve_multi_step(difficulty: DifficultyLevel): GeneratedQuestion {
  // Structure: k(ax + b) + dx = e
  const k = randomNonZeroInt(2, 5);
  const a = randomNonZeroInt(1, 4);
  const b = randomInt(-6, 6);
  const d = randomNonZeroInt(1, 5);
  const x = randomNonZeroInt(-8, 8);
  const lhsCoef = k * a + d;
  if (lhsCoef === 0) return generate_alg1_solve_multi_step(difficulty);
  const lhsConst = k * b;
  const e = lhsCoef * x + lhsConst;
  const bSign = b >= 0 ? '+' : '-';
  const tail = `${d > 0 ? '+ ' : '- '}${Math.abs(d)}x`;
  return g7Wrap(difficulty, 'alg1_solve_multi_step', 'Alg1.FND.2.4', 'Multi-Step Linear Equations', {
    question: `Solve for x:  ${k}(${a}x ${bSign} ${Math.abs(b)}) ${tail} = ${e}`,
    answer: String(x),
    solution_steps: [
      `Distribute ${k}: ${k * a}x ${k * b >= 0 ? '+' : '-'} ${Math.abs(k * b)} ${tail} = ${e}`,
      `Combine like terms: ${lhsCoef}x ${lhsConst >= 0 ? '+' : '-'} ${Math.abs(lhsConst)} = ${e}`,
      lhsConst !== 0
        ? `Subtract ${lhsConst >= 0 ? lhsConst : `(${lhsConst})`}: ${lhsCoef}x = ${e - lhsConst}`
        : `${lhsCoef}x = ${e}`,
      `Divide by ${lhsCoef}: x = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 8. Alg1.FND.2.5 — Solve Equations with Variables on Both Sides
export function generate_alg1_solve_vars_both_sides(difficulty: DifficultyLevel): GeneratedQuestion {
  let a: number, c: number;
  do {
    a = randomNonZeroInt(-8, 8);
    c = randomNonZeroInt(-8, 8);
  } while (a === c);
  const b = randomInt(-15, 15);
  const x = randomInt(-8, 8);
  const d = a * x + b - c * x;
  const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  const cPart = c === 1 ? 'x' : c === -1 ? '-x' : `${c}x`;
  const bPart = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  const dPart = d === 0 ? '' : d > 0 ? ` + ${d}` : ` - ${Math.abs(d)}`;
  return g7Wrap(difficulty, 'alg1_solve_vars_both_sides', 'Alg1.FND.2.5', 'Variables on Both Sides', {
    question: `Solve for x:  ${aPart}${bPart} = ${cPart}${dPart}`,
    answer: String(x),
    solution_steps: [
      `Subtract ${cPart} from both sides: ${a - c}x${bPart} = ${d}`,
      b !== 0
        ? `Subtract ${b} from both sides: ${a - c}x = ${d - b}`
        : `${a - c}x = ${d - b}`,
      `Divide both sides by ${a - c}: x = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 9. Alg1.FND.2.6 — Solve a Literal Equation for a Specified Variable
export function generate_alg1_solve_literal_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated formula pool so the canonical answer is unambiguous.
  const items: Array<{ formula: string; solveFor: string; answer: string; steps: string[] }> = [
    {
      formula: 'A = lw',
      solveFor: 'l',
      answer: 'l = A/w',
      steps: [`Divide both sides by w.`, `A/w = l, so l = A/w.`],
    },
    {
      formula: 'd = rt',
      solveFor: 'r',
      answer: 'r = d/t',
      steps: [`Divide both sides by t.`, `r = d/t.`],
    },
    {
      formula: 'P = 2l + 2w',
      solveFor: 'w',
      answer: 'w = (P - 2l)/2',
      steps: [`Subtract 2l: P − 2l = 2w.`, `Divide by 2: w = (P − 2l)/2.`],
    },
    {
      formula: 'V = lwh',
      solveFor: 'h',
      answer: 'h = V/(lw)',
      steps: [`Divide both sides by lw.`, `h = V/(lw).`],
    },
    {
      formula: 'y = mx + b',
      solveFor: 'm',
      answer: 'm = (y - b)/x',
      steps: [`Subtract b: y − b = mx.`, `Divide by x: m = (y − b)/x.`],
    },
    {
      formula: 'I = Prt',
      solveFor: 'r',
      answer: 'r = I/(Pt)',
      steps: [`Divide both sides by Pt.`, `r = I/(Pt).`],
    },
  ];
  const item = items[randomInt(0, items.length - 1)]!;
  return g7Wrap(difficulty, 'alg1_solve_literal_equation', 'Alg1.FND.2.6', 'Solving a Literal Equation', {
    question: `Solve the formula ${item.formula} for ${item.solveFor}.`,
    answer: item.answer,
    solution_steps: item.steps,
    answer_type: 'equation',
  });
}

// 10. Alg1.FND.3.2 — Write a Linear Equation from a Word Problem
export function generate_alg1_write_linear_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(2, 12);
  const b = randomNonZeroInt(5, 60);
  const slopePart = m === 1 ? 'x' : `${m}x`;
  const scenarios: Array<{ setup: string; ask: string; steps: string[] }> = [
    {
      setup: `A gym charges a $${b} sign-up fee plus $${m} per month.`,
      ask: `Write a linear equation for the total cost y after x months.`,
      steps: [`Fixed cost = y-intercept = ${b}.`, `Rate per month = slope = ${m}.`, `y = ${slopePart} + ${b}`],
    },
    {
      setup: `A pool has ${b} gallons in it. A pump adds ${m} gallons per minute.`,
      ask: `Write a linear equation for the volume y after x minutes.`,
      steps: [`Initial volume = ${b}.`, `Rate per minute = ${m}.`, `y = ${slopePart} + ${b}`],
    },
    {
      setup: `A book club starts with ${b} members and gains ${m} new members each week.`,
      ask: `Write a linear equation for the membership y after x weeks.`,
      steps: [`Initial membership = ${b}.`, `Rate per week = ${m}.`, `y = ${slopePart} + ${b}`],
    },
  ];
  const sc = scenarios[randomInt(0, scenarios.length - 1)]!;
  return g7Wrap(difficulty, 'alg1_write_linear_equation', 'Alg1.FND.3.2', 'Writing a Linear Equation from a Word Problem', {
    question: `${sc.setup} ${sc.ask} Use slope-intercept form y = mx + b.`,
    answer: `y = ${slopePart} + ${b}`,
    solution_steps: sc.steps,
    answer_type: 'equation',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: Linear Functions (ALG1)
// ─────────────────────────────────────────────────────────────────────────────

// 11. Alg1.FLF.1.1 — Find Slope from Two Points
export function generate_alg1_slope_from_points(difficulty: DifficultyLevel): GeneratedQuestion {
  // Pick two points such that (y2 - y1) / (x2 - x1) is a clean rational.
  const dx = randomNonZeroInt(1, 8);
  const dyNum = randomNonZeroInt(-9, 9);
  const x1 = randomInt(-6, 6);
  const y1 = randomInt(-6, 6);
  const x2 = x1 + dx;
  const y2 = y1 + dyNum;
  const slope = g7Rat(dyNum, dx);
  return g7Wrap(difficulty, 'alg1_slope_from_points', 'Alg1.FLF.1.1', 'Slope from Two Points', {
    question: `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
    answer: g7FmtRat(slope),
    solution_steps: [
      `m = (y₂ − y₁) / (x₂ − x₁)`,
      `m = (${y2} − ${y1}) / (${x2} − ${x1})`,
      `m = ${dyNum} / ${dx}`,
      `m = ${g7FmtRat(slope)}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 12. Alg1.FLF.2.1 — Write y = mx + b given slope and y-intercept
export function generate_alg1_slope_intercept_form(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-6, 6);
  const b = randomInt(-10, 10);
  const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  const answer = b === 0
    ? `y = ${slopePart}`
    : `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  const bWord = b === 0 ? '0' : String(b);
  return g7Wrap(difficulty, 'alg1_slope_intercept_form', 'Alg1.FLF.2.1', 'Write an Equation in Slope-Intercept Form', {
    question: `Write the equation of the line with slope m = ${m} and y-intercept b = ${bWord}. Use slope-intercept form y = mx + b.`,
    answer,
    solution_steps: [
      `Slope-intercept form: y = mx + b.`,
      `Substitute m = ${m} and b = ${b}: y = ${m}x + ${b}.`,
      `Simplify signs: ${answer}.`,
    ],
    answer_type: 'equation',
  });
}

// 13. Alg1.FLF.2.2 — Identify Slope or y-Intercept from an Equation
export function generate_alg1_graph_identify_slope(difficulty: DifficultyLevel): GeneratedQuestion {
  // Ask for ONE of {slope, y-intercept} given y = mx + b.
  const m = randomNonZeroInt(-7, 7);
  const b = randomInt(-12, 12);
  const askSlope = Math.random() < 0.5;
  const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  const equation = b === 0 ? `y = ${slopePart}` : `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  if (askSlope) {
    return g7Wrap(difficulty, 'alg1_graph_identify_slope', 'Alg1.FLF.2.2', 'Identify Slope from a Linear Equation', {
      question: `Identify the slope of the line ${equation}.`,
      answer: String(m),
      solution_steps: [
        `Compare ${equation} to y = mx + b.`,
        `The coefficient of x is the slope.`,
        `m = ${m}`,
      ],
      answer_type: 'decimal_or_fraction',
    });
  }
  return g7Wrap(difficulty, 'alg1_graph_identify_slope', 'Alg1.FLF.2.2', 'Identify y-Intercept from a Linear Equation', {
    question: `Identify the y-intercept of the line ${equation}.`,
    answer: String(b),
    solution_steps: [
      `Compare ${equation} to y = mx + b.`,
      `The constant term is the y-intercept.`,
      `b = ${b}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 14. Alg1.FLF.3.1 — Write Equation from a Table of Values
export function generate_alg1_write_equation_from_table(difficulty: DifficultyLevel): GeneratedQuestion {
  const m = randomNonZeroInt(-5, 5);
  const b = randomInt(-12, 12);
  const xs = [0, 1, 2, 3];
  const ys = xs.map((x) => m * x + b);
  const tableLines = xs.map((x, i) => `  x=${x}, y=${ys[i]}`).join('\n');
  const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  const answer = b === 0
    ? `y = ${slopePart}`
    : `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  return g7Wrap(difficulty, 'alg1_write_equation_from_table', 'Alg1.FLF.3.1', 'Write an Equation from a Table', {
    question: `Write the linear equation in slope-intercept form y = mx + b that fits this table:\n\n${tableLines}`,
    answer,
    solution_steps: [
      `Slope: (${ys[1]} − ${ys[0]}) / (1 − 0) = ${m}.`,
      `y-intercept (at x = 0): ${ys[0]}.`,
      `Equation: ${answer}`,
    ],
    answer_type: 'equation',
  });
}

// 15. Alg1.FLF.3.2 — Write Equation Given Two Points
export function generate_alg1_write_equation_two_points(difficulty: DifficultyLevel): GeneratedQuestion {
  // Pick integer slope and integer y-intercept to keep answer clean.
  const m = randomNonZeroInt(-5, 5);
  const b = randomInt(-10, 10);
  const x1 = randomInt(-6, 6);
  let x2 = randomInt(-6, 6);
  while (x2 === x1) x2 = randomInt(-6, 6);
  const y1 = m * x1 + b;
  const y2 = m * x2 + b;
  const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  const answer = b === 0
    ? `y = ${slopePart}`
    : `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  return g7Wrap(difficulty, 'alg1_write_equation_two_points', 'Alg1.FLF.3.2', 'Write an Equation from Two Points', {
    question: `Write the equation of the line through (${x1}, ${y1}) and (${x2}, ${y2}). Use slope-intercept form y = mx + b.`,
    answer,
    solution_steps: [
      `Slope: m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${m}.`,
      `Substitute (${x1}, ${y1}) into y = mx + b: ${y1} = ${m}(${x1}) + b → b = ${b}.`,
      `Equation: ${answer}`,
    ],
    answer_type: 'equation',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: Systems & Inequalities (ALG1)
// ─────────────────────────────────────────────────────────────────────────────

// 16. Alg1.SYS.1.2 — Solve a 2×2 System by Substitution
export function generate_alg1_solve_system_substitution(difficulty: DifficultyLevel): GeneratedQuestion {
  // Equations: y = m1·x + b1, y = m2·x + b2  (m1 != m2)
  let m1: number, m2: number;
  do {
    m1 = randomNonZeroInt(-5, 5);
    m2 = randomNonZeroInt(-5, 5);
  } while (m1 === m2);
  const x = randomInt(-6, 6);
  const b1 = randomInt(-8, 8);
  const y = m1 * x + b1;
  const b2 = y - m2 * x;
  const fmt = (m: number, b: number): string => {
    const slopePart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
    if (b === 0) return `y = ${slopePart}`;
    return `y = ${slopePart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  };
  return g7Wrap(difficulty, 'alg1_solve_system_substitution', 'Alg1.SYS.1.2', 'Solving Systems by Substitution', {
    question: `Solve the system by substitution:\n${fmt(m1, b1)}\n${fmt(m2, b2)}\n\nEnter the solution as (x, y).`,
    answer: `(${x}, ${y})`,
    solution_steps: [
      `Both equations are solved for y. Set right-hand sides equal: ${m1}x ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)} = ${m2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}`,
      `Combine x-terms: ${m1 - m2}x = ${b2 - b1}`,
      `x = ${x}`,
      `Substitute back: y = ${m1}(${x}) ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)} = ${y}`,
      `Solution: (${x}, ${y})`,
    ],
    answer_type: 'ordered_pair',
  });
}

// 17. Alg1.SYS.1.3 — Solve a 2×2 System by Elimination
export function generate_alg1_solve_system_elimination(difficulty: DifficultyLevel): GeneratedQuestion {
  // Standard form: a1·x + b1·y = c1,  a2·x + b2·y = c2 with det ≠ 0.
  let a1: number, b1: number, a2: number, b2: number;
  let det = 0;
  for (let tries = 0; tries < 10; tries++) {
    a1 = randomNonZeroInt(1, 5);
    b1 = randomNonZeroInt(1, 5);
    a2 = randomNonZeroInt(-5, 5);
    b2 = randomNonZeroInt(-5, 5);
    det = a1 * b2 - a2 * b1;
    if (det !== 0) break;
  }
  a1 = a1!; b1 = b1!; a2 = a2!; b2 = b2!;
  const x = randomInt(-5, 5);
  const y = randomInt(-5, 5);
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  const eq = (a: number, b: number, c: number): string => {
    const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
    const bPart = b === 1 ? 'y' : b === -1 ? '-y' : `${b}y`;
    const sign = b >= 0 ? '+' : '-';
    return b === 1 || b === -1
      ? `${aPart} ${sign} y = ${c}`
      : `${aPart} ${sign} ${Math.abs(b)}y = ${c}`;
  };
  return g7Wrap(difficulty, 'alg1_solve_system_elimination', 'Alg1.SYS.1.3', 'Solving Systems by Elimination', {
    question: `Solve the system by elimination:\n${eq(a1, b1, c1)}\n${eq(a2, b2, c2)}\n\nEnter the solution as (x, y).`,
    answer: `(${x}, ${y})`,
    solution_steps: [
      `Multiply equation 1 by ${a2} and equation 2 by ${a1} to make x-coefficients match.`,
      `Subtract the equations to eliminate x.`,
      `Solve for y: y = ${y}`,
      `Substitute y = ${y} into either equation to find x = ${x}.`,
      `Solution: (${x}, ${y})`,
    ],
    answer_type: 'ordered_pair',
  });
}

// 18. Alg1.FND.4.1 — Solve a One-Step Inequality
export function generate_alg1_solve_inequality_one_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const ops = ['<', '>', '≤', '≥'] as const;
  const op = ops[randomInt(0, 3)]!;
  // Form: x op c (after one inverse operation)
  const useDiv = Math.random() < 0.5;
  if (useDiv) {
    // ax op c
    const a = randomNonZeroInt(-7, 7);
    const x = randomNonZeroInt(-12, 12);
    const c = a * x;
    // When we divide by a negative, the inequality flips.
    const flip = a < 0;
    const finalOp = flip
      ? (op === '<' ? '>' : op === '>' ? '<' : op === '≤' ? '≥' : '≤')
      : op;
    return g7Wrap(difficulty, 'alg1_solve_inequality_one_step', 'Alg1.FND.4.1', 'One-Step Inequalities', {
      question: `Solve for x:  ${a}x ${op} ${c}`,
      answer: `x ${finalOp} ${x}`,
      solution_steps: [
        `Divide both sides by ${a}.`,
        flip ? `Dividing by a negative reverses the inequality.` : `Direction stays the same when dividing by a positive.`,
        `x ${finalOp} ${x}`,
      ],
      answer_type: 'inequality',
    });
  }
  // x + a op c
  const a = randomNonZeroInt(-15, 15);
  const x = randomNonZeroInt(-15, 15);
  const c = x + a;
  return g7Wrap(difficulty, 'alg1_solve_inequality_one_step', 'Alg1.FND.4.1', 'One-Step Inequalities', {
    question: `Solve for x:  x ${a >= 0 ? '+' : '-'} ${Math.abs(a)} ${op} ${c}`,
    answer: `x ${op} ${x}`,
    solution_steps: [
      `${a >= 0 ? 'Subtract' : 'Add'} ${Math.abs(a)} on both sides.`,
      `x ${op} ${x}`,
    ],
    answer_type: 'inequality',
  });
}

// 19. Alg1.FND.4.2 — Solve a Multi-Step Inequality
export function generate_alg1_solve_inequality_multi_step(difficulty: DifficultyLevel): GeneratedQuestion {
  const ops = ['<', '>', '≤', '≥'] as const;
  const op = ops[randomInt(0, 3)]!;
  const a = randomNonZeroInt(-7, 7);
  const b = randomInt(-12, 12);
  const x = randomNonZeroInt(-10, 10);
  const c = a * x + b;
  const flip = a < 0;
  const finalOp = flip
    ? (op === '<' ? '>' : op === '>' ? '<' : op === '≤' ? '≥' : '≤')
    : op;
  return g7Wrap(difficulty, 'alg1_solve_inequality_multi_step', 'Alg1.FND.4.2', 'Multi-Step Inequalities', {
    question: `Solve for x:  ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} ${op} ${c}`,
    answer: `x ${finalOp} ${x}`,
    solution_steps: [
      `${b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides: ${a}x ${op} ${c - b}`,
      flip
        ? `Divide both sides by ${a} (negative → flip the inequality): x ${finalOp} ${x}`
        : `Divide both sides by ${a}: x ${finalOp} ${x}`,
    ],
    answer_type: 'inequality',
  });
}

// 20. Alg1.FND.4.3 — Compound Inequality (AND-style → interval)
export function generate_alg1_compound_inequality(difficulty: DifficultyLevel): GeneratedQuestion {
  // a < ax + b ≤ c → solve to a closed/half-open interval. Use AND-style
  // compound so the answer is a single interval (consistent with the user's
  // 'interval' answer_type spec).
  const inner = randomNonZeroInt(1, 4);                  // multiplier
  const b = randomInt(-6, 6);
  const xLo = randomNonZeroInt(-6, 4);
  const xHi = xLo + randomInt(2, 6);
  const lo = inner * xLo + b;
  const hi = inner * xHi + b;
  return g7Wrap(difficulty, 'alg1_compound_inequality', 'Alg1.FND.4.3', 'Compound Inequality', {
    question: `Solve the compound inequality. Express your answer in interval notation.\n\n${lo} < ${inner}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} ≤ ${hi}`,
    answer: `(${xLo}, ${xHi}]`,
    solution_steps: [
      `${b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} across all three parts: ${lo - b} < ${inner}x ≤ ${hi - b}`,
      `Divide each part by ${inner}: ${xLo} < x ≤ ${xHi}`,
      `Interval notation: (${xLo}, ${xHi}]`,
    ],
    answer_type: 'interval',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: Exponents, Polynomials, Quadratics (ALG1)
// ─────────────────────────────────────────────────────────────────────────────

// 21. Alg1.EXP.1.1 — Simplify Using Integer Exponent Rules
export function generate_alg1_exponent_rules(difficulty: DifficultyLevel): GeneratedQuestion {
  const rules = ['product', 'quotient', 'power_of_power'] as const;
  const rule = difficulty === 1 ? rules[randomInt(0, 1)]! : rules[randomInt(0, 2)]!;
  if (rule === 'product') {
    const a = randomInt(2, 7);
    const b = randomInt(2, 7);
    return g7Wrap(difficulty, 'alg1_exponent_rules', 'Alg1.EXP.1.1', 'Integer Exponent Rules', {
      question: `Simplify: x^${a} · x^${b}`,
      answer: `x^${a + b}`,
      solution_steps: [
        `Product rule: x^a · x^b = x^(a+b)`,
        `${a} + ${b} = ${a + b}`,
        `Result: x^${a + b}`,
      ],
      answer_type: 'expression',
    });
  }
  if (rule === 'quotient') {
    const a = randomInt(5, 12);
    const b = randomInt(1, a - 1);
    return g7Wrap(difficulty, 'alg1_exponent_rules', 'Alg1.EXP.1.1', 'Integer Exponent Rules', {
      question: `Simplify: x^${a} / x^${b}`,
      answer: `x^${a - b}`,
      solution_steps: [
        `Quotient rule: x^a / x^b = x^(a-b)`,
        `${a} − ${b} = ${a - b}`,
        `Result: x^${a - b}`,
      ],
      answer_type: 'expression',
    });
  }
  // power_of_power
  const a = randomInt(2, 5);
  const b = randomInt(2, 5);
  return g7Wrap(difficulty, 'alg1_exponent_rules', 'Alg1.EXP.1.1', 'Integer Exponent Rules', {
    question: `Simplify: (x^${a})^${b}`,
    answer: `x^${a * b}`,
    solution_steps: [
      `Power of a power: (x^a)^b = x^(a·b)`,
      `${a} × ${b} = ${a * b}`,
      `Result: x^${a * b}`,
    ],
    answer_type: 'expression',
  });
}

// 22. Alg1.POLY.1.1 — Add or Subtract Polynomials
export function generate_alg1_add_subtract_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  // (a1 x² + b1 x + c1) ± (a2 x² + b2 x + c2)
  const a1 = randomNonZeroInt(-6, 6);
  const a2 = randomNonZeroInt(-6, 6);
  const b1 = randomInt(-9, 9);
  const b2 = randomInt(-9, 9);
  const c1 = randomInt(-9, 9);
  const c2 = randomInt(-9, 9);
  const subtract = Math.random() < 0.5;
  const sign = subtract ? -1 : 1;
  const aSum = a1 + sign * a2;
  const bSum = b1 + sign * b2;
  const cSum = c1 + sign * c2;
  if (aSum === 0 && bSum === 0 && cSum === 0) {
    return generate_alg1_add_subtract_polynomials(difficulty);
  }
  const fmtPoly = (a: number, b: number, c: number): string => {
    const parts: string[] = [];
    if (a !== 0) parts.push(g7FmtTerm(a, 'x²', true));
    if (b !== 0) parts.push(g7FmtTerm(b, 'x', parts.length === 0));
    if (c !== 0) parts.push(g7FmtConst(c, parts.length === 0));
    return parts.length === 0 ? '0' : parts.join(' ');
  };
  const p1 = fmtPoly(a1, b1, c1);
  const p2 = fmtPoly(a2, b2, c2);
  const op = subtract ? '-' : '+';
  return g7Wrap(difficulty, 'alg1_add_subtract_polynomials', 'Alg1.POLY.1.1', 'Adding/Subtracting Polynomials', {
    question: `Simplify: (${p1}) ${op} (${p2})`,
    answer: fmtPoly(aSum, bSum, cSum),
    solution_steps: [
      subtract
        ? `Distribute the negative: ${p1} − ${p2}`
        : `Drop parentheses: ${p1} + ${p2}`,
      `Combine x² terms: ${a1} ${op} ${a2} = ${aSum}`,
      `Combine x terms: ${b1} ${op} ${b2} = ${bSum}`,
      `Combine constants: ${c1} ${op} ${c2} = ${cSum}`,
      `Result: ${fmtPoly(aSum, bSum, cSum)}`,
    ],
    answer_type: 'expression',
  });
}

// 23. Alg1.POLY.2.1 — Multiply Polynomials (FOIL / distribute)
export function generate_alg1_multiply_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  // (x + a)(x + b) = x² + (a+b)x + ab  — keeps the leading coefficient at 1
  // for difficulty 1, scales up for higher difficulty.
  const aCoef = difficulty === 1 ? 1 : randomNonZeroInt(1, 3);
  const cCoef = difficulty === 1 ? 1 : randomNonZeroInt(1, 3);
  const a = randomNonZeroInt(-7, 7);
  const b = randomNonZeroInt(-7, 7);
  const factor1 = `${aCoef === 1 ? '' : aCoef}x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}`;
  const factor2 = `${cCoef === 1 ? '' : cCoef}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  const x2Coef = aCoef * cCoef;
  const xCoef = aCoef * b + cCoef * a;
  const constTerm = a * b;
  const fmtPoly = (a2: number, a1: number, a0: number): string => {
    const parts: string[] = [];
    if (a2 !== 0) parts.push(g7FmtTerm(a2, 'x²', true));
    if (a1 !== 0) parts.push(g7FmtTerm(a1, 'x', parts.length === 0));
    if (a0 !== 0) parts.push(g7FmtConst(a0, parts.length === 0));
    return parts.length === 0 ? '0' : parts.join(' ');
  };
  return g7Wrap(difficulty, 'alg1_multiply_polynomials', 'Alg1.POLY.2.1', 'Multiplying Polynomials', {
    question: `Multiply and simplify: (${factor1})(${factor2})`,
    answer: fmtPoly(x2Coef, xCoef, constTerm),
    solution_steps: [
      `Apply FOIL:`,
      `  First: ${aCoef}x × ${cCoef}x = ${x2Coef}x²`,
      `  Outer: ${aCoef}x × ${b} = ${aCoef * b}x`,
      `  Inner: ${a} × ${cCoef}x = ${cCoef * a}x`,
      `  Last:  ${a} × ${b} = ${constTerm}`,
      `Combine x terms: ${aCoef * b} + ${cCoef * a} = ${xCoef}`,
      `Result: ${fmtPoly(x2Coef, xCoef, constTerm)}`,
    ],
    answer_type: 'expression',
  });
}

// 24. Alg1.POLY.3.1 — Factor a Trinomial ax² + bx + c
export function generate_alg1_factor_trinomial(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build (x + p)(x + q) so factored form has leading coefficient 1.
  // a = 1, b = p + q, c = p · q.
  let p: number, q: number;
  do {
    p = randomNonZeroInt(-8, 8);
    q = randomNonZeroInt(-8, 8);
  } while (p === q && difficulty < 3);             // avoid perfect-square trinomials at low difficulty
  const b = p + q;
  const c = p * q;
  if (b === 0 || c === 0) return generate_alg1_factor_trinomial(difficulty);
  const trinomial = `x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`;
  // Order the factors so the one with the larger value appears first (deterministic for validation)
  const [first, second] = p >= q ? [p, q] : [q, p];
  const answer = `(x ${first >= 0 ? '+' : '-'} ${Math.abs(first)})(x ${second >= 0 ? '+' : '-'} ${Math.abs(second)})`;
  return g7Wrap(difficulty, 'alg1_factor_trinomial', 'Alg1.POLY.3.1', 'Factoring a Trinomial', {
    question: `Factor completely: ${trinomial}`,
    answer,
    solution_steps: [
      `Find two integers that multiply to ${c} and add to ${b}: ${p} and ${q}.`,
      `Trinomial factors as (x ${p >= 0 ? '+' : '-'} ${Math.abs(p)})(x ${q >= 0 ? '+' : '-'} ${Math.abs(q)}).`,
      `Result: ${answer}`,
    ],
    answer_type: 'expression',
  });
}

// 25. Alg1.QUAD.2.4 — Solve a Quadratic Using the Quadratic Formula
export function generate_alg1_quadratic_formula(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build ax² + bx + c with integer roots r1, r2 so the answer set is clean.
  // ax² + bx + c = a(x - r1)(x - r2) → b = -a(r1 + r2), c = a·r1·r2.
  let a = randomNonZeroInt(1, difficulty === 1 ? 2 : 3);
  if (a < 0) a = -a;                              // keep leading coefficient positive
  let r1 = randomNonZeroInt(-7, 7);
  let r2 = randomNonZeroInt(-7, 7);
  if (r1 === r2) r2 = r2 + 1 === 0 ? r2 + 2 : r2 + 1;
  const b = -a * (r1 + r2);
  const c = a * r1 * r2;
  const aPart = a === 1 ? 'x²' : `${a}x²`;
  const bPart = b === 0 ? '' : b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`;
  const cPart = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
  // Order the roots so validation is deterministic
  const [smaller, larger] = r1 < r2 ? [r1, r2] : [r2, r1];
  const answer = `x = ${smaller}, x = ${larger}`;
  const discriminant = b * b - 4 * a * c;
  return g7Wrap(difficulty, 'alg1_quadratic_formula', 'Alg1.QUAD.2.4', 'Quadratic Formula', {
    question: `Solve using the quadratic formula:  ${aPart}${bPart}${cPart} = 0\n\nList both solutions in the form "x = p, x = q" with the smaller value first.`,
    answer,
    solution_steps: [
      `Quadratic formula: x = (−b ± √(b² − 4ac)) / (2a)`,
      `Identify: a = ${a}, b = ${b}, c = ${c}.`,
      `Discriminant: b² − 4ac = ${b * b} − ${4 * a * c} = ${discriminant}`,
      `√${discriminant} = ${Math.sqrt(discriminant)}`,
      `x = (${-b} ± ${Math.sqrt(discriminant)}) / ${2 * a}`,
      `Solutions: x = ${smaller}, x = ${larger}`,
    ],
    answer_type: 'text',
  });
}

// =============================================================================
// =============================================================================
// NC MATH 3 — VARSITY+ DIVISION (pool: nc_math_3)
// =============================================================================
// =============================================================================
// All generators use the `m3_` prefix. Wrapped via g7Wrap() so each plugs
// into the existing question-delivery pipeline. M3 covers polynomial,
// rational, radical, exponential/log, trig, and inference-style stats —
// curated pools used where the math benefits from clean, deterministic
// outputs (trig values, log bases, complex-number products, etc.).

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: Functions & Inverses
// ─────────────────────────────────────────────────────────────────────────────

// 1. M3.FNI.1.1 — Evaluate a Function
export function generate_m3_evaluate_function(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(-4, 4);
  const b = randomNonZeroInt(-8, 8);
  const c = randomInt(-10, 10);
  const x = randomNonZeroInt(-5, 6);
  const form = difficulty === 1 ? 'linear' : difficulty === 2 ? 'quadratic' : 'cubic';
  if (form === 'linear') {
    const result = a * x + b;
    return g7Wrap(difficulty, 'm3_evaluate_function', 'M3.FNI.1.1', 'Evaluating a Function', {
      question: `If f(x) = ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}, find f(${x}).`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
        `= ${a * x} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
        `= ${result}`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  if (form === 'quadratic') {
    const result = a * x * x + b * x + c;
    return g7Wrap(difficulty, 'm3_evaluate_function', 'M3.FNI.1.1', 'Evaluating a Function', {
      question: `If f(x) = ${a}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}, find f(${x}).`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x})² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}(${x}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`,
        `= ${a * x * x} ${b >= 0 ? '+' : '-'} ${Math.abs(b * x)} ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`,
        `= ${result}`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  // cubic
  const result = x * x * x + a * x;
  return g7Wrap(difficulty, 'm3_evaluate_function', 'M3.FNI.1.1', 'Evaluating a Function', {
    question: `If f(x) = x³ ${a >= 0 ? '+' : '-'} ${Math.abs(a)}x, find f(${x}).`,
    answer: String(result),
    solution_steps: [
      `Substitute x = ${x}: (${x})³ ${a >= 0 ? '+' : '-'} ${Math.abs(a)}(${x})`,
      `= ${x * x * x} ${a >= 0 ? '+' : '-'} ${Math.abs(a * x)}`,
      `= ${result}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 2. M3.FNI.1.2 — Composition of Functions
export function generate_m3_compose_functions(difficulty: DifficultyLevel): GeneratedQuestion {
  // f(g(a)) — evaluate numerically. f and g both linear keeps arithmetic clean.
  const fA = randomNonZeroInt(-4, 4);
  const fB = randomInt(-8, 8);
  const gA = randomNonZeroInt(-4, 4);
  const gB = randomInt(-8, 8);
  const x = randomNonZeroInt(-4, 4);
  const gOfX = gA * x + gB;
  const fOfGOfX = fA * gOfX + fB;
  const fmt = (a: number, b: number): string => {
    const aPart = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
    return b === 0 ? aPart : `${aPart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  };
  return g7Wrap(difficulty, 'm3_compose_functions', 'M3.FNI.1.2', 'Composition of Functions', {
    question: `If f(x) = ${fmt(fA, fB)} and g(x) = ${fmt(gA, gB)}, find f(g(${x})).`,
    answer: String(fOfGOfX),
    solution_steps: [
      `First find g(${x}): ${gA}(${x}) ${gB >= 0 ? '+' : '-'} ${Math.abs(gB)} = ${gOfX}`,
      `Then find f(g(${x})) = f(${gOfX}): ${fA}(${gOfX}) ${fB >= 0 ? '+' : '-'} ${Math.abs(fB)}`,
      `= ${fA * gOfX} ${fB >= 0 ? '+' : '-'} ${Math.abs(fB)}`,
      `= ${fOfGOfX}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 3. M3.FNI.1.3 — Find an Inverse Function
export function generate_m3_inverse_function(difficulty: DifficultyLevel): GeneratedQuestion {
  // f(x) = mx + b   →   f⁻¹(x) = (x - b)/m
  const m = randomNonZeroInt(2, 6);
  const b = randomInt(-10, 10);
  const mPart = m === 1 ? 'x' : `${m}x`;
  const fStr = b === 0 ? `y = ${mPart}` : `y = ${mPart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  const fXStr = b === 0 ? `${mPart}` : `${mPart} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
  const bSign = b >= 0 ? '-' : '+';
  const answer = `f⁻¹(x) = (x ${bSign} ${Math.abs(b)})/${m}`;
  return g7Wrap(difficulty, 'm3_inverse_function', 'M3.FNI.1.3', 'Inverse Functions', {
    question: `Find the inverse of f(x) = ${fXStr}. Write your answer in the form f⁻¹(x) = ...`,
    answer,
    solution_steps: [
      `Replace f(x) with y: ${fStr}`,
      `Swap x and y: x = ${m}y ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
      `${b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: x ${bSign} ${Math.abs(b)} = ${m}y`,
      `Divide by ${m}: y = (x ${bSign} ${Math.abs(b)})/${m}`,
      `So f⁻¹(x) = (x ${bSign} ${Math.abs(b)})/${m}`,
    ],
    answer_type: 'equation',
  });
}

// 4. M3.FNI.1.4 — Domain and Range
export function generate_m3_domain_range(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated function pool with well-known domain restrictions.
  const items: Array<{
    func: string;
    ask: 'domain' | 'range';
    answer: string;
    steps: string[];
  }> = [
    {
      func: `f(x) = √(x - 4)`,
      ask: 'domain',
      answer: 'x ≥ 4',
      steps: [
        `Radicand must be non-negative: x − 4 ≥ 0.`,
        `Solve: x ≥ 4.`,
        `Domain: x ≥ 4.`,
      ],
    },
    {
      func: `f(x) = 1/(x - 3)`,
      ask: 'domain',
      answer: 'x ≠ 3',
      steps: [
        `Denominator must be non-zero: x − 3 ≠ 0.`,
        `Solve: x ≠ 3.`,
        `Domain: all reals except 3.`,
      ],
    },
    {
      func: `f(x) = x² + 2`,
      ask: 'range',
      answer: 'y ≥ 2',
      steps: [
        `x² ≥ 0 for all real x, so x² + 2 ≥ 2.`,
        `Range: y ≥ 2.`,
      ],
    },
    {
      func: `f(x) = -x² + 5`,
      ask: 'range',
      answer: 'y ≤ 5',
      steps: [
        `-x² ≤ 0 for all real x, so -x² + 5 ≤ 5.`,
        `Range: y ≤ 5.`,
      ],
    },
    {
      func: `f(x) = |x| - 3`,
      ask: 'range',
      answer: 'y ≥ -3',
      steps: [
        `|x| ≥ 0 for all x, so |x| − 3 ≥ -3.`,
        `Range: y ≥ -3.`,
      ],
    },
    {
      func: `f(x) = √(9 - x)`,
      ask: 'domain',
      answer: 'x ≤ 9',
      steps: [
        `Radicand must be non-negative: 9 − x ≥ 0.`,
        `Solve: x ≤ 9.`,
        `Domain: x ≤ 9.`,
      ],
    },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  return g7Wrap(difficulty, 'm3_domain_range', 'M3.FNI.1.4', 'Domain and Range', {
    question: `State the ${it.ask} of ${it.func}.`,
    answer: it.answer,
    solution_steps: it.steps,
    answer_type: 'text',
  });
}

// 5. M3.FNI.1.5 — Describe a Function Transformation
export function generate_m3_transformation_describe(difficulty: DifficultyLevel): GeneratedQuestion {
  // g(x) = a · f(x − h) + k. Pick ONE non-identity transformation per question
  // so the description is unambiguous.
  const kinds = (['horizontal_shift', 'vertical_shift', 'vertical_stretch', 'reflection'] as const);
  const kind = kinds[randomInt(0, 3)]!;
  if (kind === 'horizontal_shift') {
    const h = randomNonZeroInt(-5, 5);
    const dir = h > 0 ? 'right' : 'left';
    return g7Wrap(difficulty, 'm3_transformation_describe', 'M3.FNI.1.5', 'Function Transformations', {
      question: `g(x) = f(x ${h >= 0 ? '-' : '+'} ${Math.abs(h)})\n\nDescribe how the graph of g compares to the graph of f.`,
      answer: `horizontal shift ${dir} ${Math.abs(h)}`,
      solution_steps: [
        `Form is f(x − h) with h = ${h}.`,
        `Replacing x with x − ${h} shifts the graph horizontally by ${h}.`,
        `Since h is ${h > 0 ? 'positive' : 'negative'}, the shift is to the ${dir} by ${Math.abs(h)}.`,
      ],
      answer_type: 'text',
    });
  }
  if (kind === 'vertical_shift') {
    const k = randomNonZeroInt(-6, 6);
    const dir = k > 0 ? 'up' : 'down';
    return g7Wrap(difficulty, 'm3_transformation_describe', 'M3.FNI.1.5', 'Function Transformations', {
      question: `g(x) = f(x) ${k >= 0 ? '+' : '-'} ${Math.abs(k)}\n\nDescribe how the graph of g compares to the graph of f.`,
      answer: `vertical shift ${dir} ${Math.abs(k)}`,
      solution_steps: [
        `Form is f(x) + k with k = ${k}.`,
        `Adding k shifts the graph vertically.`,
        `Since k is ${k > 0 ? 'positive' : 'negative'}, the shift is ${dir} by ${Math.abs(k)}.`,
      ],
      answer_type: 'text',
    });
  }
  if (kind === 'vertical_stretch') {
    const a = [2, 3, 4][randomInt(0, 2)]!;
    return g7Wrap(difficulty, 'm3_transformation_describe', 'M3.FNI.1.5', 'Function Transformations', {
      question: `g(x) = ${a}·f(x)\n\nDescribe how the graph of g compares to the graph of f.`,
      answer: `vertical stretch by ${a}`,
      solution_steps: [
        `Form is a·f(x) with a = ${a} > 1.`,
        `Multiplying f(x) by ${a} stretches the graph vertically by a factor of ${a}.`,
      ],
      answer_type: 'text',
    });
  }
  // reflection
  return g7Wrap(difficulty, 'm3_transformation_describe', 'M3.FNI.1.5', 'Function Transformations', {
    question: `g(x) = -f(x)\n\nDescribe how the graph of g compares to the graph of f.`,
    answer: 'reflection across the x-axis',
    solution_steps: [
      `Form is -f(x).`,
      `Negating f(x) flips the graph over the x-axis.`,
    ],
    answer_type: 'text',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: Exponential & Logarithmic (M3)
// ─────────────────────────────────────────────────────────────────────────────

// 6. M3.EL.1.1 — Evaluate an Exponential Function
export function generate_m3_evaluate_exponential(difficulty: DifficultyLevel): GeneratedQuestion {
  // a · b^x with integer answer for clarity (small bases + non-negative x).
  const a = randomInt(2, 6);
  const b = [2, 3, 4, 5][randomInt(0, 3)]!;
  const x = randomInt(0, difficulty === 1 ? 3 : 5);
  const result = a * Math.pow(b, x);
  return g7Wrap(difficulty, 'm3_evaluate_exponential', 'M3.EL.1.1', 'Evaluating Exponential Functions', {
    question: `If f(x) = ${a} · ${b}^x, find f(${x}).`,
    answer: String(result),
    solution_steps: [
      `Substitute x = ${x}: ${a} · ${b}^${x}`,
      `${b}^${x} = ${Math.pow(b, x)}`,
      `${a} × ${Math.pow(b, x)} = ${result}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 7. M3.EL.1.2 — Solve an Exponential Equation
export function generate_m3_solve_exponential_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated bases + answers so the solve uses logarithms cleanly.
  // b^x = c → x = log_b(c) = ln(c)/ln(b).
  const items: Array<{ b: number; c: number }> = [
    { b: 2,  c: 10 },
    { b: 3,  c: 15 },
    { b: 5,  c: 20 },
    { b: 2,  c: 50 },
    { b: 4,  c: 30 },
    { b: 7,  c: 25 },
    { b: 10, c: 5  },
    { b: 6,  c: 100 },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  const x = +(Math.log(it.c) / Math.log(it.b)).toFixed(3);
  return g7Wrap(difficulty, 'm3_solve_exponential_eq', 'M3.EL.1.2', 'Solving Exponential Equations', {
    question: `Solve ${it.b}^x = ${it.c}. Round your answer to 3 decimal places.`,
    answer: x.toFixed(3),
    solution_steps: [
      `Take ln of both sides: x · ln(${it.b}) = ln(${it.c})`,
      `Solve for x: x = ln(${it.c}) / ln(${it.b})`,
      `x ≈ ${Math.log(it.c).toFixed(4)} / ${Math.log(it.b).toFixed(4)}`,
      `x ≈ ${x.toFixed(3)}`,
    ],
    answer_type: 'decimal',
  });
}

// 8. M3.EL.2.1 — Evaluate a Logarithm (Perfect Powers)
export function generate_m3_evaluate_logarithm(difficulty: DifficultyLevel): GeneratedQuestion {
  // log_b(b^n) = n. Curated (base, exponent) pairs to keep math clean.
  const items: Array<{ base: number; exp: number }> = [
    { base: 2,  exp: 3 },   // log_2(8)   = 3
    { base: 2,  exp: 5 },   // log_2(32)  = 5
    { base: 3,  exp: 2 },   // log_3(9)   = 2
    { base: 3,  exp: 4 },   // log_3(81)  = 4
    { base: 4,  exp: 3 },   // log_4(64)  = 3
    { base: 5,  exp: 2 },   // log_5(25)  = 2
    { base: 5,  exp: 3 },   // log_5(125) = 3
    { base: 10, exp: 2 },   // log_10(100) = 2
    { base: 10, exp: 3 },   // log_10(1000)= 3
    { base: 2,  exp: 0 },   // log_2(1) = 0
    { base: 7,  exp: 2 },   // log_7(49) = 2
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  const arg = Math.pow(it.base, it.exp);
  return g7Wrap(difficulty, 'm3_evaluate_logarithm', 'M3.EL.2.1', 'Evaluating Logarithms', {
    question: `Evaluate: log₍${it.base}₎(${arg})`,
    answer: String(it.exp),
    solution_steps: [
      `Recognize that ${it.base}^${it.exp} = ${arg}.`,
      `By the definition of a logarithm, log₍${it.base}₎(${arg}) = ${it.exp}.`,
    ],
    answer_type: 'integer',
  });
}

// 9. M3.EL.2.2 — Expand or Condense a Log Expression
export function generate_m3_expand_condense_log(difficulty: DifficultyLevel): GeneratedQuestion {
  const kind = (['expand_product', 'expand_quotient', 'condense_sum', 'expand_power'] as const)[randomInt(0, 3)]!;
  if (kind === 'expand_product') {
    return g7Wrap(difficulty, 'm3_expand_condense_log', 'M3.EL.2.2', 'Logarithm Properties', {
      question: `Expand using log properties: log(xy)`,
      answer: 'log(x) + log(y)',
      solution_steps: [
        `Product rule: log(MN) = log(M) + log(N).`,
        `log(xy) = log(x) + log(y).`,
      ],
      answer_type: 'expression',
    });
  }
  if (kind === 'expand_quotient') {
    return g7Wrap(difficulty, 'm3_expand_condense_log', 'M3.EL.2.2', 'Logarithm Properties', {
      question: `Expand using log properties: log(x/y)`,
      answer: 'log(x) - log(y)',
      solution_steps: [
        `Quotient rule: log(M/N) = log(M) − log(N).`,
        `log(x/y) = log(x) − log(y).`,
      ],
      answer_type: 'expression',
    });
  }
  if (kind === 'condense_sum') {
    return g7Wrap(difficulty, 'm3_expand_condense_log', 'M3.EL.2.2', 'Logarithm Properties', {
      question: `Condense into a single logarithm: log(3) + log(x)`,
      answer: 'log(3x)',
      solution_steps: [
        `Product rule (reverse direction): log(M) + log(N) = log(MN).`,
        `log(3) + log(x) = log(3x).`,
      ],
      answer_type: 'expression',
    });
  }
  // expand_power
  const n = randomInt(2, 5);
  return g7Wrap(difficulty, 'm3_expand_condense_log', 'M3.EL.2.2', 'Logarithm Properties', {
    question: `Expand using log properties: log(x^${n})`,
    answer: `${n}·log(x)`,
    solution_steps: [
      `Power rule: log(M^p) = p · log(M).`,
      `log(x^${n}) = ${n} · log(x).`,
    ],
    answer_type: 'expression',
  });
}

// 10. M3.EL.3.1 — Exponential Growth or Decay Model
export function generate_m3_exponential_growth_decay(difficulty: DifficultyLevel): GeneratedQuestion {
  // A = P · b^t.  Use whole-number P, common base, integer t for clean answer.
  const P = [100, 200, 500, 1000][randomInt(0, 3)]!;
  const isGrowth = Math.random() < 0.6;
  const b = isGrowth
    ? [1.05, 1.10, 1.20, 1.50, 2][randomInt(0, 4)]!
    : [0.50, 0.80, 0.90, 0.95][randomInt(0, 3)]!;
  const t = randomInt(2, 6);
  const A = +(P * Math.pow(b, t)).toFixed(2);
  const ratePct = isGrowth ? (b - 1) * 100 : (1 - b) * 100;
  return g7Wrap(difficulty, 'm3_exponential_growth_decay', 'M3.EL.3.1', 'Exponential Growth/Decay', {
    question: `A quantity ${isGrowth ? 'grows' : 'decays'} by ${ratePct}% per year. The initial amount is ${P}. Find the amount after ${t} years using A = P·b^t. Round to 2 decimal places.`,
    answer: A.toFixed(2),
    solution_steps: [
      isGrowth
        ? `Growth factor b = 1 + ${ratePct / 100} = ${b}.`
        : `Decay factor b = 1 − ${ratePct / 100} = ${b}.`,
      `A = ${P} · ${b}^${t} = ${P} · ${Math.pow(b, t).toFixed(4)}`,
      `A ≈ ${A.toFixed(2)}`,
    ],
    answer_type: 'decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: Polynomial Functions (M3)
// ─────────────────────────────────────────────────────────────────────────────

// 11. M3.POL.1.1 — Polynomial End Behavior
export function generate_m3_polynomial_end_behavior(difficulty: DifficultyLevel): GeneratedQuestion {
  const degree = (['even', 'odd'] as const)[randomInt(0, 1)]!;
  const leadingPositive = Math.random() < 0.5;
  // Curate the human-readable form of the polynomial so the leading term is unambiguous.
  const deg = degree === 'even' ? [2, 4][randomInt(0, 1)]! : [3, 5][randomInt(0, 1)]!;
  const lc = leadingPositive ? [1, 2, 3][randomInt(0, 2)]! : [-1, -2, -3][randomInt(0, 2)]!;
  const lcDisplay = lc === 1 ? '' : lc === -1 ? '-' : `${lc}`;
  const fStr = `f(x) = ${lcDisplay}x^${deg} + ...`;
  // End-behavior canonical answer in plain language.
  let answer: string;
  let why: string;
  if (degree === 'even') {
    answer = leadingPositive ? 'up and up' : 'down and down';
    why = leadingPositive
      ? `Even degree with positive leading coefficient → both ends rise.`
      : `Even degree with negative leading coefficient → both ends fall.`;
  } else {
    answer = leadingPositive ? 'down and up' : 'up and down';
    why = leadingPositive
      ? `Odd degree with positive leading coefficient → left end falls, right end rises.`
      : `Odd degree with negative leading coefficient → left end rises, right end falls.`;
  }
  return g7Wrap(difficulty, 'm3_polynomial_end_behavior', 'M3.POL.1.1', 'Polynomial End Behavior', {
    question: `${fStr}\n\nDescribe the end behavior of f. Enter exactly one of: "up and up", "down and down", "down and up", or "up and down" (left-end behavior, right-end behavior).`,
    answer,
    solution_steps: [
      `Degree: ${deg} (${degree}).`,
      `Leading coefficient: ${lc} (${leadingPositive ? 'positive' : 'negative'}).`,
      why,
      `Answer: ${answer}.`,
    ],
    answer_type: 'text',
  });
}

// 12. M3.POL.1.2 — Zeros of a Polynomial (from factored form)
export function generate_m3_polynomial_zeros(difficulty: DifficultyLevel): GeneratedQuestion {
  // (x - r1)(x - r2)(x - r3) — zeros are r1, r2, r3.
  const r1 = randomNonZeroInt(-6, 6);
  let r2 = randomNonZeroInt(-6, 6);
  while (r2 === r1) r2 = randomNonZeroInt(-6, 6);
  let r3 = randomNonZeroInt(-6, 6);
  while (r3 === r1 || r3 === r2) r3 = randomNonZeroInt(-6, 6);
  const roots = [r1, r2, r3].sort((a, b) => a - b);
  const factorStr = (r: number): string => `(x ${r >= 0 ? '-' : '+'} ${Math.abs(r)})`;
  return g7Wrap(difficulty, 'm3_polynomial_zeros', 'M3.POL.1.2', 'Zeros of a Polynomial', {
    question: `Find all zeros of f(x) = ${factorStr(r1)}${factorStr(r2)}${factorStr(r3)}. Enter the zeros separated by commas in increasing order, e.g. "-3, 1, 4".`,
    answer: roots.join(', '),
    solution_steps: [
      `Set each factor equal to zero:`,
      `  ${factorStr(r1)} = 0 → x = ${r1}`,
      `  ${factorStr(r2)} = 0 → x = ${r2}`,
      `  ${factorStr(r3)} = 0 → x = ${r3}`,
      `Zeros (in increasing order): ${roots.join(', ')}`,
    ],
    answer_type: 'text',
  });
}

// 13. M3.POL.2.1 — Factor a Cubic Polynomial via Grouping
export function generate_m3_factor_polynomial(difficulty: DifficultyLevel): GeneratedQuestion {
  // ax³ + ax² + bx + b = a x² (x + 1) + b (x + 1) = (a x² + b)(x + 1) — too rigid
  // Use form x³ + ax² + bx + ab → x²(x + a) + b(x + a) = (x² + b)(x + a)
  const a = randomNonZeroInt(-5, 5);
  const b = randomNonZeroInt(-5, 5);
  // Polynomial: x³ + a x² + b x + a b
  const c2 = a;
  const c1 = b;
  const c0 = a * b;
  const polyStr = `x³ ${c2 >= 0 ? '+' : '-'} ${Math.abs(c2)}x² ${c1 >= 0 ? '+' : '-'} ${Math.abs(c1)}x ${c0 >= 0 ? '+' : '-'} ${Math.abs(c0)}`;
  const answer = `(x ${a >= 0 ? '+' : '-'} ${Math.abs(a)})(x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)})`;
  return g7Wrap(difficulty, 'm3_factor_polynomial', 'M3.POL.2.1', 'Factoring Polynomials by Grouping', {
    question: `Factor by grouping: ${polyStr}`,
    answer,
    solution_steps: [
      `Group the first two and last two terms: (x³ ${c2 >= 0 ? '+' : '-'} ${Math.abs(c2)}x²) + (${c1 >= 0 ? '' : '-'}${Math.abs(c1)}x ${c0 >= 0 ? '+' : '-'} ${Math.abs(c0)})`,
      `Factor each group: x²(x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)}(x ${a >= 0 ? '+' : '-'} ${Math.abs(a)})`,
      `Factor out the common binomial (x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}):`,
      `Result: ${answer}`,
    ],
    answer_type: 'expression',
  });
}

// 14. M3.POL.2.2 — Polynomial Division (Synthetic)
export function generate_m3_divide_polynomial(difficulty: DifficultyLevel): GeneratedQuestion {
  // Divide a cubic by (x - r) where r is a known root → quotient is a quadratic.
  // Choose quotient first: x² + p x + q, divisor (x - r). Dividend = (x²+px+q)(x-r).
  const r = randomNonZeroInt(-4, 4);
  const p = randomNonZeroInt(-5, 5);
  const q = randomNonZeroInt(-8, 8);
  // (x² + px + q)(x - r) = x³ + (p - r)x² + (q - p·r)x + (-r·q)
  const a2 = p - r;
  const a1 = q - p * r;
  const a0 = -r * q;
  const dividend = `x³ ${a2 >= 0 ? '+' : '-'} ${Math.abs(a2)}x² ${a1 >= 0 ? '+' : '-'} ${Math.abs(a1)}x ${a0 >= 0 ? '+' : '-'} ${Math.abs(a0)}`;
  const divisor = `(x ${r >= 0 ? '-' : '+'} ${Math.abs(r)})`;
  const quotient = `x² ${p >= 0 ? '+' : '-'} ${Math.abs(p)}x ${q >= 0 ? '+' : '-'} ${Math.abs(q)}`;
  return g7Wrap(difficulty, 'm3_divide_polynomial', 'M3.POL.2.2', 'Polynomial Division', {
    question: `Divide using synthetic or long division: (${dividend}) ÷ ${divisor}\n\nEnter the quotient (the remainder is 0).`,
    answer: quotient,
    solution_steps: [
      `Use synthetic division with r = ${r}.`,
      `Bring down the leading coefficient (1), multiply by ${r}, add to next coefficient.`,
      `Coefficients of quotient: 1, ${p}, ${q}; remainder = 0.`,
      `Quotient: ${quotient}`,
    ],
    answer_type: 'expression',
  });
}

// 15. M3.POL.2.3 — Rational Root Theorem (Possible Roots)
export function generate_m3_rational_root_theorem(difficulty: DifficultyLevel): GeneratedQuestion {
  // List possible rational roots p/q where p | constant and q | leading coefficient.
  const items: Array<{ poly: string; lead: number; constant: number; ps: number[]; qs: number[] }> = [
    { poly: 'x³ + 2x² − 5x + 6',  lead: 1, constant: 6,  ps: [1, 2, 3, 6],      qs: [1] },
    { poly: '2x³ − 3x² + x − 4',  lead: 2, constant: 4,  ps: [1, 2, 4],         qs: [1, 2] },
    { poly: 'x⁴ − 5x² + 4',       lead: 1, constant: 4,  ps: [1, 2, 4],         qs: [1] },
    { poly: '3x³ + 2x² − 5x + 2', lead: 3, constant: 2,  ps: [1, 2],            qs: [1, 3] },
    { poly: 'x³ − 7x + 6',        lead: 1, constant: 6,  ps: [1, 2, 3, 6],      qs: [1] },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  // Build the set of possible roots (±p/q), simplify and dedupe.
  const set = new Set<string>();
  for (const p of it.ps) {
    for (const q of it.qs) {
      const [num, den] = simplifyFraction(p, q);
      const v = den === 1 ? `${num}` : `${num}/${den}`;
      set.add(v);
      set.add(`-${v}`);
    }
  }
  // Sort by absolute value, integers first then fractions.
  const sorted = Array.from(set).sort((a, b) => Math.abs(parseFloat(a)) - Math.abs(parseFloat(b)) || a.localeCompare(b));
  const answer = sorted.join(', ');
  return g7Wrap(difficulty, 'm3_rational_root_theorem', 'M3.POL.2.3', 'Rational Root Theorem', {
    question: `Use the Rational Root Theorem to list all POSSIBLE rational roots of:\n\nf(x) = ${it.poly}\n\nEnter the roots separated by commas (use ± in writing or list both signs explicitly).`,
    answer,
    solution_steps: [
      `Identify p = factors of the constant (${it.constant}): ±${it.ps.join(', ±')}.`,
      `Identify q = factors of the leading coefficient (${it.lead}): ±${it.qs.join(', ±')}.`,
      `Possible rational roots are ±p/q (all combinations, simplified, deduplicated).`,
      `List: ${answer}`,
    ],
    answer_type: 'text',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: Rational & Radical Functions, Complex Numbers (M3)
// ─────────────────────────────────────────────────────────────────────────────

// 16. M3.RAT.1.1 — Simplify a Rational Expression
export function generate_m3_simplify_rational_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  // (x² + (a+b)x + ab) / (x + a) = x + b  when (x + a) is a factor of numerator.
  const a = randomNonZeroInt(-7, 7);
  let b = randomNonZeroInt(-7, 7);
  while (a === b) b = randomNonZeroInt(-7, 7);
  const sumAB = a + b;
  const prodAB = a * b;
  const num = `x² ${sumAB >= 0 ? '+' : '-'} ${Math.abs(sumAB)}x ${prodAB >= 0 ? '+' : '-'} ${Math.abs(prodAB)}`;
  const den = `x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}`;
  const answer = b >= 0 ? `x + ${b}` : `x - ${Math.abs(b)}`;
  return g7Wrap(difficulty, 'm3_simplify_rational_expr', 'M3.RAT.1.1', 'Simplifying Rational Expressions', {
    question: `Simplify the rational expression:\n\n(${num}) / (${den})`,
    answer,
    solution_steps: [
      `Factor the numerator: (x ${a >= 0 ? '+' : '-'} ${Math.abs(a)})(x ${b >= 0 ? '+' : '-'} ${Math.abs(b)})`,
      `Cancel the common factor (x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}).`,
      `Result: ${answer} (where x ≠ ${-a})`,
    ],
    answer_type: 'expression',
  });
}

// 17. M3.RAT.2.1 — Solve a Rational Equation
export function generate_m3_solve_rational_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  // x/a = b/c  →  x = a·b/c. Pick a, b, c so x is an integer.
  const c = randomNonZeroInt(2, 7);
  const x = randomNonZeroInt(-10, 10);
  const a = c * randomNonZeroInt(2, 5);              // a is a multiple of c
  const b = x * c / a * c;                            // ensure clean rational, fallback
  // Easier: just choose x, a, c and back-compute b
  const aClean = randomNonZeroInt(2, 6);
  const bClean = x * c / aClean;
  if (!Number.isInteger(bClean)) {
    // re-roll with clean numerics: set b = x*c/aClean made integer by choosing aClean | (x*c)
    return generate_m3_solve_rational_eq(difficulty);
  }
  return g7Wrap(difficulty, 'm3_solve_rational_eq', 'M3.RAT.2.1', 'Solving Rational Equations', {
    question: `Solve for x:  x/${aClean} = ${bClean}/${c}`,
    answer: String(x),
    solution_steps: [
      `Cross-multiply: x · ${c} = ${aClean} · ${bClean}`,
      `${c}x = ${aClean * bClean}`,
      `x = ${aClean * bClean} / ${c} = ${x}`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 18. M3.RAD.1.1 — Simplify a Radical Expression
export function generate_m3_simplify_radical_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  // √(k² · n) → k√n where n is square-free.
  const k = randomInt(2, 6);
  const n = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15][randomInt(0, 9)]!;
  const radicand = k * k * n;
  return g7Wrap(difficulty, 'm3_simplify_radical_expr', 'M3.RAD.1.1', 'Simplifying Radicals', {
    question: `Simplify: √${radicand}`,
    answer: `${k}√${n}`,
    solution_steps: [
      `Factor the radicand: ${radicand} = ${k * k} · ${n}.`,
      `√${radicand} = √(${k}² · ${n}) = ${k} · √${n}.`,
      `Result: ${k}√${n}.`,
    ],
    answer_type: 'expression',
  });
}

// 19. M3.RAD.2.1 — Solve a Radical Equation
export function generate_m3_solve_radical_eq(difficulty: DifficultyLevel): GeneratedQuestion {
  // √(ax + b) = c  →  ax + b = c²  →  x = (c² − b)/a, with x in domain.
  const c = randomInt(2, 8);
  const a = randomNonZeroInt(1, 4);
  const x = randomInt(1, 12);
  const b = c * c - a * x;                            // back-solve
  if (a * x + b < 0) return generate_m3_solve_radical_eq(difficulty);
  return g7Wrap(difficulty, 'm3_solve_radical_eq', 'M3.RAD.2.1', 'Solving Radical Equations', {
    question: `Solve for x:  √(${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) = ${c}`,
    answer: String(x),
    solution_steps: [
      `Square both sides: ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c * c}.`,
      `Subtract ${b} from both sides: ${a}x = ${c * c - b}.`,
      `Divide by ${a}: x = ${x}.`,
      `Check: √(${a}·${x} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) = √${c * c} = ${c} ✓`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 20. M3.CIR.1.1 — Operations with Complex Numbers
export function generate_m3_complex_numbers(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(-7, 7);
  const b = randomNonZeroInt(-7, 7);
  const c = randomNonZeroInt(-7, 7);
  const d = randomNonZeroInt(-7, 7);
  const op = (['add', 'subtract', 'multiply'] as const)[randomInt(0, 2)]!;
  const fmt = (re: number, im: number): string => {
    if (im === 0) return `${re}`;
    if (re === 0) return im === 1 ? 'i' : im === -1 ? '-i' : `${im}i`;
    const imPart = Math.abs(im) === 1 ? '' : `${Math.abs(im)}`;
    return `${re} ${im >= 0 ? '+' : '-'} ${imPart}i`;
  };
  if (op === 'add') {
    return g7Wrap(difficulty, 'm3_complex_numbers', 'M3.CIR.1.1', 'Complex Number Operations', {
      question: `Simplify: (${fmt(a, b)}) + (${fmt(c, d)})`,
      answer: fmt(a + c, b + d),
      solution_steps: [
        `Add real parts: ${a} + ${c} = ${a + c}.`,
        `Add imaginary parts: ${b} + ${d} = ${b + d}.`,
        `Result: ${fmt(a + c, b + d)}.`,
      ],
      answer_type: 'expression',
    });
  }
  if (op === 'subtract') {
    return g7Wrap(difficulty, 'm3_complex_numbers', 'M3.CIR.1.1', 'Complex Number Operations', {
      question: `Simplify: (${fmt(a, b)}) − (${fmt(c, d)})`,
      answer: fmt(a - c, b - d),
      solution_steps: [
        `Subtract real parts: ${a} − ${c} = ${a - c}.`,
        `Subtract imaginary parts: ${b} − ${d} = ${b - d}.`,
        `Result: ${fmt(a - c, b - d)}.`,
      ],
      answer_type: 'expression',
    });
  }
  // multiply: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
  const re = a * c - b * d;
  const im = a * d + b * c;
  return g7Wrap(difficulty, 'm3_complex_numbers', 'M3.CIR.1.1', 'Complex Number Operations', {
    question: `Simplify: (${fmt(a, b)})(${fmt(c, d)})`,
    answer: fmt(re, im),
    solution_steps: [
      `FOIL: ${a}·${c} + ${a}·${d}i + ${b}·${c}i + ${b}·${d}·i²`,
      `Use i² = -1: ${a * c} + ${a * d}i + ${b * c}i − ${b * d}`,
      `Combine real parts: ${a * c} − ${b * d} = ${re}.`,
      `Combine imaginary parts: ${a * d} + ${b * c} = ${im}.`,
      `Result: ${fmt(re, im)}.`,
    ],
    answer_type: 'expression',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: Trigonometry & Statistics (M3)
// ─────────────────────────────────────────────────────────────────────────────

// 21. M3.TRIG.1.1 — Unit Circle Values
export function generate_m3_unit_circle_values(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated standard angles; answers stored in exact form.
  const items: Array<{ angle: string; sin: string; cos: string; tan: string }> = [
    { angle: '0',     sin: '0',    cos: '1',    tan: '0'         },
    { angle: 'π/6',   sin: '1/2',  cos: '√3/2', tan: '√3/3'      },
    { angle: 'π/4',   sin: '√2/2', cos: '√2/2', tan: '1'         },
    { angle: 'π/3',   sin: '√3/2', cos: '1/2',  tan: '√3'        },
    { angle: 'π/2',   sin: '1',    cos: '0',    tan: 'undefined' },
    { angle: '2π/3',  sin: '√3/2', cos: '-1/2', tan: '-√3'       },
    { angle: '3π/4',  sin: '√2/2', cos: '-√2/2',tan: '-1'        },
    { angle: '5π/6',  sin: '1/2',  cos: '-√3/2',tan: '-√3/3'     },
    { angle: 'π',     sin: '0',    cos: '-1',   tan: '0'         },
    { angle: '7π/6',  sin: '-1/2', cos: '-√3/2',tan: '√3/3'      },
    { angle: '3π/2',  sin: '-1',   cos: '0',    tan: 'undefined' },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  const trig = (['sin', 'cos', 'tan'] as const)[randomInt(0, 2)]!;
  const answer = trig === 'sin' ? it.sin : trig === 'cos' ? it.cos : it.tan;
  return g7Wrap(difficulty, 'm3_unit_circle_values', 'M3.TRIG.1.1', 'Unit Circle Values', {
    question: `Evaluate: ${trig}(${it.angle})`,
    answer,
    solution_steps: [
      `Use the unit-circle definition for ${trig} at angle ${it.angle}.`,
      `${trig}(${it.angle}) = ${answer}.`,
    ],
    answer_type: 'text',
  });
}

// 22. M3.TRIG.2.1 — Solve a Trig Equation on [0, 2π)
export function generate_m3_trig_equation_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated equations with known solutions on [0, 2π).
  const items: Array<{ equation: string; answer: string; steps: string[] }> = [
    {
      equation: 'sin(x) = 1/2',
      answer: 'π/6, 5π/6',
      steps: [
        `sin is 1/2 in the first and second quadrants.`,
        `Reference angle is π/6.`,
        `Solutions on [0, 2π): π/6 and 5π/6.`,
      ],
    },
    {
      equation: 'cos(x) = 1/2',
      answer: 'π/3, 5π/3',
      steps: [
        `cos is 1/2 in the first and fourth quadrants.`,
        `Reference angle is π/3.`,
        `Solutions on [0, 2π): π/3 and 5π/3.`,
      ],
    },
    {
      equation: 'cos(x) = 0',
      answer: 'π/2, 3π/2',
      steps: [
        `cos is 0 at the top and bottom of the unit circle.`,
        `Solutions on [0, 2π): π/2 and 3π/2.`,
      ],
    },
    {
      equation: 'sin(x) = 0',
      answer: '0, π',
      steps: [
        `sin is 0 on the x-axis.`,
        `Solutions on [0, 2π): 0 and π.`,
      ],
    },
    {
      equation: 'tan(x) = 1',
      answer: 'π/4, 5π/4',
      steps: [
        `tan = 1 when sin = cos, in quadrants I and III.`,
        `Solutions on [0, 2π): π/4 and 5π/4.`,
      ],
    },
    {
      equation: 'sin(x) = -1/2',
      answer: '7π/6, 11π/6',
      steps: [
        `sin is negative in quadrants III and IV.`,
        `Reference angle is π/6.`,
        `Solutions on [0, 2π): 7π/6 and 11π/6.`,
      ],
    },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  return g7Wrap(difficulty, 'm3_trig_equation_solve', 'M3.TRIG.2.1', 'Solving Trigonometric Equations', {
    question: `Solve on [0, 2π):  ${it.equation}\n\nEnter the solutions separated by commas, in increasing order.`,
    answer: it.answer,
    solution_steps: it.steps,
    answer_type: 'text',
  });
}

// 23. M3.TRIG.3.1 — Law of Sines (Find a Missing Side)
export function generate_m3_law_of_sines(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use known angles whose sines are exact, then back-compute side ratios.
  const A = [30, 45, 60][randomInt(0, 2)]!;
  const B = [30, 45, 60][randomInt(0, 2)]!;
  if (A + B >= 170) return generate_m3_law_of_sines(difficulty);   // ensure C > 10°
  const a = randomInt(5, 20);                                       // side opposite A
  const sinA = Math.sin(A * Math.PI / 180);
  const sinB = Math.sin(B * Math.PI / 180);
  const b = +(a * sinB / sinA).toFixed(2);                          // side opposite B
  return g7Wrap(difficulty, 'm3_law_of_sines', 'M3.TRIG.3.1', 'Law of Sines', {
    question: `In a triangle, angle A = ${A}° (opposite side a = ${a}) and angle B = ${B}°. Find side b (opposite angle B). Round to 2 decimal places.`,
    answer: b.toFixed(2),
    solution_steps: [
      `Law of Sines: a / sin(A) = b / sin(B).`,
      `Solve for b: b = a · sin(B) / sin(A).`,
      `b = ${a} · sin(${B}°) / sin(${A}°) = ${a} · ${sinB.toFixed(4)} / ${sinA.toFixed(4)}.`,
      `b ≈ ${b.toFixed(2)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 24. M3.PS.1.1 — Empirical Rule (Normal Distribution Percentages)
export function generate_m3_normal_distribution(difficulty: DifficultyLevel): GeneratedQuestion {
  // 68 – 95 – 99.7 rule percentages for z-score windows.
  const items: Array<{ window: string; pct: string; steps: string[] }> = [
    {
      window: 'within 1 standard deviation of the mean',
      pct: '68',
      steps: [`The empirical (68–95–99.7) rule: about 68% of values lie within ±1 SD.`],
    },
    {
      window: 'within 2 standard deviations of the mean',
      pct: '95',
      steps: [`The empirical rule: about 95% of values lie within ±2 SD.`],
    },
    {
      window: 'within 3 standard deviations of the mean',
      pct: '99.7',
      steps: [`The empirical rule: about 99.7% of values lie within ±3 SD.`],
    },
    {
      window: 'between 1 and 2 standard deviations above the mean',
      pct: '13.5',
      steps: [
        `Total between ±2 SD is 95%; between ±1 SD is 68%.`,
        `Outside ±1 SD but within ±2 SD = 95% − 68% = 27%.`,
        `Symmetry: one side is 27% / 2 = 13.5%.`,
      ],
    },
    {
      window: 'more than 2 standard deviations from the mean',
      pct: '5',
      steps: [
        `Within ±2 SD = 95%, so outside ±2 SD = 100% − 95% = 5%.`,
      ],
    },
    {
      window: 'more than 1 standard deviation above the mean',
      pct: '16',
      steps: [
        `Within ±1 SD = 68%, so outside = 32%. Each tail is 32% / 2 = 16%.`,
      ],
    },
  ];
  const it = items[randomInt(0, items.length - 1)]!;
  return g7Wrap(difficulty, 'm3_normal_distribution', 'M3.PS.1.1', 'Empirical Rule (Normal Distribution)', {
    question: `For a normal distribution, what percent of values fall ${it.window}? Enter the percent value (e.g., 68 for 68%).`,
    answer: it.pct,
    solution_steps: it.steps,
    answer_type: 'decimal',
  });
}

// 25. M3.PS.2.1 — Confidence Interval
export function generate_m3_confidence_interval(difficulty: DifficultyLevel): GeneratedQuestion {
  // Compute a 95% CI for a mean using z* = 1.96 and a sample standard error.
  const xbar = randomInt(40, 80);
  const sigma = randomInt(4, 12);
  const n = [25, 36, 49, 64, 100][randomInt(0, 4)]!;
  const se = sigma / Math.sqrt(n);
  const moe = +(1.96 * se).toFixed(2);
  const lo = +(xbar - moe).toFixed(2);
  const hi = +(xbar + moe).toFixed(2);
  return g7Wrap(difficulty, 'm3_confidence_interval', 'M3.PS.2.1', 'Confidence Interval', {
    question: `A sample of size n = ${n} has mean x̄ = ${xbar} and population standard deviation σ = ${sigma}. Construct a 95% confidence interval for the population mean. Use z* = 1.96. Enter the interval as (lower, upper), rounded to 2 decimal places.`,
    answer: `(${lo.toFixed(2)}, ${hi.toFixed(2)})`,
    solution_steps: [
      `Standard error: SE = σ / √n = ${sigma} / √${n} ≈ ${se.toFixed(4)}.`,
      `Margin of error: MOE = 1.96 · SE ≈ ${moe.toFixed(2)}.`,
      `Interval: x̄ ± MOE = ${xbar} ± ${moe.toFixed(2)}.`,
      `CI ≈ (${lo.toFixed(2)}, ${hi.toFixed(2)}).`,
    ],
    answer_type: 'interval',
  });
}

// =============================================================================
// =============================================================================
// MATH FUNDAMENTALS — CROSS-DIVISION POOL (pool: math_fundamentals)
// =============================================================================
// =============================================================================
// MF is the only pool flagged `cross_division_eligible = TRUE`. Generators
// here serve Mathletes from Grade 6 through Grade 10, so parameter ranges
// widen with difficulty to cover that span. All generators wrapped via
// g7Wrap() (helper is pool-agnostic) into the existing pipeline shape.

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: Number Basics & Arithmetic (MF)
// ─────────────────────────────────────────────────────────────────────────────

// 1. MF.ANT.1.1 — Absolute Value
export function generate_mf_absolute_value(difficulty: DifficultyLevel): GeneratedQuestion {
  // Grade-6 easy → integers in [-20, 20]; harder → multi-digit + decimals.
  const useDecimal = difficulty >= 2 && Math.random() < 0.4;
  if (useDecimal) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const n = +(sign * (randomInt(1, 50) + randomInt(0, 99) / 100)).toFixed(2);
    return g7Wrap(difficulty, 'mf_absolute_value', 'MF.ANT.1.1', 'Absolute Value', {
      question: `Find: |${n}|`,
      answer: Math.abs(n).toFixed(2),
      solution_steps: [
        `The absolute value of a number is its distance from 0 on the number line.`,
        `|${n}| = ${Math.abs(n).toFixed(2)}.`,
      ],
      answer_type: 'decimal',
    });
  }
  const range = difficulty === 1 ? 25 : difficulty === 2 ? 100 : 500;
  const n = randomNonZeroInt(-range, range);
  return g7Wrap(difficulty, 'mf_absolute_value', 'MF.ANT.1.1', 'Absolute Value', {
    question: `Find: |${n}|`,
    answer: String(Math.abs(n)),
    solution_steps: [
      `The absolute value of a number is its distance from 0 on the number line.`,
      `|${n}| = ${Math.abs(n)}.`,
    ],
    answer_type: 'integer',
  });
}

// 2. MF.ANT.1.2 — Add / Subtract Integers
export function generate_mf_integer_add_subtract(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 20 : difficulty === 2 ? 60 : 200;
  let a: number, b: number, result: number;
  const op = Math.random() < 0.5 ? '+' : '-';
  for (let tries = 0; tries < 8; tries++) {
    a = randomNonZeroInt(-range, range);
    b = randomNonZeroInt(-range, range);
    result = op === '+' ? a + b : a - b;
    if (result !== 0) break;                         // avoid trivial zero
  }
  a = a!; b = b!; result = result!;
  const bDisplay = b < 0 ? `(${b})` : String(b);
  return g7Wrap(difficulty, 'mf_integer_add_subtract', 'MF.ANT.1.2', 'Adding/Subtracting Integers', {
    question: `Evaluate: ${a} ${op} ${bDisplay}`,
    answer: String(result),
    solution_steps: op === '+'
      ? [
          `Add the two signed integers.`,
          `${a} + ${bDisplay} = ${result}.`,
        ]
      : [
          `Subtract by adding the opposite: ${a} − ${bDisplay} = ${a} + ${(-b) < 0 ? `(${-b})` : -b}.`,
          `Result: ${result}.`,
        ],
    answer_type: 'integer',
  });
}

// 3. MF.ANT.2.1 — Multiply / Divide Integers
export function generate_mf_integer_multiply_divide(difficulty: DifficultyLevel): GeneratedQuestion {
  const useDiv = Math.random() < 0.5;
  const range = difficulty === 1 ? 10 : difficulty === 2 ? 15 : 20;
  if (useDiv) {
    // Build a clean quotient: c = a × b, then ask c ÷ a.
    const a = randomNonZeroInt(2, range);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const b = sign * randomNonZeroInt(2, range);
    const c = a * b;
    const aDisplay = a < 0 ? `(${a})` : String(a);
    return g7Wrap(difficulty, 'mf_integer_multiply_divide', 'MF.ANT.2.1', 'Multiplying/Dividing Integers', {
      question: `Evaluate: ${c} ÷ ${aDisplay}`,
      answer: String(b),
      solution_steps: [
        `Divide the magnitudes, then apply the sign rule.`,
        `${c} ÷ ${a} = ${b}.`,
      ],
      answer_type: 'integer',
    });
  }
  const a = randomNonZeroInt(-range, range);
  const b = randomNonZeroInt(-range, range);
  const aDisplay = a < 0 ? `(${a})` : String(a);
  const bDisplay = b < 0 ? `(${b})` : String(b);
  return g7Wrap(difficulty, 'mf_integer_multiply_divide', 'MF.ANT.2.1', 'Multiplying/Dividing Integers', {
    question: `Evaluate: ${aDisplay} × ${bDisplay}`,
    answer: String(a * b),
    solution_steps: [
      `Multiply the magnitudes: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}.`,
      `Apply the sign rule (same signs → positive, different signs → negative).`,
      `Result: ${a * b}.`,
    ],
    answer_type: 'integer',
  });
}

// 4. MF.FDP.2.1 — Add / Subtract Fractions (Unlike Denominators)
export function generate_mf_fraction_add_subtract(difficulty: DifficultyLevel): GeneratedQuestion {
  // Pick denominators with a non-trivial LCM but small enough to be quick.
  const denPool = difficulty === 1 ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 8, 9, 10, 12];
  let d1 = denPool[randomInt(0, denPool.length - 1)]!;
  let d2 = denPool[randomInt(0, denPool.length - 1)]!;
  while (d1 === d2) d2 = denPool[randomInt(0, denPool.length - 1)]!;
  const n1 = randomNonZeroInt(1, d1 - 1);
  const n2 = randomNonZeroInt(1, d2 - 1);
  const op = Math.random() < 0.5 ? '+' : '-';
  const a = g7Rat(op === '+' ? 1 : 1 * n1, d1);
  void a;
  const r1 = g7Rat(n1, d1);
  const r2 = g7Rat(n2, d2);
  const result = op === '+' ? g7RatAdd(r1, r2) : g7RatSub(r1, r2);
  if (result.num === 0) return generate_mf_fraction_add_subtract(difficulty);
  const lcm = d1 * d2 / gcd(d1, d2);
  return g7Wrap(difficulty, 'mf_fraction_add_subtract', 'MF.FDP.2.1', 'Adding/Subtracting Fractions', {
    question: `Evaluate: ${n1}/${d1} ${op} ${n2}/${d2}`,
    answer: g7FmtRat(result),
    solution_steps: [
      `Common denominator (LCM of ${d1} and ${d2}): ${lcm}.`,
      `Rewrite: ${n1 * (lcm / d1)}/${lcm} ${op} ${n2 * (lcm / d2)}/${lcm}.`,
      `${op === '+' ? 'Add' : 'Subtract'} numerators: ${op === '+' ? n1 * (lcm / d1) + n2 * (lcm / d2) : n1 * (lcm / d1) - n2 * (lcm / d2)}/${lcm}.`,
      `Simplify: ${g7FmtRat(result)}.`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// 5. MF.FDP.2.2 — Multiply / Divide Fractions
export function generate_mf_fraction_multiply_divide(difficulty: DifficultyLevel): GeneratedQuestion {
  const denPool = difficulty === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 7, 8, 9];
  const d1 = denPool[randomInt(0, denPool.length - 1)]!;
  const d2 = denPool[randomInt(0, denPool.length - 1)]!;
  const n1 = randomNonZeroInt(1, d1 + 2);
  const n2 = randomNonZeroInt(1, d2 + 2);
  const useDiv = Math.random() < 0.5;
  const r1 = g7Rat(n1, d1);
  const r2 = g7Rat(n2, d2);
  if (useDiv && r2.num === 0) return generate_mf_fraction_multiply_divide(difficulty);
  const result = useDiv ? g7RatDiv(r1, r2) : g7RatMul(r1, r2);
  if (result.num === 0) return generate_mf_fraction_multiply_divide(difficulty);
  return g7Wrap(difficulty, 'mf_fraction_multiply_divide', 'MF.FDP.2.2', 'Multiplying/Dividing Fractions', {
    question: `Evaluate: ${n1}/${d1} ${useDiv ? '÷' : '×'} ${n2}/${d2}`,
    answer: g7FmtRat(result),
    solution_steps: useDiv
      ? [
          `Multiply by the reciprocal of ${n2}/${d2} (which is ${d2}/${n2}).`,
          `${n1}/${d1} × ${d2}/${n2} = ${n1 * d2}/${d1 * n2}.`,
          `Simplify: ${g7FmtRat(result)}.`,
        ]
      : [
          `Multiply numerators and denominators across.`,
          `${n1}/${d1} × ${n2}/${d2} = ${n1 * n2}/${d1 * d2}.`,
          `Simplify: ${g7FmtRat(result)}.`,
        ],
    answer_type: 'decimal_or_fraction',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: Decimals, Percents & Ratios (MF)
// ─────────────────────────────────────────────────────────────────────────────

// 6. MF.FDP.3.1 — Decimal Operations
export function generate_mf_decimal_operations(difficulty: DifficultyLevel): GeneratedQuestion {
  // Random op + two decimals with at most 2 decimal places to keep results clean.
  const ops = ['+', '-', '×', '÷'] as const;
  const op = ops[randomInt(0, ops.length - 1)]!;
  // Use cents-scale arithmetic to avoid floating-point drift.
  const aHundredths = randomNonZeroInt(difficulty === 1 ? 50 : 100, difficulty === 1 ? 999 : 9999);
  const bHundredths = randomNonZeroInt(difficulty === 1 ? 10 : 50, difficulty === 1 ? 250 : 2000);
  const a = aHundredths / 100;
  const b = bHundredths / 100;
  let result: number;
  let steps: string[];
  if (op === '+') {
    result = (aHundredths + bHundredths) / 100;
    steps = [`Align decimal points and add.`, `${a.toFixed(2)} + ${b.toFixed(2)} = ${result.toFixed(2)}.`];
  } else if (op === '-') {
    result = (aHundredths - bHundredths) / 100;
    steps = [`Align decimal points and subtract.`, `${a.toFixed(2)} − ${b.toFixed(2)} = ${result.toFixed(2)}.`];
  } else if (op === '×') {
    // For multiply, use 1-decimal-place operands so result stays at 2 decimal places.
    const a1 = randomInt(2, difficulty === 1 ? 30 : 90) / 10;
    const b1 = randomInt(2, difficulty === 1 ? 30 : 90) / 10;
    result = +(a1 * b1).toFixed(2);
    return g7Wrap(difficulty, 'mf_decimal_operations', 'MF.FDP.3.1', 'Decimal Operations', {
      question: `Evaluate: ${a1.toFixed(1)} × ${b1.toFixed(1)}`,
      answer: result.toFixed(2),
      solution_steps: [
        `Multiply as if integers: ${a1 * 10} × ${b1 * 10} = ${a1 * 10 * b1 * 10}.`,
        `Account for 2 total decimal places.`,
        `Result: ${result.toFixed(2)}.`,
      ],
      answer_type: 'decimal',
    });
  } else {
    // For divide, build a clean quotient.
    const quotient = randomInt(2, 12);
    const divisor = randomInt(2, 9);
    const dividend = +(quotient * divisor).toFixed(2);
    return g7Wrap(difficulty, 'mf_decimal_operations', 'MF.FDP.3.1', 'Decimal Operations', {
      question: `Evaluate: ${dividend.toFixed(2)} ÷ ${divisor}`,
      answer: quotient.toFixed(2),
      solution_steps: [
        `${dividend.toFixed(2)} ÷ ${divisor} = ${quotient.toFixed(2)}.`,
      ],
      answer_type: 'decimal',
    });
  }
  return g7Wrap(difficulty, 'mf_decimal_operations', 'MF.FDP.3.1', 'Decimal Operations', {
    question: `Evaluate: ${a.toFixed(2)} ${op} ${b.toFixed(2)}`,
    answer: result.toFixed(2),
    solution_steps: steps,
    answer_type: 'decimal',
  });
}

// 7. MF.FDP.4.1 — Percent of a Number
export function generate_mf_percent_of_number(difficulty: DifficultyLevel): GeneratedQuestion {
  // Force a clean result with a 2-decimal answer.
  const pct = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80][randomInt(0, 10)]!;
  const base = randomInt(difficulty === 1 ? 20 : 50, difficulty === 1 ? 200 : 1000);
  const result = +(base * pct / 100).toFixed(2);
  return g7Wrap(difficulty, 'mf_percent_of_number', 'MF.FDP.4.1', 'Percent of a Number', {
    question: `What is ${pct}% of ${base}? Round to 2 decimal places.`,
    answer: result.toFixed(2),
    solution_steps: [
      `Convert ${pct}% to a decimal: ${(pct / 100).toFixed(2)}.`,
      `Multiply: ${(pct / 100).toFixed(2)} × ${base} = ${result.toFixed(2)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 8. MF.RPBA.2.1 — Percent Change
export function generate_mf_percent_change(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a clean integer percent change by picking percent first.
  const pct = [10, 15, 20, 25, 30, 40, 50][randomInt(0, 6)]!;
  const original = randomInt(2, 12) * 10;                   // 20..120
  const direction: 'increase' | 'decrease' = Math.random() < 0.5 ? 'increase' : 'decrease';
  const delta = +(original * pct / 100).toFixed(2);
  const newVal = direction === 'increase'
    ? +(original + delta).toFixed(2)
    : +(original - delta).toFixed(2);
  return g7Wrap(difficulty, 'mf_percent_change', 'MF.RPBA.2.1', 'Percent Change', {
    question: `A value changed from ${original} to ${newVal}. What is the percent ${direction}?`,
    answer: String(pct),
    solution_steps: [
      `Find the change: |${newVal} − ${original}| = ${delta}.`,
      `Divide by the original: ${delta} ÷ ${original} = ${(delta / original).toFixed(4)}.`,
      `Convert to a percent: ${pct}%.`,
    ],
    answer_type: 'decimal',
  });
}

// 9. MF.RPBA.1.1 — Unit Rate from a Ratio
export function generate_mf_ratio_unit_rate(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a clean integer rate. Total = k × x.
  const contexts: Array<{ subj: string; verb: string; unit: string; per: string }> = [
    { subj: 'A printer outputs', verb: 'pages in', unit: 'pages',  per: 'minute' },
    { subj: 'A car drives',      verb: 'miles in', unit: 'miles',  per: 'hour'   },
    { subj: 'Apples cost',       verb: 'dollars for', unit: 'dollars', per: 'pound' },
    { subj: 'A pipe fills',      verb: 'gallons in', unit: 'gallons', per: 'minute' },
  ];
  const ctx = contexts[randomInt(0, contexts.length - 1)]!;
  const k = difficulty === 1 ? randomInt(2, 8) : randomInt(3, 25);
  const x = randomInt(2, difficulty === 1 ? 5 : 12);
  const total = k * x;
  return g7Wrap(difficulty, 'mf_ratio_unit_rate', 'MF.RPBA.1.1', 'Unit Rate from a Ratio', {
    question: `${ctx.subj} ${total} ${ctx.verb} ${x} ${ctx.per}${x === 1 ? '' : 's'}. What is the unit rate in ${ctx.unit} per ${ctx.per}?`,
    answer: String(k),
    solution_steps: [
      `Unit rate = total ÷ units.`,
      `${total} ÷ ${x} = ${k}.`,
      `Answer: ${k} ${ctx.unit} per ${ctx.per}.`,
    ],
    answer_type: 'decimal',
  });
}

// 10. MF.RPBA.1.2 — Solve a Proportion
export function generate_mf_proportion_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // a/b = c/x  →  x = b·c/a, ensure x is a clean integer.
  const k = randomInt(2, difficulty === 1 ? 6 : 12);          // hidden constant of proportionality
  const a = randomInt(2, 5);
  const b = a * k;
  const c = a * randomInt(2, difficulty === 1 ? 5 : 9);
  const x = c * k;
  return g7Wrap(difficulty, 'mf_proportion_solve', 'MF.RPBA.1.2', 'Solve a Proportion', {
    question: `Solve for x:  ${a}/${b} = ${c}/x`,
    answer: String(x),
    solution_steps: [
      `Cross-multiply: ${a} · x = ${b} · ${c}.`,
      `${a}x = ${b * c}.`,
      `Divide by ${a}: x = ${x}.`,
    ],
    answer_type: 'integer',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: Algebraic Reasoning (MF)
// ─────────────────────────────────────────────────────────────────────────────

// 11. MF.AP.1.1 — Evaluate an Algebraic Expression
export function generate_mf_evaluate_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const range = difficulty === 1 ? 8 : difficulty === 2 ? 15 : 25;
  const x = randomNonZeroInt(-range, range);
  const a = randomNonZeroInt(-9, 9);
  const b = randomInt(-15, 15);
  const useQuadratic = difficulty >= 2 && Math.random() < 0.4;
  if (useQuadratic) {
    const result = x * x + a * x + b;
    return g7Wrap(difficulty, 'mf_evaluate_expression', 'MF.AP.1.1', 'Evaluating Algebraic Expressions', {
      question: `Evaluate x² ${a >= 0 ? '+' : '-'} ${Math.abs(a)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} when x = ${x}.`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: (${x})² ${a >= 0 ? '+' : '-'} ${Math.abs(a)}(${x}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)}.`,
        `= ${x * x} ${a >= 0 ? '+' : '-'} ${Math.abs(a * x)} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}.`,
        `= ${result}.`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  const result = a * x + b;
  return g7Wrap(difficulty, 'mf_evaluate_expression', 'MF.AP.1.1', 'Evaluating Algebraic Expressions', {
    question: `Evaluate ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} when x = ${x}.`,
    answer: String(result),
    solution_steps: [
      `Substitute x = ${x}: ${a}(${x}) ${b >= 0 ? '+' : '-'} ${Math.abs(b)}.`,
      `= ${a * x} ${b >= 0 ? '+' : '-'} ${Math.abs(b)}.`,
      `= ${result}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 12. MF.AP.2.1 — Simplify by Combining Like Terms
export function generate_mf_simplify_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const a1 = randomNonZeroInt(-9, 9);
  const a2 = randomNonZeroInt(-9, 9);
  const b1 = randomInt(-12, 12);
  const b2 = randomInt(-12, 12);
  const aSum = a1 + a2;
  const bSum = b1 + b2;
  if (aSum === 0 && bSum === 0) return generate_mf_simplify_expression(difficulty);
  const e1 = g7FmtLinear(a1, b1);
  const e2 = g7FmtLinear(a2, b2);
  return g7Wrap(difficulty, 'mf_simplify_expression', 'MF.AP.2.1', 'Combining Like Terms', {
    question: `Simplify by combining like terms:  (${e1}) + (${e2})`,
    answer: g7FmtLinear(aSum, bSum),
    solution_steps: [
      `Drop the parentheses: ${e1} + ${e2}.`,
      `Combine x-terms: ${a1}x + ${a2}x = ${aSum}x.`,
      `Combine constants: ${b1} + ${b2} = ${bSum}.`,
      `Result: ${g7FmtLinear(aSum, bSum)}.`,
    ],
    answer_type: 'expression',
  });
}

// 13. MF.AP.4.1 — Solve a One-Step Equation
export function generate_mf_solve_one_step_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const useMul = Math.random() < 0.5;
  if (useMul) {
    // ax = c
    const a = randomNonZeroInt(2, difficulty === 1 ? 6 : 12);
    const x = randomNonZeroInt(-15, 15);
    const c = a * x;
    return g7Wrap(difficulty, 'mf_solve_one_step_equation', 'MF.AP.4.1', 'One-Step Equations', {
      question: `Solve for x:  ${a}x = ${c}`,
      answer: String(x),
      solution_steps: [
        `Divide both sides by ${a}.`,
        `x = ${c} / ${a} = ${x}.`,
      ],
      answer_type: 'integer',
    });
  }
  // x + a = c  or  x - a = c
  const sub = Math.random() < 0.5;
  const a = randomNonZeroInt(1, difficulty === 1 ? 20 : 40);
  const x = randomNonZeroInt(-20, 20);
  const c = sub ? x - a : x + a;
  const opShown = sub ? '-' : '+';
  const inverse = sub ? `Add ${a}` : `Subtract ${a}`;
  return g7Wrap(difficulty, 'mf_solve_one_step_equation', 'MF.AP.4.1', 'One-Step Equations', {
    question: `Solve for x:  x ${opShown} ${a} = ${c}`,
    answer: String(x),
    solution_steps: [
      `${inverse} from both sides to isolate x.`,
      `x = ${c} ${sub ? '+' : '-'} ${a} = ${x}.`,
    ],
    answer_type: 'integer',
  });
}

// 14. MF.AP.4.2 — Solve a Two-Step Equation
export function generate_mf_solve_two_step_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomNonZeroInt(2, difficulty === 1 ? 8 : 15);
  const x = randomNonZeroInt(-12, 12);
  const b = randomInt(-15, 15);
  const c = a * x + b;
  return g7Wrap(difficulty, 'mf_solve_two_step_equation', 'MF.AP.4.2', 'Two-Step Equations', {
    question: `Solve for x:  ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}`,
    answer: String(x),
    solution_steps: [
      b !== 0
        ? `Subtract ${b >= 0 ? b : `(${b})`} from both sides: ${a}x = ${c - b}.`
        : `${a}x = ${c}.`,
      `Divide both sides by ${a}: x = ${x}.`,
    ],
    answer_type: 'integer',
  });
}

// 15. MF.AP.3.1 — Write an Algebraic Expression from a Verbal Description
export function generate_mf_write_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = randomInt(2, 9);
  const b = randomInt(2, 12);
  const templates: Array<{ phrase: string; answer: string; steps: string[] }> = [
    {
      phrase: `${a} more than a number n`,
      answer: `n + ${a}`,
      steps: [`"More than" → addition.`, `n + ${a}`],
    },
    {
      phrase: `${a} less than a number x`,
      answer: `x - ${a}`,
      steps: [`"Less than" reverses the order: x − ${a}`, `Result: x - ${a}`],
    },
    {
      phrase: `the product of ${a} and a number y`,
      answer: `${a}y`,
      steps: [`"Product" → multiplication.`, `${a} × y = ${a}y`],
    },
    {
      phrase: `a number n divided by ${a}`,
      answer: `n/${a}`,
      steps: [`"Divided by" → division.`, `n ÷ ${a} = n/${a}`],
    },
    {
      phrase: `${a} times a number n increased by ${b}`,
      answer: `${a}n + ${b}`,
      steps: [`"${a} times n" → ${a}n.`, `"Increased by ${b}" → ${a}n + ${b}.`],
    },
    {
      phrase: `the difference of a number x and ${a}, divided by ${b}`,
      answer: `(x - ${a})/${b}`,
      steps: [`"Difference" → x − ${a}.`, `"Divided by ${b}" → (x − ${a})/${b}.`],
    },
  ];
  const t = templates[randomInt(0, templates.length - 1)]!;
  return g7Wrap(difficulty, 'mf_write_expression', 'MF.AP.3.1', 'Writing Algebraic Expressions', {
    question: `Translate into an algebraic expression: ${t.phrase}.`,
    answer: t.answer,
    solution_steps: t.steps,
    answer_type: 'expression',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: Geometry (MF)
// ─────────────────────────────────────────────────────────────────────────────

// 16. MF.GEO.1.1 — Area of a Rectangle or Triangle
export function generate_mf_area_rectangle_triangle(difficulty: DifficultyLevel): GeneratedQuestion {
  const useTriangle = Math.random() < 0.5;
  const range = difficulty === 1 ? 12 : difficulty === 2 ? 20 : 35;
  if (useTriangle) {
    // Force even base × height so area is an integer.
    let base = randomInt(3, range);
    const height = randomInt(2, range);
    if ((base * height) % 2 !== 0) base += 1;
    const area = (base * height) / 2;
    return g7Wrap(difficulty, 'mf_area_rectangle_triangle', 'MF.GEO.1.1', 'Area of Rectangle / Triangle', {
      question: `Find the area of a triangle with base ${base} cm and height ${height} cm.`,
      answer: String(area),
      solution_steps: [
        `Area of a triangle = ½ × base × height.`,
        `= ½ × ${base} × ${height} = ${area} cm².`,
      ],
      answer_type: 'integer',
    });
  }
  const l = randomInt(3, range);
  const w = randomInt(2, range);
  return g7Wrap(difficulty, 'mf_area_rectangle_triangle', 'MF.GEO.1.1', 'Area of Rectangle / Triangle', {
    question: `Find the area of a rectangle with length ${l} cm and width ${w} cm.`,
    answer: String(l * w),
    solution_steps: [
      `Area of a rectangle = length × width.`,
      `= ${l} × ${w} = ${l * w} cm².`,
    ],
    answer_type: 'integer',
  });
}

// 17. MF.GEO.1.2 — Perimeter of a Polygon
export function generate_mf_perimeter(difficulty: DifficultyLevel): GeneratedQuestion {
  const shapes = (['rectangle', 'triangle', 'pentagon'] as const);
  const shape = shapes[randomInt(0, shapes.length - 1)]!;
  const max = difficulty === 1 ? 15 : difficulty === 2 ? 30 : 50;
  if (shape === 'rectangle') {
    const l = randomInt(3, max);
    const w = randomInt(3, max);
    const p = 2 * (l + w);
    return g7Wrap(difficulty, 'mf_perimeter', 'MF.GEO.1.2', 'Perimeter of a Polygon', {
      question: `Find the perimeter of a rectangle with length ${l} cm and width ${w} cm.`,
      answer: String(p),
      solution_steps: [
        `Perimeter of a rectangle = 2(l + w).`,
        `= 2(${l} + ${w}) = 2 × ${l + w} = ${p} cm.`,
      ],
      answer_type: 'integer',
    });
  }
  if (shape === 'triangle') {
    const a = randomInt(3, max);
    const b = randomInt(3, max);
    const c = randomInt(3, max);
    return g7Wrap(difficulty, 'mf_perimeter', 'MF.GEO.1.2', 'Perimeter of a Polygon', {
      question: `Find the perimeter of a triangle with side lengths ${a} cm, ${b} cm, and ${c} cm.`,
      answer: String(a + b + c),
      solution_steps: [
        `Perimeter = sum of all sides.`,
        `= ${a} + ${b} + ${c} = ${a + b + c} cm.`,
      ],
      answer_type: 'integer',
    });
  }
  // regular pentagon
  const s = randomInt(3, max);
  return g7Wrap(difficulty, 'mf_perimeter', 'MF.GEO.1.2', 'Perimeter of a Polygon', {
    question: `Find the perimeter of a regular pentagon with side length ${s} cm.`,
    answer: String(5 * s),
    solution_steps: [
      `A regular pentagon has 5 equal sides.`,
      `Perimeter = 5 × ${s} = ${5 * s} cm.`,
    ],
    answer_type: 'integer',
  });
}

// 18. MF.GEO.3.2 — Pythagorean Theorem
export function generate_mf_pythagorean_theorem(difficulty: DifficultyLevel): GeneratedQuestion {
  // Pythagorean triples produce integer answers (avoid irrational radicals).
  const triples: Array<[number, number, number]> = [
    [3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25], [9, 12, 15], [9, 40, 41], [20, 21, 29],
  ];
  const [a, b, c] = triples[randomInt(0, triples.length - 1)]!;
  const findHypotenuse = Math.random() < 0.5;
  if (findHypotenuse) {
    return g7Wrap(difficulty, 'mf_pythagorean_theorem', 'MF.GEO.3.2', 'Pythagorean Theorem', {
      question: `A right triangle has legs ${a} and ${b}. Find the length of the hypotenuse.`,
      answer: String(c),
      solution_steps: [
        `Pythagorean theorem: a² + b² = c².`,
        `${a}² + ${b}² = ${a * a + b * b}.`,
        `c = √${a * a + b * b} = ${c}.`,
      ],
      answer_type: 'integer',
    });
  }
  // Find the missing leg
  const missingIsA = Math.random() < 0.5;
  const knownLeg = missingIsA ? b : a;
  const missing = missingIsA ? a : b;
  return g7Wrap(difficulty, 'mf_pythagorean_theorem', 'MF.GEO.3.2', 'Pythagorean Theorem', {
    question: `A right triangle has hypotenuse ${c} and one leg ${knownLeg}. Find the length of the other leg.`,
    answer: String(missing),
    solution_steps: [
      `Pythagorean theorem: leg² + ${knownLeg}² = ${c}².`,
      `leg² = ${c * c} − ${knownLeg * knownLeg} = ${c * c - knownLeg * knownLeg}.`,
      `leg = √${c * c - knownLeg * knownLeg} = ${missing}.`,
    ],
    answer_type: 'integer',
  });
}

// 19. MF.GEO.2.2 — Angle Relationships
export function generate_mf_angle_relationships(difficulty: DifficultyLevel): GeneratedQuestion {
  const relationships = [
    { kind: 'supplementary', total: 180,  rule: 'sum to 180°' },
    { kind: 'complementary', total: 90,   rule: 'sum to 90°'  },
    { kind: 'vertical',      total: null as number | null, rule: 'are equal' },
  ] as const;
  const rel = relationships[randomInt(0, 2)]!;
  if (rel.kind === 'vertical') {
    const a = randomInt(15, 165);
    return g7Wrap(difficulty, 'mf_angle_relationships', 'MF.GEO.2.2', 'Angle Relationships', {
      question: `Two vertical angles are formed by intersecting lines. One angle measures ${a}°. What is the measure of the other?`,
      answer: String(a),
      solution_steps: [
        `Vertical angles ${rel.rule}.`,
        `Therefore the other angle is ${a}°.`,
      ],
      answer_type: 'integer',
    });
  }
  const total = rel.total!;
  const lo = rel.kind === 'complementary' ? 10 : 20;
  const a = randomInt(lo, total - lo);
  const b = total - a;
  return g7Wrap(difficulty, 'mf_angle_relationships', 'MF.GEO.2.2', 'Angle Relationships', {
    question: `Two angles are ${rel.kind}. One measures ${a}°. Find the measure of the other.`,
    answer: String(b),
    solution_steps: [
      `${rel.kind.charAt(0).toUpperCase() + rel.kind.slice(1)} angles ${rel.rule}.`,
      `${total} − ${a} = ${b}°.`,
    ],
    answer_type: 'integer',
  });
}

// 20. MF.GEO.4.1 — Volume of a Rectangular Prism
export function generate_mf_volume_rectangular_prism(difficulty: DifficultyLevel): GeneratedQuestion {
  const max = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 20;
  const l = randomInt(2, max);
  const w = randomInt(2, max);
  const h = randomInt(2, max);
  const V = l * w * h;
  return g7Wrap(difficulty, 'mf_volume_rectangular_prism', 'MF.GEO.4.1', 'Volume of a Rectangular Prism', {
    question: `Find the volume of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm.`,
    answer: String(V),
    solution_steps: [
      `Volume = length × width × height.`,
      `= ${l} × ${w} × ${h} = ${V} cm³.`,
    ],
    answer_type: 'integer',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: Data, Statistics & Sets (MF)
// ─────────────────────────────────────────────────────────────────────────────

// 21. MF.S.1.1 — Mean / Median / Mode
export function generate_mf_mean_median_mode(difficulty: DifficultyLevel): GeneratedQuestion {
  const size = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 9;
  const range = difficulty === 1 ? 20 : 50;
  // Build a data set with at least one repeated value so mode is well-defined.
  const values: number[] = [];
  const repeat = randomInt(2, Math.min(8, range));
  values.push(repeat, repeat);
  while (values.length < size) values.push(randomInt(1, range));
  // Sort for median / mode display.
  values.sort((a, b) => a - b);
  const ask = (['mean', 'median', 'mode'] as const)[randomInt(0, 2)]!;
  if (ask === 'mean') {
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = +(sum / values.length).toFixed(2);
    return g7Wrap(difficulty, 'mf_mean_median_mode', 'MF.S.1.1', 'Mean, Median, Mode', {
      question: `Find the MEAN of: ${values.join(', ')}\n\nRound to 2 decimal places if needed.`,
      answer: mean.toFixed(2),
      solution_steps: [
        `Sum the values: ${values.join(' + ')} = ${sum}.`,
        `Divide by the count (${values.length}): ${sum} / ${values.length} = ${mean.toFixed(2)}.`,
      ],
      answer_type: 'decimal',
    });
  }
  if (ask === 'median') {
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 1
      ? values[mid]!
      : +((values[mid - 1]! + values[mid]!) / 2).toFixed(2);
    return g7Wrap(difficulty, 'mf_mean_median_mode', 'MF.S.1.1', 'Mean, Median, Mode', {
      question: `Find the MEDIAN of: ${values.join(', ')}`,
      answer: String(median),
      solution_steps: [
        `Sort the values: ${values.join(', ')}.`,
        values.length % 2 === 1
          ? `Middle value (position ${mid + 1}): ${median}.`
          : `Average of the two middle values: (${values[mid - 1]} + ${values[mid]}) / 2 = ${median}.`,
      ],
      answer_type: 'decimal',
    });
  }
  // mode — the value we forced to repeat is the mode (or a mode).
  return g7Wrap(difficulty, 'mf_mean_median_mode', 'MF.S.1.1', 'Mean, Median, Mode', {
    question: `Find the MODE of: ${values.join(', ')}`,
    answer: String(repeat),
    solution_steps: [
      `Mode = the value that appears most frequently.`,
      `${repeat} appears more than once; no other value does.`,
      `Mode = ${repeat}.`,
    ],
    answer_type: 'integer',
  });
}

// 22. MF.S.2.1 — Range / IQR
export function generate_mf_range_iqr(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use 7 values for clean Q1/Q3 positions (Q1 = 2nd, median = 4th, Q3 = 6th).
  const values: number[] = [];
  const seen = new Set<number>();
  while (values.length < 7) {
    const v = randomInt(1, difficulty === 1 ? 25 : 60);
    if (!seen.has(v)) {
      seen.add(v);
      values.push(v);
    }
  }
  values.sort((a, b) => a - b);
  const range = values[6]! - values[0]!;
  const Q1 = values[1]!;
  const Q3 = values[5]!;
  const IQR = Q3 - Q1;
  const askIQR = Math.random() < 0.5;
  if (askIQR) {
    return g7Wrap(difficulty, 'mf_range_iqr', 'MF.S.2.1', 'Range and IQR', {
      question: `Find the IQR (interquartile range) of: ${values.join(', ')}`,
      answer: String(IQR),
      solution_steps: [
        `With 7 values, Q1 is the 2nd value and Q3 is the 6th.`,
        `Q1 = ${Q1}, Q3 = ${Q3}.`,
        `IQR = Q3 − Q1 = ${Q3} − ${Q1} = ${IQR}.`,
      ],
      answer_type: 'integer',
    });
  }
  return g7Wrap(difficulty, 'mf_range_iqr', 'MF.S.2.1', 'Range and IQR', {
    question: `Find the RANGE of: ${values.join(', ')}`,
    answer: String(range),
    solution_steps: [
      `Range = max − min.`,
      `${values[6]} − ${values[0]} = ${range}.`,
    ],
    answer_type: 'integer',
  });
}

// 23. MF.RAD.1.1 — Basic Probability
export function generate_mf_probability_basic(difficulty: DifficultyLevel): GeneratedQuestion {
  const exp = (['dice', 'coin', 'marbles', 'spinner'] as const)[randomInt(0, 3)]!;
  if (exp === 'dice') {
    const targets: Array<{ desc: string; favorable: number; total: number }> = [
      { desc: 'rolling an even number',  favorable: 3, total: 6 },
      { desc: 'rolling a number > 4',    favorable: 2, total: 6 },
      { desc: 'rolling a multiple of 3', favorable: 2, total: 6 },
      { desc: 'rolling a prime',         favorable: 3, total: 6 },
    ];
    const t = targets[randomInt(0, targets.length - 1)]!;
    const [rn, rd] = simplifyFraction(t.favorable, t.total);
    return g7Wrap(difficulty, 'mf_probability_basic', 'MF.RAD.1.1', 'Basic Probability', {
      question: `What is the probability of ${t.desc} on a fair six-sided die?`,
      answer: `${rn}/${rd}`,
      solution_steps: [
        `Favorable outcomes: ${t.favorable}.`,
        `Total outcomes: ${t.total}.`,
        `P = ${t.favorable}/${t.total} = ${rn}/${rd}.`,
      ],
      answer_type: 'fraction',
    });
  }
  if (exp === 'coin') {
    return g7Wrap(difficulty, 'mf_probability_basic', 'MF.RAD.1.1', 'Basic Probability', {
      question: `What is the probability of flipping heads on a fair coin?`,
      answer: '1/2',
      solution_steps: [
        `Favorable outcomes: 1 (heads).`,
        `Total outcomes: 2 (heads, tails).`,
        `P = 1/2.`,
      ],
      answer_type: 'fraction',
    });
  }
  if (exp === 'marbles') {
    const red = randomInt(2, 8);
    const blue = randomInt(2, 8);
    const green = randomInt(1, 5);
    const total = red + blue + green;
    const colors: Array<['red' | 'blue' | 'green', number]> = [['red', red], ['blue', blue], ['green', green]];
    const pick = colors[randomInt(0, 2)]!;
    const [rn, rd] = simplifyFraction(pick[1], total);
    return g7Wrap(difficulty, 'mf_probability_basic', 'MF.RAD.1.1', 'Basic Probability', {
      question: `A bag contains ${red} red, ${blue} blue, and ${green} green marbles. What is the probability of drawing a ${pick[0]} marble?`,
      answer: `${rn}/${rd}`,
      solution_steps: [
        `Total marbles: ${red} + ${blue} + ${green} = ${total}.`,
        `Favorable: ${pick[1]} ${pick[0]} marbles.`,
        `P = ${pick[1]}/${total} = ${rn}/${rd}.`,
      ],
      answer_type: 'fraction',
    });
  }
  // spinner
  const sectors = [4, 5, 6, 8][randomInt(0, 3)]!;
  const favorable = randomInt(1, sectors - 1);
  const [rn, rd] = simplifyFraction(favorable, sectors);
  return g7Wrap(difficulty, 'mf_probability_basic', 'MF.RAD.1.1', 'Basic Probability', {
    question: `A spinner has ${sectors} equal sectors. ${favorable} ${favorable === 1 ? 'is' : 'are'} shaded. What is the probability of landing on a shaded sector?`,
    answer: `${rn}/${rd}`,
    solution_steps: [
      `Favorable: ${favorable}, Total: ${sectors}.`,
      `P = ${favorable}/${sectors} = ${rn}/${rd}.`,
    ],
    answer_type: 'fraction',
  });
}

// 24. MF.ER.1.1 — Evaluate Integer Exponents
export function generate_mf_exponent_evaluate(difficulty: DifficultyLevel): GeneratedQuestion {
  const base = randomInt(2, difficulty === 1 ? 6 : 12);
  const exp = randomInt(0, difficulty === 1 ? 3 : 6);
  const negativeBase = difficulty >= 2 && Math.random() < 0.3;
  const finalBase = negativeBase ? -base : base;
  const result = Math.pow(finalBase, exp);
  const display = negativeBase ? `(-${base})` : String(base);
  return g7Wrap(difficulty, 'mf_exponent_evaluate', 'MF.ER.1.1', 'Evaluating Integer Exponents', {
    question: `Evaluate: ${display}^${exp}`,
    answer: String(result),
    solution_steps: exp === 0
      ? [`Any non-zero base raised to the 0 power equals 1.`, `${display}^0 = 1.`]
      : [
          `Multiply ${display} by itself ${exp} times.`,
          `${Array(exp).fill(display).join(' × ')} = ${result}.`,
        ],
    answer_type: 'integer',
  });
}

// 25. MF.ER.2.1 — Square Root / Cube Root of Perfect Powers
export function generate_mf_square_cube_root(difficulty: DifficultyLevel): GeneratedQuestion {
  const squareBases = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const cubeBases = [1, 2, 3, 4, 5, 6, 7, 8];
  const useCube = difficulty >= 2 && Math.random() < 0.4;
  if (useCube) {
    const k = cubeBases[randomInt(0, cubeBases.length - 1)]!;
    const n = k * k * k;
    return g7Wrap(difficulty, 'mf_square_cube_root', 'MF.ER.2.1', 'Square and Cube Roots', {
      question: `Find: ∛${n}`,
      answer: String(k),
      solution_steps: [
        `Find the integer whose cube is ${n}.`,
        `${k}³ = ${n}, so ∛${n} = ${k}.`,
      ],
      answer_type: 'integer',
    });
  }
  const k = squareBases[randomInt(0, squareBases.length - 1)]!;
  const n = k * k;
  return g7Wrap(difficulty, 'mf_square_cube_root', 'MF.ER.2.1', 'Square and Cube Roots', {
    question: `Find: √${n}`,
    answer: String(k),
    solution_steps: [
      `Find the non-negative integer whose square is ${n}.`,
      `${k}² = ${n}, so √${n} = ${k}.`,
    ],
    answer_type: 'integer',
  });
}

// =============================================================================
// =============================================================================
// NC GRADE 6 — RISING STARS DIVISION (pool: nc_grade_6)
// =============================================================================
// =============================================================================
// All generators use the `g6_` prefix. Wrapped via g7Wrap() so each plugs
// into the existing question-delivery pipeline. Params follow the spec in
// docs/curriculum/grade6/NC_Grade_6_generators.json.

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1: NS — Decimal & Fraction Operations
// ─────────────────────────────────────────────────────────────────────────────

// 1. M6.NS.1.1 — Add / Subtract Multi-Digit Decimals
export function generate_g6_ns_add_sub_decimals(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use cents-or-thousandths-scale integer arithmetic to avoid FP drift.
  const decimalPlaces = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3;
  const scale = Math.pow(10, decimalPlaces);
  const digitMax = difficulty === 1 ? 99 : difficulty === 2 ? 999 : 9999;
  const a = randomInt(Math.floor(digitMax / 10), digitMax);
  const b = randomInt(Math.floor(digitMax / 10), digitMax);
  const op = Math.random() < 0.5 ? 'add' : 'subtract';
  const [larger, smaller] = a >= b ? [a, b] : [b, a];
  const aDec = (op === 'subtract' ? larger : a) / scale;
  const bDec = (op === 'subtract' ? smaller : b) / scale;
  const resultRaw = op === 'add' ? a + b : larger - smaller;
  const result = resultRaw / scale;
  return g7Wrap(difficulty, 'g6_ns_add_sub_decimals', 'M6.NS.1.1', 'Adding/Subtracting Decimals', {
    question: `Evaluate: ${aDec.toFixed(decimalPlaces)} ${op === 'add' ? '+' : '-'} ${bDec.toFixed(decimalPlaces)}`,
    answer: result.toFixed(decimalPlaces),
    solution_steps: [
      `Align the decimal points.`,
      op === 'add'
        ? `Add: ${aDec.toFixed(decimalPlaces)} + ${bDec.toFixed(decimalPlaces)} = ${result.toFixed(decimalPlaces)}.`
        : `Subtract: ${aDec.toFixed(decimalPlaces)} − ${bDec.toFixed(decimalPlaces)} = ${result.toFixed(decimalPlaces)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 2. M6.NS.1.2 — Multiply Multi-Digit Decimals
export function generate_g6_ns_multiply_decimals(difficulty: DifficultyLevel): GeneratedQuestion {
  // factor1 and factor2 each have 1 or 2 decimal places. Combined ≤ 4 total digits.
  const p1 = difficulty === 1 ? 1 : randomInt(1, 2);
  const p2 = difficulty === 1 ? 1 : randomInt(1, 2);
  const aRaw = randomInt(11, difficulty === 1 ? 49 : 99);
  const bRaw = randomInt(11, difficulty === 1 ? 49 : 99);
  const a = aRaw / Math.pow(10, p1);
  const b = bRaw / Math.pow(10, p2);
  const productRaw = aRaw * bRaw;
  const product = productRaw / Math.pow(10, p1 + p2);
  return g7Wrap(difficulty, 'g6_ns_multiply_decimals', 'M6.NS.1.2', 'Multiplying Decimals', {
    question: `Evaluate: ${a.toFixed(p1)} × ${b.toFixed(p2)}`,
    answer: product.toFixed(p1 + p2),
    solution_steps: [
      `Multiply as if integers: ${aRaw} × ${bRaw} = ${productRaw}.`,
      `Total decimal places in the factors: ${p1 + p2}.`,
      `Place the decimal point: ${product.toFixed(p1 + p2)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 3. M6.NS.1.3 — Long Division of Whole Numbers
export function generate_g6_ns_long_division_whole(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a clean quotient first so the answer is an exact decimal.
  const divisor = randomInt(difficulty === 1 ? 2 : 11, difficulty === 1 ? 9 : 25);
  const quotient = randomInt(difficulty === 1 ? 5 : 20, difficulty === 1 ? 50 : 400);
  const dividend = divisor * quotient;
  return g7Wrap(difficulty, 'g6_ns_long_division_whole', 'M6.NS.1.3', 'Long Division of Whole Numbers', {
    question: `Evaluate: ${dividend} ÷ ${divisor}`,
    answer: String(quotient),
    solution_steps: [
      `Set up long division.`,
      `${dividend} ÷ ${divisor} = ${quotient} (remainder 0).`,
    ],
    answer_type: 'decimal',
  });
}

// 4. M6.NS.1.4 — Divide Decimals (decimal ÷ whole or decimal ÷ decimal)
export function generate_g6_ns_divide_decimals(difficulty: DifficultyLevel): GeneratedQuestion {
  const divisorIsDecimal = difficulty >= 2 && Math.random() < 0.5;
  // Build a clean quotient with 1-2 decimal places.
  const quotientPlaces = 1;
  const quotient = randomInt(10, 90) / 10;             // 1.0 .. 9.0 (tenths)
  if (divisorIsDecimal) {
    const divisor = randomInt(2, 9) / 10;              // 0.2 .. 0.9
    const dividend = +(quotient * divisor).toFixed(2);
    return g7Wrap(difficulty, 'g6_ns_divide_decimals', 'M6.NS.1.4', 'Dividing Decimals', {
      question: `Evaluate: ${dividend.toFixed(2)} ÷ ${divisor.toFixed(1)}`,
      answer: quotient.toFixed(quotientPlaces),
      solution_steps: [
        `Multiply both numbers by 10 to remove the decimal from the divisor.`,
        `${dividend.toFixed(2)} ÷ ${divisor.toFixed(1)} = ${dividend * 10} ÷ ${divisor * 10} = ${quotient.toFixed(quotientPlaces)}.`,
      ],
      answer_type: 'decimal',
    });
  }
  const divisor = randomInt(2, 9);
  const dividend = +(quotient * divisor).toFixed(2);
  return g7Wrap(difficulty, 'g6_ns_divide_decimals', 'M6.NS.1.4', 'Dividing Decimals', {
    question: `Evaluate: ${dividend.toFixed(2)} ÷ ${divisor}`,
    answer: quotient.toFixed(quotientPlaces),
    solution_steps: [
      `Bring the decimal point straight up into the quotient.`,
      `${dividend.toFixed(2)} ÷ ${divisor} = ${quotient.toFixed(quotientPlaces)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 5. M6.NS.2.2 — Divide Fractions (Invert and Multiply)
export function generate_g6_ns_divide_fractions(difficulty: DifficultyLevel): GeneratedQuestion {
  const denPool = [2, 3, 4, 5, 6, 8, 10];
  const n1 = randomInt(1, 8);
  const d1 = denPool[randomInt(0, denPool.length - 1)]!;
  const n2 = randomInt(1, 8);
  const d2 = denPool[randomInt(0, denPool.length - 1)]!;
  const r1 = g7Rat(n1, d1);
  const r2 = g7Rat(n2, d2);
  if (r2.num === 0) return generate_g6_ns_divide_fractions(difficulty);
  const result = g7RatDiv(r1, r2);
  if (result.num === 0) return generate_g6_ns_divide_fractions(difficulty);
  return g7Wrap(difficulty, 'g6_ns_divide_fractions', 'M6.NS.2.2', 'Dividing Fractions', {
    question: `Evaluate: ${n1}/${d1} ÷ ${n2}/${d2}`,
    answer: g7FmtRat(result),
    solution_steps: [
      `Invert the second fraction and multiply.`,
      `${n1}/${d1} × ${d2}/${n2} = ${n1 * d2}/${d1 * n2}.`,
      `Simplify: ${g7FmtRat(result)}.`,
    ],
    answer_type: 'fraction',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2: NS — Word Problem, GCF/LCM, Absolute Value (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 6. M6.NS.2.3 — Fraction Division Word Problem
export function generate_g6_ns_fraction_division_word(difficulty: DifficultyLevel): GeneratedQuestion {
  // "How many a/b in c/d?" → c/d ÷ a/b. Pool a/b and c/d so the answer is clean.
  const scenarios = [
    { setup: (cup: string, sv: string) => `A recipe uses ${cup} cup servings. How many servings can be made from ${sv} cup${sv === '1' ? '' : 's'} of mixture?`, container: 'mixture' },
    { setup: (cup: string, sv: string) => `A ribbon is ${sv} foot${sv === '1' ? '' : 's'} long. How many ${cup}-foot pieces can be cut from it?`, container: 'ribbon' },
  ];
  // Use unit fractions for the divisor; the dividend is a multiple-of-unit fraction.
  const divisorDen = [2, 3, 4, 5, 6, 8][randomInt(0, 5)]!;
  const dividendNum = randomInt(2, 6);                  // produces clean integer answer if dividendNum ≥ 2
  const result = g7RatDiv(g7Rat(dividendNum, divisorDen), g7Rat(1, divisorDen));
  if (result.num === 0) return generate_g6_ns_fraction_division_word(difficulty);
  const sc = scenarios[randomInt(0, scenarios.length - 1)]!;
  return g7Wrap(difficulty, 'g6_ns_fraction_division_word', 'M6.NS.2.3', 'Fraction Division Word Problems', {
    question: sc.setup(`1/${divisorDen}`, `${dividendNum}/${divisorDen}`),
    answer: g7FmtRat(result),
    solution_steps: [
      `Set up: ${dividendNum}/${divisorDen} ÷ 1/${divisorDen}.`,
      `Invert and multiply: ${dividendNum}/${divisorDen} × ${divisorDen}/1 = ${dividendNum * divisorDen}/${divisorDen}.`,
      `Simplify: ${g7FmtRat(result)}.`,
    ],
    answer_type: 'fraction',
  });
}

// 7. M6.NS.3.1 — Find Greatest Common Factor (GCF)
export function generate_g6_ns_find_gcf(difficulty: DifficultyLevel): GeneratedQuestion {
  // Construct a, b so gcd(a, b) = g, then test the student.
  const g = randomInt(2, difficulty === 1 ? 12 : 24);
  let m: number, n: number;
  do {
    m = randomInt(2, 12);
    n = randomInt(2, 12);
  } while (gcd(m, n) !== 1 || m === n);
  const a = g * m;
  const b = g * n;
  return g7Wrap(difficulty, 'g6_ns_find_gcf', 'M6.NS.3.1', 'Finding the GCF', {
    question: `Find the Greatest Common Factor (GCF) of ${a} and ${b}.`,
    answer: String(g),
    solution_steps: [
      `${a} = ${g} × ${m},  ${b} = ${g} × ${n}.`,
      `Since gcd(${m}, ${n}) = 1, the GCF is ${g}.`,
    ],
    answer_type: 'integer',
  });
}

// 8. M6.NS.3.2 — Find Least Common Multiple (LCM)
export function generate_g6_ns_find_lcm(difficulty: DifficultyLevel): GeneratedQuestion {
  const pairs: Array<[number, number]> = [
    [3, 4], [4, 6], [3, 5], [6, 8], [4, 10], [5, 6],
    [6, 9], [2, 7], [3, 8], [4, 9], [6, 10], [8, 12],
  ];
  const [a, b] = pairs[randomInt(0, pairs.length - 1)]!;
  const lcm = (a * b) / gcd(a, b);
  return g7Wrap(difficulty, 'g6_ns_find_lcm', 'M6.NS.3.2', 'Finding the LCM', {
    question: `Find the Least Common Multiple (LCM) of ${a} and ${b}.`,
    answer: String(lcm),
    solution_steps: [
      `LCM(a, b) = (a × b) / gcd(a, b).`,
      `gcd(${a}, ${b}) = ${gcd(a, b)}.`,
      `LCM = (${a} × ${b}) / ${gcd(a, b)} = ${lcm}.`,
    ],
    answer_type: 'integer',
  });
}

// 9. M6.NS.3.3 — Rewrite a Sum Using the Distributive Property and GCF
export function generate_g6_ns_gcf_rewrite_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a + b where gcd(a, b) = g > 1. Answer is "g(a/g + b/g)".
  const g = [2, 3, 4, 5, 6, 7, 8, 9, 10][randomInt(0, 8)]!;
  let p: number, q: number;
  do {
    p = randomInt(2, 12);
    q = randomInt(2, 12);
  } while (gcd(p, q) !== 1 || p === q);
  const a = g * p;
  const b = g * q;
  return g7Wrap(difficulty, 'g6_ns_gcf_rewrite_expression', 'M6.NS.3.3', 'Distributive Property with GCF', {
    question: `Rewrite ${a} + ${b} as a product using the GCF.`,
    answer: `${g}(${p} + ${q})`,
    solution_steps: [
      `Find the GCF of ${a} and ${b}: ${g}.`,
      `Factor it out: ${a} + ${b} = ${g}·${p} + ${g}·${q} = ${g}(${p} + ${q}).`,
    ],
    answer_type: 'text',
  });
}

// 10. M6.NS.4.4 — Compute Absolute Value
export function generate_g6_ns_compute_absolute_value(difficulty: DifficultyLevel): GeneratedQuestion {
  const variants = (['negative_integer', 'positive_integer', 'negative_decimal', 'negative_fraction'] as const);
  const kind = variants[randomInt(0, 3)]!;
  if (kind === 'positive_integer') {
    const n = randomInt(2, 50);
    return g7Wrap(difficulty, 'g6_ns_compute_absolute_value', 'M6.NS.4.4', 'Computing Absolute Value', {
      question: `Find: |${n}|`,
      answer: String(n),
      solution_steps: [`The absolute value of ${n} is its distance from 0: ${n}.`],
      answer_type: 'decimal',
    });
  }
  if (kind === 'negative_integer') {
    const n = -randomInt(2, 50);
    return g7Wrap(difficulty, 'g6_ns_compute_absolute_value', 'M6.NS.4.4', 'Computing Absolute Value', {
      question: `Find: |${n}|`,
      answer: String(Math.abs(n)),
      solution_steps: [`Distance from 0 is ${Math.abs(n)}; absolute value is non-negative.`],
      answer_type: 'decimal',
    });
  }
  if (kind === 'negative_decimal') {
    const n = -(randomInt(1, 50) + randomInt(1, 9) / 10);
    const abs = +(-n).toFixed(1);
    return g7Wrap(difficulty, 'g6_ns_compute_absolute_value', 'M6.NS.4.4', 'Computing Absolute Value', {
      question: `Find: |${n.toFixed(1)}|`,
      answer: abs.toFixed(1),
      solution_steps: [`|${n.toFixed(1)}| = ${abs.toFixed(1)} (distance from 0).`],
      answer_type: 'decimal',
    });
  }
  // negative_fraction
  const num = randomInt(1, 9);
  const den = [2, 3, 4, 5, 6, 8][randomInt(0, 5)]!;
  return g7Wrap(difficulty, 'g6_ns_compute_absolute_value', 'M6.NS.4.4', 'Computing Absolute Value', {
    question: `Find: |-${num}/${den}|`,
    answer: `${num}/${den}`,
    solution_steps: [`|-${num}/${den}| = ${num}/${den} (distance from 0).`],
    answer_type: 'decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3: NS Compare/Distance, RP Rates & Ratios (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 11. M6.NS.4.5 — Compare and Order Rational Numbers
export function generate_g6_ns_compare_order_rationals(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated value pools per difficulty so the ordering is unambiguous.
  // JSON spec uses 'MC'; we ask the student to enter the values in order
  // from least to greatest separated by commas (matches our 'text' shape).
  const count = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
  const pool = [
    -2, -1.5, -1, -0.75, -0.5, -1 / 4, 0, 1 / 4, 0.5, 0.75, 1, 1.5, 2,
  ];
  // Pick distinct values
  const idxs = new Set<number>();
  while (idxs.size < count) idxs.add(randomInt(0, pool.length - 1));
  const chosen = Array.from(idxs).map((i) => pool[i]!);
  // Display form: integers as int, halves as fraction, others as decimal.
  const display = (v: number): string => {
    if (Number.isInteger(v)) return String(v);
    if (Math.abs(v) === 0.5) return v < 0 ? '-1/2' : '1/2';
    if (Math.abs(v) === 0.25) return v < 0 ? '-1/4' : '1/4';
    if (Math.abs(v) === 0.75) return v < 0 ? '-3/4' : '3/4';
    return v.toString();
  };
  const shuffled = [...chosen].sort(() => Math.random() - 0.5);
  const sorted = [...chosen].sort((a, b) => a - b);
  const presented = shuffled.map(display).join(', ');
  const answer = sorted.map(display).join(', ');
  return g7Wrap(difficulty, 'g6_ns_compare_order_rationals', 'M6.NS.4.5', 'Comparing and Ordering Rationals', {
    question: `Order from LEAST to GREATEST: ${presented}\n\nEnter the values separated by commas, in order.`,
    answer,
    solution_steps: [
      `Convert each value to decimal form (or place on a number line) to compare.`,
      `From least to greatest: ${answer}.`,
    ],
    answer_type: 'text',
  });
}

// 12. M6.NS.4.7 — Coordinate Distance on the Same Axis
export function generate_g6_ns_coordinate_distance_6(difficulty: DifficultyLevel): GeneratedQuestion {
  // Two points sharing an x-coordinate (vertical distance) or y-coordinate
  // (horizontal distance) — answer is |a − b|.
  const sharedAxis = (['x', 'y'] as const)[randomInt(0, 1)]!;
  let a: number, b: number;
  do {
    a = randomInt(-10, 10);
    b = randomInt(-10, 10);
  } while (a === b);
  const shared = randomInt(-10, 10);
  const p1 = sharedAxis === 'x' ? `(${shared}, ${a})` : `(${a}, ${shared})`;
  const p2 = sharedAxis === 'x' ? `(${shared}, ${b})` : `(${b}, ${shared})`;
  const distance = Math.abs(a - b);
  return g7Wrap(difficulty, 'g6_ns_coordinate_distance_6', 'M6.NS.4.7', 'Distance on the Coordinate Plane', {
    question: `Find the distance between ${p1} and ${p2}.`,
    answer: String(distance),
    solution_steps: [
      `The points share the ${sharedAxis}-coordinate, so the distance is |${a} − ${b}|.`,
      `|${a} − ${b}| = ${distance}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 13. M6.RP.1.3 — Calculate a Unit Rate
export function generate_g6_rp_calculate_unit_rate(difficulty: DifficultyLevel): GeneratedQuestion {
  const contexts = [
    { subj: 'A car drives',     verb: 'miles in',       unit: 'miles',    per: 'hour'    },
    { subj: 'A box of',         verb: 'apples costs $', unit: 'dollars',  per: 'apple'   },
    { subj: 'A printer prints', verb: 'pages in',       unit: 'pages',    per: 'minute'  },
    { subj: 'A snack contains', verb: 'calories per',   unit: 'calories', per: 'serving' },
  ];
  const ctx = contexts[randomInt(0, contexts.length - 1)]!;
  const denominator = randomInt(2, difficulty === 1 ? 6 : 12);
  const rate = randomInt(difficulty === 1 ? 5 : 15, difficulty === 1 ? 30 : 80);
  const numerator = denominator * rate;
  return g7Wrap(difficulty, 'g6_rp_calculate_unit_rate', 'M6.RP.1.3', 'Calculating a Unit Rate', {
    question: `${ctx.subj} ${numerator} ${ctx.verb} ${denominator} ${ctx.per}${denominator === 1 ? '' : 's'}. What is the unit rate in ${ctx.unit} per ${ctx.per}?`,
    answer: String(rate),
    solution_steps: [
      `Unit rate = total ÷ units.`,
      `${numerator} ÷ ${denominator} = ${rate}.`,
      `Answer: ${rate} ${ctx.unit} per ${ctx.per}.`,
    ],
    answer_type: 'decimal',
  });
}

// 14. M6.RP.2.1 — Solve a Missing Value in a Ratio Table
export function generate_g6_rp_ratio_table_solve(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a 3-row ratio table: (1, k), (a, ak), (b, ?). Ask for the missing value.
  const k = randomInt(2, difficulty === 1 ? 6 : 12);
  const a = randomInt(2, 5);
  const b = randomInt(a + 1, difficulty === 1 ? 8 : 14);
  const missing = b * k;
  const table = `  x | y\n  1 | ${k}\n  ${a} | ${a * k}\n  ${b} | ?`;
  return g7Wrap(difficulty, 'g6_rp_ratio_table_solve', 'M6.RP.2.1', 'Ratio Table — Missing Value', {
    question: `Find the missing value in the ratio table:\n\n${table}`,
    answer: String(missing),
    solution_steps: [
      `Find the constant of proportionality: y/x = ${k}.`,
      `When x = ${b}, y = ${b} × ${k} = ${missing}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 15. M6.RP.2.3 — Ratio Word Problem
export function generate_g6_rp_ratio_word_problem(difficulty: DifficultyLevel): GeneratedQuestion {
  // Part-to-part: ratio of blue:red = a:b. Given total, find each.
  const a = randomInt(1, 5);
  let b = randomInt(1, 5);
  while (gcd(a, b) !== 1) b = randomInt(1, 5);
  const parts = a + b;
  const totalMultiple = randomInt(3, difficulty === 1 ? 8 : 15);
  const total = parts * totalMultiple;
  const blue = a * totalMultiple;
  const red = b * totalMultiple;
  // Ask for one of the parts.
  const ask = Math.random() < 0.5 ? 'blue' : 'red';
  const answer = ask === 'blue' ? blue : red;
  return g7Wrap(difficulty, 'g6_rp_ratio_word_problem', 'M6.RP.2.3', 'Ratio Word Problem', {
    question: `A class has blue and red counters in the ratio ${a}:${b}. If there are ${total} counters in total, how many are ${ask}?`,
    answer: String(answer),
    solution_steps: [
      `The ratio has ${a} + ${b} = ${parts} equal parts.`,
      `Each part = ${total} ÷ ${parts} = ${totalMultiple}.`,
      `${ask === 'blue' ? `Blue = ${a} parts = ${a} × ${totalMultiple} = ${blue}.` : `Red = ${b} parts = ${b} × ${totalMultiple} = ${red}.`}`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 4: RP Percents & Conversions, EE Exponents (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 16. M6.RP.3.2 — Percent of a Quantity
export function generate_g6_rp_percent_of_quantity(difficulty: DifficultyLevel): GeneratedQuestion {
  const pct = [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 5, 12.5][randomInt(0, 12)]!;
  const base = randomInt(20, difficulty === 1 ? 200 : 500);
  const result = +(base * pct / 100).toFixed(2);
  return g7Wrap(difficulty, 'g6_rp_percent_of_quantity', 'M6.RP.3.2', 'Percent of a Quantity', {
    question: `What is ${pct}% of ${base}? Round to 2 decimal places if needed.`,
    answer: result.toFixed(2),
    solution_steps: [
      `Convert ${pct}% to a decimal: ${(pct / 100).toFixed(3)}.`,
      `Multiply: ${(pct / 100).toFixed(3)} × ${base} = ${result.toFixed(2)}.`,
    ],
    answer_type: 'decimal',
  });
}

// 17. M6.RP.3.3 — Find Whole or Percent given Part
export function generate_g6_rp_percent_whole_part(difficulty: DifficultyLevel): GeneratedQuestion {
  const solveFor = (['whole', 'percent'] as const)[randomInt(0, 1)]!;
  const pct = [10, 20, 25, 40, 50, 60, 75, 80][randomInt(0, 7)]!;
  // Build clean numbers: choose whole, derive part from pct.
  const whole = randomInt(20, difficulty === 1 ? 150 : 400);
  const part = +(whole * pct / 100).toFixed(2);
  if (solveFor === 'whole') {
    return g7Wrap(difficulty, 'g6_rp_percent_whole_part', 'M6.RP.3.3', 'Find Whole or Percent', {
      question: `${pct}% of a number is ${part}. What is the number?`,
      answer: String(whole),
      solution_steps: [
        `Set up: ${pct}% × W = ${part}, i.e., ${pct / 100} × W = ${part}.`,
        `Divide: W = ${part} / ${(pct / 100)} = ${whole}.`,
      ],
      answer_type: 'decimal',
    });
  }
  return g7Wrap(difficulty, 'g6_rp_percent_whole_part', 'M6.RP.3.3', 'Find Whole or Percent', {
    question: `${part} is what percent of ${whole}? Enter just the number (no % sign).`,
    answer: String(pct),
    solution_steps: [
      `Set up: P × ${whole} = ${part}, so P = ${part} / ${whole}.`,
      `P = ${(part / whole).toFixed(4)} = ${pct}%.`,
    ],
    answer_type: 'decimal',
  });
}

// 18. M6.RP.3.4 — Convert Between Fraction, Decimal, Percent (G6 level)
export function generate_g6_rp_fraction_decimal_pct_6(difficulty: DifficultyLevel): GeneratedQuestion {
  // Curated value pool with exact 3-way conversions.
  const pool: Array<{ frac: string; dec: string; pct: string }> = [
    { frac: '1/2',   dec: '0.5',   pct: '50'   },
    { frac: '1/4',   dec: '0.25',  pct: '25'   },
    { frac: '3/4',   dec: '0.75',  pct: '75'   },
    { frac: '1/5',   dec: '0.2',   pct: '20'   },
    { frac: '2/5',   dec: '0.4',   pct: '40'   },
    { frac: '3/5',   dec: '0.6',   pct: '60'   },
    { frac: '4/5',   dec: '0.8',   pct: '80'   },
    { frac: '1/8',   dec: '0.125', pct: '12.5' },
    { frac: '3/8',   dec: '0.375', pct: '37.5' },
    { frac: '5/8',   dec: '0.625', pct: '62.5' },
    { frac: '1/10',  dec: '0.1',   pct: '10'   },
    { frac: '3/10',  dec: '0.3',   pct: '30'   },
    { frac: '7/10',  dec: '0.7',   pct: '70'   },
    { frac: '9/10',  dec: '0.9',   pct: '90'   },
    { frac: '1/20',  dec: '0.05',  pct: '5'    },
    { frac: '3/20',  dec: '0.15',  pct: '15'   },
    { frac: '1/25',  dec: '0.04',  pct: '4'    },
    { frac: '1/100', dec: '0.01',  pct: '1'    },
  ];
  const pick = pool[randomInt(0, pool.length - 1)]!;
  const forms = (['frac', 'dec', 'pct'] as const);
  let from = forms[randomInt(0, 2)]!;
  let to = forms[randomInt(0, 2)]!;
  while (to === from) to = forms[randomInt(0, 2)]!;
  const fromVal = from === 'pct' ? `${pick.pct}%` : pick[from];
  const toVal = to === 'pct' ? `${pick.pct}%` : pick[to];
  const label = (k: 'frac' | 'dec' | 'pct'): string => k === 'frac' ? 'fraction' : k === 'dec' ? 'decimal' : 'percent';
  return g7Wrap(difficulty, 'g6_rp_fraction_decimal_pct_6', 'M6.RP.3.4', 'Fraction ↔ Decimal ↔ Percent', {
    question: `Convert ${fromVal} to a ${label(to)}.`,
    answer: toVal,
    solution_steps: [
      `Recognise: ${pick.frac} = ${pick.dec} = ${pick.pct}%.`,
      `${fromVal} as a ${label(to)} is ${toVal}.`,
    ],
    answer_type: 'decimal_or_fraction_or_percent',
  });
}

// 19. M6.RP.4.1 — Unit Conversion (Ratio Reasoning)
export function generate_g6_rp_unit_conversion(difficulty: DifficultyLevel): GeneratedQuestion {
  const conversions = [
    { from: 'feet',   to: 'inches',      factor: 12   },
    { from: 'yards',  to: 'feet',        factor: 3    },
    { from: 'km',     to: 'm',           factor: 1000 },
    { from: 'hours',  to: 'minutes',     factor: 60   },
    { from: 'pounds', to: 'ounces',      factor: 16   },
    { from: 'liters', to: 'milliliters', factor: 1000 },
  ];
  const c = conversions[randomInt(0, conversions.length - 1)]!;
  const value = randomInt(2, difficulty === 1 ? 25 : 50);
  const result = value * c.factor;
  return g7Wrap(difficulty, 'g6_rp_unit_conversion', 'M6.RP.4.1', 'Unit Conversion', {
    question: `Convert ${value} ${c.from} to ${c.to}.`,
    answer: String(result),
    solution_steps: [
      `1 ${c.from.replace(/s$/, '')} = ${c.factor} ${c.to}.`,
      `${value} × ${c.factor} = ${result} ${c.to}.`,
    ],
    answer_type: 'decimal',
  });
}

// 20. M6.EE.1.1 — Evaluate Numerical Expressions with Exponents
export function generate_g6_ee_eval_numerical_exponents(difficulty: DifficultyLevel): GeneratedQuestion {
  const base = randomInt(2, difficulty === 1 ? 6 : 12);
  const exp = randomInt(2, difficulty === 1 ? 3 : 4);
  const c = randomInt(1, 20);
  const forms = [
    { expr: `${base}^${exp}`,           value: Math.pow(base, exp) },
    { expr: `${base}^${exp} + ${c}`,    value: Math.pow(base, exp) + c },
    { expr: `${base}^${exp} - ${c}`,    value: Math.pow(base, exp) - c },
    { expr: `${base}^${exp} × ${c}`,    value: Math.pow(base, exp) * c },
  ];
  const f = forms[randomInt(0, forms.length - 1)]!;
  return g7Wrap(difficulty, 'g6_ee_eval_numerical_exponents', 'M6.EE.1.1', 'Numerical Expressions with Exponents', {
    question: `Evaluate: ${f.expr}`,
    answer: String(f.value),
    solution_steps: [
      `Apply exponents first: ${base}^${exp} = ${Math.pow(base, exp)}.`,
      `Then complete remaining operations.`,
      `Result: ${f.value}.`,
    ],
    answer_type: 'integer',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 5: EE — Expressions & One-Step Equations (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 21. M6.EE.1.4 — Evaluate an Algebraic Expression
export function generate_g6_ee_evaluate_algebraic_expr(difficulty: DifficultyLevel): GeneratedQuestion {
  const form = (['ax_plus_b', 'ax2_plus_b', 'ax_plus_bx'] as const)[randomInt(0, 2)]!;
  const x = randomInt(1, difficulty === 1 ? 8 : 15);
  if (form === 'ax_plus_b') {
    const a = randomInt(1, 10);
    const b = randomInt(1, 20);
    const result = a * x + b;
    return g7Wrap(difficulty, 'g6_ee_evaluate_algebraic_expr', 'M6.EE.1.4', 'Evaluating Algebraic Expressions', {
      question: `Evaluate ${a}x + ${b} when x = ${x}.`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x}) + ${b}.`,
        `= ${a * x} + ${b} = ${result}.`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  if (form === 'ax2_plus_b') {
    const a = randomInt(1, 5);
    const b = randomInt(1, 20);
    const result = a * x * x + b;
    return g7Wrap(difficulty, 'g6_ee_evaluate_algebraic_expr', 'M6.EE.1.4', 'Evaluating Algebraic Expressions', {
      question: `Evaluate ${a}x² + ${b} when x = ${x}.`,
      answer: String(result),
      solution_steps: [
        `Substitute x = ${x}: ${a}(${x})² + ${b}.`,
        `= ${a * x * x} + ${b} = ${result}.`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  // ax + bx (combines to (a+b)x)
  const a = randomInt(1, 8);
  const b = randomInt(1, 8);
  const result = (a + b) * x;
  return g7Wrap(difficulty, 'g6_ee_evaluate_algebraic_expr', 'M6.EE.1.4', 'Evaluating Algebraic Expressions', {
    question: `Evaluate ${a}x + ${b}x when x = ${x}.`,
    answer: String(result),
    solution_steps: [
      `Combine like terms first: ${a}x + ${b}x = ${a + b}x.`,
      `Substitute x = ${x}: ${a + b}(${x}) = ${result}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 22. M6.EE.2.1 — Expand Using Distributive Property
export function generate_g6_ee_expand_distributive_6(difficulty: DifficultyLevel): GeneratedQuestion {
  const outer = randomInt(2, 10);
  const inner = randomInt(1, 12);
  const op = Math.random() < 0.5 ? '+' : '-';
  const useVariable = Math.random() < 0.7;
  if (useVariable) {
    return g7Wrap(difficulty, 'g6_ee_expand_distributive_6', 'M6.EE.2.1', 'Distributive Property', {
      question: `Expand using the distributive property:  ${outer}(x ${op} ${inner})`,
      answer: `${outer}x ${op} ${outer * inner}`,
      solution_steps: [
        `Distribute ${outer} across both terms.`,
        `${outer} × x = ${outer}x.`,
        `${outer} × ${inner} = ${outer * inner}.`,
        `Result: ${outer}x ${op} ${outer * inner}.`,
      ],
      answer_type: 'text',
    });
  }
  const b = randomInt(1, 12);
  const result = op === '+' ? outer * b + outer * inner : outer * b - outer * inner;
  return g7Wrap(difficulty, 'g6_ee_expand_distributive_6', 'M6.EE.2.1', 'Distributive Property', {
    question: `Expand and simplify:  ${outer}(${b} ${op} ${inner})`,
    answer: String(result),
    solution_steps: [
      `Distribute ${outer}: ${outer}·${b} ${op} ${outer}·${inner}.`,
      `= ${outer * b} ${op} ${outer * inner} = ${result}.`,
    ],
    answer_type: 'text',
  });
}

// 23. M6.EE.2.2 — Combine Like Terms
export function generate_g6_ee_combine_like_terms_6(difficulty: DifficultyLevel): GeneratedQuestion {
  // Two variables x, y plus a constant.
  const a1 = randomInt(1, 10);
  const a2 = randomInt(1, 10);
  const b1 = randomInt(1, 10);
  const b2 = randomInt(1, 10);
  const c = randomInt(1, 20);
  const xSum = a1 + a2;
  const ySum = b1 + b2;
  const useTwoVars = difficulty >= 2 && Math.random() < 0.6;
  if (useTwoVars) {
    return g7Wrap(difficulty, 'g6_ee_combine_like_terms_6', 'M6.EE.2.2', 'Combining Like Terms', {
      question: `Simplify: ${a1}x + ${b1}y + ${a2}x + ${b2}y + ${c}`,
      answer: `${xSum}x + ${ySum}y + ${c}`,
      solution_steps: [
        `Group like terms.`,
        `x-terms: ${a1}x + ${a2}x = ${xSum}x.`,
        `y-terms: ${b1}y + ${b2}y = ${ySum}y.`,
        `Constant: ${c}.`,
        `Result: ${xSum}x + ${ySum}y + ${c}.`,
      ],
      answer_type: 'text',
    });
  }
  // single variable
  return g7Wrap(difficulty, 'g6_ee_combine_like_terms_6', 'M6.EE.2.2', 'Combining Like Terms', {
    question: `Simplify: ${a1}x + ${b1} + ${a2}x + ${b2}`,
    answer: `${a1 + a2}x + ${b1 + b2}`,
    solution_steps: [
      `Combine x-terms: ${a1}x + ${a2}x = ${a1 + a2}x.`,
      `Combine constants: ${b1} + ${b2} = ${b1 + b2}.`,
      `Result: ${a1 + a2}x + ${b1 + b2}.`,
    ],
    answer_type: 'text',
  });
}

// 24. M6.EE.3.2 — Solve One-Step Equations (Add / Subtract)
export function generate_g6_ee_solve_one_step_add_sub(difficulty: DifficultyLevel): GeneratedQuestion {
  // Spec says solution_positive: true. Build x + p = q or x − p = q with x > 0.
  const useSub = Math.random() < 0.5;
  if (useSub) {
    const x = randomInt(1, difficulty === 1 ? 50 : 100);
    const p = randomInt(1, 50);
    const q = x - p;
    return g7Wrap(difficulty, 'g6_ee_solve_one_step_add_sub', 'M6.EE.3.2', 'One-Step Equations (+/−)', {
      question: `Solve for x:  x - ${p} = ${q}`,
      answer: String(x),
      solution_steps: [
        `Add ${p} to both sides.`,
        `x = ${q} + ${p} = ${x}.`,
      ],
      answer_type: 'integer_or_decimal',
    });
  }
  const x = randomInt(1, difficulty === 1 ? 50 : 100);
  const p = randomInt(1, 50);
  const q = x + p;
  return g7Wrap(difficulty, 'g6_ee_solve_one_step_add_sub', 'M6.EE.3.2', 'One-Step Equations (+/−)', {
    question: `Solve for x:  x + ${p} = ${q}`,
    answer: String(x),
    solution_steps: [
      `Subtract ${p} from both sides.`,
      `x = ${q} - ${p} = ${x}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 25. M6.EE.3.3 — Solve One-Step Equations (Multiply / Divide)
export function generate_g6_ee_solve_one_step_mul_div(difficulty: DifficultyLevel): GeneratedQuestion {
  const useDiv = Math.random() < 0.5;
  if (useDiv) {
    // x / p = q → x = p*q
    const p = randomInt(2, difficulty === 1 ? 8 : 20);
    const q = randomInt(2, difficulty === 1 ? 12 : 30);
    const x = p * q;
    return g7Wrap(difficulty, 'g6_ee_solve_one_step_mul_div', 'M6.EE.3.3', 'One-Step Equations (×/÷)', {
      question: `Solve for x:  x / ${p} = ${q}`,
      answer: String(x),
      solution_steps: [
        `Multiply both sides by ${p}.`,
        `x = ${q} × ${p} = ${x}.`,
      ],
      answer_type: 'decimal_or_fraction',
    });
  }
  // px = q → x = q/p
  const p = randomInt(2, difficulty === 1 ? 8 : 20);
  const xVal = randomInt(2, difficulty === 1 ? 12 : 30);
  const q = p * xVal;
  return g7Wrap(difficulty, 'g6_ee_solve_one_step_mul_div', 'M6.EE.3.3', 'One-Step Equations (×/÷)', {
    question: `Solve for x:  ${p}x = ${q}`,
    answer: String(xVal),
    solution_steps: [
      `Divide both sides by ${p}.`,
      `x = ${q} / ${p} = ${xVal}.`,
    ],
    answer_type: 'decimal_or_fraction',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 6: GEO — Area & Volume (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 26. M6.GEO.1.1 — Area of a Triangle (A = ½bh)
export function generate_g6_geo_area_triangle_6(difficulty: DifficultyLevel): GeneratedQuestion {
  // Force even base×height so area is an integer (decimal answer_type still works).
  let base = randomInt(2, difficulty === 1 ? 14 : 24);
  const height = randomInt(2, difficulty === 1 ? 12 : 20);
  if ((base * height) % 2 !== 0) base += 1;
  const area = (base * height) / 2;
  return g7Wrap(difficulty, 'g6_geo_area_triangle_6', 'M6.GEO.1.1', 'Area of a Triangle', {
    question: `Find the area of a triangle with base ${base} cm and height ${height} cm.`,
    answer: String(area),
    solution_steps: [
      `Area = ½ × base × height.`,
      `= ½ × ${base} × ${height}.`,
      `= ${area} cm².`,
    ],
    answer_type: 'decimal',
  });
}

// 27. M6.GEO.1.2 — Area of a Parallelogram (A = bh)
export function generate_g6_geo_area_parallelogram(difficulty: DifficultyLevel): GeneratedQuestion {
  const base = randomInt(3, difficulty === 1 ? 15 : 25);
  const height = randomInt(2, difficulty === 1 ? 12 : 20);
  return g7Wrap(difficulty, 'g6_geo_area_parallelogram', 'M6.GEO.1.2', 'Area of a Parallelogram', {
    question: `Find the area of a parallelogram with base ${base} cm and height ${height} cm.`,
    answer: String(base * height),
    solution_steps: [
      `Area = base × height.`,
      `= ${base} × ${height} = ${base * height} cm².`,
    ],
    answer_type: 'decimal',
  });
}

// 28. M6.GEO.1.3 — Area of a Trapezoid (A = ½(b₁ + b₂)h)
export function generate_g6_geo_area_trapezoid(difficulty: DifficultyLevel): GeneratedQuestion {
  let b1 = randomInt(3, 14);
  let b2 = randomInt(b1 + 2, 22);
  const height = randomInt(2, 15);
  if (((b1 + b2) * height) % 2 !== 0) b1 += 1;
  const area = ((b1 + b2) * height) / 2;
  return g7Wrap(difficulty, 'g6_geo_area_trapezoid', 'M6.GEO.1.3', 'Area of a Trapezoid', {
    question: `Find the area of a trapezoid with parallel sides ${b1} cm and ${b2} cm and height ${height} cm.`,
    answer: String(area),
    solution_steps: [
      `Area = ½ × (b₁ + b₂) × h.`,
      `= ½ × (${b1} + ${b2}) × ${height}.`,
      `= ½ × ${b1 + b2} × ${height} = ${area} cm².`,
    ],
    answer_type: 'decimal',
  });
}

// 29. M6.GEO.3.2 — Volume of a Rectangular Prism (Whole-Number Edges)
export function generate_g6_geo_volume_rect_prism_whole(difficulty: DifficultyLevel): GeneratedQuestion {
  const max = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 15;
  const l = randomInt(2, max);
  const w = randomInt(2, max);
  const h = randomInt(2, max);
  return g7Wrap(difficulty, 'g6_geo_volume_rect_prism_whole', 'M6.GEO.3.2', 'Volume of a Rectangular Prism', {
    question: `Find the volume of a rectangular prism with length ${l} cm, width ${w} cm, and height ${h} cm.`,
    answer: String(l * w * h),
    solution_steps: [
      `Volume = length × width × height.`,
      `= ${l} × ${w} × ${h} = ${l * w * h} cm³.`,
    ],
    answer_type: 'integer',
  });
}

// 30. M6.GEO.3.3 — Volume of a Rectangular Prism (Fractional Edges)
export function generate_g6_geo_volume_rect_prism_frac(difficulty: DifficultyLevel): GeneratedQuestion {
  // Use halves / thirds / quarters per spec. Build edges as Rationals.
  const fracOptions: G7Rational[] = [
    g7Rat(3, 2),   // 1½
    g7Rat(5, 2),   // 2½
    g7Rat(7, 2),   // 3½
    g7Rat(4, 3),   // 1⅓
    g7Rat(5, 3),   // 1⅔
    g7Rat(7, 3),   // 2⅓
    g7Rat(5, 4),   // 1¼
    g7Rat(7, 4),   // 1¾
    g7Rat(9, 4),   // 2¼
  ];
  const l = fracOptions[randomInt(0, fracOptions.length - 1)]!;
  const w = fracOptions[randomInt(0, fracOptions.length - 1)]!;
  const hWhole = randomInt(2, 6);
  const h = g7Rat(hWhole);
  const lw = g7RatMul(l, w);
  const V = g7RatMul(lw, h);
  return g7Wrap(difficulty, 'g6_geo_volume_rect_prism_frac', 'M6.GEO.3.3', 'Volume with Fractional Edges', {
    question: `Find the volume of a rectangular prism with length ${g7FmtRat(l)} cm, width ${g7FmtRat(w)} cm, and height ${hWhole} cm.`,
    answer: g7FmtRat(V),
    solution_steps: [
      `Volume = length × width × height.`,
      `= ${g7FmtRat(l)} × ${g7FmtRat(w)} × ${hWhole}.`,
      `Step 1: ${g7FmtRat(l)} × ${g7FmtRat(w)} = ${g7FmtRat(lw)}.`,
      `Step 2: ${g7FmtRat(lw)} × ${hWhole} = ${g7FmtRat(V)}.`,
    ],
    answer_type: 'fraction_or_decimal',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 7: SP — Statistics (G6)
// ─────────────────────────────────────────────────────────────────────────────

// 31. M6.SP.2.2 — Five-Number Summary
export function generate_g6_sp_five_number_summary(difficulty: DifficultyLevel): GeneratedQuestion {
  // 9 distinct values for clean Q1/median/Q3 positions
  // (positions 1, 3, 5, 7, 9 → min, Q1, median, Q3, max).
  const values: number[] = [];
  const seen = new Set<number>();
  while (values.length < 9) {
    const v = randomInt(10, difficulty === 1 ? 60 : 100);
    if (!seen.has(v)) { seen.add(v); values.push(v); }
  }
  values.sort((a, b) => a - b);
  const min = values[0]!;
  const Q1 = values[2]!;
  const median = values[4]!;
  const Q3 = values[6]!;
  const max = values[8]!;
  const ask = (['min', 'Q1', 'median', 'Q3', 'max'] as const)[randomInt(0, 4)]!;
  const askedValue = ask === 'min' ? min : ask === 'Q1' ? Q1 : ask === 'median' ? median : ask === 'Q3' ? Q3 : max;
  const askLabel = ask === 'Q1' ? 'first quartile (Q1)' : ask === 'Q3' ? 'third quartile (Q3)' : ask === 'median' ? 'median' : ask === 'min' ? 'minimum' : 'maximum';
  return g7Wrap(difficulty, 'g6_sp_five_number_summary', 'M6.SP.2.2', 'Five-Number Summary', {
    question: `For the data set: ${values.join(', ')}\n\nFind the ${askLabel}.`,
    answer: String(askedValue),
    solution_steps: [
      `Sort the values: ${values.join(', ')}.`,
      `9 values → positions 1, 3, 5, 7, 9 give min=${min}, Q1=${Q1}, median=${median}, Q3=${Q3}, max=${max}.`,
      `${askLabel} = ${askedValue}.`,
    ],
    answer_type: 'integer_or_decimal',
  });
}

// 32. M6.SP.3.1 — Compute Mean, Median, or Mode
export function generate_g6_sp_compute_center_stats(difficulty: DifficultyLevel): GeneratedQuestion {
  const size = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 9;
  // Force a repeated value so mode is well-defined.
  const values: number[] = [];
  const repeat = randomInt(2, difficulty === 1 ? 25 : 60);
  values.push(repeat, repeat);
  while (values.length < size) values.push(randomInt(1, difficulty === 1 ? 30 : 100));
  values.sort((a, b) => a - b);
  const ask = (['mean', 'median', 'mode'] as const)[randomInt(0, 2)]!;
  if (ask === 'mean') {
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = +(sum / values.length).toFixed(2);
    return g7Wrap(difficulty, 'g6_sp_compute_center_stats', 'M6.SP.3.1', 'Mean / Median / Mode', {
      question: `Find the MEAN of: ${values.join(', ')}\n\nRound to 2 decimal places if needed.`,
      answer: mean.toFixed(2),
      solution_steps: [
        `Sum: ${sum}.`,
        `Divide by count (${values.length}): ${sum} / ${values.length} = ${mean.toFixed(2)}.`,
      ],
      answer_type: 'decimal',
    });
  }
  if (ask === 'median') {
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 1
      ? values[mid]!
      : +((values[mid - 1]! + values[mid]!) / 2).toFixed(2);
    return g7Wrap(difficulty, 'g6_sp_compute_center_stats', 'M6.SP.3.1', 'Mean / Median / Mode', {
      question: `Find the MEDIAN of: ${values.join(', ')}`,
      answer: String(median),
      solution_steps: [
        `Sort the values: ${values.join(', ')}.`,
        values.length % 2 === 1
          ? `Middle value (position ${mid + 1}): ${median}.`
          : `Average of two middle values: (${values[mid - 1]} + ${values[mid]}) / 2 = ${median}.`,
      ],
      answer_type: 'decimal',
    });
  }
  return g7Wrap(difficulty, 'g6_sp_compute_center_stats', 'M6.SP.3.1', 'Mean / Median / Mode', {
    question: `Find the MODE of: ${values.join(', ')}`,
    answer: String(repeat),
    solution_steps: [
      `Mode = value that appears most often.`,
      `${repeat} appears more than once; no other value does.`,
      `Mode = ${repeat}.`,
    ],
    answer_type: 'decimal',
  });
}

// 33. M6.SP.3.2 — Compute Range and IQR
export function generate_g6_sp_compute_variability(difficulty: DifficultyLevel): GeneratedQuestion {
  // 7 distinct values: positions 2, 4, 6 give Q1, median, Q3 cleanly.
  const values: number[] = [];
  const seen = new Set<number>();
  while (values.length < 7) {
    const v = randomInt(5, difficulty === 1 ? 50 : 100);
    if (!seen.has(v)) { seen.add(v); values.push(v); }
  }
  values.sort((a, b) => a - b);
  const range = values[6]! - values[0]!;
  const Q1 = values[1]!;
  const Q3 = values[5]!;
  const IQR = Q3 - Q1;
  const askIQR = Math.random() < 0.5;
  if (askIQR) {
    return g7Wrap(difficulty, 'g6_sp_compute_variability', 'M6.SP.3.2', 'Range / IQR', {
      question: `Find the IQR of: ${values.join(', ')}`,
      answer: String(IQR),
      solution_steps: [
        `Sort: ${values.join(', ')}.`,
        `With 7 values, Q1 is the 2nd and Q3 is the 6th.`,
        `Q1 = ${Q1}, Q3 = ${Q3}.`,
        `IQR = Q3 − Q1 = ${IQR}.`,
      ],
      answer_type: 'decimal',
    });
  }
  return g7Wrap(difficulty, 'g6_sp_compute_variability', 'M6.SP.3.2', 'Range / IQR', {
    question: `Find the RANGE of: ${values.join(', ')}`,
    answer: String(range),
    solution_steps: [
      `Range = max − min.`,
      `${values[6]} − ${values[0]} = ${range}.`,
    ],
    answer_type: 'decimal',
  });
}

// 34. M6.SP.3.3 — Mean Absolute Deviation (MAD)
export function generate_g6_sp_compute_mad(difficulty: DifficultyLevel): GeneratedQuestion {
  // Build a 5-value data set with an integer mean.
  // mean = m means sum = 5m. Pick m, then choose deviations that sum to 0.
  const m = randomInt(15, 60);
  // Choose deviations that sum to 0 (so the mean is exactly m).
  const devs = [-2, -1, 0, 1, 2];                                    // sums to 0
  const values = devs.map((d) => m + d * randomInt(1, 4));
  // Recompute mean and re-derive deviations from the actual values (they
  // may differ from `devs` after scaling by randomInt).
  const actualSum = values.reduce((s, v) => s + v, 0);
  const actualMean = actualSum / values.length;
  // Force exact integer mean by adjusting the last value.
  if (!Number.isInteger(actualMean)) {
    const targetSum = Math.round(actualMean) * values.length;
    values[values.length - 1] += targetSum - actualSum;
  }
  const finalMean = values.reduce((s, v) => s + v, 0) / values.length;
  const absDevs = values.map((v) => Math.abs(v - finalMean));
  const mad = +(absDevs.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
  return g7Wrap(difficulty, 'g6_sp_compute_mad', 'M6.SP.3.3', 'Mean Absolute Deviation', {
    question: `Compute the Mean Absolute Deviation (MAD) of: ${values.join(', ')}\n\nRound to 2 decimal places if needed.`,
    answer: mad.toFixed(2),
    solution_steps: [
      `Find the mean: (${values.join(' + ')}) / ${values.length} = ${finalMean}.`,
      `Find absolute deviations from the mean: ${absDevs.join(', ')}.`,
      `Average the deviations: (${absDevs.join(' + ')}) / ${values.length} ≈ ${mad.toFixed(2)}.`,
    ],
    answer_type: 'decimal',
  });
}

// =============================================================================
// GENERATOR REGISTRY - ALL 54 GENERATORS
// =============================================================================

export const GENERATORS: Record<string, (difficulty: DifficultyLevel) => GeneratedQuestion> = {
  // Category 1: Equations & Expressions (14)
  evaluate_expression: generate_evaluate_expression,
  simplify_expression: generate_simplify_expression,
  linear_eq_one_step_add: generate_linear_eq_one_step_add,
  linear_eq_one_step_mult: generate_linear_eq_one_step_mult,
  linear_eq_two_step: generate_linear_eq_two_step,
  linear_eq_multi_step: generate_linear_eq_multi_step,
  linear_eq_both_sides: generate_linear_eq_both_sides,
  abs_value_equation: generate_abs_value_equation,
  literal_equation: generate_literal_equation,
  inequality_one_step_add: generate_inequality_one_step_add,
  inequality_one_step_mult: generate_inequality_one_step_mult,
  inequality_multi_step: generate_inequality_multi_step,
  compound_inequality: generate_compound_inequality,
  abs_value_inequality: generate_abs_value_inequality,
  
  // Category 2: Linear Functions (9)
  evaluate_function: generate_evaluate_function,
  calculate_slope: generate_calculate_slope,
  write_linear_eq: generate_write_linear_eq,
  write_linear_eq_points: generate_write_linear_eq_points,
  point_slope_form: generate_point_slope_form,
  convert_linear_forms: generate_convert_linear_forms,
  parallel_line_slope: generate_parallel_line_slope,
  perp_line_slope: generate_perp_line_slope,
  write_parallel_perp_eq: generate_write_parallel_perp_eq,
  
  // Category 3: Systems (4)
  system_substitution: generate_system_substitution,
  system_elimination_basic: generate_system_elimination_basic,
  system_elimination_mult: generate_system_elimination_mult,
  system_solution_type: generate_system_solution_type,
  
  // Category 4: Exponents (7)
  evaluate_exponent: generate_evaluate_exponent,
  exponent_product_quotient: generate_exponent_product_quotient,
  exponent_power_rules: generate_exponent_power_rules,
  exponent_zero_negative: generate_exponent_zero_negative,
  exponent_simplify_all: generate_exponent_simplify_all,
  identify_growth_decay: generate_identify_growth_decay,
  write_exponential_eq: generate_write_exponential_eq,
  
  // Category 5: Polynomials (9)
  add_polynomials: generate_add_polynomials,
  subtract_polynomials: generate_subtract_polynomials,
  multiply_mono_poly: generate_multiply_mono_poly,
  multiply_binomials: generate_multiply_binomials,
  factor_gcf: generate_factor_gcf,
  factor_trinomial_a1: generate_factor_trinomial_a1,
  factor_trinomial_a_ne_1: generate_factor_trinomial_a_ne_1,
  factor_diff_squares: generate_factor_diff_squares,
  factor_perfect_square: generate_factor_perfect_square,
  
  // Category 6: Quadratics (4)
  quadratic_vertex: generate_quadratic_vertex,
  quadratic_factor_solve: generate_quadratic_factor_solve,
  quadratic_sqrt_solve: generate_quadratic_sqrt_solve,
  quadratic_formula: generate_quadratic_formula,
  
  // Category 7: Statistics (3)
  calculate_central_tendency: generate_calculate_central_tendency,
  calculate_variability: generate_calculate_variability,
  calculate_residual: generate_calculate_residual,
  
  // Category 8: Transformations (4)
  translate_point: generate_translate_point,
  reflect_point: generate_reflect_point,
  rotate_point: generate_rotate_point,
  transform_sequence: generate_transform_sequence,

  // ─── NC GRADE 7 (Challengers division) ─────────────────────────────────────
  // BATCH 1: Number System (5)
  g7_add_rational:                generate_g7_add_rational,
  g7_subtract_rational:           generate_g7_subtract_rational,
  g7_multiply_rational:           generate_g7_multiply_rational,
  g7_divide_rational:             generate_g7_divide_rational,
  g7_rational_to_decimal:         generate_g7_rational_to_decimal,
  // BATCH 2: Ratios & Proportional Relationships (5)
  g7_find_unit_rate:              generate_g7_find_unit_rate,
  g7_proportional_solve:          generate_g7_proportional_solve,
  g7_percent_tax_tip_discount:    generate_g7_percent_tax_tip_discount,
  g7_simple_interest:             generate_g7_simple_interest,
  g7_percent_change:              generate_g7_percent_change,
  // BATCH 3: Expressions & Equations (5)
  g7_add_sub_linear_expr:         generate_g7_add_sub_linear_expr,
  g7_expand_linear_expr:          generate_g7_expand_linear_expr,
  g7_solve_linear_rational:       generate_g7_solve_linear_rational,
  g7_solve_distrib_like_terms:    generate_g7_solve_distrib_like_terms,
  g7_fraction_decimal_percent:    generate_g7_fraction_decimal_percent,
  // BATCH 4: Geometry — angles, circles, area (5)
  g7_angle_relationship_solve:    generate_g7_angle_relationship_solve,
  g7_circle_area_circumference:   generate_g7_circle_area_circumference,
  g7_angle_equation_solve:        generate_g7_angle_equation_solve,
  g7_composite_area:              generate_g7_composite_area,
  g7_area_2d_objects:             generate_g7_area_2d_objects,
  // BATCH 5: Volume, Surface Area, Probability (5)
  g7_volume_3d_objects:           generate_g7_volume_3d_objects,
  g7_surface_area_3d:             generate_g7_surface_area_3d,
  g7_theoretical_probability:     generate_g7_theoretical_probability,
  g7_experimental_probability:    generate_g7_experimental_probability,
  g7_compound_probability:        generate_g7_compound_probability,

  // ─── NC GRADE 8 (Contenders division) ──────────────────────────────────────
  // BATCH 1: Real Number System (5)
  g8_eval_roots:                  generate_g8_eval_roots,
  g8_solve_square_eq:             generate_g8_solve_square_eq,
  g8_solve_cube_eq:               generate_g8_solve_cube_eq,
  g8_compare_irrationals:         generate_g8_compare_irrationals,
  g8_simplify_exponents:          generate_g8_simplify_exponents,
  // BATCH 2: Expressions & Equations (5)
  g8_solve_linear_multistep:      generate_g8_solve_linear_multistep,
  g8_solve_vars_both_sides:       generate_g8_solve_vars_both_sides,
  g8_evaluate_function_notation:  generate_g8_evaluate_function_notation,
  g8_classify_equation_type:      generate_g8_classify_equation_type,
  g8_solve_system_substitution:   generate_g8_solve_system_substitution,
  // BATCH 3: Functions & Geometry (5)
  g8_solve_system_elimination:    generate_g8_solve_system_elimination,
  g8_construct_linear_function:   generate_g8_construct_linear_function,
  g8_coordinate_dilation:         generate_g8_coordinate_dilation,
  g8_similar_figures_solve:       generate_g8_similar_figures_solve,
  g8_triangle_angle_sum:          generate_g8_triangle_angle_sum,
  // BATCH 4: Pythagorean Theorem (5)
  g8_pythagorean_missing_side:    generate_g8_pythagorean_missing_side,
  g8_pythagorean_2d_context:      generate_g8_pythagorean_2d_context,
  g8_pythagorean_converse:        generate_g8_pythagorean_converse,
  g8_coordinate_distance:         generate_g8_coordinate_distance,
  g8_volume_cylinder:             generate_g8_volume_cylinder,
  // BATCH 5: Volume & Statistics (5)
  g8_volume_cone:                 generate_g8_volume_cone,
  g8_volume_sphere:               generate_g8_volume_sphere,
  g8_volume_3d_word_problem:      generate_g8_volume_3d_word_problem,
  g8_relative_frequency_table:    generate_g8_relative_frequency_table,
  g8_pythagorean_3d_context:      generate_g8_pythagorean_3d_context,

  // ─── ALGEBRA 1 (Varsity division) ──────────────────────────────────────────
  // BATCH 1: Foundations of Algebra (5)
  alg1_eval_algebraic_expr:       generate_alg1_eval_algebraic_expr,
  alg1_simplify_expression:       generate_alg1_simplify_expression,
  alg1_translate_verbal:          generate_alg1_translate_verbal,
  alg1_solve_one_step_add_sub:    generate_alg1_solve_one_step_add_sub,
  alg1_solve_one_step_mult_div:   generate_alg1_solve_one_step_mult_div,
  // BATCH 2: Linear Equations (5)
  alg1_solve_two_step:            generate_alg1_solve_two_step,
  alg1_solve_multi_step:          generate_alg1_solve_multi_step,
  alg1_solve_vars_both_sides:     generate_alg1_solve_vars_both_sides,
  alg1_solve_literal_equation:    generate_alg1_solve_literal_equation,
  alg1_write_linear_equation:     generate_alg1_write_linear_equation,
  // BATCH 3: Linear Functions (5)
  alg1_slope_from_points:         generate_alg1_slope_from_points,
  alg1_slope_intercept_form:      generate_alg1_slope_intercept_form,
  alg1_graph_identify_slope:      generate_alg1_graph_identify_slope,
  alg1_write_equation_from_table: generate_alg1_write_equation_from_table,
  alg1_write_equation_two_points: generate_alg1_write_equation_two_points,
  // BATCH 4: Systems & Inequalities (5)
  alg1_solve_system_substitution: generate_alg1_solve_system_substitution,
  alg1_solve_system_elimination:  generate_alg1_solve_system_elimination,
  alg1_solve_inequality_one_step: generate_alg1_solve_inequality_one_step,
  alg1_solve_inequality_multi_step: generate_alg1_solve_inequality_multi_step,
  alg1_compound_inequality:       generate_alg1_compound_inequality,
  // BATCH 5: Exponents, Polynomials, Quadratics (5)
  alg1_exponent_rules:            generate_alg1_exponent_rules,
  alg1_add_subtract_polynomials:  generate_alg1_add_subtract_polynomials,
  alg1_multiply_polynomials:      generate_alg1_multiply_polynomials,
  alg1_factor_trinomial:          generate_alg1_factor_trinomial,
  alg1_quadratic_formula:         generate_alg1_quadratic_formula,

  // ─── NC MATH 3 (Varsity+ division) ─────────────────────────────────────────
  // BATCH 1: Functions & Inverses (5)
  m3_evaluate_function:           generate_m3_evaluate_function,
  m3_compose_functions:           generate_m3_compose_functions,
  m3_inverse_function:            generate_m3_inverse_function,
  m3_domain_range:                generate_m3_domain_range,
  m3_transformation_describe:     generate_m3_transformation_describe,
  // BATCH 2: Exponential & Logarithmic (5)
  m3_evaluate_exponential:        generate_m3_evaluate_exponential,
  m3_solve_exponential_eq:        generate_m3_solve_exponential_eq,
  m3_evaluate_logarithm:          generate_m3_evaluate_logarithm,
  m3_expand_condense_log:         generate_m3_expand_condense_log,
  m3_exponential_growth_decay:    generate_m3_exponential_growth_decay,
  // BATCH 3: Polynomial Functions (5)
  m3_polynomial_end_behavior:     generate_m3_polynomial_end_behavior,
  m3_polynomial_zeros:            generate_m3_polynomial_zeros,
  m3_factor_polynomial:           generate_m3_factor_polynomial,
  m3_divide_polynomial:           generate_m3_divide_polynomial,
  m3_rational_root_theorem:       generate_m3_rational_root_theorem,
  // BATCH 4: Rational, Radical, Complex (5)
  m3_simplify_rational_expr:      generate_m3_simplify_rational_expr,
  m3_solve_rational_eq:           generate_m3_solve_rational_eq,
  m3_simplify_radical_expr:       generate_m3_simplify_radical_expr,
  m3_solve_radical_eq:            generate_m3_solve_radical_eq,
  m3_complex_numbers:             generate_m3_complex_numbers,
  // BATCH 5: Trigonometry & Statistics (5)
  m3_unit_circle_values:          generate_m3_unit_circle_values,
  m3_trig_equation_solve:         generate_m3_trig_equation_solve,
  m3_law_of_sines:                generate_m3_law_of_sines,
  m3_normal_distribution:         generate_m3_normal_distribution,
  m3_confidence_interval:         generate_m3_confidence_interval,

  // ─── MATH FUNDAMENTALS (Cross-division pool) ───────────────────────────────
  // BATCH 1: Number Basics & Arithmetic (5)
  mf_absolute_value:              generate_mf_absolute_value,
  mf_integer_add_subtract:        generate_mf_integer_add_subtract,
  mf_integer_multiply_divide:     generate_mf_integer_multiply_divide,
  mf_fraction_add_subtract:       generate_mf_fraction_add_subtract,
  mf_fraction_multiply_divide:    generate_mf_fraction_multiply_divide,
  // BATCH 2: Decimals, Percents & Ratios (5)
  mf_decimal_operations:          generate_mf_decimal_operations,
  mf_percent_of_number:           generate_mf_percent_of_number,
  mf_percent_change:              generate_mf_percent_change,
  mf_ratio_unit_rate:             generate_mf_ratio_unit_rate,
  mf_proportion_solve:            generate_mf_proportion_solve,
  // BATCH 3: Algebraic Reasoning (5)
  mf_evaluate_expression:         generate_mf_evaluate_expression,
  mf_simplify_expression:         generate_mf_simplify_expression,
  mf_solve_one_step_equation:     generate_mf_solve_one_step_equation,
  mf_solve_two_step_equation:     generate_mf_solve_two_step_equation,
  mf_write_expression:            generate_mf_write_expression,
  // BATCH 4: Geometry (5)
  mf_area_rectangle_triangle:     generate_mf_area_rectangle_triangle,
  mf_perimeter:                   generate_mf_perimeter,
  mf_pythagorean_theorem:         generate_mf_pythagorean_theorem,
  mf_angle_relationships:         generate_mf_angle_relationships,
  mf_volume_rectangular_prism:    generate_mf_volume_rectangular_prism,
  // BATCH 5: Data, Statistics & Sets (5)
  mf_mean_median_mode:            generate_mf_mean_median_mode,
  mf_range_iqr:                   generate_mf_range_iqr,
  mf_probability_basic:           generate_mf_probability_basic,
  mf_exponent_evaluate:           generate_mf_exponent_evaluate,
  mf_square_cube_root:            generate_mf_square_cube_root,

  // ─── NC GRADE 6 (Rising Stars division) ────────────────────────────────────
  // BATCH 1: NS — Decimal & Fraction Operations (5)
  g6_ns_add_sub_decimals:         generate_g6_ns_add_sub_decimals,
  g6_ns_multiply_decimals:        generate_g6_ns_multiply_decimals,
  g6_ns_long_division_whole:      generate_g6_ns_long_division_whole,
  g6_ns_divide_decimals:          generate_g6_ns_divide_decimals,
  g6_ns_divide_fractions:         generate_g6_ns_divide_fractions,
  // BATCH 2: NS — Word Problem, GCF/LCM, Absolute Value (5)
  g6_ns_fraction_division_word:   generate_g6_ns_fraction_division_word,
  g6_ns_find_gcf:                 generate_g6_ns_find_gcf,
  g6_ns_find_lcm:                 generate_g6_ns_find_lcm,
  g6_ns_gcf_rewrite_expression:   generate_g6_ns_gcf_rewrite_expression,
  g6_ns_compute_absolute_value:   generate_g6_ns_compute_absolute_value,
  // BATCH 3: NS Compare/Distance, RP Rates & Ratios (5)
  g6_ns_compare_order_rationals:  generate_g6_ns_compare_order_rationals,
  g6_ns_coordinate_distance_6:    generate_g6_ns_coordinate_distance_6,
  g6_rp_calculate_unit_rate:      generate_g6_rp_calculate_unit_rate,
  g6_rp_ratio_table_solve:        generate_g6_rp_ratio_table_solve,
  g6_rp_ratio_word_problem:       generate_g6_rp_ratio_word_problem,
  // BATCH 4: RP Percents & Conversions, EE Exponents (5)
  g6_rp_percent_of_quantity:      generate_g6_rp_percent_of_quantity,
  g6_rp_percent_whole_part:       generate_g6_rp_percent_whole_part,
  g6_rp_fraction_decimal_pct_6:   generate_g6_rp_fraction_decimal_pct_6,
  g6_rp_unit_conversion:          generate_g6_rp_unit_conversion,
  g6_ee_eval_numerical_exponents: generate_g6_ee_eval_numerical_exponents,
  // BATCH 5: EE Expressions & One-Step Equations (5)
  g6_ee_evaluate_algebraic_expr:  generate_g6_ee_evaluate_algebraic_expr,
  g6_ee_expand_distributive_6:    generate_g6_ee_expand_distributive_6,
  g6_ee_combine_like_terms_6:     generate_g6_ee_combine_like_terms_6,
  g6_ee_solve_one_step_add_sub:   generate_g6_ee_solve_one_step_add_sub,
  g6_ee_solve_one_step_mul_div:   generate_g6_ee_solve_one_step_mul_div,
  // BATCH 6: GEO Area & Volume (5)
  g6_geo_area_triangle_6:         generate_g6_geo_area_triangle_6,
  g6_geo_area_parallelogram:      generate_g6_geo_area_parallelogram,
  g6_geo_area_trapezoid:          generate_g6_geo_area_trapezoid,
  g6_geo_volume_rect_prism_whole: generate_g6_geo_volume_rect_prism_whole,
  g6_geo_volume_rect_prism_frac:  generate_g6_geo_volume_rect_prism_frac,
  // BATCH 7: SP Statistics (4)
  g6_sp_five_number_summary:      generate_g6_sp_five_number_summary,
  g6_sp_compute_center_stats:     generate_g6_sp_compute_center_stats,
  g6_sp_compute_variability:      generate_g6_sp_compute_variability,
  g6_sp_compute_mad:              generate_g6_sp_compute_mad,
};

// Helper to get all generator types
export const GENERATOR_TYPES = Object.keys(GENERATORS);

/**
 * Ensure `answer` and `question` aliases are populated on every generator
 * output. The g7Wrap-based generators set these themselves; the legacy
 * NCM1 generators (which build the GeneratedQuestion shape inline) don't.
 * This shim guarantees external tooling never sees `undefined` regardless
 * of which generator was invoked.
 */
function ensureAliases(q: GeneratedQuestion): GeneratedQuestion {
  if (q.answer === undefined) q.answer = q.correct_answer;
  if (q.question === undefined) q.question = q.question_text || q.question_latex;
  return q;
}

// Generate by type
export function generateQuestion(type: string, difficulty: DifficultyLevel): GeneratedQuestion | null {
  const gen = GENERATORS[type];
  if (!gen) return null;
  return ensureAliases(gen(difficulty));
}

// Generate batch for Heat
export function generateHeatQuestions(
  config: { generator_type: string; difficulty: DifficultyLevel }[]
): GeneratedQuestion[] {
  return config.map(({ generator_type, difficulty }) => {
    const q = generateQuestion(generator_type, difficulty);
    if (!q) throw new Error(`Unknown generator: ${generator_type}`);
    return q;
  });
}
