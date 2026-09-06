-- =============================================================================
-- MathAthlone — Manual student-facing curriculum labels
-- =============================================================================
-- Adds an additive, educator-approved label field used only for student-facing
-- briefings. These values are manually authored from the recorded G6 audit.
-- No AI generation, automatic paraphrasing, or derivation from internal concept
-- names is permitted by this migration or the application contract.
-- =============================================================================

BEGIN;

ALTER TABLE public.atomic_concepts
  ADD COLUMN IF NOT EXISTS announced_skill TEXT;

COMMENT ON COLUMN public.atomic_concepts.announced_skill IS
  'Manual educator-approved student-facing label for an atomic concept. Never AI-generated or automatically derived from internal concept metadata.';

WITH approved_labels (id, announced_skill) AS (
  VALUES
    ('22bb9092-6fd5-4baf-9009-44206aeda215'::uuid, 'Calculate a unit rate'),
    ('8efaed43-adee-449d-b703-bcf60bdb3726'::uuid, 'Solve a missing value in a ratio table'),
    ('774c8ce5-3546-4ce3-b25a-21a720d5b705'::uuid, 'Solve a ratio word problem')
)
UPDATE public.atomic_concepts AS concept
SET announced_skill = approved_labels.announced_skill
FROM approved_labels
WHERE concept.id = approved_labels.id
  AND concept.announced_skill IS DISTINCT FROM approved_labels.announced_skill;

DO $$
DECLARE
  verified_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO verified_count
  FROM public.atomic_concepts
  WHERE id IN (
    '22bb9092-6fd5-4baf-9009-44206aeda215'::uuid,
    '8efaed43-adee-449d-b703-bcf60bdb3726'::uuid,
    '774c8ce5-3546-4ce3-b25a-21a720d5b705'::uuid
  )
  AND announced_skill IS NOT NULL;

  IF verified_count <> 3 THEN
    RAISE EXCEPTION 'Expected three approved Grade 6 announced skills, found %. No migration changes were committed.', verified_count;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Read-only validation (run separately after successful migration)
-- =============================================================================
-- SELECT lesson_number, announced_skill
-- FROM public.atomic_concepts
-- WHERE id IN (
--   '22bb9092-6fd5-4baf-9009-44206aeda215'::uuid,
--   '8efaed43-adee-449d-b703-bcf60bdb3726'::uuid,
--   '774c8ce5-3546-4ce3-b25a-21a720d5b705'::uuid
-- )
-- ORDER BY lesson_number;
-- =============================================================================
