// =============================================================================
// MathAthlone — Supabase Browser Client (Singleton)
// =============================================================================
// Single browser client instance, lazy-initialized. Safe to import from
// client components even when Next.js renders them on the server during
// SSR/RSC pre-pass — the actual GoTrueClient only spins up in the browser.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL ' +
    'and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// -----------------------------------------------------------------------------
// THE SINGLETON
// -----------------------------------------------------------------------------

let _client: SupabaseClient | null = null;

// FIX 3 — Realtime heartbeat / reconnect tuning. A steady 15s heartbeat keeps
// idle WebSockets alive on networks that aggressively kill silent connections,
// and the backoff caps reconnect attempts at 10s so a dropped Heat channel
// re-joins quickly without hammering the server. Applied to every browser
// client (the heat-realtime hooks all open their channels through this).
const REALTIME_OPTIONS = {
  realtime: {
    heartbeatIntervalMs: 15000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000),
  },
} as const;

/**
 * Get the singleton browser Supabase client.
 *
 * SSR-safe: during Next.js server pre-render of client components, this
 * returns a fresh ephemeral client (no persistence, no cookie storage).
 * The "real" singleton is created on the actual browser hydration pass.
 *
 * USE IN: Client Components only ('use client')
 * For Server Components/Actions/Routes: use createSupabaseServer() from server.ts
 */
export function createClient(): SupabaseClient {
  // Always create a client. On the server side it'll have no persisted
  // session — just an empty in-memory shell. On the browser it'll be the
  // singleton with cookie-backed auth.
  if (typeof window === 'undefined') {
    // Server pre-render: ephemeral client, NOT cached. Each render gets fresh.
    return createBrowserClient(supabaseUrl!, supabaseAnonKey!, REALTIME_OPTIONS);
  }

  if (!_client) {
    _client = createBrowserClient(supabaseUrl!, supabaseAnonKey!, REALTIME_OPTIONS);
  }
  return _client;
}

/**
 * Legacy alias.
 * @deprecated Use createClient() directly
 */
export function createSupabaseBrowser(): SupabaseClient {
  return createClient();
}

// -----------------------------------------------------------------------------
// CONVENIENCE EXPORT
// -----------------------------------------------------------------------------

/**
 * Pre-instantiated singleton for client components.
 * On the server this is a Proxy that throws on use (not on import).
 */
export const supabase: SupabaseClient = (() => {
  if (typeof window === 'undefined') {
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Browser supabase client used in server context. ' +
          'Use createSupabaseServer() from @/lib/supabase/server instead.'
        );
      },
    });
  }
  return createClient();
})();

// -----------------------------------------------------------------------------
// REALTIME HELPERS
// -----------------------------------------------------------------------------

export const createHeatChannel = (heatId: string) => {
  return createClient().channel(`heat:${heatId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: 'athletes' },
    },
  });
};

// -----------------------------------------------------------------------------
// TYPE HELPERS
// -----------------------------------------------------------------------------

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;