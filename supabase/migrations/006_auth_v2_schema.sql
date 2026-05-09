-- =============================================================================
-- MathAthlone Auth v2 — Schema Migration
-- =============================================================================
-- File: 006_auth_v2_schema.sql
-- Run AFTER: 005_views_and_functions.sql
--
-- Creates:
--   * Enums: app_role, app_permission, consent_method, consent_status, auth_event_type
--   * Tables: user_roles, role_permissions, user_permissions, parental_consents,
--             auth_events, districts
--   * Extensions to: users, schools
--   * Functions: custom_access_token_hook, authorize, user_role, user_school_id, etc.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: ENUMS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM (
    'mathlete', 'parent', 'teacher', 'school_admin',
    'district_admin', 'platform_admin', 'broadcast_host'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE app_permission AS ENUM (
    'heats.create', 'heats.delete', 'heats.proctor', 'heats.broadcast',
    'users.read.school', 'users.read.district', 'users.read.platform',
    'users.invite.mathlete', 'users.invite.teacher',
    'attest.regional', 'attest.state',
    'integrity.review',
    'data.export.school', 'data.export.district',
    'data.delete.minor', 'consent.grant.parent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_method AS ENUM (
    'credit_card', 'government_id', 'kba', 'text_plus',
    'school_ferpa', 'parent_managed_setup', 'video_conf', 'signed_form'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM (
    'pending', 'verified', 'expired', 'revoked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth_event_type AS ENUM (
    'login_success', 'login_failure', 'logout',
    'password_reset_request', 'password_reset_complete',
    'passkey_register', 'passkey_authenticate',
    'role_grant', 'role_revoke',
    'permission_grant', 'permission_revoke',
    'consent_grant', 'consent_revoke',
    'mfa_challenge', 'mfa_success', 'mfa_failure',
    'account_lock', 'account_unlock',
    'data_export', 'data_deletion',
    'sso_login', 'sso_link', 'sso_unlink'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: NEW TABLES
-- -----------------------------------------------------------------------------

-- Districts (organizational level above schools)
CREATE TABLE IF NOT EXISTS districts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  state           TEXT NOT NULL,
  country_code    TEXT DEFAULT 'US',
  contact_email   TEXT,
  contact_phone   TEXT,

  -- Compliance
  dpa_signed_at   TIMESTAMPTZ,
  dpa_signed_by   TEXT,
  dpa_url         TEXT,
  dpa_version     TEXT,

  -- SSO
  sso_provider    TEXT CHECK (sso_provider IN ('clever','classlink','google','azure','saml',NULL)),
  sso_config      JSONB,
  sso_enabled     BOOLEAN DEFAULT false,

  -- Licensing
  license_tier    TEXT DEFAULT 'free' CHECK (license_tier IN ('free','bronze','gold','platinum','custom')),
  license_seats   INTEGER,
  license_expires_at TIMESTAMPTZ,

  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state);
CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active) WHERE is_active = true;

-- Role assignments (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          app_role NOT NULL,

  -- Scope: a teacher's role is scoped to a school; a district_admin to a district; etc.
  scope_type    TEXT CHECK (scope_type IN ('school','district','platform','self', NULL)),
  scope_id      UUID,

  granted_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  notes         TEXT,

  UNIQUE (user_id, role, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_scope ON user_roles(scope_type, scope_id) WHERE is_active = true;

-- Role → permission map (seeded data; rarely edited)
CREATE TABLE IF NOT EXISTS role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        app_role NOT NULL,
  permission  app_permission NOT NULL,
  UNIQUE (role, permission)
);

-- Ad-hoc permission grants (override or extend role permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission  app_permission NOT NULL,
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  reason      TEXT,
  UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Parental consent records (COPPA compliance)
CREATE TABLE IF NOT EXISTS parental_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method          consent_method NOT NULL,
  status          consent_status NOT NULL DEFAULT 'pending',

  -- Verification
  verification_provider  TEXT,
  verification_token     TEXT,
  verification_metadata  JSONB,
  verified_at            TIMESTAMPTZ,
  expires_at             TIMESTAMPTZ,

  -- Required for COPPA audit trail
  consent_ip             INET,
  consent_user_agent     TEXT,
  notice_version         TEXT NOT NULL,
  data_uses_consented    TEXT[] NOT NULL DEFAULT ARRAY['platform']::TEXT[],

  -- Revocation
  revoked_at             TIMESTAMPTZ,
  revoked_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revocation_reason      TEXT,

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (parent_user_id, child_user_id),
  CHECK (parent_user_id <> child_user_id)
);

CREATE INDEX IF NOT EXISTS idx_consents_parent ON parental_consents(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_consents_child ON parental_consents(child_user_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON parental_consents(status, expires_at);

-- Audit log
CREATE TABLE IF NOT EXISTS auth_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type      auth_event_type NOT NULL,
  event_data      JSONB,

  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT,

  target_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acting_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  occurred_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user ON auth_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_target ON auth_events(target_user_id, occurred_at DESC);

-- -----------------------------------------------------------------------------
-- PART 3: EXTEND EXISTING TABLES
-- -----------------------------------------------------------------------------

-- Schools: add email_domains, sso, district FK, license tracking
ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_domains TEXT[];
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sso_provider TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sso_config JSONB;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE SET NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS license_tier TEXT DEFAULT 'free';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district_id);
CREATE INDEX IF NOT EXISTS idx_schools_verified ON schools(verified) WHERE verified = true;

-- Users: add age detection, COPPA fields, FERPA flag, soft delete
ALTER TABLE users ADD COLUMN IF NOT EXISTS coppa_consent_id UUID REFERENCES parental_consents(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ferpa_authorized_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ferpa_authorizing_school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS data_minimization_tier TEXT
  DEFAULT 'minimal'
  CHECK (data_minimization_tier IN ('minimal','standard','full'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Computed columns for age (using regular columns, not GENERATED, since DOB might be NULL)
-- We'll compute these in views/functions instead to keep flexibility

CREATE INDEX IF NOT EXISTS idx_users_dob ON users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- PART 4: HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Returns true if a user is under 13 (COPPA threshold)
CREATE OR REPLACE FUNCTION public.is_under_13(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  dob DATE;
BEGIN
  SELECT date_of_birth INTO dob FROM users WHERE id = p_user_id;
  IF dob IS NULL THEN RETURN false; END IF;
  RETURN dob > (CURRENT_DATE - INTERVAL '13 years');
END;
$$;

-- Returns true if user is under 18 (general minor flag)
CREATE OR REPLACE FUNCTION public.is_minor(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  dob DATE;
BEGIN
  SELECT date_of_birth INTO dob FROM users WHERE id = p_user_id;
  IF dob IS NULL THEN RETURN false; END IF;
  RETURN dob > (CURRENT_DATE - INTERVAL '18 years');
END;
$$;

-- -----------------------------------------------------------------------------
-- PART 5: THE CUSTOM ACCESS TOKEN HOOK
-- -----------------------------------------------------------------------------
-- This function runs every time Supabase issues a JWT. It injects:
--   - user_role  (single highest-precedence role)
--   - permissions (array of effective permissions)
--   - school_id  (user's school, if any)
--   - district_id (user's district, if any)
--
-- After running this migration, you MUST enable the hook in Supabase Dashboard:
--   Authentication → Hooks → Custom Access Token Hook → ENABLE
--   Schema: public
--   Function: custom_access_token_hook
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  uid uuid := (event->>'user_id')::uuid;
  v_user_role text;
  v_permissions text[];
  v_school_id uuid;
  v_district_id uuid;
BEGIN
  claims := COALESCE(event->'claims', '{}'::jsonb);

  -- Highest-precedence active role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_roles.user_id = uid
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY
    CASE role
      WHEN 'platform_admin'  THEN 1
      WHEN 'district_admin'  THEN 2
      WHEN 'school_admin'    THEN 3
      WHEN 'teacher'         THEN 4
      WHEN 'broadcast_host'  THEN 5
      WHEN 'parent'          THEN 6
      WHEN 'mathlete'        THEN 7
    END
  LIMIT 1;

  -- All effective permissions
  SELECT array_agg(DISTINCT permission::text) INTO v_permissions
  FROM (
    -- Permissions from active roles
    SELECT rp.permission
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = uid
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())

    UNION

    -- Ad-hoc permissions
    SELECT permission
    FROM user_permissions
    WHERE user_permissions.user_id = uid
      AND (expires_at IS NULL OR expires_at > NOW())
  ) AS effective;

  -- School & district scope
  SELECT u.school_id, s.district_id
    INTO v_school_id, v_district_id
  FROM users u
  LEFT JOIN schools s ON s.id = u.school_id
  WHERE u.id = uid;

  -- Inject claims
  IF v_user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', to_jsonb('mathlete'));
  END IF;

  claims := jsonb_set(claims, '{permissions}', to_jsonb(COALESCE(v_permissions, ARRAY[]::text[])));

  IF v_school_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{school_id}', to_jsonb(v_school_id::text));
  END IF;

  IF v_district_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{district_id}', to_jsonb(v_district_id::text));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to the auth admin role (required for the hook to run)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.role_permissions TO supabase_auth_admin;
GRANT SELECT ON public.user_permissions TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;
GRANT SELECT ON public.schools TO supabase_auth_admin;

-- -----------------------------------------------------------------------------
-- PART 6: AUTHORIZATION HELPERS (used in RLS policies)
-- -----------------------------------------------------------------------------

-- Read user's role from JWT
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS app_role
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(auth.jwt() ->> 'user_role', '')::app_role,
    'mathlete'::app_role
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'mathlete'::app_role;
END;
$$;

-- Read user's school from JWT
CREATE OR REPLACE FUNCTION public.user_school_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN NULLIF(auth.jwt() ->> 'school_id', '')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Read user's district from JWT
CREATE OR REPLACE FUNCTION public.user_district_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN NULLIF(auth.jwt() ->> 'district_id', '')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Check if current user has a specific permission
CREATE OR REPLACE FUNCTION public.authorize(requested_permission app_permission)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  perms jsonb;
BEGIN
  perms := COALESCE(auth.jwt() -> 'permissions', '[]'::jsonb);
  RETURN perms ? requested_permission::text;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Check if current user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC roles app_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN user_role() = ANY(roles);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- -----------------------------------------------------------------------------
-- PART 7: ENABLE RLS ON NEW TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Public read role_permissions (everyone needs to see what permissions exist)
DROP POLICY IF EXISTS "Public read role_permissions" ON role_permissions;
CREATE POLICY "Public read role_permissions"
  ON role_permissions FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can read their own roles
DROP POLICY IF EXISTS "Read own roles" ON user_roles;
CREATE POLICY "Read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Platform admins can read/manage all roles
DROP POLICY IF EXISTS "Platform admin manages roles" ON user_roles;
CREATE POLICY "Platform admin manages roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (has_role('platform_admin'))
  WITH CHECK (has_role('platform_admin'));

-- District admins can manage roles in their district
DROP POLICY IF EXISTS "District admin manages district roles" ON user_roles;
CREATE POLICY "District admin manages district roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    has_role('district_admin')
    AND scope_type = 'district'
    AND scope_id = user_district_id()
  );

-- Users can read their own permissions
DROP POLICY IF EXISTS "Read own permissions" ON user_permissions;
CREATE POLICY "Read own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Parents can read their own consent records
DROP POLICY IF EXISTS "Parents read own consents" ON parental_consents;
CREATE POLICY "Parents read own consents"
  ON parental_consents FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid());

-- Children can see consent records about them
DROP POLICY IF EXISTS "Children read own consents" ON parental_consents;
CREATE POLICY "Children read own consents"
  ON parental_consents FOR SELECT
  TO authenticated
  USING (child_user_id = auth.uid());

-- Parents can create consents (with consent.grant.parent permission)
DROP POLICY IF EXISTS "Parents grant consent" ON parental_consents;
CREATE POLICY "Parents grant consent"
  ON parental_consents FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_user_id = auth.uid()
    AND authorize('consent.grant.parent')
  );

-- Parents can revoke their own consents
DROP POLICY IF EXISTS "Parents revoke consent" ON parental_consents;
CREATE POLICY "Parents revoke consent"
  ON parental_consents FOR UPDATE
  TO authenticated
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

-- Public read districts (for school selection during registration)
DROP POLICY IF EXISTS "Public read districts" ON districts;
CREATE POLICY "Public read districts"
  ON districts FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Platform admins manage districts
DROP POLICY IF EXISTS "Platform admin manages districts" ON districts;
CREATE POLICY "Platform admin manages districts"
  ON districts FOR ALL
  TO authenticated
  USING (has_role('platform_admin'))
  WITH CHECK (has_role('platform_admin'));

-- Users can read their own auth events
DROP POLICY IF EXISTS "Read own auth events" ON auth_events;
CREATE POLICY "Read own auth events"
  ON auth_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Platform admins read all auth events
DROP POLICY IF EXISTS "Platform admin reads all auth events" ON auth_events;
CREATE POLICY "Platform admin reads all auth events"
  ON auth_events FOR SELECT
  TO authenticated
  USING (has_role('platform_admin'));

-- -----------------------------------------------------------------------------
-- PART 8: VERIFY
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  enum_count INT;
  table_count INT;
  fn_count INT;
BEGIN
  -- Verify enums
  SELECT COUNT(*) INTO enum_count
  FROM pg_type
  WHERE typname IN ('app_role','app_permission','consent_method','consent_status','auth_event_type')
    AND typtype = 'e';

  -- Verify tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('user_roles','role_permissions','user_permissions','parental_consents','auth_events','districts');

  -- Verify functions
  SELECT COUNT(*) INTO fn_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'custom_access_token_hook','authorize','user_role',
      'user_school_id','user_district_id','has_role',
      'is_under_13','is_minor'
    );

  RAISE NOTICE '✅ Auth v2 schema: % enums, % tables, % functions', enum_count, table_count, fn_count;

  IF enum_count < 5 THEN
    RAISE EXCEPTION 'Expected 5 enums, got %', enum_count;
  END IF;
  IF table_count < 6 THEN
    RAISE EXCEPTION 'Expected 6 tables, got %', table_count;
  END IF;
  IF fn_count < 8 THEN
    RAISE EXCEPTION 'Expected 8 functions, got %', fn_count;
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- IMPORTANT NEXT STEPS (manual, in Supabase Dashboard)
-- =============================================================================
-- 1. Go to Authentication → Hooks
-- 2. Find "Custom Access Token Hook"
-- 3. Click Enable
-- 4. Schema: public
-- 5. Function: custom_access_token_hook
-- 6. Save
--
-- Until this hook is enabled, the JWT will NOT contain user_role/permissions/school_id.
-- After enabling, all existing sessions must sign out and sign back in to get new claims.
-- =============================================================================
