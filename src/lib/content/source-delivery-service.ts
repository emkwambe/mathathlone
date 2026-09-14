import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildExactSourceDeliveryPlan,
  type PlannedConcept,
  type PlannedGeneratorSource,
  type SourceDeliveryPlan,
} from './source-delivery-plan';
import type { StaticQuestionReviewRecord, StaticQuestionSource } from './static-source-certification';

/**
 * Resolves selected concepts and all source evidence server-side. Browser input
 * can name atomic concept IDs and a requested count only; it never supplies a
 * static item, answer, fingerprint, generator key, or approval decision.
 */
export async function resolveExactSourceDeliveryPlan(
  supabase: SupabaseClient,
  input: {
    conceptIds: readonly string[];
    questionCount: number;
    excludedStaticIds?: readonly string[];
  },
): Promise<SourceDeliveryPlan> {
  const conceptIds = Array.from(new Set(input.conceptIds));
  const { data: concepts, error: conceptError } = await supabase
    .from('atomic_concepts')
    .select('id, lesson_number, name')
    .in('id', conceptIds);
  if (conceptError || (concepts ?? []).length !== conceptIds.length) {
    throw new Error('Could not resolve every selected atomic concept for exact source planning.');
  }

  const selectedConcepts: PlannedConcept[] = (concepts ?? []).map((concept: { id: string; lesson_number: string; name: string }) => ({
    id: concept.id,
    lessonNumber: concept.lesson_number,
    name: concept.name,
  }));
  const lessonNumbers = selectedConcepts.map((concept) => concept.lessonNumber);
  const [{ data: generators, error: generatorError }, { data: staticSources, error: staticError }] = await Promise.all([
    supabase
      .from('question_generators')
      .select('id, concept_id, generator_type, answer_type, is_active')
      .in('concept_id', conceptIds)
      .eq('is_active', true),
    supabase
      .from('static_questions')
      .select('id, concept_id, question_type, question_text, question_latex, question_image_url, options, option_images, correct_answer, correct_answer_index, explanation, solution_steps, difficulty, is_active, is_verified')
      .in('concept_id', lessonNumbers)
      .eq('is_active', true),
  ]);
  if (generatorError) throw new Error('Could not load procedural source candidates.');
  if (staticError) throw new Error('Could not load static source candidates.');

  const staticRows = (staticSources ?? []) as StaticQuestionSource[];
  let reviewRows: StaticQuestionReviewRecord[] = [];
  if (staticRows.length > 0) {
    const { data: reviews, error: reviewError } = await supabase
      .from('static_question_review_records')
      .select('id, static_question_id, atomic_concept_id, content_sha256, deterministic_result, decision, reviewed_at, created_at')
      .in('static_question_id', staticRows.map((source) => source.id));
    if (reviewError) throw new Error('Could not load immutable static-source review records.');
    reviewRows = (reviews ?? []) as StaticQuestionReviewRecord[];
  }

  return buildExactSourceDeliveryPlan({
    concepts: selectedConcepts,
    requestedConceptIds: conceptIds,
    requestedQuestionCount: input.questionCount,
    generators: (generators ?? []) as PlannedGeneratorSource[],
    staticSources: staticRows,
    staticReviews: reviewRows,
    excludedStaticIds: input.excludedStaticIds,
  });
}
