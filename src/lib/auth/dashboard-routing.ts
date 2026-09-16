// =============================================================================
// MathAthlone — Dashboard routing by active role precedence
// =============================================================================
// A display name and a legacy profile role are not authorization decisions.
// Dashboard routing uses active user_roles records and selects the most
// privileged active role deterministically. These helpers are side-effect-free
// so server routes and local tests use the same precedence contract.
// =============================================================================

export type DashboardRole =
  | 'platform_admin'
  | 'district_admin'
  | 'school_admin'
  | 'teacher'
  | 'broadcast_host'
  | 'parent'
  | 'mathlete';

const ROLE_PRECEDENCE: Record<DashboardRole, number> = {
  platform_admin: 1,
  district_admin: 2,
  school_admin: 3,
  teacher: 4,
  broadcast_host: 5,
  parent: 6,
  mathlete: 7,
};

const KNOWN_DASHBOARD_ROLES = new Set<DashboardRole>(Object.keys(ROLE_PRECEDENCE) as DashboardRole[]);

export function isDashboardRole(value: string | null | undefined): value is DashboardRole {
  return typeof value === 'string' && KNOWN_DASHBOARD_ROLES.has(value as DashboardRole);
}

export function highestActiveDashboardRole(
  roles: Array<string | null | undefined>,
): DashboardRole | null {
  const validRoles = roles.filter(isDashboardRole);
  if (validRoles.length === 0) return null;

  return [...validRoles].sort((a, b) => ROLE_PRECEDENCE[a] - ROLE_PRECEDENCE[b])[0];
}

export function dashboardPathForRole(role: DashboardRole | null): string {
  switch (role) {
    case 'platform_admin':
      return '/dashboard/platform/pilot';
    case 'district_admin':
    case 'school_admin':
      return '/dashboard/admin';
    case 'teacher':
      return '/dashboard/teacher';
    case 'broadcast_host':
      return '/dashboard/broadcast';
    case 'parent':
      return '/dashboard/parent';
    case 'mathlete':
    case null:
    default:
      return '/dashboard/athlete';
  }
}

export function isMathleteDashboardRole(role: DashboardRole | null): boolean {
  return role === null || role === 'mathlete';
}
