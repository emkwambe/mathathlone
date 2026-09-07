import fs from 'node:fs';
import path from 'node:path';

import {
  generate_g7_add_rational,
  generate_g7_subtract_rational,
  type GeneratedQuestion,
} from '@/lib/competition/generators';
import { generateDistinctQuestion } from '@/lib/competition/question-uniqueness';

type Difficulty = 1 | 2 | 3 | 4;
type Generator = (difficulty: Difficulty) => GeneratedQuestion;

const proceduralGenerators: Array<{
  lessonNumber: 'M7.NS.1.2' | 'M7.NS.1.4';
  generatorType: string;
  reviewFocus: string;
  generate: Generator;
}> = [
  {
    lessonNumber: 'M7.NS.1.2',
    generatorType: 'g7_add_rational',
    reviewFocus: 'Signed rational-number addition, common-denominator reasoning, prompt/answer consistency, and difficulty suitability.',
    generate: generate_g7_add_rational,
  },
  {
    lessonNumber: 'M7.NS.1.4',
    generatorType: 'g7_subtract_rational',
    reviewFocus: 'Signed rational-number subtraction, additive-inverse notation, prompt/answer consistency, and difficulty suitability.',
    generate: generate_g7_subtract_rational,
  },
];

const staticItems = [
  {
    lessonNumber: 'M7.NS.1.1',
    difficulty: 1,
    questionText: 'On a number line, adding a negative number to a positive number always results in a movement to the ___ from the starting position.',
    options: ['A. right', 'B. left', 'C. origin', 'D. same position'],
    correctAnswer: 'B',
    explanation: 'Adding a negative number moves left on the number line (toward lesser values).',
  },
  {
    lessonNumber: 'M7.NS.1.1',
    difficulty: 1,
    questionText: 'Which expression is best modeled by starting at -3 on a number line and moving 5 units to the right?',
    options: ['A. -3 - 5', 'B. -3 + (-5)', 'C. -3 + 5', 'D. 3 + 5'],
    correctAnswer: 'C',
    explanation: 'Moving right on a number line means adding a positive number.',
  },
  {
    lessonNumber: 'M7.NS.1.1',
    difficulty: 2,
    questionText: 'Which statement about p + q is ALWAYS true when p > 0 and q < 0?',
    options: ['A. p + q > 0', 'B. p + q < 0', 'C. p + q = 0', 'D. The sign of p + q depends on the absolute values of p and q'],
    correctAnswer: 'D',
    explanation: 'The sign depends on which value has the larger absolute value.',
  },
  {
    lessonNumber: 'M7.NS.1.3',
    difficulty: 1,
    questionText: 'Which expression is equivalent to p - q?',
    options: ['A. p + q', 'B. p + (-q)', 'C. -p + q', 'D. -p - q'],
    correctAnswer: 'B',
    explanation: 'Subtraction is defined as adding the additive inverse: p - q = p + (-q).',
  },
  {
    lessonNumber: 'M7.NS.1.3',
    difficulty: 2,
    questionText: 'A diver is at -12 feet. She ascends to -5 feet. Which expression represents the change in her depth?',
    options: ['A. -12 - (-5)', 'B. -5 - (-12)', 'C. -5 + (-12)', 'D. -12 + 5'],
    correctAnswer: 'B',
    explanation: 'Change = final - initial = -5 - (-12) = -5 + 12 = 7 feet upward.',
  },
] as const;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function retainedSamples(
  generator: Generator,
  difficulty: Difficulty,
  generatorIndex: number,
): Array<Record<string, unknown>> {
  const originalRandom = Math.random;
  const samples: Array<Record<string, unknown>> = [];
  const usedSignatures = new Set<string>();

  try {
    for (let index = 0; index < 5; index += 1) {
      Math.random = seededRandom(20260907 + generatorIndex * 100_000 + difficulty * 10_000 + index * 1_009);
      const question = generateDistinctQuestion(generator, difficulty, usedSignatures, 'g7-qualified-audit-sample');
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
  auditTitle: 'Grade 7 Rational Addition and Subtraction — Qualified Mathematical Review Set',
  status: 'Pending qualified Grade 7 teacher/curriculum reviewer sign-off',
  sourceBoundary: 'M7.NS.1.1 through M7.NS.1.4 only. The contextual M7.NS.4.1 generator is excluded from this review set.',
  reviewerInstruction: 'Independently recompute or reason from each visible prompt. Do not rely on the supplied answer or explanation. Mark reject for any wrong answer, ambiguity, incorrect distractor, inappropriate wording, representation defect, or mismatch with the stated Grade 7 concept.',
  scope: {
    course: 'NC Grade 7 Math',
    topic: 'The Number System',
    staticItems: staticItems.length,
    samplesPerGeneratorPerDifficulty: 5,
    proceduralSamples: proceduralGenerators.length * 4 * 5,
    expectedTotalItems: staticItems.length + proceduralGenerators.length * 4 * 5,
  },
  staticItems: staticItems.map((item, index) => ({
    item: index + 1,
    ...item,
    reviewerCalculation: '',
    reviewerInitials: '',
    reviewerDate: '',
    reviewerDecision: 'pending',
  })),
  proceduralGenerators: proceduralGenerators.map((entry, generatorIndex) => ({
    lessonNumber: entry.lessonNumber,
    generatorType: entry.generatorType,
    reviewFocus: entry.reviewFocus,
    difficulties: ([1, 2, 3, 4] as Difficulty[]).map((difficulty) => ({
      difficulty,
      samples: retainedSamples(entry.generate, difficulty, generatorIndex),
    })),
  })),
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/g7-rational-add-sub-qualified-review-set.json');
fs.writeFileSync(outputPath, `${JSON.stringify(reviewSet, null, 2)}\n`, 'utf8');
console.log(outputPath);
