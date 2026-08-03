// =============================================================================
// POST /api/league/split/close
// =============================================================================
// Closes the active split for a league:
//   1. Awards championship points to the top finishers
//   2. Marks the split as completed
//   3. Sets league status to 'completed' if no further splits remain
//
// Body: { leagueId: string, splitId: string }
// Auth: teacher (league creator) or platform_admin.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { LeagueEngineService } from '@/lib/league-engine';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  // ── Auth ──────────────────────────────────────────────────────────────────
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { leagueId?: string; splitId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leagueId, splitId } = body;
  if (!leagueId || !splitId) {
    return NextResponse.json(
      { error: 'leagueId and splitId are required' },
      { status: 400 }
    );
  }

  // ── Verify league + split ─────────────────────────────────────────────────
  const { data: league } = await supabase
    .from('leagues')
    .select('id, created_by, season_id')
    .eq('id', leagueId)
    .maybeSingle();

  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }

  const isAdmin = profile.role === 'platform_admin';
  if (!isAdmin && league.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden — not your league' }, { status: 403 });
  }

  const { data: split } = await supabase
    .from('splits')
    .select('id, status, season_id')
    .eq('id', splitId)
    .eq('season_id', league.season_id)
    .maybeSingle();

  if (!split) {
    return NextResponse.json({ error: 'Split not found for this league season' }, { status: 404 });
  }

  if (split.status === 'completed') {
    return NextResponse.json({ error: 'Split is already completed' }, { status: 409 });
  }

  // ── Award championship points ─────────────────────────────────────────────
  try {
    const engine = new LeagueEngineService(supabase as any);
    await engine.awardSplitPoints(leagueId, league.season_id, splitId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/league/split/close] awardSplitPoints error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // ── Mark split completed ──────────────────────────────────────────────────
  await supabase
    .from('splits')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', splitId);

  return NextResponse.json({ ok: true });
}
