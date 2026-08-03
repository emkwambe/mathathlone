// =============================================================================
// /api/league/create — POST
// =============================================================================
// Creates a new league row. Called from the /league/create client form.
//
// Body:
//   name             string   required
//   level            string   required — classroom|school|district|regional|state|national
//   region           string   optional
//   format           string   optional — bracket format
//   league_type      string   optional — showdown|campaign|season
//   content_scope    object   optional — { type, course_code, course_name, unit_code, unit_name }
//   max_participants number   optional — open integer; omitted for district+
//
// The route:
//   1. Authenticates the caller (must be a teacher or platform_admin)
//   2. Looks up the active season (or null if none exists yet)
//   3. Inserts into leagues
//   4. Returns { leagueId }
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

const VALID_LEVELS = [
  'classroom', 'school', 'district', 'regional', 'state', 'national',
] as const;

const VALID_FORMATS = [
  'single_elimination', 'double_elimination', 'round_robin', 'swiss',
] as const;

const VALID_LEAGUE_TYPES = ['showdown', 'campaign', 'season'] as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only teachers and platform admins may create leagues
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['teacher', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    name,
    level,
    region,
    format,
    league_type,
    content_scope,
    max_participants,
  } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return NextResponse.json(
      { error: 'League name must be at least 3 characters.' },
      { status: 400 }
    );
  }

  if (!VALID_LEVELS.includes(level)) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` },
      { status: 400 }
    );
  }

  if (format && !VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `Invalid bracket format. Must be one of: ${VALID_FORMATS.join(', ')}` },
      { status: 400 }
    );
  }

  if (league_type && !VALID_LEAGUE_TYPES.includes(league_type)) {
    return NextResponse.json(
      { error: `Invalid league type. Must be one of: ${VALID_LEAGUE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (max_participants !== undefined && max_participants !== null) {
    const n = Number(max_participants);
    if (!Number.isInteger(n) || n < 4 || n > 512) {
      return NextResponse.json(
        { error: 'max_participants must be an integer between 4 and 512.' },
        { status: 400 }
      );
    }
  }

  // ── Look up active season (optional) ──────────────────────────────────────
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  // ── Insert league ─────────────────────────────────────────────────────────
  const { data: league, error: insertErr } = await supabase
    .from('leagues')
    .insert({
      name:             name.trim(),
      level,
      region:           region?.trim() || null,
      season_id:        activeSeason?.id ?? null,
      // Legacy column — keep in sync with max_participants
      max_schools:      max_participants ?? 8,
      // New Sprint 5b columns
      bracket_format:   format ?? 'single_elimination',
      league_type:      league_type ?? 'showdown',
      content_scope:    content_scope ?? null,
      max_participants: max_participants ?? null,
      created_by:       user.id,
    })
    .select('id')
    .single();

  if (insertErr || !league) {
    console.error('[api/league/create] insert error:', insertErr);
    return NextResponse.json(
      { error: insertErr?.message ?? 'Failed to create league.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ leagueId: league.id }, { status: 201 });
}
