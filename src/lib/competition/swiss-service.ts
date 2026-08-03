// =============================================================================
// swiss-service.ts
// =============================================================================
// High-level Swiss System service that wraps the SwissEngine pairing algorithm
// with Supabase persistence. Used by the API routes for Swiss leagues.
//
// Responsibilities:
//   - Initialise a Swiss bracket for a league (create brackets row + round 1)
//   - Generate the next round's pairings (after all current round heats complete)
//   - Record a pairing result (winner, CTA scores) — updates ELO, standings,
//     head-to-head, and marks the round/bracket complete when all pairings done
//   - Query current round status and full standings
//   - Determine when the Swiss phase is complete (all optimal rounds played)
// =============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { SwissEngine, EloEngine } from '@/lib/league-engine';
import type { StandingEntry, AthleteRating } from '@/lib/league-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwissRoundStatus {
  bracketId: string;
  currentRound: number;
  totalRounds: number;
  roundStatus: 'pending' | 'active' | 'completed';
  completedPairs: number;
  totalPairings: number;
  pairings: SwissPairingRow[];
  isComplete: boolean;   // all optimal rounds finished
}

export interface SwissPairingRow {
  id: string;
  boardNumber: number;
  player1: { id: string; name: string; avatarUrl: string | null; elo: number; points: number };
  player2: { id: string; name: string; avatarUrl: string | null; elo: number; points: number } | null;
  heatId: string | null;
  winnerId: string | null;
  player1Cta: number | null;
  player2Cta: number | null;
  isBye: boolean;
  status: 'pending' | 'active' | 'completed' | 'bye';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SwissService {
  constructor(private supabase: SupabaseClient) {}

  // ── 1. Initialise Swiss bracket ──────────────────────────────────────────

  async initBracket(
    leagueId: string,
    splitId: string | null,
    name: string
  ): Promise<{ bracketId: string; roundId: string }> {
    // Fetch current standings (participants)
    const standings = await this.fetchStandings(leagueId);
    if (standings.length < 2) {
      throw new Error('At least 2 participants are required to start a Swiss bracket.');
    }

    const totalRounds = SwissEngine.optimalRounds(standings.length);

    // Create bracket record
    const { data: bracket, error: bracketErr } = await this.supabase
      .from('brackets')
      .insert({
        league_id: leagueId,
        split_id: splitId,
        name,
        format: 'swiss',
        participant_count: standings.length,
        rounds_count: totalRounds,
        current_round: 0,
        status: 'active',
      })
      .select('id')
      .single();

    if (bracketErr || !bracket) {
      throw new Error(`Failed to create bracket: ${bracketErr?.message}`);
    }

    // Generate round 1
    const roundId = await this.generateNextRound(
      bracket.id,
      leagueId,
      standings,
      new Set<string>(),
      1,
      totalRounds
    );

    return { bracketId: bracket.id, roundId };
  }

  // ── 2. Generate next round ────────────────────────────────────────────────

  async advanceRound(leagueId: string, bracketId: string): Promise<{ roundId: string; roundNumber: number }> {
    // Verify current round is fully completed
    const { data: currentRound } = await this.supabase
      .from('swiss_rounds')
      .select('*')
      .eq('bracket_id', bracketId)
      .eq('status', 'active')
      .maybeSingle();

    if (currentRound && currentRound.completed_pairs < currentRound.total_pairings) {
      throw new Error(
        `Round ${currentRound.round_number} is not yet complete (${currentRound.completed_pairs}/${currentRound.total_pairings} pairings done).`
      );
    }

    // Get bracket info
    const { data: bracket } = await this.supabase
      .from('brackets')
      .select('rounds_count, current_round')
      .eq('id', bracketId)
      .single();

    if (!bracket) throw new Error('Bracket not found.');

    const nextRound = (bracket.current_round ?? 0) + 1;
    if (nextRound > bracket.rounds_count) {
      throw new Error('All Swiss rounds have been completed.');
    }

    // Fetch updated standings and previous pairings
    const standings = await this.fetchStandings(leagueId);
    const previousPairings = await this.fetchPreviousPairingKeys(bracketId);

    const roundId = await this.generateNextRound(
      bracketId,
      leagueId,
      standings,
      previousPairings,
      nextRound,
      bracket.rounds_count
    );

    return { roundId, roundNumber: nextRound };
  }

  // ── 3. Record pairing result ──────────────────────────────────────────────
  //
  // After writing the pairing result this method:
  //   a) Updates both players' ELO ratings and rating_history
  //   b) Updates league_standings (wins/losses/points/current_elo/elo_change)
  //   c) Upserts head_to_head record
  //   d) Increments swiss_rounds.completed_pairs; marks round 'completed' when done
  //   e) Marks bracket 'completed' when the final round finishes

  async recordResult(
    pairingId: string,
    winnerId: string,
    player1Cta: number,
    player2Cta: number,
    heatId: string
  ): Promise<void> {
    // ── Fetch pairing ────────────────────────────────────────────────────────
    const { data: pairing, error } = await this.supabase
      .from('swiss_pairings')
      .select('*')
      .eq('id', pairingId)
      .single();

    if (error || !pairing) throw new Error('Pairing not found.');
    if (pairing.status === 'completed') throw new Error('Pairing already completed.');

    const loserId =
      pairing.player1_id === winnerId ? pairing.player2_id : pairing.player1_id;

    if (!loserId) throw new Error('Cannot determine loser — pairing may be a bye.');

    const leagueId: string = pairing.league_id;

    // ── Write pairing result ─────────────────────────────────────────────────
    await this.supabase
      .from('swiss_pairings')
      .update({
        winner_id: winnerId,
        player1_cta: player1Cta,
        player2_cta: player2Cta,
        heat_id: heatId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', pairingId);

    // ── ELO update ───────────────────────────────────────────────────────────
    const { data: ratingsRaw } = await this.supabase
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

      // Update athlete_ratings for winner
      await this.supabase
        .from('athlete_ratings')
        .update({
          rating: newWinnerRating,
          games_played: winnerRating.games_played + 1,
          last_competition: new Date().toISOString(),
        })
        .eq('athlete_id', winnerId);

      // Update athlete_ratings for loser
      await this.supabase
        .from('athlete_ratings')
        .update({
          rating: newLoserRating,
          games_played: loserRating.games_played + 1,
          last_competition: new Date().toISOString(),
        })
        .eq('athlete_id', loserId);

      // Rating history — winner
      await this.supabase.from('rating_history').insert({
        athlete_id: winnerId,
        heat_id: heatId || null,
        league_id: leagueId,
        rating_before: winnerRating.rating,
        rating_after: newWinnerRating,
        rd_before: winnerRating.rating_deviation,
        rd_after: winnerRating.rating_deviation,
        k_factor_used: EloEngine.kFactor(winnerRating),
        expected_score: EloEngine.expectedScore(winnerRating.rating, loserRating.rating),
        actual_score: 1,
      });

      // Rating history — loser
      await this.supabase.from('rating_history').insert({
        athlete_id: loserId,
        heat_id: heatId || null,
        league_id: leagueId,
        rating_before: loserRating.rating,
        rating_after: newLoserRating,
        rd_before: loserRating.rating_deviation,
        rd_after: loserRating.rating_deviation,
        k_factor_used: EloEngine.kFactor(loserRating),
        expected_score: EloEngine.expectedScore(loserRating.rating, winnerRating.rating),
        actual_score: 0,
      });
    }

    // ── League standings update ──────────────────────────────────────────────
    // Winner: +3 points, +1 win
    await this.supabase.rpc('increment_standing', {
      p_league_id: leagueId,
      p_athlete_id: winnerId,
      p_wins: 1,
      p_losses: 0,
      p_draws: 0,
      p_points: 3,
      p_elo_change: winnerEloChange,
    });

    // Loser: +0 points, +1 loss
    await this.supabase.rpc('increment_standing', {
      p_league_id: leagueId,
      p_athlete_id: loserId,
      p_wins: 0,
      p_losses: 1,
      p_draws: 0,
      p_points: 0,
      p_elo_change: loserEloChange,
    });

    // ── Head-to-head upsert ──────────────────────────────────────────────────
    // Canonical order: athlete1_id < athlete2_id
    const [a1, a2] = [winnerId, loserId].sort();
    const isWinnerA1 = a1 === winnerId;
    const winnerCta = pairing.player1_id === winnerId ? player1Cta : player2Cta;
    const loserCta  = pairing.player1_id === loserId  ? player1Cta : player2Cta;

    const { data: existingH2H } = await this.supabase
      .from('head_to_head')
      .select('id, athlete1_wins, athlete2_wins, athlete1_cta_total, athlete2_cta_total')
      .eq('league_id', leagueId)
      .eq('athlete1_id', a1)
      .eq('athlete2_id', a2)
      .maybeSingle();

    if (existingH2H) {
      await this.supabase
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
      await this.supabase.from('head_to_head').insert({
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

    // NOTE: swiss_rounds.completed_pairs and status are auto-updated by the
    // trg_swiss_pairing_progress DB trigger (migration 039) whenever a pairing
    // status changes to 'completed'. No manual round/bracket completion needed here.
  }

  // ── 4. Get current round status ───────────────────────────────────────────

  async getRoundStatus(leagueId: string, bracketId: string): Promise<SwissRoundStatus> {
    const { data: bracket } = await this.supabase
      .from('brackets')
      .select('rounds_count, current_round, status')
      .eq('id', bracketId)
      .single();

    if (!bracket) throw new Error('Bracket not found.');

    // Get the most recent round
    const { data: round } = await this.supabase
      .from('swiss_rounds')
      .select('*')
      .eq('bracket_id', bracketId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!round) {
      return {
        bracketId,
        currentRound: 0,
        totalRounds: bracket.rounds_count,
        roundStatus: 'pending',
        completedPairs: 0,
        totalPairings: 0,
        pairings: [],
        isComplete: false,
      };
    }

    // Get pairings with player info
    const { data: pairingsRaw } = await this.supabase
      .from('swiss_pairings')
      .select(`
        id, board_number, player1_id, player2_id, heat_id,
        winner_id, player1_cta, player2_cta, is_bye, status,
        p1:player1_id ( id, display_name, avatar_url ),
        p2:player2_id ( id, display_name, avatar_url )
      `)
      .eq('swiss_round_id', round.id)
      .order('board_number');

    // Get ELO and points from standings
    const standings = await this.fetchStandings(leagueId);
    const standingMap = new Map(standings.map((s) => [s.athlete_id, s]));

    const pairings: SwissPairingRow[] = (pairingsRaw ?? []).map((p: any) => {
      const s1 = standingMap.get(p.player1_id);
      const s2 = p.player2_id ? standingMap.get(p.player2_id) : null;
      return {
        id: p.id,
        boardNumber: p.board_number,
        player1: {
          id: p.player1_id,
          name: p.p1?.display_name ?? 'Mathlete',
          avatarUrl: p.p1?.avatar_url ?? null,
          elo: s1?.current_elo ?? 1200,
          points: s1?.points ?? 0,
        },
        player2: p.player2_id
          ? {
              id: p.player2_id,
              name: p.p2?.display_name ?? 'Mathlete',
              avatarUrl: p.p2?.avatar_url ?? null,
              elo: s2?.current_elo ?? 1200,
              points: s2?.points ?? 0,
            }
          : null,
        heatId: p.heat_id ?? null,
        winnerId: p.winner_id ?? null,
        player1Cta: p.player1_cta != null ? Number(p.player1_cta) : null,
        player2Cta: p.player2_cta != null ? Number(p.player2_cta) : null,
        isBye: !!p.is_bye,
        status: p.status,
      };
    });

    const isComplete =
      round.status === 'completed' &&
      round.round_number >= bracket.rounds_count;

    return {
      bracketId,
      currentRound: round.round_number,
      totalRounds: bracket.rounds_count,
      roundStatus: round.status,
      completedPairs: round.completed_pairs,
      totalPairings: round.total_pairings,
      pairings,
      isComplete,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async generateNextRound(
    bracketId: string,
    leagueId: string,
    standings: StandingEntry[],
    previousPairings: Set<string>,
    roundNumber: number,
    totalRounds: number
  ): Promise<string> {
    // Run the pairing algorithm
    const rawPairings = SwissEngine.generateRound(standings, previousPairings, roundNumber);

    // Identify bye player
    const byePairing = rawPairings.find((p) => p.player2_id === 'BYE');
    const byeAthleteId = byePairing?.player1_id ?? null;

    // Create swiss_round row
    const nonByePairings = rawPairings.filter((p) => p.player2_id !== 'BYE');
    const totalPairings = nonByePairings.length + (byePairing ? 1 : 0);

    const { data: round, error: roundErr } = await this.supabase
      .from('swiss_rounds')
      .insert({
        bracket_id: bracketId,
        league_id: leagueId,
        round_number: roundNumber,
        status: 'active',
        total_pairings: totalPairings,
        completed_pairs: byePairing ? 1 : 0,  // bye counts as immediately completed
        bye_athlete_id: byeAthleteId,
      })
      .select('id')
      .single();

    if (roundErr || !round) {
      throw new Error(`Failed to create swiss round: ${roundErr?.message}`);
    }

    // Insert pairing rows
    const pairingInserts = rawPairings.map((p, idx) => ({
      swiss_round_id: round.id,
      bracket_id: bracketId,
      league_id: leagueId,
      round_number: roundNumber,
      board_number: idx + 1,
      player1_id: p.player1_id,
      player2_id: p.player2_id === 'BYE' ? null : p.player2_id,
      is_bye: p.player2_id === 'BYE',
      status: p.player2_id === 'BYE' ? 'bye' : 'pending',
      // Bye winner is the player who received the bye
      winner_id: p.player2_id === 'BYE' ? p.player1_id : null,
    }));

    const { error: pairErr } = await this.supabase
      .from('swiss_pairings')
      .insert(pairingInserts);

    if (pairErr) throw new Error(`Failed to insert pairings: ${pairErr.message}`);

    // Update bracket current_round
    await this.supabase
      .from('brackets')
      .update({ current_round: roundNumber })
      .eq('id', bracketId);

    return round.id;
  }

  private async fetchStandings(leagueId: string): Promise<StandingEntry[]> {
    const { data } = await this.supabase
      .from('league_standings')
      .select('*')
      .eq('league_id', leagueId)
      .order('rank');

    return (data ?? []).map((r: any) => ({
      athlete_id: r.athlete_id,
      rank: r.rank,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
      points: r.points ?? 0,
      heats_played: r.heats_played ?? 0,
      total_cta: Number(r.total_cta ?? 0),
      avg_cta: Number(r.avg_cta ?? 0),
      best_cta: Number(r.best_cta ?? 0),
      buchholz: Number(r.buchholz ?? 0),
      buchholz_cut1: Number(r.buchholz_cut1 ?? 0),
      sonneborn_berger: Number(r.sonneborn_berger ?? 0),
      first_places: r.first_places ?? 0,
      avg_accuracy: Number(r.avg_accuracy ?? 0),
      avg_speed_ms: r.avg_speed_ms ?? 0,
      current_elo: Number(r.current_elo ?? 1200),
      elo_change: Number(r.elo_change ?? 0),
    }));
  }

  private async fetchPreviousPairingKeys(bracketId: string): Promise<Set<string>> {
    const { data } = await this.supabase
      .from('swiss_pairings')
      .select('player1_id, player2_id')
      .eq('bracket_id', bracketId)
      .not('player2_id', 'is', null);

    const keys = new Set<string>();
    for (const p of data ?? []) {
      keys.add(SwissEngine.pairingKey(p.player1_id, p.player2_id));
    }
    return keys;
  }
}
