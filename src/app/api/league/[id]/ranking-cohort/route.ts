import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: leagueId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { rankingDivisionCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (typeof body.rankingDivisionCode !== 'string' || !body.rankingDivisionCode.trim()) {
    return NextResponse.json({ error: 'rankingDivisionCode is required.' }, { status: 400 });
  }

  const { data: mayManage, error: authorizationError } = await supabase
    .rpc('can_manage_league', { p_league_id: leagueId });
  if (authorizationError) {
    console.error('[ranking-cohort] authorization error:', authorizationError);
    return NextResponse.json({ error: 'Unable to verify league authority. Ensure Sprint 16B migration 047 has been run.' }, { status: 500 });
  }
  if (!mayManage) return NextResponse.json({ error: 'Forbidden — you are not authorized to manage this league.' }, { status: 403 });

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .maybeSingle();
  if (leagueError || !league) return NextResponse.json({ error: 'League not found.' }, { status: 404 });

  const { data: brackets } = await supabase
    .from('brackets')
    .select('id')
    .eq('league_id', league.id);
  const bracketIds = (brackets ?? []).map((bracket) => bracket.id);
  if (bracketIds.length > 0) {
    const { data: completedMatch } = await supabase
      .from('bracket_matches')
      .select('id')
      .in('bracket_id', bracketIds)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();
    if (completedMatch) {
      return NextResponse.json({ error: 'The ranking cohort cannot change after an elimination result has been recorded.' }, { status: 409 });
    }
  }

  const { data: division, error: divisionError } = await supabase
    .from('divisions')
    .select('id, code')
    .eq('code', body.rankingDivisionCode.trim().toUpperCase())
    .maybeSingle();
  if (divisionError || !division) return NextResponse.json({ error: 'The selected ranking cohort is not available.' }, { status: 400 });

  const { error: updateError } = await supabase
    .from('leagues')
    .update({ ranking_division_id: division.id, division_id: division.id })
    .eq('id', league.id);
  if (updateError) {
    console.error('[ranking-cohort] update error:', updateError);
    return NextResponse.json({ error: 'Unable to save the ranking cohort.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, rankingDivisionCode: division.code }, { status: 200 });
}
