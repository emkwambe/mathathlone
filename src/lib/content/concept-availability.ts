import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getImplementedPracticeGeneratorCandidates,
  type PracticeGeneratorRow,
} from '../assessment/practice-generator-availability';
import {
  evaluateStaticSourceEligibility,
  type StaticQuestionReviewRecord,
  type StaticQuestionSource,
} from './static-source-certification';

export type ConceptSourceState =
  | 'procedural'
  | 'static'
  | 'mixed'
  | 'unverified_static'
  | 'unavailable';

export interface ConceptAvailabilityRow {
  conceptId: string;
  sourceState: ConceptSourceState;
  implementedGeneratorTypes: string[];
  /** Active static rows marked verified, before immutable-review fingerprint checks. */
  verifiedStaticItemCount: number;
  /** Verified static rows with a current approved immutable review record. */
  approvedStaticItemCount: number;
  unverifiedStaticItemCount: number;
  /**
   * A concept is selectable only when it has an implemented procedural source or
   * at least one exact verified static item with a matching approved review
   * record. The worksheet/Heat planner independently enforces requested-count
   * capacity, coverage, and no-repeat rules before creation.
   */
  deliveryAvailable: boolean;
  unavailableReason: string | null;
}

type ConceptRow = {
  id: string;
  lesson_number: string;
};

type GeneratorAvailabilityRow = PracticeGeneratorRow;

type ReviewRecordRow = StaticQuestionReviewRecord;

function uniqueIds(conceptIds: readonly string[]): string[] {
  return Array.from(new Set(conceptIds.filter((id) => typeof id === 'string' && id.length > 0)));
}

/**
 * Classifies one atomic concept from explicit active mappings, the deterministic
 * runtime registry, and fingerprint-bound static-review evidence. It does not
 * infer delivery from course membership, a generic visual pool, or an
 * unverified/static row whose approval no longer matches its stored content.
 */
export function classifyConceptAvailability(input: {
  conceptId: string;
  lessonNumber: string;
  generatorRows: readonly PracticeGeneratorRow[];
  staticSources: readonly StaticQuestionSource[];
  staticReviews: readonly StaticQuestionReviewRecord[];
}): ConceptAvailabilityRow {
  const implementedGeneratorTypes = Array.from(new Set(
    getImplementedPracticeGeneratorCandidates(input.generatorRows)
      .filter((candidate) => candidate.conceptId === input.conceptId)
      .map((candidate) => candidate.generatorType),
  )).sort();

  const verifiedStaticSources = input.staticSources.filter((source) => source.is_active && source.is_verified === true);
  const unverifiedStaticItemCount = input.staticSources.filter((source) => source.is_active && source.is_verified !== true).length;
  const approvedStaticItemCount = verifiedStaticSources.filter((source) =>
    evaluateStaticSourceEligibility({
      source,
      atomicConceptId: input.conceptId,
      lessonNumber: input.lessonNumber,
      reviews: input.staticReviews,
    }).eligible,
  ).length;

  const hasProcedural = implementedGeneratorTypes.length > 0;
  const hasVerifiedStatic = verifiedStaticSources.length > 0;
  const hasApprovedStatic = approvedStaticItemCount > 0;
  const hasUnverifiedStatic = unverifiedStaticItemCount > 0;

  const sourceState: ConceptSourceState = hasProcedural && hasVerifiedStatic
    ? 'mixed'
    : hasProcedural
      ? 'procedural'
      : hasVerifiedStatic
        ? 'static'
        : hasUnverifiedStatic
          ? 'unverified_static'
          : 'unavailable';

  const deliveryAvailable = hasProcedural || hasApprovedStatic;
  const unavailableReason = deliveryAvailable
    ? null
    : hasVerifiedStatic
      ? 'Verified static questions exist, but none has a current approved review record matching its stored source content.'
      : hasUnverifiedStatic
        ? 'Static questions exist but are not yet verified for classroom delivery.'
        : 'No approved active question source is available for worksheet or Heat practice.';

  return {
    conceptId: input.conceptId,
    sourceState,
    implementedGeneratorTypes,
    verifiedStaticItemCount: verifiedStaticSources.length,
    approvedStaticItemCount,
    unverifiedStaticItemCount,
    deliveryAvailable,
    unavailableReason,
  };
}

/**
 * Resolves a concept set against live source tables. All evidence is server-side
 * and read-only. Missing review-ledger access fails closed rather than allowing a
 * verified static row to bypass the immutable approval requirement.
 */
export async function getConceptAvailability(
  supabase: SupabaseClient,
  conceptIds: readonly string[],
): Promise<ConceptAvailabilityRow[]> {
  const ids = uniqueIds(conceptIds);
  if (ids.length === 0) return [];

  const { data: concepts, error: conceptError } = await supabase
    .from('atomic_concepts')
    .select('id, lesson_number')
    .in('id', ids);
  if (conceptError) throw new Error('Could not load selected atomic concepts for availability checking.');

  const conceptRows = (concepts ?? []) as ConceptRow[];
  const lessonNumbers = conceptRows.map((concept) => concept.lesson_number);
  const [{ data: generatorRows, error: generatorError }, { data: staticRows, error: staticError }] = await Promise.all([
    supabase
      .from('question_generators')
      .select('concept_id, generator_type')
      .in('concept_id', ids)
      .eq('is_active', true),
    lessonNumbers.length > 0
      ? supabase
        .from('static_questions')
        .select('id, concept_id, question_type, question_text, question_latex, question_image_url, options, option_images, correct_answer, correct_answer_index, explanation, solution_steps, difficulty, is_active, is_verified')
        .in('concept_id', lessonNumbers)
        .eq('is_active', true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (generatorError) throw new Error('Could not load active procedural source mappings.');
  if (staticError) throw new Error('Could not load active static source mappings.');

  const staticSources = (staticRows ?? []) as StaticQuestionSource[];
  const staticIds = staticSources.map((source) => source.id);
  let staticReviews: StaticQuestionReviewRecord[] = [];
  if (staticIds.length > 0) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from('static_question_review_records')
      .select('id, static_question_id, atomic_concept_id, content_sha256, deterministic_result, decision, reviewed_at, created_at')
      .in('static_question_id', staticIds);
    if (reviewError) {
      throw new Error('Could not load immutable static-source review records.');
    }
    staticReviews = (reviewRows ?? []) as ReviewRecordRow[];
  }

  const generatorRowsByConcept = new Map<string, GeneratorAvailabilityRow[]>();
  for (const row of ((generatorRows ?? []) as GeneratorAvailabilityRow[])) {
    const entries = generatorRowsByConcept.get(row.concept_id) ?? [];
    entries.push(row);
    generatorRowsByConcept.set(row.concept_id, entries);
  }
  const staticSourcesByLesson = new Map<string, StaticQuestionSource[]>();
  for (const source of staticSources) {
    const entries = staticSourcesByLesson.get(source.concept_id) ?? [];
    entries.push(source);
    staticSourcesByLesson.set(source.concept_id, entries);
  }

  const conceptById = new Map(conceptRows.map((concept) => [concept.id, concept]));
  return ids.map((conceptId) => {
    const concept = conceptById.get(conceptId);
    return classifyConceptAvailability({
      conceptId,
      lessonNumber: concept?.lesson_number ?? '',
      generatorRows: generatorRowsByConcept.get(conceptId) ?? [],
      staticSources: concept ? staticSourcesByLesson.get(concept.lesson_number) ?? [] : [],
      staticReviews,
    });
  });
}

export function getUnavailableConceptIds(rows: readonly ConceptAvailabilityRow[]): Set<string> {
  return new Set(rows.filter((row) => !row.deliveryAvailable).map((row) => row.conceptId));
}
