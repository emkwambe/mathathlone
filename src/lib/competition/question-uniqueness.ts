// =============================================================================
// MathAthlone — Procedural Question Uniqueness
// =============================================================================
// Procedural generators are intentionally reusable, but a single worksheet or
// Heat should never present the exact same visible item twice. This helper
// compares the canonical student-facing prompt and retries a bounded number of
// times before failing the assembly rather than silently accepting a duplicate.
// =============================================================================

import type { DifficultyLevel, GeneratedQuestion } from './generators';

/** Maximum independent generator attempts for one unique prompt in a session. */
export const MAX_UNIQUE_QUESTION_ATTEMPTS = 12;

/**
 * Normalize only presentation-level whitespace. We deliberately retain all
 * mathematical characters and numbers so two prompts match only when students
 * would see the same item.
 */
export function questionSignature(question: Pick<GeneratedQuestion, 'question_text' | 'question_latex'>): string {
  return (question.question_text || question.question_latex)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a question not already shown in the current worksheet or Heat.
 * Exhaustion is treated as an assembly failure: accepting a duplicate would
 * compromise question-set variety and the audit release rule.
 */
export function generateDistinctQuestion(
  generate: (difficulty: DifficultyLevel) => GeneratedQuestion,
  difficulty: DifficultyLevel,
  usedSignatures: Set<string>,
  generatorType: string,
): GeneratedQuestion {
  for (let attempt = 1; attempt <= MAX_UNIQUE_QUESTION_ATTEMPTS; attempt += 1) {
    const question = generate(difficulty);
    const signature = questionSignature(question);

    if (!signature) {
      throw new Error(`Generator ${generatorType} produced an empty student prompt.`);
    }
    if (!usedSignatures.has(signature)) {
      usedSignatures.add(signature);
      return question;
    }
  }

  throw new Error(
    `Generator ${generatorType} could not produce a unique question after ${MAX_UNIQUE_QUESTION_ATTEMPTS} attempts. ` +
    'Reduce the question count or choose additional concepts before launching.',
  );
}
