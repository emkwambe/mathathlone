// =============================================================================
// MathAthlone — Debug whoami endpoint
// =============================================================================
// File: src/app/api/debug/whoami/route.ts
//
// Use this to verify auth is working end-to-end.
// 
// curl -b cookies.txt http://localhost:3000/api/debug/whoami
//
// Should return:
//   {
//     "authenticated": true,
//     "user": { ... },
//     "claims": {
//       "user_role": "teacher",
//       "permissions": ["heats.create", ...],
//       "school_id": "...",
//       "district_id": "..."
//     },
//     "profile": { ... }
//   }
//
// If claims are empty, the Custom Access Token Hook is not enabled in
// Supabase Dashboard → Authentication → Hooks.
// =============================================================================

import { NextResponse } from 'next/server';
import { createSupabaseServer, getCurrentClaims } from '@/lib/supabase/server';

export async function GET() {
  // ONLY available in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({
      authenticated: false,
      reason: error?.message ?? 'No user session',
    });
  }

  const claims = await getCurrentClaims();

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, email, role, display_name, country_code,
      grade_level, date_of_birth, school_id,
      data_minimization_tier, ferpa_authorized_at,
      fair_play_acknowledged_at, deleted_at
    `)
    .eq('id', user.id)
    .maybeSingle();

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, scope_type, scope_id, is_active, granted_at, expires_at')
    .eq('user_id', user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    claims,
    profile,
    roles,
    diagnostics: {
      claims_present: !!claims,
      hook_enabled: !!claims?.user_role,
      hint: !claims?.user_role
        ? 'Custom Access Token Hook is NOT enabled. Go to Supabase Dashboard → Authentication → Hooks → enable custom_access_token_hook.'
        : 'OK',
    },
  });
}
