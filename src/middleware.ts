// =============================================================================
// MathAthlone — Root Middleware
// =============================================================================
// File: src/middleware.ts (or middleware.ts at project root, NOT in src/)
//
// Runs before every request. Refreshes Supabase auth tokens, syncs cookies,
// and enforces route-level access control.
// =============================================================================

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static    (static files)
     * - _next/image     (image optimization)
     * - favicon.ico     (favicon)
     * - Image extensions (we don't auth-check images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
