// =============================================================================
// POST /api/league/[id]/roster/import — Sprint 9 Bulk Enrollment
// =============================================================================
// Allows a league owner (teacher / platform_admin) to bulk-enroll students by
// uploading a CSV of names.  For each student:
//   1. Checks if a user with that display_name + school_id already exists.
//   2. If not, creates a managed Supabase Auth user (no email invite) with a
//      random 4-digit PIN as the password and a generated username.
//   3. Inserts a row into public.users (profile) if missing.
//   4. Inserts a row into league_standings to enroll them in the league.
//
// Returns:
//   { enrolled: RosterEntry[], skipped: string[] }
//   where RosterEntry = { display_name, username, pin, user_id, already_existed }
//
// Body:
//   { csv: string }   — newline-separated list of student display names
//                        (e.g. "Jane Smith\nJohn Doe\n...")
//
// Security:
//   - Caller must be authenticated as teacher or platform_admin
//   - Caller must be the league owner (created_by = caller.id)
//   - Uses SUPABASE_SERVICE_ROLE_KEY for admin user creation (server-side only)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// ── Admin client (service role — never exposed to browser) ──────────────────
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local and Vercel env vars.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a random 4-digit PIN string. */
function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Convert a display name to a URL-safe username slug + 4-digit suffix. */
function makeUsername(displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 16);
  const suffix = String(Math.floor(10 + Math.random() * 90));
  return `${slug}${suffix}`;
}

/** Parse a CSV/newline string into an array of trimmed non-empty names. */
function parseNames(csv: string): string[] {
  return csv
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80);
}

// ── Route handler ─────────────────────────────────────────────────────────────

interface RosterEntry {
  display_name: string;
  username: string;
  pin: string;
  user_id: string;
  already_existed: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: leagueId } = await params;

  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Role check ──────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('role, school_id, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['teacher', 'platform_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
  }

  // ── League ownership check ──────────────────────────────────────────────────
  const { data: league } = await supabase
    .from('leagues')
    .select('id, created_by')
    .eq('id', leagueId)
    .maybeSingle();

  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 });
  }
  if (league.created_by !== user.id && profile.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden — not your league' }, { status: 403 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { csv } = body;
  if (!csv || typeof csv !== 'string') {
    return NextResponse.json({ error: 'Missing csv field' }, { status: 400 });
  }

  const names = parseNames(csv);
  if (names.length === 0) {
    return NextResponse.json({ error: 'No valid names found in CSV' }, { status: 400 });
  }
  if (names.length > 200) {
    return NextResponse.json({ error: 'Maximum 200 students per import' }, { status: 400 });
  }

  // ── Admin client for user creation ──────────────────────────────────────────
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const enrolled: RosterEntry[] = [];
  const skipped: string[] = [];
  const schoolId = profile.school_id;

  for (const displayName of names) {
    try {
      // ── 1. Check if user already exists in public.users ────────────────────
      const { data: existing } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('display_name', displayName)
        .eq('school_id', schoolId)
        .maybeSingle();

      let userId: string;
      let username: string;
      let pin: string;
      let alreadyExisted = false;

      if (existing) {
        // User already exists — just enroll them
        userId = existing.id;
        username = displayName.toLowerCase().replace(/\s+/g, '_');
        pin = '****'; // PIN not shown for existing users
        alreadyExisted = true;
      } else {
        // ── 2. Create managed Auth user ──────────────────────────────────────
        pin = randomPin();
        username = makeUsername(displayName);
        // Use a fake email derived from username + league to avoid conflicts
        const fakeEmail = `${username}@roster.mathathlone.internal`;

        const { data: newAuthUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: fakeEmail,
          password: pin,
          email_confirm: true, // skip email verification
          user_metadata: {
            display_name: displayName,
            username,
            school_id: schoolId,
            managed: true, // flag: teacher-created account
          },
        });

        if (createErr || !newAuthUser?.user) {
          console.error('[roster/import] createUser error:', createErr);
          skipped.push(displayName);
          continue;
        }

        userId = newAuthUser.user.id;

        // ── 3. Insert profile row into public.users ──────────────────────────
        const { error: profileErr } = await adminClient
          .from('users')
          .upsert({
            id: userId,
            email: fakeEmail,
            display_name: displayName,
            role: 'mathlete',
            school_id: schoolId,
          }, { onConflict: 'id' });

        if (profileErr) {
          console.error('[roster/import] profile upsert error:', profileErr);
          skipped.push(displayName);
          continue;
        }
      }

      // ── 4. Enroll in league_standings (upsert to avoid duplicates) ──────────
      const { error: standingsErr } = await adminClient
        .from('league_standings')
        .upsert({
          league_id: leagueId,
          athlete_id: userId,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          current_elo: 1200,
        }, { onConflict: 'league_id,athlete_id' });

      if (standingsErr) {
        console.error('[roster/import] standings upsert error:', standingsErr);
        skipped.push(displayName);
        continue;
      }

      enrolled.push({ display_name: displayName, username, pin, user_id: userId, already_existed: alreadyExisted });
    } catch (err) {
      console.error('[roster/import] unexpected error for', displayName, err);
      skipped.push(displayName);
    }
  }

  return NextResponse.json({ enrolled, skipped }, { status: 200 });
}
