// =============================================================================
// POST /api/assessment/generate
// =============================================================================
// Server-side printable practice assembly. The server validates the selected
// curriculum blueprint, then generates fresh practice instances. A later Heat
// independently generates its own question instances from the same concepts.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { GENERATORS } from '@/lib/competition/generators';
import {
  assembleAssessment,
  type AssessmentPurpose,
} from '@/lib/assessment/assembler';
import {
  ASSESSMENT_FORMAT_CONFIGS,
  getAssessmentQuestionBudget,
  isAssessmentQuestionCountAllowed,
  type AssessmentType,
} from '@/lib/assessment/config';

const KNOWN_GENERATOR_KEYS = new Set(Object.keys(GENERATORS));
const ALLOWED_ROLES = new Set(['teacher', 'parent']);
const ASSESSMENT_TYPES = new Set<AssessmentType>(['review', 'quiz', 'homework', 'test', 'makeup']);
const DIFFICULTIES = new Set([1, 2, 3]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CONCEPTS = 16;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAssessmentPurpose(value: unknown): value is AssessmentPurpose {
  return value === 'standalone_practice' || value === 'competition_preparation';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'Could not verify worksheet access.' }, { status: 500 });
    }

    const role = (profile as { role?: string } | null)?.role ?? '';
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Only teachers and parents can generate practice worksheets.' }, { status: 403 });
    }

    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid worksheet request.' }, { status: 400 });
    }

    const docType = body.docType;
    const difficulty = body.difficulty;
    const courseId = body.courseId;
    const rawConceptIds = body.conceptIds;
    const purpose = isAssessmentPurpose(body.purpose) ? body.purpose : 'standalone_practice';

    if (purpose === 'competition_preparation' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create worksheets linked to a classroom Heat.' }, { status: 403 });
    }

    if (!ASSESSMENT_TYPES.has(docType as AssessmentType) || !DIFFICULTIES.has(difficulty as number)) {
      return NextResponse.json({ error: 'Choose a valid document type and difficulty profile.' }, { status: 400 });
    }
    if (typeof courseId !== 'string' || !UUID_RE.test(courseId)) {
      return NextResponse.json({ error: 'Choose a valid course before generating a worksheet.' }, { status: 400 });
    }
    if (!Array.isArray(rawConceptIds)) {
      return NextResponse.json({ error: 'Choose at least three concepts before generating a worksheet.' }, { status: 400 });
    }

    const conceptIds = Array.from(new Set(rawConceptIds.filter((id): id is string => typeof id === 'string' && UUID_RE.test(id))));
    if (conceptIds.length < 3 || conceptIds.length > MAX_CONCEPTS) {
      return NextResponse.json({ error: `Choose between 3 and ${MAX_CONCEPTS} valid concepts before generating a worksheet.` }, { status: 400 });
    }

    const typedDocType = docType as AssessmentType;
    const requestedQuestionCount = body.questionCount ?? getAssessmentQuestionBudget(typedDocType);
    const formatConfig = ASSESSMENT_FORMAT_CONFIGS[typedDocType];
    if (!isAssessmentQuestionCountAllowed(typedDocType, requestedQuestionCount)) {
      return NextResponse.json(
        { error: `${formatConfig.label} supports ${formatConfig.minQuestionCount}–${formatConfig.maxQuestionCount} questions. Choose a whole number in that range.` },
        { status: 400 },
      );
    }
    if (conceptIds.length > requestedQuestionCount) {
      return NextResponse.json(
        { error: `Choose no more than ${requestedQuestionCount} concepts so every selected concept can appear in this worksheet.` },
        { status: 400 },
      );
    }
    if (purpose === 'competition_preparation' && typedDocType !== 'review') {
      return NextResponse.json(
        { error: 'Competition preparation uses the Practice Review format so the student copy never includes a teacher answer key.' },
        { status: 400 },
      );
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .eq('is_active', true)
      .maybeSingle();
    if (courseError || !course) {
      return NextResponse.json({ error: 'The selected course is unavailable.' }, { status: 400 });
    }

    const { data: topics, error: topicsError } = await supabase
      .from('unit_topics')
      .select('id, name')
      .eq('course_id', courseId);
    if (topicsError) {
      return NextResponse.json({ error: 'Could not validate the selected course topics.' }, { status: 500 });
    }
    const topicNameById = new Map((topics ?? []).map((topic: { id: string; name: string }) => [topic.id, topic.name]));
    const courseTopicIds = Array.from(topicNameById.keys());
    if (courseTopicIds.length === 0) {
      return NextResponse.json({ error: 'No concepts are available for the selected course.' }, { status: 422 });
    }

    const { data: concepts, error: conceptsError } = await supabase
      .from('atomic_concepts')
      .select('id, name, unit_topic_id')
      .in('id', conceptIds)
      .in('unit_topic_id', courseTopicIds);
    if (conceptsError || (concepts ?? []).length !== conceptIds.length) {
      return NextResponse.json({ error: 'Every selected concept must belong to the selected course.' }, { status: 400 });
    }

    const selectedConcepts = concepts as Array<{ id: string; name: string; unit_topic_id: string }>;
    const conceptNameById = new Map(selectedConcepts.map((concept) => [concept.id, concept.name]));
    const topicNames = Array.from(
      new Set(selectedConcepts.map((concept) => topicNameById.get(concept.unit_topic_id)).filter((name): name is string => !!name)),
    );

    const { data: generators, error: generatorError } = await supabase
      .from('question_generators')
      .select('concept_id, generator_type')
      .in('concept_id', conceptIds)
      .eq('is_active', true);
    if (generatorError) {
      return NextResponse.json({ error: 'Could not load practice generators for the selected concepts.' }, { status: 500 });
    }

    const candidates = ((generators ?? []) as Array<{ concept_id: string; generator_type: string }>)
      .filter((generator) => KNOWN_GENERATOR_KEYS.has(generator.generator_type))
      .map((generator) => ({ conceptId: generator.concept_id, generatorType: generator.generator_type }));
    const coveredConceptIds = new Set(candidates.map((candidate) => candidate.conceptId));
    const missingConceptNames = conceptIds
      .filter((conceptId) => !coveredConceptIds.has(conceptId))
      .map((conceptId) => conceptNameById.get(conceptId) ?? 'an unnamed concept');

    if (missingConceptNames.length > 0) {
      return NextResponse.json(
        { error: `No active implemented practice generator is available for: ${missingConceptNames.join(', ')}. Remove those concepts or activate their generators before creating a worksheet.` },
        { status: 422 },
      );
    }

    const doc = assembleAssessment(
      candidates.map((candidate) => candidate.generatorType),
      [difficulty as number],
      typedDocType,
      (course as { name: string }).name,
      topicNames,
      'STANDALONE',
      {
        concepts: conceptIds.map((conceptId) => conceptNameById.get(conceptId) ?? 'Unnamed concept'),
        purpose,
        preparationNote: purpose === 'competition_preparation'
          ? 'Your Heat will assess these skills using new question instances. This worksheet does not include future competition questions.'
          : undefined,
        returnHref: purpose === 'competition_preparation' ? '/compete/create?preparation=return' : undefined,
        candidates,
        questionCount: requestedQuestionCount,
      },
    );

    return NextResponse.json({ doc }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/assessment/generate]', err);
    return NextResponse.json({ error: 'Could not generate the worksheet. Please try again.' }, { status: 500 });
  }
}
