# MathAthlone League Engine — Research & Design Document

## Executive Summary

This document outlines a **tournament-grade league management system** for MathAthlone based on research into chess tournament systems, esports leagues (LCS, LCK, Valorant), FIFA/UEFA structures, and modern bracket management platforms (Challonge, Battlefy, FACEIT).

The goal: A durable, dynamic system that handles everything from classroom practice to national championships with automated standings, brackets, advancement, and real-time updates.

---

## Part 1: Tournament Format Research

### 1.1 Format Comparison

| Format | Matches | Fairness | Time | Best For |
|--------|---------|----------|------|----------|
| **Single Elimination** | N-1 | Low | Fast | Quick events, dramatic finals |
| **Double Elimination** | 2N-2 to 2N-1 | High | Medium | Fair determination, second chances |
| **Round Robin** | N(N-1)/2 | Highest | Slow | Small groups, complete rankings |
| **Swiss System** | ~log₂(N) rounds | High | Medium | Large fields, efficient pairing |
| **Pool Play + Knockout** | Varies | High | Medium | Group fairness + knockout drama |

### 1.2 Format Selection for MathAthlone

| Competition Level | Recommended Format | Rationale |
|-------------------|-------------------|-----------|
| **Classroom Practice** | Swiss (3-5 rounds) | Everyone plays, rankings emerge |
| **School League** | Round Robin | Fair complete ranking |
| **District Playoffs** | Double Elimination | Fair, dramatic, forgiving |
| **Regional/State** | Swiss → Single Elim | Efficient qualification + knockout |
| **National** | Pool Play → Double Elim | Complete fairness + drama |

---

## Part 2: Seeding & Rating Systems

### 2.1 ELO Rating System

The gold standard for competitive ranking. Used by FIDE (chess), FIFA, and most esports.

**Core Formula:**
```
New Rating = Old Rating + K × (Actual Score - Expected Score)

Where:
- Expected Score = 1 / (1 + 10^((Opponent Rating - Player Rating) / 400))
- K = Development factor (32 for new players, 24 for established, 16 for elite)
- Actual Score = 1 (win), 0.5 (draw), 0 (loss)
```

**MathAthlone Adaptation:**
- Starting ELO: 1000 for new Mathletes
- K-factor: 40 (classroom), 32 (school), 24 (district+)
- "Win" = Top 25% in Heat
- "Draw" = 25-50%
- "Loss" = Bottom 50%

### 2.2 CTA-ELO Hybrid

Combine our CTA scoring with ELO for richer rankings:

```
Heat Performance Score = (CTA_Score / Max_CTA_Score)
ELO_Adjustment = K × (Performance_Score - Expected_Score)
```

### 2.3 Seeding Algorithm

Standard bracket seeding ensures top seeds don't meet until later rounds:

**For 16 seeds:**
```
Round 1 matchups:
1 vs 16, 8 vs 9, 4 vs 13, 5 vs 12
2 vs 15, 7 vs 10, 3 vs 14, 6 vs 11
```

**General Formula:**
- Seed 1 plays at position 1
- Seed 2 plays at position N (opposite bracket)
- Seeds 3-4 at positions N/2 and N/2+1 (quarter opposites)
- Continue recursively

### 2.4 Bye Handling

When participants ≠ power of 2:
```
Number of Byes = Next Power of 2 - Participant Count
Example: 10 participants → 16 - 10 = 6 byes
```

**Rules:**
- Top seeds ALWAYS get byes (rewards strong performance)
- Byes advance to Round 2 with no opponent
- For tiebreakers, bye = 0.5 win (half-point)

---

## Part 3: Tiebreaker Systems

### 3.1 FIDE-Recommended Order (Swiss)

1. **Buchholz Cut 1** — Sum of opponents' scores, excluding lowest
2. **Buchholz** — Sum of all opponents' scores
3. **Sonneborn-Berger** — Opponents defeated × their score + 0.5 × drawn opponents' score
4. **Direct Encounter** — Head-to-head result
5. **Number of Wins** — More decisive play
6. **Progressive Score** — Cumulative score round by round
7. **Drawing of Lots** — Last resort

### 3.2 MathAthlone Tiebreaker Order

For our CTA-based system:

1. **Head-to-Head CTA** — If tied players competed in same Heat
2. **Buchholz Cut 1** — Strength of opposition
3. **Total CTA Score** — Raw performance
4. **Average Accuracy** — Correctness priority
5. **Average Speed** — Time efficiency
6. **Number of First Places** — Consistency at top
7. **Most Recent Performance** — Current form

### 3.3 Buchholz Calculation Example

```
Player A opponents scored: 5, 4, 3, 2, 1 points
Buchholz = 5 + 4 + 3 + 2 + 1 = 15
Buchholz Cut 1 = 5 + 4 + 3 + 2 = 14 (drop lowest)
```

### 3.4 Sonneborn-Berger Calculation

```
Player beat opponents with 5, 3 points
Player drew with opponent with 4 points
Player lost to opponent with 6 points

SB Score = 5 + 3 + (4 × 0.5) + 0 = 10
```

---

## Part 4: League Structure Design

### 4.1 Season Structure

Modeled after modern esports (3 splits per year):

```
┌─────────────────────────────────────────────────────────────┐
│                    SEASON STRUCTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SPLIT 1 (Fall)          SPLIT 2 (Winter)    SPLIT 3 (Spring)
│  ─────────────           ───────────────     ───────────────
│  Aug - Nov               Dec - Feb           Mar - May
│                                                             │
│  Regular Season          Regular Season      Regular Season │
│  └─> Playoffs            └─> Playoffs        └─> Playoffs   │
│      └─> Regional            └─> State           └─> National
│                                                             │
│  Championship Points accumulate across all splits           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Championship Points System

Points earned based on final placement in each split:

| Placement | Points |
|-----------|--------|
| 1st | 100 |
| 2nd | 75 |
| 3rd-4th | 55 |
| 5th-8th | 35 |
| 9th-16th | 20 |
| Participated | 5 |

**Qualification Thresholds (example for State):**
- Auto-qualify: Top 3 in Regional Playoffs
- Points qualify: Top 8 in Championship Points
- Play-in: 9th-16th in Championship Points compete for final 4 spots

### 4.3 League Hierarchy

```
NATIONAL CHAMPIONSHIP
        ↑
   STATE FINALS (50 states)
        ↑
   REGIONAL PLAYOFFS (8-10 per state)
        ↑
   DISTRICT LEAGUE (counties/areas)
        ↑
   SCHOOL LEAGUE (internal)
        ↑
   CLASSROOM (practice)
```

### 4.4 Promotion & Relegation

At end of each season:
- **Bottom 2** of higher division relegated
- **Top 2** of lower division promoted
- **3rd-4th from bottom** play promotion/relegation playoff against 3rd-4th from top of lower division

---

## Part 5: Bracket Generation Algorithms

### 5.1 Single Elimination Bracket

```typescript
function generateSingleElimBracket(participants: number): BracketMatch[] {
  const bracketSize = nextPowerOf2(participants);
  const byes = bracketSize - participants;
  const rounds = Math.log2(bracketSize);
  const matches: BracketMatch[] = [];
  
  // Generate seeding positions
  const seeds = generateSeedPositions(bracketSize);
  
  // Create Round 1 matches
  for (let i = 0; i < bracketSize / 2; i++) {
    const highSeed = seeds[i * 2];
    const lowSeed = seeds[i * 2 + 1];
    
    matches.push({
      round: 1,
      position: i,
      participant1_seed: highSeed,
      participant2_seed: lowSeed,
      is_bye: highSeed > participants || lowSeed > participants
    });
  }
  
  // Generate subsequent rounds (empty until winners determined)
  let matchesInRound = bracketSize / 4;
  for (let round = 2; round <= rounds; round++) {
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        round,
        position: pos,
        participant1_seed: null, // TBD from previous round
        participant2_seed: null,
        is_bye: false
      });
    }
    matchesInRound /= 2;
  }
  
  return matches;
}

function generateSeedPositions(size: number): number[] {
  if (size === 2) return [1, 2];
  
  const smaller = generateSeedPositions(size / 2);
  const result: number[] = [];
  
  for (const seed of smaller) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  
  return result;
}
```

### 5.2 Double Elimination Bracket

```typescript
function generateDoubleElimBracket(participants: number): {
  winners: BracketMatch[];
  losers: BracketMatch[];
  grandFinal: BracketMatch;
} {
  const winners = generateSingleElimBracket(participants);
  const losers: BracketMatch[] = [];
  
  // Losers bracket has more complex structure
  // Round 1 losers: W bracket Round 1 losers face each other
  // Round 2 losers: R1L winners vs W bracket Round 2 losers
  // Pattern continues...
  
  const bracketSize = nextPowerOf2(participants);
  const winnersRounds = Math.log2(bracketSize);
  const losersRounds = (winnersRounds - 1) * 2;
  
  // Generate losers bracket matches
  // (complex logic for feeding from winners bracket)
  
  return {
    winners,
    losers,
    grandFinal: {
      round: winnersRounds + 1,
      position: 0,
      is_grand_final: true,
      bracket_reset_possible: true
    }
  };
}
```

### 5.3 Swiss Pairing Algorithm

```typescript
function generateSwissRound(
  standings: StandingEntry[],
  previousPairings: Set<string>
): SwissPairing[] {
  // Group by score
  const scoreGroups = new Map<number, StandingEntry[]>();
  for (const entry of standings) {
    const group = scoreGroups.get(entry.points) || [];
    group.push(entry);
    scoreGroups.set(entry.points, group);
  }
  
  const pairings: SwissPairing[] = [];
  const paired = new Set<string>();
  
  // Sort score groups high to low
  const sortedScores = [...scoreGroups.keys()].sort((a, b) => b - a);
  
  for (const score of sortedScores) {
    const group = scoreGroups.get(score)!;
    
    // Within group, pair by rating (optional secondary sort)
    group.sort((a, b) => b.rating - a.rating);
    
    for (const player of group) {
      if (paired.has(player.id)) continue;
      
      // Find opponent: same score, not paired, not previous opponent
      const opponent = findValidOpponent(player, group, paired, previousPairings);
      
      if (opponent) {
        pairings.push({ player1: player.id, player2: opponent.id });
        paired.add(player.id);
        paired.add(opponent.id);
      }
    }
  }
  
  // Handle floaters (dropped to lower score group)
  // Handle odd player (bye)
  
  return pairings;
}

function optimalSwissRounds(participants: number): number {
  // log2(participants) rounds guarantees unique winner
  return Math.ceil(Math.log2(participants));
}
```

### 5.4 Round Robin Schedule Generator

Using the "Circle Method" (Berger tables):

```typescript
function generateRoundRobin(participants: string[]): RoundRobinRound[] {
  const n = participants.length;
  const isOdd = n % 2 === 1;
  
  // Add dummy for bye if odd
  const teams = isOdd ? [...participants, 'BYE'] : [...participants];
  const numTeams = teams.length;
  const rounds: RoundRobinRound[] = [];
  
  // Fix first team, rotate others
  for (let round = 0; round < numTeams - 1; round++) {
    const matches: Match[] = [];
    
    for (let i = 0; i < numTeams / 2; i++) {
      const home = i === 0 ? teams[0] : teams[(round + i) % (numTeams - 1) + 1];
      const away = teams[(round + numTeams - 1 - i) % (numTeams - 1) + 1];
      
      if (home !== 'BYE' && away !== 'BYE') {
        matches.push({ home, away, round: round + 1 });
      }
    }
    
    rounds.push({ round: round + 1, matches });
  }
  
  return rounds;
}
```

---

## Part 6: Real-Time Standings Engine

### 6.1 Standings Calculation

```typescript
interface StandingEntry {
  athlete_id: string;
  rank: number;
  
  // Primary metrics
  wins: number;
  losses: number;
  draws: number;
  points: number; // 3 for win, 1 for draw, 0 for loss (or custom)
  
  // CTA metrics
  total_cta: number;
  avg_cta: number;
  best_cta: number;
  
  // Tiebreakers
  head_to_head: Map<string, number>; // opponent_id -> net result
  buchholz: number;
  buchholz_cut1: number;
  sonneborn_berger: number;
  
  // Additional
  heats_played: number;
  first_places: number;
  avg_accuracy: number;
  avg_speed: number;
  
  // Rating
  elo_rating: number;
  elo_change: number;
}

function calculateStandings(
  participations: HeatParticipation[],
  config: StandingsConfig
): StandingEntry[] {
  // Aggregate all participations by athlete
  const athletes = groupByAthlete(participations);
  
  // Calculate primary metrics
  const standings = athletes.map(a => calculateMetrics(a, config));
  
  // Calculate tiebreakers (requires opponent data)
  calculateBuchholz(standings, participations);
  calculateSonnebornBerger(standings, participations);
  
  // Sort by configured criteria
  standings.sort((a, b) => compareByTiebreakers(a, b, config.tiebreaker_order));
  
  // Assign ranks (handle ties)
  assignRanks(standings);
  
  return standings;
}
```

### 6.2 Live Update System

```typescript
// Supabase Realtime subscription
const standingsChannel = supabase
  .channel('standings:league_id')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'heat_participations',
      filter: `league_id=eq.${leagueId}`
    },
    (payload) => {
      // Recalculate affected standings
      recalculateStandings(payload);
      
      // Broadcast to all subscribers
      broadcastStandingsUpdate();
    }
  )
  .subscribe();
```

---

## Part 7: Advancement Engine

### 7.1 Automatic Qualification Triggers

```typescript
interface QualificationRule {
  from_level: IntegrityLevel;
  to_level: IntegrityLevel;
  
  // Auto-qualify conditions
  auto_qualify_top_n: number;         // e.g., top 3 auto-advance
  points_qualify_top_n: number;       // e.g., top 8 by championship points
  
  // Play-in conditions  
  playin_range: [number, number];     // e.g., [9, 16] compete for remaining spots
  playin_spots: number;               // e.g., 4 spots available
  
  // Requirements
  min_heats_required: number;
  min_integrity_score: number;
  requires_verification_heat: boolean;
  requires_teacher_attestation: boolean;
}

async function processSeasonEnd(
  leagueId: string,
  rule: QualificationRule
): Promise<QualificationResult[]> {
  const standings = await getLeagueStandings(leagueId);
  const results: QualificationResult[] = [];
  
  // Auto-qualify top N
  for (let i = 0; i < rule.auto_qualify_top_n; i++) {
    if (standings[i].heats_played >= rule.min_heats_required) {
      results.push({
        athlete_id: standings[i].athlete_id,
        status: 'auto_qualified',
        to_level: rule.to_level
      });
    }
  }
  
  // Points qualification
  const pointsStandings = sortByChampionshipPoints(standings);
  for (let i = 0; i < rule.points_qualify_top_n; i++) {
    if (!results.find(r => r.athlete_id === pointsStandings[i].athlete_id)) {
      results.push({
        athlete_id: pointsStandings[i].athlete_id,
        status: rule.requires_verification_heat ? 'pending_verification' : 'qualified',
        to_level: rule.to_level
      });
    }
  }
  
  // Create play-in bracket for remaining spots
  const playinParticipants = standings
    .slice(rule.playin_range[0] - 1, rule.playin_range[1])
    .filter(s => !results.find(r => r.athlete_id === s.athlete_id));
  
  if (playinParticipants.length > 0) {
    await createPlayinBracket(leagueId, playinParticipants, rule.playin_spots);
  }
  
  return results;
}
```

### 7.2 Championship Points Accumulation

```typescript
const CHAMPIONSHIP_POINTS = {
  1: 100,
  2: 75,
  3: 55, 4: 55,
  5: 35, 6: 35, 7: 35, 8: 35,
  9: 20, 10: 20, 11: 20, 12: 20, 13: 20, 14: 20, 15: 20, 16: 20,
  default: 5 // Participation points
};

async function updateChampionshipPoints(
  seasonId: string,
  splitId: string,
  finalStandings: StandingEntry[]
): Promise<void> {
  for (const standing of finalStandings) {
    const points = CHAMPIONSHIP_POINTS[standing.rank] || CHAMPIONSHIP_POINTS.default;
    
    await supabase
      .from('championship_points')
      .upsert({
        athlete_id: standing.athlete_id,
        season_id: seasonId,
        split_id: splitId,
        placement: standing.rank,
        points_earned: points
      });
  }
  
  // Update season totals
  await recalculateSeasonTotals(seasonId);
}
```

---

## Part 8: Database Schema Design

### 8.1 Core Tables

```sql
-- Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "2026-2027 Season"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Splits within a season
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  name TEXT NOT NULL,                    -- "Fall Split", "Winter Split"
  split_number INTEGER NOT NULL,         -- 1, 2, 3
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming',        -- upcoming, active, playoffs, completed
  UNIQUE(season_id, split_number)
);

-- Leagues (per level, per division)
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  name TEXT NOT NULL,
  level integrity_level NOT NULL,        -- school, district, regional, state, national
  division_id UUID REFERENCES divisions(id),
  region TEXT,                           -- "NC", "Southeast", etc.
  
  -- Format settings
  format TEXT DEFAULT 'swiss',           -- swiss, round_robin, single_elim, double_elim
  rounds_count INTEGER,
  
  -- Standings config
  points_for_win INTEGER DEFAULT 3,
  points_for_draw INTEGER DEFAULT 1,
  points_for_loss INTEGER DEFAULT 0,
  tiebreaker_order TEXT[] DEFAULT ARRAY['head_to_head', 'buchholz_cut1', 'total_cta'],
  
  status TEXT DEFAULT 'registration',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League memberships
CREATE TABLE league_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  athlete_id UUID REFERENCES users(id),
  school_id UUID REFERENCES schools(id),
  
  -- Seeding
  seed_number INTEGER,
  initial_elo DECIMAL(6,1),
  
  -- Status
  status TEXT DEFAULT 'active',          -- active, withdrawn, disqualified
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(league_id, athlete_id)
);

-- League standings (materialized for performance)
CREATE TABLE league_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  athlete_id UUID REFERENCES users(id),
  
  -- Rank
  rank INTEGER NOT NULL,
  
  -- Win/Loss record
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  
  -- CTA metrics
  heats_played INTEGER DEFAULT 0,
  total_cta DECIMAL(10,2) DEFAULT 0,
  avg_cta DECIMAL(6,2) DEFAULT 0,
  best_cta DECIMAL(6,2) DEFAULT 0,
  
  -- Tiebreakers
  buchholz DECIMAL(8,2) DEFAULT 0,
  buchholz_cut1 DECIMAL(8,2) DEFAULT 0,
  sonneborn_berger DECIMAL(8,2) DEFAULT 0,
  
  -- Rating
  current_elo DECIMAL(6,1) DEFAULT 1000,
  elo_change DECIMAL(5,1) DEFAULT 0,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(league_id, athlete_id)
);

-- Brackets
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  name TEXT NOT NULL,                    -- "Playoffs", "Grand Final", "Play-in"
  format TEXT NOT NULL,                  -- single_elim, double_elim, swiss
  
  -- Size
  participant_count INTEGER NOT NULL,
  rounds_count INTEGER NOT NULL,
  
  -- Status
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',         -- pending, active, completed
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bracket matches
CREATE TABLE bracket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID REFERENCES brackets(id),
  
  -- Position
  round INTEGER NOT NULL,
  position INTEGER NOT NULL,
  bracket_side TEXT,                     -- 'winners', 'losers', null for single elim
  
  -- Participants (null until determined)
  participant1_id UUID REFERENCES users(id),
  participant2_id UUID REFERENCES users(id),
  participant1_seed INTEGER,
  participant2_seed INTEGER,
  
  -- Result
  winner_id UUID REFERENCES users(id),
  heat_id UUID REFERENCES heats(id),     -- The Heat that decided this match
  
  -- Special cases
  is_bye BOOLEAN DEFAULT false,
  is_grand_final BOOLEAN DEFAULT false,
  is_bracket_reset BOOLEAN DEFAULT false,
  
  -- Progression
  winner_advances_to UUID REFERENCES bracket_matches(id),
  loser_drops_to UUID REFERENCES bracket_matches(id), -- For double elim
  
  status TEXT DEFAULT 'pending',         -- pending, scheduled, live, completed
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  UNIQUE(bracket_id, round, position, bracket_side)
);

-- Championship points
CREATE TABLE championship_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES users(id),
  season_id UUID REFERENCES seasons(id),
  split_id UUID REFERENCES splits(id),
  league_id UUID REFERENCES leagues(id),
  
  placement INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, split_id, league_id)
);

-- Season championship standings
CREATE TABLE season_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  athlete_id UUID REFERENCES users(id),
  division_id UUID REFERENCES divisions(id),
  
  total_championship_points INTEGER DEFAULT 0,
  splits_participated INTEGER DEFAULT 0,
  best_placement INTEGER,
  
  -- Qualification status
  qualified_for TEXT,                    -- 'state', 'regional', 'national'
  qualification_method TEXT,             -- 'auto', 'points', 'playin'
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(season_id, athlete_id, division_id)
);

-- Head-to-head records (for tiebreakers)
CREATE TABLE head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id),
  athlete1_id UUID REFERENCES users(id),
  athlete2_id UUID REFERENCES users(id),
  
  athlete1_wins INTEGER DEFAULT 0,
  athlete2_wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  
  -- Net CTA differential
  athlete1_cta_total DECIMAL(10,2) DEFAULT 0,
  athlete2_cta_total DECIMAL(10,2) DEFAULT 0,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(league_id, athlete1_id, athlete2_id)
);
```

### 8.2 Indexes for Performance

```sql
-- Standings lookups
CREATE INDEX idx_standings_league_rank ON league_standings(league_id, rank);
CREATE INDEX idx_standings_athlete ON league_standings(athlete_id);

-- Bracket navigation
CREATE INDEX idx_bracket_matches_bracket ON bracket_matches(bracket_id, round, position);
CREATE INDEX idx_bracket_matches_status ON bracket_matches(status) WHERE status IN ('pending', 'live');

-- Championship points
CREATE INDEX idx_champ_points_season ON championship_points(season_id, points_earned DESC);
CREATE INDEX idx_champ_points_athlete ON championship_points(athlete_id);

-- Head to head
CREATE INDEX idx_h2h_lookup ON head_to_head(league_id, athlete1_id, athlete2_id);
```

### 8.3 Materialized View for Leaderboards

```sql
CREATE MATERIALIZED VIEW global_leaderboard AS
SELECT 
  u.id as athlete_id,
  u.full_name,
  u.avatar_url,
  s.name as school_name,
  d.name as division_name,
  
  -- Aggregate stats
  SUM(ls.wins) as total_wins,
  SUM(ls.heats_played) as total_heats,
  AVG(ls.avg_cta) as overall_avg_cta,
  MAX(ls.best_cta) as all_time_best_cta,
  
  -- Current rating
  (SELECT current_elo FROM league_standings 
   WHERE athlete_id = u.id 
   ORDER BY last_updated DESC LIMIT 1) as current_elo,
  
  -- Championship points this season
  (SELECT COALESCE(SUM(points_earned), 0) 
   FROM championship_points cp
   JOIN seasons sea ON cp.season_id = sea.id
   WHERE cp.athlete_id = u.id AND sea.is_active = true) as season_points

FROM users u
LEFT JOIN league_standings ls ON u.id = ls.athlete_id
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN divisions d ON u.division_id = d.id
WHERE u.role = 'athlete'
GROUP BY u.id, u.full_name, u.avatar_url, s.name, d.name;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 9: Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] League standings table & calculations
- [ ] Tiebreaker algorithms
- [ ] ELO rating system
- [ ] Basic Swiss pairing

### Phase 2: Brackets (Week 2)
- [ ] Single elimination generator
- [ ] Double elimination generator
- [ ] Bracket match progression
- [ ] Bye handling

### Phase 3: Advancement (Week 3)
- [ ] Championship points system
- [ ] Qualification rules engine
- [ ] Season/split management
- [ ] Play-in bracket generation

### Phase 4: UI (Week 4)
- [ ] Live standings component
- [ ] Interactive bracket visualization
- [ ] Season dashboard
- [ ] Advancement notifications

---

## Part 10: Key Design Decisions

### 10.1 Why Swiss for Regular Season
- Fair pairings by performance
- Everyone plays same number of rounds
- Clear standings without round robin length
- Optimal rounds = log₂(participants)

### 10.2 Why Double Elimination for Playoffs
- Second chance prevents flukes
- True best competitor emerges
- More drama (losers bracket runs)
- Clear 3rd/4th place

### 10.3 Why ELO + CTA Hybrid
- ELO provides relative strength
- CTA captures performance quality
- Combined gives richer picture
- Allows cross-league comparisons

### 10.4 Why Championship Points
- Rewards consistency across splits
- Multiple paths to qualification
- Prevents single-event domination
- Familiar to esports/F1 fans

---

## Appendix A: Format Formulas

| Format | Matches | Rounds |
|--------|---------|--------|
| Single Elim | N - 1 | log₂(N) |
| Double Elim | 2N - 2 to 2N - 1 | 2 × log₂(N) - 1 |
| Round Robin | N(N-1)/2 | N - 1 |
| Swiss | N/2 per round | log₂(N) |

## Appendix B: Standard Seed Positions (16-team)

```
Position 1:  Seed 1 vs Seed 16
Position 2:  Seed 8 vs Seed 9
Position 3:  Seed 4 vs Seed 13
Position 4:  Seed 5 vs Seed 12
Position 5:  Seed 2 vs Seed 15
Position 6:  Seed 7 vs Seed 10
Position 7:  Seed 3 vs Seed 14
Position 8:  Seed 6 vs Seed 11
```

---

## Part 10: Academic Math Competition Patterns (AMC/MATHCOUNTS)

### 10.1 AMC Qualification Pipeline

MathAthlone should mirror the proven AMC structure:

```
AMC 8/10/12 (25 questions, 75 min)
    ↓ Top 2.5% (AMC 10) / Top 5% (AMC 12)
AIME (15 questions, 3 hours)
    ↓ Top ~500 by AMC+AIME index
USAJMO / USAMO (6 proof questions, 2 days)
    ↓ Top ~45
MOP (Math Olympiad Program)
    ↓ Top 6
IMO Team
```

**Key Takeaways for MathAthlone:**
- **Tiered qualification** with clear cutoffs
- **Combined index scores** (AMC + AIME) for advancement
- **Multiple pathways** (AMC 10 → USAJMO vs AMC 12 → USAMO)
- **Invitational rounds** add prestige

### 10.2 MATHCOUNTS Round Structure

Perfect model for MathAthlone Heats:

| Round | Format | Questions | Time | Calculator |
|-------|--------|-----------|------|------------|
| **Sprint** | Individual, no calc | 30 | 40 min | ❌ |
| **Target** | Individual, pairs of problems | 8 (4 pairs) | 6 min each | ✅ |
| **Team** | Collaborative, 4 students | 10 | 20 min | ✅ |
| **Countdown** | 1v1 buzzer elimination | Varies | 45 sec each | ❌ |

**Adaptation for MathAthlone:**
```typescript
enum HeatFormat {
  SPRINT = 'sprint',      // 20 questions, 15 min, no calculator
  TARGET = 'target',      // 10 questions, 20 min, calculator OK
  TEAM = 'team',          // 10 questions, 4 players collaborate
  COUNTDOWN = 'countdown' // 1v1 rapid fire elimination
}
```

### 10.3 AMC Scoring System

```
Score = (6 × Correct) + (1.5 × Blank) + (0 × Wrong)
Max Score = 150 points (all 25 correct)
```

**Penalty for guessing:** Wrong = 0, Blank = 1.5
**Strategy implication:** Skip if < 50% confident

**MathAthlone Adaptation:**
```typescript
interface CTAScoringConfig {
  correct_points: number;      // 6
  blank_points: number;        // 1.5 (only for Target rounds)
  wrong_points: number;        // 0
  time_bonus_multiplier: number;
  accuracy_bonus_threshold: number; // 90%
}
```

---

## Part 11: Advanced Rating Systems

### 11.1 Glicko Rating System

Glicko improves on ELO by tracking **rating uncertainty**:

```
Player State = (Rating, RD)
- Rating: Skill estimate (like ELO)
- RD: Rating Deviation (uncertainty)
```

**Key Properties:**
- New players: RD = 350 (high uncertainty)
- Active players: RD decreases (more games = more confidence)
- Inactive players: RD increases over time (skill may have changed)

**RD Over Time (no games):**
```
RD_new = min(sqrt(RD_old² + c² × t), 350)

Where:
- c = uncertainty growth constant (~15 per rating period)
- t = time periods since last game
```

**Rating Update:**
```
r' = r + (q / (1/RD² + 1/d²)) × Σ[g(RD_j) × (S_j - E_j)]

Where:
- q = ln(10) / 400 ≈ 0.0057565
- g(RD) = 1 / sqrt(1 + 3q²RD²/π²)
- d² = 1 / (q² × Σ[g(RD_j)² × E_j × (1-E_j)])
```

### 11.2 Glicko-2 Additions

Glicko-2 adds **volatility (σ)** — how much rating fluctuates:

```
Player State = (Rating, RD, Volatility)
- σ: Expected rating variability
- High σ = inconsistent performer
- Low σ = stable performer
```

**MathAthlone Implementation:**
```typescript
interface AthleteRating {
  rating: number;           // Current rating (default: 1500)
  rating_deviation: number; // Uncertainty (default: 350)
  volatility: number;       // Performance consistency (default: 0.06)
  last_competition: Date;
}

function updateRatingDeviation(rd: number, daysSinceLastGame: number): number {
  const c = 15; // uncertainty growth per day
  const maxRD = 350;
  return Math.min(Math.sqrt(rd * rd + c * c * daysSinceLastGame), maxRD);
}
```

### 11.3 Anti-Gaming & Inflation Prevention

**Problem Patterns:**
| Issue | Cause | Solution |
|-------|-------|----------|
| **Inflation** | New players enter with underrated scores, lose points to pool | Raise minimum rating floor |
| **Deflation** | New players enter overrated, take points from pool | Lower starting ratings |
| **Sandbagging** | Players intentionally lose to get easier matchups | Activity requirements, suspicious pattern detection |
| **Rating farming** | Playing only weak opponents | Require minimum opponent strength |
| **Boosting** | Colluding with friends to inflate rating | Analyze win patterns against specific opponents |

**MathAthlone Safeguards:**
```typescript
const RATING_CONFIG = {
  floor: 800,              // Minimum rating
  ceiling: 3000,           // Maximum rating
  starting: 1200,          // New player starting rating
  k_factor_new: 40,        // Higher K for first 30 games
  k_factor_established: 24, // Standard K
  k_factor_elite: 16,      // Lower K for top players
  decay_per_month: 0,      // No decay (controversial)
  min_games_for_ranking: 5, // Must play 5 games to appear on leaderboard
  max_rating_diff: 400,    // Cap expected score calculation
};

// Detect suspicious patterns
function detectAnomalies(athlete: Athlete): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  
  // Win rate against specific opponent too high
  if (getWinRateAgainst(athlete, opponent) > 0.95 && games > 10) {
    flags.push('POSSIBLE_BOOSTING');
  }
  
  // Sudden rating drop followed by easy wins
  if (ratingDropped(athlete, 200) && nextGamesWinRate > 0.9) {
    flags.push('POSSIBLE_SANDBAGGING');
  }
  
  // Only plays during specific hours (shared account?)
  if (playTimeVariance(athlete) < threshold) {
    flags.push('SUSPICIOUS_PLAY_PATTERN');
  }
  
  return flags;
}
```

---

## Part 12: Real-Time Leaderboard Architecture

### 12.1 Why Redis Sorted Sets

| Operation | PostgreSQL | Redis ZSET |
|-----------|------------|------------|
| Add/Update Score | O(log N) | O(log N) |
| Get Top 10 | O(N log N) | O(log N + K) |
| Get Player Rank | O(N) | O(log N) |
| Range Query | O(N log N) | O(log N + K) |

**Redis Commands for Leaderboards:**
```redis
ZADD leaderboard 95000 "athlete:alice"     # Add/update score
ZINCRBY leaderboard 500 "athlete:alice"    # Increment score
ZREVRANK leaderboard "athlete:alice"       # Get rank (0-indexed, desc)
ZREVRANGE leaderboard 0 9 WITHSCORES       # Top 10
ZRANGEBYSCORE leaderboard 90000 100000     # Score range
ZCOUNT leaderboard 90000 100000            # Count in range
ZSCORE leaderboard "athlete:alice"         # Get score
```

### 12.2 Multi-Field Sorting (Compound Scores)

For tiebreakers (score → accuracy → time), encode into single score:

```typescript
function encodeCompoundScore(
  primaryScore: number,    // 0-999999
  accuracy: number,        // 0-100 (percentage)
  timeMs: number           // 0-999999 (lower is better)
): number {
  // Primary: 6 digits, Accuracy: 3 digits, Time: 6 digits (inverted)
  // Score format: PPPPPP_AAA_TTTTTT (15 digit precision)
  const invertedTime = 999999 - Math.min(timeMs, 999999);
  return (
    primaryScore * 1_000_000_000 +
    Math.floor(accuracy * 10) * 1_000_000 +
    invertedTime
  );
}

// Example:
// Score: 850, Accuracy: 95.5%, Time: 45000ms
// Encoded: 850_955_954999 = 850955954999
```

### 12.3 Supabase + Redis Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Realtime subscription to standings_updates channel │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS                           │
│  ┌──────────────────┐  ┌───────────────────────────────┐    │
│  │ submit_score()   │  │ get_leaderboard()             │    │
│  │ 1. Validate      │  │ 1. Check Redis cache          │    │
│  │ 2. Write to PG   │  │ 2. If miss, query PG          │    │
│  │ 3. Update Redis  │  │ 3. Cache in Redis             │    │
│  │ 4. Broadcast     │  │ 4. Return results             │    │
│  └──────────────────┘  └───────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌───────────────────┐    ┌───────────────────────────────────┐
│     REDIS         │    │           SUPABASE (PostgreSQL)    │
│  ┌─────────────┐  │    │  ┌─────────────────────────────┐   │
│  │ ZSET:       │  │    │  │ league_standings (source    │   │
│  │ leaderboard │◄─┼────┼──│ of truth)                   │   │
│  │ :league_123 │  │    │  │                             │   │
│  └─────────────┘  │    │  │ heat_participations         │   │
│  ┌─────────────┐  │    │  │                             │   │
│  │ HASH:       │  │    │  │ championship_points         │   │
│  │ athlete:*   │  │    │  └─────────────────────────────┘   │
│  │ (metadata)  │  │    │                                    │
│  └─────────────┘  │    │  Triggers → Realtime broadcasts   │
└───────────────────┘    └───────────────────────────────────┘
```

### 12.4 Supabase-Only Approach (No Redis)

For MVP without Redis complexity:

```sql
-- Materialized view for fast leaderboard queries
CREATE MATERIALIZED VIEW league_leaderboard AS
SELECT 
  ls.athlete_id,
  u.full_name,
  u.avatar_url,
  ls.rank,
  ls.points,
  ls.wins,
  ls.losses,
  ls.avg_cta,
  ls.current_elo
FROM league_standings ls
JOIN users u ON ls.athlete_id = u.id
ORDER BY ls.rank;

-- Create index for fast lookups
CREATE INDEX idx_leaderboard_rank ON league_leaderboard(rank);

-- Refresh on score submission (trigger)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY league_leaderboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_standings_change
AFTER INSERT OR UPDATE ON league_standings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard();
```

---

## Part 13: Edge Cases & Gotchas

### 13.1 Tournament Edge Cases

| Scenario | Solution |
|----------|----------|
| **Odd number of participants** | Award bye to top seed, they advance with 0.5 win credit |
| **Player no-show** | Opponent wins by forfeit, no-show gets loss but no tiebreaker penalty |
| **Tie in Swiss final round** | Apply full tiebreaker chain, then head-to-head if played |
| **Double elimination bracket reset** | If loser bracket winner wins final, play one more game |
| **Player withdrawal mid-tournament** | All future games are forfeits; past results stand |
| **Technical failure during Heat** | Administrator decision: restart, time extension, or reschedule |

### 13.2 Rating Edge Cases

| Scenario | Solution |
|----------|----------|
| **New player beats top player** | High K-factor (40) + large rating diff = big gain, capped at 400 diff |
| **Player inactive 6+ months** | RD increases to near-maximum, next games have high uncertainty |
| **Provisional rating (< 5 games)** | Don't show on public leaderboard, use higher K-factor |
| **Rating floor violation** | Can't drop below floor (800), but still record losses |
| **Cross-division competition** | Use separate ratings per division, or apply division multiplier |

### 13.3 Leaderboard Edge Cases

| Scenario | Solution |
|----------|----------|
| **Exact tie on all tiebreakers** | Share rank (both are "3rd"), next player is "5th" not "4th" |
| **Score update during page load** | Use optimistic UI + reconcile with server state |
| **Player changes division mid-season** | Keep old division stats frozen, start fresh in new division |
| **Retroactive score correction** | Recompute all affected standings, notify impacted players |

---

## Part 14: Implementation Checklist

### Phase 1: Core Foundation (Week 1)
- [ ] `leagues` table with format configuration
- [ ] `league_standings` with tiebreaker fields
- [ ] Basic ELO calculation function
- [ ] Standings recalculation trigger
- [ ] Simple rank query endpoint

### Phase 2: Swiss System (Week 2)
- [ ] Swiss pairing algorithm
- [ ] Round generation
- [ ] Buchholz calculation
- [ ] Sonneborn-Berger calculation
- [ ] Head-to-head tracking

### Phase 3: Elimination Brackets (Week 3)
- [ ] Single elimination generator
- [ ] Double elimination generator
- [ ] Bye handling
- [ ] Bracket progression logic
- [ ] Bracket state machine

### Phase 4: Advancement Engine (Week 4)
- [ ] Championship points system
- [ ] Qualification rules engine
- [ ] Play-in bracket generation
- [ ] Season/split management
- [ ] Automatic advancement notifications

### Phase 5: Real-Time UI (Week 5)
- [ ] Live standings component
- [ ] Interactive bracket visualization
- [ ] Real-time score updates
- [ ] Rank change animations
- [ ] Mobile-responsive leaderboard

### Phase 6: Glicko Upgrade (Week 6)
- [ ] Rating deviation tracking
- [ ] Volatility parameter
- [ ] Uncertainty-aware matchmaking
- [ ] Rating confidence display

---

## Appendix C: References

1. FIDE Handbook - Tiebreak Regulations (2024)
2. Swiss-system tournament - Wikipedia
3. Elo rating system - Wikipedia
4. Glicko rating system - Dr. Mark E. Glickman (glicko.net)
5. Challonge Tournament Formats
6. FACEIT Swiss System Documentation
7. League of Legends Esports - Competitive Operations
8. UEFA Champions League Format 2024-25
9. Score7 Bracket Generator Documentation
10. MAA American Mathematics Competitions
11. MATHCOUNTS Competition Structure
12. Redis Sorted Sets Documentation
13. AWS ElastiCache Leaderboard Guide
14. System Design: Leaderboard Architecture (systemdesign.one)

## Appendix D: Key Formulas Quick Reference

```
ELO Expected Score:
E = 1 / (1 + 10^((R_opponent - R_player) / 400))

ELO Update:
R_new = R_old + K × (S - E)

Glicko RD Update (inactive):
RD_new = min(sqrt(RD² + c² × t), 350)

Swiss Rounds Needed:
rounds = ceil(log₂(participants))

Single Elim Matches:
matches = participants - 1

Double Elim Matches:
matches = 2 × participants - 2  (or -1 with bracket reset)

Round Robin Matches:
matches = participants × (participants - 1) / 2

Buchholz Score:
buchholz = Σ(opponent_scores)

Sonneborn-Berger:
SB = Σ(beaten_opponent_scores) + 0.5 × Σ(drawn_opponent_scores)

Compound Score Encoding:
encoded = primary × 10^9 + secondary × 10^6 + tertiary
```
