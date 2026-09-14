-- =============================================================================
-- MathAthlone — Immutable Static Question Review Ledger
-- =============================================================================
-- Purpose:
--   Adds append-only review evidence required by the shared deterministic
--   source-delivery resolver. This migration creates no approvals and does not
--   change static_questions.is_verified, question_generators.is_active, selector
--   availability, worksheets, or Heats.
--
-- Run manually in Supabase SQL Editor only after reviewing the code package.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.static_question_review_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  static_question_id UUID NOT NULL REFERENCES public.static_questions(id) ON DELETE RESTRICT,
  atomic_concept_id UUID NOT NULL REFERENCES public.atomic_concepts(id) ON DELETE RESTRICT,
  content_sha256 TEXT NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  rule_pack_id TEXT NOT NULL,
  rule_pack_sha256 TEXT NOT NULL CHECK (rule_pack_sha256 ~ '^[0-9a-f]{64}$'),
  deterministic_result TEXT NOT NULL CHECK (deterministic_result IN ('pass', 'hold', 'fail')),
  mathematical_rule_id TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'hold', 'revise', 'retire')),
  evidence_reference TEXT NOT NULL,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT static_question_review_records_exact_mapping CHECK (char_length(trim(evidence_reference)) > 0),
  CONSTRAINT static_question_review_records_approved_requires_pass CHECK (
    decision <> 'approved' OR deterministic_result = 'pass'
  )
);

CREATE INDEX IF NOT EXISTS idx_static_question_review_records_item_concept_time
  ON public.static_question_review_records (static_question_id, atomic_concept_id, reviewed_at DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_static_question_review_record_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'static_question_review_records are append-only. Insert a new review decision instead of updating or deleting history.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_static_question_review_record_update
  ON public.static_question_review_records;
CREATE TRIGGER prevent_static_question_review_record_update
  BEFORE UPDATE ON public.static_question_review_records
  FOR EACH ROW EXECUTE FUNCTION public.prevent_static_question_review_record_mutation();

DROP TRIGGER IF EXISTS prevent_static_question_review_record_delete
  ON public.static_question_review_records;
CREATE TRIGGER prevent_static_question_review_record_delete
  BEFORE DELETE ON public.static_question_review_records
  FOR EACH ROW EXECUTE FUNCTION public.prevent_static_question_review_record_mutation();

ALTER TABLE public.static_question_review_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers and parents view static review records"
  ON public.static_question_review_records;
CREATE POLICY "Teachers and parents view static review records"
  ON public.static_question_review_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('teacher', 'parent', 'platform_admin')
    )
  );

COMMIT;

-- Intentionally no INSERT/UPDATE/DELETE policy for browser clients. Review
-- records are created only through controlled administrative SQL after a named
-- item has passed the deterministic rule pack and the required sign-off gate.
-- No static question is verified by this migration.
