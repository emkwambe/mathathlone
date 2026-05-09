// =============================================================================
// MathAthlone — Supabase Server Client
// =============================================================================
// File: src/lib/supabase/server.ts
//
// USE IN: Server Components, Server Actions, Route Handlers
// DO NOT use in client components — use createClient() from ./client instead.
//
// IMPORTANT: cookies() is async in Next.js 15+. We await it.
// In Next.js 14.2.x it's sync but compat-imported as awaitable. The await
// is a no-op there, so this code works on both versions.
// =============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for use in Server Components, Server Actions,
 * or Route Handlers. Reads/writes cookies via Next.js cookies() API.
 *
 * Per Supabase guidance, this is request-scoped — call it inside the request
 * handler, not at module level. (Module-scoped server clients can leak
 * sessions between users on platforms with warm instances like Vercel Fluid.)
 *
 * Example:
 *   export async function GET() {
 *     const supabase = await createSupabaseServer();
 *     const { data: { user } } = await supabase.auth.getUser();
 *     ...
 *   }
 */
export async function createSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Server Components can't set cookies. The middleware refreshes
            // sessions on each request, so we can ignore this error.
          }
        },
      },
    }
  );
}

// -----------------------------------------------------------------------------
// CONVENIENCE HELPERS (commonly needed in server code)
// -----------------------------------------------------------------------------

/**
 * Get the current authenticated user, server-validated.
 * Returns null if not signed in.
 *
 * Always use this instead of getSession() on the server — getUser() pings
 * the Supabase Auth server to validate the JWT, while getSession() trusts
 * the cookie blindly.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * Get the current user's full profile from public.users.
 * Returns null if not signed in or profile missing.
 */
export async function getCurrentProfile() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, role, display_name, country_code,
      grade_level, date_of_birth, school_id,
      data_minimization_tier, ferpa_authorized_at,
      proctor_certified_at, fair_play_acknowledged_at
    `)
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Get the current user's JWT claims (role, permissions, school, district).
 * Returns null if not signed in.
 */
export async function getCurrentClaims(): Promise<{
  user_role: string;
  permissions: string[];
  school_id?: string;
  district_id?: string;
} | null> {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(session.access_token.split('.')[1], 'base64').toString('utf-8')
    );
    return {
      user_role: payload.user_role || 'mathlete',
      permissions: payload.permissions || [],
      school_id: payload.school_id,
      district_id: payload.district_id,
    };
  } catch {
    return null;
  }
}
