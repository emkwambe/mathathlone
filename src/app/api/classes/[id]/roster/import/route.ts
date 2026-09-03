import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

type ImportedStudent = {
  athlete_id: string;
  display_name: string;
  username: string;
  pin: string;
  already_existed: boolean;
};

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function usernameStem(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14);
  return base || 'mathlete';
}

function normalizeNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const name = value.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 100) continue;
    const key = name.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return names;
}

async function requireClassManager(classId: string) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in is required.', status: 401 as const };

  const { data: allowed, error: authorizationError } = await supabase.rpc('can_manage_class', { p_class_id: classId });
  if (authorizationError) {
    return { error: 'Class authorization is not configured. Confirm migration 048 has run.', status: 500 as const };
  }
  if (!allowed) return { error: 'You are not allowed to manage this class roster.', status: 403 as const };

  return { supabase, user };
}

async function uniqueUsername(admin: ReturnType<typeof createAdminClient>, displayName: string): Promise<string> {
  const stem = usernameStem(displayName);
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? stem : `${stem}${suffix + 1}`;
    const { data, error } = await admin
      .from('users')
      .select('id')
      .ilike('managed_username', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  throw new Error(`Could not create a unique username for ${displayName}.`);
}

/** Creates and enrolls managed Mathlete accounts. Pins are returned only for new accounts. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  const access = await requireClassManager(classId);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json().catch(() => null) as { names?: unknown } | null;
  const names = normalizeNames(body?.names);
  if (names.length === 0) return NextResponse.json({ error: 'Enter at least one student name.' }, { status: 400 });
  if (names.length > 200) return NextResponse.json({ error: 'A roster import is limited to 200 students.' }, { status: 400 });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server administration is not configured.' }, { status: 500 });
  }

  const { data: classroom, error: classError } = await admin
    .from('classes')
    .select('id, name, school_id, grade_level, is_active')
    .eq('id', classId)
    .maybeSingle();
  if (classError || !classroom || !classroom.is_active) {
    return NextResponse.json({ error: 'This class is unavailable.' }, { status: 404 });
  }

  const imported: ImportedStudent[] = [];
  const skipped: Array<{ display_name: string; reason: string }> = [];

  for (const displayName of names) {
    try {
      const { data: existing, error: existingError } = await admin
        .from('users')
        .select('id, display_name, managed_username, school_id')
        .eq('display_name', displayName)
        .eq('school_id', classroom.school_id)
        .eq('role', 'athlete')
        .limit(2);
      if (existingError) throw existingError;

      let athleteId: string;
      let username: string;
      let pin = '****';
      let alreadyExisted = false;

      if ((existing ?? []).length > 1) {
        skipped.push({ display_name: displayName, reason: 'More than one student at this school has this name. Ask the platform administrator to resolve the duplicate first.' });
        continue;
      }

      if (existing?.[0]) {
        athleteId = existing[0].id;
        username = existing[0].managed_username || usernameStem(existing[0].display_name);
        alreadyExisted = true;
      } else {
        username = await uniqueUsername(admin, displayName);
        pin = randomPin();
        const internalEmail = `${username}@roster.mathathlone.internal`;
        const { data: authRecord, error: authError } = await admin.auth.admin.createUser({
          email: internalEmail,
          password: pin,
          email_confirm: true,
          user_metadata: {
            display_name: displayName,
            role: 'athlete',
            managed: true,
            managed_username: username,
            school_id: classroom.school_id,
          },
        });
        if (authError || !authRecord.user) throw authError ?? new Error('Could not create the managed account.');

        athleteId = authRecord.user.id;
        const { error: profileError } = await admin.from('users').upsert({
          id: athleteId,
          email: internalEmail,
          display_name: displayName,
          role: 'athlete',
          school_id: classroom.school_id,
          grade_level: classroom.grade_level,
          managed_username: username,
          country_code: 'US',
        }, { onConflict: 'id' });
        if (profileError) throw profileError;
      }

      const { error: enrollmentError } = await admin.from('class_enrollments').upsert({
        class_id: classId,
        athlete_id: athleteId,
        status: 'active',
      }, { onConflict: 'class_id,athlete_id' });
      if (enrollmentError) throw enrollmentError;

      imported.push({ athlete_id: athleteId, display_name: displayName, username, pin, already_existed: alreadyExisted });
    } catch (error: any) {
      skipped.push({ display_name: displayName, reason: error?.message ?? 'Could not add this student.' });
    }
  }

  return NextResponse.json({ classroom: { id: classroom.id, name: classroom.name }, imported, skipped });
}

/** Returns the roster without exposing credentials. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: classId } = await context.params;
  const access = await requireClassManager(classId);
  if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Server administration is not configured.' }, { status: 500 });
  }

  const { data: roster, error } = await admin
    .from('class_enrollments')
    .select('id, status, enrolled_at, users:athlete_id(id, display_name, managed_username, grade_level, is_active)')
    .eq('class_id', classId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    roster: (roster ?? []).map((row: any) => ({
      enrollment_id: row.id,
      enrolled_at: row.enrolled_at,
      athlete: row.users,
    })),
  });
}
