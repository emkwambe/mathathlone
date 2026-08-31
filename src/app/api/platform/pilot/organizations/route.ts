// =============================================================================
// /api/platform/pilot/organizations
// =============================================================================
// Narrow, platform-admin-only setup API for the three-school pilot.
// It provisions organization records and scopes EXISTING staff accounts. It does
// not create student accounts, issue credentials, or expose service credentials.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['teacher', 'school_admin', 'district_admin'] as const;
type StaffRole = (typeof STAFF_ROLES)[number];
type PlatformActor =
  | { user: { id: string }; profile: { id: string; role: string; display_name: string | null } }
  | { error: NextResponse };

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing server administration configuration. Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

async function requirePlatformAdmin(): Promise<PlatformActor> {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  // Read the profile directly rather than depending on a token claim that may be
  // stale immediately after a role assignment.
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'platform_admin') {
    return { error: NextResponse.json({ error: 'Forbidden — platform administrator access required.' }, { status: 403 }) };
  }

  return { user, profile };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(): Promise<NextResponse> {
  const actor = await requirePlatformAdmin();
  if ('error' in actor) return actor.error;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to initialize administration service.' }, { status: 500 });
  }

  const [districtsResult, schoolsResult, staffResult] = await Promise.all([
    admin
      .from('districts')
      .select('id, name, state, is_active, created_at')
      .order('name', { ascending: true }),
    admin
      .from('schools')
      .select('id, name, state, district_id, verified, is_active, created_at, districts:district_id ( id, name )')
      .order('name', { ascending: true }),
    admin
      .from('users')
      .select('id, email, display_name, role, school_id, is_active, schools:school_id ( id, name, district_id )')
      .in('role', [...STAFF_ROLES, 'platform_admin'])
      .order('display_name', { ascending: true }),
  ]);

  const firstError = districtsResult.error || schoolsResult.error || staffResult.error;
  if (firstError) {
    console.error('[pilot organizations] GET error:', firstError);
    return NextResponse.json({ error: 'Unable to load pilot organization data.' }, { status: 500 });
  }

  return NextResponse.json({
    districts: districtsResult.data ?? [],
    schools: schoolsResult.data ?? [],
    staff: staffResult.data ?? [],
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await requirePlatformAdmin();
  if ('error' in actor) return actor.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON body.');
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to initialize administration service.' }, { status: 500 });
  }

  const action = body.action;

  if (action === 'create_district') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim().toUpperCase() : '';
    if (name.length < 3 || state.length !== 2) {
      return badRequest('District name must be at least three characters and state must be a two-letter code.');
    }

    const { data, error } = await admin
      .from('districts')
      .insert({ name, state, country_code: 'US', is_active: true })
      .select('id, name, state, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to create district.' }, { status: 500 });
    }
    return NextResponse.json({ district: data }, { status: 201 });
  }

  if (action === 'create_school') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim().toUpperCase() : '';
    const districtId = body.district_id;
    if (name.length < 3 || state.length !== 2 || !isUuid(districtId)) {
      return badRequest('School name, a two-letter state code, and a valid pilot district are required.');
    }

    const { data: district } = await admin
      .from('districts')
      .select('id, is_active')
      .eq('id', districtId)
      .maybeSingle();
    if (!district?.is_active) return badRequest('Select an active district.');

    const { data, error } = await admin
      .from('schools')
      .insert({ name, state, district_id: districtId, country_code: 'US', verified: true })
      .select('id, name, state, district_id, verified, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to create school.' }, { status: 500 });
    }
    return NextResponse.json({ school: data }, { status: 201 });
  }

  if (action === 'assign_staff') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role;
    const schoolId = body.school_id;
    const districtId = body.district_id;

    if (!email || !STAFF_ROLES.includes(role as StaffRole)) {
      return badRequest('An existing staff email and a valid pilot role are required.');
    }
    if ((role === 'teacher' || role === 'school_admin') && !isUuid(schoolId)) {
      return badRequest('Teachers and school coordinators must be assigned to one pilot school.');
    }
    if (role === 'district_admin' && !isUuid(districtId)) {
      return badRequest('District coordinators must be assigned to one pilot district.');
    }

    const { data: target, error: targetError } = await admin
      .from('users')
      .select('id, email, display_name, school_id, role')
      .eq('email', email)
      .maybeSingle();
    if (targetError || !target) {
      return NextResponse.json({ error: 'No existing user account matches that email. Ask the staff member to complete registration first.' }, { status: 404 });
    }

    // District coordinators may be district-scoped without a home school. For
    // school-scoped roles, retain the account's current school only when a new
    // school was not supplied.
    let resolvedSchoolId: string | null = isUuid(schoolId)
      ? schoolId
      : (role === 'district_admin' ? null : (target.school_id ?? null));
    let resolvedDistrictId: string | null = isUuid(districtId) ? districtId : null;

    if (resolvedSchoolId) {
      const { data: school } = await admin
        .from('schools')
        .select('id, district_id')
        .eq('id', resolvedSchoolId)
        .maybeSingle();
      if (!school) return badRequest('Selected school does not exist.');
      if (role === 'district_admin' && resolvedDistrictId && school.district_id !== resolvedDistrictId) {
        return badRequest('The selected school must belong to the assigned pilot district.');
      }
      if (!resolvedDistrictId) resolvedDistrictId = school.district_id ?? null;
    }

    if (role === 'district_admin') {
      const { data: district } = await admin
        .from('districts')
        .select('id, is_active')
        .eq('id', resolvedDistrictId!)
        .maybeSingle();
      if (!district?.is_active) return badRequest('Selected district does not exist or is inactive.');
    }

    const scopeType = role === 'district_admin' ? 'district' : 'school';
    const scopeId = role === 'district_admin' ? resolvedDistrictId : resolvedSchoolId;
    if (!scopeId) return badRequest('The staff assignment needs an organization scope.');

    const { error: profileError } = await admin
      .from('users')
      .update({ role, school_id: resolvedSchoolId })
      .eq('id', target.id);
    if (profileError) {
      return NextResponse.json({ error: profileError.message || 'Unable to update staff organization assignment.' }, { status: 500 });
    }

    const { error: roleError } = await admin
      .from('user_roles')
      .upsert({
        user_id: target.id,
        role,
        scope_type: scopeType,
        scope_id: scopeId,
        granted_by: actor.user.id,
        granted_at: new Date().toISOString(),
        is_active: true,
        notes: 'Sprint 16B three-school pilot assignment',
      }, { onConflict: 'user_id,role,scope_type,scope_id' });
    if (roleError) {
      return NextResponse.json({ error: roleError.message || 'Profile was assigned but scoped role creation failed. Contact the platform administrator.' }, { status: 500 });
    }

    // Middleware has a legacy metadata fallback. Update it as a compatibility
    // bridge, while public.users and user_roles remain the authoritative records.
    const { data: authLookup } = await admin.auth.admin.getUserById(target.id);
    const { error: metadataError } = await admin.auth.admin.updateUserById(target.id, {
      user_metadata: { ...(authLookup.user?.user_metadata ?? {}), role },
    });

    return NextResponse.json({
      staff: { id: target.id, email: target.email, display_name: target.display_name, role, school_id: resolvedSchoolId, district_id: resolvedDistrictId },
      relogin_required: true,
      warning: metadataError
        ? 'Role assignment succeeded, but the compatibility metadata update did not complete. The staff member must sign out and back in before accessing the new dashboard.'
        : 'Staff assignment saved. The staff member must sign out and back in before using the new role.',
    });
  }

  return badRequest('Unsupported pilot administration action.');
}
