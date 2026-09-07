import fs from 'node:fs';
import path from 'node:path';

import {
  generate_g7_add_rational,
  generate_g7_ns_rational_word_problem,
  generate_g7_subtract_rational,
  type GeneratedQuestion,
} from '@/lib/competition/generators';

type Difficulty = 1 | 2 | 3 | 4;
type Rational = { numerator: number; denominator: number };
type ContextBranch = 'mean' | 'tax_and_split' | 'elevation' | 'debt_fraction';

const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4];
const PROCEDURAL_SAMPLES_PER_DIFFICULTY = 100;
const CONTEXTUAL_SAMPLES_PER_DIFFICULTY = 1000;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function withSeed(seed: number, task: () => void): void {
  const originalRandom = Math.random;
  Math.random = seededRandom(seed);
  try {
    task();
  } finally {
    Math.random = originalRandom;
  }
}

function parseRational(raw: string): Rational {
  const value = raw.trim().replace(/[()]/g, '');
  const [numeratorText, denominatorText] = value.split('/');
  const numerator = Number(numeratorText);
  const denominator = denominatorText ? Number(denominatorText) : 1;
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    throw new Error(`Invalid rational value: ${raw}`);
  }
  return { numerator, denominator };
}

function equalRationals(left: Rational, right: Rational): boolean {
  return left.numerator * right.denominator === right.numerator * left.denominator;
}

function requireMatch(text: string, expression: RegExp, label: string): RegExpMatchArray {
  const match = text.match(expression);
  if (!match) throw new Error(`${label}: unexpected prompt ${text}`);
  return match;
}

function verifyAddition(question: GeneratedQuestion): void {
  const match = requireMatch(question.question_text, /^Add:\s+(.+?) \+ (.+)$/, 'addition');
  const left = parseRational(match[1]!);
  const right = parseRational(match[2]!);
  const expected = {
    numerator: left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
  if (question.concept_id !== 'M7.NS.1.2' || question.generator_type !== 'g7_add_rational') {
    throw new Error(`addition: unexpected scope metadata ${question.concept_id}/${question.generator_type}`);
  }
  if (!equalRationals(parseRational(question.correct_answer), expected)) {
    throw new Error(`addition: wrong answer ${question.correct_answer} for ${question.question_text}`);
  }
}

function verifySubtraction(question: GeneratedQuestion): void {
  const match = requireMatch(question.question_text, /^Subtract:\s+(.+?) − (.+)$/, 'subtraction');
  const left = parseRational(match[1]!);
  const right = parseRational(match[2]!);
  const expected = {
    numerator: left.numerator * right.denominator - right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  };
  if (question.concept_id !== 'M7.NS.1.4' || question.generator_type !== 'g7_subtract_rational') {
    throw new Error(`subtraction: unexpected scope metadata ${question.concept_id}/${question.generator_type}`);
  }
  if (!equalRationals(parseRational(question.correct_answer), expected)) {
    throw new Error(`subtraction: wrong answer ${question.correct_answer} for ${question.question_text}`);
  }
}

function verifyContextual(question: GeneratedQuestion): ContextBranch {
  const text = question.question_text;
  if (question.concept_id !== 'M7.NS.4.1' || question.generator_type !== 'g7_ns_rational_word_problem') {
    throw new Error(`contextual: unexpected scope metadata ${question.concept_id}/${question.generator_type}`);
  }

  const temperature = /^The temperatures \(in °F\) recorded over 4 days were ([\d, -]+)\. What was the mean temperature\?$/.exec(text);
  if (temperature) {
    const values = temperature[1]!.split(', ').map(Number);
    const expected = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (Math.abs(Number(question.correct_answer) - expected) >= 0.000_001) {
      throw new Error(`contextual mean: wrong answer ${question.correct_answer} for ${text}`);
    }
    return 'mean';
  }

  const taxAndSplit = /^A meal costs \$(\d+)\. With (\d+)% tax, the total is split equally among (\d+) people\. How much does each person pay \(in dollars\)\?$/.exec(text);
  if (taxAndSplit) {
    const price = Number(taxAndSplit[1]);
    const taxPercent = Number(taxAndSplit[2]);
    const people = Number(taxAndSplit[3]);
    const total = Math.round(price * (1 + taxPercent / 100) * 100) / 100;
    const expected = Math.round((total / people) * 100) / 100;
    if (Math.abs(Number(question.correct_answer) - expected) >= 0.000_001) {
      throw new Error(`contextual tax and split: wrong answer ${question.correct_answer} for ${text}`);
    }
    return 'tax_and_split';
  }

  const elevation = /^A submarine is at (-?\d+) feet relative to sea level\. It rises (\d+) feet per minute for (\d+) minutes\. What is its new depth\?$/.exec(text);
  if (elevation) {
    const expected = Number(elevation[1]) + Number(elevation[2]) * Number(elevation[3]);
    if (Number(question.correct_answer) !== expected) {
      throw new Error(`contextual elevation: wrong answer ${question.correct_answer} for ${text}`);
    }
    return 'elevation';
  }

  const debtFraction = /^A business owes \$(\d+)\. It pays off (\d+)\/(\d+) of the debt\. How much does it still owe \(as a negative number\)\?$/.exec(text);
  if (debtFraction) {
    const debt = -Number(debtFraction[1]);
    const expected = debt - (debt * Number(debtFraction[2])) / Number(debtFraction[3]);
    if (Number(question.correct_answer) !== expected) {
      throw new Error(`contextual debt fraction: wrong answer ${question.correct_answer} for ${text}`);
    }
    return 'debt_fraction';
  }

  throw new Error(`contextual: unexpected prompt ${text}`);
}

const results: Record<string, number> = {};
const contextualBranches = new Set<ContextBranch>();

for (const difficulty of DIFFICULTIES) {
  let additionVerified = 0;
  withSeed(20260907 + difficulty * 10_000, () => {
    for (let sample = 0; sample < PROCEDURAL_SAMPLES_PER_DIFFICULTY; sample += 1) {
      verifyAddition(generate_g7_add_rational(difficulty));
      additionVerified += 1;
    }
  });
  results[`addition:difficulty-${difficulty}`] = additionVerified;

  let subtractionVerified = 0;
  withSeed(20270907 + difficulty * 10_000, () => {
    for (let sample = 0; sample < PROCEDURAL_SAMPLES_PER_DIFFICULTY; sample += 1) {
      verifySubtraction(generate_g7_subtract_rational(difficulty));
      subtractionVerified += 1;
    }
  });
  results[`subtraction:difficulty-${difficulty}`] = subtractionVerified;

  let contextualVerified = 0;
  withSeed(20280907 + difficulty * 10_000, () => {
    for (let sample = 0; sample < CONTEXTUAL_SAMPLES_PER_DIFFICULTY; sample += 1) {
      contextualBranches.add(verifyContextual(generate_g7_ns_rational_word_problem(difficulty)));
      contextualVerified += 1;
    }
  });
  results[`contextual-application:difficulty-${difficulty}`] = contextualVerified;
}

const output = {
  auditTitle: 'Grade 7 Rational Addition, Subtraction, and Contextual Application — Mathematical Invariants',
  status: 'Source-level evidence only; qualified educator review and production acceptance remain required.',
  methodology: 'Each result is independently recomputed from values visible in the generated prompt. Randomness is replaced by recorded deterministic seeds for reproducibility.',
  scope: {
    primaryAuditScope: ['M7.NS.1.1', 'M7.NS.1.2', 'M7.NS.1.3', 'M7.NS.1.4'],
    remediatedAdjacentApplicationScope: 'M7.NS.4.1',
  },
  totalVerified: Object.values(results).reduce((sum, count) => sum + count, 0),
  results,
  contextualBranchesObserved: [...contextualBranches].sort(),
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/g7-rational-add-sub-mathematical-invariants.json');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(output, null, 2));
