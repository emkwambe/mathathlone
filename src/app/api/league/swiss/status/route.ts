// =============================================================================
// GET /api/league/swiss/status?leagueId=...&bracketId=...
// =============================================================================
// Returns the current Swiss round status, pairings, and overall progress.
// Used by the league dashboard Swiss tab to render the round view.
//
// Query params: leagueId, bracketId
// Auth: any authenticated user
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { SwissService } from '@/lib/competition/swiss-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const bracketId = searchParams.get('bracketId');

  if (!leagueId || !bracketId) {
    return NextResponse.json({ error: 'leagueId and bracketId are required' }, { status: 400 });
  }

  try {
    const service = new SwissService(supabase);
    const status = await service.getRoundStatus(leagueId, bracketId);
    return NextResponse.json(status, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
