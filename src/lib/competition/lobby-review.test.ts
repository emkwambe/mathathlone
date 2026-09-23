import { describe, expect, it } from 'vitest';

import {
  LOBBY_REVIEW_AFTER_MS,
  requiresLobbyReview,
} from './lobby-review';

describe('requiresLobbyReview', () => {
  const now = Date.parse('2026-09-22T20:00:00.000Z');

  it('flags a lobby at or beyond the review threshold without changing its status', () => {
    const createdAt = new Date(now - LOBBY_REVIEW_AFTER_MS).toISOString();

    expect(requiresLobbyReview('lobby', createdAt, now)).toBe(true);
  });

  it('does not flag a recent lobby', () => {
    const createdAt = new Date(now - LOBBY_REVIEW_AFTER_MS + 1).toISOString();

    expect(requiresLobbyReview('lobby', createdAt, now)).toBe(false);
  });

  it('never treats non-lobby or malformed records as a stale lobby', () => {
    expect(requiresLobbyReview('cancelled', '2026-09-22T18:00:00.000Z', now)).toBe(false);
    expect(requiresLobbyReview('lobby', 'not-a-timestamp', now)).toBe(false);
    expect(requiresLobbyReview('lobby', null, now)).toBe(false);
  });
});
