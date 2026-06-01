-- =============================================================================
-- Migration 017 — Repair heat_questions.generator_id FK target
-- =============================================================================
-- Symptom (Sprint 6 production reproduction):
--   INSERT INTO heat_questions (... generator_id ...) fails with
--     "violates foreign key constraint heat_questions_generator_id_fkey"
--   even when generator_id is a valid UUID present in
--   public.question_generators.
--
-- Root cause hypothesis:
--   Migration 002/004 created the FK while question_generators existed.
--   Migration 000_preflight_rename_legacy.sql later renamed an older
--   question_generators table to question_generators_legacy. Postgres FK
--   constraints bind to table OIDs, so depending on the migration order
--   the FK ended up pointing at question_generators_legacy while the
--   re-created question_generators got a NEW oid that the FK doesn't
--   target. INSERTs that look up rows from the "new" question_generators
--   then fail the FK check against the legacy table.
--
-- This migration:
--   1. Inspects the existing FK and logs which table it points at.
--   2. Drops the FK if it points at the wrong table OR if its name matches
--      the standard name.
--   3. Re-creates it explicitly against public.question_generators(id)
--      with ON DELETE SET NULL so removing a generator doesn't cascade-
--      delete historical Heat questions.
--
-- Idempotent: drops with IF EXISTS, re-adds inside an EXCEPTION block.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Diagnostic: report the current FK target before we touch anything.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_target REGCLASS;
    v_constraint_name TEXT;
BEGIN
    SELECT conname, confrelid::regclass
      INTO v_constraint_name, v_target
    FROM pg_constraint
    WHERE conrelid = 'public.heat_questions'::regclass
      AND contype  = 'f'
      AND conkey   = ARRAY[
          (SELECT attnum FROM pg_attribute
            WHERE attrelid = 'public.heat_questions'::regclass
              AND attname  = 'generator_id')
      ]
    LIMIT 1;

    IF v_constraint_name IS NULL THEN
        RAISE NOTICE 'No FK currently exists on heat_questions.generator_id.';
    ELSE
        RAISE NOTICE 'Existing FK: % -> %', v_constraint_name, v_target;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Drop any existing FK on heat_questions.generator_id (regardless of name)
-- -----------------------------------------------------------------------------
-- We don't assume the constraint is named heat_questions_generator_id_fkey
-- because Sprint 0 / Sprint 2 migrations may have left a differently-named
-- constraint behind. We loop and drop whatever FK references generator_id.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.heat_questions'::regclass
          AND contype  = 'f'
          AND conkey   = ARRAY[
              (SELECT attnum FROM pg_attribute
                WHERE attrelid = 'public.heat_questions'::regclass
                  AND attname  = 'generator_id')
          ]
    LOOP
        EXECUTE format('ALTER TABLE public.heat_questions DROP CONSTRAINT %I', r.conname);
        RAISE NOTICE '✓ Dropped FK %', r.conname;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Re-create the FK against the CURRENT public.question_generators
-- -----------------------------------------------------------------------------

ALTER TABLE public.heat_questions
    ADD CONSTRAINT heat_questions_generator_id_fkey
    FOREIGN KEY (generator_id)
    REFERENCES public.question_generators(id)
    ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Verification: confirm the new FK exists and points at the right table
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_target REGCLASS;
BEGIN
    SELECT confrelid::regclass INTO v_target
    FROM pg_constraint
    WHERE conrelid = 'public.heat_questions'::regclass
      AND conname  = 'heat_questions_generator_id_fkey';

    IF v_target IS NULL THEN
        RAISE EXCEPTION 'FK heat_questions_generator_id_fkey was not created.';
    END IF;

    IF v_target::text NOT LIKE '%question_generators' OR v_target::text LIKE '%legacy%' THEN
        RAISE EXCEPTION 'FK target is wrong: %', v_target;
    END IF;

    RAISE NOTICE '✓ heat_questions_generator_id_fkey now references %', v_target;
END $$;

COMMIT;
