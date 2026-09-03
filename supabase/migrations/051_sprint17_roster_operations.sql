-- Migration 051 — Sprint 17: Roster Operations Audit and Enrollment Integrity
-- =============================================================================
-- Adds a minimal, credential-safe audit record for managed classroom roster
-- operations. This migration deliberately does NOT recreate the absent legacy
-- users.managed Boolean. managed_username remains the sole managed-account
-- marker established by migration 048.
--
-- Safety properties:
--   * no temporary PIN, password, raw pasted roster, or email is stored;
--   * app code writes with the server-only admin client only after class checks;
--   * no authenticated-browser RLS policy grants direct access to audit data;
--   * each class can contain an athlete only once at the database level.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.roster_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  athlete_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN (
    'preview_import',
    'import_created',
    'import_enrolled_existing',
    'import_already_active',
    'import_skipped',
    'enrollment_removed',
    'enrollment_restored',
    'pin_reset',
    'class_archived'
  )),
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'skipped', 'denied', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roster_operations_metadata_is_object CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.roster_operations IS
  'Credential-safe operational audit trail for classroom roster changes. Never stores PINs, passwords, raw names, internal emails, or pasted roster text.';
COMMENT ON COLUMN public.roster_operations.metadata IS
  'Safe reason codes and aggregate counts only. Temporary credentials and raw roster values are prohibited.';

CREATE INDEX IF NOT EXISTS idx_roster_operations_class_occurred
  ON public.roster_operations (class_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_roster_operations_actor_occurred
  ON public.roster_operations (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_roster_operations_athlete_occurred
  ON public.roster_operations (athlete_id, occurred_at DESC)
  WHERE athlete_id IS NOT NULL;

-- The class roster importer uses ON CONFLICT (class_id, athlete_id). The
-- original schema already intends this relationship to be unique; ensure the
-- live database enforces it before lifecycle operations are added. Abort rather
-- than silently applying a non-unique index if legacy duplicate rows exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.class_enrollments
    GROUP BY class_id, athlete_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot apply Sprint 17 roster integrity: duplicate class enrollment rows already exist. No changes were made.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_enrollments_class_athlete_unique
  ON public.class_enrollments (class_id, athlete_id);

ALTER TABLE public.roster_operations ENABLE ROW LEVEL SECURITY;

-- Audit records are not queried directly by browsers. Server-side code uses
-- the secret-key client after explicit class-manager and ownership checks.
REVOKE ALL ON TABLE public.roster_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.roster_operations TO service_role;

COMMIT;

-- =============================================================================
-- Read-only validation (run separately after successful migration)
-- =============================================================================
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'roster_operations';
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename IN ('roster_operations', 'class_enrollments');
-- =============================================================================
