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
}

/**
 * Subscribe to a Heat's lifecycle on the underlying Supabase channel.
 * Returns the channel so callers can later unsubscribe via
 * `supabase.removeChannel(channel)`.
 */
export function subscribeToHeat(
  supabase: SupabaseClient,
  heatId: string,
  opts: SubscribeOptions
): RealtimeChannel {
  const channel = supabase.channel(`heat:${heatId}`);

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

  useEffect(() => {
    if (!heatId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data, error: fetchError } = await supabase
        .from('heats')
        .select('*')
        .eq('id', heatId)
        .maybeSingle();
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      if (data) {
        setHeat(data as Heat);
        setStatus((data as Heat).status);
      }
      setLoading(false);
    })();

    channelRef.current = subscribeToHeat(supabase, heatId, {
      onHeatUpdate: (partial) => {
        setHeat((prev) => (prev ? { ...prev, ...partial } : (partial as Heat)));
        if (partial.status) setStatus(partial.status);
      },
    });

    return () => {
      cancelled = true;
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

  useEffect(() => {
    if (!heatId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    const refetch = async () => {
      try {
        const list = await listHeatParticipants(supabase, heatId);
        if (!cancelled) setParticipants(list);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      }
    };

    (async () => {
      await refetch();
      if (!cancelled) setLoading(false);
    })();

    channelRef.current = subscribeToHeat(supabase, heatId, {
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
