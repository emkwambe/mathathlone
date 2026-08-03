// =============================================================================
// POST /api/league/swiss/record-result
// =============================================================================
// Records the result of a Swiss pairing after a heat completes.
// Called by the heat-complete webhook or manually by a teacher.
//
// Body: { pairingId, winnerId, player1Cta, player2Cta, heatId }
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

  let body: {
    pairingId?: string;
    winnerId?: string;
    player1Cta?: number;
    player2Cta?: number;
    heatId?: string;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const { pairingId, winnerId, player1Cta, player2Cta, heatId } = body;
  if (!pairingId || !winnerId || player1Cta == null || player2Cta == null || !heatId) {
    return NextResponse.json(
      { error: 'pairingId, winnerId, player1Cta, player2Cta, and heatId are all required' },
      { status: 400 }
    );
  }

  try {
    const service = new SwissService(supabase);
    await service.recordResult(pairingId, winnerId, player1Cta, player2Cta, heatId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    const status = err.message.includes('already completed') ? 409 :
                   err.message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
