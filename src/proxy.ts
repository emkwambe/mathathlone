// =============================================================================
// MathAthlone — Root Proxy
// =============================================================================
// Runs before matched requests. Refreshes Supabase auth tokens, syncs cookies,
// and enforces route-level access control.
//
// Next.js 16 renamed the middleware file convention to proxy. This file keeps
// the established authorization behavior while using the supported convention.
// =============================================================================

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static    (static files)
     * - _next/image     (image optimization)
     * - favicon.ico     (favicon)
     * - Image extensions (we do not auth-check images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
