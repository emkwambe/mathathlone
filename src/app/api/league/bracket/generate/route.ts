// =============================================================================
// POST /api/league/bracket/generate
// =============================================================================
// Generates a league bracket from current standings. Organization authority is
// decided by the persisted league scope via can_manage_league(), never by a
// browser-supplied school or district value.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { LeagueEngineService } from '@/lib/league-engine';

export const dynamic = 'force-dynamic';

const VALID_FORMATS = ['single_elim', 'double_elim'] as const;
type BracketFormat = (typeof VALID_FORMATS)[number];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['teacher', 'school_admin', 'district_admin', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — authorized staff only.' }, { status: 403 });
  }

  let body: { leagueId?: string; format?: string; name?: string; splitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { leagueId, format, name, splitId } = body;
  if (!leagueId) return NextResponse.json({ error: 'leagueId is required.' }, { status: 400 });
  if (!format || !VALID_FORMATS.includes(format as BracketFormat)) {
    return NextResponse.json({ error: `format must be one of: ${VALID_FORMATS.join(', ')}.` }, { status: 400 });
  }

  const { data: mayManage, error: authorizationError } = await supabase
    .rpc('can_manage_league', { p_league_id: leagueId });
  if (authorizationError) {
    console.error('[api/league/bracket/generate] authorization error:', authorizationError);
    return NextResponse.json({ error: 'Unable to verify league authority. Ensure Sprint 16B migration 047 has been run.' }, { status: 500 });
  }
  if (!mayManage) return NextResponse.json({ error: 'Forbidden — you are not authorized to manage this league.' }, { status: 403 });

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, level')
    .eq('id', leagueId)
    .maybeSingle();
  if (leagueError || !league) return NextResponse.json({ error: 'League not found.' }, { status: 404 });

  const { data: standings, error: standingsError } = await supabase
    .from('league_standings')
    .select('athlete_id, rank')
    .eq('league_id', leagueId)
    .order('rank', { ascending: true });
  if (standingsError || !standings || standings.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 participants with standings to generate a bracket.' }, { status: 422 });
  }

  const participants = standings.map((standing) => ({ id: standing.athlete_id as string, seed: standing.rank as number }));
  const bracketName = name?.trim() || `${league.name} - Playoffs`;

  try {
    const engine = new LeagueEngineService(supabase as any);
    const bracketId = await engine.createBracket(leagueId, splitId ?? null as any, bracketName, format as BracketFormat, participants);
    return NextResponse.json({ bracketId }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/league/bracket/generate] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
