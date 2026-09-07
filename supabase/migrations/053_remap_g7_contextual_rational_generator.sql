-- =============================================================================
-- 053_remap_g7_contextual_rational_generator.sql
-- =============================================================================
-- Corrects the mapping for the already implemented Grade 7 contextual rational
-- number generator. The generator belongs to M7.NS.4.1 (real-world rational
-- operations), not M7.NS.1.3 (subtraction meaning/properties).
--
-- This migration is intentionally narrow and idempotent. It changes exactly one
-- active question_generators mapping and does not modify questions, answers,
-- Heat records, users, rosters, or student credentials.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  subtraction_concept_id uuid;
  application_concept_id uuid;
  target_mapping_count integer;
  source_mapping_count integer;
  remapped_count integer;
BEGIN
  SELECT id INTO subtraction_concept_id
  FROM public.atomic_concepts
  WHERE lesson_number = 'M7.NS.1.3';

  SELECT id INTO application_concept_id
  FROM public.atomic_concepts
  WHERE lesson_number = 'M7.NS.4.1';

  IF subtraction_concept_id IS NULL OR application_concept_id IS NULL THEN
    RAISE EXCEPTION
      'Expected Grade 7 concepts M7.NS.1.3 and M7.NS.4.1 were not both found. No changes made.';
  END IF;

  SELECT COUNT(*) INTO target_mapping_count
  FROM public.question_generators
  WHERE generator_type = 'g7_ns_rational_word_problem'
    AND concept_id = application_concept_id
    AND is_active = TRUE;

  IF target_mapping_count = 0 THEN
    SELECT COUNT(*) INTO source_mapping_count
    FROM public.question_generators
    WHERE generator_type = 'g7_ns_rational_word_problem'
      AND concept_id = subtraction_concept_id
      AND is_active = TRUE;

    IF source_mapping_count <> 1 THEN
      RAISE EXCEPTION
        'Expected one active g7_ns_rational_word_problem mapping on M7.NS.1.3, found %. No changes made.',
        source_mapping_count;
    END IF;

    UPDATE public.question_generators
    SET concept_id = application_concept_id
    WHERE generator_type = 'g7_ns_rational_word_problem'
      AND concept_id = subtraction_concept_id
      AND is_active = TRUE;

    GET DIAGNOSTICS remapped_count = ROW_COUNT;

    IF remapped_count <> 1 THEN
      RAISE EXCEPTION
        'Expected to remap one active g7_ns_rational_word_problem row, changed %. Transaction rolled back.',
        remapped_count;
    END IF;
  ELSIF target_mapping_count <> 1 THEN
    RAISE EXCEPTION
      'Expected zero or one active g7_ns_rational_word_problem mapping on M7.NS.4.1, found %. No changes made.',
      target_mapping_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.question_generators
    WHERE generator_type = 'g7_ns_rational_word_problem'
      AND concept_id = subtraction_concept_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION
      'The active g7_ns_rational_word_problem mapping remains on M7.NS.1.3. Transaction rolled back.';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.question_generators
    WHERE generator_type = 'g7_ns_rational_word_problem'
      AND concept_id = application_concept_id
      AND is_active = TRUE
  ) <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one active g7_ns_rational_word_problem mapping on M7.NS.4.1. Transaction rolled back.';
  END IF;
END
$$;

-- Read-only confirmation returned after a successful migration.
SELECT
  ac.lesson_number,
  ac.name AS concept_name,
  qg.generator_type,
  qg.answer_type,
  qg.is_active
FROM public.question_generators AS qg
JOIN public.atomic_concepts AS ac ON ac.id = qg.concept_id
WHERE qg.generator_type = 'g7_ns_rational_word_problem'
ORDER BY qg.is_active DESC, ac.lesson_number;

COMMIT;
