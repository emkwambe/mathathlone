// =============================================================================
// MathAthlone — /api/stats
// =============================================================================
// Returns live platform statistics for the landing page.
// Refreshed at the client polling interval. During the controlled pilot,
// do not serve a stale shared value after classroom activity changes.
//
// Response shape:
//   { activeMathletes: number, competingNow: number, heatsToday: number }
//
// © Mpingo Systems LLC
// =============================================================================

import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    // Count mathletes who have been active in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activeMathletes } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'athlete')
      .gte('last_login_at', thirtyDaysAgo);

    // Count mathletes currently in an active heat (status = 'competing')
    const { count: competingNow } = await supabase
      .from('heat_participations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'competing');

    // Count heats completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: heatsToday } = await supabase
      .from('heats')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')
      .gte('created_at', todayStart.toISOString());

    return NextResponse.json({
      activeMathletes: activeMathletes ?? 0,
      competingNow: competingNow ?? 0,
      heatsToday: heatsToday ?? 0,
    });
  } catch (error) {
    console.error('[/api/stats] Error fetching stats:', error);
    // Return safe fallback values rather than a 500 error
    return NextResponse.json(
      { activeMathletes: 0, competingNow: 0, heatsToday: 0 },
      { status: 200 }
    );
  }
}
