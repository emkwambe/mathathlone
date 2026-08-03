// =============================================================================
// POST /api/league/heat-complete
// =============================================================================
// Called after a heat ends (by endHeat() in heat-service.ts) when the heat
// has a league_id set. Runs the full league engine pipeline:
//   1. Reads heat_participations for the heat
//   2. Calls LeagueEngineService.processHeatResult() → ELO update + standings
//
// Auth: must be the heat creator (teacher) or a platform_admin.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { LeagueEngineService } from '@/lib/league-engine';
import type { HeatResult } from '@/lib/league-engine';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { heatId?: string; leagueId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { heatId, leagueId } = body;
  if (!heatId || !leagueId) {
    return NextResponse.json(
      { error: 'heatId and leagueId are required' },
      { status: 400 }
    );
  }

  // ── Verify heat ownership ─────────────────────────────────────────────────
  const { data: heat, error: heatErr } = await supabase
    .from('heats')
    .select('id, created_by, status, league_id')
    .eq('id', heatId)
    .maybeSingle();

  if (heatErr || !heat) {
    return NextResponse.json({ error: 'Heat not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'platform_admin';
  if (!isAdmin && heat.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (heat.status !== 'complete') {
    return NextResponse.json(
      { error: `Heat is not complete (status: ${heat.status})` },
      { status: 409 }
    );
  }

  // ── Fetch heat participations ─────────────────────────────────────────────
  const { data: participations, error: partErr } = await supabase
    .from('heat_participations')
    .select(
      'athlete_id, rank_in_heat, cta_score, questions_correct, questions_attempted, total_time_ms'
    )
    .eq('heat_id', heatId)
    .eq('status', 'finished')
    .order('rank_in_heat', { ascending: true });

  if (partErr || !participations || participations.length === 0) {
    return NextResponse.json(
      { error: 'No finished participations found for this heat' },
      { status: 422 }
    );
  }

  // ── Build HeatResult array ────────────────────────────────────────────────
  const totalParticipants = participations.length;
  const results: HeatResult[] = participations.map((p) => {
    const correct = (p.questions_correct as number) ?? 0;
    const attempted = (p.questions_attempted as number) ?? 1;
    const time_ms = (p.total_time_ms as number) ?? 0;
    return {
      athlete_id: p.athlete_id as string,
      rank_in_heat: (p.rank_in_heat as number) ?? totalParticipants,
      total_participants: totalParticipants,
      cta_score: (p.cta_score as number) ?? 0,
      questions_correct: correct,
      questions_attempted: attempted,
      total_time_ms: time_ms,
      accuracy: attempted > 0 ? correct / attempted : 0,
      time_ms,
    };
  });

  // ── Run league engine ─────────────────────────────────────────────────────
  try {
    const engine = new LeagueEngineService(supabase as Parameters<typeof LeagueEngineService.prototype.processHeatResult>[0] extends never ? never : any);
    await engine.processHeatResult(leagueId, heatId, results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/league/heat-complete] engine error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, processedParticipants: totalParticipants });
}
