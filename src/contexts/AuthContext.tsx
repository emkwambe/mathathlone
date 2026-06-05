'use client';

// =============================================================================
// MathAthlone — Auth Context (React)
// =============================================================================
// File: src/contexts/AuthContext.tsx
//
// Wraps the singleton browser Supabase client with a React context.
// Exposes useAuth() hook for client components.
//
// NO INFINITE LOOP: this version does NOT call router.refresh() inside
// onAuthStateChange. The previous version did, and it triggered a full
// re-render that re-mounted AuthProvider that re-fired the listener
// that called refresh again — infinite redirect.
//
// Provides:
//   - user, session, loading, isAuthenticated
//   - claims (decoded from JWT — user_role, permissions, school_id, district_id)
//   - profile (from public.users — display_name, grade_level, etc.)
//   - hasRole(role) / hasPermission(perm) / isInSchool(id) / isInDistrict(id)
//   - signIn / signOut / signUp / signInWithMagicLink / signInWithProvider
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type AppRole =
  | 'mathlete'
  | 'parent'
  | 'teacher'
  | 'school_admin'
  | 'district_admin'
  | 'platform_admin'
  | 'broadcast_host';

export type Permission =
  | 'heats.create'
  | 'heats.delete'
  | 'heats.proctor'
  | 'heats.broadcast'
  | 'users.read.school'
  | 'users.read.district'
  | 'users.read.platform'
  | 'users.invite.mathlete'
  | 'users.invite.teacher'
  | 'attest.regional'
  | 'attest.state'
  | 'integrity.review'
  | 'data.export.school'
  | 'data.export.district'
  | 'data.delete.minor'
  | 'consent.grant.parent';

export interface JwtClaims {
  user_role: AppRole;
  permissions: Permission[];
  school_id?: string;
  district_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  display_name: string;
  country_code: string | null;
  grade_level: number | null;
  date_of_birth: string | null;
  school_id: string | null;
  data_minimization_tier: 'minimal' | 'standard' | 'full';
  ferpa_authorized_at: string | null;
  fair_play_acknowledged_at: string | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  display_name: string;
  desired_role?: 'teacher' | 'parent' | 'mathlete';
  school_id?: string;
}

interface AuthContextValue {
  // State
  user: User | null;
  session: Session | null;
  claims: JwtClaims | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Authorization
  hasRole: (role: AppRole | AppRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isInSchool: (schoolId: string) => boolean;
  isInDistrict: (districtId: string) => boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithProvider: (
    provider: 'google' | 'azure'
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function decodeJwtClaims(accessToken: string | undefined): JwtClaims | null {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return {
      user_role: (payload.user_role as AppRole) || 'mathlete',
      permissions: (payload.permissions as Permission[]) || [],
      school_id: payload.school_id,
      district_id: payload.district_id,
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// PROVIDER
// -----------------------------------------------------------------------------

// Routes that should NEVER trigger a session-expiry redirect (because they
// don't require auth or because they own the login flow themselves).
const PUBLIC_PATH_PREFIXES = [
  '/auth/',
  '/403',
  '/404',
];

// BUG 6: live competition pages MUST NEVER be unmounted by an auth redirect.
// When a backgrounded tab regains focus, Supabase often emits a transient
// null session right before TOKEN_REFRESHED succeeds. If we redirect on that
// transient state, the CompetitionView unmounts and the student loses their
// in-progress Heat. The competition page handles its own auth lifecycle —
// it surfaces a session_expired UI from inside the lobby loader without
// blowing away question state.
const COMPETITION_PATH_PATTERN = /^\/compete\/[^/]+/;

function isProtectedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === '/') return false;                  // marketing landing
  return !PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isLiveCompetitionPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // /compete is the join page — fine to redirect from. Only the per-code
  // subpaths (which mount CompetitionView during 'active' status) are exempt.
  return COMPETITION_PATH_PATTERN.test(pathname);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track whether we ever had an authenticated session in this browser tab.
  // Only after we've seen a session do we treat a transition-to-null as a
  // "session expired" event worth redirecting on. This prevents the redirect
  // from firing on the very first page render before the initial getSession()
  // resolves.
  const hadSessionRef = useRef(false);

  // Derive claims from current session token (free, no DB calls)
  const claims = useMemo(
    () => decodeJwtClaims(session?.access_token),
    [session?.access_token]
  );

  // Fetch profile from public.users
  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, email, role, display_name, country_code,
          grade_level, date_of_birth, school_id,
          data_minimization_tier, ferpa_authorized_at,
          fair_play_acknowledged_at
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('[AuthContext] fetchProfile error:', error.message);
        }
        return null;
      }
      return (data as UserProfile) ?? null;
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const fresh = await fetchProfile(user.id);
    setProfile(fresh);
  }, [user, fetchProfile]);

  // Initial session + auth state listener
  useEffect(() => {
    let mounted = true;

    // 1) Initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initial } }) => {
        if (!mounted) return;
        if (initial) hadSessionRef.current = true;
        setSession(initial);
        setUser(initial?.user ?? null);
        if (initial?.user) {
          const p = await fetchProfile(initial.user.id);
          if (mounted) setProfile(p);
        }
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        console.error('[AuthContext] getSession error:', err);
        if (mounted) setLoading(false);
      });

    // 2) Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      const hadSession = hadSessionRef.current;
      if (newSession) hadSessionRef.current = true;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const p = await fetchProfile(newSession.user.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);

        // BUG 4: redirect to login when the session is GENUINELY gone on a
        // protected page (signed out from another tab, refresh-token failure
        // surfaced as SIGNED_OUT). BUG 6: we deliberately do NOT trigger on
        // TOKEN_REFRESHED / USER_UPDATED / INITIAL_SESSION — Supabase fires
        // those with a transient null session when a backgrounded tab regains
        // focus, before the refresh completes. Treating those as "session
        // expired" remounts every protected page (including CompetitionView)
        // and obliterates in-progress Heat state. We also exempt
        // /compete/[code] entirely — that route handles its own auth lifecycle.
        if (
          hadSession &&
          event === 'SIGNED_OUT' &&
          isProtectedPath(pathname) &&
          !isLiveCompetitionPath(pathname)
        ) {
          const next = encodeURIComponent(pathname || '/');
          console.warn('[AuthContext] session lost on protected page — redirecting to login', {
            pathname,
            event,
          });
          router.push(`/auth/login?next=${next}`);
        } else if (hadSession && event === 'SIGNED_OUT' && isLiveCompetitionPath(pathname)) {
          // Diagnostic only — never redirect. The lobby/competition view will
          // surface session_expired on its next Supabase call.
          console.warn('[AuthContext] session ended on live competition page — letting page handle it', {
            pathname,
            event,
          });
        }
      }
      // NB: We do NOT call router.refresh() here. The middleware handles
      // server-side cookie sync; calling refresh() inside the listener
      // creates an infinite re-render loop.
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, pathname, router]);

  // ---------------- Authorization helpers ----------------

  const hasRole = useCallback(
    (role: AppRole | AppRole[]): boolean => {
      if (!claims) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(claims.user_role);
    },
    [claims]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return claims?.permissions.includes(permission) ?? false;
    },
    [claims]
  );

  const isInSchool = useCallback(
    (schoolId: string): boolean => claims?.school_id === schoolId,
    [claims]
  );

  const isInDistrict = useCallback(
    (districtId: string): boolean => claims?.district_id === districtId,
    [claims]
  );

  // ---------------- Auth actions ----------------

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (params: SignUpParams) => {
      const { error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            display_name: params.display_name,
            desired_role: params.desired_role ?? 'mathlete',
            school_id: params.school_id,
          },
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      return { error };
    },
    [supabase]
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      return { error };
    },
    [supabase]
  );

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'azure') => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      return { error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Manual redirect — onAuthStateChange listener clears state for us.
    router.push('/');
  }, [supabase, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      claims,
      profile,
      loading,
      isAuthenticated: !!user,
      hasRole,
      hasPermission,
      isInSchool,
      isInDistrict,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithProvider,
      signOut,
      refreshProfile,
    }),
    [
      user, session, claims, profile, loading,
      hasRole, hasPermission, isInSchool, isInDistrict,
      signIn, signUp, signInWithMagicLink, signInWithProvider, signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -----------------------------------------------------------------------------
// HOOKS
// -----------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth() must be called inside <AuthProvider>. ' +
      'Make sure your component tree is wrapped in src/app/layout.tsx.'
    );
  }
  return ctx;
}

/**
 * Redirect logged-out users to login. Use in protected client pages.
 *
 *   export default function Page() {
 *     const { isAuthenticated, loading } = useRequireAuth();
 *     if (loading) return <Spinner />;
 *     if (!isAuthenticated) return null;  // redirect already in progress
 *     return <YourPage />;
 *   }
 */
export function useRequireAuth(redirectTo: string = '/auth/login') {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  return { isAuthenticated, loading };
}

/**
 * Require a specific role. Redirects to /403 if user has wrong role.
 */
export function useRequireRole(
  allowedRoles: AppRole | AppRole[],
  redirectTo: string = '/403'
) {
  const { hasRole, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!hasRole(allowedRoles)) {
      router.push(redirectTo);
    }
  }, [hasRole, allowedRoles, loading, isAuthenticated, router, redirectTo]);

  return { authorized: !loading && isAuthenticated && hasRole(allowedRoles), loading };
}

/**
 * Require a specific permission.
 */
export function useRequirePermission(
  permission: Permission,
  redirectTo: string = '/403'
) {
  const { hasPermission, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!hasPermission(permission)) {
      router.push(redirectTo);
    }
  }, [hasPermission, permission, loading, isAuthenticated, router, redirectTo]);

  return { authorized: !loading && isAuthenticated && hasPermission(permission), loading };
}
