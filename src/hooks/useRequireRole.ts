'use client';
// =============================================================================
// MathAthlone — useRequireRole Hook
// =============================================================================
// Client-side RBAC guard. Use this in any Client Component that should only
// be accessible to specific roles. For Server Components, use the
// createSupabaseServer() pattern already in place on the dashboard pages.
//
// Usage:
//   const { allowed, loading } = useRequireRole(['teacher', 'school_admin']);
//
// The hook:
//   1. Waits for AuthContext to finish loading.
//   2. If the user is not authenticated → redirects to /auth/login.
//   3. If the user is authenticated but lacks the required role → redirects
//      to /403.
//   4. Returns { allowed: true, loading: false } when access is confirmed.
//
// © Mpingo Systems LLC
// =============================================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface UseRequireRoleResult {
  /** True when the user is confirmed to have one of the required roles */
  allowed: boolean;
  /** True while auth state is still loading */
  loading: boolean;
}

/**
 * Enforce role-based access control in a Client Component.
 *
 * @param roles - One or more roles that are permitted to view this page.
 *                Pass an empty array to require authentication only (any role).
 * @param redirectTo - Override the default /403 redirect for unauthorized users.
 */
export function useRequireRole(
  roles: UserRole[],
  redirectTo = '/403'
): UseRequireRoleResult {
  const router = useRouter();
  const { user, claims, loading } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Still loading — do nothing yet
    if (loading) return;

    // Not authenticated → send to login
    if (!user) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      router.replace(`/auth/login${path ? `?next=${encodeURIComponent(path)}` : ''}`);
      return;
    }

    // No role restriction — any authenticated user is fine
    if (roles.length === 0) {
      setAllowed(true);
      return;
    }

    // Check role from JWT claims (populated by the custom access token hook)
    // Fall back to the profile role if claims are not yet hydrated.
    const userRole = (claims?.user_role ?? user.user_metadata?.role) as UserRole | undefined;

    if (userRole && roles.includes(userRole)) {
      setAllowed(true);
    } else {
      router.replace(redirectTo);
    }
  }, [loading, user, claims, roles, redirectTo, router]);

  return { allowed, loading };
}
