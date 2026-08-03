// =============================================================================
// POST /api/league/bracket/generate
// =============================================================================
// Teacher-triggered endpoint to generate a bracket for a league.
// Seeds participants from current league_standings ordered by rank.
//
// Body: { leagueId: string, format: 'single_elim' | 'double_elim', name?: string }
// Auth: teacher (must be a member of the league's school) or platform_admin.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { LeagueEngineService } from '@/lib/league-engine';

const VALID_FORMATS = ['single_elim', 'double_elim'] as const;
type BracketFormat = (typeof VALID_FORMATS)[number];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['teacher', 'school_admin', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden - teachers only' }, { status: 403 });
  }

  let body: { leagueId?: string; format?: string; name?: string; splitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leagueId, format, name, splitId } = body;

  if (!leagueId) {
    return NextResponse.json({ error: 'leagueId is required' }, { status: 400 });
  }
  if (!format || !VALID_FORMATS.includes(format as BracketFormat)) {
    return NextResponse.json(
      { error: `format must be one of: ${VALID_FORMATS.join(', ')}` },
      { status: 400 }
    );
  }

  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('id, name, level')
    .eq('id', leagueId)
    .maybeSingle();

  if (leagueErr || !league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }

  const { data: standings, error: standErr } = await supabase
    .from('league_standings')
    .select('athlete_id, rank')
    .eq('league_id', leagueId)
    .order('rank', { ascending: true });

  if (standErr || !standings || standings.length < 2) {
    return NextResponse.json(
      { error: 'Need at least 2 participants with standings to generate a bracket' },
      { status: 422 }
    );
  }

  const participants = standings.map((s) => ({
    id: s.athlete_id as string,
    seed: s.rank as number,
  }));

  const bracketName = name?.trim() || `${league.name} - Playoffs`;

  try {
    const engine = new LeagueEngineService(supabase as any);
    const bracketId = await engine.createBracket(
      leagueId,
      splitId ?? null as any,
      bracketName,
      format as BracketFormat,
      participants
    );
    return NextResponse.json({ bracketId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/league/bracket/generate] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
