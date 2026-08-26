// =============================================================================
// POST /api/league/bracket/record-result
// =============================================================================
// Records a single/double-elimination bracket result through the atomic
// record_bracket_match_result database command introduced in migration 046.
//
// The browser supplies only the match, the selected winner, both CTA scores,
// and an optional linked heat. The database derives the actual league and loser,
// verifies teacher ownership, locks the match and cohort-scoped rating rows, then
// applies result, standings, head-to-head, ELO, and bracket advancement together.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

interface RecordBracketResultBody {
  matchId?: unknown;
  winnerId?: unknown;
  player1Cta?: unknown;
  player2Cta?: unknown;
  heatId?: unknown;
}

function invalid(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RecordBracketResultBody;
  try {
    body = await request.json();
  } catch {
    return invalid('Invalid JSON body');
  }

  const { matchId, winnerId, player1Cta, player2Cta, heatId } = body;
  if (typeof matchId !== 'string' || typeof winnerId !== 'string') {
    return invalid('matchId and winnerId are required');
  }
  if (typeof player1Cta !== 'number' || !Number.isFinite(player1Cta) || player1Cta < 0) {
    return invalid('player1Cta must be a valid number greater than or equal to zero');
  }
  if (typeof player2Cta !== 'number' || !Number.isFinite(player2Cta) || player2Cta < 0) {
    return invalid('player2Cta must be a valid number greater than or equal to zero');
  }
  if (heatId !== undefined && heatId !== null && typeof heatId !== 'string') {
    return invalid('heatId must be a string when provided');
  }

  const { data, error } = await supabase.rpc('record_bracket_match_result', {
    p_match_id: matchId,
    p_winner_id: winnerId,
    p_player1_cta: player1Cta,
    p_player2_cta: player2Cta,
    p_heat_id: typeof heatId === 'string' ? heatId : null,
  });

  if (error) {
    const status =
      error.code === '28000' ? 401 :
      error.code === '42501' ? 403 :
      error.code === 'P0002' ? 404 :
      error.code === '22023' ? 400 :
      error.code === 'P0001' ? 409 :
      500;

    if (status === 500) {
      console.error('[api/league/bracket/record-result] unexpected RPC error:', error);
    }

    return NextResponse.json(
      { error: error.message || 'Unable to record the bracket result.' },
      { status }
    );
  }

  return NextResponse.json(data ?? { success: true }, { status: 200 });
}
