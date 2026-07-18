import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES: string[] = [
  '/', '/about', '/pricing', '/contact', '/legal',
  '/legal/privacy', '/legal/terms', '/legal/coppa', '/blog',
  '/auth/login', '/auth/register',
  '/auth/register/parent', '/auth/register/teacher',
  '/auth/forgot-password', '/auth/reset-password',
  '/auth/verify-email', '/auth/callback',
  '/403',                                              // Forbidden page — must be accessible without auth
  '/api/health', '/api/webhooks',
];

// Route prefix → minimum required role(s). The middleware enforces these at
// the edge before any page code runs. Client-side RoleGuard / useRequireRole
// provide a second layer of enforcement for dynamic client components.
const ROLE_PROTECTED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/dashboard/admin',     roles: ['platform_admin', 'school_admin', 'district_admin'] },
  { prefix: '/dashboard/teacher',   roles: ['teacher', 'school_admin', 'district_admin', 'platform_admin'] },
  { prefix: '/dashboard/parent',    roles: ['parent', 'platform_admin'] },
  { prefix: '/dashboard/broadcast', roles: ['teacher', 'school_admin', 'district_admin', 'platform_admin'] },
  { prefix: '/compete/create',      roles: ['teacher', 'school_admin', 'district_admin', 'platform_admin'] },
];

const AUTH_REDIRECT_ROUTES: string[] = [
  '/auth/login',
  '/auth/register',
  '/auth/register/parent',
  '/auth/register/teacher',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isAuthRedirectRoute(pathname: string): boolean {
  return AUTH_REDIRECT_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Validate a `?next=` query value. Only allow internal paths starting with
 * `/` (so the middleware can't be tricked into redirecting to an external
 * domain), and reject paths that would loop us right back to an auth page.
 */
function safeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;          // external / protocol-relative — reject
  if (next.startsWith('//')) return null;          // protocol-relative — reject
  if (isAuthRedirectRoute(next)) return null;      // would just loop back
  return next;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch (err) {
    console.error('[middleware] Auth check failed:', err);
  }

  const path = request.nextUrl.pathname;

  // ── Role-based route enforcement ───────────────────────────────────────────────────────
  // Only runs when a user IS authenticated (unauthenticated users are handled
  // by the redirect block below). Role is read from the JWT user_metadata
  // (populated by the Supabase custom access token hook). If the hook is not
  // yet enabled, user_metadata.role falls back to the value set at sign-up.
  if (user) {
    // Read role from JWT custom claim first (requires Supabase custom access token hook).
    // Fall back to user_metadata.role, then user_metadata.desired_role (set at signup).
    const userRole: string =
      (user.user_metadata?.role as string) ||
      (user.user_metadata?.desired_role as string) ||
      '';
    for (const { prefix, roles } of ROLE_PROTECTED_ROUTES) {
      if (path.startsWith(prefix) && !roles.includes(userRole)) {
        return NextResponse.redirect(new URL('/403', request.url));
      }
    }
  }

  if (!user && !isPublicRoute(path) && !path.startsWith('/api/')) {
    const loginUrl = new URL('/auth/login', request.url);
    if (path !== '/') {
      loginUrl.searchParams.set('next', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRedirectRoute(path)) {
    // Honor ?next= when it's a safe internal path (e.g. a Heat join link
    // that bounced through login). Otherwise fall back to /dashboard, which
    // forwards to the role-specific dashboard.
    const requested = safeNextPath(request.nextUrl.searchParams.get('next'));
    return NextResponse.redirect(new URL(requested ?? '/dashboard', request.url));
  }

  return response;
}