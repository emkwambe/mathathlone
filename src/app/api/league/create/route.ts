// =============================================================================
// /api/league/create — POST
// =============================================================================
// Creates an organization-scoped league. The browser may choose content and the
// ranking cohort, but organization authority is derived from the authenticated
// staff profile and never trusted from a browser-provided organization ID.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VALID_LEVELS = ['classroom', 'school', 'district', 'regional', 'state', 'national'] as const;
const VALID_FORMATS = ['single_elimination', 'double_elimination', 'round_robin', 'swiss'] as const;
const VALID_LEAGUE_TYPES = ['showdown', 'campaign', 'season'] as const;
type LeagueLevel = (typeof VALID_LEVELS)[number];

function invalid(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function forbidden(error: string) {
  return NextResponse.json({ error }, { status: 403 });
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('role, school_id, schools:school_id ( district_id, is_active )')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['teacher', 'school_admin', 'district_admin', 'platform_admin'].includes(profile.role)) {
    return forbidden('Only authorized school, district, or platform staff may create leagues.');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return invalid('Invalid JSON body.');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const level = body.level as LeagueLevel;
  const region = typeof body.region === 'string' ? body.region.trim() : null;
  const format = body.format;
  const leagueType = body.league_type;
  const contentScope = body.content_scope ?? null;
  const rankingDivisionCode = typeof body.ranking_division_code === 'string' ? body.ranking_division_code.trim().toUpperCase() : '';
  const maxParticipants = body.max_participants;
  const requestedSchoolId = body.school_id;
  const requestedDistrictId = body.district_id;
  const requestedClassId = body.class_id;

  if (name.length < 3) return invalid('League name must be at least three characters.');
  if (!VALID_LEVELS.includes(level)) return invalid(`Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}.`);
  if (format !== undefined && format !== null && !VALID_FORMATS.includes(format as (typeof VALID_FORMATS)[number])) {
    return invalid(`Invalid bracket format. Must be one of: ${VALID_FORMATS.join(', ')}.`);
  }
  if (leagueType !== undefined && leagueType !== null && !VALID_LEAGUE_TYPES.includes(leagueType as (typeof VALID_LEAGUE_TYPES)[number])) {
    return invalid(`Invalid league type. Must be one of: ${VALID_LEAGUE_TYPES.join(', ')}.`);
  }
  if (!rankingDivisionCode) return invalid('Select the grade cohort whose standings and ELO should receive this league\'s results.');
  if (maxParticipants !== undefined && maxParticipants !== null) {
    const count = Number(maxParticipants);
    if (!Number.isInteger(count) || count < 4 || count > 512) return invalid('max_participants must be an integer between 4 and 512.');
  }

  const { data: rankingDivision } = await supabase
    .from('divisions')
    .select('id')
    .eq('code', rankingDivisionCode)
    .maybeSingle();
  if (!rankingDivision) return invalid('The selected ranking cohort is not available. Refresh the page and try again.');

  const profileSchool = profile.schools as unknown as { district_id: string | null; is_active: boolean | null } | null;
  let schoolId: string | null = null;
  let districtId: string | null = null;
  let classId: string | null = null;

  // Normal staff scope is non-negotiable: it comes from public.users and
  // schools, not from the client. Platform administrators may intentionally
  // create an organization-bound pilot league for a selected organization.
  if (profile.role === 'teacher') {
    if (level !== 'classroom') return forbidden('Teachers may create classroom leagues only.');
    if (!profile.school_id || profileSchool?.is_active === false) return forbidden('Your teacher account is not assigned to an active school. Contact the platform administrator.');
    schoolId = profile.school_id;
    districtId = profileSchool?.district_id ?? null;
  } else if (profile.role === 'school_admin') {
    if (!['classroom', 'school'].includes(level)) return forbidden('School coordinators may create classroom or school leagues for their own school only.');
    if (!profile.school_id || profileSchool?.is_active === false) return forbidden('Your account is not assigned to an active school. Contact the platform administrator.');
    schoolId = profile.school_id;
    districtId = profileSchool?.district_id ?? null;
  } else if (profile.role === 'district_admin') {
    if (level !== 'district') return forbidden('District coordinators may create district leagues for their assigned district only.');
    if (!profileSchool?.district_id) return forbidden('Your district coordinator account is not linked to a pilot district.');
    districtId = profileSchool.district_id;
  } else if (level === 'classroom' || level === 'school') {
    if (!isUuid(requestedSchoolId)) return invalid('Platform administrators must select an owning school for classroom or school leagues.');
    const { data: targetSchool } = await supabase
      .from('schools')
      .select('id, district_id, is_active')
      .eq('id', requestedSchoolId)
      .maybeSingle();
    if (!targetSchool || targetSchool.is_active === false) return invalid('Selected school does not exist or is inactive.');
    schoolId = targetSchool.id;
    districtId = targetSchool.district_id ?? null;
  } else if (level === 'district') {
    if (!isUuid(requestedDistrictId)) return invalid('Platform administrators must select an owning district for district leagues.');
    const { data: targetDistrict } = await supabase
      .from('districts')
      .select('id, is_active')
      .eq('id', requestedDistrictId)
      .maybeSingle();
    if (!targetDistrict?.is_active) return invalid('Selected district does not exist or is inactive.');
    districtId = targetDistrict.id;
  }

  if (isUuid(requestedClassId)) {
    if (level !== 'classroom') return invalid('A class can be assigned only to a classroom league.');
    const { data: targetClass } = await supabase
      .from('classes')
      .select('id, school_id, is_active')
      .eq('id', requestedClassId)
      .maybeSingle();
    if (!targetClass || !targetClass.is_active || targetClass.school_id !== schoolId) {
      return forbidden('The selected class must be active and belong to the owning school.');
    }
    classId = targetClass.id;
  }

  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const { data: league, error: insertError } = await supabase
    .from('leagues')
    .insert({
      name,
      level,
      region,
      season_id: activeSeason?.id ?? null,
      max_schools: maxParticipants ?? 8,
      bracket_format: format ?? 'single_elimination',
      league_type: leagueType ?? 'showdown',
      content_scope: contentScope,
      division_id: rankingDivision.id,
      ranking_division_id: rankingDivision.id,
      max_participants: maxParticipants ?? null,
      school_id: schoolId,
      district_id: districtId,
      class_id: classId,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insertError || !league) {
    console.error('[api/league/create] insert error:', insertError);
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create league.' }, { status: 500 });
  }

  return NextResponse.json({ leagueId: league.id, schoolId, districtId, classId }, { status: 201 });
}
