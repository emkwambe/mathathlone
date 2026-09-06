// =============================================================================
// MathAthlone — Printable worksheet configuration
// =============================================================================
// This module is deliberately framework-free so the client-side builder, the
// server-side generation API, and the printable assembler share one truthful
// question-count contract. Teachers choose a bounded number of questions;
// the client never promises a count that the document assembler cannot deliver.
// =============================================================================

export type AssessmentType = 'review' | 'quiz' | 'homework' | 'test' | 'makeup';

export interface AssessmentFormatConfig {
  label: string;
  defaultQuestionCount: number;
  minQuestionCount: number;
  maxQuestionCount: number;
  freeResponseRatio: number;
  multipleChoicePoints: number;
  freeResponsePoints: number;
  workspaceLines: number;
}

/**
 * Question-count bounds are sized for US Letter printing with the document
 * renderer's existing workspace rules. They are guidance, not a promise of a
 * precise page count: unusually long generated prompts can still use more
 * vertical space than short prompts.
 */
export const ASSESSMENT_FORMAT_CONFIGS: Record<AssessmentType, AssessmentFormatConfig> = {
  review: {
    label: 'Practice Review',
    defaultQuestionCount: 10,
    minQuestionCount: 5,
    maxQuestionCount: 16,
    freeResponseRatio: 0.4,
    multipleChoicePoints: 2,
    freeResponsePoints: 4,
    workspaceLines: 3,
  },
  quiz: {
    label: 'Quiz',
    defaultQuestionCount: 12,
    minQuestionCount: 6,
    maxQuestionCount: 16,
    freeResponseRatio: 0.417,
    multipleChoicePoints: 3,
    freeResponsePoints: 5,
    workspaceLines: 4,
  },
  homework: {
    label: 'Homework',
    defaultQuestionCount: 8,
    minQuestionCount: 5,
    maxQuestionCount: 14,
    freeResponseRatio: 0.625,
    multipleChoicePoints: 2,
    freeResponsePoints: 4,
    workspaceLines: 4,
  },
  test: {
    label: 'Unit Test',
    defaultQuestionCount: 16,
    minQuestionCount: 10,
    maxQuestionCount: 20,
    freeResponseRatio: 0.5,
    multipleChoicePoints: 3,
    freeResponsePoints: 5,
    workspaceLines: 5,
  },
  makeup: {
    label: 'Makeup Test',
    defaultQuestionCount: 16,
    minQuestionCount: 10,
    maxQuestionCount: 20,
    freeResponseRatio: 0.5,
    multipleChoicePoints: 3,
    freeResponsePoints: 5,
    workspaceLines: 5,
  },
};

export interface AssessmentQuestionPlan {
  questionCount: number;
  multipleChoiceCount: number;
  freeResponseCount: number;
  totalPoints: number;
}

export function getAssessmentQuestionBudget(type: AssessmentType): number {
  return ASSESSMENT_FORMAT_CONFIGS[type].defaultQuestionCount;
}

export function isAssessmentQuestionCountAllowed(type: AssessmentType, count: unknown): count is number {
  if (typeof count !== 'number' || !Number.isInteger(count)) return false;
  const config = ASSESSMENT_FORMAT_CONFIGS[type];
  return count >= config.minQuestionCount && count <= config.maxQuestionCount;
}

export function getAssessmentQuestionPlan(type: AssessmentType, requestedCount?: number): AssessmentQuestionPlan {
  const config = ASSESSMENT_FORMAT_CONFIGS[type];
  const questionCount = requestedCount ?? config.defaultQuestionCount;

  if (!isAssessmentQuestionCountAllowed(type, questionCount)) {
    throw new Error(
      `${config.label} supports ${config.minQuestionCount}–${config.maxQuestionCount} questions.`,
    );
  }

  const freeResponseCount = Math.round(questionCount * config.freeResponseRatio);
  const multipleChoiceCount = questionCount - freeResponseCount;

  return {
    questionCount,
    multipleChoiceCount,
    freeResponseCount,
    totalPoints:
      multipleChoiceCount * config.multipleChoicePoints +
      freeResponseCount * config.freeResponsePoints,
  };
}

export function getWorksheetLengthGuidance(questionCount: number): string {
  if (questionCount <= 8) return 'Short handout; usually 1–2 student pages.';
  if (questionCount <= 12) return 'Classroom length; usually 2–3 student pages.';
  if (questionCount <= 16) return 'Extended review; normally within the 4-page student target.';
  return 'Long formal assessment; review the print preview before distribution.';
}

export function getAssessmentFormatDescription(type: AssessmentType): string {
  const config = ASSESSMENT_FORMAT_CONFIGS[type];
  return `${config.minQuestionCount}–${config.maxQuestionCount} questions · teacher selected`;
}
