// =============================================================================
// MathAthlone — Role-aware class Heat entry rules
// =============================================================================
// Class-bound Heats are participated in by active Mathletes only. Educator
// accounts may create, host, or monitor a Heat, but must never be routed into
// the Mathlete auto-join flow. Server-side roster enforcement remains the
// authoritative security boundary; these helpers make the client journey clear
// and avoid misleading educator-as-student UI.
// =============================================================================

export const EDUCATOR_CLASS_HEAT_ROLES = new Set([
  'teacher',
  'school_admin',
  'district_admin',
  'platform_admin',
  'broadcast_host',
]);

export function isEducatorClassHeatRole(role: string | null | undefined): boolean {
  return typeof role === 'string' && EDUCATOR_CLASS_HEAT_ROLES.has(role);
}

/**
 * Prefer an educator classification whenever either the JWT or the profile
 * identifies an educator role. This is intentionally conservative: if role
 * claims are briefly stale after a role change, the user sees the safer
 * educator information state instead of entering a Mathlete join flow.
 */
export function isEducatorClassHeatAccount(input: {
  claimedRole?: string | null;
  profileRole?: string | null;
}): boolean {
  return (
    isEducatorClassHeatRole(input.claimedRole) ||
    isEducatorClassHeatRole(input.profileRole)
  );
}

/**
 * The Heat creator is always allowed to view host controls. Other educator
 * accounts are never auto-enrolled as Mathletes, even when they possess a
 * valid Heat code.
 */
export function shouldAutoJoinClassHeat(input: {
  isHeatCreator: boolean;
  isEducatorAccount: boolean;
}): boolean {
  return !input.isHeatCreator && !input.isEducatorAccount;
}

export function classHeatEntryRoleLabel(input: {
  claimedRole?: string | null;
  profileRole?: string | null;
}): string {
  return input.claimedRole ?? input.profileRole ?? 'mathlete';
}
