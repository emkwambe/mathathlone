// =============================================================================
// /api/heat/[heatId]/init — POST
// =============================================================================
// Called immediately after createHeat() succeeds. Forwards the heatId and
// Supabase URL to the Cloudflare HeatRoom Durable Object so it can pre-load
// the heat questions before the first participant connects.
//
// This is a server-side route — it uses the HEAT_ROOM_SECRET env var which
// must never be exposed to the client.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { initHeatRoom } from '@/lib/competition/heat-realtime-cf';

export async function POST(
  request: NextRequest,
  { params }: { params: { heatId: string } }
): Promise<NextResponse> {
  const { heatId } = params;

  // Verify the caller is authenticated
  const supabase = createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the heat belongs to this user (teacher/admin only)
  const { data: heat, error: heatError } = await supabase
    .from('heats')
    .select('id, created_by, status')
    .eq('id', heatId)
    .single();

  if (heatError || !heat) {
    return NextResponse.json({ error: 'Heat not found' }, { status: 404 });
  }

  if ((heat as { created_by: string }).created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL not configured' }, { status: 500 });
  }

  try {
    await initHeatRoom(heatId, supabaseUrl);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/heat/init] HeatRoom init failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
