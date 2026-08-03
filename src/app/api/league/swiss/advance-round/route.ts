// =============================================================================
// POST /api/league/swiss/advance-round
// =============================================================================
// Teacher triggers this after all pairings in the current round are complete.
// Generates the next round's pairings based on updated standings.
//
// Body: { leagueId: string, bracketId: string }
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

  let body: { leagueId?: string; bracketId?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { leagueId, bracketId } = body;
  if (!leagueId || !bracketId) {
    return NextResponse.json({ error: 'leagueId and bracketId are required' }, { status: 400 });
  }

  try {
    const service = new SwissService(supabase);
    const result = await service.advanceRound(leagueId, bracketId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const status = err.message.includes('not yet complete') ? 400 :
                   err.message.includes('All Swiss rounds') ? 409 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
