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
};

// Helper to get all generator types
export const GENERATOR_TYPES = Object.keys(GENERATORS);

// Generate by type
export function generateQuestion(type: string, difficulty: DifficultyLevel): GeneratedQuestion | null {
  const gen = GENERATORS[type];
  return gen ? gen(difficulty) : null;
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
