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

/**
 * Maps each visual generator key to a human-readable concept name. This is
 * stored alongside the visual question in heat_questions.solution_steps so
 * the concept-mastery heatmap in TeacherResults / StudentResults can bucket
 * visual questions by their actual concept (not the generic "Visual questions"
 * label). Keys match the entries in visual-generators.ts VISUAL_GENERATORS.
 */
const VISUAL_CONCEPT_NAME: Record<string, string> = {
  inequality_number_line: 'Graphing Inequalities',
  vertical_line_test:     'Vertical Line Test',
  slope_intercept_graph:  'Graphing Slope-Intercept',
  horiz_vert_lines:       'Horizontal/Vertical Lines',
  two_var_inequality:     'Graphing 2-Variable Inequalities',
  compare_functions:      'Comparing Functions',
  system_graphing:        'Solving Systems by Graphing',
  system_inequalities:    'System of Inequalities',
  scatter_plot:           'Interpreting Scatter Plots',
  transformation_type:    'Transformations',
  line_symmetry:          'Line Symmetry',
  rotational_symmetry:    'Rotational Symmetry',
};

// -----------------------------------------------------------------------------
// PARAMS
// -----------------------------------------------------------------------------

// QuestionProfile is the source-of-truth type — heat-service.ts re-exports
// it for the create page. We import it here to keep the union in one place.
import type { QuestionProfile } from './heat-service';
export type { QuestionProfile };

export interface GenerateQuestionsParams {
  heatId: string;
  /**
   * Legacy single-topic targeting. Still honored when `conceptIds` is not
   * supplied — kept so old createHeat callers and migrations don't break.
   * null = mixed across all unit topics for the course.
   */
  unitTopicId: string | null;
  /**
   * Explicit list of atomic_concepts.id values. Overrides unitTopicId when
   * present. Empty array or null = no concept filter (use unitTopicId or
   * fall through to all generators).
   */
  conceptIds?: string[] | null;
  /**
   * 3-axis profile that drives question selection. When absent, falls
   * back to depthMin/depthMax. Profiles map to existing DB tag values
   * (see PROFILE_AXIS_FILTER below) — the user-facing vocabulary is
   * Warm-Up / Standard / Challenge / Deep.
   */
  profile?: QuestionProfile;
  depthMin: number;                    // 1..4 (used as fallback)
  depthMax: number;                    // 1..4 (used as fallback)
  questionCount: number;

  // -- CTA framework knobs (docs/CTA_SCORING_FRAMEWORK.md) -------------------
  // Heats are composed of two question families:
  //   FR (free-response, generator-based, typed answer)
  //   MC (multiple-choice, split evenly between static and visual)
  // The CTA Content formula weights FR correct × 2 and MC correct × 1, so
  // the FR floor of 40% guarantees a meaningful Content signal even when
  // the bulk of the Heat is accessibility-friendly MC.

  /** Fraction (0..1) of free-response (procedural generator) questions. Default 0.4. */
  frRatio?: number;
  /** Fraction (0..1) of multiple-choice questions. Default 0.6. */
  mcRatio?: number;
  /**
   * Within the MC portion, the share that should be VISUAL (SVG) MC. The rest
   * is static MC pulled from `static_questions`. Default 0.5 — i.e. an even
   * split. Backfill kicks in if either pool is short.
   */
  mcVisualShare?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile → 3-axis tag mapping. Keep the DB vocabulary as the source of
// truth (procedural / conceptual / application / reasoning + low / medium /
// high), and translate the user-facing profile to that vocab here.
//
// `cognitive_demand` and `complexity` each list acceptable values. `context`
// can be null (filter not applied) or a single literal value.
//
// The relaxation chain (see filterGeneratorsByProfile) drops context first,
// then complexity, then cognitive_demand if the exact-match pool is too small.
// ─────────────────────────────────────────────────────────────────────────────
const PROFILE_AXIS_FILTER: Record<
  QuestionProfile,
  { cognitive_demand: string[]; complexity: string[]; context: string | null }
> = {
  warmup:    { cognitive_demand: ['procedural'],  complexity: ['low'],    context: 'abstract'   },
  standard:  { cognitive_demand: ['application'], complexity: ['medium'], context: null         },
  challenge: { cognitive_demand: ['reasoning'],   complexity: ['medium'], context: null         },
  deep:      { cognitive_demand: ['reasoning'],   complexity: ['high'],   context: 'real_world' },
};

// Profile → depth-range fallback for generators without 3-axis tags
// (e.g. the legacy NCM1 pool). Matches the user-spec mapping:
//   warmup → depth 1-2, standard → 2-3, challenge → 3-4, deep → 4
const PROFILE_DEPTH_FALLBACK: Record<QuestionProfile, [number, number]> = {
  warmup:    [1, 2],
  standard:  [2, 3],
  challenge: [3, 4],
  deep:      [4, 4],
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Canonical UUID v1-v5 shape check. Used to guard generator_id values before
 * they're sent to Supabase — heat_questions.generator_id is an FK to
 * question_generators.id, and any non-UUID value (or non-existent UUID)
 * triggers a FK violation at insert time.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
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
  /** 3-axis tags. May be NULL on legacy NCM1 rows — depth fallback applies. */
  cognitive_demand?: string | null;
  complexity?: string | null;
  context?: string | null;
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
  unitTopicId: string | null,
  explicitConceptIds?: string[] | null
): Promise<GeneratorRow[]> {
  // Step 1: resolve the concept_id set.
  //   - If explicitConceptIds is non-empty, use it directly (multi-select).
  //   - Else query atomic_concepts by unit_topic_id (legacy single-topic).
  //   - Else (both null) → all concepts across all topics.
  let conceptIds: string[];
  if (explicitConceptIds && explicitConceptIds.length > 0) {
    conceptIds = explicitConceptIds;
  } else {
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
    conceptIds = (concepts as ConceptRow[] | null ?? []).map((c) => c.id);
  }
  if (conceptIds.length === 0) {
    return [];
  }

  // Step 2: load generators for those concepts (active only). Also pull the
  // 3-axis tags so the profile filter has data to act on.
  const { data: generators, error: genError } = await supabase
    .from('question_generators')
    .select('id, concept_id, generator_type, answer_type, is_active, cognitive_demand, complexity, context')
    .in('concept_id', conceptIds)
    .eq('is_active', true);

  if (genError) {
    // question_generators table may be empty or not yet seeded —
    // return empty array so caller falls back to static pool
    console.warn(
      `[question-delivery] question_generators query failed — falling back to static pool. ` +
      `Error: ${genError.message}`
    );
    return [];
  }

  const codeKnown = new Set(Object.keys(GENERATORS));
  const all = (generators as GeneratorRow[] | null) ?? [];

  // Defensive filter: only keep rows whose id is a real UUID AND whose
  // generator_type matches a known code generator. This protects the
  // downstream INSERT from FK violations on heat_questions.generator_id.
  const filtered = all.filter(
    (g) => isUuid(g.id) && codeKnown.has(g.generator_type)
  );

  const dropped = all.length - filtered.length;
  if (dropped > 0) {
    console.warn(
      `[question-delivery] Skipped ${dropped} question_generators row(s) — ` +
        'either id is not a UUID or generator_type is unknown to the code. ' +
        'Re-run Sprint 0 migration 014c if this is unexpected.'
    );
  }
  return filtered;
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
  depthMax: number,
  explicitConceptIds?: string[] | null
): Promise<StaticQuestionRow[]> {
  // Resolve lesson_numbers belonging to the target concept set
  // (static_questions.concept_id is a TEXT lesson_number per Sprint 0 audit,
  // NOT a UUID FK). When the caller passed an explicit conceptIds array,
  // resolve those concept rows' lesson_numbers. Otherwise fall back to the
  // legacy unit-topic-wide query.
  let lessonNumbers: string[] | null = null;
  if (explicitConceptIds && explicitConceptIds.length > 0) {
    const { data: concepts } = await supabase
      .from('atomic_concepts')
      .select('lesson_number')
      .in('id', explicitConceptIds);
    lessonNumbers = (concepts ?? []).map((c: any) => c.lesson_number);
    if (lessonNumbers.length === 0) return [];
  } else if (unitTopicId) {
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
/**
 * Filter a generator pool by 3-axis tags matching the chosen profile.
 *
 * Generators with NULL on any axis are treated as PROFILE-AGNOSTIC — they
 * pass through every profile (the legacy NCM1 path uses the depth-range
 * fallback at generation time instead). This is important so a course
 * with zero 3-axis-tagged generators (NCM1) keeps working with the new UI.
 *
 * Relaxation chain when the strict match yields too few generators:
 *   1. Strict (cognitive_demand AND complexity AND context all match)
 *   2. Drop context filter
 *   3. Drop complexity filter
 *   4. Drop cognitive_demand filter (everything passes — depth-only)
 *
 * `minTagged` controls when we relax: if the strict-tagged pool has at
 * least this many generators, we stop. Defaults to a conservative 4 so
 * even small heats have a few distinct generator options after dedupe.
 */
function filterGeneratorsByProfile(
  all: GeneratorRow[],
  profile: QuestionProfile,
  minTagged: number = 4
): GeneratorRow[] {
  const f = PROFILE_AXIS_FILTER[profile];
  // Generators with no tags pass unconditionally — they'll be generated
  // with the profile-mapped depth range.
  const untagged = all.filter((g) => !g.cognitive_demand);
  const tagged = all.filter((g) => !!g.cognitive_demand);

  const passContext = (g: GeneratorRow) => !f.context || g.context === f.context;
  const passComplexity = (g: GeneratorRow) => !g.complexity || f.complexity.includes(g.complexity);
  const passDemand = (g: GeneratorRow) => !g.cognitive_demand || f.cognitive_demand.includes(g.cognitive_demand);

  // 1. Strict
  let strict = tagged.filter((g) => passDemand(g) && passComplexity(g) && passContext(g));
  if (strict.length + untagged.length >= minTagged) {
    console.log(`[question-delivery] profile=${profile} strict match: ${strict.length} tagged + ${untagged.length} untagged`);
    return [...strict, ...untagged];
  }
  // 2. Relax context
  let relaxed = tagged.filter((g) => passDemand(g) && passComplexity(g));
  console.warn(`[question-delivery] relaxed context filter, pool: ${strict.length}→${relaxed.length} tagged`);
  if (relaxed.length + untagged.length >= minTagged) {
    return [...relaxed, ...untagged];
  }
  // 3. Relax complexity
  let demandOnly = tagged.filter((g) => passDemand(g));
  console.warn(`[question-delivery] relaxed complexity filter, pool: ${relaxed.length}→${demandOnly.length} tagged`);
  if (demandOnly.length + untagged.length >= minTagged) {
    return [...demandOnly, ...untagged];
  }
  // 4. Final fallback — accept every tagged generator (depth-only).
  console.warn(`[question-delivery] relaxed cognitive_demand filter, pool: ${demandOnly.length}→${tagged.length} tagged`);
  return [...tagged, ...untagged];
}

export async function generateAndInsertQuestions(
  supabase: SupabaseClient,
  params: GenerateQuestionsParams
): Promise<void> {
  const {
    heatId,
    unitTopicId,
    questionCount,
    profile,
    conceptIds,
  } = params;

  // Profile, when supplied, drives the effective depth range used at
  // generation time. Falls back to the explicit depthMin/depthMax args so
  // legacy callers (no profile) keep working unchanged.
  const [depthMin, depthMax] = profile
    ? PROFILE_DEPTH_FALLBACK[profile]
    : [params.depthMin, params.depthMax];

  if (questionCount <= 0) return;

  // ── Resolve FR / MC ratios (defaults from the CTA framework) ──────────────
  // The user may pass either, both, or neither. We clamp to [0,1] and
  // normalize so they always sum to 1 — a defensive measure against config
  // typos like { frRatio: 0.4, mcRatio: 0.7 } that would otherwise produce
  // more questions than questionCount.
  let frRatio = params.frRatio ?? (params.mcRatio !== undefined ? 1 - params.mcRatio : 0.4);
  let mcRatio = params.mcRatio ?? (params.frRatio !== undefined ? 1 - params.frRatio : 0.6);
  frRatio = clamp01(frRatio);
  mcRatio = clamp01(mcRatio);
  const ratioSum = frRatio + mcRatio;
  if (ratioSum <= 0) {
    frRatio = 0.4;
    mcRatio = 0.6;
  } else if (Math.abs(ratioSum - 1) > 0.001) {
    frRatio = frRatio / ratioSum;
    mcRatio = mcRatio / ratioSum;
  }
  const mcVisualShare = clamp01(params.mcVisualShare ?? 0.5);

  console.log('[question-delivery] ratios:', { frRatio, mcRatio, mcVisualShare });

  // ── Target counts (before backfill) ───────────────────────────────────────
  // We round MC up so the spec "60% MC of 20 = 12 MC" holds exactly even when
  // frRatio×questionCount has rounding ties.
  let mcTargetTotal = Math.round(questionCount * mcRatio);
  if (mcTargetTotal > questionCount) mcTargetTotal = questionCount;
  let frTarget = questionCount - mcTargetTotal;

  let visualTarget = Math.round(mcTargetTotal * mcVisualShare);
  if (visualTarget > mcTargetTotal) visualTarget = mcTargetTotal;
  let staticTarget = mcTargetTotal - visualTarget;

  console.log('[question-delivery] targets:', { frTarget, staticTarget, visualTarget });

  // ── Load pools ────────────────────────────────────────────────────────────
  // conceptIds (when provided) takes precedence over unitTopicId; profile
  // filters by 3-axis tags with the relaxation chain in
  // filterGeneratorsByProfile().
  const rawGenerators = await loadEligibleGenerators(supabase, unitTopicId, conceptIds ?? null);
  const generators = profile
    ? filterGeneratorsByProfile(rawGenerators, profile)
    : rawGenerators;
  if (profile) {
    console.log(`[question-delivery] profile=${profile} → ${rawGenerators.length} raw, ${generators.length} after filter`);
  }
  if (generators.length === 0 && frTarget > 0) {
    // No generators seeded yet — redirect FR slots to static pool
    console.warn(
      `[question-delivery] No generators for unit_topic ${unitTopicId ?? '(mixed)'} ` +
      `— redirecting ${frTarget} FR slot(s) to static pool.`
    );
    staticTarget += frTarget;
    frTarget = 0;
  }

  // Static pool comes from the static_questions table — finite, often small.
  const staticPool =
    staticTarget > 0
      ? await loadStaticPool(supabase, unitTopicId, depthMin, depthMax, conceptIds ?? null)
      : [];

  // Visual pool — each visual generator can be called repeatedly with
  // different random seeds, but we treat the distinct-generator count as the
  // practical cap to keep questions varied within a Heat.
  const visualKeyCount = Object.keys(VISUAL_GENERATORS).length;

  console.log('[question-delivery] pools:', { generators: generators.length, staticPool: staticPool.length, visualKeyCount });

  // ── Backfill spillover ────────────────────────────────────────────────────
  // Per the spec: if a pool is short, push the shortfall to the OTHER MC pool.
  // If both MC pools are exhausted, fall back to FR (procedural generators).
  // Generators are effectively unbounded so they always absorb whatever's left.
  const staticAvailable = staticPool.length;
  const visualAvailable = visualKeyCount;

  const staticShort = Math.max(0, staticTarget - staticAvailable);
  if (staticShort > 0) {
    // Try to absorb the shortfall in visual
    const visualHeadroom = visualAvailable - visualTarget;
    const visualTake = Math.min(staticShort, Math.max(0, visualHeadroom));
    visualTarget += visualTake;
    staticTarget -= visualTake;
    // Any leftover spills to FR
    const leftover = staticShort - visualTake;
    if (leftover > 0) {
      frTarget += leftover;
      staticTarget -= leftover;
    }
  }

  const visualShort = Math.max(0, visualTarget - visualAvailable);
  if (visualShort > 0) {
    // Try static next (using fresh availability, since static may not have been topped)
    const staticHeadroom = staticAvailable - staticTarget;
    const staticTake = Math.min(visualShort, Math.max(0, staticHeadroom));
    staticTarget += staticTake;
    visualTarget -= staticTake;
    const leftover = visualShort - staticTake;
    if (leftover > 0) {
      frTarget += leftover;
      visualTarget -= leftover;
    }
  }

  // Final clamps in case of rounding drift
  frTarget = Math.max(0, frTarget);
  staticTarget = Math.max(0, Math.min(staticTarget, staticAvailable));
  visualTarget = Math.max(0, Math.min(visualTarget, visualAvailable));
  const slotSum = frTarget + staticTarget + visualTarget;
  if (slotSum < questionCount) {
    // Last-ditch: top up with FR (generators are unbounded)
    frTarget += questionCount - slotSum;
  } else if (slotSum > questionCount) {
    // Trim from MC first (FR carries higher Content weight, preserve it)
    let overshoot = slotSum - questionCount;
    const visualTrim = Math.min(overshoot, visualTarget);
    visualTarget -= visualTrim;
    overshoot -= visualTrim;
    const staticTrim = Math.min(overshoot, staticTarget);
    staticTarget -= staticTrim;
    overshoot -= staticTrim;
    if (overshoot > 0) frTarget = Math.max(0, frTarget - overshoot);
  }

  console.log('[question-delivery] after backfill:', { frTarget, staticTarget, visualTarget });

  // Map the post-backfill targets back into the legacy variable names used
  // by the generation loops below (no behavior change inside the loops).
  const generatorCount = frTarget;
  const visualCount = visualTarget;
  const staticCount = staticTarget;

  if (generatorCount > 0 && generators.length === 0) {
    console.warn(
      `[question-delivery] Cannot fulfill ${generatorCount} FR slot(s) — ` +
      `no generators available. These slots were already redirected to static.`
    );
  }

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

    // FK-safety: refuse to push a row whose generator_id isn't a valid UUID.
    // loadEligibleGenerators() already filters these out, but we guard again
    // here because a stale cache / replication lag / type-coercion bug would
    // surface as an FK violation on heat_questions.generator_id at insert.
    if (!isUuid(generator.id)) {
      console.error(
        '[question-delivery] generator row has non-UUID id — skipping:',
        { generator_type: generator.generator_type, id: generator.id }
      );
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

    const generatorUuid: string = generator.id;            // narrowed by isUuid()

    inserts.push({
      heat_id: heatId,
      question_number: 0,                                  // assigned after shuffle
      generator_id: generatorUuid,                         // verified UUID from question_generators.id
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
  // Shuffle without replacement so each visual generator is used at most once
  // per Heat — this matches the cap used in the backfill math above and
  // keeps the question set varied.
  const visualKeys = shuffle(Object.keys(VISUAL_GENERATORS)).slice(0, visualCount);
  for (let i = 0; i < visualKeys.length; i++) {
    const key = visualKeys[i]!;
    let v: VisualQuestion | null = null;
    try {
      v = generateVisualQuestion(key);
    } catch (err) {
      console.warn(`[question-delivery] visual generator ${key} threw:`, err);
    }
    if (!v) continue;

    // Per Sprint 1 spec: SVG goes in question_text, short prompt in question_latex.
    // The UI layer reads question_text and detects the SVG via a leading "<svg".
    //
    // Visual questions have NO row in question_generators — they're generated
    // entirely in code by visual-generators.ts. generator_id MUST be null so
    // the heat_questions.generator_id FK isn't violated.
    const difficulty = Math.min(4, Math.max(1, v.difficulty)) as DifficultyLevel;
    const conceptName =
      VISUAL_CONCEPT_NAME[key] ?? v.concept_name ?? 'Visual questions';
    const visualRow: HeatQuestionInsert = {
      heat_id: heatId,
      question_number: 0,
      generator_id: null,                                  // visual: no question_generators row
      difficulty,
      question_latex: v.question_text,                     // prompt text
      question_text: v.question_svg,                       // raw SVG markup
      correct_answer: v.correct_answer,                    // 'A'..'D'
      answer_type: 'text',                                 // MC letter
      solution_steps: {
        kind: 'visual',
        // Persist the visual-generator identity so concept-mastery bucketing
        // can name this row correctly (instead of a generic "Visual questions").
        generator_key: key,
        concept_name: conceptName,
        options: v.options,
        correct_answer_index: v.correct_answer_index,
        explanation: v.explanation,
        concept_id: v.concept_id,
      },
      points_value: pointsForDifficulty(difficulty),
      time_limit_seconds: 45,                              // MC is faster
    };
    inserts.push(visualRow);
  }

  // --- Static multiple-choice questions ---------------------------------------
  if (staticCount > 0 && staticPool.length > 0) {
    const shuffledStatics = shuffle(staticPool).slice(0, staticCount);
    for (const sq of shuffledStatics) {
      const difficulty = Math.min(4, Math.max(1, sq.difficulty)) as DifficultyLevel;

      // Static questions live in their own table (static_questions) — they
      // also have NO row in question_generators. generator_id MUST be null.
      const staticRow: HeatQuestionInsert = {
        heat_id: heatId,
        question_number: 0,
        generator_id: null,                                // static: no question_generators row
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
      };
      inserts.push(staticRow);
    }
  }

  console.log('[question-delivery] final inserts:', {
    total: inserts.length,
    fr: inserts.filter(i => i.generator_id !== null).length,
    mc: inserts.filter(i => i.generator_id === null).length,
  });

  if (inserts.length === 0) {
    throw new Error('No questions could be generated for this Heat.');
  }

  // --- FK-safety sweep: every generator_id must be either NULL or a UUID -----
  // Catches anything that slipped past the per-source guards above. Rows that
  // fail this check would otherwise produce a FK violation on
  // heat_questions.generator_id → question_generators.id.
  const safeInserts = inserts.filter((row) => {
    if (row.generator_id === null) return true;
    if (isUuid(row.generator_id)) return true;
    console.error(
      '[question-delivery] dropping row with malformed generator_id:',
      { generator_id: row.generator_id, type: typeof row.generator_id }
    );
    return false;
  });
  if (safeInserts.length === 0) {
    throw new Error(
      'All candidate questions were rejected (invalid generator_id). ' +
        'Verify question_generators is seeded by migration 014c.'
    );
  }

  // --- Pre-flight FK probe ---------------------------------------------------
  // Before sending the batch, verify every non-null generator_id ACTUALLY
  // exists in question_generators. If any are missing, the FK constraint on
  // heat_questions.generator_id is likely targeting a different table (e.g.
  // question_generators_legacy). Run migration 017_fix_heat_questions_fk.sql
  // to re-bind the constraint.
  const distinctGeneratorIds = Array.from(
    new Set(
      safeInserts
        .map((r) => r.generator_id)
        .filter((id): id is string => id !== null)
    )
  );
  if (distinctGeneratorIds.length > 0) {
    const { data: existingRows, error: probeError } = await supabase
      .from('question_generators')
      .select('id')
      .in('id', distinctGeneratorIds);

    if (probeError) {
      console.warn(
        '[question-delivery] FK pre-flight probe failed (will attempt insert anyway):',
        probeError.message
      );
    } else {
      const found = new Set((existingRows ?? []).map((r: any) => r.id as string));
      const missing = distinctGeneratorIds.filter((id) => !found.has(id));
      if (missing.length > 0) {
        console.error(
          '[question-delivery] FK pre-flight FAILED: ' +
            `${missing.length}/${distinctGeneratorIds.length} generator_id(s) selected ` +
            'from question_generators are NOT visible to a subsequent INSERT. ' +
            'This almost always means the heat_questions.generator_id FK is bound ' +
            'to the wrong table (typically question_generators_legacy). ' +
            'Apply supabase/migrations/017_fix_heat_questions_fk.sql to repair the FK. ' +
            'Missing UUIDs: ' + JSON.stringify(missing.slice(0, 5))
        );
        throw new Error(
          'Cannot insert heat_questions: the generator_id FK is pointing at the ' +
            'wrong table. Run migration 017_fix_heat_questions_fk.sql in Supabase.'
        );
      }
    }
  }

  // --- Shuffle for variety, then assign sequential question_number ------------
  const finalQuestions = shuffle(safeInserts).map((q, i) => ({
    ...q,
    question_number: i + 1,
  }));

  const { error } = await supabase.from('heat_questions').insert(finalQuestions);
  if (error) {
    // Diagnostic: show how many rows had a generator_id vs null, and a sample
    // of the first non-null id. Helps triage FK violations against the live
    // question_generators table.
    const withId = finalQuestions.filter((q) => q.generator_id !== null).length;
    const sampleIds = finalQuestions
      .map((q) => q.generator_id)
      .filter((id): id is string => id !== null)
      .slice(0, 3);
    console.error(
      `[question-delivery] heat_questions insert failed (${withId} with generator_id, ` +
        `${finalQuestions.length - withId} null). Sample generator_ids: ${JSON.stringify(sampleIds)}. ` +
        `Supabase error: ${error.message}`
    );
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
