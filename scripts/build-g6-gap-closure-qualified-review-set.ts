import fs from 'node:fs';
import path from 'node:path';
import {
  generate_g6_ee_write_dependent_equation,
  generate_g6_geo_area_composite_6,
  generate_g6_geo_area_real_world_6,
  generate_g6_geo_surface_area_prism_6,
  generate_g6_geo_surface_area_pyramid_net_6,
  generate_g6_geo_volume_word_6,
  generate_g6_ns_identify_coordinate_plane_point_6,
  type GeneratedQuestion,
} from '@/lib/competition/generators';
import { generateDistinctQuestion } from '@/lib/competition/question-uniqueness';

type Difficulty = 1 | 2 | 3 | 4;
type Generator = (difficulty: Difficulty) => GeneratedQuestion;

interface GeneratorReviewEntry {
  lessonNumber: string;
  generatorType: string;
  internalScopeDescription: string;
  representationReviewRequired: boolean;
  generate: Generator;
}

const generators: GeneratorReviewEntry[] = [
  {
    lessonNumber: 'M6.EE.5.2',
    generatorType: 'g6_ee_write_dependent_equation',
    internalScopeDescription: 'Write an equation relating a constant rate and a dependent quantity.',
    representationReviewRequired: false,
    generate: generate_g6_ee_write_dependent_equation,
  },
  {
    lessonNumber: 'M6.GEO.1.4',
    generatorType: 'g6_geo_area_composite_6',
    internalScopeDescription: 'Find composite area by decomposing rectangles and triangles.',
    representationReviewRequired: true,
    generate: generate_g6_geo_area_composite_6,
  },
  {
    lessonNumber: 'M6.GEO.2.2',
    generatorType: 'g6_geo_surface_area_prism_6',
    internalScopeDescription: 'Compute rectangular- or triangular-prism surface area from stated dimensions.',
    representationReviewRequired: true,
    generate: generate_g6_geo_surface_area_prism_6,
  },
  {
    lessonNumber: 'M6.GEO.2.3',
    generatorType: 'g6_geo_surface_area_pyramid_net_6',
    internalScopeDescription: 'Compute pyramid surface area from an explicitly stated net structure.',
    representationReviewRequired: true,
    generate: generate_g6_geo_surface_area_pyramid_net_6,
  },
  {
    lessonNumber: 'M6.GEO.4.1',
    generatorType: 'g6_geo_area_real_world_6',
    internalScopeDescription: 'Solve a real-world area application.',
    representationReviewRequired: false,
    generate: generate_g6_geo_area_real_world_6,
  },
  {
    lessonNumber: 'M6.GEO.4.3',
    generatorType: 'g6_geo_volume_word_6',
    internalScopeDescription: 'Solve a real-world rectangular-prism volume application.',
    representationReviewRequired: false,
    generate: generate_g6_geo_volume_word_6,
  },
  {
    lessonNumber: 'M6.NS.4.6',
    generatorType: 'g6_ns_identify_coordinate_plane_point_6',
    internalScopeDescription: 'Identify an ordered pair, quadrant, or axis from stated coordinate information.',
    representationReviewRequired: true,
    generate: generate_g6_ns_identify_coordinate_plane_point_6,
  },
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

function generateRetainedSamples(
  generator: Generator,
  difficulty: Difficulty,
  generatorIndex: number,
): Array<Record<string, unknown>> {
  const originalRandom = Math.random;
  const samples: Array<Record<string, unknown>> = [];
  const usedSignatures = new Set<string>();
  try {
    for (let index = 0; index < 3; index += 1) {
      Math.random = seededRandom(20260907 + generatorIndex * 100_000 + difficulty * 10_000 + index * 1009);
      const question = generateDistinctQuestion(generator, difficulty, usedSignatures, 'g6-gap-closure-review');
      samples.push({
        sample: index + 1,
        questionText: question.question_text,
        questionLatex: question.question_latex ?? null,
        correctAnswer: question.correct_answer,
        answerType: question.answer_type,
        solutionSteps: question.solution_steps,
        reviewerCalculation: '',
        reviewerRepresentationDecision: 'pending',
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
  auditTitle: 'Grade 6 Coverage-Gap Closure — Qualified Mathematical Review Set',
  status: 'Pending qualified Grade 6 educator sign-off; staged generator mappings remain inactive.',
  generatedAtUtc: new Date().toISOString(),
  noAiStatement: 'Every prompt, answer, solution step, and audit result in this set is produced by versioned deterministic code. AI was not used to create or classify student content.',
  reviewerInstruction: 'Independently recompute every answer from the visible prompt. Mark reject for any mathematical error, ambiguity, invalid unit, implausible context, answer/prompt mismatch, or inappropriate representation. For every concept flagged for representation review, explicitly decide whether the textual structured representation adequately assesses the named concept before any activation decision.',
  scope: {
    course: 'NC Grade 6 Math',
    sourceGapClosures: 7,
    samplesPerGeneratorPerDifficulty: 3,
    expectedTotalSamples: 84,
  },
  generators: generators.map((entry, generatorIndex) => ({
    lessonNumber: entry.lessonNumber,
    generatorType: entry.generatorType,
    internalScopeDescription: entry.internalScopeDescription,
    representationReviewRequired: entry.representationReviewRequired,
    difficulties: ([1, 2, 3, 4] as Difficulty[]).map((difficulty) => ({
      difficulty,
      samples: generateRetainedSamples(entry.generate, difficulty, generatorIndex),
    })),
  })),
};

const outputPath = path.resolve('docs/PILOT_CONTENT_AUDIT_EVIDENCE/g6-gap-closure-qualified-mathematical-review-set.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(reviewSet, null, 2)}\n`, 'utf8');
console.log(outputPath);
