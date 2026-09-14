import { describe, expect, it } from 'vitest';

import { classifyConceptAvailability } from './concept-availability';
import { staticQuestionContentSha256, type StaticQuestionSource } from './static-source-certification';

const implementedGenerator = {
  concept_id: 'procedural-id',
  generator_type: 'g6_rp_calculate_unit_rate',
};

function verifiedStaticSource(overrides: Partial<StaticQuestionSource> = {}): StaticQuestionSource {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    concept_id: 'M6.RP.1.1',
    question_type: 'multiple_choice',
    question_text: 'Which ratio is equivalent to 2:3?',
    question_latex: null,
    question_image_url: null,
    options: [
      { key: 'A', text: '2:6' },
      { key: 'B', text: '3:2' },
      { key: 'C', text: '4:6' },
      { key: 'D', text: '6:4' },
    ],
    option_images: null,
    correct_answer: 'C',
    correct_answer_index: 2,
    explanation: 'Multiply both terms by 2.',
    solution_steps: null,
    difficulty: 2,
    is_active: true,
    is_verified: true,
    ...overrides,
  };
}

describe('classifyConceptAvailability', () => {
  it('accepts a concept only when an active mapping has an implemented deterministic runtime key', () => {
    const result = classifyConceptAvailability({
      conceptId: 'procedural-id',
      lessonNumber: 'M6.RP.1.3',
      generatorRows: [implementedGenerator],
      staticSources: [],
      staticReviews: [],
    });

    expect(result).toMatchObject({
      conceptId: 'procedural-id',
      sourceState: 'procedural',
      implementedGeneratorTypes: ['g6_rp_calculate_unit_rate'],
      deliveryAvailable: true,
      unavailableReason: null,
    });
  });

  it('keeps a verified static source unavailable when there is no immutable approval record', () => {
    const result = classifyConceptAvailability({
      conceptId: 'static-id',
      lessonNumber: 'M6.RP.1.1',
      generatorRows: [],
      staticSources: [verifiedStaticSource()],
      staticReviews: [],
    });

    expect(result).toMatchObject({
      conceptId: 'static-id',
      sourceState: 'static',
      verifiedStaticItemCount: 1,
      approvedStaticItemCount: 0,
      deliveryAvailable: false,
    });
    expect(result.unavailableReason).toContain('current approved review record');
  });

  it('accepts verified static evidence only when the exact current fingerprint has an approved pass record', () => {
    const source = verifiedStaticSource();
    const result = classifyConceptAvailability({
      conceptId: 'static-id',
      lessonNumber: 'M6.RP.1.1',
      generatorRows: [],
      staticSources: [source],
      staticReviews: [{
        static_question_id: source.id,
        atomic_concept_id: 'static-id',
        content_sha256: staticQuestionContentSha256(source),
        deterministic_result: 'pass',
        decision: 'approved',
        reviewed_at: '2026-09-14T00:00:00.000Z',
      }],
    });

    expect(result).toMatchObject({
      sourceState: 'static',
      approvedStaticItemCount: 1,
      deliveryAvailable: true,
      unavailableReason: null,
    });
  });

  it('does not treat active unverified static items as an approved source', () => {
    const result = classifyConceptAvailability({
      conceptId: 'unverified-static-id',
      lessonNumber: 'M6.RP.1.1',
      generatorRows: [],
      staticSources: [verifiedStaticSource({ is_verified: false })],
      staticReviews: [],
    });

    expect(result).toMatchObject({
      sourceState: 'unverified_static',
      deliveryAvailable: false,
    });
    expect(result.unavailableReason).toContain('not yet verified');
  });

  it('fails closed when a database mapping points to a generator key absent from the runtime registry', () => {
    const result = classifyConceptAvailability({
      conceptId: 'unknown-generator-id',
      lessonNumber: 'M6.RP.1.3',
      generatorRows: [{ concept_id: 'unknown-generator-id', generator_type: 'not_implemented' }],
      staticSources: [],
      staticReviews: [],
    });

    expect(result).toMatchObject({
      sourceState: 'unavailable',
      implementedGeneratorTypes: [],
      deliveryAvailable: false,
    });
  });

  it('reports mixed source evidence while preserving procedural delivery', () => {
    const result = classifyConceptAvailability({
      conceptId: 'mixed-id',
      lessonNumber: 'M6.RP.1.1',
      generatorRows: [{ ...implementedGenerator, concept_id: 'mixed-id' }],
      staticSources: [verifiedStaticSource()],
      staticReviews: [],
    });

    expect(result).toMatchObject({
      sourceState: 'mixed',
      deliveryAvailable: true,
      verifiedStaticItemCount: 1,
      approvedStaticItemCount: 0,
    });
  });
});
