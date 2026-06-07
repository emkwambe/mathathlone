// =============================================================================
// MathAthlone — Heat Service (CRUD)
// =============================================================================
// Pure functions for Heat lifecycle operations. All Supabase queries use ONLY
// column names verified by docs/LIVE_QUERY_RESULTS.md and the Sprint 0
// migrations 009–015.
//
// Key column-name corrections (do NOT change without re-verifying live DB):
//   heat_participations
//     - questions_attempted  (NOT questions_answered)
//     - finished_at          (NOT completed_at)
//     - total_time_ms        (NOT avg_time_ms)
//     - accuracy_score       (NOT accuracy)
//     - ranking_points_earned (NOT total_points)
//     - focus_violations     (INTEGER counter, NOT JSONB)
//   No display_name, no current_question, no division_id on heat_participations.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateAndInsertQuestions } from './question-delivery';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type HeatType =
  | 'official'
  | 'practice'
  | 'sprint'
  | 'target'
  | 'championship'
  // Assessment modes added in migration 032. is_assessment=TRUE is what the
  // app actually keys off, but storing the mode in `type` keeps a single
  // source of truth for the gameplay format.
  | 'quiz'
  | 'test';

export type QuestionProfile = 'warmup' | 'standard' | 'challenge' | 'deep';

/**
 * Customizable grade band cutoffs (CTA score → letter). The defaults mirror
 * a standard 90/80/70/60 split. Teachers can tweak per-Heat in a future UI.
 */
export interface GradeBands {
  A: number;
  B: number;
  C: number;
  D: number;
}

export const DEFAULT_GRADE_BANDS: GradeBands = { A: 90, B: 80, C: 70, D: 60 };

export type HeatStatus =
  | 'scheduled'
  | 'open'
  | 'lobby'
  | 'countdown'
  | 'active'
  | 'in_progress'
  | 'calculating'
  | 'complete'
  | 'finished'
  | 'cancelled';

export type IntegrityLevel =
  | 'practice'
  | 'school'
  | 'district'
  | 'regional'
  | 'state'
  | 'national';

export type HeatScope = 'class' | 'school' | 'global';

export interface CreateHeatParams {
  division_id: string;
  unit_topic_id: string | null;           // null = "Mixed" across all topics
  /**
   * Explicit list of atomic_concepts.id selected via the topic/concept
   * tree. Overrides unit_topic_id when present. Empty/null = use
   * unit_topic_id (legacy single-topic path).
   */
  concept_ids?: string[] | null;
  depth_min: number;                      // legacy depth — still written for back-compat
  depth_max: number;
  /**
   * 3-axis profile (warmup / standard / challenge / deep). When provided,
   * question-delivery filters generators by 3-axis tags and ignores the
   * depth_min/depth_max args (it derives an effective depth range from
   * the profile instead).
   */
  question_profile?: QuestionProfile;
  type: HeatType;
  /** TRUE for Quiz and Test modes. Drives no-leaderboard / grade-card UX. */
  is_assessment?: boolean;
  /**
   * FALSE for Test heats until the teacher clicks "Release Results".
   * Defaults to TRUE for every other mode.
   */
  results_released?: boolean;
  /** Grade-band cutoffs for assessment heats. Defaults to DEFAULT_GRADE_BANDS. */
  grade_bands?: GradeBands;
  integrity_level: IntegrityLevel;
  question_count: number;
  duration_seconds: number;
  school_id?: string | null;
  class_id?: string | null;
  scope?: HeatScope;

  // -- CTA framework knobs (docs/CTA_SCORING_FRAMEWORK.md) -------------------
  // FR = free-response (procedural generator, typed answer, 2× Content weight)
  // MC = multiple choice (static + visual SVG, 1× Content weight)
  // Defaults: fr_ratio 0.4, mc_ratio 0.6, mc_visual_share 0.5.
  /** Fraction (0..1) of free-response questions. Default 0.4. */
  fr_ratio?: number;
  /** Fraction (0..1) of multiple-choice questions. Default 0.6. */
  mc_ratio?: number;
  /** Within the MC portion, share allocated to visual SVG MC. Default 0.5. */
  mc_visual_share?: number;

  synchronized_start_at?: string | null;  // ISO timestamp for high-integrity Heats
  requires_attestation?: boolean;
  lockdown_required?: boolean;
}

/**
 * Heat record shape returned from Supabase. Mirrors columns confirmed in
 * LIVE_QUERY_RESULTS.md (heats has 24 base columns + 5 added in Sprint 0).
 */
export interface Heat {
  id: string;
  code: string;
  topic_id: string | null;          // legacy FK; nullable after migration 016
  division_id: string | null;
  unit_topic_id: string | null;
  depth_min: number;
  depth_max: number;
  type: HeatType;
  scope: HeatScope;
  class_id: string | null;
  school_id: string | null;
  created_by: string;
  status: HeatStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  question_count: number;
  duration_seconds: number;
  participant_count: number | null;
  integrity_level: IntegrityLevel | null;
  requires_attestation: boolean | null;
  lockdown_required: boolean | null;
  synchronized_start_at: string | null;
  is_global: boolean | null;
  division_code: string | null;
  auto_scheduled: boolean | null;
  // Added in migration 032 — assessment mode + profile + concept multi-select.
  is_assessment: boolean | null;
  results_released: boolean | null;
  question_profile: QuestionProfile | null;
  concept_ids: string[] | null;
  grade_bands: GradeBands | null;
  created_at: string;
  updated_at: string;
}

/**
 * heat_participations row (33 columns live). Only stable, verified columns.
 */
export interface HeatParticipation {
  id: string;
  heat_id: string;
  athlete_id: string;
  status: 'queued' | 'synced' | 'competing' | 'finished' | 'voided' | 'abandoned';
  joined_at: string;
  synced_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  questions_attempted: number;
  questions_correct: number;
  first_touch_correct: number;
  total_time_ms: number;
  content_score: number | null;
  time_score: number | null;
  accuracy_score: number | null;
  cta_score: number | null;
  rank_in_heat: number | null;
  percentile: number | null;
  medal: 'gold' | 'silver' | 'bronze' | null;
  ranking_points_earned: number;
  focus_violations: number;
  focus_violation_count: number | null;
  accuracy_multiplier: number;
  voided_reason: string | null;
  integrity_score: number | null;
  is_flagged: boolean | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// HEAT CODE GENERATOR
// -----------------------------------------------------------------------------

/**
 * Generates `MA-XXXX` style codes. Excludes I/O/0/1 to avoid visual confusion.
 */
export function generateHeatCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 4; i++) {
    body += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MA-${body}`;
}

/**
 * Resolve the best available human-readable label for a Mathlete.
 *
 * Order of preference:
 *   1. users.display_name (the canonical name)
 *   2. email local-part (everything before "@") — useful when display_name
 *      was never populated (Supabase Studio insert, broken signup trigger)
 *   3. last 6 chars of the athlete_id, prefixed with "#"
 *
 * Avoids the generic "Mathlete" placeholder that hid real student identity
 * from teachers in the post-Heat leaderboard.
 */
export function resolveDisplayLabel(opts: {
  display_name?: string | null;
  email?: string | null;
  athlete_id?: string | null;
}): string {
  const name = (opts.display_name ?? '').trim();
  if (name) return name;
  const email = (opts.email ?? '').trim();
  if (email && email.includes('@')) {
    const local = email.split('@')[0]!.trim();
    if (local) return local;
  }
  const id = (opts.athlete_id ?? '').trim();
  if (id.length >= 6) return `#${id.slice(-6)}`;
  return id ? `#${id}` : 'Unknown Mathlete';
}

// -----------------------------------------------------------------------------
// INTERNAL: legacy-topic fallback
// -----------------------------------------------------------------------------
// heats.topic_id is a legacy FK to the `topics` table. Sprint 0 / Sprint 2:
//   - Migration 010 added the forward column heats.unit_topic_id.
//   - Migration 016 dropped the NOT NULL constraint on heats.topic_id.
// This helper still tries to find a legacy topic row so older queries that
// JOIN heats → topics keep working, but it returns null gracefully when
// the legacy table is empty (post-016 the column accepts NULL).

async function fetchPlaceholderTopicId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    // If the topics table is gone entirely, log and continue with NULL.
    console.warn('[heat-service] topics lookup failed:', error.message);
    return null;
  }
  return data?.id ?? null;
}

// -----------------------------------------------------------------------------
// createHeat
// -----------------------------------------------------------------------------

/**
 * Create a Heat row, generate questions, and return the created Heat.
 *
 * Flow:
 *   1. Resolve current user (must be authenticated; teacher/admin roles enforced by RLS)
 *   2. Generate a unique MA-XXXX code (retry on collision)
 *   3. INSERT into heats with status='lobby'
 *   4. Generate + insert question rows via question-delivery.ts
 *   5. Return the created Heat row
 */
export async function createHeat(
  supabase: SupabaseClient,
  params: CreateHeatParams
): Promise<Heat> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Must be signed in to create a Heat');
  }

  // Resolve legacy topic_id placeholder (heats.topic_id NOT NULL FK)
  const topicId = await fetchPlaceholderTopicId(supabase);

  // Resolve division_code for the global-lobby index
  let divisionCode: string | null = null;
  if (params.division_id) {
    const { data: division } = await supabase
      .from('divisions')
      .select('code')
      .eq('id', params.division_id)
      .maybeSingle();
    divisionCode = division?.code ?? null;
  }

  // Generate a unique heat code, retrying on collision
  let code = generateHeatCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data: existing } = await supabase
      .from('heats')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) break;
    code = generateHeatCode();
  }

  // Quiz/Test modes are assessments. Test heats start with results gated
  // until the teacher clicks "Release Results"; everything else releases
  // immediately.
  const isAssessment = params.is_assessment ?? (params.type === 'quiz' || params.type === 'test');
  const resultsReleased = params.results_released ?? (params.type !== 'test');

  const insertPayload = {
    code,
    topic_id: topicId,                                    // legacy FK satisfied
    division_id: params.division_id,
    unit_topic_id: params.unit_topic_id,                  // null => mixed
    depth_min: params.depth_min,
    depth_max: params.depth_max,
    type: params.type,
    scope: params.scope ?? 'class',
    class_id: params.class_id ?? null,
    school_id: params.school_id ?? null,
    created_by: user.id,
    status: 'lobby' as HeatStatus,
    question_count: params.question_count,
    duration_seconds: params.duration_seconds,
    integrity_level: params.integrity_level,
    requires_attestation: params.requires_attestation ?? false,
    lockdown_required: params.lockdown_required ?? false,
    synchronized_start_at: params.synchronized_start_at ?? null,
    is_global: false,
    division_code: divisionCode,
    auto_scheduled: false,
    // Heat design overhaul (migration 032)
    is_assessment: isAssessment,
    results_released: resultsReleased,
    question_profile: params.question_profile ?? 'standard',
    concept_ids: params.concept_ids && params.concept_ids.length > 0 ? params.concept_ids : null,
    grade_bands: params.grade_bands ?? DEFAULT_GRADE_BANDS,
  };

  const { data: heat, error: insertError } = await supabase
    .from('heats')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) {
    throw new Error(`Failed to create Heat: ${insertError.message}`);
  }

  // Generate and insert questions for this Heat. Defaults (FR 0.4 / MC 0.6
  // with an even MC split) come from the CTA framework. Callers may override
  // via fr_ratio / mc_ratio / mc_visual_share — but if any value is omitted,
  // question-delivery falls back to the framework defaults.
  try {
    await generateAndInsertQuestions(supabase, {
      heatId: heat.id,
      unitTopicId: params.unit_topic_id,
      conceptIds: params.concept_ids ?? null,
      profile: params.question_profile,
      depthMin: params.depth_min,
      depthMax: params.depth_max,
      questionCount: params.question_count,
      frRatio: params.fr_ratio,
      mcRatio: params.mc_ratio,
      mcVisualShare: params.mc_visual_share,
    });
  } catch (err) {
    // If question generation fails, mark the Heat cancelled rather than
    // leaving a zombie row. The caller can retry from scratch.
    await supabase.from('heats').update({ status: 'cancelled' }).eq('id', heat.id);
    throw err;
  }

  return heat as Heat;
}

// -----------------------------------------------------------------------------
// joinHeat
// -----------------------------------------------------------------------------

/**
 * Athlete joins a Heat by its code. Creates a heat_participations row and
 * increments the heat's participant_count.
 *
 * Returns the participation augmented with display_name (sourced from users
 * via a JOIN — heat_participations has no display_name column).
 */
export interface HeatParticipationWithDisplay extends HeatParticipation {
  display_name: string;
}

export async function joinHeat(
  supabase: SupabaseClient,
  code: string
): Promise<{ heat: Heat; participation: HeatParticipationWithDisplay }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Must be signed in to join a Heat');
  }

  // Look up Heat by code (case-insensitive for user convenience)
  const normalizedCode = code.trim().toUpperCase();
  const { data: heat, error: heatError } = await supabase
    .from('heats')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (heatError) {
    throw new Error(`Failed to look up Heat: ${heatError.message}`);
  }
  if (!heat) {
    throw new Error(`Heat ${normalizedCode} not found`);
  }

  // Allow joins in lobby / open / scheduled state
  const joinableStatuses: HeatStatus[] = ['lobby', 'open', 'scheduled'];
  if (!joinableStatuses.includes(heat.status as HeatStatus)) {
    throw new Error(`This Heat is not accepting new Mathletes (status: ${heat.status})`);
  }

  // If user already joined, return the existing participation (idempotent join)
  const { data: existing } = await supabase
    .from('heat_participations')
    .select('*')
    .eq('heat_id', heat.id)
    .eq('athlete_id', user.id)
    .maybeSingle();

  if (existing) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', user.id)
      .maybeSingle();
    return {
      heat: heat as Heat,
      participation: {
        ...(existing as HeatParticipation),
        display_name: resolveDisplayLabel({
          display_name: profile?.display_name,
          email: profile?.email,
          athlete_id: user.id,
        }),
      },
    };
  }

  // Fresh participation row — only specify columns confirmed live; let
  // counters/scores default. Note: no display_name, no current_question,
  // no division_id columns on heat_participations.
  const { data: participation, error: participationError } = await supabase
    .from('heat_participations')
    .insert({
      heat_id: heat.id,
      athlete_id: user.id,
      status: 'queued',
    })
    .select('*')
    .single();

  if (participationError) {
    throw new Error(`Failed to join Heat: ${participationError.message}`);
  }

  // Pull display_name from users (canonical source, not heat_participations).
  // Also pull email so we have a usable fallback for accounts with no name set.
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .maybeSingle();
  const displayName = resolveDisplayLabel({
    display_name: profile?.display_name,
    email: profile?.email,
    athlete_id: user.id,
  });

  // Best-effort bump of participant_count (advisory only — RPC would be safer).
  const newCount = (heat.participant_count ?? 0) + 1;
  await supabase
    .from('heats')
    .update({ participant_count: newCount })
    .eq('id', heat.id);

  return {
    heat: heat as Heat,
    participation: { ...(participation as HeatParticipation), display_name: displayName },
  };
}

// -----------------------------------------------------------------------------
// startHeat
// -----------------------------------------------------------------------------

/**
 * Transition heats.status: lobby → countdown → active.
 * Waits `countdownSeconds` before flipping to 'active' so all subscribers
 * receive the lifecycle in order.
 */
export async function startHeat(
  supabase: SupabaseClient,
  heatId: string,
  countdownSeconds: number = 5
): Promise<void> {
  // Phase 1: countdown
  const { error: countdownError } = await supabase
    .from('heats')
    .update({ status: 'countdown' })
    .eq('id', heatId);
  if (countdownError) {
    throw new Error(`Failed to start countdown: ${countdownError.message}`);
  }

  await new Promise<void>((resolve) => setTimeout(resolve, countdownSeconds * 1000));

  // Phase 2: active + record started_at
  const { error: activeError } = await supabase
    .from('heats')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', heatId);
  if (activeError) {
    throw new Error(`Failed to start Heat: ${activeError.message}`);
  }
}

// -----------------------------------------------------------------------------
// endHeat
// -----------------------------------------------------------------------------

/**
 * Transition heats.status: → calculating → run scoring → complete.
 * The scoring service updates heat_participations and heat_awards.
 */
export async function endHeat(supabase: SupabaseClient, heatId: string): Promise<void> {
  // Pre-flight: any participant still in 'queued' (joined but never started
  // a question) gets advanced to 'finished' with zero scores. Without this,
  // the scoring service leaves them in 'queued' forever and the leaderboard
  // shows phantom participants who can't progress.
  await supabase
    .from('heat_participations')
    .update({
      status: 'finished',
      finished_at: new Date().toISOString(),
      questions_attempted: 0,
      questions_correct: 0,
      cta_score: 0,
      content_score: 0,
      time_score: 0,
      accuracy_score: 0,
    })
    .eq('heat_id', heatId)
    .eq('status', 'queued');

  // Phase 1: calculating
  const { error: calcError } = await supabase
    .from('heats')
    .update({
      status: 'calculating',
      ended_at: new Date().toISOString(),
    })
    .eq('id', heatId);
  if (calcError) {
    throw new Error(`Failed to mark Heat ending: ${calcError.message}`);
  }

  // Defer the heavy lifting to scoring-service.ts to keep this module focused.
  const { calculateHeatResults } = await import('./scoring-service');
  await calculateHeatResults(supabase, heatId);

  // Phase 2: complete
  const { error: completeError } = await supabase
    .from('heats')
    .update({ status: 'complete' })
    .eq('id', heatId);
  if (completeError) {
    throw new Error(`Failed to finalize Heat: ${completeError.message}`);
  }
}

// -----------------------------------------------------------------------------
// FETCH HELPERS
// -----------------------------------------------------------------------------

/**
 * Look up a Heat by code. Returns null if not found.
 */
export async function getHeatByCode(
  supabase: SupabaseClient,
  code: string
): Promise<Heat | null> {
  const { data, error } = await supabase
    .from('heats')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw new Error(`Heat lookup failed: ${error.message}`);
  return (data as Heat | null) ?? null;
}

/**
 * Return all participations in a Heat, augmented with users.display_name.
 * Used by the lobby UI for the participants list.
 */
export async function listHeatParticipants(
  supabase: SupabaseClient,
  heatId: string
): Promise<HeatParticipationWithDisplay[]> {
  // JOIN email so resolveDisplayLabel can fall back to the local-part when
  // display_name is null/empty (rather than collapsing every such row to
  // the generic "Mathlete" placeholder, which hid real names on the teacher
  // monitor + leaderboard).
  const { data, error } = await supabase
    .from('heat_participations')
    .select('*, users:athlete_id (display_name, email)')
    .eq('heat_id', heatId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(`Failed to list participants: ${error.message}`);

  return (data ?? []).map((row: any) => {
    const { users, ...rest } = row;
    return {
      ...(rest as HeatParticipation),
      display_name: resolveDisplayLabel({
        display_name: users?.display_name,
        email: users?.email,
        athlete_id: rest.athlete_id,
      }),
    };
  });
}
