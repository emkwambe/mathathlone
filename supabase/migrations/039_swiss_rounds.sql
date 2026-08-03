-- =============================================================================
-- Migration 039 — Swiss System Round Tracking
-- =============================================================================
-- Adds dedicated tables for Swiss round management:
--   swiss_rounds   — one row per round in a Swiss bracket
--   swiss_pairings — one row per pairing within a round (replaces JSONB blob)
--
-- Also adds a `swiss_round_id` FK on bracket_matches so each Swiss match
-- can be linked back to its round for status tracking.
-- =============================================================================

-- ────────────────────────────────────────────────────────────
-- 1. SWISS ROUNDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swiss_rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id      UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  league_id       UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  round_number    INTEGER NOT NULL CHECK (round_number >= 1),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'completed')),
  total_pairings  INTEGER NOT NULL DEFAULT 0,
  completed_pairs INTEGER NOT NULL DEFAULT 0,
  bye_athlete_id  UUID REFERENCES users(id),          -- NULL if no bye this round
  generated_at    TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (bracket_id, round_number)
);

-- ────────────────────────────────────────────────────────────
-- 2. SWISS PAIRINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swiss_pairings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiss_round_id  UUID NOT NULL REFERENCES swiss_rounds(id) ON DELETE CASCADE,
  bracket_id      UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  league_id       UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  round_number    INTEGER NOT NULL,
  board_number    INTEGER NOT NULL,                    -- 1-indexed pairing order
  player1_id      UUID NOT NULL REFERENCES users(id),
  player2_id      UUID REFERENCES users(id),           -- NULL = BYE
  heat_id         UUID REFERENCES heats(id),           -- set when heat is created
  winner_id       UUID REFERENCES users(id),           -- set when result recorded
  player1_cta     DECIMAL(8,2),
  player2_cta     DECIMAL(8,2),
  is_bye          BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'completed', 'bye')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE (swiss_round_id, board_number)
);

-- ────────────────────────────────────────────────────────────
-- 3. LINK bracket_matches → swiss_round
-- ────────────────────────────────────────────────────────────
ALTER TABLE bracket_matches
  ADD COLUMN IF NOT EXISTS swiss_round_id UUID REFERENCES swiss_rounds(id);

ALTER TABLE bracket_matches
  ADD COLUMN IF NOT EXISTS swiss_pairing_id UUID REFERENCES swiss_pairings(id);

-- ────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_swiss_rounds_bracket
  ON swiss_rounds (bracket_id, round_number);

CREATE INDEX IF NOT EXISTS idx_swiss_rounds_league
  ON swiss_rounds (league_id);

CREATE INDEX IF NOT EXISTS idx_swiss_pairings_round
  ON swiss_pairings (swiss_round_id, board_number);

CREATE INDEX IF NOT EXISTS idx_swiss_pairings_player1
  ON swiss_pairings (player1_id);

CREATE INDEX IF NOT EXISTS idx_swiss_pairings_player2
  ON swiss_pairings (player2_id);

-- ────────────────────────────────────────────────────────────
-- 5. RLS POLICIES
-- ────────────────────────────────────────────────────────────
ALTER TABLE swiss_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE swiss_pairings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read swiss rounds and pairings
CREATE POLICY "swiss_rounds_read" ON swiss_rounds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "swiss_pairings_read" ON swiss_pairings
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (done via API routes with service client)
CREATE POLICY "swiss_rounds_service_write" ON swiss_rounds
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "swiss_pairings_service_write" ON swiss_pairings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 6. FUNCTION: auto-update swiss_round completion counter
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_swiss_round_progress()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_round_id UUID;
  v_completed INTEGER;
  v_total INTEGER;
BEGIN
  v_round_id := NEW.swiss_round_id;
  IF v_round_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_completed
  FROM swiss_pairings
  WHERE swiss_round_id = v_round_id
    AND status IN ('completed', 'bye');

  SELECT total_pairings INTO v_total
  FROM swiss_rounds WHERE id = v_round_id;

  UPDATE swiss_rounds
  SET
    completed_pairs = v_completed,
    status = CASE
      WHEN v_completed >= v_total THEN 'completed'
      ELSE 'active'
    END,
    completed_at = CASE
      WHEN v_completed >= v_total THEN now()
      ELSE NULL
    END
  WHERE id = v_round_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_swiss_pairing_progress
  AFTER UPDATE OF status ON swiss_pairings
  FOR EACH ROW
  EXECUTE FUNCTION update_swiss_round_progress();
