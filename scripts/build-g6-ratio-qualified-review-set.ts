import fs from 'node:fs';
import path from 'node:path';
import {
  generate_g6_rp_calculate_unit_rate,
  generate_g6_rp_ratio_table_solve,
  generate_g6_rp_ratio_word_problem,
  type GeneratedQuestion,
} from '@/lib/competition/generators';
import { generateDistinctQuestion } from '@/lib/competition/question-uniqueness';

type Difficulty = 1 | 2 | 3 | 4;
type Generator = (difficulty: Difficulty) => GeneratedQuestion;

const generators: Array<{ generatorType: string; announcedSkill: string; generate: Generator }> = [
  { generatorType: 'g6_rp_calculate_unit_rate', announcedSkill: 'Calculate a unit rate', generate: generate_g6_rp_calculate_unit_rate },
  { generatorType: 'g6_rp_ratio_table_solve', announcedSkill: 'Solve a missing value in a ratio table', generate: generate_g6_rp_ratio_table_solve },
  { generatorType: 'g6_rp_ratio_word_problem', announcedSkill: 'Solve a ratio word problem', generate: generate_g6_rp_ratio_word_problem },
];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRetainedSamples(generator: Generator, difficulty: Difficulty, generatorIndex: number): Array<Record<string, unknown>> {
  const originalRandom = Math.random;
  const samples: Array<Record<string, unknown>> = [];
  const usedSignatures = new Set<string>();
  try {
    for (let index = 0; index < 5; index += 1) {
      Math.random = seededRandom(20260902 + generatorIndex * 100000 + difficulty * 10000 + index * 1009);
      const question = generateDistinctQuestion(generator, difficulty, usedSignatures, 'retained-audit-sample');
      samples.push({
        sample: index + 1,
        questionText: question.question_text,
        questionLatex: question.question_latex ?? null,
        correctAnswer: question.correct_answer,
        answerType: question.answer_type,
        solutionSteps: question.solution_steps,
        reviewerCalculation: '',
        reviewerInitials: '',
        reviewerDate: '',
        reviewerDecision: 'pending',
      });
    }
  } finally {
    Math.random = originalRandom;
  }
  return samples;
}

const reviewSet = {
  auditTitle: 'Grade 6 Ratios and Proportional Relationships — Qualified Mathematical Review Set',
  status: 'Pending qualified teacher/curriculum reviewer sign-off',
  generatedAtUtc: new Date().toISOString(),
  reviewerInstruction: 'Independently recompute each answer from the visible prompt. Do not rely on the supplied answer or solution. Mark reject for any error, ambiguity, implausible context, invalid representation, or mismatch.',
  scope: {
    course: 'NC Grade 6 Math',
    topic: 'Ratios and Proportional Relationships',
    samplesPerGeneratorPerDifficulty: 5,
    expectedTotalSamples: 60,
  },
  generators: generators.map((entry, generatorIndex) => ({
    announcedSkill: entry.announcedSkill,
    generatorType: entry.generatorType,
    difficulties: ([1, 2, 3, 4] as Difficulty[]).map((difficulty) => ({
      difficulty,
      samples: generateRetainedSamples(entry.generate, difficulty, generatorIndex),
    })),
  })),
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-ratio-qualified-mathematical-review-set.json');
fs.writeFileSync(outputPath, `${JSON.stringify(reviewSet, null, 2)}\n`, 'utf8');
console.log(outputPath);
