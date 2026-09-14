import { describe, expect, it } from 'vitest';

import {
  generateAndInsertQuestions,
  visualGeneratorCapacityForScope,
} from './question-delivery';

describe('explicit concept scope question delivery', () => {
  it('disables the unmapped visual pool for one selected atomic concept', () => {
    expect(visualGeneratorCapacityForScope(['concept-a'])).toBe(0);
  });

  it('disables the unmapped visual pool for several selected atomic concepts', () => {
    expect(visualGeneratorCapacityForScope(['concept-a', 'concept-b', 'concept-c'])).toBe(0);
  });

  it('retains visual capacity only for legacy topic-wide selection paths', () => {
    expect(visualGeneratorCapacityForScope(null)).toBeGreaterThan(0);
    expect(visualGeneratorCapacityForScope([])).toBeGreaterThan(0);
  });

  it('inserts only the named approved static item from an exact source plan', async () => {
    const inserts: unknown[] = [];
    const supabase = {
      from(table: string) {
        expect(table).toBe('heat_questions');
        return {
          insert(rows: unknown[]) {
            inserts.push(...rows);
            return Promise.resolve({ error: null });
          },
        };
      },
    } as any;

    await generateAndInsertQuestions(supabase, {
      heatId: 'heat-1',
      unitTopicId: null,
      conceptIds: ['concept-static'],
      depthMin: 1,
      depthMax: 2,
      questionCount: 1,
      sourcePlan: {
        requestedConceptIds: ['concept-static'],
        requestedQuestionCount: 1,
        excludedStaticIds: [],
        sourceCounts: { procedural: 0, static: 1, visual: 0 },
        candidates: [{
          kind: 'static',
          conceptId: 'concept-static',
          lessonNumber: 'M6.RP.1.1',
          conceptName: 'Write and interpret a ratio',
          sourceStaticId: 'static-item-1',
          questionText: 'Which ratio is equivalent to 2:3?',
          questionLatex: null,
          options: [
            { key: 'A', text: '2:6' },
            { key: 'B', text: '3:2' },
            { key: 'C', text: '4:6' },
            { key: 'D', text: '6:4' },
          ],
          correctAnswer: 'C',
          explanation: 'Multiply both terms by 2.',
          difficulty: 2,
          contentSha256: 'a'.repeat(64),
        }],
      },
    });

    expect(inserts).toEqual([expect.objectContaining({
      heat_id: 'heat-1',
      question_number: 1,
      generator_id: null,
      question_text: 'Which ratio is equivalent to 2:3?',
      correct_answer: 'C',
      solution_steps: expect.objectContaining({
        kind: 'static',
        source_static_id: 'static-item-1',
        concept_id: 'concept-static',
        lesson_number: 'M6.RP.1.1',
      }),
    })]);
  });
});
