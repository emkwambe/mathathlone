// =============================================================================
// MathAthlone — Heat Realtime
// =============================================================================
// Supabase Realtime channels + React hooks for live Heat state.
//
// Replaces the EventEmitter pattern from the legacy heat-engine.ts. Every
// stream of updates now flows through a Postgres-changes subscription or a
// channel broadcast — no in-memory event bus.
//
// Hooks (client components only — they use React state):
//   useHeatRealtime(heatId)      → { heat, status }
//   useHeatParticipants(heatId)  → { participants }
//   useHeatSubmissions(heatId)   → { lastSubmission }
//
// Plus a low-level helper subscribeToHeat() that returns the underlying
// RealtimeChannel for callers that aren't React (e.g., the backward-compat
// heat-engine.ts factory).
// =============================================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  listHeatParticipants,
  type Heat,
  type HeatStatus,
  type HeatParticipationWithDisplay,
} from './heat-service';

// -----------------------------------------------------------------------------
// LOW-LEVEL CHANNEL HELPER (non-React)
// -----------------------------------------------------------------------------

export interface SubscribeOptions {
  onHeatUpdate?: (heat: Partial<Heat>) => void;
  onParticipantInsert?: (participation: { id: string; athlete_id: string; heat_id: string }) => void;
  onParticipantUpdate?: (participation: { id: string; athlete_id: string; heat_id: string }) => void;
  onSubmissionBroadcast?: (payload: { athlete_id: string; question_number: number; is_correct: boolean }) => void;

  /**
   * Optional channel-name suffix. Use a different suffix per parallel
   * listener (e.g. `'status'`, `'participants'`, `'bus'`) so they each get
   * their own channel instance.
   *
   * Why this matters: `supabase.channel(name)` returns the SAME channel
   * instance if called twice with the same name on the same client. If two
   * callers share the channel and one of them has already called
   * `.subscribe()`, the second caller's `.on('postgres_changes', ...)` will
   * throw "cannot add postgres_changes callbacks after subscribe()".
   */
  channelSuffix?: string;
}

/**
 * Generate a short random token (alphanumeric, ~6 chars) that makes a
 * channel name globally unique per invocation. Falls back to Math.random()
 * if crypto isn't available (e.g., older browser, SSR shell).
 */
function shortRandomId(): string {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID().split('-')[0]!;
      }
      if (typeof crypto.getRandomValues === 'function') {
        const arr = new Uint8Array(4);
        crypto.getRandomValues(arr);
        return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
      }
    }
  } catch {
    /* fall through */
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Subscribe to a Heat's lifecycle on a dedicated Supabase channel.
 * Returns the channel so callers can later unsubscribe via
 * `supabase.removeChannel(channel)`.
 *
 * All `.on(...)` registrations happen BEFORE `.subscribe()` (required by
 * supabase-realtime-js — postgres_changes callbacks cannot be added after
 * the channel has been subscribed).
 *
 * EVERY call returns a brand-new channel. We append a random per-call token
 * to the channel name because `supabase.channel(name)` returns the SAME
 * instance when called twice with the same name, and React 18 Strict Mode
 * (or any rapid mount/unmount cycle) can fire two subscribeToHeat calls
 * before the previous removeChannel() — which is asynchronous — has
 * finished cleaning up. The random token sidesteps that race entirely.
 *
 * `channelSuffix` is kept for human-readable grouping in DevTools, e.g.
 * `heat:abc:status:9f2a4c1d`.
 */
export function subscribeToHeat(
  supabase: SupabaseClient,
  heatId: string,
  opts: SubscribeOptions
): RealtimeChannel {
  const suffix = opts.channelSuffix ? `:${opts.channelSuffix}` : '';
  const channelName = `heat:${heatId}${suffix}:${shortRandomId()}`;
  const channel = supabase.channel(channelName);

  // ── ALL .on(...) registrations MUST happen before .subscribe() ──────────
  // supabase-realtime-js rejects postgres_changes handlers added after the
  // channel has joined, with: "tried to push 'access_token' to ... before
  // joined" or "cannot add postgres_changes callbacks after subscribe()".

  if (opts.onHeatUpdate) {
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'heats', filter: `id=eq.${heatId}` },
      (payload: any) => opts.onHeatUpdate!(payload.new as Partial<Heat>)
    );
  }

  if (opts.onParticipantInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'heat_participations',
        filter: `heat_id=eq.${heatId}`,
      },
      (payload: any) => opts.onParticipantInsert!(payload.new)
    );
  }

  if (opts.onParticipantUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'heat_participations',
        filter: `heat_id=eq.${heatId}`,
      },
      (payload: any) => opts.onParticipantUpdate!(payload.new)
    );
  }

  if (opts.onSubmissionBroadcast) {
    channel.on('broadcast', { event: 'submission' }, (payload: any) => {
      opts.onSubmissionBroadcast!(payload.payload);
    });
  }

  // ── Now (and only now) join the channel ─────────────────────────────────
  channel.subscribe();
  return channel;
}

/**
 * Broadcast a submission event to all subscribers on a Heat's channel.
 * Use this to flicker leaderboards / participant cards without forcing
 * everyone to wait on a postgres_changes replication round-trip.
 */
export async function broadcastSubmission(
  channel: RealtimeChannel,
  payload: { athlete_id: string; question_number: number; is_correct: boolean }
): Promise<void> {
  await channel.send({
    type: 'broadcast',
    event: 'submission',
    payload,
  });
}

// -----------------------------------------------------------------------------
// REACT HOOKS
// -----------------------------------------------------------------------------

/**
 * Subscribe to a Heat's status and full row. Returns the latest snapshot
 * plus the current status separately for cheap re-renders of status-bound UI.
 */
export function useHeatRealtime(heatId: string | null | undefined): {
  heat: Heat | null;
  status: HeatStatus | null;
  loading: boolean;
  error: string | null;
} {
  const [heat, setHeat] = useState<Heat | null>(null);
  const [status, setStatus] = useState<HeatStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastEventAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!heatId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    const refetchHeat = async (): Promise<void> => {
      const { data, error: fetchError } = await supabase
        .from('heats')
        .select('*')
        .eq('id', heatId)
        .maybeSingle();
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      if (data) {
        setHeat(data as Heat);
        setStatus((data as Heat).status);
      }
      lastEventAtRef.current = Date.now();
    };

    (async () => {
      await refetchHeat();
      if (!cancelled) setLoading(false);
    })();

    const subscribe = (): void => {
      channelRef.current = subscribeToHeat(supabase, heatId, {
        channelSuffix: 'status',                     // isolated channel per hook
        onHeatUpdate: (partial) => {
          lastEventAtRef.current = Date.now();
          setHeat((prev) => (prev ? { ...prev, ...partial } : (partial as Heat)));
          if (partial.status) setStatus(partial.status);
        },
      });
    };
    subscribe();

    // FIX 3 — Realtime heartbeat / reconnect.
    //
    // Browsers throttle WebSocket activity when a tab is backgrounded. When
    // the tab returns to focus we (a) refetch the heat row so any state we
    // missed while away is captured, and (b) check whether the channel has
    // been silent for an unusually long time — if so, rebuild it so the
    // student never sits on a stale connection.
    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') {
        void refetchHeat();
        const silentMs = Date.now() - lastEventAtRef.current;
        if (silentMs > 30_000 && channelRef.current) {
          console.warn('[useHeatRealtime] channel silent for >30s, resubscribing');
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          subscribe();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Periodic heartbeat (every 30s) — covers the case where the tab is
    // foreground but the connection has silently dropped.
    const heartbeat = window.setInterval(() => {
      const silentMs = Date.now() - lastEventAtRef.current;
      if (silentMs > 60_000 && channelRef.current) {
        console.warn('[useHeatRealtime] no events in 60s, resubscribing');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        subscribe();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(heartbeat);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [heatId]);

  return { heat, status, loading, error };
}

/**
 * Subscribe to the participant roster for a Heat. Re-fetches the full list
 * (with display_name JOIN) on every INSERT/UPDATE since the realtime payload
 * doesn't include the joined user fields.
 */
export function useHeatParticipants(heatId: string | null | undefined): {
  participants: HeatParticipationWithDisplay[];
  loading: boolean;
  error: string | null;
} {
  const [participants, setParticipants] = useState<HeatParticipationWithDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // FIX 2 guard: ensure THIS hook instance only attempts auto-end once. The
  // DB-side endHeat() is idempotent enough for MVP — its first call flips
  // heats.status to 'calculating' so any other client's subsequent
  // pre-check below will short-circuit.
  const autoEndTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!heatId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    const maybeAutoEndHeat = async (list: HeatParticipationWithDisplay[]): Promise<void> => {
      // FIX 2 — auto-end heat when all participants finish early.
      // Only run if (a) we haven't already fired in this hook instance,
      // (b) there's at least one participant, (c) every participation is
      // in 'finished' status, and (d) the heat itself is still 'active'.
      if (autoEndTriggeredRef.current) return;
      if (list.length === 0) return;
      if (!list.every((p) => p.status === 'finished')) return;

      const { data: heatRow } = await supabase
        .from('heats')
        .select('status')
        .eq('id', heatId)
        .maybeSingle();
      if (!heatRow || (heatRow as { status: string }).status !== 'active') return;

      autoEndTriggeredRef.current = true;
      try {
        // Lazy import avoids a static circular dependency between
        // heat-service ↔ heat-realtime (heat-service already imports
        // scoring-service which imports realtime helpers).
        const { endHeat } = await import('./heat-service');
        await endHeat(supabase, heatId);
      } catch (err) {
        console.warn('[useHeatParticipants] auto endHeat failed:', err);
        autoEndTriggeredRef.current = false;       // allow retry on next event
      }
    };

    const refetch = async () => {
      try {
        const list = await listHeatParticipants(supabase, heatId);
        if (cancelled) return;
        setParticipants(list);
        void maybeAutoEndHeat(list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      }
    };

    (async () => {
      await refetch();
      if (!cancelled) setLoading(false);
    })();

    channelRef.current = subscribeToHeat(supabase, heatId, {
      channelSuffix: 'participants',                 // isolated channel per hook
      onParticipantInsert: () => void refetch(),
      onParticipantUpdate: () => void refetch(),
    });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [heatId]);

  return { participants, loading, error };
}

/**
 * Subscribe to broadcast submission events (correct/incorrect signals).
 * Useful for animating the live leaderboard without DB round-trips.
 */
export function useHeatSubmissions(heatId: string | null | undefined): {
  lastSubmission: { athlete_id: string; question_number: number; is_correct: boolean } | null;
} {
  const [lastSubmission, setLastSubmission] = useState<
    { athlete_id: string; question_number: number; is_correct: boolean } | null
  >(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!heatId) return;
    const supabase = createClient();

    channelRef.current = subscribeToHeat(supabase, heatId, {
      channelSuffix: 'bus',                          // isolated channel per hook
      onSubmissionBroadcast: (payload) => setLastSubmission(payload),
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [heatId]);

  return { lastSubmission };
}
