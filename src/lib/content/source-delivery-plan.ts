import { getImplementedPracticeGeneratorCandidates } from '../assessment/practice-generator-availability';
import {
  evaluateStaticSourceEligibility,
  type StaticOption,
  type StaticQuestionReviewRecord,
  type StaticQuestionSource,
} from './static-source-certification';

export type SourceDeliveryCandidate =
  | {
      kind: 'procedural';
      conceptId: string;
      generatorId: string;
      generatorType: string;
      answerType: string;
    }
  | {
      kind: 'static';
      conceptId: string;
      lessonNumber: string;
      conceptName: string;
      sourceStaticId: string;
      questionText: string;
      questionLatex: string | null;
      options: StaticOption[];
      correctAnswer: 'A' | 'B' | 'C' | 'D';
      explanation: string;
      difficulty: 1 | 2 | 3 | 4;
      contentSha256: string;
    };

export interface PlannedConcept {
  id: string;
  lessonNumber: string;
  name?: string;
}

export interface PlannedGeneratorSource {
  id: string;
  concept_id: string;
  generator_type: string;
  answer_type: string;
  is_active: boolean;
}

export interface SourceDeliveryPlan {
  requestedConceptIds: string[];
  requestedQuestionCount: number;
  candidates: SourceDeliveryCandidate[];
  sourceCounts: { procedural: number; static: number; visual: 0 };
  excludedStaticIds: string[];
}

export class SourceDeliveryPlanError extends Error {
  constructor(message: string, public readonly reasonCode: 'invalid_request' | 'missing_source' | 'insufficient_capacity') {
    super(message);
    this.name = 'SourceDeliveryPlanError';
  }
}

function orderedUnique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0)));
}

function sortProcedural(candidates: SourceDeliveryCandidate[]): SourceDeliveryCandidate[] {
  return candidates
    .filter((candidate): candidate is Extract<SourceDeliveryCandidate, { kind: 'procedural' }> => candidate.kind === 'procedural')
    .sort((left, right) => left.generatorType.localeCompare(right.generatorType) || left.generatorId.localeCompare(right.generatorId));
}

function sortStatic(candidates: SourceDeliveryCandidate[]): Extract<SourceDeliveryCandidate, { kind: 'static' }>[] {
  return candidates
    .filter((candidate): candidate is Extract<SourceDeliveryCandidate, { kind: 'static' }> => candidate.kind === 'static')
    .sort((left, right) => left.sourceStaticId.localeCompare(right.sourceStaticId));
}

/**
 * Resolves a complete exact-source plan before a worksheet is returned or a Heat
 * row is inserted. Static capacity is finite and never repeats; procedural
 * candidates can repeat only because later generation creates fresh instances.
 */
export function buildExactSourceDeliveryPlan(input: {
  concepts: readonly PlannedConcept[];
  requestedConceptIds: readonly string[];
  requestedQuestionCount: number;
  generators: readonly PlannedGeneratorSource[];
  staticSources: readonly StaticQuestionSource[];
  staticReviews: readonly StaticQuestionReviewRecord[];
  excludedStaticIds?: readonly string[];
}): SourceDeliveryPlan {
  const requestedConceptIds = orderedUnique(input.requestedConceptIds);
  if (requestedConceptIds.length === 0 || input.requestedQuestionCount < requestedConceptIds.length) {
    throw new SourceDeliveryPlanError(
      'The requested question count must be at least the number of explicitly selected concepts.',
      'invalid_request',
    );
  }

  const conceptById = new Map(input.concepts.map((concept) => [concept.id, concept]));
  if (conceptById.size !== requestedConceptIds.length || requestedConceptIds.some((id) => !conceptById.has(id))) {
    throw new SourceDeliveryPlanError('Every selected concept must resolve to an exact atomic-concept record.', 'invalid_request');
  }

  const excludedStaticIds = orderedUnique(input.excludedStaticIds ?? []);
  const excludedStaticSet = new Set(excludedStaticIds);
  const generatorRows = input.generators
    .filter((generator) => generator.is_active && conceptById.has(generator.concept_id));
  const implementedGeneratorTypes = new Set(
    getImplementedPracticeGeneratorCandidates(generatorRows).map((candidate) => `${candidate.conceptId}:${candidate.generatorType}`),
  );

  const candidatesByConcept = new Map<string, SourceDeliveryCandidate[]>();
  for (const conceptId of requestedConceptIds) candidatesByConcept.set(conceptId, []);

  for (const generator of generatorRows) {
    if (!implementedGeneratorTypes.has(`${generator.concept_id}:${generator.generator_type}`)) continue;
    candidatesByConcept.get(generator.concept_id)?.push({
      kind: 'procedural',
      conceptId: generator.concept_id,
      generatorId: generator.id,
      generatorType: generator.generator_type,
      answerType: generator.answer_type,
    });
  }

  for (const source of input.staticSources) {
    if (excludedStaticSet.has(source.id)) continue;
    const concept = input.concepts.find((entry) => entry.lessonNumber === source.concept_id);
    if (!concept || !conceptById.has(concept.id)) continue;
    const eligibility = evaluateStaticSourceEligibility({
      source,
      atomicConceptId: concept.id,
      lessonNumber: concept.lessonNumber,
      reviews: input.staticReviews,
    });
    if (!eligibility.eligible || !eligibility.options) continue;
    candidatesByConcept.get(concept.id)?.push({
      kind: 'static',
      conceptId: concept.id,
      lessonNumber: concept.lessonNumber,
      conceptName: concept.name ?? concept.lessonNumber,
      sourceStaticId: source.id,
      questionText: source.question_text,
      questionLatex: source.question_latex,
      options: eligibility.options,
      correctAnswer: source.correct_answer.trim() as 'A' | 'B' | 'C' | 'D',
      explanation: source.explanation!.trim(),
      difficulty: source.difficulty as 1 | 2 | 3 | 4,
      contentSha256: eligibility.contentSha256,
    });
  }

  const plan: SourceDeliveryCandidate[] = [];
  const usedStaticIds = new Set<string>();
  const addCandidate = (candidate: SourceDeliveryCandidate): boolean => {
    if (candidate.kind === 'static') {
      if (usedStaticIds.has(candidate.sourceStaticId)) return false;
      usedStaticIds.add(candidate.sourceStaticId);
    }
    plan.push(candidate);
    return true;
  };

  // Coverage pass: favor fresh procedural sources where available, but guarantee
  // that static-only concepts reserve one exact eligible static item.
  for (const conceptId of requestedConceptIds) {
    const conceptCandidates = candidatesByConcept.get(conceptId) ?? [];
    const procedural = sortProcedural(conceptCandidates);
    const staticCandidates = sortStatic(conceptCandidates);
    const coverageCandidate = procedural[0] ?? staticCandidates[0];
    if (!coverageCandidate || !addCandidate(coverageCandidate)) {
      throw new SourceDeliveryPlanError(
        `Selected concept ${conceptId} has no exact approved source capable of satisfying this request.`,
        'missing_source',
      );
    }
  }

  // Fill pass: procedural sources may recur as fresh instances; static items can
  // be used only once and only when their exact concept is selected.
  const allProcedural = requestedConceptIds.flatMap((conceptId) => sortProcedural(candidatesByConcept.get(conceptId) ?? []));
  const allStatic = requestedConceptIds.flatMap((conceptId) => sortStatic(candidatesByConcept.get(conceptId) ?? []));
  let proceduralCursor = 0;
  let staticCursor = 0;
  while (plan.length < input.requestedQuestionCount) {
    if (allProcedural.length > 0) {
      addCandidate(allProcedural[proceduralCursor % allProcedural.length]!);
      proceduralCursor += 1;
      continue;
    }

    while (staticCursor < allStatic.length && usedStaticIds.has(allStatic[staticCursor]!.sourceStaticId)) {
      staticCursor += 1;
    }
    const staticCandidate = allStatic[staticCursor];
    if (!staticCandidate || !addCandidate(staticCandidate)) {
      throw new SourceDeliveryPlanError(
        `The selected concepts have only ${plan.length} unique exact source item(s), fewer than the requested ${input.requestedQuestionCount}.`,
        'insufficient_capacity',
      );
    }
    staticCursor += 1;
  }

  const sourceCounts = {
    procedural: plan.filter((candidate) => candidate.kind === 'procedural').length,
    static: plan.filter((candidate) => candidate.kind === 'static').length,
    visual: 0 as const,
  };

  return {
    requestedConceptIds,
    requestedQuestionCount: input.requestedQuestionCount,
    candidates: plan,
    sourceCounts,
    excludedStaticIds,
  };
}
