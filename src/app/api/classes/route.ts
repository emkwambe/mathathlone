import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type StaffRole = 'teacher' | 'school_admin' | 'district_admin' | 'platform_admin';

function isStaffRole(role: string | null | undefined): role is StaffRole {
  return ['teacher', 'school_admin', 'district_admin', 'platform_admin'].includes(role ?? '');
}

async function getStaffContext() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in is required.', status: 401 as const };

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, role, school_id, display_name, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile || !isStaffRole(profile.role) || profile.is_active === false) {
    return { error: 'Only active education staff can manage classes.', status: 403 as const };
  }
  if (!profile.school_id && profile.role !== 'platform_admin') {
    return { error: 'Your staff account is not assigned to a school yet. Ask the pilot administrator to assign your school.', status: 409 as const };
  }

  return { supabase, user, profile };
}

function makeClassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

async function createUniqueClassCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let attempts = 0; attempts < 12; attempts += 1) {
    const candidate = makeClassCode();
    const { data } = await admin.from('classes').select('id').eq('join_code', candidate).maybeSingle();
    if (!data) return candidate;
  }
  throw new Error('Could not generate a unique class code. Please try again.');
}

/**
 * Lists the signed-in teacher's classes. School/district/platform staff may
 * inspect classes in their assigned organization after migration 048 is applied.
 */
export async function GET() {
  const context = await getStaffContext();
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server administration is not configured.' }, { status: 500 });
  }

  let query = admin
    .from('classes')
    .select('id, name, grade_level, join_code, school_id, teacher_id, is_active, created_at, class_enrollments(count)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (context.profile.role === 'teacher') query = query.eq('teacher_id', context.user.id);
  else if (context.profile.role !== 'platform_admin' && context.profile.school_id) query = query.eq('school_id', context.profile.school_id);

  const { data: classes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    classes: (classes ?? []).map((classroom: any) => ({
      ...classroom,
      roster_count: classroom.class_enrollments?.[0]?.count ?? 0,
      class_enrollments: undefined,
    })),
  });
}

/**
 * Creates one teacher-owned classroom inside the teacher's assigned school.
 * Coordinators can use the platform provisioning flow to assign staff first;
 * individual classroom ownership stays explicit for pilot accountability.
 */
export async function POST(request: NextRequest) {
  const context = await getStaffContext();
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = await request.json().catch(() => null) as { name?: unknown; grade_level?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const gradeLevel = typeof body?.grade_level === 'number' ? body.grade_level : Number(body?.grade_level);

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Class name must be between 2 and 100 characters.' }, { status: 400 });
  }
  if (!Number.isInteger(gradeLevel) || gradeLevel < 3 || gradeLevel > 12) {
    return NextResponse.json({ error: 'Choose a grade from 3 through 12.' }, { status: 400 });
  }
  if (context.profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Classes are created by the assigned teacher. School and district coordinators can review scoped classes after they are created.' }, { status: 403 });
  }
  if (!context.profile.school_id) {
    return NextResponse.json({ error: 'Your teacher account is not assigned to a school yet. Ask the pilot administrator to assign your school.' }, { status: 409 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server administration is not configured.' }, { status: 500 });
  }

  try {
    const joinCode = await createUniqueClassCode(admin);
    const { data: classroom, error } = await admin
      .from('classes')
      .insert({
        school_id: context.profile.school_id,
        teacher_id: context.user.id,
        name,
        grade_level: gradeLevel,
        join_code: joinCode,
        is_active: true,
      })
      .select('id, name, grade_level, join_code, school_id, teacher_id, is_active, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Could not create the class.' }, { status: 500 });
  }
}
