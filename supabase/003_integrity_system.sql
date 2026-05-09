-- =============================================================================
-- MathAthlone Integrity Tier System
-- =============================================================================
-- Escalating security based on competition level
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: INTEGRITY LEVELS ENUM & CONFIG
-- -----------------------------------------------------------------------------

-- Integrity level type
DO $$ BEGIN
    CREATE TYPE integrity_level AS ENUM (
        'practice',      -- Classroom practice - light logging only
        'school',        -- School league - Focus Mode enabled
        'district',      -- District competition - verification required
        'regional',      -- Regional qualifier - attestation required
        'state',         -- State championship - lockdown mode
        'national'       -- National finals - full proctoring
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Integrity configuration table
CREATE TABLE IF NOT EXISTS integrity_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level integrity_level NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Feature flags
    focus_mode_enabled BOOLEAN DEFAULT false,
    fullscreen_required BOOLEAN DEFAULT false,
    copy_paste_blocked BOOLEAN DEFAULT false,
    lockdown_browser_required BOOLEAN DEFAULT false,
    synchronized_start BOOLEAN DEFAULT false,
    teacher_attestation_required BOOLEAN DEFAULT false,
    identity_verification_required BOOLEAN DEFAULT false,
    session_recording_enabled BOOLEAN DEFAULT false,
    anomaly_detection_enabled BOOLEAN DEFAULT false,
    in_person_verification_heat BOOLEAN DEFAULT false,
    
    -- Violation thresholds
    warning_threshold INTEGER DEFAULT 1,        -- Violations before warning
    penalty_threshold INTEGER DEFAULT 2,        -- Violations before penalty
    flag_threshold INTEGER DEFAULT 3,           -- Violations before auto-flag
    disqualify_threshold INTEGER DEFAULT 5,     -- Violations before DQ
    
    -- Penalty settings
    time_penalty_seconds INTEGER DEFAULT 5,     -- Seconds added per violation
    point_penalty_percent INTEGER DEFAULT 0,    -- Percent deducted per violation
    
    -- Review requirements
    results_require_approval BOOLEAN DEFAULT false,
    advancement_requires_review BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed integrity configs
INSERT INTO integrity_configs (
    level, display_name, description,
    focus_mode_enabled, fullscreen_required, copy_paste_blocked,
    lockdown_browser_required, synchronized_start, teacher_attestation_required,
    identity_verification_required, session_recording_enabled, anomaly_detection_enabled,
    in_person_verification_heat, warning_threshold, penalty_threshold, flag_threshold,
    disqualify_threshold, time_penalty_seconds, results_require_approval, advancement_requires_review
) VALUES
-- Practice: Trust-based learning
('practice', 'Practice', 'Classroom practice with light logging',
 false, false, false, false, false, false, false, false, false, false,
 999, 999, 999, 999, 0, false, false),

-- School: Trust + verify
('school', 'School League', 'Internal school competition with Focus Mode',
 true, false, false, false, false, false, false, false, false, false,
 2, 3, 4, 6, 5, false, false),

-- District: Verify + review
('district', 'District League', 'District competition requiring review',
 true, true, true, false, true, false, false, false, true, false,
 1, 2, 3, 5, 10, true, true),

-- Regional: Attest + supervise
('regional', 'Regional Qualifier', 'Regional competition with teacher attestation',
 true, true, true, false, true, true, false, false, true, true,
 1, 2, 2, 4, 15, true, true),

-- State: Lockdown mode
('state', 'State Championship', 'State competition with lockdown browser',
 true, true, true, true, true, true, true, false, true, true,
 1, 1, 2, 3, 20, true, true),

-- National: Full proctoring
('national', 'National Finals', 'National competition with full proctoring',
 true, true, true, true, true, true, true, true, true, true,
 1, 1, 1, 2, 0, true, true)

ON CONFLICT (level) DO UPDATE SET
    focus_mode_enabled = EXCLUDED.focus_mode_enabled,
    fullscreen_required = EXCLUDED.fullscreen_required,
    copy_paste_blocked = EXCLUDED.copy_paste_blocked,
    lockdown_browser_required = EXCLUDED.lockdown_browser_required,
    synchronized_start = EXCLUDED.synchronized_start,
    teacher_attestation_required = EXCLUDED.teacher_attestation_required,
    identity_verification_required = EXCLUDED.identity_verification_required,
    session_recording_enabled = EXCLUDED.session_recording_enabled,
    anomaly_detection_enabled = EXCLUDED.anomaly_detection_enabled,
    in_person_verification_heat = EXCLUDED.in_person_verification_heat,
    updated_at = NOW();

-- -----------------------------------------------------------------------------
-- PART 2: FOCUS VIOLATIONS TRACKING
-- -----------------------------------------------------------------------------

-- Violation type enum
DO $$ BEGIN
    CREATE TYPE violation_type AS ENUM (
        'tab_switch',
        'window_blur', 
        'fullscreen_exit',
        'copy_attempt',
        'paste_attempt',
        'right_click',
        'dev_tools',
        'screenshot_attempt',
        'lockdown_exit'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Focus violations table
CREATE TABLE IF NOT EXISTS focus_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_participation_id UUID NOT NULL REFERENCES heat_participations(id) ON DELETE CASCADE,
    
    violation_type violation_type NOT NULL,
    question_number INTEGER,                    -- Which question they were on
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,                        -- How long they were away
    
    -- Context
    user_agent TEXT,
    screen_resolution TEXT,
    
    -- Response
    warning_shown BOOLEAN DEFAULT false,
    penalty_applied BOOLEAN DEFAULT false,
    penalty_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_violations_participation 
ON focus_violations(heat_participation_id);

CREATE INDEX IF NOT EXISTS idx_focus_violations_type 
ON focus_violations(violation_type);

-- -----------------------------------------------------------------------------
-- PART 3: ANOMALY DETECTION
-- -----------------------------------------------------------------------------

-- Anomaly type enum
DO $$ BEGIN
    CREATE TYPE anomaly_type AS ENUM (
        'speed_anomaly',           -- Answer too fast for difficulty
        'score_spike',             -- Sudden improvement between sessions
        'timing_pattern',          -- Suspicious timing patterns
        'answer_pattern',          -- Suspicious answer patterns
        'consistency_anomaly'      -- Score inconsistent with history
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Detected anomalies table
CREATE TABLE IF NOT EXISTS detected_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_participation_id UUID REFERENCES heat_participations(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES users(id) ON DELETE CASCADE,
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    
    anomaly_type anomaly_type NOT NULL,
    severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),  -- 1=low, 5=critical
    
    -- Details
    description TEXT NOT NULL,
    evidence JSONB,                             -- Supporting data
    question_number INTEGER,
    expected_value TEXT,                        -- What we expected
    actual_value TEXT,                          -- What we got
    
    -- Resolution
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'dismissed', 'confirmed', 'escalated')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_athlete ON detected_anomalies(athlete_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON detected_anomalies(status) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- PART 4: TEACHER ATTESTATION
-- -----------------------------------------------------------------------------

-- Attestation type enum
DO $$ BEGIN
    CREATE TYPE attestation_type AS ENUM (
        'supervision',             -- Teacher supervised the Heat
        'identity_verification',   -- Teacher verified student identity
        'advancement_approval',    -- Teacher approves advancement
        'results_certification'    -- Teacher certifies results are valid
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Teacher attestations table
CREATE TABLE IF NOT EXISTS teacher_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What they're attesting to
    attestation_type attestation_type NOT NULL,
    heat_id UUID REFERENCES heats(id) ON DELETE CASCADE,
    heat_participation_id UUID REFERENCES heat_participations(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Who is attesting
    teacher_id UUID NOT NULL REFERENCES users(id),
    teacher_name TEXT NOT NULL,
    teacher_email TEXT NOT NULL,
    school_id UUID REFERENCES schools(id),
    
    -- The attestation
    attestation_text TEXT NOT NULL,
    
    -- Digital signature
    signature_hash TEXT NOT NULL,               -- SHA-256 of attestation + timestamp + teacher_id
    ip_address TEXT,
    user_agent TEXT,
    
    -- Status
    is_valid BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attestations_teacher ON teacher_attestations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attestations_athlete ON teacher_attestations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attestations_heat ON teacher_attestations(heat_id);

-- -----------------------------------------------------------------------------
-- PART 5: QUALIFICATION GATE
-- -----------------------------------------------------------------------------

-- Advancement status enum
DO $$ BEGIN
    CREATE TYPE advancement_status AS ENUM (
        'pending_review',
        'under_review',
        'approved',
        'denied',
        'requires_verification_heat',
        'disqualified'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Qualification reviews table
CREATE TABLE IF NOT EXISTS qualification_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who is being reviewed
    athlete_id UUID NOT NULL REFERENCES users(id),
    athlete_name TEXT NOT NULL,
    school_id UUID REFERENCES schools(id),
    
    -- What they're advancing from/to
    from_level integrity_level NOT NULL,
    to_level integrity_level NOT NULL,
    league_id UUID REFERENCES leagues(id),
    season_id UUID REFERENCES seasons(id),
    
    -- Qualification stats
    qualifying_rank INTEGER NOT NULL,
    total_heats_completed INTEGER NOT NULL,
    average_cta_score DECIMAL(6,2),
    best_cta_score DECIMAL(6,2),
    total_violations INTEGER DEFAULT 0,
    
    -- Review checklist (JSONB for flexibility)
    review_checklist JSONB DEFAULT '{
        "competition_history_verified": false,
        "focus_mode_compliance": false,
        "anomaly_check_passed": false,
        "in_person_verification_completed": false,
        "academic_standing_verified": false
    }'::jsonb,
    
    -- Flags
    has_violations BOOLEAN DEFAULT false,
    has_anomalies BOOLEAN DEFAULT false,
    requires_additional_review BOOLEAN DEFAULT false,
    
    -- Decision
    status advancement_status DEFAULT 'pending_review',
    decision_by UUID REFERENCES users(id),
    decision_at TIMESTAMPTZ,
    decision_notes TEXT,
    
    -- Attestation link
    attestation_id UUID REFERENCES teacher_attestations(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qual_reviews_athlete ON qualification_reviews(athlete_id);
CREATE INDEX IF NOT EXISTS idx_qual_reviews_status ON qualification_reviews(status) WHERE status = 'pending_review';

-- -----------------------------------------------------------------------------
-- PART 6: UPDATE HEATS TABLE
-- -----------------------------------------------------------------------------

-- Add integrity level to heats
ALTER TABLE heats 
ADD COLUMN IF NOT EXISTS integrity_level integrity_level DEFAULT 'practice',
ADD COLUMN IF NOT EXISTS requires_attestation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS attestation_id UUID REFERENCES teacher_attestations(id),
ADD COLUMN IF NOT EXISTS synchronized_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lockdown_required BOOLEAN DEFAULT false;

-- Add integrity tracking to heat_participations
ALTER TABLE heat_participations
ADD COLUMN IF NOT EXISTS focus_violations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS focus_violation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_away_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS anomaly_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS integrity_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS lockdown_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_recording_url TEXT;

-- -----------------------------------------------------------------------------
-- PART 7: HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to get integrity config for a level
CREATE OR REPLACE FUNCTION get_integrity_config(p_level integrity_level)
RETURNS integrity_configs AS $$
    SELECT * FROM integrity_configs WHERE level = p_level;
$$ LANGUAGE SQL STABLE;

-- Function to check if participant should be flagged
CREATE OR REPLACE FUNCTION check_violation_threshold(
    p_participation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_config integrity_configs;
    v_violation_count INTEGER;
    v_heat_level integrity_level;
BEGIN
    -- Get heat's integrity level
    SELECT h.integrity_level INTO v_heat_level
    FROM heat_participations hp
    JOIN heats h ON hp.heat_id = h.id
    WHERE hp.id = p_participation_id;
    
    -- Get config for this level
    SELECT * INTO v_config FROM integrity_configs WHERE level = v_heat_level;
    
    -- Count violations
    SELECT COUNT(*) INTO v_violation_count
    FROM focus_violations
    WHERE heat_participation_id = p_participation_id;
    
    -- Check if exceeds flag threshold
    RETURN v_violation_count >= v_config.flag_threshold;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate integrity score
CREATE OR REPLACE FUNCTION calculate_integrity_score(
    p_participation_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 100;
    v_violations INTEGER;
    v_anomalies INTEGER;
    v_away_time INTEGER;
BEGIN
    -- Get violation count
    SELECT COALESCE(focus_violation_count, 0), COALESCE(total_away_time_ms, 0)
    INTO v_violations, v_away_time
    FROM heat_participations
    WHERE id = p_participation_id;
    
    -- Get anomaly count
    SELECT COUNT(*) INTO v_anomalies
    FROM detected_anomalies
    WHERE heat_participation_id = p_participation_id
    AND status != 'dismissed';
    
    -- Deduct points
    v_score := v_score - (v_violations * 10);           -- -10 per violation
    v_score := v_score - (v_anomalies * 15);            -- -15 per anomaly
    v_score := v_score - (v_away_time / 10000);         -- -1 per 10 sec away
    
    -- Floor at 0
    RETURN GREATEST(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-flag on threshold
CREATE OR REPLACE FUNCTION trigger_check_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF check_violation_threshold(NEW.heat_participation_id) THEN
        UPDATE heat_participations
        SET is_flagged = true,
            flag_reason = 'Exceeded violation threshold'
        WHERE id = NEW.heat_participation_id
        AND is_flagged = false;
    END IF;
    
    -- Update integrity score
    UPDATE heat_participations
    SET integrity_score = calculate_integrity_score(NEW.heat_participation_id),
        focus_violation_count = (
            SELECT COUNT(*) FROM focus_violations 
            WHERE heat_participation_id = NEW.heat_participation_id
        )
    WHERE id = NEW.heat_participation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_flag ON focus_violations;
CREATE TRIGGER trg_check_flag
AFTER INSERT ON focus_violations
FOR EACH ROW
EXECUTE FUNCTION trigger_check_flag();

-- -----------------------------------------------------------------------------
-- PART 8: RLS POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE integrity_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_reviews ENABLE ROW LEVEL SECURITY;

-- Public read for configs
DROP POLICY IF EXISTS "Public read integrity configs" ON integrity_configs;
CREATE POLICY "Public read integrity configs" ON integrity_configs
FOR SELECT USING (true);

-- Athletes can see own violations
DROP POLICY IF EXISTS "Athletes see own violations" ON focus_violations;
CREATE POLICY "Athletes see own violations" ON focus_violations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM heat_participations hp
        WHERE hp.id = focus_violations.heat_participation_id
        AND hp.athlete_id = auth.uid()
    )
);

-- Teachers can see violations for their heats
DROP POLICY IF EXISTS "Teachers see heat violations" ON focus_violations;
CREATE POLICY "Teachers see heat violations" ON focus_violations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM heat_participations hp
        JOIN heats h ON hp.heat_id = h.id
        WHERE hp.id = focus_violations.heat_participation_id
        AND h.created_by = auth.uid()
    )
);

-- Insert violations (from app)
DROP POLICY IF EXISTS "Insert own violations" ON focus_violations;
CREATE POLICY "Insert own violations" ON focus_violations
FOR INSERT WITH CHECK (true);

-- Teachers can manage attestations
DROP POLICY IF EXISTS "Teachers manage attestations" ON teacher_attestations;
CREATE POLICY "Teachers manage attestations" ON teacher_attestations
FOR ALL USING (teacher_id = auth.uid());

-- Teachers can manage qualification reviews
DROP POLICY IF EXISTS "Teachers manage reviews" ON qualification_reviews;
CREATE POLICY "Teachers manage reviews" ON qualification_reviews
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('teacher', 'school_admin')
    )
);

-- -----------------------------------------------------------------------------
-- DONE
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    RAISE NOTICE '✅ Integrity tier system installed successfully';
END $$;
