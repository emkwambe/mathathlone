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

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

// GradeBands + DEFAULT_GRADE_BANDS live in heat-service.ts — re-import so
// the scoring code references the same shape and the barrel index.ts
// doesn't see two competing exports.
import { DEFAULT_GRADE_BANDS, type GradeBands } from './heat-service';
export { DEFAULT_GRADE_BANDS };
export type { GradeBands };

/**
 * Map a CTA score (0-100) to a letter grade using the supplied band cutoffs.
 * Anything below D becomes F. Defensive — if a band is missing, falls back
 * to the standard 90/80/70/60 thresholds.
 */
function letterForScore(cta: number, bands: GradeBands | null | undefined): LetterGrade {
  const b: GradeBands = {
    A: bands?.A ?? DEFAULT_GRADE_BANDS.A,
    B: bands?.B ?? DEFAULT_GRADE_BANDS.B,
    C: bands?.C ?? DEFAULT_GRADE_BANDS.C,
    D: bands?.D ?? DEFAULT_GRADE_BANDS.D,
  };
  if (cta >= b.A) return 'A';
  if (cta >= b.B) return 'B';
  if (cta >= b.C) return 'C';
  if (cta >= b.D) return 'D';
  return 'F';
}

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
  /** Letter grade derived from cta_score + grade_bands. Only populated for assessment heats. */
  letter_grade: LetterGrade | null;
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
  // 1. Heat config (duration drives the time score normalization; the
  // assessment-mode columns drive letter-grade calculation and the
  // results-released gate downstream).
  const { data: heat, error: heatError } = await supabase
    .from('heats')
    .select('id, duration_seconds, division_id, question_count, is_assessment, grade_bands')
    .eq('id', heatId)
    .single();

  if (heatError || !heat) {
    throw new Error(`Failed to load Heat for scoring: ${heatError?.message ?? 'not found'}`);
  }

  const durationMs = Math.max(1, (heat.duration_seconds ?? 900) * 1000);
  const totalQuestions = Math.max(1, heat.question_count ?? 1);
  const divisionId: string | null = heat.division_id ?? null;
  const isAssessment: boolean = (heat as { is_assessment?: boolean }).is_assessment ?? false;
  const gradeBands: GradeBands = (heat as { grade_bands?: GradeBands | null }).grade_bands ?? DEFAULT_GRADE_BANDS;

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

  // 3. Load this Heat's questions so we can classify each submission as
  //    free-response (generator_id NOT NULL → procedural generator) or
  //    multiple-choice (generator_id IS NULL → static/visual). This drives
  //    the new Content formula that weights free-response 2× MC.
  const { data: heatQuestions, error: qError } = await supabase
    .from('heat_questions')
    .select('id, generator_id')
    .eq('heat_id', heatId);
  if (qError) {
    throw new Error(`Failed to load heat_questions: ${qError.message}`);
  }
  const isFreeResponseByQuestion = new Map<string, boolean>(
    (heatQuestions ?? []).map((q: any) => [q.id as string, q.generator_id !== null])
  );

  // Heat-wide FR/MC totals (every Mathlete has the same question pool)
  let frTotal = 0;
  let mcTotal = 0;
  for (const isFr of isFreeResponseByQuestion.values()) {
    if (isFr) frTotal++; else mcTotal++;
  }

  // 4. Load all submissions for those participations (we recompute counters
  //    from submissions to make scoring robust against partial updates).
  const participationIds = participations.map((p: any) => p.id);
  const { data: submissions, error: sError } = await supabase
    .from('question_submissions')
    .select(
      'heat_participation_id, heat_question_id, is_correct, time_taken_ms, attempt_number, points_earned'
    )
    .in('heat_participation_id', participationIds);

  if (sError) {
    throw new Error(`Failed to load question_submissions: ${sError.message}`);
  }

  // 5. Aggregate per-participation stats from submissions
  type Agg = {
    attempts: number;
    correct: number;
    firstTouchCorrect: number;
    totalTimeMs: number;
    rawPoints: number;
    frCorrect: number;          // free-response (generator_id NOT NULL) correct
    mcCorrect: number;          // multiple-choice (visual/static) correct
  };
  const aggregates = new Map<string, Agg>();
  for (const pid of participationIds) {
    aggregates.set(pid, {
      attempts: 0,
      correct: 0,
      firstTouchCorrect: 0,
      totalTimeMs: 0,
      rawPoints: 0,
      frCorrect: 0,
      mcCorrect: 0,
    });
  }
  for (const s of (submissions ?? []) as any[]) {
    const a = aggregates.get(s.heat_participation_id);
    if (!a) continue;
    a.attempts += 1;
    if (s.is_correct) {
      a.correct += 1;
      // Bucket the correct answer by question type
      const isFr = isFreeResponseByQuestion.get(s.heat_question_id);
      if (isFr === true) a.frCorrect += 1;
      else if (isFr === false) a.mcCorrect += 1;
      // (if isFr is undefined the question row was deleted — count toward correct
      // but skip the FR/MC weight contribution rather than guessing)
    }
    if (s.is_correct && s.attempt_number === 1) a.firstTouchCorrect += 1;
    a.totalTimeMs += s.time_taken_ms ?? 0;
    a.rawPoints += s.points_earned ?? 0;
  }

  // 6. Compute scores per participation using the CTA framework
  //    (see docs/CTA_SCORING_FRAMEWORK.md).
  //
  //    Content   = (fr_correct × 2 + mc_correct × 1)
  //              / (fr_total × 2 + mc_total × 1) × 100
  //    Timing    = (coverage × 0.6 + efficiency × 0.4) × 100
  //                where coverage   = attempts / questions_available
  //                      efficiency = max(0, (timeAllowed - timeUsed) / timeAllowed)
  //    Accuracy  = first_touch_correct / attempts × 100
  //    CTA       = C × 0.40 + T × 0.30 + A × 0.30
  const contentDenominator = frTotal * 2 + mcTotal * 1;
  const scored = participations.map((p: any) => {
    const a = aggregates.get(p.id)!;
    const attempts = a.attempts || (p.questions_attempted ?? 0);
    const correct = a.correct || (p.questions_correct ?? 0);
    const firstTouchCorrect =
      a.firstTouchCorrect || (p.first_touch_correct ?? 0);
    const totalTimeMs = a.totalTimeMs || (p.total_time_ms ?? 0);

    // ── C: Content — free-response weighted 2×
    const contentNumerator = a.frCorrect * 2 + a.mcCorrect * 1;
    const contentScore =
      contentDenominator > 0
        ? round2((contentNumerator / contentDenominator) * 100)
        : 0;

    // ── T: Timing — coverage + efficiency
    const coverage = clamp(attempts / totalQuestions, 0, 1);
    const efficiency =
      attempts > 0
        ? Math.max(0, (durationMs - totalTimeMs) / durationMs)
        : 0;
    const timeScore = round2((coverage * 0.6 + efficiency * 0.4) * 100);

    // ── A: Accuracy — first-touch correctness rate
    const accuracyScore =
      attempts > 0 ? round2((firstTouchCorrect / attempts) * 100) : 0;

    // ── CTA composite (40 / 30 / 30)
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
    // Assessment heats compute a letter grade from CTA + the configured
    // grade_bands. Competition heats leave letter_grade as null so the
    // existing trophy/medal UX is untouched.
    const letterGrade = isAssessment ? letterForScore(s.cta_score, gradeBands) : null;
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
      letter_grade: letterGrade,
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
    // Migration 032 columns. letter_grade is NULL for competition heats;
    // is_assessment lets a single result-page render branch off the row.
    letter_grade: r.letter_grade,
    is_assessment: isAssessment,
  }));

  if (awardRows.length > 0) {
    const { error: awardErr } = await supabase.from('heat_awards').insert(awardRows);
    if (awardErr) {
      throw new Error(`Failed to insert heat_awards: ${awardErr.message}`);
    }
  }

  // 10. ELO rating updates (non-blocking — failure must not block results).
  try {
    await updateAthleteRatingsFromHeat(supabase, heatId, divisionId, results);
  } catch (err) {
    console.warn('[scoring-service] ELO update skipped:', err);
  }

  return results;
}

// -----------------------------------------------------------------------------
// ELO RATING UPDATES
// -----------------------------------------------------------------------------

/**
 * Update athlete_ratings + insert rating_history for every participant of
 * a finished Heat. Idempotent on second call (we short-circuit if any
 * rating_history row already exists for this heat_id).
 *
 * If `athlete_ratings` has no row for a participant yet, we create one with
 * Glicko-2-friendly defaults from RATING_CONFIG.
 */
export async function updateAthleteRatingsFromHeat(
  supabase: SupabaseClient,
  heatId: string,
  divisionId: string | null,
  results: ParticipantScore[]
): Promise<void> {
  if (results.length === 0) return;

  // Lazy-import league-engine.ts so a missing/broken import here can't
  // crash calculateHeatResults().
  const { EloEngine, RATING_CONFIG } = await import('@/lib/league-engine');

  // Idempotency guard: if any rating_history row already exists for this
  // Heat, treat the update as already done.
  const { count: historyCount } = await supabase
    .from('rating_history')
    .select('id', { count: 'exact', head: true })
    .eq('heat_id', heatId);

  if ((historyCount ?? 0) > 0) {
    console.info('[scoring-service] Heat already processed for ELO — skipping');
    return;
  }

  const athleteIds = results.map((r) => r.athlete_id);

  // Fetch existing ratings for these athletes (filtered to this division
  // when possible). athlete_ratings has UNIQUE(athlete_id, division_id) —
  // null division_id is a valid separate slot.
  let ratingsQuery = supabase
    .from('athlete_ratings')
    .select('*')
    .in('athlete_id', athleteIds);
  if (divisionId) {
    ratingsQuery = ratingsQuery.eq('division_id', divisionId);
  } else {
    ratingsQuery = ratingsQuery.is('division_id', null);
  }
  const { data: existingRatings, error: rErr } = await ratingsQuery;
  if (rErr) {
    throw new Error(`Failed to load athlete_ratings: ${rErr.message}`);
  }

  const ratingsMap = new Map<string, any>(
    (existingRatings ?? []).map((row: any) => [row.athlete_id, row])
  );

  // Insert default rows for athletes without one
  const missing = athleteIds.filter((id) => !ratingsMap.has(id));
  if (missing.length > 0) {
    const seedRows = missing.map((athleteId) => ({
      athlete_id: athleteId,
      division_id: divisionId,
      rating: RATING_CONFIG.STARTING,
      rating_deviation: RATING_CONFIG.STARTING_RD,
      volatility: RATING_CONFIG.STARTING_VOLATILITY,
      games_played: 0,
      peak_rating: RATING_CONFIG.STARTING,
      floor_rating: RATING_CONFIG.FLOOR,
      is_provisional: true,
    }));
    const { data: inserted, error: insErr } = await supabase
      .from('athlete_ratings')
      .insert(seedRows)
      .select();
    if (insErr) {
      throw new Error(`Failed to seed athlete_ratings: ${insErr.message}`);
    }
    for (const row of inserted ?? []) {
      ratingsMap.set((row as any).athlete_id, row);
    }
  }

  // Average rating across the field is our "opponent rating" estimator.
  const totalRating = [...ratingsMap.values()].reduce(
    (sum, r: any) => sum + (r.rating ?? RATING_CONFIG.STARTING),
    0
  );
  const avgRating = totalRating / Math.max(1, ratingsMap.size);

  const nowIso = new Date().toISOString();
  const totalParticipants = results.length;

  for (const r of results) {
    const current = ratingsMap.get(r.athlete_id);
    if (!current) continue;

    const player: any = {
      athlete_id: current.athlete_id,
      rating: current.rating ?? RATING_CONFIG.STARTING,
      rating_deviation: current.rating_deviation ?? RATING_CONFIG.STARTING_RD,
      volatility: current.volatility ?? RATING_CONFIG.STARTING_VOLATILITY,
      games_played: current.games_played ?? 0,
      peak_rating: current.peak_rating ?? RATING_CONFIG.STARTING,
      is_provisional: current.is_provisional ?? true,
      last_competition: current.last_competition ?? null,
    };

    const heatResult = {
      athlete_id: r.athlete_id,
      cta_score: r.cta_score,
      accuracy: r.accuracy_score,
      time_ms: r.total_time_ms,
      rank_in_heat: r.rank_in_heat,
      total_participants: totalParticipants,
    };

    const { newRating } = EloEngine.updateFromHeat(player, heatResult, avgRating);

    // Translate Heat rank into the same 1.0 / 0.5 / 0.0 score buckets that
    // the ELO engine uses for the expected/actual delta.
    const percentile = 1 - (r.rank_in_heat - 1) / Math.max(1, totalParticipants);
    const actualScore = percentile >= 0.75 ? 1.0 : percentile >= 0.5 ? 0.5 : 0.0;
    const expectedScore = EloEngine.expectedScore(player.rating, avgRating);
    const kFactor = EloEngine.kFactor(player);

    // Update athlete_ratings
    let updateQuery = supabase
      .from('athlete_ratings')
      .update({
        rating: newRating,
        games_played: player.games_played + 1,
        peak_rating: Math.max(player.peak_rating, newRating),
        is_provisional: player.games_played + 1 < 5,
        last_competition: nowIso,
        updated_at: nowIso,
      })
      .eq('athlete_id', r.athlete_id);
    if (divisionId) {
      updateQuery = updateQuery.eq('division_id', divisionId);
    } else {
      updateQuery = updateQuery.is('division_id', null);
    }
    const { error: updateErr } = await updateQuery;
    if (updateErr) {
      console.warn(
        `[scoring-service] athlete_ratings update failed for ${r.athlete_id}:`,
        updateErr.message
      );
      continue;
    }

    // Audit row in rating_history (no FK enforcement on division_id here)
    const { error: historyErr } = await supabase.from('rating_history').insert({
      athlete_id: r.athlete_id,
      heat_id: heatId,
      rating_before: player.rating,
      rating_after: newRating,
      rd_before: player.rating_deviation,
      rd_after: player.rating_deviation,        // ELO doesn't change RD
      k_factor_used: kFactor,
      expected_score: Number(expectedScore.toFixed(4)),
      actual_score: actualScore,
    });
    if (historyErr) {
      console.warn(
        `[scoring-service] rating_history insert failed for ${r.athlete_id}:`,
        historyErr.message
      );
    }
  }
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
