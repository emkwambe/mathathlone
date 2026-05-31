-- ============================================================
-- MathAthlone League Engine — Advanced Tournament System
-- Migration: 006_league_engine.sql (CORRECTED)
-- Depends on: 002_league_system.sql, 003_integrity_system.sql
-- © Mpingo Systems LLC
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE tournament_format AS ENUM (
    'swiss', 'round_robin', 'single_elim', 'double_elim', 'pool_knockout'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bracket_side AS ENUM ('winners', 'losers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bracket_status AS ENUM (
    'pending', 'scheduled', 'live', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE qualification_method AS ENUM (
    'auto', 'points', 'playin', 'invitation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE split_status AS ENUM (
    'upcoming', 'active', 'playoffs', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE heat_format AS ENUM (
    'sprint', 'target', 'team', 'countdown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. SPLITS (seasons already exists)
-- ────────────────────────────────────────────────────────────

-- Add is_active to seasons if missing
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS splits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  split_number  INTEGER NOT NULL CHECK (split_number BETWEEN 1 AND 4),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        split_status DEFAULT 'upcoming',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(season_id, split_number),
  CONSTRAINT splits_date_order CHECK (end_date > start_date)
);

-- ────────────────────────────────────────────────────────────
-- 3. ATHLETE RATINGS (Glicko-2 ready)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athlete_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  division_id       UUID REFERENCES divisions(id),

  -- Core Glicko-2 triple
  rating            DECIMAL(7,2) DEFAULT 1200.00,
  rating_deviation  DECIMAL(6,2) DEFAULT 350.00,
  volatility        DECIMAL(8,6) DEFAULT 0.060000,

  -- Tracking
  games_played      INTEGER DEFAULT 0,
  peak_rating       DECIMAL(7,2) DEFAULT 1200.00,
  floor_rating      DECIMAL(7,2) DEFAULT 800.00,
  is_provisional    BOOLEAN DEFAULT true,
  last_competition  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE(athlete_id, division_id),
  CONSTRAINT rating_floor CHECK (rating >= 800),
  CONSTRAINT rating_ceiling CHECK (rating <= 3000),
  CONSTRAINT rd_bounds CHECK (rating_deviation BETWEEN 30 AND 350)
);

-- ────────────────────────────────────────────────────────────
-- 4. RATING HISTORY
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rating_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  heat_id         UUID REFERENCES heats(id),
  league_id       UUID,

  rating_before   DECIMAL(7,2) NOT NULL,
  rating_after    DECIMAL(7,2) NOT NULL,
  rd_before       DECIMAL(6,2) NOT NULL,
  rd_after        DECIMAL(6,2) NOT NULL,
  k_factor_used   DECIMAL(5,2),
  expected_score  DECIMAL(5,4),
  actual_score    DECIMAL(5,4),

  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. BRACKETS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brackets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id           UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  split_id            UUID REFERENCES splits(id),
  name                TEXT NOT NULL,
  format              tournament_format NOT NULL,

  participant_count   INTEGER NOT NULL CHECK (participant_count >= 2),
  rounds_count        INTEGER NOT NULL CHECK (rounds_count >= 1),

  current_round       INTEGER DEFAULT 0,
  status              bracket_status DEFAULT 'pending',

  swiss_pairings      JSONB DEFAULT '[]'::jsonb,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. BRACKET MATCHES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bracket_matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id          UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,

  round               INTEGER NOT NULL,
  position            INTEGER NOT NULL,
  side                bracket_side,

  participant1_id     UUID REFERENCES users(id),
  participant2_id     UUID REFERENCES users(id),
  participant1_seed   INTEGER,
  participant2_seed   INTEGER,

  winner_id           UUID REFERENCES users(id),
  loser_id            UUID REFERENCES users(id),
  heat_id             UUID REFERENCES heats(id),

  p1_cta_score        DECIMAL(10,2),
  p2_cta_score        DECIMAL(10,2),

  is_bye              BOOLEAN DEFAULT false,
  is_grand_final      BOOLEAN DEFAULT false,
  is_bracket_reset    BOOLEAN DEFAULT false,

  winner_advances_to  UUID REFERENCES bracket_matches(id),
  loser_drops_to      UUID REFERENCES bracket_matches(id),
  winner_slot         SMALLINT,

  status              bracket_status DEFAULT 'pending',
  scheduled_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  UNIQUE(bracket_id, round, position, side)
);

-- ────────────────────────────────────────────────────────────
-- 7. LEAGUE STANDINGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS league_standings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id         UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  athlete_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  rank              INTEGER NOT NULL DEFAULT 0,

  wins              INTEGER DEFAULT 0,
  losses            INTEGER DEFAULT 0,
  draws             INTEGER DEFAULT 0,
  points            INTEGER DEFAULT 0,

  heats_played      INTEGER DEFAULT 0,
  total_cta         DECIMAL(12,2) DEFAULT 0,
  avg_cta           DECIMAL(8,2) DEFAULT 0,
  best_cta          DECIMAL(8,2) DEFAULT 0,

  buchholz          DECIMAL(10,2) DEFAULT 0,
  buchholz_cut1     DECIMAL(10,2) DEFAULT 0,
  sonneborn_berger  DECIMAL(10,2) DEFAULT 0,
  first_places      INTEGER DEFAULT 0,
  avg_accuracy      DECIMAL(5,2) DEFAULT 0,
  avg_speed_ms      INTEGER DEFAULT 0,

  current_elo       DECIMAL(7,2) DEFAULT 1200,
  elo_change        DECIMAL(6,2) DEFAULT 0,

  last_updated      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, athlete_id)
);

-- ────────────────────────────────────────────────────────────
-- 8. HEAD-TO-HEAD RECORDS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS head_to_head (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id         UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  athlete1_id       UUID NOT NULL REFERENCES users(id),
  athlete2_id       UUID NOT NULL REFERENCES users(id),

  athlete1_wins     INTEGER DEFAULT 0,
  athlete2_wins     INTEGER DEFAULT 0,
  draws             INTEGER DEFAULT 0,

  athlete1_cta_total  DECIMAL(12,2) DEFAULT 0,
  athlete2_cta_total  DECIMAL(12,2) DEFAULT 0,

  last_updated      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, athlete1_id, athlete2_id),
  CONSTRAINT h2h_no_self CHECK (athlete1_id <> athlete2_id),
  CONSTRAINT h2h_canonical_order CHECK (athlete1_id < athlete2_id)
);

-- ────────────────────────────────────────────────────────────
-- 9. CHAMPIONSHIP POINTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS championship_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  split_id        UUID NOT NULL REFERENCES splits(id),
  league_id       UUID NOT NULL REFERENCES leagues(id),

  placement       INTEGER NOT NULL,
  points_earned   INTEGER NOT NULL CHECK (points_earned >= 0),

  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(athlete_id, split_id, league_id)
);

-- ────────────────────────────────────────────────────────────
-- 10. SEASON STANDINGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS season_standings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id                 UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  athlete_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  division_id               UUID REFERENCES divisions(id),

  total_championship_points INTEGER DEFAULT 0,
  splits_participated       INTEGER DEFAULT 0,
  best_placement            INTEGER,

  qualified_for             TEXT,
  qualification_method      qualification_method,

  last_updated              TIMESTAMPTZ DEFAULT now(),

  UNIQUE(season_id, athlete_id, division_id)
);

-- ────────────────────────────────────────────────────────────
-- 11. QUALIFICATION RULES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qualification_rules (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id                   UUID NOT NULL REFERENCES seasons(id),
  from_level                  TEXT NOT NULL,
  to_level                    TEXT NOT NULL,

  auto_qualify_top_n          INTEGER DEFAULT 3,
  points_qualify_top_n        INTEGER DEFAULT 8,
  playin_range_start          INTEGER DEFAULT 9,
  playin_range_end            INTEGER DEFAULT 16,
  playin_spots                INTEGER DEFAULT 4,

  min_heats_required          INTEGER DEFAULT 5,
  min_integrity_score         DECIMAL(5,2) DEFAULT 80.00,
  requires_verification_heat  BOOLEAN DEFAULT false,
  requires_teacher_attestation BOOLEAN DEFAULT true,

  created_at                  TIMESTAMPTZ DEFAULT now(),

  UNIQUE(season_id, from_level, to_level)
);

-- ────────────────────────────────────────────────────────────
-- 12. ANOMALY FLAGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rating_anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id      UUID NOT NULL REFERENCES users(id),
  flag_type       TEXT NOT NULL,
  severity        TEXT DEFAULT 'warning',
  evidence        JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved        BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 13. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_standings_league_rank
  ON league_standings(league_id, rank);
CREATE INDEX IF NOT EXISTS idx_standings_athlete
  ON league_standings(athlete_id);
CREATE INDEX IF NOT EXISTS idx_standings_points_desc
  ON league_standings(league_id, points DESC, buchholz_cut1 DESC);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_bracket_round
  ON bracket_matches(bracket_id, round, position);
CREATE INDEX IF NOT EXISTS idx_bracket_matches_live
  ON bracket_matches(status) WHERE status IN ('pending', 'live', 'scheduled');
CREATE INDEX IF NOT EXISTS idx_bracket_matches_winner
  ON bracket_matches(winner_id) WHERE winner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_champ_points_season_desc
  ON championship_points(season_id, points_earned DESC);
CREATE INDEX IF NOT EXISTS idx_champ_points_athlete
  ON championship_points(athlete_id);

CREATE INDEX IF NOT EXISTS idx_ratings_athlete_div
  ON athlete_ratings(athlete_id, division_id);
CREATE INDEX IF NOT EXISTS idx_ratings_leaderboard
  ON athlete_ratings(division_id, rating DESC) WHERE NOT is_provisional;

CREATE INDEX IF NOT EXISTS idx_h2h_lookup
  ON head_to_head(league_id, athlete1_id, athlete2_id);

CREATE INDEX IF NOT EXISTS idx_rating_history_athlete
  ON rating_history(athlete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomalies_unresolved
  ON rating_anomalies(athlete_id) WHERE NOT resolved;

-- ────────────────────────────────────────────────────────────
-- 14. MATERIALIZED VIEW — Global Leaderboard
--     Uses display_name (not full_name), no division_id on users
-- ────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS global_leaderboard AS
SELECT
  u.id                                         AS athlete_id,
  u.display_name,
  u.avatar_url,
  u.grade_level,
  ar.rating                                    AS current_rating,
  ar.rating_deviation,
  ar.games_played                              AS total_games,
  ar.peak_rating,
  ar.is_provisional,
  ar.division_id,
  d.name                                       AS division_name,
  s.name                                       AS school_name,
  s.state                                      AS school_state,
  COALESCE(ss.total_championship_points, 0)    AS season_points,
  ss.best_placement                            AS season_best
FROM users u
  JOIN athlete_ratings ar ON u.id = ar.athlete_id
  LEFT JOIN divisions d   ON ar.division_id = d.id
  LEFT JOIN schools s     ON u.school_id = s.id
  LEFT JOIN season_standings ss
    ON u.id = ss.athlete_id
    AND ss.season_id = (SELECT id FROM seasons WHERE is_active = true LIMIT 1)
WHERE u.role = 'athlete'
  AND ar.games_played >= 5
ORDER BY ar.rating DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_athlete
  ON global_leaderboard(athlete_id);

-- ────────────────────────────────────────────────────────────
-- 15. TRIGGER FUNCTIONS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers if they don't exist (avoid duplicates)
DO $$ BEGIN
  CREATE TRIGGER trg_splits_updated
    BEFORE UPDATE ON splits
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_brackets_updated
    BEFORE UPDATE ON brackets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_ratings_updated
    BEFORE UPDATE ON athlete_ratings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Mark provisional → established after 5 games
CREATE OR REPLACE FUNCTION check_provisional_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.games_played >= 5 AND NEW.is_provisional = true THEN
    NEW.is_provisional = false;
  END IF;
  IF NEW.rating > NEW.peak_rating THEN
    NEW.peak_rating = NEW.rating;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_rating_provisional
    BEFORE UPDATE ON athlete_ratings
    FOR EACH ROW EXECUTE FUNCTION check_provisional_status();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-advance bracket match
CREATE OR REPLACE FUNCTION bracket_match_advance()
RETURNS TRIGGER AS $$
DECLARE
  next_match_id UUID;
  slot SMALLINT;
BEGIN
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL
     AND NEW.winner_advances_to IS NOT NULL THEN

    next_match_id := NEW.winner_advances_to;
    slot := COALESCE(NEW.winner_slot, 1);

    IF slot = 1 THEN
      UPDATE bracket_matches
        SET participant1_id   = NEW.winner_id,
            participant1_seed = CASE WHEN NEW.winner_id = NEW.participant1_id
                                     THEN NEW.participant1_seed
                                     ELSE NEW.participant2_seed END
        WHERE id = next_match_id;
    ELSE
      UPDATE bracket_matches
        SET participant2_id   = NEW.winner_id,
            participant2_seed = CASE WHEN NEW.winner_id = NEW.participant1_id
                                     THEN NEW.participant1_seed
                                     ELSE NEW.participant2_seed END
        WHERE id = next_match_id;
    END IF;

    IF NEW.loser_drops_to IS NOT NULL AND NEW.loser_id IS NOT NULL THEN
      UPDATE bracket_matches
        SET participant1_id = NEW.loser_id
        WHERE id = NEW.loser_drops_to
          AND participant1_id IS NULL;

      IF NOT FOUND THEN
        UPDATE bracket_matches
          SET participant2_id = NEW.loser_id
          WHERE id = NEW.loser_drops_to
            AND participant2_id IS NULL;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_bracket_advance
    AFTER UPDATE ON bracket_matches
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
    EXECUTE FUNCTION bracket_match_advance();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-process byes
CREATE OR REPLACE FUNCTION process_bracket_byes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_bye = true AND NEW.status = 'pending' THEN
    IF NEW.participant1_id IS NOT NULL AND NEW.participant2_id IS NULL THEN
      NEW.winner_id   := NEW.participant1_id;
      NEW.status      := 'completed';
      NEW.completed_at := now();
    ELSIF NEW.participant2_id IS NOT NULL AND NEW.participant1_id IS NULL THEN
      NEW.winner_id   := NEW.participant2_id;
      NEW.status      := 'completed';
      NEW.completed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_process_byes
    BEFORE INSERT OR UPDATE ON bracket_matches
    FOR EACH ROW EXECUTE FUNCTION process_bracket_byes();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────────────────
-- 16. CHAMPIONSHIP POINTS AGGREGATION
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_season_totals(p_season_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO season_standings (season_id, athlete_id, division_id,
    total_championship_points, splits_participated, best_placement)
  SELECT
    p_season_id,
    cp.athlete_id,
    ar.division_id,
    SUM(cp.points_earned),
    COUNT(DISTINCT cp.split_id),
    MIN(cp.placement)
  FROM championship_points cp
    LEFT JOIN athlete_ratings ar ON cp.athlete_id = ar.athlete_id
  WHERE cp.season_id = p_season_id
  GROUP BY cp.athlete_id, ar.division_id
  ON CONFLICT (season_id, athlete_id, division_id)
  DO UPDATE SET
    total_championship_points = EXCLUDED.total_championship_points,
    splits_participated       = EXCLUDED.splits_participated,
    best_placement            = EXCLUDED.best_placement,
    last_updated              = now();
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 17. RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE splits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_ratings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head        ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_standings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_anomalies    ENABLE ROW LEVEL SECURITY;

-- Public read for all competition data
DROP POLICY IF EXISTS "Anyone can view splits" ON splits;
CREATE POLICY "Anyone can view splits"
  ON splits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view ratings" ON athlete_ratings;
CREATE POLICY "Anyone can view ratings"
  ON athlete_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view brackets" ON brackets;
CREATE POLICY "Anyone can view brackets"
  ON brackets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view bracket matches" ON bracket_matches;
CREATE POLICY "Anyone can view bracket matches"
  ON bracket_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view standings" ON league_standings;
CREATE POLICY "Anyone can view standings"
  ON league_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view h2h" ON head_to_head;
CREATE POLICY "Anyone can view h2h"
  ON head_to_head FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view championship points" ON championship_points;
CREATE POLICY "Anyone can view championship points"
  ON championship_points FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view season standings" ON season_standings;
CREATE POLICY "Anyone can view season standings"
  ON season_standings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view qualification rules" ON qualification_rules;
CREATE POLICY "Anyone can view qualification rules"
  ON qualification_rules FOR SELECT USING (true);

-- Own rating history only
DROP POLICY IF EXISTS "Athletes view own rating history" ON rating_history;
CREATE POLICY "Athletes view own rating history"
  ON rating_history FOR SELECT
  USING (athlete_id = auth.uid());

-- Own anomalies only
DROP POLICY IF EXISTS "Athletes view own anomalies" ON rating_anomalies;
CREATE POLICY "Athletes view own anomalies"
  ON rating_anomalies FOR SELECT
  USING (athlete_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 18. REFRESH LEADERBOARD
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_global_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY global_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
