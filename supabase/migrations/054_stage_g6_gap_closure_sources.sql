-- 054_stage_g6_gap_closure_sources.sql
-- =============================================================================
-- Stage seven deterministic Grade 6 gap-closure generators for audit.
--
-- These rows are deliberately inserted inactive. They provide a traceable,
-- versioned source record without making a new concept selectable for student
-- worksheets or class-bound Heats before qualified Grade 6 educator review and
-- controlled production acceptance. A later approved activation migration must
-- explicitly set is_active = TRUE for each reviewed row.
--
-- No AI-generated content is used by this migration.
-- =============================================================================

BEGIN;

WITH desired_generators(lesson_number, generator_type, answer_type) AS (
  VALUES
    ('M6.EE.5.2',  'g6_ee_write_dependent_equation',       'equation'),
    ('M6.GEO.1.4', 'g6_geo_area_composite_6',              'integer'),
    ('M6.GEO.2.2', 'g6_geo_surface_area_prism_6',          'integer'),
    ('M6.GEO.2.3', 'g6_geo_surface_area_pyramid_net_6',    'integer'),
    ('M6.GEO.4.1', 'g6_geo_area_real_world_6',             'integer'),
    ('M6.GEO.4.3', 'g6_geo_volume_word_6',                 'integer'),
    ('M6.NS.4.6',  'g6_ns_identify_coordinate_plane_point_6', 'text')
)
INSERT INTO public.question_generators
  (concept_id, generator_type, answer_type, is_active)
SELECT
  ac.id,
  dg.generator_type,
  dg.answer_type,
  FALSE
FROM desired_generators AS dg
JOIN public.atomic_concepts AS ac
  ON ac.lesson_number = dg.lesson_number
ON CONFLICT DO NOTHING;

-- Guard against an accidental early activation of this exact staged set.
-- Existing active rows are never modified by this migration.
UPDATE public.question_generators AS qg
SET is_active = FALSE
WHERE qg.generator_type IN (
  'g6_ee_write_dependent_equation',
  'g6_geo_area_composite_6',
  'g6_geo_surface_area_prism_6',
  'g6_geo_surface_area_pyramid_net_6',
  'g6_geo_area_real_world_6',
  'g6_geo_volume_word_6',
  'g6_ns_identify_coordinate_plane_point_6'
)
  AND EXISTS (
    SELECT 1
    FROM public.atomic_concepts AS ac
    WHERE ac.id = qg.concept_id
      AND ac.lesson_number IN (
        'M6.EE.5.2',
        'M6.GEO.1.4',
        'M6.GEO.2.2',
        'M6.GEO.2.3',
        'M6.GEO.4.1',
        'M6.GEO.4.3',
        'M6.NS.4.6'
      )
  );

SELECT
  ac.lesson_number,
  qg.generator_type,
  qg.answer_type,
  qg.is_active,
  CASE
    WHEN qg.is_active THEN 'unexpectedly active — stop and investigate'
    ELSE 'staged for deterministic audit; not student-selectable'
  END AS staged_status
FROM public.question_generators AS qg
JOIN public.atomic_concepts AS ac ON ac.id = qg.concept_id
WHERE qg.generator_type IN (
  'g6_ee_write_dependent_equation',
  'g6_geo_area_composite_6',
  'g6_geo_surface_area_prism_6',
  'g6_geo_surface_area_pyramid_net_6',
  'g6_geo_area_real_world_6',
  'g6_geo_volume_word_6',
  'g6_ns_identify_coordinate_plane_point_6'
)
ORDER BY ac.lesson_number;

COMMIT;
