-- =============================================================================
-- Sprint 0 / Migration 013 — Update divisions to official rulebook
-- =============================================================================
-- Per PROJECT_CONTEXT.md the official 5 divisions are:
--   Junior          (JR)  : grades 3–4
--   Intermediate    (INT) : grades 5–6
--   Advanced        (ADV) : grades 7–8   → NC Math 1
--   Junior Varsity  (JV)  : grades 9–10  → NC Math 1
--   Senior Varsity  (SV)  : grades 11–12 → NC Math 1
--
-- The legacy seed (002 / 004) inserted D1/D2/D3/D4. This migration:
--   1. Upserts the 5 new divisions by code (idempotent)
--   2. Attempts to delete the legacy D1-D4 rows; tolerates FK violations
--   3. Seeds division_curricula: ADV/JV/SV → NC Math 1
--      (Junior and Intermediate intentionally have no rows — UI shows
--       them as "Coming soon")
--
-- The NC Math 1 course is looked up dynamically by code IN ('NCM1','M1','NC Math 1')
-- so we don't have to know which seed survived the legacy collision.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Upsert the 5 official divisions by code
-- -----------------------------------------------------------------------------

INSERT INTO public.divisions (name, code, grade_min, grade_max, description, display_order)
VALUES
    ('Junior',         'JR',  3,  4,  'Grades 3–4',  1),
    ('Intermediate',   'INT', 5,  6,  'Grades 5–6',  2),
    ('Advanced',       'ADV', 7,  8,  'Grades 7–8',  3),
    ('Junior Varsity', 'JV',  9,  10, 'Grades 9–10', 4),
    ('Senior Varsity', 'SV',  11, 12, 'Grades 11–12',5)
ON CONFLICT (code) DO UPDATE SET
    name          = EXCLUDED.name,
    grade_min     = EXCLUDED.grade_min,
    grade_max     = EXCLUDED.grade_max,
    description   = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- -----------------------------------------------------------------------------
-- PART 2: Remove the legacy D1/D2/D3/D4 rows if present and safely deletable
-- -----------------------------------------------------------------------------
-- We use a per-row DO block so FK violations on one row don't prevent
-- deletion of the others.

DO $$
DECLARE
    legacy_code TEXT;
BEGIN
    FOREACH legacy_code IN ARRAY ARRAY['D1','D2','D3','D4'] LOOP
        BEGIN
            DELETE FROM public.divisions WHERE code = legacy_code;
            IF FOUND THEN
                RAISE NOTICE '✓ Deleted legacy division: %', legacy_code;
            END IF;
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'Could not delete legacy division % (FK refs exist). Leaving in place. Manually migrate references before retrying.', legacy_code;
        END;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- PART 3: Seed division_curricula — ADV / JV / SV → NC Math 1
-- -----------------------------------------------------------------------------
-- Junior and Intermediate get no curriculum entries (UI shows "Coming soon").

DO $$
DECLARE
    v_nc_math_1_id  UUID;
    v_adv_id        UUID;
    v_jv_id         UUID;
    v_sv_id         UUID;
    v_inserted_count INT := 0;
BEGIN
    -- Look up NC Math 1 course (handle legacy codes M1 or NCM1)
    SELECT id INTO v_nc_math_1_id
    FROM public.courses
    WHERE code IN ('NCM1','M1') OR name = 'NC Math 1'
    ORDER BY CASE code WHEN 'NCM1' THEN 1 WHEN 'M1' THEN 2 ELSE 3 END
    LIMIT 1;

    IF v_nc_math_1_id IS NULL THEN
        RAISE NOTICE 'NC Math 1 course not found yet — division_curricula will be seeded by migration 014.';
        RETURN;
    END IF;

    SELECT id INTO v_adv_id FROM public.divisions WHERE code = 'ADV';
    SELECT id INTO v_jv_id  FROM public.divisions WHERE code = 'JV';
    SELECT id INTO v_sv_id  FROM public.divisions WHERE code = 'SV';

    IF v_adv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_adv_id, v_nc_math_1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
        v_inserted_count := v_inserted_count + (CASE WHEN FOUND THEN 1 ELSE 0 END);
    END IF;

    IF v_jv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_jv_id, v_nc_math_1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
        v_inserted_count := v_inserted_count + (CASE WHEN FOUND THEN 1 ELSE 0 END);
    END IF;

    IF v_sv_id IS NOT NULL THEN
        INSERT INTO public.division_curricula (division_id, course_id)
        VALUES (v_sv_id, v_nc_math_1_id)
        ON CONFLICT (division_id, course_id) DO NOTHING;
        v_inserted_count := v_inserted_count + (CASE WHEN FOUND THEN 1 ELSE 0 END);
    END IF;

    RAISE NOTICE '✓ NC Math 1 course id: %', v_nc_math_1_id;
    RAISE NOTICE '✓ division_curricula rows newly inserted in this run: %', v_inserted_count;
END $$;

-- -----------------------------------------------------------------------------
-- PART 4: Verification
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_division_count INT;
    v_curriculum_count INT;
    v_division_codes TEXT[];
BEGIN
    SELECT COUNT(*) INTO v_division_count FROM public.divisions;
    SELECT COUNT(*) INTO v_curriculum_count FROM public.division_curricula;

    SELECT array_agg(code ORDER BY display_order) INTO v_division_codes
    FROM public.divisions;

    RAISE NOTICE '✓ divisions row count: % | codes: %', v_division_count, v_division_codes;
    RAISE NOTICE '✓ division_curricula row count: %', v_curriculum_count;
END $$;

COMMIT;
