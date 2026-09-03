import fs from 'node:fs';
import path from 'node:path';
import {
  generate_linear_eq_one_step_add,
  generate_linear_eq_one_step_mult,
  generate_linear_eq_two_step,
  generate_linear_eq_multi_step,
  type DifficultyLevel,
  type GeneratedQuestion,
} from '../src/lib/competition/generators';
import { generateDistinctQuestion, questionSignature } from '../src/lib/competition/question-uniqueness';

type GeneratorCase = {
  standardCode: string;
  announcedSkill: string;
  generatorType: string;
  generate: (difficulty: DifficultyLevel) => GeneratedQuestion;
};

const generators: GeneratorCase[] = [
  {
    standardCode: 'M1.EQN.2.2',
    announcedSkill: 'Solve one-step addition/subtraction equations',
    generatorType: 'linear_eq_one_step_add',
    generate: generate_linear_eq_one_step_add,
  },
  {
    standardCode: 'M1.EQN.2.3',
    announcedSkill: 'Solve one-step multiplication/division equations',
    generatorType: 'linear_eq_one_step_mult',
    generate: generate_linear_eq_one_step_mult,
  },
  {
    standardCode: 'M1.EQN.2.4',
    announcedSkill: 'Solve two-step linear equations',
    generatorType: 'linear_eq_two_step',
    generate: generate_linear_eq_two_step,
  },
  {
    standardCode: 'M1.EQN.2.5',
    announcedSkill: 'Solve multi-step linear equations',
    generatorType: 'linear_eq_multi_step',
    generate: generate_linear_eq_multi_step,
  },
];

const SAMPLES_PER_DIFFICULTY = 5;
const STRESS_PER_DIFFICULTY = 1000;
const SESSION_UNIQUENESS_COUNT = 12;
const difficulties: DifficultyLevel[] = [1, 2, 3, 4];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function parseInteger(value: string, field: string): number {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer; received ${JSON.stringify(value)}`);
  }
  return parsed;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function verifyOneStepAdd(question: GeneratedQuestion): void {
  const prompt = question.question_text;
  const x = parseInteger(question.correct_answer, 'correct_answer');

  const negativeSubtraction = prompt.match(/^Solve for x: x - \(-([1-9]\d*)\) = (-?\d+)$/);
  if (negativeSubtraction) {
    const [, magnitudeText, cText] = negativeSubtraction;
    const magnitude = Number(magnitudeText);
    assert(x + magnitude === Number(cText), `Invalid x - (-n) answer: ${prompt}; answer=${x}`);
    assert(question.difficulty === 4, `Only difficulty 4 may use subtraction of a negative: ${prompt}`);
    return;
  }

  const standard = prompt.match(/^Solve for x: x ([+-]) ([1-9]\d*) = (-?\d+)$/);
  if (!standard) throw new Error(`Unexpected one-step add prompt: ${prompt}`);
  const [, sign, absBText, cText] = standard;
  const b = sign === '+' ? Number(absBText) : -Number(absBText);
  assert(x + b === Number(cText), `Invalid one-step add answer: ${prompt}; answer=${x}`);

  if (question.difficulty === 1) assert(sign === '+' && x > 0 && b > 0, `Difficulty 1 must use positive addition: ${prompt}`);
  if (question.difficulty === 2) assert(sign === '-' && x > 0 && b < 0, `Difficulty 2 must use positive-number subtraction: ${prompt}`);
  if (question.difficulty === 3) assert(sign === '+' && x < 0 && b > 0, `Difficulty 3 must use a negative solution with positive addition: ${prompt}`);
}

function verifyOneStepMult(question: GeneratedQuestion): 'multiplication' | 'division' {
  const prompt = question.question_text;
  const answer = parseInteger(question.correct_answer, 'correct_answer');

  const division = prompt.match(/^Solve for x: x ÷ (?:\((-?\d+)\)|(\d+)) = (-?\d+)$/);
  if (division) {
    const divisor = Number(division[1] ?? division[2]);
    const quotient = Number(division[3]);
    assert(divisor !== 0, `Division by zero in ${prompt}`);
    assert(answer / divisor === quotient, `Invalid division-form answer: ${prompt}; answer=${answer}`);
    assert(question.question_latex.includes('\\frac{x}{'), `Division-form LaTeX must use a fraction: ${question.question_latex}`);
    return 'division';
  }

  const multiplication = prompt.match(/^Solve for x: (-?\d+)x = (-?\d+)$/);
  if (!multiplication) throw new Error(`Unexpected one-step mult/div prompt: ${prompt}`);
  const a = Number(multiplication[1]);
  const c = Number(multiplication[2]);
  assert(a !== 0 && Math.abs(a) !== 1, `Coefficient must be nonzero and nonunit: ${prompt}`);
  assert(a * answer === c, `Invalid multiplication-form answer: ${prompt}; answer=${answer}`);
  return 'multiplication';
}

function verifyTwoStep(question: GeneratedQuestion): void {
  const match = question.question_text.match(/^Solve for x: (-?\d+)x ([+-]) (\d+) = (-?\d+)$/);
  if (!match) throw new Error(`Unexpected two-step prompt: ${question.question_text}`);
  const [, aText, sign, absBText, cText] = match;
  const a = Number(aText);
  const b = sign === '+' ? Number(absBText) : -Number(absBText);
  const x = parseInteger(question.correct_answer, 'correct_answer');
  assert(a !== 0 && a * x + b === Number(cText), `Invalid two-step answer: ${question.question_text}; answer=${x}`);
}

function verifyMultiStep(question: GeneratedQuestion): void {
  const prompt = question.question_text;
  const x = parseInteger(question.correct_answer, 'correct_answer');

  const twoXTerms = prompt.match(/^Solve for x: (-?\d+)\(x ([+-]) (\d+)\) ([+-]) (?:(\d+)x|x) ([+-]) (\d+) = (-?\d+)$/);
  if (twoXTerms) {
    const [, aText, innerSign, absBText, dSign, absDText, cSign, absCText, resultText] = twoXTerms;
    const a = Number(aText);
    const b = innerSign === '+' ? Number(absBText) : -Number(absBText);
    const dMagnitude = absDText ? Number(absDText) : 1;
    const d = dSign === '+' ? dMagnitude : -dMagnitude;
    const c = cSign === '+' ? Number(absCText) : -Number(absCText);
    assert(question.difficulty === 4, `Only difficulty 4 may combine a second x-term: ${prompt}`);
    assert(a !== 0 && b !== 0 && c !== 0 && d !== 0 && a + d !== 0, `Invalid level-4 multi-step coefficients: ${prompt}`);
    assert(a * (x + b) + d * x + c === Number(resultText), `Invalid level-4 multi-step answer: ${prompt}; answer=${x}`);
    return;
  }

  const standard = prompt.match(/^Solve for x: (-?\d+)\(x ([+-]) (\d+)\) ([+-]) (\d+) = (-?\d+)$/);
  if (!standard) throw new Error(`Unexpected multi-step prompt: ${prompt}`);
  const [, aText, innerSign, absBText, outerSign, absCText, resultText] = standard;
  const a = Number(aText);
  const b = innerSign === '+' ? Number(absBText) : -Number(absBText);
  const c = outerSign === '+' ? Number(absCText) : -Number(absCText);
  assert(a !== 0 && b !== 0 && c !== 0, `Multi-step terms must be nonzero: ${prompt}`);
  assert(a * (x + b) + c === Number(resultText), `Invalid multi-step answer: ${prompt}; answer=${x}`);
  if (question.difficulty >= 3) assert(Math.abs(a) >= 2, `Higher multi-step levels require a nonunit coefficient: ${prompt}`);
  if (question.difficulty === 3) assert(a < 0, `Difficulty 3 must use a negative distributive coefficient: ${prompt}`);
}

function verifyQuestion(question: GeneratedQuestion): 'multiplication' | 'division' | null {
  assert(question.answer_type === 'integer', `Unexpected answer type: ${question.answer_type}`);
  assert(Array.isArray(question.solution_steps) && question.solution_steps.length >= 2, `Missing solution steps for ${question.generator_type}`);
  switch (question.generator_type) {
    case 'linear_eq_one_step_add': verifyOneStepAdd(question); return null;
    case 'linear_eq_one_step_mult': return verifyOneStepMult(question);
    case 'linear_eq_two_step': verifyTwoStep(question); return null;
    case 'linear_eq_multi_step': verifyMultiStep(question); return null;
    default: throw new Error(`Unexpected generator type: ${question.generator_type}`);
  }
}

const samples: Array<Record<string, unknown>> = [];
const summary: Array<Record<string, unknown>> = [];

for (const [generatorIndex, generator] of generators.entries()) {
  for (const difficulty of difficulties) {
    const retainedPrompts = new Set<string>();
    const retainedForms = new Set<'multiplication' | 'division'>();
    let seedOffset = 0;
    while (retainedPrompts.size < SAMPLES_PER_DIFFICULTY && seedOffset < 200) {
      const question = withSeed(810000 + generatorIndex * 10000 + difficulty * 1000 + seedOffset, () => generator.generate(difficulty));
      const form = verifyQuestion(question);
      const signature = questionSignature(question);
      seedOffset += 1;
      if (retainedPrompts.has(signature)) continue;

      if (generator.generatorType === 'linear_eq_one_step_mult') {
        assert(form === 'multiplication' || form === 'division', `Expected a multiplication or division form: ${question.question_text}`);
        const missingFormCount = 2 - retainedForms.size;
        const remainingSlots = SAMPLES_PER_DIFFICULTY - retainedPrompts.size;
        if (missingFormCount === remainingSlots && retainedForms.has(form)) continue;
      }

      retainedPrompts.add(signature);
      if (form === 'multiplication' || form === 'division') retainedForms.add(form);
      samples.push({
        standard_code: generator.standardCode,
        announced_skill: generator.announcedSkill,
        generator_type: generator.generatorType,
        difficulty,
        sample_index: retainedPrompts.size,
        question_text: question.question_text,
        question_latex: question.question_latex,
        correct_answer: question.correct_answer,
        answer_type: question.answer_type,
        solution_steps: question.solution_steps,
      });
    }
    assert(retainedPrompts.size === SAMPLES_PER_DIFFICULTY, `Could not retain ${SAMPLES_PER_DIFFICULTY} unique samples for ${generator.generatorType} difficulty ${difficulty}`);
    if (generator.generatorType === 'linear_eq_one_step_mult') {
      assert(retainedForms.has('multiplication') && retainedForms.has('division'), `Retained review set must include both forms at difficulty ${difficulty}`);
    }

    let multiplicationForms = 0;
    let divisionForms = 0;
    for (let run = 0; run < STRESS_PER_DIFFICULTY; run += 1) {
      const question = withSeed(910000 + generatorIndex * 100000 + difficulty * 10000 + run, () => generator.generate(difficulty));
      const form = verifyQuestion(question);
      if (form === 'multiplication') multiplicationForms += 1;
      if (form === 'division') divisionForms += 1;
    }
    if (generator.generatorType === 'linear_eq_one_step_mult') {
      assert(multiplicationForms > 0 && divisionForms > 0, `Both multiplication and division forms are required at difficulty ${difficulty}`);
    }

    const usedSignatures = new Set<string>();
    withSeed(980000 + generatorIndex * 10000 + difficulty * 100, () => {
      for (let item = 0; item < SESSION_UNIQUENESS_COUNT; item += 1) {
        const question = generateDistinctQuestion(generator.generate, difficulty, usedSignatures, generator.generatorType);
        verifyQuestion(question);
      }
    });
    assert(usedSignatures.size === SESSION_UNIQUENESS_COUNT, `Session uniqueness failed for ${generator.generatorType} difficulty ${difficulty}`);

    summary.push({
      standard_code: generator.standardCode,
      generator_type: generator.generatorType,
      difficulty,
      retained_samples: SAMPLES_PER_DIFFICULTY,
      unique_retained_prompts: retainedPrompts.size,
      invariant_stress_runs: STRESS_PER_DIFFICULTY,
      same_session_unique_prompts: usedSignatures.size,
      retained_multiplication_form: generator.generatorType === 'linear_eq_one_step_mult' ? retainedForms.has('multiplication') : null,
      retained_division_form: generator.generatorType === 'linear_eq_one_step_mult' ? retainedForms.has('division') : null,
      multiplication_forms: generator.generatorType === 'linear_eq_one_step_mult' ? multiplicationForms : null,
      division_forms: generator.generatorType === 'linear_eq_one_step_mult' ? divisionForms : null,
      invariant_result: 'pass',
    });
  }
}

const evidence = {
  audit_scope: 'NC Math 1 — Equations & Inequalities — Linear Equations Progression',
  generated_at: new Date().toISOString(),
  methodology: {
    retained_samples_per_generator_difficulty: SAMPLES_PER_DIFFICULTY,
    invariant_stress_runs_per_generator_difficulty: STRESS_PER_DIFFICULTY,
    same_session_unique_prompt_check: SESSION_UNIQUENESS_COUNT,
    total_invariant_runs: generators.length * difficulties.length * STRESS_PER_DIFFICULTY,
    independent_checks: [
      'Parse visible equation coefficients and constants from question_text.',
      'Recompute each equation using correct_answer rather than trusting solution_steps.',
      'Require integer answer types, nonempty solution steps, nonzero required terms, and valid level-4 combined coefficients.',
      'Require both multiplication and division forms for the announced multiplication/division skill at every level.',
      'Require five retained unique prompts and twelve same-session unique prompts for every generator/difficulty pair.',
    ],
  },
  summary,
  samples,
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/m1-linear-first-scope-samples.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, groups: summary.length, totalInvariantRuns: evidence.methodology.total_invariant_runs }, null, 2));
