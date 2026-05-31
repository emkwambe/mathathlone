// =============================================================================
// MathAthlone — Question Delivery
// =============================================================================
// Loads atomic_concepts + question_generators for a Heat, calls the procedural
// generators (and visual generators), and INSERTs the rendered questions
// into heat_questions.
//
// Column references match LIVE_QUERY_RESULTS.md:
//   heat_questions: id, heat_id, question_number, generator_id, difficulty,
//                   question_latex, question_text, correct_answer, answer_type,
//                   solution_steps, points_value, time_limit_seconds
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateQuestion,
  GENERATORS,
  type DifficultyLevel,
  type GeneratedQuestion,
} from './generators';
import {
  VISUAL_GENERATORS,
  generateVisualQuestion,
  type VisualQuestion,
} from './visual-generators';

// -----------------------------------------------------------------------------
// PARAMS
// -----------------------------------------------------------------------------

export interface GenerateQuestionsParams {
  heatId: string;
  unitTopicId: string | null;          // null = mixed across all unit topics
  depthMin: number;                    // 1..4
  depthMax: number;                    // 1..4
  questionCount: number;
  /** Fraction (0..1) of static multiple-choice questions to include. Default 0. */
  staticRatio?: number;
  /** Fraction (0..1) of visual SVG questions to include. Default 0.2 (~20%). */
  visualRatio?: number;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickDifficulty(min: number, max: number): DifficultyLevel {
  return randomInRange(Math.max(1, min), Math.min(4, max)) as DifficultyLevel;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Points scale slightly with difficulty: 100, 125, 150, 175.
 */
function pointsForDifficulty(difficulty: DifficultyLevel): number {
  return 100 + (difficulty - 1) * 25;
}

/**
 * Time limit scales slightly with difficulty: 75, 90, 105, 120 seconds.
 */
function timeLimitForDifficulty(difficulty: DifficultyLevel): number {
  return 60 + difficulty * 15;
}

// -----------------------------------------------------------------------------
// INTERNAL: load generators relevant to the Heat's unit topic
// -----------------------------------------------------------------------------

interface ConceptRow {
  id: string;
  lesson_number: string;
  unit_topic_id: string;
}

interface GeneratorRow {
  id: string;
  concept_id: string;
  generator_type: string;
  answer_type: string;
  is_active: boolean;
}

/**
 * Load every active question_generator linked to atomic_concepts under the
 * specified unit_topic. When `unitTopicId` is null, returns generators
 * across all unit topics.
 *
 * Returns only generators whose `generator_type` is also present in the
 * code-level GENERATORS registry — orphan rows in the DB are skipped.
 */
async function loadEligibleGenerators(
  supabase: SupabaseClient,
  unitTopicId: string | null
): Promise<GeneratorRow[]> {
  // Step 1: load atomic concepts under the unit_topic (or all topics)
  let conceptQuery = supabase
    .from('atomic_concepts')
    .select('id, lesson_number, unit_topic_id');

  if (unitTopicId) {
    conceptQuery = conceptQuery.eq('unit_topic_id', unitTopicId);
  }

  const { data: concepts, error: conceptError } = await conceptQuery;
  if (conceptError) {
    throw new Error(`Failed to load atomic_concepts: ${conceptError.message}`);
  }
  const conceptIds = (concepts as ConceptRow[] | null ?? []).map((c) => c.id);
  if (conceptIds.length === 0) {
    return [];
  }

  // Step 2: load generators for those concepts (active only)
  const { data: generators, error: genError } = await supabase
    .from('question_generators')
    .select('id, concept_id, generator_type, answer_type, is_active')
    .in('concept_id', conceptIds)
    .eq('is_active', true);

  if (genError) {
    throw new Error(`Failed to load question_generators: ${genError.message}`);
  }

  const codeKnown = new Set(Object.keys(GENERATORS));
  return (generators as GeneratorRow[] | null ?? []).filter((g) =>
    codeKnown.has(g.generator_type)
  );
}

// -----------------------------------------------------------------------------
// INTERNAL: load static questions for a unit topic
// -----------------------------------------------------------------------------

interface StaticQuestionRow {
  id: string;
  concept_id: string;          // text lesson_number (NOT a UUID FK)
  question_text: string;
  question_latex: string | null;
  options: string[] | null;
  correct_answer: string;
  difficulty: number;
}

async function loadStaticPool(
  supabase: SupabaseClient,
  unitTopicId: string | null,
  depthMin: number,
  depthMax: number
): Promise<StaticQuestionRow[]> {
  // Resolve lesson_numbers belonging to this unit topic (static_questions.concept_id
  // is a TEXT lesson_number per Sprint 0 audit, NOT a UUID FK).
  let lessonNumbers: string[] | null = null;
  if (unitTopicId) {
    const { data: concepts } = await supabase
      .from('atomic_concepts')
      .select('lesson_number')
      .eq('unit_topic_id', unitTopicId);
    lessonNumbers = (concepts ?? []).map((c: any) => c.lesson_number);
    if (lessonNumbers.length === 0) return [];
  }

  let query = supabase
    .from('static_questions')
    .select('id, concept_id, question_text, question_latex, options, correct_answer, difficulty')
    .eq('is_active', true)
    .gte('difficulty', depthMin)
    .lte('difficulty', depthMax);

  if (lessonNumbers) {
    query = query.in('concept_id', lessonNumbers);
  }

  const { data, error } = await query;
  if (error) {
    // Static questions are optional — log and continue without them.
    console.warn('[question-delivery] static_questions load failed:', error.message);
    return [];
  }
  return (data as StaticQuestionRow[] | null) ?? [];
}

// -----------------------------------------------------------------------------
// MAIN: generateAndInsertQuestions
// -----------------------------------------------------------------------------

interface HeatQuestionInsert {
  heat_id: string;
  question_number: number;
  generator_id: string | null;
  difficulty: number;
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: string;
  solution_steps: any;          // JSONB — supabase-js accepts an array directly
  points_value: number;
  time_limit_seconds: number;
}

/**
 * Generates `questionCount` questions for the given Heat and INSERTs them.
 *
 * Mix:
 *   - Procedural generators (default majority)
 *   - Visual SVG generators (~visualRatio of total, default 20%)
 *   - Static multiple-choice from static_questions (staticRatio of total, default 0)
 *
 * Visual + static questions don't have a question_generators FK, so their
 * generator_id is null. Visual questions store the SVG in question_text and
 * a short prompt in question_latex (per Sprint 1 task spec).
 */
export async function generateAndInsertQuestions(
  supabase: SupabaseClient,
  params: GenerateQuestionsParams
): Promise<void> {
  const {
    heatId,
    unitTopicId,
    depthMin,
    depthMax,
    questionCount,
    staticRatio = 0,
    visualRatio = 0.2,
  } = params;

  if (questionCount <= 0) return;

  const visualCount = Math.min(
    questionCount,
    Math.max(0, Math.round(questionCount * visualRatio))
  );
  const staticCount = Math.min(
    questionCount - visualCount,
    Math.max(0, Math.round(questionCount * staticRatio))
  );
  const generatorCount = questionCount - visualCount - staticCount;

  // Load eligible generator catalog ahead of time
  const generators = await loadEligibleGenerators(supabase, unitTopicId);
  if (generators.length === 0 && generatorCount > 0) {
    throw new Error(
      `No active question_generators found for unit_topic ${unitTopicId ?? '(mixed)'}. ` +
      'Run Sprint 0 migration 014c (or verify the unit_topic_id) before creating Heats.'
    );
  }

  // Optionally load static pool
  const staticPool =
    staticCount > 0 ? await loadStaticPool(supabase, unitTopicId, depthMin, depthMax) : [];

  const inserts: HeatQuestionInsert[] = [];
  const recentGenerators: string[] = [];                  // sliding repeat-avoidance window

  // --- Generator-based questions ----------------------------------------------
  for (let i = 0; i < generatorCount; i++) {
    const difficulty = pickDifficulty(depthMin, depthMax);
    const generator = pickGenerator(generators, recentGenerators);
    if (!generator) {
      console.warn('[question-delivery] no generator available to pick — skipping slot', i);
      continue;
    }
    recentGenerators.push(generator.generator_type);
    if (recentGenerators.length > Math.min(8, generators.length - 1)) {
      recentGenerators.shift();
    }

    let q: GeneratedQuestion | null = null;
    try {
      q = generateQuestion(generator.generator_type, difficulty);
    } catch (err) {
      console.warn(`[question-delivery] generator ${generator.generator_type} threw:`, err);
    }
    if (!q) continue;

    inserts.push({
      heat_id: heatId,
      question_number: 0,                                  // assigned after shuffle
      generator_id: generator.id,
      difficulty,
      question_latex: q.question_latex,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      answer_type: q.answer_type,
      solution_steps: q.solution_steps ?? [],
      points_value: pointsForDifficulty(difficulty),
      time_limit_seconds: timeLimitForDifficulty(difficulty),
    });
  }

  // --- Visual questions -------------------------------------------------------
  const visualKeys = Object.keys(VISUAL_GENERATORS);
  for (let i = 0; i < visualCount; i++) {
    if (visualKeys.length === 0) break;
    const key = visualKeys[Math.floor(Math.random() * visualKeys.length)];
    let v: VisualQuestion | null = null;
    try {
      v = generateVisualQuestion(key);
    } catch (err) {
      console.warn(`[question-delivery] visual generator ${key} threw:`, err);
    }
    if (!v) continue;

    // Per Sprint 1 spec: SVG goes in question_text, short prompt in question_latex.
    // The UI layer reads question_text and detects the SVG via a leading "<svg".
    const difficulty = Math.min(4, Math.max(1, v.difficulty)) as DifficultyLevel;
    inserts.push({
      heat_id: heatId,
      question_number: 0,
      generator_id: null,
      difficulty,
      question_latex: v.question_text,                     // prompt text
      question_text: v.question_svg,                       // raw SVG markup
      correct_answer: v.correct_answer,                    // 'A'..'D'
      answer_type: 'text',                                 // MC letter
      solution_steps: {
        kind: 'visual',
        options: v.options,
        correct_answer_index: v.correct_answer_index,
        explanation: v.explanation,
        concept_id: v.concept_id,
      },
      points_value: pointsForDifficulty(difficulty),
      time_limit_seconds: 45,                              // MC is faster
    });
  }

  // --- Static multiple-choice questions ---------------------------------------
  if (staticCount > 0 && staticPool.length > 0) {
    const shuffledStatics = shuffle(staticPool).slice(0, staticCount);
    for (const sq of shuffledStatics) {
      const difficulty = Math.min(4, Math.max(1, sq.difficulty)) as DifficultyLevel;
      inserts.push({
        heat_id: heatId,
        question_number: 0,
        generator_id: null,
        difficulty,
        question_latex: sq.question_latex ?? sq.question_text,
        question_text: sq.question_text,
        correct_answer: sq.correct_answer,
        answer_type: 'text',
        solution_steps: {
          kind: 'static',
          options: sq.options ?? [],
          source_static_id: sq.id,
        },
        points_value: pointsForDifficulty(difficulty),
        time_limit_seconds: 45,
      });
    }
  }

  if (inserts.length === 0) {
    throw new Error('No questions could be generated for this Heat.');
  }

  // --- Shuffle for variety, then assign sequential question_number ------------
  const finalQuestions = shuffle(inserts).map((q, i) => ({
    ...q,
    question_number: i + 1,
  }));

  const { error } = await supabase.from('heat_questions').insert(finalQuestions);
  if (error) {
    throw new Error(`Failed to insert heat_questions: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// INTERNAL: pick a generator avoiding recent repeats
// -----------------------------------------------------------------------------

function pickGenerator(
  pool: GeneratorRow[],
  recent: string[]
): GeneratorRow | null {
  if (pool.length === 0) return null;

  const fresh = pool.filter((g) => !recent.includes(g.generator_type));
  const source = fresh.length > 0 ? fresh : pool;
  return source[Math.floor(Math.random() * source.length)];
}
