import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks persisted organization-aware league management authority.
 * Migration 047 supplies the security-definer function; this helper centralizes
 * the route-level error mapping so operational endpoints never rely on a
 * client-provided school, district, or league-owner assertion.
 */
export async function getLeagueManagementAccess(
  supabase: SupabaseClient,
  leagueId: string
): Promise<{ allowed: boolean; configurationError?: string }> {
  const { data, error } = await supabase.rpc('can_manage_league', {
    p_league_id: leagueId,
  });

  if (error) {
    console.error('[league authority] scope check failed:', error);
    return {
      allowed: false,
      configurationError: 'Unable to verify league authority. Ensure Sprint 16B migration 047 has been run.',
    };
  }

  return { allowed: Boolean(data) };
}
