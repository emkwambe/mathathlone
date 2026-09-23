import type { HeatStatus } from './heat-service';

/**
 * A lobby that has been open this long should be visibly reviewed by its host,
 * but must never be cancelled or otherwise mutated merely because a page was
 * opened. Starting or cancelling a Heat remains an explicit host decision.
 */
export const LOBBY_REVIEW_AFTER_MS = 30 * 60 * 1000;

export function requiresLobbyReview(
  status: HeatStatus | string | null | undefined,
  createdAt: string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (status !== 'lobby' || !createdAt) return false;

  const createdAtMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return false;

  return nowMs - createdAtMs >= LOBBY_REVIEW_AFTER_MS;
}
