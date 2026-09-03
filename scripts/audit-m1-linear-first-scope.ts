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

function verifyOneStepAdd(question: GeneratedQuestion): void {
  const match = question.question_text.match(/^Solve for x: x ([+-]) (\d+) = (-?\d+)$/);
  if (!match) throw new Error(`Unexpected one-step add prompt: ${question.question_text}`);
  const [, sign, absB, cText] = match;
  const b = sign === '+' ? Number(absB) : -Number(absB);
  const x = parseInteger(question.correct_answer, 'correct_answer');
  if (x + b !== Number(cText)) throw new Error(`Invalid one-step add answer: ${question.question_text}; answer=${x}`);
}

function verifyOneStepMult(question: GeneratedQuestion): void {
  const match = question.question_text.match(/^Solve for x: (-?\d+)x = (-?\d+)$/);
  if (!match) throw new Error(`Unexpected one-step mult prompt: ${question.question_text}`);
  const [, aText, cText] = match;
  const a = Number(aText);
  const x = parseInteger(question.correct_answer, 'correct_answer');
  if (a === 0 || a * x !== Number(cText)) throw new Error(`Invalid one-step mult answer: ${question.question_text}; answer=${x}`);
}

function verifyTwoStep(question: GeneratedQuestion): void {
  const match = question.question_text.match(/^Solve for x: (-?\d+)x ([+-]) (\d+) = (-?\d+)$/);
  if (!match) throw new Error(`Unexpected two-step prompt: ${question.question_text}`);
  const [, aText, sign, absB, cText] = match;
  const a = Number(aText);
  const b = sign === '+' ? Number(absB) : -Number(absB);
  const x = parseInteger(question.correct_answer, 'correct_answer');
  if (a === 0 || a * x + b !== Number(cText)) throw new Error(`Invalid two-step answer: ${question.question_text}; answer=${x}`);
}

function verifyMultiStep(question: GeneratedQuestion): void {
  const match = question.question_text.match(/^Solve for x: (\d+)\(x ([+-]) (\d+)\) ([+-]) (\d+) = (-?\d+)$/);
  if (!match) throw new Error(`Unexpected multi-step prompt: ${question.question_text}`);
  const [, aText, innerSign, absB, outerSign, absC, resultText] = match;
  const a = Number(aText);
  const b = innerSign === '+' ? Number(absB) : -Number(absB);
  const c = outerSign === '+' ? Number(absC) : -Number(absC);
  const x = parseInteger(question.correct_answer, 'correct_answer');
  if (a * (x + b) + c !== Number(resultText)) {
    throw new Error(`Invalid multi-step answer: ${question.question_text}; answer=${x}`);
  }
}

function verifyQuestion(question: GeneratedQuestion): void {
  if (question.answer_type !== 'integer') throw new Error(`Unexpected answer type: ${question.answer_type}`);
  if (!Array.isArray(question.solution_steps) || question.solution_steps.length < 2) {
    throw new Error(`Missing solution steps for ${question.generator_type}`);
  }
  switch (question.generator_type) {
    case 'linear_eq_one_step_add': return verifyOneStepAdd(question);
    case 'linear_eq_one_step_mult': return verifyOneStepMult(question);
    case 'linear_eq_two_step': return verifyTwoStep(question);
    case 'linear_eq_multi_step': return verifyMultiStep(question);
    default: throw new Error(`Unexpected generator type: ${question.generator_type}`);
  }
}

const SAMPLES_PER_DIFFICULTY = 5;
const STRESS_PER_DIFFICULTY = 1000;
const difficulties: DifficultyLevel[] = [1, 2, 3, 4];
const samples: Array<Record<string, unknown>> = [];
const summary: Array<Record<string, unknown>> = [];

for (const [generatorIndex, generator] of generators.entries()) {
  for (const difficulty of difficulties) {
    const prompts = new Set<string>();
    for (let sampleIndex = 0; sampleIndex < SAMPLES_PER_DIFFICULTY; sampleIndex++) {
      const question = withSeed(810000 + generatorIndex * 10000 + difficulty * 100 + sampleIndex, () => generator.generate(difficulty));
      verifyQuestion(question);
      prompts.add(question.question_text);
      samples.push({
        standard_code: generator.standardCode,
        announced_skill: generator.announcedSkill,
        generator_type: generator.generatorType,
        difficulty,
        sample_index: sampleIndex + 1,
        question_text: question.question_text,
        question_latex: question.question_latex,
        correct_answer: question.correct_answer,
        answer_type: question.answer_type,
        solution_steps: question.solution_steps,
      });
    }

    for (let run = 0; run < STRESS_PER_DIFFICULTY; run++) {
      const question = withSeed(910000 + generatorIndex * 100000 + difficulty * 10000 + run, () => generator.generate(difficulty));
      verifyQuestion(question);
    }

    summary.push({
      standard_code: generator.standardCode,
      generator_type: generator.generatorType,
      difficulty,
      retained_samples: SAMPLES_PER_DIFFICULTY,
      unique_retained_prompts: prompts.size,
      invariant_stress_runs: STRESS_PER_DIFFICULTY,
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
    total_invariant_runs: generators.length * difficulties.length * STRESS_PER_DIFFICULTY,
    independent_checks: [
      'Parse visible equation coefficients and constants from question_text.',
      'Recompute the equation using correct_answer rather than trusting solution_steps.',
      'Require integer answer types and non-empty solution-step arrays.',
      'Record prompt variation across retained samples.',
    ],
  },
  summary,
  samples,
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/m1-linear-first-scope-samples.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, groups: summary.length, totalInvariantRuns: evidence.methodology.total_invariant_runs }, null, 2));
