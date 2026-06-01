// =============================================================================
// MathAthlone Heat Engine — Thin Wrapper
// =============================================================================
// The legacy monolithic HeatEngine class has been split into focused modules:
//
//   heat-service.ts       — CRUD: createHeat / joinHeat / startHeat / endHeat
//   question-delivery.ts  — generateAndInsertQuestions
//   scoring-service.ts    — calculateHeatResults / scoreSubmission
//   heat-realtime.ts      — Supabase channel subscriptions + React hooks
//
// This file:
//   1. Re-exports the public service surface from those modules
//   2. Keeps `createHeatEngine(supabase)` returning a backward-compatible
//      object that the existing /compete pages call into. The object exposes
//      the legacy .on/.off/.joinHeat/.submitAnswer/.getCurrent* API but
//      delegates to the new service functions internally and maps legacy
//      column names (questions_answered, total_points, etc.) on output.
// =============================================================================

import type {
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js';
import { validateAnswer, type ValidationResult } from './validation';
import { scoreSubmission, type SubmissionScore } from './scoring-service';
import {
  joinHeat as joinHeatService,
  startHeat as startHeatService,
  endHeat as endHeatService,
  createHeat as createHeatService,
  getHeatByCode,
  listHeatParticipants,
  generateHeatCode,
  type Heat,
  type HeatStatus,
  type HeatType,
  type HeatParticipation,
  type HeatParticipationWithDisplay,
  type CreateHeatParams,
} from './heat-service';
import {
  generateAndInsertQuestions,
  type GenerateQuestionsParams,
} from './question-delivery';
import { calculateHeatResults } from './scoring-service';
import {
  subscribeToHeat,
  broadcastSubmission,
} from './heat-realtime';

// -----------------------------------------------------------------------------
// PUBLIC RE-EXPORTS (forward path — prefer importing these in new code)
// -----------------------------------------------------------------------------

export {
  createHeatService as createHeat,
  joinHeatService as joinHeatViaService,
  startHeatService as startHeat,
  endHeatService as endHeat,
  getHeatByCode,
  listHeatParticipants,
  generateHeatCode,
  generateAndInsertQuestions,
  calculateHeatResults,
  subscribeToHeat,
  broadcastSubmission,
};
export type {
  Heat,
  HeatStatus,
  HeatType,
  HeatParticipation,
  HeatParticipationWithDisplay,
  CreateHeatParams,
  GenerateQuestionsParams,
};
export { useHeatRealtime, useHeatParticipants, useHeatSubmissions } from './heat-realtime';

// -----------------------------------------------------------------------------
// LEGACY SHAPE TYPES (kept for backward compat with existing components)
// -----------------------------------------------------------------------------

export interface LegacyHeat extends Heat {
  /** Heats have no `name` column in the DB; this is a UI label fallback. */
  name?: string;
}

export interface LegacyHeatParticipation extends HeatParticipationWithDisplay {
  /** Alias for heat_participations.ranking_points_earned. */
  total_points: number;
  /** Mirrors legacy field — engine maintains this in client state. */
  current_question: number;
  /** Alias for heat_participations.questions_attempted. */
  questions_answered: number;
}

export interface HeatQuestion {
  id: string;
  heat_id: string;
  question_number: number;
  difficulty: number;
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: string;
  solution_steps: any;
  points_value: number;
  time_limit_seconds: number;
}

export interface LeaderboardEntry {
  rank: number;
  athlete_id: string;
  display_name: string;
  total_points: number;
  cta_score: number;
  questions_answered: number;
  questions_correct: number;
  streak: number;
}

export interface HeatRealtimeEvents {
  'heat:status_changed': { status: HeatStatus; timestamp: Date };
  'heat:question_started': {
    question_number: number;
    question: HeatQuestion;
    timestamp: Date;
  };
  'heat:participant_joined': { participant: LegacyHeatParticipation };
  'heat:participant_finished': { participant: LegacyHeatParticipation };
  'heat:leaderboard_updated': { leaderboard: LeaderboardEntry[] };
  'heat:submission_received': {
    athlete_id: string;
    question_number: number;
    is_correct: boolean;
  };
}

// -----------------------------------------------------------------------------
// MAPPER: live DB row → legacy participation shape (with aliased columns)
// -----------------------------------------------------------------------------

function withLegacyAliases(
  p: HeatParticipationWithDisplay,
  currentQuestionNumber: number
): LegacyHeatParticipation {
  return {
    ...p,
    total_points: p.ranking_points_earned ?? 0,
    questions_answered: p.questions_attempted ?? 0,
    current_question: currentQuestionNumber,
  };
}

// -----------------------------------------------------------------------------
// LEGACY HeatEngine CLASS — thin wrapper around the new service modules
// -----------------------------------------------------------------------------

export class HeatEngine {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;

  private currentHeat: LegacyHeat | null = null;
  private currentParticipation: LegacyHeatParticipation | null = null;
  private questions: HeatQuestion[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private currentQuestionNumber: number = 1;     // client-only counter — no DB column

  // Event system (thin shim over Supabase channel events)
  private listeners: Map<keyof HeatRealtimeEvents, Set<Function>> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ---------------------------------------------------------------------------
  // EVENT API (.on / .off) — backward compatible with /compete pages
  // ---------------------------------------------------------------------------

  on<K extends keyof HeatRealtimeEvents>(
    event: K,
    callback: (data: HeatRealtimeEvents[K]) => void
  ): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback as Function);
  }

  off<K extends keyof HeatRealtimeEvents>(
    event: K,
    callback: (data: HeatRealtimeEvents[K]) => void
  ): void {
    this.listeners.get(event)?.delete(callback as Function);
  }

  private emit<K extends keyof HeatRealtimeEvents>(
    event: K,
    data: HeatRealtimeEvents[K]
  ): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        (cb as (d: HeatRealtimeEvents[K]) => void)(data);
      } catch (err) {
        console.error(`[HeatEngine] listener for ${event} threw:`, err);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // joinHeat — delegates to heat-service.joinHeat
  // ---------------------------------------------------------------------------

  async joinHeat(code: string): Promise<LegacyHeatParticipation> {
    const { heat, participation } = await joinHeatService(this.supabase, code);

    this.currentHeat = { ...heat, name: undefined };
    this.currentQuestionNumber = 1;
    this.currentParticipation = withLegacyAliases(participation, 1);

    // Load questions in order
    const { data: rawQuestions, error: qError } = await this.supabase
      .from('heat_questions')
      .select('*')
      .eq('heat_id', heat.id)
      .order('question_number');
    if (qError) {
      console.error('[HeatEngine] Failed to load heat_questions:', qError.message);
    }
    this.questions = (rawQuestions ?? []) as HeatQuestion[];

    await this.subscribe(heat.id);

    return this.currentParticipation;
  }

  // ---------------------------------------------------------------------------
  // submitAnswer — uses verified column names
  // ---------------------------------------------------------------------------

  async submitAnswer(
    questionId: string,
    answer: string,
    timeTakenMs: number
  ): Promise<{
    validation: ValidationResult;
    scoring: SubmissionScore;
  }> {
    if (!this.currentParticipation) {
      throw new Error('Not participating in a Heat');
    }

    const question = this.questions.find((q) => q.id === questionId);
    if (!question) throw new Error('Question not found');

    // Determine attempt_number
    const { data: priorAttempts } = await this.supabase
      .from('question_submissions')
      .select('attempt_number')
      .eq('heat_participation_id', this.currentParticipation.id)
      .eq('heat_question_id', questionId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    const attemptNumber =
      ((priorAttempts as any)?.[0]?.attempt_number ?? 0) + 1;

    // Validate
    const validation = validateAnswer(
      answer,
      question.correct_answer,
      question.answer_type as any
    );

    // Score this submission
    const scoring = scoreSubmission(
      validation.is_correct,
      timeTakenMs,
      question.time_limit_seconds * 1000,
      attemptNumber,
      question.points_value
    );

    // Persist the submission
    const { error: subErr } = await this.supabase
      .from('question_submissions')
      .insert({
        heat_participation_id: this.currentParticipation.id,
        heat_question_id: questionId,
        submitted_answer: answer,
        is_correct: validation.is_correct,
        time_taken_ms: timeTakenMs,
        attempt_number: attemptNumber,
        points_earned: scoring.points_earned,
      });
    if (subErr) throw new Error(`Failed to save submission: ${subErr.message}`);

    // Update running counters on heat_participations (VERIFIED column names)
    const newAttempts = (this.currentParticipation.questions_attempted ?? 0) + 1;
    const newCorrect =
      (this.currentParticipation.questions_correct ?? 0) +
      (validation.is_correct ? 1 : 0);
    const newFirstTouch =
      (this.currentParticipation.first_touch_correct ?? 0) +
      (validation.is_correct && attemptNumber === 1 ? 1 : 0);
    const newPoints =
      (this.currentParticipation.ranking_points_earned ?? 0) + scoring.points_earned;
    const newTimeMs =
      (this.currentParticipation.total_time_ms ?? 0) + timeTakenMs;

    const { data: updated, error: updErr } = await this.supabase
      .from('heat_participations')
      .update({
        questions_attempted: newAttempts,
        questions_correct: newCorrect,
        first_touch_correct: newFirstTouch,
        ranking_points_earned: newPoints,
        total_time_ms: newTimeMs,
      })
      .eq('id', this.currentParticipation.id)
      .select('*')
      .single();
    if (updErr) {
      throw new Error(`Failed to update participation: ${updErr.message}`);
    }

    // Advance the local current-question pointer (no DB column for this)
    this.currentQuestionNumber = question.question_number + 1;

    this.currentParticipation = withLegacyAliases(
      {
        ...(updated as HeatParticipation),
        display_name: this.currentParticipation.display_name,
      },
      this.currentQuestionNumber
    );

    // Broadcast the submission to other subscribers (without revealing answer)
    if (this.channel) {
      void broadcastSubmission(this.channel, {
        athlete_id: this.currentParticipation.athlete_id,
        question_number: question.question_number,
        is_correct: validation.is_correct,
      });
    }

    return { validation, scoring };
  }

  async finishHeat(): Promise<LegacyHeatParticipation> {
    if (!this.currentParticipation) {
      throw new Error('Not participating in a Heat');
    }
    const { data, error } = await this.supabase
      .from('heat_participations')
      .update({
        finished_at: new Date().toISOString(),
        status: 'finished',
      })
      .eq('id', this.currentParticipation.id)
      .select('*')
      .single();
    if (error) throw new Error(`Failed to finish Heat: ${error.message}`);

    this.currentParticipation = withLegacyAliases(
      {
        ...(data as HeatParticipation),
        display_name: this.currentParticipation.display_name,
      },
      this.currentQuestionNumber
    );
    this.emit('heat:participant_finished', { participant: this.currentParticipation });
    return this.currentParticipation;
  }

  // ---------------------------------------------------------------------------
  // GETTERS used by /compete/[code]/page.tsx
  // ---------------------------------------------------------------------------

  getCurrentHeat(): LegacyHeat | null {
    return this.currentHeat;
  }

  getCurrentParticipation(): LegacyHeatParticipation | null {
    return this.currentParticipation;
  }

  getQuestions(): HeatQuestion[] {
    return this.questions;
  }

  getCurrentQuestion(): HeatQuestion | null {
    return (
      this.questions.find((q) => q.question_number === this.currentQuestionNumber) ?? null
    );
  }

  async getLeaderboard(heatId: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase
      .from('heat_participations')
      .select(`
        athlete_id,
        questions_attempted,
        questions_correct,
        ranking_points_earned,
        cta_score,
        users:athlete_id (display_name)
      `)
      .eq('heat_id', heatId)
      .order('ranking_points_earned', { ascending: false })
      .order('cta_score', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[HeatEngine] Failed to load leaderboard:', error.message);
      return [];
    }

    this.leaderboard = (data ?? []).map((row: any, idx: number) => ({
      rank: idx + 1,
      athlete_id: row.athlete_id,
      display_name: row.users?.display_name ?? 'Mathlete',
      total_points: row.ranking_points_earned ?? 0,
      cta_score: row.cta_score ?? 0,
      questions_answered: row.questions_attempted ?? 0,
      questions_correct: row.questions_correct ?? 0,
      streak: 0,
    }));
    return this.leaderboard;
  }

  // ---------------------------------------------------------------------------
  // REALTIME — subscribe to a Heat's channel and remap events to the
  // legacy emitter API.
  // ---------------------------------------------------------------------------

  private async subscribe(heatId: string): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.channel = subscribeToHeat(this.supabase, heatId, {
      channelSuffix: 'engine',                       // legacy class isolated from hook channels
      onHeatUpdate: (partial) => {
        if (partial.status) {
          if (this.currentHeat) {
            this.currentHeat = { ...this.currentHeat, ...partial };
          }
          this.emit('heat:status_changed', {
            status: partial.status as HeatStatus,
            timestamp: new Date(),
          });
        }
      },
      onParticipantInsert: async (row) => {
        // Fetch display_name for the new participant so consumers can render
        // without an extra round-trip.
        const { data: userRow } = await this.supabase
          .from('users')
          .select('display_name')
          .eq('id', row.athlete_id)
          .maybeSingle();
        const participation: LegacyHeatParticipation = withLegacyAliases(
          {
            ...(row as any),
            display_name: userRow?.display_name ?? 'Mathlete',
          } as HeatParticipationWithDisplay,
          1
        );
        this.emit('heat:participant_joined', { participant: participation });
      },
      onParticipantUpdate: async () => {
        // Anyone updating likely affects the leaderboard — refresh it.
        const board = await this.getLeaderboard(heatId);
        this.emit('heat:leaderboard_updated', { leaderboard: board });
      },
      onSubmissionBroadcast: (payload) => {
        this.emit('heat:submission_received', payload);
      },
    });
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentHeat = null;
    this.currentParticipation = null;
    this.questions = [];
    this.leaderboard = [];
    this.listeners.clear();
    this.currentQuestionNumber = 1;
  }
}

// -----------------------------------------------------------------------------
// FACTORY (backward-compatible entry point)
// -----------------------------------------------------------------------------

/**
 * @deprecated For new code, import the focused services directly:
 *   - `heat-service.ts`       for createHeat / joinHeat / startHeat / endHeat
 *   - `question-delivery.ts`  for generateAndInsertQuestions
 *   - `scoring-service.ts`    for calculateHeatResults
 *   - `heat-realtime.ts`      for hooks + subscribeToHeat
 *
 * This factory remains for the existing /compete pages that depend on the
 * legacy class-based shape with .on/.off/.getCurrent* methods.
 */
export function createHeatEngine(supabase: SupabaseClient): HeatEngine {
  return new HeatEngine(supabase);
}
