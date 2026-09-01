import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; athleteId: string }> };

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id: classId, athleteId } = await context.params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });

  const { data: canManage, error: authorizationError } = await supabase.rpc('can_manage_class', { p_class_id: classId });
  if (authorizationError) {
    return NextResponse.json({ error: 'Class authorization is not configured. Confirm migration 048 has run.' }, { status: 500 });
  }
  if (!canManage) return NextResponse.json({ error: 'You are not allowed to reset a PIN for this class.' }, { status: 403 });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server administration is not configured.' }, { status: 500 });
  }

  const { data: enrollment, error: enrollmentError } = await admin
    .from('class_enrollments')
    .select('users:athlete_id(id, display_name, managed, managed_username, is_active)')
    .eq('class_id', classId)
    .eq('athlete_id', athleteId)
    .eq('status', 'active')
    .maybeSingle();

  const athlete: any = enrollment?.users;
  if (enrollmentError || !athlete) {
    return NextResponse.json({ error: 'This Mathlete is not actively enrolled in this class.' }, { status: 404 });
  }
  if (!athlete.managed || !athlete.managed_username) {
    return NextResponse.json({ error: 'Only teacher-managed Mathlete accounts can receive a classroom PIN reset.' }, { status: 400 });
  }
  if (athlete.is_active === false) {
    return NextResponse.json({ error: 'This Mathlete account is inactive.' }, { status: 409 });
  }

  const pin = randomPin();
  const { error: resetError } = await admin.auth.admin.updateUserById(athleteId, {
    password: pin,
    user_metadata: {
      display_name: athlete.display_name,
      managed: true,
      managed_username: athlete.managed_username,
      role: 'athlete',
    },
  });
  if (resetError) return NextResponse.json({ error: resetError.message }, { status: 500 });

  return NextResponse.json({
    athlete_id: athleteId,
    display_name: athlete.display_name,
    username: athlete.managed_username,
    pin,
    message: 'A new temporary PIN was created. Give it directly to this student and do not store it in a shared document.',
  });
}
