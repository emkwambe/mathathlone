-- =============================================================================
-- MathAthlone — Linked Worksheet Static Source-Use Records
-- =============================================================================
-- Purpose:
--   Persists static-question IDs used in an authorized competition-preparation
--   worksheet so a later linked Heat can exclude those exact finite items.
--
-- This migration creates no worksheet record, does not verify static questions,
-- does not activate generators, and does not change selector availability.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.worksheet_static_source_use_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  concept_ids UUID[] NOT NULL CHECK (cardinality(concept_ids) > 0),
  static_question_ids UUID[] NOT NULL CHECK (cardinality(static_question_ids) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worksheet_static_source_use_records_creator
  ON public.worksheet_static_source_use_records (created_by, created_at DESC);

ALTER TABLE public.worksheet_static_source_use_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers insert own worksheet static source use records"
  ON public.worksheet_static_source_use_records;
CREATE POLICY "Teachers insert own worksheet static source use records"
  ON public.worksheet_static_source_use_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_manage_class(class_id)
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('teacher', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "Teachers view own worksheet static source use records"
  ON public.worksheet_static_source_use_records;
CREATE POLICY "Teachers view own worksheet static source use records"
  ON public.worksheet_static_source_use_records
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND public.can_manage_class(class_id)
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('teacher', 'platform_admin')
    )
  );

COMMIT;

-- No UPDATE or DELETE policy: a source-use record is historical evidence.
-- A later Heat reads the record under the same creator identity and excludes
-- exactly these static IDs; the browser never submits the IDs themselves.
