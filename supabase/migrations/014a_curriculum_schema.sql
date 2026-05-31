-- =============================================================================
-- Sprint 0 / Migration 014a — Curriculum schema + course reconciliation
-- =============================================================================
-- This is PART 1 of the split-up 014 migration. The original 014 was failing
-- in the Supabase SQL Editor (parser issue with the ~50 KB single-file form),
-- so it's been broken into three independently runnable, idempotent files:
--
--   014a — UNIQUE constraints + NC Math 1 course (this file)
--   014b — 8 unit topics + 111 atomic concepts
--   014c — 54 question generators + division_curricula links
--
-- Prerequisites: migrations 002 (courses/unit_topics/atomic_concepts/question_generators
-- tables) and 012 (division_curricula table) must already have run.
--
-- Run order: 014a → 014b → 014c.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Ensure UNIQUE constraints exist (needed for ON CONFLICT in 014b/014c)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
    ALTER TABLE public.unit_topics
        ADD CONSTRAINT unit_topics_course_code_unique UNIQUE (course_id, code);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table  THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.atomic_concepts
        ADD CONSTRAINT atomic_concepts_lesson_number_unique UNIQUE (lesson_number);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table  THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.question_generators
        ADD CONSTRAINT question_generators_generator_type_unique UNIQUE (generator_type);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table  THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.courses
        ADD CONSTRAINT courses_code_unique UNIQUE (code);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table  THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Reconcile the NC Math 1 course to code 'NCM1'
-- -----------------------------------------------------------------------------
-- Live state (LIVE_QUERY_RESULTS.md): courses count = 1, exact code unknown
-- (could be 'M1' or 'NCM1'). Strategy:
--   a) Upsert a row with code='NCM1' (idempotent name/grade refresh)
--   b) If a separate legacy row with code='M1' exists, migrate any
--      unit_topics pointing at it to NCM1, then delete it
--      (skip on FK violations)

INSERT INTO public.courses (name, code, grade_band, state, description, display_order, is_active)
VALUES (
    'NC Math 1', 'NCM1', '9', 'NC',
    'North Carolina Math 1 — Algebra foundations',
    4, true
)
ON CONFLICT (code) DO UPDATE SET
    name          = EXCLUDED.name,
    grade_band    = EXCLUDED.grade_band,
    state         = EXCLUDED.state,
    description   = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_active     = EXCLUDED.is_active;

DO $$
DECLARE
    v_m1_id   UUID;
    v_ncm1_id UUID;
BEGIN
    SELECT id INTO v_m1_id   FROM public.courses WHERE code = 'M1';
    SELECT id INTO v_ncm1_id FROM public.courses WHERE code = 'NCM1';

    IF v_m1_id IS NOT NULL AND v_ncm1_id IS NOT NULL AND v_m1_id <> v_ncm1_id THEN
        -- Migrate unit_topics from M1 to NCM1, then delete M1
        UPDATE public.unit_topics SET course_id = v_ncm1_id WHERE course_id = v_m1_id;
        BEGIN
            DELETE FROM public.courses WHERE id = v_m1_id;
            RAISE NOTICE '✓ Migrated unit_topics from M1 → NCM1 and deleted legacy M1 course.';
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'Could not delete M1 course due to FK refs. Leaving in place.';
        END;
    ELSIF v_m1_id IS NOT NULL AND v_ncm1_id IS NULL THEN
        -- Rare path: M1 exists but the NCM1 upsert above somehow did not land
        UPDATE public.courses SET code = 'NCM1' WHERE id = v_m1_id;
        RAISE NOTICE '✓ Renamed legacy M1 course to NCM1.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_ncm1_id UUID;
    v_constraint_count INT;
BEGIN
    SELECT id INTO v_ncm1_id FROM public.courses WHERE code = 'NCM1';

    SELECT COUNT(*) INTO v_constraint_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND constraint_type = 'UNIQUE'
      AND table_name IN ('courses','unit_topics','atomic_concepts','question_generators');

    IF v_ncm1_id IS NULL THEN
        RAISE EXCEPTION '014a failed: NCM1 course not present after upsert.';
    END IF;

    RAISE NOTICE '✓ 014a complete. NCM1 course id: %', v_ncm1_id;
    RAISE NOTICE '✓ UNIQUE constraints on curriculum tables: %', v_constraint_count;
    RAISE NOTICE 'Next: run 014b_curriculum_concepts.sql';
END $$;

COMMIT;
