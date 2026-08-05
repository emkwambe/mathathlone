// =============================================================================
// MathAthlone — POST /api/athlete/unlock-division
// =============================================================================
// Sprint 14 — Teacher-initiated division advancement unlock.
//
// When a student's ELO in their home division crosses the advancement threshold
// (1350), the teacher sees an "Advancement Eligible" badge on the dashboard.
// This endpoint lets the teacher formally unlock the next division for that
// student by creating a fresh athlete_ratings row for the next division
// (starting at 1200 ELO, provisional).
//
// Body:
//   { athlete_id: string, current_division_id: string }
//
// The endpoint:
//   1. Verifies the caller is a teacher or admin.
//   2. Looks up the next division by display_order.
//   3. Checks the student is actually advancement_eligible in the current div.
//   4. Upserts a new athlete_ratings row for the next division (1200 ELO start).
//   5. Returns the new division info.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // ── Auth check ────────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is teacher or admin
    const { data: callerProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile || !['teacher', 'admin'].includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const { athlete_id, current_division_id } = body ?? {};

    if (!athlete_id || !current_division_id) {
      return NextResponse.json(
        { error: 'Missing required fields: athlete_id, current_division_id' },
        { status: 400 }
      );
    }

    // ── Verify the student is actually advancement_eligible ───────────────────
    const { data: currentRating, error: ratingError } = await supabase
      .from('athlete_ratings')
      .select('id, rating, advancement_eligible, divisions:division_id ( id, name, code, display_order )')
      .eq('athlete_id', athlete_id)
      .eq('division_id', current_division_id)
      .maybeSingle();

    if (ratingError || !currentRating) {
      return NextResponse.json(
        { error: 'No rating found for this athlete in the specified division' },
        { status: 404 }
      );
    }

    if (!currentRating.advancement_eligible) {
      return NextResponse.json(
        { error: 'Athlete is not yet advancement_eligible in this division' },
        { status: 422 }
      );
    }

    const currentDivision = currentRating.divisions as any;
    if (!currentDivision) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 });
    }

    // ── Find the next division by display_order ───────────────────────────────
    const { data: nextDivision, error: nextDivError } = await supabase
      .from('divisions')
      .select('id, name, code, grade_min, grade_max, display_order')
      .gt('display_order', currentDivision.display_order)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextDivError || !nextDivision) {
      return NextResponse.json(
        { error: 'No higher division exists — this student is already at the top division' },
        { status: 422 }
      );
    }

    // ── Upsert a fresh athlete_ratings row for the next division ──────────────
    // Starting ELO is 1200 (standard starting rating), provisional = true.
    // We use upsert so if the teacher accidentally clicks twice, it's idempotent.
    const { data: newRating, error: upsertError } = await supabase
      .from('athlete_ratings')
      .upsert(
        {
          athlete_id,
          division_id: nextDivision.id,
          rating: 1200.00,
          rating_deviation: 350.00,
          volatility: 0.060000,
          games_played: 0,
          peak_rating: 1200.00,
          floor_rating: 800.00,
          is_provisional: true,
          advancement_eligible: false,
        },
        {
          onConflict: 'athlete_id,division_id',
          ignoreDuplicates: true, // don't overwrite if they already have a rating there
        }
      )
      .select()
      .maybeSingle();

    if (upsertError) {
      console.error('[unlock-division] upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      unlocked_division: {
        id: nextDivision.id,
        name: nextDivision.name,
        code: nextDivision.code,
        grade_min: nextDivision.grade_min,
        grade_max: nextDivision.grade_max,
      },
      message: `${nextDivision.name} division unlocked for athlete.`,
    });
  } catch (err: any) {
    console.error('[unlock-division] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
