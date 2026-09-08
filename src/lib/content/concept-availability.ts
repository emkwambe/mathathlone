import type { SupabaseClient } from '@supabase/supabase-js';

import {
  getImplementedPracticeGeneratorCandidates,
  type PracticeGeneratorRow,
} from '../assessment/practice-generator-availability';

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
  verifiedStaticItemCount: number;
  unverifiedStaticItemCount: number;
  /**
   * Current worksheet and class-Heat delivery both require at least one
   * implemented deterministic procedural generator. Verified static items are
   * retained as coverage evidence, but are not selectable until their exact
   * source-delivery and per-concept coverage guarantees are implemented.
   */
  deliveryAvailable: boolean;
  unavailableReason: string | null;
}

type ConceptRow = {
  id: string;
  lesson_number: string;
};

type StaticQuestionRow = {
  concept_id: string;
  is_verified: boolean | null;
};

function uniqueIds(conceptIds: readonly string[]): string[] {
  return Array.from(new Set(conceptIds.filter((id) => typeof id === 'string' && id.length > 0)));
}

/**
 * Classifies one atomic concept using only explicit database mappings and the
 * deterministic runtime generator registry. It does not infer availability
 * from course membership, a generic visual pool, or an unverified item.
 */
export function classifyConceptAvailability(input: {
  conceptId: string;
  generatorRows: readonly PracticeGeneratorRow[];
  verifiedStaticItemCount: number;
  unverifiedStaticItemCount: number;
}): ConceptAvailabilityRow {
  const implementedGeneratorTypes = Array.from(new Set(
    getImplementedPracticeGeneratorCandidates(input.generatorRows)
      .filter((candidate) => candidate.conceptId === input.conceptId)
      .map((candidate) => candidate.generatorType),
  )).sort();

  const hasProcedural = implementedGeneratorTypes.length > 0;
  const hasVerifiedStatic = input.verifiedStaticItemCount > 0;
  const hasUnverifiedStatic = input.unverifiedStaticItemCount > 0;

  const sourceState: ConceptSourceState = hasProcedural && hasVerifiedStatic
    ? 'mixed'
    : hasProcedural
      ? 'procedural'
      : hasVerifiedStatic
        ? 'static'
        : hasUnverifiedStatic
          ? 'unverified_static'
          : 'unavailable';

  // Static sources are intentional coverage evidence, but the current
  // procedural-first worksheet and Heat paths cannot yet guarantee that every
  // explicitly selected static-only concept receives a suitable item. Keeping
  // them non-selectable is fail-closed until that delivery contract is built.
  const deliveryAvailable = hasProcedural;

  const unavailableReason = deliveryAvailable
    ? null
    : hasVerifiedStatic
      ? 'A verified static question source is recorded, but this concept is not yet supported by the current worksheet or Heat delivery path.'
      : hasUnverifiedStatic
        ? 'Static questions exist but are not yet verified for classroom delivery.'
        : 'No approved active question source is available for worksheet or Heat practice.';

  return {
    conceptId: input.conceptId,
    sourceState,
    implementedGeneratorTypes,
    verifiedStaticItemCount: input.verifiedStaticItemCount,
    unverifiedStaticItemCount: input.unverifiedStaticItemCount,
    deliveryAvailable,
    unavailableReason,
  };
}

/**
 * Resolves a concept set against the live source tables. The lookup is
 * server-side, read-only, and deliberately conservative: it recognizes an
 * active procedural mapping only when its registry key is implemented in code,
 * and it separately reports active verified/unverified static evidence.
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
        .select('concept_id, is_verified')
        .in('concept_id', lessonNumbers)
        .eq('is_active', true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (generatorError) throw new Error('Could not load active procedural source mappings.');
  if (staticError) throw new Error('Could not load active static source mappings.');

  const staticCountsByLesson = new Map<string, { verified: number; unverified: number }>();
  for (const row of ((staticRows ?? []) as StaticQuestionRow[])) {
    const counts = staticCountsByLesson.get(row.concept_id) ?? { verified: 0, unverified: 0 };
    if (row.is_verified === true) counts.verified += 1;
    else counts.unverified += 1;
    staticCountsByLesson.set(row.concept_id, counts);
  }

  const generatorRowsByConcept = new Map<string, PracticeGeneratorRow[]>();
  for (const row of ((generatorRows ?? []) as PracticeGeneratorRow[])) {
    const entries = generatorRowsByConcept.get(row.concept_id) ?? [];
    entries.push(row);
    generatorRowsByConcept.set(row.concept_id, entries);
  }

  const conceptById = new Map(conceptRows.map((concept) => [concept.id, concept]));
  return ids.map((conceptId) => {
    const concept = conceptById.get(conceptId);
    const staticCounts = concept
      ? staticCountsByLesson.get(concept.lesson_number) ?? { verified: 0, unverified: 0 }
      : { verified: 0, unverified: 0 };
    return classifyConceptAvailability({
      conceptId,
      generatorRows: generatorRowsByConcept.get(conceptId) ?? [],
      verifiedStaticItemCount: staticCounts.verified,
      unverifiedStaticItemCount: staticCounts.unverified,
    });
  });
}

export function getUnavailableConceptIds(rows: readonly ConceptAvailabilityRow[]): Set<string> {
  return new Set(rows.filter((row) => !row.deliveryAvailable).map((row) => row.conceptId));
}
