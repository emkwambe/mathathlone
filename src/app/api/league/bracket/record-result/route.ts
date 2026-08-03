// =============================================================================
// POST /api/league/bracket/record-result
// =============================================================================
// Records the result of a single/double-elimination bracket match.
// Marks the match completed, updates ELO ratings, updates league standings,
// upserts head-to-head, and lets the DB trigger advance the bracket tree.
//
// Body: { matchId, winnerId, loserId, leagueId, player1Cta, player2Cta, heatId? }
// Auth: teacher or platform_admin
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { EloEngine } from '@/lib/league-engine';
import type { AthleteRating } from '@/lib/league-engine';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  // ── Auth ─────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['teacher', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: {
    matchId?: string;
    winnerId?: string;
    loserId?: string;
    leagueId?: string;
    player1Cta?: number;
    player2Cta?: number;
    heatId?: string;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { matchId, winnerId, loserId, leagueId, player1Cta, player2Cta } = body;
  const heatId = body.heatId ?? null;

  if (!matchId || !winnerId || !loserId || !leagueId || player1Cta == null || player2Cta == null) {
    return NextResponse.json(
      { error: 'matchId, winnerId, loserId, leagueId, player1Cta, and player2Cta are required' },
      { status: 400 }
    );
  }

  try {
    // ── Fetch match ──────────────────────────────────────────────────────────
    const { data: match, error: matchErr } = await supabase
      .from('bracket_matches')
      .select('id, status, participant1_id, participant2_id, bracket_id')
      .eq('id', matchId)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    if (match.status === 'completed') {
      return NextResponse.json({ error: 'Match already completed' }, { status: 409 });
    }

    // ── Mark match completed (DB trigger handles bracket advancement) ────────
    const { error: updateErr } = await supabase
      .from('bracket_matches')
      .update({
        winner_id: winnerId,
        loser_id: loserId,
        heat_id: heatId,
        p1_cta_score: player1Cta,
        p2_cta_score: player2Cta,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateErr) throw new Error(`Failed to update match: ${updateErr.message}`);

    // ── ELO update ───────────────────────────────────────────────────────────
    const { data: ratingsRaw } = await supabase
      .from('athlete_ratings')
      .select('athlete_id, rating, rating_deviation, volatility, games_played, peak_rating, is_provisional, last_competition')
      .in('athlete_id', [winnerId, loserId]);

    const ratingsMap = new Map<string, AthleteRating>(
      (ratingsRaw ?? []).map((r: any) => [r.athlete_id, r as AthleteRating])
    );

    const winnerRating = ratingsMap.get(winnerId);
    const loserRating  = ratingsMap.get(loserId);

    let winnerEloChange = 0;
    let loserEloChange  = 0;

    if (winnerRating && loserRating) {
      const { winnerChange, loserChange } = EloEngine.updateFromMatch(winnerRating, loserRating);
      winnerEloChange = winnerChange;
      loserEloChange  = loserChange;

      const newWinnerRating = Math.max(800, Math.min(3000, winnerRating.rating + winnerChange));
      const newLoserRating  = Math.max(800, Math.min(3000, loserRating.rating + loserChange));

      await supabase
        .from('athlete_ratings')
        .update({
          rating: newWinnerRating,
          games_played: winnerRating.games_played + 1,
          last_competition: new Date().toISOString(),
        })
        .eq('athlete_id', winnerId);

      await supabase
        .from('athlete_ratings')
        .update({
          rating: newLoserRating,
          games_played: loserRating.games_played + 1,
          last_competition: new Date().toISOString(),
        })
        .eq('athlete_id', loserId);

      // Rating history
      await supabase.from('rating_history').insert([
        {
          athlete_id: winnerId,
          heat_id: heatId,
          league_id: leagueId,
          rating_before: winnerRating.rating,
          rating_after: newWinnerRating,
          rd_before: winnerRating.rating_deviation,
          rd_after: winnerRating.rating_deviation,
          k_factor_used: EloEngine.kFactor(winnerRating),
          expected_score: EloEngine.expectedScore(winnerRating.rating, loserRating.rating),
          actual_score: 1,
        },
        {
          athlete_id: loserId,
          heat_id: heatId,
          league_id: leagueId,
          rating_before: loserRating.rating,
          rating_after: newLoserRating,
          rd_before: loserRating.rating_deviation,
          rd_after: loserRating.rating_deviation,
          k_factor_used: EloEngine.kFactor(loserRating),
          expected_score: EloEngine.expectedScore(loserRating.rating, winnerRating.rating),
          actual_score: 0,
        },
      ]);
    }

    // ── League standings update ──────────────────────────────────────────────
    await supabase.rpc('increment_standing', {
      p_league_id: leagueId,
      p_athlete_id: winnerId,
      p_wins: 1,
      p_losses: 0,
      p_draws: 0,
      p_points: 3,
      p_elo_change: winnerEloChange,
    });

    await supabase.rpc('increment_standing', {
      p_league_id: leagueId,
      p_athlete_id: loserId,
      p_wins: 0,
      p_losses: 1,
      p_draws: 0,
      p_points: 0,
      p_elo_change: loserEloChange,
    });

    // ── Head-to-head upsert ──────────────────────────────────────────────────
    const [a1, a2] = [winnerId, loserId].sort();
    const isWinnerA1 = a1 === winnerId;
    const winnerCta = match.participant1_id === winnerId ? player1Cta : player2Cta;
    const loserCta  = match.participant1_id === loserId  ? player1Cta : player2Cta;

    const { data: existingH2H } = await supabase
      .from('head_to_head')
      .select('id, athlete1_wins, athlete2_wins, athlete1_cta_total, athlete2_cta_total')
      .eq('league_id', leagueId)
      .eq('athlete1_id', a1)
      .eq('athlete2_id', a2)
      .maybeSingle();

    if (existingH2H) {
      await supabase
        .from('head_to_head')
        .update({
          athlete1_wins: existingH2H.athlete1_wins + (isWinnerA1 ? 1 : 0),
          athlete2_wins: existingH2H.athlete2_wins + (isWinnerA1 ? 0 : 1),
          athlete1_cta_total: Number(existingH2H.athlete1_cta_total) + (isWinnerA1 ? winnerCta : loserCta),
          athlete2_cta_total: Number(existingH2H.athlete2_cta_total) + (isWinnerA1 ? loserCta : winnerCta),
          last_updated: new Date().toISOString(),
        })
        .eq('id', existingH2H.id);
    } else {
      await supabase.from('head_to_head').insert({
        league_id: leagueId,
        athlete1_id: a1,
        athlete2_id: a2,
        athlete1_wins: isWinnerA1 ? 1 : 0,
        athlete2_wins: isWinnerA1 ? 0 : 1,
        draws: 0,
        athlete1_cta_total: isWinnerA1 ? winnerCta : loserCta,
        athlete2_cta_total: isWinnerA1 ? loserCta : winnerCta,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const status = err.message.includes('already completed') ? 409 :
                   err.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
