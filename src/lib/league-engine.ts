// ============================================================
// MathAthlone League Engine — TypeScript Implementation
// lib/league-engine.ts
// © Mpingo Systems LLC
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export type TournamentFormat =
  | 'swiss'
  | 'round_robin'
  | 'single_elim'
  | 'double_elim'
  | 'pool_knockout';

export type BracketSide = 'winners' | 'losers';
export type MatchStatus = 'pending' | 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface AthleteRating {
  athlete_id: string;
  rating: number;
  rating_deviation: number;
  volatility: number;
  games_played: number;
  peak_rating: number;
  is_provisional: boolean;
  last_competition: Date | null;
}

export interface StandingEntry {
  athlete_id: string;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  heats_played: number;
  total_cta: number;
  avg_cta: number;
  best_cta: number;
  buchholz: number;
  buchholz_cut1: number;
  sonneborn_berger: number;
  first_places: number;
  avg_accuracy: number;
  avg_speed_ms: number;
  current_elo: number;
  elo_change: number;
}

export interface BracketMatch {
  id?: string;
  bracket_id: string;
  round: number;
  position: number;
  side: BracketSide | null;
  participant1_id: string | null;
  participant2_id: string | null;
  participant1_seed: number | null;
  participant2_seed: number | null;
  winner_id: string | null;
  loser_id: string | null;
  is_bye: boolean;
  is_grand_final: boolean;
  is_bracket_reset: boolean;
  winner_advances_to: string | null;
  loser_drops_to: string | null;
  winner_slot: 1 | 2 | null;
  status: MatchStatus;
}

export interface SwissPairing {
  player1_id: string;
  player2_id: string;
  round: number;
}

export interface QualificationRule {
  from_level: string;
  to_level: string;
  auto_qualify_top_n: number;
  points_qualify_top_n: number;
  playin_range_start: number;
  playin_range_end: number;
  playin_spots: number;
  min_heats_required: number;
  min_integrity_score: number;
  requires_verification_heat: boolean;
  requires_teacher_attestation: boolean;
}

export interface QualificationResult {
  athlete_id: string;
  status: 'auto_qualified' | 'points_qualified' | 'pending_verification' | 'playin';
  to_level: string;
}

export interface HeatResult {
  athlete_id: string;
  cta_score: number;
  accuracy: number;
  time_ms: number;
  rank_in_heat: number;
  total_participants: number;
}

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────

export const RATING_CONFIG = {
  FLOOR: 800,
  CEILING: 3000,
  STARTING: 1200,
  STARTING_RD: 350,
  STARTING_VOLATILITY: 0.06,
  MIN_RD: 30,
  MAX_RD: 350,

  // K-factors by context
  K_NEW: 40,           // First 30 games
  K_ESTABLISHED: 24,   // Standard
  K_ELITE: 16,         // Rating > 2200

  // Glicko uncertainty growth per inactive day
  C_PER_DAY: 0.5,

  // Thresholds
  PROVISIONAL_GAMES: 5,
  ELITE_RATING: 2200,
  NEW_PLAYER_GAMES: 30,
  MAX_RATING_DIFF: 400,

  // Anti-gaming
  ANOMALY_WIN_RATE_THRESHOLD: 0.95,
  ANOMALY_MIN_GAMES: 10,
  SANDBAG_DROP_THRESHOLD: 200,
  SANDBAG_RECOVERY_WIN_RATE: 0.9,
} as const;

export const CHAMPIONSHIP_POINTS: Record<number, number> = {
  1: 100,
  2: 75,
  3: 55,
  4: 55,
  5: 35,
  6: 35,
  7: 35,
  8: 35,
  9: 20,
  10: 20,
  11: 20,
  12: 20,
  13: 20,
  14: 20,
  15: 20,
  16: 20,
};
const CHAMPIONSHIP_PARTICIPATION = 5;

export const POINTS_CONFIG = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

// ────────────────────────────────────────────────────────────
// 1. ELO RATING ENGINE
// ────────────────────────────────────────────────────────────

export class EloEngine {
  /**
   * Calculate expected score (probability of winning).
   * Caps rating difference at ±400 to prevent extreme values.
   */
  static expectedScore(playerRating: number, opponentRating: number): number {
    const diff = Math.min(
      Math.max(opponentRating - playerRating, -RATING_CONFIG.MAX_RATING_DIFF),
      RATING_CONFIG.MAX_RATING_DIFF
    );
    return 1 / (1 + Math.pow(10, diff / 400));
  }

  /**
   * Determine K-factor based on player state.
   */
  static kFactor(rating: AthleteRating): number {
    if (rating.games_played < RATING_CONFIG.NEW_PLAYER_GAMES) {
      return RATING_CONFIG.K_NEW;
    }
    if (rating.rating >= RATING_CONFIG.ELITE_RATING) {
      return RATING_CONFIG.K_ELITE;
    }
    return RATING_CONFIG.K_ESTABLISHED;
  }

  /**
   * Update rating after a Heat result.
   * Converts Heat ranking into a score: top 25% = win, 25-50% = draw, bottom 50% = loss.
   */
  static updateFromHeat(
    player: AthleteRating,
    result: HeatResult,
    avgOpponentRating: number
  ): { newRating: number; change: number } {
    const percentile = 1 - (result.rank_in_heat - 1) / result.total_participants;
    let actualScore: number;

    if (percentile >= 0.75) {
      actualScore = 1.0;
    } else if (percentile >= 0.50) {
      actualScore = 0.5;
    } else {
      actualScore = 0.0;
    }

    const expected = this.expectedScore(player.rating, avgOpponentRating);
    const k = this.kFactor(player);
    const change = k * (actualScore - expected);

    const newRating = Math.max(
      RATING_CONFIG.FLOOR,
      Math.min(RATING_CONFIG.CEILING, player.rating + change)
    );

    return { newRating, change: newRating - player.rating };
  }

  /**
   * Update rating for a direct 1v1 match (bracket match).
   */
  static updateFromMatch(
    winner: AthleteRating,
    loser: AthleteRating
  ): { winnerChange: number; loserChange: number } {
    const expectedWin = this.expectedScore(winner.rating, loser.rating);
    const expectedLose = this.expectedScore(loser.rating, winner.rating);

    const kW = this.kFactor(winner);
    const kL = this.kFactor(loser);

    const winnerDelta = kW * (1 - expectedWin);
    const loserDelta = kL * (0 - expectedLose);

    return {
      winnerChange: Math.max(
        RATING_CONFIG.FLOOR - winner.rating,
        winnerDelta
      ),
      loserChange: Math.max(
        RATING_CONFIG.FLOOR - loser.rating,
        loserDelta
      ),
    };
  }
}

// ────────────────────────────────────────────────────────────
// 2. GLICKO-2 ENGINE (upgrade path)
// ────────────────────────────────────────────────────────────

export class GlickoEngine {
  private static readonly TAU = 0.5; // System constant (constrains volatility)
  private static readonly EPSILON = 0.000001;
  private static readonly SCALE = 173.7178; // 400 / ln(10)

  /**
   * Convert ELO-scale rating to Glicko-2 internal scale.
   */
  static toGlicko2(rating: number): number {
    return (rating - 1500) / this.SCALE;
  }

  /**
   * Convert Glicko-2 internal scale back to ELO-scale.
   */
  static fromGlicko2(mu: number): number {
    return mu * this.SCALE + 1500;
  }

  /**
   * Convert RD to Glicko-2 scale.
   */
  static rdToGlicko2(rd: number): number {
    return rd / this.SCALE;
  }

  static rdFromGlicko2(phi: number): number {
    return phi * this.SCALE;
  }

  /**
   * g(φ) function — reduces impact of uncertain opponents.
   */
  static g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  /**
   * Expected score E(μ, μ_j, φ_j).
   */
  static E(mu: number, mu_j: number, phi_j: number): number {
    return 1 / (1 + Math.exp(-this.g(phi_j) * (mu - mu_j)));
  }

  /**
   * Increase RD for inactive players.
   */
  static decayRD(currentRD: number, daysSinceLastGame: number): number {
    const c = RATING_CONFIG.C_PER_DAY;
    const newRD = Math.sqrt(currentRD * currentRD + c * c * daysSinceLastGame);
    return Math.min(newRD, RATING_CONFIG.MAX_RD);
  }

  /**
   * Full Glicko-2 rating update.
   * opponents: array of { rating, rd, score } where score is 1/0.5/0.
   */
  static update(
    player: AthleteRating,
    opponents: Array<{ rating: number; rd: number; score: number }>
  ): { rating: number; rd: number; volatility: number } {
    if (opponents.length === 0) {
      return {
        rating: player.rating,
        rd: this.decayRD(player.rating_deviation, 1),
        volatility: player.volatility,
      };
    }

    const mu = this.toGlicko2(player.rating);
    const phi = this.rdToGlicko2(player.rating_deviation);
    const sigma = player.volatility;

    const opps = opponents.map((o) => ({
      mu_j: this.toGlicko2(o.rating),
      phi_j: this.rdToGlicko2(o.rd),
      s_j: o.score,
    }));

    // Step 3: Compute v (estimated variance)
    let vInv = 0;
    for (const opp of opps) {
      const gVal = this.g(opp.phi_j);
      const eVal = this.E(mu, opp.mu_j, opp.phi_j);
      vInv += gVal * gVal * eVal * (1 - eVal);
    }
    const v = 1 / vInv;

    // Step 4: Compute delta
    let deltaSum = 0;
    for (const opp of opps) {
      const gVal = this.g(opp.phi_j);
      const eVal = this.E(mu, opp.mu_j, opp.phi_j);
      deltaSum += gVal * (opp.s_j - eVal);
    }
    const delta = v * deltaSum;

    // Step 5: Compute new volatility (iterative algorithm)
    const a = Math.log(sigma * sigma);
    const phiSq = phi * phi;

    const f = (x: number): number => {
      const ex = Math.exp(x);
      const denom = 2 * Math.pow(phiSq + v + ex, 2);
      return (
        (ex * (delta * delta - phiSq - v - ex)) / denom -
        (x - a) / (this.TAU * this.TAU)
      );
    };

    // Illinois algorithm
    let A = a;
    let B: number;
    if (delta * delta > phiSq + v) {
      B = Math.log(delta * delta - phiSq - v);
    } else {
      let k = 1;
      while (f(a - k * this.TAU) < 0) k++;
      B = a - k * this.TAU;
    }

    let fA = f(A);
    let fB = f(B);

    while (Math.abs(B - A) > this.EPSILON) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = f(C);

      if (fC * fB <= 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }

      B = C;
      fB = fC;
    }

    const newSigma = Math.exp(A / 2);

    // Step 6: Update phi
    const phiStar = Math.sqrt(phiSq + newSigma * newSigma);

    // Step 7: New phi and mu
    const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const newMu = mu + newPhi * newPhi * deltaSum;

    const newRating = Math.max(
      RATING_CONFIG.FLOOR,
      Math.min(RATING_CONFIG.CEILING, this.fromGlicko2(newMu))
    );
    const newRD = Math.max(
      RATING_CONFIG.MIN_RD,
      Math.min(RATING_CONFIG.MAX_RD, this.rdFromGlicko2(newPhi))
    );

    return { rating: newRating, rd: newRD, volatility: newSigma };
  }
}

// ────────────────────────────────────────────────────────────
// 3. BRACKET GENERATORS
// ────────────────────────────────────────────────────────────

export class BracketGenerator {
  /**
   * Next power of 2 ≥ n.
   */
  static nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  /**
   * Standard seed positions for bracket of given size.
   * Ensures 1 vs N, 2 vs N-1, etc. with proper bracket placement.
   */
  static generateSeedPositions(size: number): number[] {
    if (size === 2) return [1, 2];

    const smaller = this.generateSeedPositions(size / 2);
    const result: number[] = [];

    for (const seed of smaller) {
      result.push(seed);
      result.push(size + 1 - seed);
    }

    return result;
  }

  /**
   * Generate a single elimination bracket.
   */
  static singleElimination(
    bracketId: string,
    participants: Array<{ id: string; seed: number }>
  ): BracketMatch[] {
    const n = participants.length;
    const bracketSize = this.nextPowerOf2(n);
    const byes = bracketSize - n;
    const rounds = Math.log2(bracketSize);
    const seeds = this.generateSeedPositions(bracketSize);
    const matches: BracketMatch[] = [];

    // Sort participants by seed
    const sorted = [...participants].sort((a, b) => a.seed - b.seed);
    const seedMap = new Map(sorted.map((p) => [p.seed, p.id]));

    // Round 1
    for (let i = 0; i < bracketSize / 2; i++) {
      const highSeed = seeds[i * 2];
      const lowSeed = seeds[i * 2 + 1];
      const p1 = seedMap.get(highSeed) ?? null;
      const p2 = seedMap.get(lowSeed) ?? null;
      const isBye = p1 === null || p2 === null;

      matches.push({
        bracket_id: bracketId,
        round: 1,
        position: i,
        side: null,
        participant1_id: p1,
        participant2_id: p2,
        participant1_seed: p1 ? highSeed : null,
        participant2_seed: p2 ? lowSeed : null,
        winner_id: isBye ? (p1 ?? p2) : null,
        loser_id: null,
        is_bye: isBye,
        is_grand_final: false,
        is_bracket_reset: false,
        winner_advances_to: null, // linked after creation
        loser_drops_to: null,
        winner_slot: null,
        status: isBye ? 'completed' : 'pending',
      });
    }

    // Subsequent rounds (empty)
    let matchesInRound = bracketSize / 4;
    for (let round = 2; round <= rounds; round++) {
      for (let pos = 0; pos < matchesInRound; pos++) {
        matches.push({
          bracket_id: bracketId,
          round,
          position: pos,
          side: null,
          participant1_id: null,
          participant2_id: null,
          participant1_seed: null,
          participant2_seed: null,
          winner_id: null,
          loser_id: null,
          is_bye: false,
          is_grand_final: round === rounds,
          is_bracket_reset: false,
          winner_advances_to: null,
          loser_drops_to: null,
          winner_slot: null,
          status: 'pending',
        });
      }
      matchesInRound = Math.max(1, matchesInRound / 2);
    }

    // Link winner_advances_to and winner_slot
    this.linkBracketProgression(matches);

    return matches;
  }

  /**
   * Generate a double elimination bracket.
   */
  static doubleElimination(
    bracketId: string,
    participants: Array<{ id: string; seed: number }>
  ): BracketMatch[] {
    // Winners bracket = standard single elim
    const winnerMatches = this.singleElimination(bracketId, participants);
    winnerMatches.forEach((m) => (m.side = 'winners'));

    const bracketSize = this.nextPowerOf2(participants.length);
    const winnersRounds = Math.log2(bracketSize);
    const losersMatches: BracketMatch[] = [];

    // Losers bracket structure:
    // For each winners round R (1 to winnersRounds-1), losers bracket has 2 rounds:
    //   - "Drop" round: losers from winners R face each other
    //   - "Challenge" round: drop-round winners face fresh losers from winners R+1
    let losersRound = 1;
    let currentLosersCount = bracketSize / 2; // Round 1 produces this many losers

    for (let wr = 1; wr < winnersRounds; wr++) {
      // Drop round: pair up the losers
      const dropMatches = Math.floor(currentLosersCount / 2);
      for (let pos = 0; pos < dropMatches; pos++) {
        losersMatches.push({
          bracket_id: bracketId,
          round: losersRound,
          position: pos,
          side: 'losers',
          participant1_id: null,
          participant2_id: null,
          participant1_seed: null,
          participant2_seed: null,
          winner_id: null,
          loser_id: null,
          is_bye: false,
          is_grand_final: false,
          is_bracket_reset: false,
          winner_advances_to: null,
          loser_drops_to: null,
          winner_slot: null,
          status: 'pending',
        });
      }
      losersRound++;
      currentLosersCount = dropMatches;

      // Challenge round: survivors face new losers from next winners round
      const challengeMatches = currentLosersCount;
      for (let pos = 0; pos < challengeMatches; pos++) {
        losersMatches.push({
          bracket_id: bracketId,
          round: losersRound,
          position: pos,
          side: 'losers',
          participant1_id: null,
          participant2_id: null,
          participant1_seed: null,
          participant2_seed: null,
          winner_id: null,
          loser_id: null,
          is_bye: false,
          is_grand_final: false,
          is_bracket_reset: false,
          winner_advances_to: null,
          loser_drops_to: null,
          winner_slot: null,
          status: 'pending',
        });
      }
      losersRound++;
    }

    // Grand Final: winners bracket champion vs losers bracket champion
    const grandFinal: BracketMatch = {
      bracket_id: bracketId,
      round: losersRound,
      position: 0,
      side: null,
      participant1_id: null,
      participant2_id: null,
      participant1_seed: null,
      participant2_seed: null,
      winner_id: null,
      loser_id: null,
      is_bye: false,
      is_grand_final: true,
      is_bracket_reset: false,
      winner_advances_to: null,
      loser_drops_to: null,
      winner_slot: null,
      status: 'pending',
    };

    // Optional bracket reset
    const resetMatch: BracketMatch = {
      ...grandFinal,
      round: losersRound + 1,
      is_bracket_reset: true,
    };

    const allMatches = [...winnerMatches, ...losersMatches, grandFinal, resetMatch];

    // Link losers from winners bracket into losers bracket
    this.linkDoubleElimProgression(allMatches, winnersRounds);

    return allMatches;
  }

  /**
   * Link winner_advances_to pointers for single elim.
   */
  private static linkBracketProgression(matches: BracketMatch[]): void {
    const byRound = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      const arr = byRound.get(m.round) || [];
      arr.push(m);
      byRound.set(m.round, arr);
    }

    const rounds = [...byRound.keys()].sort((a, b) => a - b);

    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = byRound.get(rounds[i])!;
      const nextRound = byRound.get(rounds[i + 1])!;

      currentRound.sort((a, b) => a.position - b.position);
      nextRound.sort((a, b) => a.position - b.position);

      for (let j = 0; j < currentRound.length; j++) {
        const nextPos = Math.floor(j / 2);
        const slot: 1 | 2 = (j % 2 === 0) ? 1 : 2;

        // We'll use position as a pseudo-ID for now; real DB will use UUIDs
        currentRound[j].winner_advances_to = `${rounds[i + 1]}-${nextPos}` as any;
        currentRound[j].winner_slot = slot;
      }
    }
  }

  /**
   * Link double elimination cross-bracket progression.
   */
  private static linkDoubleElimProgression(
    matches: BracketMatch[],
    winnersRounds: number
  ): void {
    // Link winners bracket internally
    const winnersOnly = matches.filter((m) => m.side === 'winners');
    this.linkBracketProgression(winnersOnly);

    // Link losers from winners into losers bracket
    const losersOnly = matches.filter((m) => m.side === 'losers');

    for (const wm of winnersOnly) {
      // Find corresponding losers bracket drop-round match
      const losersTarget = losersOnly.find(
        (lm) =>
          lm.round === (wm.round * 2 - 1) &&
          lm.position === Math.floor(wm.position / 2)
      );
      if (losersTarget) {
        wm.loser_drops_to = `losers-${losersTarget.round}-${losersTarget.position}` as any;
      }
    }

    // Link losers bracket internally
    this.linkBracketProgression(losersOnly);
  }
}

// ────────────────────────────────────────────────────────────
// 4. SWISS PAIRING ENGINE
// ────────────────────────────────────────────────────────────

export class SwissEngine {
  /**
   * Optimal number of Swiss rounds for N participants.
   */
  static optimalRounds(participants: number): number {
    return Math.ceil(Math.log2(participants));
  }

  /**
   * Generate pairings for one Swiss round.
   * Pairs players with the same score; within a group, pairs by rating.
   * Avoids rematches from previous rounds.
   */
  static generateRound(
    standings: StandingEntry[],
    previousPairings: Set<string>, // "id1-id2" sorted
    roundNumber: number
  ): SwissPairing[] {
    // Group by points
    const scoreGroups = new Map<number, StandingEntry[]>();
    for (const entry of standings) {
      const group = scoreGroups.get(entry.points) || [];
      group.push(entry);
      scoreGroups.set(entry.points, group);
    }

    const pairings: SwissPairing[] = [];
    const paired = new Set<string>();
    const floaters: StandingEntry[] = [];

    // Process groups from highest score to lowest
    const sortedScores = [...scoreGroups.keys()].sort((a, b) => b - a);

    for (const score of sortedScores) {
      const group = [...(scoreGroups.get(score) || []), ...floaters.splice(0)];

      // Sort within group by rating (highest first)
      group.sort((a, b) => b.current_elo - a.current_elo);

      // Split into top half (S1) and bottom half (S2) — Monrad system
      const unpaired = group.filter((p) => !paired.has(p.athlete_id));
      const midpoint = Math.ceil(unpaired.length / 2);
      const s1 = unpaired.slice(0, midpoint);
      const s2 = unpaired.slice(midpoint);

      for (let i = 0; i < s1.length; i++) {
        const player = s1[i];
        if (paired.has(player.athlete_id)) continue;

        // Find valid opponent from S2
        let opponent: StandingEntry | null = null;

        for (const candidate of s2) {
          if (paired.has(candidate.athlete_id)) continue;

          const pairingKey = this.pairingKey(player.athlete_id, candidate.athlete_id);
          if (previousPairings.has(pairingKey)) continue;

          opponent = candidate;
          break;
        }

        // If no valid S2 opponent, try remaining S1
        if (!opponent) {
          for (const candidate of s1) {
            if (candidate.athlete_id === player.athlete_id) continue;
            if (paired.has(candidate.athlete_id)) continue;

            const pairingKey = this.pairingKey(player.athlete_id, candidate.athlete_id);
            if (previousPairings.has(pairingKey)) continue;

            opponent = candidate;
            break;
          }
        }

        if (opponent) {
          pairings.push({
            player1_id: player.athlete_id,
            player2_id: opponent.athlete_id,
            round: roundNumber,
          });
          paired.add(player.athlete_id);
          paired.add(opponent.athlete_id);
        } else {
          // Float down to next score group
          floaters.push(player);
        }
      }

      // Also float any unpaired S2 players
      for (const p of s2) {
        if (!paired.has(p.athlete_id)) {
          floaters.push(p);
        }
      }
    }

    // Handle bye for odd player count
    if (floaters.length === 1) {
      pairings.push({
        player1_id: floaters[0].athlete_id,
        player2_id: 'BYE',
        round: roundNumber,
      });
    }

    return pairings;
  }

  /**
   * Canonical pairing key (sorted IDs).
   */
  static pairingKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }
}

// ────────────────────────────────────────────────────────────
// 5. ROUND ROBIN GENERATOR
// ────────────────────────────────────────────────────────────

export class RoundRobinGenerator {
  /**
   * Circle method (Berger tables) — generates a complete round robin schedule.
   */
  static generate(
    participantIds: string[]
  ): Array<{ round: number; matches: Array<{ home: string; away: string }> }> {
    const ids = [...participantIds];
    const isOdd = ids.length % 2 === 1;

    if (isOdd) ids.push('BYE');

    const n = ids.length;
    const rounds: Array<{ round: number; matches: Array<{ home: string; away: string }> }> = [];

    // Fix first team, rotate the rest
    for (let round = 0; round < n - 1; round++) {
      const matches: Array<{ home: string; away: string }> = [];

      for (let i = 0; i < n / 2; i++) {
        const homeIdx = i === 0 ? 0 : ((round + i - 1) % (n - 1)) + 1;
        const awayIdx = ((round + n - 1 - i - 1) % (n - 1)) + 1;

        const home = ids[homeIdx];
        const away = ids[awayIdx];

        if (home !== 'BYE' && away !== 'BYE') {
          matches.push({ home, away });
        }
      }

      rounds.push({ round: round + 1, matches });
    }

    return rounds;
  }

  /**
   * Total matches in a round robin.
   */
  static totalMatches(n: number): number {
    return (n * (n - 1)) / 2;
  }
}

// ────────────────────────────────────────────────────────────
// 6. STANDINGS CALCULATOR
// ────────────────────────────────────────────────────────────

export class StandingsCalculator {
  /**
   * Compare two entries using the configured tiebreaker order.
   * Returns negative if a > b (a ranks higher).
   */
  static compare(
    a: StandingEntry,
    b: StandingEntry,
    tiebreakerOrder: string[]
  ): number {
    // Primary: always points first
    if (a.points !== b.points) return b.points - a.points;

    for (const tb of tiebreakerOrder) {
      let diff = 0;

      switch (tb) {
        case 'head_to_head':
          // Requires external lookup — skip here, handled in full calculation
          break;
        case 'buchholz_cut1':
          diff = b.buchholz_cut1 - a.buchholz_cut1;
          break;
        case 'buchholz':
          diff = b.buchholz - a.buchholz;
          break;
        case 'sonneborn_berger':
          diff = b.sonneborn_berger - a.sonneborn_berger;
          break;
        case 'total_cta':
          diff = b.total_cta - a.total_cta;
          break;
        case 'avg_accuracy':
          diff = b.avg_accuracy - a.avg_accuracy;
          break;
        case 'avg_speed':
          diff = a.avg_speed_ms - b.avg_speed_ms; // lower is better
          break;
        case 'first_places':
          diff = b.first_places - a.first_places;
          break;
        case 'wins':
          diff = b.wins - a.wins;
          break;
      }

      if (Math.abs(diff) > 0.001) return diff;
    }

    return 0; // True tie — share rank
  }

  /**
   * Calculate Buchholz scores for all entries.
   * Buchholz = sum of all opponents' final scores.
   * Buchholz Cut 1 = Buchholz minus the lowest opponent score.
   */
  static calculateBuchholz(
    standings: StandingEntry[],
    opponentMap: Map<string, string[]>, // athlete_id → opponent_ids
    pointsMap: Map<string, number> // athlete_id → points
  ): void {
    for (const entry of standings) {
      const opponents = opponentMap.get(entry.athlete_id) || [];
      const oppScores = opponents
        .map((oppId) => pointsMap.get(oppId) ?? 0)
        .sort((a, b) => a - b);

      entry.buchholz = oppScores.reduce((sum, s) => sum + s, 0);
      entry.buchholz_cut1 =
        oppScores.length > 1
          ? oppScores.slice(1).reduce((sum, s) => sum + s, 0)
          : entry.buchholz;
    }
  }

  /**
   * Calculate Sonneborn-Berger scores.
   * SB = sum of (beaten opponents' scores) + 0.5 × (drawn opponents' scores)
   */
  static calculateSonnebornBerger(
    standings: StandingEntry[],
    results: Map<string, Map<string, 'win' | 'loss' | 'draw'>>, // athlete → opponent → result
    pointsMap: Map<string, number>
  ): void {
    for (const entry of standings) {
      const oppResults = results.get(entry.athlete_id);
      if (!oppResults) {
        entry.sonneborn_berger = 0;
        continue;
      }

      let sb = 0;
      for (const [oppId, result] of oppResults) {
        const oppPoints = pointsMap.get(oppId) ?? 0;
        if (result === 'win') sb += oppPoints;
        else if (result === 'draw') sb += oppPoints * 0.5;
      }

      entry.sonneborn_berger = sb;
    }
  }

  /**
   * Assign ranks to sorted standings, handling ties.
   * Ties share the same rank; next rank skips (1, 2, 2, 4).
   */
  static assignRanks(
    standings: StandingEntry[],
    tiebreakerOrder: string[]
  ): void {
    if (standings.length === 0) return;

    standings.sort((a, b) => this.compare(a, b, tiebreakerOrder));

    standings[0].rank = 1;
    for (let i = 1; i < standings.length; i++) {
      const cmp = this.compare(standings[i], standings[i - 1], tiebreakerOrder);
      standings[i].rank = cmp === 0 ? standings[i - 1].rank : i + 1;
    }
  }
}

// ────────────────────────────────────────────────────────────
// 7. ADVANCEMENT ENGINE
// ────────────────────────────────────────────────────────────

export class AdvancementEngine {
  /**
   * Process end-of-split qualification.
   */
  static processQualification(
    standings: StandingEntry[],
    championshipStandings: Array<{ athlete_id: string; total_points: number }>,
    rule: QualificationRule
  ): QualificationResult[] {
    const results: QualificationResult[] = [];
    const qualified = new Set<string>();

    // 1. Auto-qualify top N by standings
    for (let i = 0; i < Math.min(rule.auto_qualify_top_n, standings.length); i++) {
      const athlete = standings[i];
      if (athlete.heats_played >= rule.min_heats_required) {
        results.push({
          athlete_id: athlete.athlete_id,
          status: 'auto_qualified',
          to_level: rule.to_level,
        });
        qualified.add(athlete.athlete_id);
      }
    }

    // 2. Points qualification from championship standings
    const pointsSorted = [...championshipStandings].sort(
      (a, b) => b.total_points - a.total_points
    );

    let pointsQualified = 0;
    for (const cs of pointsSorted) {
      if (qualified.has(cs.athlete_id)) continue;
      if (pointsQualified >= rule.points_qualify_top_n) break;

      results.push({
        athlete_id: cs.athlete_id,
        status: rule.requires_verification_heat
          ? 'pending_verification'
          : 'points_qualified',
        to_level: rule.to_level,
      });
      qualified.add(cs.athlete_id);
      pointsQualified++;
    }

    // 3. Play-in participants
    for (
      let i = rule.playin_range_start - 1;
      i < Math.min(rule.playin_range_end, standings.length);
      i++
    ) {
      const athlete = standings[i];
      if (qualified.has(athlete.athlete_id)) continue;

      results.push({
        athlete_id: athlete.athlete_id,
        status: 'playin',
        to_level: rule.to_level,
      });
    }

    return results;
  }

  /**
   * Award championship points based on final placement.
   */
  static awardChampionshipPoints(
    finalStandings: StandingEntry[]
  ): Array<{ athlete_id: string; placement: number; points: number }> {
    return finalStandings.map((s) => ({
      athlete_id: s.athlete_id,
      placement: s.rank,
      points: CHAMPIONSHIP_POINTS[s.rank] ?? CHAMPIONSHIP_PARTICIPATION,
    }));
  }
}

// ────────────────────────────────────────────────────────────
// 8. ANOMALY DETECTOR (anti-gaming)
// ────────────────────────────────────────────────────────────

export interface AnomalyFlag {
  athlete_id: string;
  flag_type: 'BOOSTING' | 'SANDBAGGING' | 'SUSPICIOUS_PATTERN' | 'RATING_FARMING';
  severity: 'warning' | 'review' | 'block';
  evidence: Record<string, any>;
}

export class AnomalyDetector {
  /**
   * Check for boosting: suspiciously high win rate against a specific opponent.
   */
  static checkBoosting(
    athleteId: string,
    h2hRecords: Array<{
      opponent_id: string;
      wins: number;
      losses: number;
      total_games: number;
    }>
  ): AnomalyFlag[] {
    const flags: AnomalyFlag[] = [];

    for (const record of h2hRecords) {
      if (record.total_games < RATING_CONFIG.ANOMALY_MIN_GAMES) continue;

      const winRate = record.wins / record.total_games;
      if (winRate >= RATING_CONFIG.ANOMALY_WIN_RATE_THRESHOLD) {
        flags.push({
          athlete_id: athleteId,
          flag_type: 'BOOSTING',
          severity: winRate >= 0.99 ? 'review' : 'warning',
          evidence: {
            opponent_id: record.opponent_id,
            win_rate: winRate,
            games: record.total_games,
          },
        });
      }
    }

    return flags;
  }

  /**
   * Check for sandbagging: intentional rating drop followed by easy wins.
   */
  static checkSandbagging(
    ratingHistory: Array<{ rating: number; created_at: Date }>
  ): AnomalyFlag | null {
    if (ratingHistory.length < 20) return null;

    // Find biggest contiguous drop
    let maxDrop = 0;
    let dropStart = 0;

    for (let i = 1; i < ratingHistory.length; i++) {
      const drop = ratingHistory[i - 1].rating - ratingHistory[i].rating;
      if (drop > maxDrop) {
        maxDrop = drop;
        dropStart = i;
      }
    }

    if (maxDrop < RATING_CONFIG.SANDBAG_DROP_THRESHOLD) return null;

    // Check post-drop win streak
    const postDrop = ratingHistory.slice(dropStart);
    const gains = postDrop.filter(
      (_, i) => i > 0 && postDrop[i].rating > postDrop[i - 1].rating
    );
    const recoveryRate = gains.length / Math.max(1, postDrop.length - 1);

    if (recoveryRate >= RATING_CONFIG.SANDBAG_RECOVERY_WIN_RATE) {
      return {
        athlete_id: '', // caller fills in
        flag_type: 'SANDBAGGING',
        severity: 'review',
        evidence: {
          drop_amount: maxDrop,
          recovery_rate: recoveryRate,
          drop_period_games: postDrop.length,
        },
      };
    }

    return null;
  }
}

// ────────────────────────────────────────────────────────────
// 9. COMPOUND SCORE ENCODING (for leaderboard sorting)
// ────────────────────────────────────────────────────────────

export class CompoundScore {
  /**
   * Encode multiple ranking dimensions into a single sortable number.
   * Format: PPPPPP_AAA_TTTTTT (primary, accuracy, inverted time)
   */
  static encode(
    primaryScore: number,
    accuracy: number,       // 0-100
    timeMs: number          // lower is better
  ): number {
    const invertedTime = 999999 - Math.min(Math.round(timeMs), 999999);
    return (
      Math.round(primaryScore) * 1_000_000_000 +
      Math.round(accuracy * 10) * 1_000_000 +
      invertedTime
    );
  }

  /**
   * Decode compound score back into components.
   */
  static decode(encoded: number): {
    primaryScore: number;
    accuracy: number;
    timeMs: number;
  } {
    const primaryScore = Math.floor(encoded / 1_000_000_000);
    const remainder = encoded % 1_000_000_000;
    const accuracyEncoded = Math.floor(remainder / 1_000_000);
    const invertedTime = remainder % 1_000_000;

    return {
      primaryScore,
      accuracy: accuracyEncoded / 10,
      timeMs: 999999 - invertedTime,
    };
  }
}

// ────────────────────────────────────────────────────────────
// 10. SUPABASE INTEGRATION LAYER
// ────────────────────────────────────────────────────────────

export class LeagueEngineService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Submit a Heat result and update all affected systems.
   */
  async processHeatResult(
    leagueId: string,
    heatId: string,
    results: HeatResult[]
  ): Promise<void> {
    // 1. Calculate average opponent rating
    const { data: ratings } = await this.supabase
      .from('athlete_ratings')
      .select('athlete_id, rating, rating_deviation, volatility, games_played, peak_rating, is_provisional, last_competition')
      .in('athlete_id', results.map((r) => r.athlete_id));

    const ratingsMap = new Map(
      (ratings || []).map((r) => [r.athlete_id, r as AthleteRating])
    );

    const avgRating =
      (ratings || []).reduce((sum, r) => sum + r.rating, 0) /
      Math.max(1, (ratings || []).length);

    // 2. Update each athlete's rating
    for (const result of results) {
      const currentRating = ratingsMap.get(result.athlete_id);
      if (!currentRating) continue;

      const { newRating, change } = EloEngine.updateFromHeat(
        currentRating,
        result,
        avgRating
      );

      // Record history
      await this.supabase.from('rating_history').insert({
        athlete_id: result.athlete_id,
        heat_id: heatId,
        league_id: leagueId,
        rating_before: currentRating.rating,
        rating_after: newRating,
        rd_before: currentRating.rating_deviation,
        rd_after: currentRating.rating_deviation, // ELO doesn't change RD
        k_factor_used: EloEngine.kFactor(currentRating),
        expected_score: EloEngine.expectedScore(currentRating.rating, avgRating),
        actual_score: result.rank_in_heat <= result.total_participants * 0.25 ? 1 : 
                      result.rank_in_heat <= result.total_participants * 0.5 ? 0.5 : 0,
      });

      // Update rating
      await this.supabase
        .from('athlete_ratings')
        .update({
          rating: newRating,
          games_played: currentRating.games_played + 1,
          last_competition: new Date().toISOString(),
        })
        .eq('athlete_id', result.athlete_id);
    }

    // 3. Update league standings
    await this.recalculateStandings(leagueId);
  }

  /**
   * Recalculate all standings for a league.
   */
  async recalculateStandings(leagueId: string): Promise<void> {
    const { data: standings } = await this.supabase
      .from('league_standings')
      .select('*')
      .eq('league_id', leagueId);

    if (!standings || standings.length === 0) return;

    const { data: league } = await this.supabase
      .from('leagues')
      .select('tiebreaker_order')
      .eq('id', leagueId)
      .single();

    const tiebreakerOrder = league?.tiebreaker_order || [
      'head_to_head',
      'buchholz_cut1',
      'total_cta',
    ];

    const entries = standings as StandingEntry[];
    StandingsCalculator.assignRanks(entries, tiebreakerOrder);

    // Batch update ranks
    for (const entry of entries) {
      await this.supabase
        .from('league_standings')
        .update({ rank: entry.rank, last_updated: new Date().toISOString() })
        .eq('league_id', leagueId)
        .eq('athlete_id', entry.athlete_id);
    }
  }

  /**
   * Generate a bracket for a league's playoffs.
   */
  async createBracket(
    leagueId: string,
    splitId: string,
    name: string,
    format: TournamentFormat,
    participants: Array<{ id: string; seed: number }>
  ): Promise<string> {
    const bracketSize = BracketGenerator.nextPowerOf2(participants.length);
    const rounds = Math.log2(bracketSize);

    // Create bracket record
    const { data: bracket, error } = await this.supabase
      .from('brackets')
      .insert({
        league_id: leagueId,
        split_id: splitId,
        name,
        format,
        participant_count: participants.length,
        rounds_count: rounds,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !bracket) throw new Error(`Failed to create bracket: ${error?.message}`);

    // Generate matches
    let matches: BracketMatch[];
    if (format === 'single_elim') {
      matches = BracketGenerator.singleElimination(bracket.id, participants);
    } else if (format === 'double_elim') {
      matches = BracketGenerator.doubleElimination(bracket.id, participants);
    } else {
      throw new Error(`Bracket generation not supported for format: ${format}`);
    }

    // Insert matches
    const { error: matchError } = await this.supabase
      .from('bracket_matches')
      .insert(matches);

    if (matchError) throw new Error(`Failed to insert matches: ${matchError.message}`);

    return bracket.id;
  }

  /**
   * Complete a bracket match and trigger advancement.
   */
  async completeBracketMatch(
    matchId: string,
    winnerId: string,
    loserId: string,
    heatId: string,
    p1Cta: number,
    p2Cta: number
  ): Promise<void> {
    await this.supabase
      .from('bracket_matches')
      .update({
        winner_id: winnerId,
        loser_id: loserId,
        heat_id: heatId,
        p1_cta_score: p1Cta,
        p2_cta_score: p2Cta,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    // The bracket_match_advance trigger handles progression automatically
  }

  /**
   * Award championship points at end of split.
   */
  async awardSplitPoints(
    leagueId: string,
    seasonId: string,
    splitId: string
  ): Promise<void> {
    const { data: standings } = await this.supabase
      .from('league_standings')
      .select('*')
      .eq('league_id', leagueId)
      .order('rank');

    if (!standings) return;

    const awards = AdvancementEngine.awardChampionshipPoints(
      standings as StandingEntry[]
    );

    for (const award of awards) {
      await this.supabase.from('championship_points').upsert({
        athlete_id: award.athlete_id,
        season_id: seasonId,
        split_id: splitId,
        league_id: leagueId,
        placement: award.placement,
        points_earned: award.points,
      });
    }

    // Recalculate season totals
    await this.supabase.rpc('recalculate_season_totals', {
      p_season_id: seasonId,
    });

    // Refresh leaderboard
    await this.supabase.rpc('refresh_global_leaderboard');
  }
}

// ────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────

export default {
  EloEngine,
  GlickoEngine,
  BracketGenerator,
  SwissEngine,
  RoundRobinGenerator,
  StandingsCalculator,
  AdvancementEngine,
  AnomalyDetector,
  CompoundScore,
  LeagueEngineService,
  RATING_CONFIG,
  CHAMPIONSHIP_POINTS,
  POINTS_CONFIG,
};
