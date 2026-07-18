'use client';
// =============================================================================
// MathAthlone — RoleGuard Component
// =============================================================================
// Wraps any Client Component subtree and enforces role-based access control.
// Shows a full-screen spinner while auth is loading, then either renders
// children (if the user has the required role) or redirects (handled by the
// useRequireRole hook).
//
// Usage:
//   <RoleGuard roles={['teacher', 'school_admin']}>
//     <TeacherOnlyContent />
//   </RoleGuard>
//
// © Mpingo Systems LLC
// =============================================================================

import React from 'react';
import { useRequireRole } from '@/hooks/useRequireRole';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  /** Roles permitted to see the children. Empty array = any authenticated user. */
  roles: UserRole[];
  /** Override the redirect target for unauthorized users (default: /403) */
  redirectTo?: string;
  children: React.ReactNode;
}

export default function RoleGuard({ roles, redirectTo, children }: RoleGuardProps) {
  const { allowed, loading } = useRequireRole(roles, redirectTo);

  if (loading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
