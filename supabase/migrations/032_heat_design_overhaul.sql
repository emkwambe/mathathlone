-- =============================================================================
-- 032_heat_design_overhaul.sql
-- =============================================================================
-- Adds the schema surface for the Heat design overhaul:
--
--   • Two new heat types: 'quiz' and 'test' (assessment modes)
--   • Assessment-mode flags: is_assessment, results_released, grade_bands
--   • Question-profile picker: question_profile TEXT
--   • Multi-select concept tree: concept_ids TEXT[] (null = all concepts)
--
-- Per the design discussion we KEEP heats.type as the single mode column
-- (no parallel heat_mode column). 'quiz' and 'test' are added to the
-- existing heat_type ENUM so they share the type lookup path with the
-- four existing competition modes (sprint / target / practice /
-- championship / official).
-- =============================================================================

BEGIN;

-- ── 1. Extend the heat_type ENUM with the two assessment modes ─────────────
-- ALTER TYPE ... ADD VALUE is non-transactional but idempotent via
-- IF NOT EXISTS. Wrapped in DO blocks so a re-run after a partial apply
-- doesn't bomb.
DO $$ BEGIN ALTER TYPE public.heat_type ADD VALUE IF NOT EXISTS 'quiz'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.heat_type ADD VALUE IF NOT EXISTS 'test'; EXCEPTION WHEN others THEN NULL; END $$;

-- ── 2. New columns on heats ────────────────────────────────────────────────
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS is_assessment   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS results_released BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS question_profile TEXT    NOT NULL DEFAULT 'standard';
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS concept_ids      TEXT[];
ALTER TABLE public.heats
  ADD COLUMN IF NOT EXISTS grade_bands      JSONB   NOT NULL DEFAULT '{"A":90,"B":80,"C":70,"D":60}'::jsonb;

-- Light CHECK so junk profile values can't be inserted.
DO $$ BEGIN
  ALTER TABLE public.heats
    ADD CONSTRAINT heats_question_profile_check
    CHECK (question_profile IN ('warmup', 'standard', 'challenge', 'deep'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. 3-axis tag columns on question_generators ──────────────────────────
-- The curriculum JSONs (docs/curriculum/*/*.json) already carry these tags
-- per generator, but the live schema never had columns to hold them. Add
-- them as NULLable so existing seeded rows continue to validate; a future
-- backfill migration can populate from the JSON sources.
--
-- question-delivery.ts treats NULL on any axis as "use depth fallback for
-- this generator" so the absence of data doesn't block question selection.
ALTER TABLE public.question_generators
  ADD COLUMN IF NOT EXISTS cognitive_demand TEXT;
ALTER TABLE public.question_generators
  ADD COLUMN IF NOT EXISTS complexity       TEXT;
ALTER TABLE public.question_generators
  ADD COLUMN IF NOT EXISTS context          TEXT;

DO $$ BEGIN
  ALTER TABLE public.question_generators
    ADD CONSTRAINT question_generators_cognitive_demand_check
    CHECK (cognitive_demand IS NULL OR cognitive_demand IN ('procedural','conceptual','application','reasoning'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.question_generators
    ADD CONSTRAINT question_generators_complexity_check
    CHECK (complexity IS NULL OR complexity IN ('low','medium','high'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.question_generators
    ADD CONSTRAINT question_generators_context_check
    CHECK (context IS NULL OR context IN ('abstract','real_world'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Optional columns on heat_awards ─────────────────────────────────────
-- Phase 2 populates these in scoring-service.ts. Adding them now so the
-- column exists before the code path tries to write it.
ALTER TABLE public.heat_awards
  ADD COLUMN IF NOT EXISTS letter_grade  TEXT;
ALTER TABLE public.heat_awards
  ADD COLUMN IF NOT EXISTS is_assessment BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
  ALTER TABLE public.heat_awards
    ADD CONSTRAINT heat_awards_letter_grade_check
    CHECK (letter_grade IS NULL OR letter_grade IN ('A','B','C','D','F'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Verification ───────────────────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'heats'
  AND column_name IN ('type', 'is_assessment', 'results_released', 'question_profile', 'concept_ids', 'grade_bands')
ORDER BY ordinal_position;

-- Confirm the ENUM additions.
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'heat_type'
ORDER BY enumsortorder;

COMMIT;
