// =============================================================================
// MathAthlone — Scoring Service
// =============================================================================
// Calculates per-participant scores, ranks, percentiles, and awards after a
// Heat ends. All column references match LIVE_QUERY_RESULTS.md.
//
// Award tiers (PROJECT_CONTEXT.md):
//   accuracy < 60%   → 'participation' (eligibility gate)
//   70–80 pct        → 'bronze'
//   80–90 pct        → 'silver'
//   90–96 pct        → 'gold'
//   96–99 pct        → 'platinum'
//   99–100 pct       → 'champion'   (or rank 1–3 override)
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type AwardLevel =
  | 'participation'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'champion';

export type MedalType = 'gold' | 'silver' | 'bronze';

export interface ParticipantScore {
  participation_id: string;
  athlete_id: string;
  questions_attempted: number;
  questions_correct: number;
  first_touch_correct: number;
  total_time_ms: number;
  content_score: number;          // 0-100 — correctness fraction
  time_score: number;             // 0-100 — speed bonus
  accuracy_score: number;         // 0-100 — first-touch accuracy
  cta_score: number;              // 0-100 — composite
  rank_in_heat: number;
  percentile: number;             // 0-100
  award_level: AwardLevel;
  medal: MedalType | null;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Map a percentile + accuracy to the canonical award_level (PROJECT_CONTEXT.md).
 * Eligibility gate: accuracy < 60% → 'participation' regardless of percentile.
 */
function awardLevelFor(percentile: number, accuracyPct: number, rank: number): AwardLevel {
  if (accuracyPct < 60) return 'participation';
  if (rank <= 3) return 'champion';                       // top-3 rank override
  if (percentile >= 99) return 'champion';
  if (percentile >= 96) return 'platinum';
  if (percentile >= 90) return 'gold';
  if (percentile >= 80) return 'silver';
  if (percentile >= 70) return 'bronze';
  return 'participation';
}

/**
 * medal_type only has gold/silver/bronze (DB enum). We map the top three
 * ranks to those medals so the existing leaderboard widgets keep working.
 */
function medalForRank(rank: number): MedalType | null {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return null;
}

// -----------------------------------------------------------------------------
// MAIN: calculateHeatResults
// -----------------------------------------------------------------------------

/**
 * Score every participation in a Heat, rank them, compute percentiles, and
 * write awards. Idempotent for a given heatId: re-running clears and replaces
 * heat_awards rows for the Heat and overwrites the scoring columns on
 * heat_participations.
 */
export async function calculateHeatResults(
  supabase: SupabaseClient,
  heatId: string
): Promise<ParticipantScore[]> {
  // 1. Heat config (duration drives the time score normalization)
  const { data: heat, error: heatError } = await supabase
    .from('heats')
    .select('id, duration_seconds, division_id, question_count')
    .eq('id', heatId)
    .single();

  if (heatError || !heat) {
    throw new Error(`Failed to load Heat for scoring: ${heatError?.message ?? 'not found'}`);
  }

  const durationMs = Math.max(1, (heat.duration_seconds ?? 900) * 1000);
  const totalQuestions = Math.max(1, heat.question_count ?? 1);
  const divisionId: string | null = heat.division_id ?? null;

  // 2. Load all participations
  const { data: participations, error: pError } = await supabase
    .from('heat_participations')
    .select(`
      id,
      athlete_id,
      questions_attempted,
      questions_correct,
      first_touch_correct,
      total_time_ms,
      ranking_points_earned
    `)
    .eq('heat_id', heatId);

  if (pError) {
    throw new Error(`Failed to load participations: ${pError.message}`);
  }
  if (!participations || participations.length === 0) {
    return [];
  }

  // 3. Load all submissions for those participations (we recompute counters
  //    from submissions to make scoring robust against partial updates).
  const participationIds = participations.map((p: any) => p.id);
  const { data: submissions, error: sError } = await supabase
    .from('question_submissions')
    .select('heat_participation_id, is_correct, time_taken_ms, attempt_number, points_earned')
    .in('heat_participation_id', participationIds);

  if (sError) {
    throw new Error(`Failed to load question_submissions: ${sError.message}`);
  }

  // 4. Aggregate per-participation stats from submissions
  type Agg = {
    attempts: number;
    correct: number;
    firstTouchCorrect: number;
    totalTimeMs: number;
    rawPoints: number;
  };
  const aggregates = new Map<string, Agg>();
  for (const pid of participationIds) {
    aggregates.set(pid, {
      attempts: 0,
      correct: 0,
      firstTouchCorrect: 0,
      totalTimeMs: 0,
      rawPoints: 0,
    });
  }
  for (const s of (submissions ?? []) as any[]) {
    const a = aggregates.get(s.heat_participation_id);
    if (!a) continue;
    a.attempts += 1;
    if (s.is_correct) a.correct += 1;
    if (s.is_correct && s.attempt_number === 1) a.firstTouchCorrect += 1;
    a.totalTimeMs += s.time_taken_ms ?? 0;
    a.rawPoints += s.points_earned ?? 0;
  }

  // 5. Compute scores per participation
  const scored = participations.map((p: any) => {
    const a = aggregates.get(p.id)!;
    const attempts = a.attempts || (p.questions_attempted ?? 0);
    const correct = a.correct || (p.questions_correct ?? 0);
    const firstTouchCorrect =
      a.firstTouchCorrect || (p.first_touch_correct ?? 0);
    const totalTimeMs = a.totalTimeMs || (p.total_time_ms ?? 0);

    // Content: % of questions answered correctly (normalize to total_questions
    // so quitting early hurts your score).
    const contentScore = round2((correct / totalQuestions) * 100);

    // Time: 100 at instant, linearly decaying to 0 at full duration.
    // Only credited if user actually attempted questions.
    const timeFraction = clamp(totalTimeMs / durationMs, 0, 1);
    const timeScore = attempts > 0 ? round2((1 - timeFraction) * 100) : 0;

    // Accuracy: first-touch correctness rate (drives the eligibility gate).
    const accuracyScore =
      attempts > 0 ? round2((firstTouchCorrect / attempts) * 100) : 0;

    // CTA composite (content 40 / time 30 / accuracy 30 — per Sprint 1 spec).
    const ctaScore = round2(
      contentScore * 0.4 + timeScore * 0.3 + accuracyScore * 0.3
    );

    return {
      participation_id: p.id,
      athlete_id: p.athlete_id,
      questions_attempted: attempts,
      questions_correct: correct,
      first_touch_correct: firstTouchCorrect,
      total_time_ms: totalTimeMs,
      content_score: contentScore,
      time_score: timeScore,
      accuracy_score: accuracyScore,
      cta_score: ctaScore,
      raw_points: a.rawPoints,
    };
  });

  // 6. Rank by cta_score DESC (tiebreaker: content_score, then -total_time_ms)
  scored.sort((a, b) => {
    if (b.cta_score !== a.cta_score) return b.cta_score - a.cta_score;
    if (b.content_score !== a.content_score) return b.content_score - a.content_score;
    return a.total_time_ms - b.total_time_ms;
  });

  // 7. Build per-participant results with rank, percentile, award level
  const totalParticipants = scored.length;
  const results: ParticipantScore[] = scored.map((s, idx) => {
    const rank = idx + 1;
    // Standard "percentile rank" — proportion below this participant.
    const percentile =
      totalParticipants <= 1
        ? 100
        : round2(((totalParticipants - rank) / (totalParticipants - 1)) * 100);
    const awardLevel = awardLevelFor(percentile, s.accuracy_score, rank);
    const medal = medalForRank(rank);
    return {
      participation_id: s.participation_id,
      athlete_id: s.athlete_id,
      questions_attempted: s.questions_attempted,
      questions_correct: s.questions_correct,
      first_touch_correct: s.first_touch_correct,
      total_time_ms: s.total_time_ms,
      content_score: s.content_score,
      time_score: s.time_score,
      accuracy_score: s.accuracy_score,
      cta_score: s.cta_score,
      rank_in_heat: rank,
      percentile,
      award_level: awardLevel,
      medal,
    };
  });

  // 8. UPDATE heat_participations with calculated scores (one row at a time —
  //    Supabase doesn't expose bulk update-with-different-values, and the
  //    participant count per Heat is small).
  for (const r of results) {
    const { error: upErr } = await supabase
      .from('heat_participations')
      .update({
        questions_attempted: r.questions_attempted,
        questions_correct: r.questions_correct,
        first_touch_correct: r.first_touch_correct,
        total_time_ms: r.total_time_ms,
        content_score: r.content_score,
        time_score: r.time_score,
        accuracy_score: r.accuracy_score,
        cta_score: r.cta_score,
        rank_in_heat: r.rank_in_heat,
        percentile: r.percentile,
        medal: r.medal,
        status: 'finished',
        finished_at: new Date().toISOString(),
      })
      .eq('id', r.participation_id);
    if (upErr) {
      console.error(
        `[scoring] failed to update participation ${r.participation_id}:`,
        upErr.message
      );
    }
  }

  // 9. Replace any prior heat_awards rows for this Heat, then insert fresh.
  //    Idempotent for re-runs.
  await supabase.from('heat_awards').delete().eq('heat_id', heatId);

  const awardRows = results.map((r) => ({
    heat_id: heatId,
    athlete_id: r.athlete_id,
    division_id: divisionId,
    raw_score: r.cta_score,
    accuracy_pct: r.accuracy_score,
    percentile: r.percentile,
    award_level: r.award_level,
  }));

  if (awardRows.length > 0) {
    const { error: awardErr } = await supabase.from('heat_awards').insert(awardRows);
    if (awardErr) {
      throw new Error(`Failed to insert heat_awards: ${awardErr.message}`);
    }
  }

  return results;
}

// -----------------------------------------------------------------------------
// PER-SUBMISSION SCORING (used while the Heat is live)
// -----------------------------------------------------------------------------

export interface SubmissionScore {
  content_score: number;
  time_score: number;
  accuracy_score: number;
  cta_score: number;
  points_earned: number;
}

/**
 * Score a single submission in real-time. Mirrors the legacy
 * calculateCTAScore() shape so existing callers (heat-engine.ts factory)
 * keep working.
 */
export function scoreSubmission(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitMs: number,
  attemptNumber: number,
  basePoints: number = 100
): SubmissionScore {
  const content_score = isCorrect ? 100 : 0;

  let time_score = 0;
  if (isCorrect && timeTakenMs < timeLimitMs) {
    time_score = Math.max(0, 100 * (1 - timeTakenMs / timeLimitMs));
  }

  // Multi-attempt penalty: 100 / 70 / 40 / 10.
  const accuracyTable: Record<number, number> = { 1: 100, 2: 70, 3: 40 };
  const accuracy_score = isCorrect ? accuracyTable[attemptNumber] ?? 10 : 0;

  const cta_score = content_score * 0.5 + time_score * 0.3 + accuracy_score * 0.2;
  const points_earned = isCorrect ? Math.round(basePoints * (cta_score / 100)) : 0;

  return {
    content_score: Math.round(content_score),
    time_score: Math.round(time_score),
    accuracy_score: Math.round(accuracy_score),
    cta_score: round2(cta_score),
    points_earned,
  };
}
