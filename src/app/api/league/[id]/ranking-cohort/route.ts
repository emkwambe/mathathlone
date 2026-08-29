import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: leagueId } = await params;
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

  let body: { rankingDivisionCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.rankingDivisionCode !== 'string' || !body.rankingDivisionCode.trim()) {
    return NextResponse.json({ error: 'rankingDivisionCode is required' }, { status: 400 });
  }

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by')
    .eq('id', leagueId)
    .maybeSingle();

  if (leagueError || !league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }

  if (profile.role !== 'platform_admin' && league.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden — only this league\'s creator may set its ranking cohort' }, { status: 403 });
  }

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
      return NextResponse.json(
        { error: 'The ranking cohort cannot change after an elimination result has been recorded.' },
        { status: 409 }
      );
    }
  }

  const { data: division, error: divisionError } = await supabase
    .from('divisions')
    .select('id, code')
    .eq('code', body.rankingDivisionCode.trim().toUpperCase())
    .maybeSingle();

  if (divisionError || !division) {
    return NextResponse.json({ error: 'The selected ranking cohort is not available.' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('leagues')
    .update({ ranking_division_id: division.id, division_id: division.id })
    .eq('id', league.id);

  if (updateError) {
    console.error('[api/league/[id]/ranking-cohort] update error:', updateError);
    return NextResponse.json({ error: 'Unable to save the ranking cohort.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, rankingDivisionCode: division.code }, { status: 200 });
}
