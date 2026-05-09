import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES: string[] = [
  '/', '/about', '/pricing', '/contact', '/legal',
  '/legal/privacy', '/legal/terms', '/legal/coppa', '/blog',
  '/auth/login', '/auth/register',
  '/auth/register/parent', '/auth/register/teacher',
  '/auth/forgot-password', '/auth/reset-password',
  '/auth/verify-email', '/auth/callback',
  '/api/health', '/api/webhooks',
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
        setAll(cookiesToSet) {
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

  if (!user && !isPublicRoute(path) && !path.startsWith('/api/')) {
    const loginUrl = new URL('/auth/login', request.url);
    if (path !== '/') {
      loginUrl.searchParams.set('next', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRedirectRoute(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}