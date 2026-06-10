// =============================================================================
// MathAthlone — /assessment/[heatId]/[type]
// =============================================================================
// Server component that assembles a printable take-home assessment from the
// generator types + difficulties recorded on a completed heat's questions.
//
//   type ∈ { review, quiz, test }   (anything else → /dashboard)
//
// Renders the client AssessmentDoc, which prints via window.print().
// =============================================================================

import { redirect } from 'next/navigation';

import { createSupabaseServer } from '@/lib/supabase/server';
import {
  assembleAssessment,
  type AssessmentType,
} from '@/lib/assessment/assembler';
import AssessmentDoc from '@/components/assessment/AssessmentDoc';

const VALID_TYPES: AssessmentType[] = ['review', 'quiz', 'test'];

// Supabase embeds one-to-one relations as either an object or a single-element
// array depending on the inferred cardinality — normalise to the first record.
function firstOf<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

export default async function AssessmentPage({
  params,
}: {
  params: { heatId: string; type: string };
}) {
  const { heatId, type } = params;

  if (!VALID_TYPES.includes(type as AssessmentType)) {
    redirect('/dashboard');
  }
  const assessmentType = type as AssessmentType;

  const supabase = await createSupabaseServer();

  // 1. Heat + topic + course meta.
  const { data: heat, error: heatErr } = await supabase
    .from('heats')
    .select(
      `
      id, code,
      unit_topic:unit_topic_id (
        id, name,
        course:course_id ( id, name )
      )
    `
    )
    .eq('id', heatId)
    .maybeSingle();

  if (heatErr || !heat) {
    redirect('/dashboard');
  }

  const heatRow: any = heat;
  const unitTopic = firstOf<any>(heatRow.unit_topic);
  const course = firstOf<any>(unitTopic?.course);
  const courseName: string = course?.name ?? 'MathAthlone';
  const topicNames: string[] = unitTopic?.name ? [unitTopic.name as string] : [];
  const heatCode: string = heatRow.code ?? '';

  // 2. Generator types + difficulties for this heat's questions.
  //    generator_type lives on the joined question_generators row; difficulty
  //    is a direct column on heat_questions.
  const { data: questionRows } = await supabase
    .from('heat_questions')
    .select('difficulty, question_generators:generator_id ( generator_type )')
    .eq('heat_id', heatId);

  const generatorTypes: string[] = [];
  const difficulties: number[] = [];
  for (const row of (questionRows ?? []) as any[]) {
    const gen = firstOf<any>(row.question_generators);
    const genType: string | null = gen?.generator_type ?? null;
    if (!genType) continue;
    generatorTypes.push(genType);
    difficulties.push(typeof row.difficulty === 'number' ? row.difficulty : 2);
  }

  if (generatorTypes.length === 0) {
    redirect('/dashboard');
  }

  // 3. Assemble the document.
  const doc = assembleAssessment(
    heatCode,
    generatorTypes,
    difficulties,
    assessmentType,
    courseName,
    topicNames
  );

  return <AssessmentDoc doc={doc} />;
}
