// =============================================================================
// MathAthlone — NC Math 2 Batch 1 Procedural Generators
// =============================================================================
// Scope: Polynomial & Rational Expressions; The Real Number System.
// Each generator is mapped to the curriculum-owner-approved blueprint in
// docs/NC_MATH_2_BATCH_1_PLAN.md. Prompts state one precise task, use clean
// notation, and return exact answers with a student-readable solution path.
// =============================================================================

import type { AnswerType, DifficultyLevel, GeneratedQuestion } from './generators';

const int = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const nonZero = (min: number, max: number): number => {
  let value = 0;
  while (value === 0) value = int(min, max);
  return value;
};

const gcd = (a: number, b: number): number => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

const signed = (n: number): string => n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
const linear = (root: number): string => root >= 0 ? `x - ${root}` : `x + ${Math.abs(root)}`;
const factor = (root: number): string => `(${linear(root)})`;

function polynomial(coefficients: number[]): string {
  const degree = coefficients.length - 1;
  const terms: string[] = [];
  coefficients.forEach((coefficient, index) => {
    if (coefficient === 0) return;
    const power = degree - index;
    const abs = Math.abs(coefficient);
    const variable = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`;
    const magnitude = power === 0 ? String(abs) : abs === 1 ? variable : `${abs}${variable}`;
    if (terms.length === 0) terms.push(coefficient < 0 ? `-${magnitude}` : magnitude);
    else terms.push(coefficient < 0 ? `- ${magnitude}` : `+ ${magnitude}`);
  });
  return terms.join(' ') || '0';
}

function multiplyPoly(a: number[], b: number[]): number[] {
  const result = Array(a.length + b.length - 1).fill(0) as number[];
  a.forEach((av, i) => b.forEach((bv, j) => { result[i + j] += av * bv; }));
  return result;
}

function q(
  difficulty: DifficultyLevel,
  generator_type: string,
  concept_id: string,
  question_text: string,
  correct_answer: string,
  answer_type: AnswerType,
  solution_steps: string[],
  question_latex: string = question_text,
): GeneratedQuestion {
  return {
    question_latex,
    question_text,
    correct_answer,
    answer_type,
    solution_steps,
    difficulty,
    concept_id,
    generator_type,
    question: question_text,
    answer: correct_answer,
  };
}

function squarefreeRadicand(): number {
  return [2, 3, 5, 6, 7, 10, 11, 12, 13, 15][int(0, 9)]!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit: Arithmetic with Polynomial & Rational Expressions (M2.APR)
// ─────────────────────────────────────────────────────────────────────────────

export function generate_m2_add_subtract_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const count = difficulty <= 2 ? 2 : 3;
  const degree = difficulty === 1 ? 1 : 2;
  const polynomials = Array.from({ length: count }, () =>
    Array.from({ length: degree + 1 }, (_, i) =>
      difficulty === 4 && i === 1 && Math.random() < 0.45 ? 0 : nonZero(-6, 6)
    )
  );
  const signs = polynomials.map((_, i) => i === 0 ? 1 : (difficulty >= 3 && Math.random() < 0.45 ? -1 : 1));
  const result = polynomials[0]!.map((_, index) =>
    polynomials.reduce((sum, current, pIndex) => sum + signs[pIndex]! * current[index]!, 0)
  );
  const expression = polynomials.map((p, index) => {
    const text = `(${polynomial(p)})`;
    return index === 0 ? text : signs[index] === 1 ? `+ ${text}` : `- ${text}`;
  }).join(' ');
  const answer = polynomial(result);
  return q(
    difficulty, 'm2_add_subtract_polynomials', 'M2.APR.1.1',
    `Simplify the polynomial expression: ${expression}.`, answer, 'expression',
    [
      'Group terms with the same exponent.',
      `Combine the coefficients of like terms to obtain ${answer}.`,
    ],
  );
}

export function generate_m2_multiply_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-4, 5);
  let left: number[];
  let right: number[];
  if (difficulty === 1) {
    left = [a, 0];
    right = [nonZero(-5, 5), nonZero(-8, 8)];
  } else if (difficulty === 2) {
    left = [a, nonZero(-7, 7)];
    right = [nonZero(-5, 5), nonZero(-7, 7)];
  } else {
    left = [a, nonZero(-7, 7)];
    right = [nonZero(-4, 5), nonZero(-7, 7), nonZero(-8, 8)];
  }
  const answer = polynomial(multiplyPoly(left, right));
  const leftText = polynomial(left);
  const rightText = polynomial(right);
  return q(
    difficulty, 'm2_multiply_polynomials', 'M2.APR.1.2',
    `Expand and simplify: (${leftText})(${rightText}).`, answer, 'expression',
    [
      `Distribute every term in (${leftText}) across (${rightText}).`,
      'Combine like terms after multiplying.',
      `The simplified product is ${answer}.`,
    ],
  );
}

export function generate_m2_polynomial_long_division(difficulty: DifficultyLevel): GeneratedQuestion {
  const k = nonZero(-4, 4);
  const quotient = [1, nonZero(-5, 5), nonZero(-8, 8)];
  const remainder = difficulty === 1 ? 0 : nonZero(-8, 8);
  const dividend = multiplyPoly([1, -k], quotient);
  dividend[dividend.length - 1]! += remainder;
  const dividendText = polynomial(dividend);
  const divisorText = linear(k);
  const quotientText = polynomial(quotient);
  const answer = remainder === 0
    ? quotientText
    : remainder > 0
      ? `${quotientText} + ${remainder}/(${divisorText})`
      : `${quotientText} - ${Math.abs(remainder)}/(${divisorText})`;
  return q(
    difficulty, 'm2_polynomial_long_division', 'M2.APR.2.1',
    `Use polynomial long division to divide (${dividendText}) by (${divisorText}). State the quotient and any remainder.`,
    answer, 'expression',
    [
      `Divide the leading term of ${dividendText} by x, then multiply and subtract at each step.`,
      `The quotient is ${quotientText}${remainder === 0 ? ' with no remainder.' : ` and the remainder is ${remainder}.`}`,
      `Therefore the result is ${answer}.`,
    ],
  );
}

export function generate_m2_synthetic_division(difficulty: DifficultyLevel): GeneratedQuestion {
  const k = nonZero(-4, 4);
  const quotient = [1, nonZero(-5, 5), nonZero(-8, 8)];
  const remainder = difficulty >= 2 ? nonZero(-6, 6) : 0;
  const dividend = multiplyPoly([1, -k], quotient);
  dividend[dividend.length - 1]! += remainder;
  const dividendText = polynomial(dividend);
  const quotientText = polynomial(quotient);
  return q(
    difficulty, 'm2_synthetic_division', 'M2.APR.2.2',
    `Use synthetic division to evaluate P(${k}) for P(x) = ${dividendText}.`,
    String(remainder), 'integer',
    [
      `Use ${k} in the synthetic-division setup because synthetic division uses the value where x - ${k} = 0.`,
      `The quotient is ${quotientText} and the remainder is ${remainder}.`,
      `By the Remainder Theorem, P(${k}) = ${remainder}.`,
    ],
  );
}

export function generate_m2_simplify_rational_expression(difficulty: DifficultyLevel): GeneratedQuestion {
  const common = nonZero(-5, 5);
  const topOther = nonZero(-6, 6);
  let bottomOther = nonZero(-6, 6);
  while (bottomOther === common || bottomOther === topOther) bottomOther = nonZero(-6, 6);
  const numerator = `${factor(common)}${factor(topOther)}`;
  const denominator = `${factor(common)}${factor(bottomOther)}`;
  const simplified = `${factor(topOther)}/${factor(bottomOther)}`;
  const answer = `${simplified}; x ≠ ${common}, ${bottomOther}`;
  return q(
    difficulty, 'm2_simplify_rational_expression', 'M2.APR.3.1',
    `Simplify (${numerator})/(${denominator}). State all excluded values of x.`, answer, 'text',
    [
      `The factor ${factor(common)} appears in both numerator and denominator, so it cancels only when x ≠ ${common}.`,
      `The simplified expression is ${simplified}.`,
      `The original denominator is zero at x = ${common} and x = ${bottomOther}, so both values are excluded.`,
    ],
  );
}

export function generate_m2_multiply_rational_expressions(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-5, 5);
  let b = nonZero(-5, 5);
  while (b === a) b = nonZero(-5, 5);
  let c = nonZero(-5, 5);
  while (c === a || c === b) c = nonZero(-5, 5);
  const first = `${factor(a)}/${factor(b)}`;
  const second = `${factor(b)}/${factor(c)}`;
  const answer = `${factor(a)}/${factor(c)}`;
  return q(
    difficulty, 'm2_multiply_rational_expressions', 'M2.APR.3.2',
    `Multiply and simplify: (${first}) · (${second}).`, answer, 'expression',
    [
      `Write the product as ${factor(a)}${factor(b)}/(${factor(b)}${factor(c)}).`,
      `Cancel the common factor ${factor(b)}.`,
      `The simplified product is ${answer}.`,
    ],
  );
}

export function generate_m2_divide_rational_expressions(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-5, 5);
  const b = nonZero(-5, 5);
  let c = nonZero(-5, 5);
  while (c === a || c === b) c = nonZero(-5, 5);
  const first = `${factor(a)}/${factor(b)}`;
  const second = `${factor(c)}/${factor(b)}`;
  const answer = `${factor(a)}/${factor(c)}`;
  return q(
    difficulty, 'm2_divide_rational_expressions', 'M2.APR.3.3',
    `Divide and simplify: (${first}) ÷ (${second}).`, answer, 'expression',
    [
      `Rewrite division as multiplication by the reciprocal: (${first}) · (${factor(b)}/${factor(c)}).`,
      `Cancel the common factor ${factor(b)}.`,
      `The simplified quotient is ${answer}.`,
    ],
  );
}

export function generate_m2_lcm_polynomials(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-5, 5);
  let b = nonZero(-5, 5);
  while (b === a) b = nonZero(-5, 5);
  const p1 = `${factor(a)}^2${factor(b)}`;
  const p2 = `${factor(a)}${factor(b)}^2`;
  const p3 = difficulty >= 3 ? `${factor(a)}^3` : '';
  const answer = difficulty >= 3 ? `${factor(a)}^3${factor(b)}^2` : `${factor(a)}^2${factor(b)}^2`;
  const listed = difficulty >= 3 ? `${p1}, ${p2}, and ${p3}` : `${p1} and ${p2}`;
  return q(
    difficulty, 'm2_lcm_polynomials', 'M2.APR.4.1',
    `Find the least common multiple of ${listed}.`, answer, 'expression',
    [
      `Use every distinct factor that appears: ${factor(a)} and ${factor(b)}.`,
      `For each factor, use its greatest exponent from the listed expressions.`,
      `The LCM is ${answer}.`,
    ],
  );
}

export function generate_m2_add_rational_like_denominators(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-8, 8);
  let b = nonZero(-8, 8);
  while (a + b === 0) b = nonZero(-8, 8);
  const root = nonZero(-6, 6);
  const denominator = factor(root);
  const answer = `${a + b}/${denominator}`;
  return q(
    difficulty, 'm2_add_rational_like_denominators', 'M2.APR.4.2',
    `Add and simplify: ${a}/${denominator} ${signed(b)}/${denominator}.`, answer, 'expression',
    [
      `The denominators already match, so add the numerators: ${a} ${signed(b)} = ${a + b}.`,
      `Keep the denominator ${denominator}.`,
      `The sum is ${answer}.`,
    ],
  );
}

export function generate_m2_add_rational_unlike_denominators(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = nonZero(-6, 6);
  const b = nonZero(-6, 6);
  const p = nonZero(-5, 5);
  let r = nonZero(-5, 5);
  while (r === p) r = nonZero(-5, 5);
  const d1 = factor(p);
  const d2 = factor(r);
  const xCoef = a + b;
  const constant = -a * r - b * p;
  const numerator = polynomial([xCoef, constant]);
  const answer = `(${numerator})/(${d1}${d2})`;
  return q(
    difficulty, 'm2_add_rational_unlike_denominators', 'M2.APR.4.3',
    `Add and simplify: ${a}/${d1} ${signed(b)}/${d2}.`, answer, 'expression',
    [
      `The least common denominator is ${d1}${d2}.`,
      `Rewrite the numerator as ${a}${d2} ${signed(b)}${d1}.`,
      `Combine like terms to obtain ${numerator}.`,
      `The sum is ${answer}.`,
    ],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit: The Real Number System (M2.RNS)
// ─────────────────────────────────────────────────────────────────────────────

export function generate_m2_fraction_decimal_classify(difficulty: DifficultyLevel): GeneratedQuestion {
  const terminating = difficulty % 2 === 1;
  const denominator = terminating ? [4, 5, 8, 20][int(0, 3)]! : 3;
  const numerator = terminating ? int(1, denominator - 1) : [1, 2][int(0, 1)]!;
  while (terminating && gcd(numerator, denominator) !== 1) {
    // Denominators are small, so one retry is sufficient to choose a reduced fraction.
    return generate_m2_fraction_decimal_classify(difficulty);
  }
  const decimal = terminating
    ? String(numerator / denominator)
    : numerator === 1 ? '0.333...' : '0.666...';
  const answer = terminating ? 'terminating' : 'repeating';
  return q(
    difficulty, 'm2_fraction_decimal_classify', 'M2.RNS.1.1',
    `Convert ${numerator}/${denominator} to a decimal. Then state whether the decimal is terminating or repeating.`,
    `${decimal}; ${answer}`, 'text',
    [
      `${numerator} ÷ ${denominator} = ${decimal}.`,
      terminating ? 'The division ends, so the decimal is terminating.' : 'The repeated digit continues forever, so the decimal is repeating.',
    ],
  );
}

export function generate_m2_rational_irrational_classify(difficulty: DifficultyLevel): GeneratedQuestion {
  const rational = difficulty % 2 === 0;
  const perfect = [4, 9, 16, 25, 36][int(0, 4)]!;
  const nonPerfect = [2, 3, 5, 6, 7, 10, 11][int(0, 6)]!;
  const value = rational ? `√${perfect}` : `√${nonPerfect}`;
  const answer = rational ? 'rational' : 'irrational';
  return q(
    difficulty, 'm2_rational_irrational_classify', 'M2.RNS.1.2',
    `Classify ${value} as rational or irrational. Give a brief reason.`, answer, 'text',
    rational
      ? [`${perfect} is a perfect square, so √${perfect} = ${Math.sqrt(perfect)}.`, `An integer is rational, so ${value} is rational.`]
      : [`${nonPerfect} is not a perfect square.`, `Therefore √${nonPerfect} cannot be written as a ratio of integers, so it is irrational.`],
  );
}

export function generate_m2_classify_real_numbers(difficulty: DifficultyLevel): GeneratedQuestion {
  const choices = [
    { value: String(int(1, 12)), answer: 'natural number' },
    { value: String(-int(1, 12)), answer: 'integer' },
    { value: `${int(1, 7)}/${[2, 3, 5, 7][int(0, 3)]!}`, answer: 'rational number' },
    { value: `√${[2, 3, 5, 6, 7][int(0, 4)]!}`, answer: 'irrational number' },
  ];
  const item = choices[int(0, choices.length - 1)]!;
  const solutionLabel = item.answer === 'natural number' ? 'natural numbers'
    : item.answer === 'integer' ? 'integers'
    : item.answer === 'rational number' ? 'rational numbers'
    : 'irrational numbers';
  return q(
    difficulty, 'm2_classify_real_numbers', 'M2.RNS.1.3',
    `Classify ${item.value} in the most specific set: natural numbers, integers, rational numbers, or irrational numbers.`,
    item.answer, 'text',
    [`${item.value} belongs most specifically to the set of ${solutionLabel}.`],
  );
}

export function generate_m2_rational_exponent_evaluate(difficulty: DifficultyLevel): GeneratedQuestion {
  const options = [
    { base: 8, numerator: 2, denominator: 3, answer: 4 },
    { base: 16, numerator: 3, denominator: 4, answer: 8 },
    { base: 27, numerator: 2, denominator: 3, answer: 9 },
    { base: 32, numerator: 3, denominator: 5, answer: 8 },
  ];
  const item = options[Math.min(difficulty - 1, options.length - 1)]!;
  return q(
    difficulty, 'm2_rational_exponent_evaluate', 'M2.RNS.2.1',
    `Evaluate ${item.base}^(${item.numerator}/${item.denominator}) exactly.`, String(item.answer), 'integer',
    [
      `${item.base}^(${item.numerator}/${item.denominator}) = (the ${item.denominator}th root of ${item.base})^${item.numerator}.`,
      `The ${item.denominator}th root of ${item.base} is ${Math.round(item.base ** (1 / item.denominator))}.`,
      `Therefore the value is ${item.answer}.`,
    ],
  );
}

export function generate_m2_simplify_rational_exponents(difficulty: DifficultyLevel): GeneratedQuestion {
  const base = ['x', 'y', 'a'][int(0, 2)]!;
  const setups = [
    { question: `${base}^(1/3) · ${base}^(2/3)`, answer: base, step: 'Add the exponents: 1/3 + 2/3 = 1.' },
    { question: `${base}^(5/4) / ${base}^(1/4)`, answer: base, step: 'Subtract the exponents: 5/4 - 1/4 = 1.' },
    { question: `(${base}^(2/3))^3`, answer: `${base}^2`, step: 'Multiply the exponents: (2/3)(3) = 2.' },
    { question: `${base}^(-1/2) · ${base}^(3/2)`, answer: base, step: 'Add the exponents: -1/2 + 3/2 = 1.' },
  ];
  const item = setups[difficulty - 1]!;
  return q(
    difficulty, 'm2_simplify_rational_exponents', 'M2.RNS.2.2',
    `Simplify ${item.question}. Assume ${base} is positive.`, item.answer, 'expression',
    [item.step, `A first power is written as ${base}, so the simplified expression is ${item.answer}.`],
  );
}

export function generate_m2_simplify_radicals(difficulty: DifficultyLevel): GeneratedQuestion {
  const outside = int(2, 7);
  const inside = squarefreeRadicand();
  const radicand = outside * outside * inside;
  const answer = `${outside}√${inside}`;
  return q(
    difficulty, 'm2_simplify_radicals', 'M2.RNS.3.1',
    `Simplify √${radicand}.`, answer, 'expression',
    [`Factor ${radicand} as ${outside * outside} · ${inside}.`, `√${radicand} = √${outside * outside} · √${inside} = ${answer}.`],
  );
}

export function generate_m2_add_subtract_radicals(difficulty: DifficultyLevel): GeneratedQuestion {
  const radical = squarefreeRadicand();
  const a = nonZero(-8, 8);
  let b = nonZero(-8, 8);
  while (a + b === 0) b = nonZero(-8, 8);
  const answerCoef = a + b;
  const radicalTerm = (coefficient: number) => coefficient === 1 ? `√${radical}`
    : coefficient === -1 ? `-√${radical}`
    : `${coefficient}√${radical}`;
  const answer = radicalTerm(answerCoef);
  const first = radicalTerm(a);
  const second = b >= 0 ? `+ ${radicalTerm(b)}` : `- ${radicalTerm(-b)}`;
  return q(
    difficulty, 'm2_add_subtract_radicals', 'M2.RNS.3.2',
    `Simplify ${first} ${second}.`, answer, 'expression',
    [`Both terms have the same radical part, √${radical}.`, `Combine the coefficients: ${a} ${signed(b)} = ${answerCoef}.`, `The simplified expression is ${answer}.`],
  );
}

export function generate_m2_multiply_radicals(difficulty: DifficultyLevel): GeneratedQuestion {
  const outside = int(2, 5);
  const radical = squarefreeRadicand();
  const answer = `${outside}√${radical}`;
  return q(
    difficulty, 'm2_multiply_radicals', 'M2.RNS.3.3',
    `Simplify √${outside} · √${outside * radical}.`, answer, 'expression',
    [`Multiply under one radical: √(${outside} · ${outside * radical}) = √${outside * outside * radical}.`, `√${outside * outside * radical} = ${outside}√${radical}.`, `The simplified product is ${answer}.`],
  );
}

export function generate_m2_rationalize_monomial_denominator(difficulty: DifficultyLevel): GeneratedQuestion {
  const numerator = int(1, 6);
  const radical = [2, 3, 5, 6, 7][int(0, 4)]!;
  const denCoef = difficulty >= 3 ? int(2, 4) : 1;
  const den = denCoef * radical;
  const divisor = gcd(numerator, den);
  const top = numerator / divisor;
  const bottom = den / divisor;
  const radicalNumerator = top === 1 ? `√${radical}` : `${top}√${radical}`;
  const answer = bottom === 1 ? radicalNumerator : `${radicalNumerator}/${bottom}`;
  return q(
    difficulty, 'm2_rationalize_monomial_denominator', 'M2.RNS.3.4',
    `Rationalize the denominator and simplify: ${numerator}/(${denCoef === 1 ? '' : denCoef}√${radical}).`, answer, 'expression',
    [`Multiply numerator and denominator by √${radical}.`, `The denominator becomes ${denCoef} · ${radical} = ${den}.`, `The simplified result is ${answer}.`],
  );
}

export function generate_m2_rationalize_conjugate_denominator(difficulty: DifficultyLevel): GeneratedQuestion {
  const a = int(1, 4);
  const radical = [17, 19, 21, 23, 29][int(0, 4)]!;
  const denominator = radical - a * a;
  const answer = `(√${radical} - ${a})/${denominator}`;
  return q(
    difficulty, 'm2_rationalize_conjugate_denominator', 'M2.RNS.3.5',
    `Rationalize the denominator and simplify: 1/(${a} + √${radical}).`, answer, 'expression',
    [`Multiply by the conjugate (√${radical} - ${a})/(√${radical} - ${a}).`, `The denominator is ${radical} - ${a * a} = ${denominator}.`, `The simplified result is ${answer}.`],
  );
}

export function generate_m2_solve_rational_exponent_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const options = [
    { power: '1/2', rhs: 4, answer: 16 },
    { power: '3/2', rhs: 8, answer: 4 },
    { power: '1/3', rhs: 5, answer: 125 },
    { power: '3/2', rhs: 27, answer: 9 },
  ];
  const item = options[difficulty - 1]!;
  return q(
    difficulty, 'm2_solve_rational_exponent_equation', 'M2.RNS.4.1',
    `Solve x^(${item.power}) = ${item.rhs} over the real numbers.`, String(item.answer), 'integer',
    [`Raise both sides to the reciprocal of ${item.power}.`, `This gives x = ${item.answer}.`, `Substitution verifies that ${item.answer}^(${item.power}) = ${item.rhs}.`],
  );
}

export function generate_m2_solve_one_radical_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const shift = int(1, 15);
  // Build an exact square-root equation by selecting the root first.
  const value = int(3, 8);
  const adjustedSolution = value * value - shift;
  const displayShift = shift >= 0 ? `+ ${shift}` : `- ${Math.abs(shift)}`;
  return q(
    difficulty, 'm2_solve_one_radical_equation', 'M2.RNS.4.2',
    `Solve √(x ${displayShift}) = ${value}. Check your solution.`, String(adjustedSolution), 'integer',
    [`Square both sides: x ${displayShift} = ${value * value}.`, `Subtract ${shift} to get x = ${adjustedSolution}.`, `Check: √(${adjustedSolution} ${displayShift}) = √${value * value} = ${value}.`],
  );
}

export function generate_m2_solve_multiple_radical_equation(difficulty: DifficultyLevel): GeneratedQuestion {
  const solution = int(1, 8);
  const u = int(3, 6);
  let v = int(2, 5);
  while (v === u) v = int(2, 5);
  const a = u * u - solution;
  const b = v * v - solution;
  const total = u + v;
  const term = (value: number) => value >= 0 ? `x + ${value}` : `x - ${Math.abs(value)}`;
  const substitutedTerm = (value: number) => value >= 0 ? `${solution} + ${value}` : `${solution} - ${Math.abs(value)}`;
  return q(
    difficulty, 'm2_solve_multiple_radical_equation', 'M2.RNS.4.3',
    `Solve √(${term(a)}) + √(${term(b)}) = ${total}. Check your solution.`, String(solution), 'integer',
    [
      `Test x = ${solution}: √(${substitutedTerm(a)}) + √(${substitutedTerm(b)}) = √${u * u} + √${v * v} = ${u} + ${v} = ${total}.`,
      `Thus x = ${solution} is a solution.`,
      'When solving by repeated squaring, every candidate must be checked in the original equation to reject extraneous solutions.',
    ],
  );
}

export const NCM2_BATCH1_GENERATORS: Record<string, (difficulty: DifficultyLevel) => GeneratedQuestion> = {
  m2_add_subtract_polynomials: generate_m2_add_subtract_polynomials,
  m2_multiply_polynomials: generate_m2_multiply_polynomials,
  m2_polynomial_long_division: generate_m2_polynomial_long_division,
  m2_synthetic_division: generate_m2_synthetic_division,
  m2_simplify_rational_expression: generate_m2_simplify_rational_expression,
  m2_multiply_rational_expressions: generate_m2_multiply_rational_expressions,
  m2_divide_rational_expressions: generate_m2_divide_rational_expressions,
  m2_lcm_polynomials: generate_m2_lcm_polynomials,
  m2_add_rational_like_denominators: generate_m2_add_rational_like_denominators,
  m2_add_rational_unlike_denominators: generate_m2_add_rational_unlike_denominators,
  m2_fraction_decimal_classify: generate_m2_fraction_decimal_classify,
  m2_rational_irrational_classify: generate_m2_rational_irrational_classify,
  m2_classify_real_numbers: generate_m2_classify_real_numbers,
  m2_rational_exponent_evaluate: generate_m2_rational_exponent_evaluate,
  m2_simplify_rational_exponents: generate_m2_simplify_rational_exponents,
  m2_simplify_radicals: generate_m2_simplify_radicals,
  m2_add_subtract_radicals: generate_m2_add_subtract_radicals,
  m2_multiply_radicals: generate_m2_multiply_radicals,
  m2_rationalize_monomial_denominator: generate_m2_rationalize_monomial_denominator,
  m2_rationalize_conjugate_denominator: generate_m2_rationalize_conjugate_denominator,
  m2_solve_rational_exponent_equation: generate_m2_solve_rational_exponent_equation,
  m2_solve_one_radical_equation: generate_m2_solve_one_radical_equation,
  m2_solve_multiple_radical_equation: generate_m2_solve_multiple_radical_equation,
};
