-- =============================================================================
-- Sprint 0 / Migration 014 — SUPERSEDED
-- =============================================================================
-- This migration was split into three smaller files because the Supabase SQL
-- Editor (and some pgBouncer/pooler configurations) fails to parse the
-- original ~50 KB single-file form as one block.
--
-- All individual PARTs of the original file worked when run separately, so
-- the split below preserves identical semantics:
--
--   014a_curriculum_schema.sql     — UNIQUE constraints + NC Math 1 course
--   014b_curriculum_concepts.sql   — 8 unit topics + 111 atomic concepts
--   014c_curriculum_generators.sql — 54 question generators + division_curricula links
--
-- This file is intentionally left as a no-op so it can stay in the migrations
-- folder without breaking `supabase db push` ordering. Anyone applying
-- migrations should run 014a → 014b → 014c in order.
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 014 is superseded by 014a, 014b, and 014c. No action taken.';
END $$;
