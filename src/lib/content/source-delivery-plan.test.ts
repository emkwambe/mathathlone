import { describe, expect, it } from 'vitest';

import {
  buildExactSourceDeliveryPlan,
  SourceDeliveryPlanError,
} from './source-delivery-plan';
import {
  evaluateStaticSourceEligibility,
  sha256Hex,
  staticQuestionContentSha256,
  type StaticQuestionSource,
} from './static-source-certification';

const CONCEPT_A = { id: '11111111-1111-4111-8111-111111111111', lessonNumber: 'M6.RP.1.1' };
const CONCEPT_B = { id: '22222222-2222-4222-8222-222222222222', lessonNumber: 'M6.RP.1.2' };

function staticSource(overrides: Partial<StaticQuestionSource> = {}): StaticQuestionSource {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    concept_id: CONCEPT_A.lessonNumber,
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
    explanation: 'Multiply both terms in 2:3 by 2 to get 4:6.',
    solution_steps: null,
    difficulty: 2,
    is_active: true,
    is_verified: true,
    ...overrides,
  };
}

function approvedReview(source: StaticQuestionSource, conceptId = CONCEPT_A.id) {
  return {
    static_question_id: source.id,
    atomic_concept_id: conceptId,
    content_sha256: staticQuestionContentSha256(source),
    deterministic_result: 'pass' as const,
    decision: 'approved' as const,
    reviewed_at: '2026-09-14T00:00:00.000Z',
    created_at: '2026-09-14T00:00:00.000Z',
  };
}

const PROCEDURAL_B = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  concept_id: CONCEPT_B.id,
  generator_type: 'g6_rp_ratio_table_solve',
  answer_type: 'integer',
  is_active: true,
};

describe('static source certification', () => {
  it('produces the standard SHA-256 known vector in browser-safe code', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('accepts a verified exact static item only with a matching immutable approval signature', () => {
    const source = staticSource();
    const result = evaluateStaticSourceEligibility({
      source,
      atomicConceptId: CONCEPT_A.id,
      lessonNumber: CONCEPT_A.lessonNumber,
      reviews: [approvedReview(source)],
    });

    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe('eligible');
    expect(result.options?.map((option) => option.key)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('rejects a review after any scored or visible source field changes', () => {
    const source = staticSource();
    const changed = staticSource({ question_text: 'Which ratio is equivalent to 3:5?' });
    const result = evaluateStaticSourceEligibility({
      source: changed,
      atomicConceptId: CONCEPT_A.id,
      lessonNumber: CONCEPT_A.lessonNumber,
      reviews: [approvedReview(source)],
    });

    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe('review_fingerprint_mismatch');
  });

  it('rejects malformed option keys and a mismatched stored answer index', () => {
    const source = staticSource({
      options: [
        { key: 'A', text: '2:6' },
        { key: 'A', text: '3:2' },
        { key: 'C', text: '4:6' },
        { key: 'D', text: '6:4' },
      ],
      correct_answer_index: 0,
    });
    const result = evaluateStaticSourceEligibility({
      source,
      atomicConceptId: CONCEPT_A.id,
      lessonNumber: CONCEPT_A.lessonNumber,
      reviews: [approvedReview(source)],
    });

    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe('invalid_options');
  });
});

describe('exact source delivery planner', () => {
  it('rejects a focused request whose finite static pool cannot meet the requested count without repetition', () => {
    const source = staticSource();
    expect(() => buildExactSourceDeliveryPlan({
      concepts: [CONCEPT_A],
      requestedConceptIds: [CONCEPT_A.id],
      requestedQuestionCount: 5,
      generators: [],
      staticSources: [source],
      staticReviews: [approvedReview(source)],
    })).toThrow(SourceDeliveryPlanError);

    try {
      buildExactSourceDeliveryPlan({
        concepts: [CONCEPT_A],
        requestedConceptIds: [CONCEPT_A.id],
        requestedQuestionCount: 5,
        generators: [],
        staticSources: [source],
        staticReviews: [approvedReview(source)],
      });
    } catch (error) {
      expect(error).toMatchObject({ reasonCode: 'insufficient_capacity' });
    }
  });

  it('creates a mixed exact-concept plan with one static reservation and fresh procedural fill', () => {
    const source = staticSource();
    const plan = buildExactSourceDeliveryPlan({
      concepts: [CONCEPT_A, CONCEPT_B],
      requestedConceptIds: [CONCEPT_A.id, CONCEPT_B.id],
      requestedQuestionCount: 5,
      generators: [PROCEDURAL_B],
      staticSources: [source],
      staticReviews: [approvedReview(source)],
    });

    expect(plan.candidates).toHaveLength(5);
    expect(new Set(plan.candidates.map((candidate) => candidate.conceptId))).toEqual(new Set([CONCEPT_A.id, CONCEPT_B.id]));
    expect(plan.sourceCounts).toEqual({ procedural: 4, static: 1, visual: 0 });
    expect(plan.candidates.filter((candidate) => candidate.kind === 'static')).toHaveLength(1);
  });

  it('rejects a static candidate excluded by a preceding linked worksheet', () => {
    const source = staticSource();
    expect(() => buildExactSourceDeliveryPlan({
      concepts: [CONCEPT_A],
      requestedConceptIds: [CONCEPT_A.id],
      requestedQuestionCount: 1,
      generators: [],
      staticSources: [source],
      staticReviews: [approvedReview(source)],
      excludedStaticIds: [source.id],
    })).toThrow(SourceDeliveryPlanError);
  });

  it('rejects a source whose approval belongs to a neighbouring concept', () => {
    const source = staticSource();
    expect(() => buildExactSourceDeliveryPlan({
      concepts: [CONCEPT_A],
      requestedConceptIds: [CONCEPT_A.id],
      requestedQuestionCount: 1,
      generators: [],
      staticSources: [source],
      staticReviews: [approvedReview(source, CONCEPT_B.id)],
    })).toThrow(SourceDeliveryPlanError);
  });
});
