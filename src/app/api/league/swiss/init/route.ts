// =============================================================================
// POST /api/league/swiss/init
// =============================================================================
// Teacher triggers this to initialise a Swiss bracket for a league.
// Creates the brackets row, generates Round 1 pairings, and returns the
// bracketId and first roundId.
//
// Body: { leagueId: string, name?: string, splitId?: string }
// Auth: teacher or platform_admin
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { SwissService } from '@/lib/competition/swiss-service';

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

  if (!profile || !['teacher', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
  }

  let body: { leagueId?: string; name?: string; splitId?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { leagueId, name, splitId } = body;
  if (!leagueId) {
    return NextResponse.json({ error: 'leagueId is required' }, { status: 400 });
  }

  // Verify league exists and is Swiss format
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, bracket_format, status')
    .eq('id', leagueId)
    .maybeSingle();

  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }

  if (league.bracket_format && league.bracket_format !== 'swiss') {
    return NextResponse.json(
      { error: `This league uses ${league.bracket_format} format, not Swiss.` },
      { status: 400 }
    );
  }

  // Check no bracket already exists
  const { data: existing } = await supabase
    .from('brackets')
    .select('id')
    .eq('league_id', leagueId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'A bracket already exists for this league.', bracketId: existing.id },
      { status: 409 }
    );
  }

  try {
    const service = new SwissService(supabase);
    const result = await service.initBracket(
      leagueId,
      splitId ?? null,
      name ?? `${league.name} — Swiss`
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
