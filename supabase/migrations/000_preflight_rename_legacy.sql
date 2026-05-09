-- =============================================================================
-- MathAthlone Preflight: Rename Legacy Tables
-- =============================================================================
-- Run this BEFORE 004_nc_math_1_seed.sql and 003_integrity_system.sql
--
-- WHY: The existing `question_generators` table has a flat/denormalized schema
-- (concept_id is TEXT). Migration 004 expects a normalized schema where
-- question_generators.concept_id is UUID referencing atomic_concepts(id).
--
-- This migration safely renames legacy tables out of the way so 004 can
-- create the new versions cleanly. Legacy data is preserved in *_legacy tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Rename question_generators (incompatible schema)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    has_text_concept_id BOOLEAN;
BEGIN
    -- Check if question_generators exists and has the legacy TEXT concept_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'question_generators'
          AND column_name = 'concept_id'
          AND data_type = 'text'
    ) INTO has_text_concept_id;

    IF has_text_concept_id THEN
        -- Drop dependent views first (will be recreated by 004)
        DROP VIEW IF EXISTS v_generator_catalog CASCADE;

        -- Rename the legacy table
        ALTER TABLE question_generators RENAME TO question_generators_legacy;
        RAISE NOTICE '✓ Renamed legacy question_generators → question_generators_legacy';
    ELSE
        RAISE NOTICE 'ℹ question_generators is either absent or already has UUID concept_id; no rename needed';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Check heat_questions for incompatible schema
-- -----------------------------------------------------------------------------
-- Migration 004 expects heat_questions to have specific columns.
-- The existing heat_questions might have different ones from the auth/base schema.

DO $$
DECLARE
    has_question_latex BOOLEAN;
    has_generator_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'heat_questions'
          AND column_name = 'question_latex'
    ) INTO has_question_latex;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'heat_questions'
          AND column_name = 'generator_id'
    ) INTO has_generator_id;

    -- If heat_questions exists but lacks the new columns, rename it
    IF NOT has_question_latex OR NOT has_generator_id THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = 'heat_questions') THEN
            ALTER TABLE heat_questions RENAME TO heat_questions_legacy;
            RAISE NOTICE '✓ Renamed legacy heat_questions → heat_questions_legacy';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ heat_questions already has new schema; no rename needed';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Drop dependent views that may reference legacy tables
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS v_heat_question_results CASCADE;
DROP VIEW IF EXISTS v_generator_catalog CASCADE;

-- -----------------------------------------------------------------------------
-- DONE
-- -----------------------------------------------------------------------------
-- Next steps:
-- 1. Run 004_nc_math_1_seed.sql (creates new normalized tables + seed data)
-- 2. Run 003_integrity_system.sql (adds integrity tier system)
-- 3. (Optional) Run 005_create_views.sql to add v_league_standings, etc.
-- -----------------------------------------------------------------------------
