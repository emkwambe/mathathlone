// =============================================================================
// MathAthlone — /compete (Join Heat)
// =============================================================================
// Sprint 3 — Student lands here from a teacher's invite, types the Heat
// code (MA-XXXX) and lands in the lobby at /compete/[code].
//
// Flow:
//   1. Accept input, normalize to MA-XXXX form (case-insensitive, dash optional)
//   2. Verify Heat exists and is in a joinable status (lobby / open / scheduled)
//   3. If unauthenticated → redirect to /auth/login?next=/compete/[code]
//   4. If authenticated → push to /compete/[code]; that page handles joinHeat()
//
// We intentionally do NOT call joinHeat() here — auto-join lives on the
// lobby page so refreshes / direct links also trigger it.
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  Loader2,
  Plus,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// -----------------------------------------------------------------------------
// CODE NORMALIZATION
// -----------------------------------------------------------------------------
// Accepted variants: "ma-7x4k", "MA7X4K", "7X4K", "ma  7x4k"
// Canonical form:    "MA-7X4K"

const HEAT_CODE_PATTERN = /^MA-[A-Z0-9]{4}$/;

function normalizeHeatCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.startsWith('MA')) {
    const body = cleaned.slice(2);
    return body.length > 0 ? `MA-${body.slice(0, 4)}` : 'MA-';
  }
  return `MA-${cleaned.slice(0, 4)}`;
}

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

export default function JoinHeatPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [rawCode, setRawCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const normalized = useMemo(() => normalizeHeatCode(rawCode), [rawCode]);
  const isWellFormed = HEAT_CODE_PATTERN.test(normalized);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleChange = useCallback((value: string) => {
    setRawCode(value);
    if (error) setError(null);
  }, [error]);

  const handleJoin = useCallback(async () => {
    if (!isWellFormed) {
      setError('Heat codes look like MA-XXXX. Check with your teacher.');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      // Quick existence check before redirecting — better UX than landing
      // on the lobby and seeing a "not found" screen.
      const { data: heat, error: lookupErr } = await supabase
        .from('heats')
        .select('id, status')
        .eq('code', normalized)
        .maybeSingle();

      if (lookupErr) {
        throw new Error(lookupErr.message);
      }
      if (!heat) {
        setError(`Heat ${normalized} not found. Check the code and try again.`);
        return;
      }

      const joinable = ['lobby', 'open', 'scheduled'];
      const inProgress = ['countdown', 'active', 'in_progress'];

      if (inProgress.includes(heat.status)) {
        setError('This Heat is already in progress. Ask your teacher for the next one.');
        return;
      }
      if (!joinable.includes(heat.status)) {
        setError(`This Heat is ${heat.status} — it cannot be joined right now.`);
        return;
      }

      // Authenticated → straight to lobby (auto-join lives there).
      // Unauthenticated → bounce through login with `next` preserved.
      if (!isAuthenticated) {
        router.push(`/auth/login?next=${encodeURIComponent(`/compete/${normalized}`)}`);
        return;
      }

      router.push(`/compete/${normalized}`);
    } catch (err: any) {
      console.error('[JoinHeat] lookup failed:', err);
      setError(err?.message ?? 'Could not look up that Heat. Try again.');
    } finally {
      setChecking(false);
    }
  }, [isWellFormed, normalized, supabase, isAuthenticated, router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void handleJoin();
    },
    [handleJoin]
  );

  // Auto-submit on `Enter` is handled by the form. We also listen for the
  // user pasting a full code and let them submit immediately.
  useEffect(() => {
    if (isWellFormed && error) setError(null);
  }, [isWellFormed, error]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4">
            <Flame className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Join a Heat</h1>
          <p className="text-indigo-200 text-sm">
            Enter the code your teacher shared with you
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-6 md:p-8 shadow-2xl"
        >
          <label htmlFor="heat-code" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
            Heat code
          </label>
          <input
            id="heat-code"
            type="text"
            inputMode="text"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            maxLength={8}
            value={normalized || rawCode.toUpperCase()}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="MA-XXXX"
            className="w-full px-4 py-4 text-center text-2xl md:text-3xl font-mono font-bold tracking-[0.3em] bg-white/15 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
            aria-invalid={!!error}
            aria-describedby={error ? 'heat-code-error' : undefined}
          />

          {error && (
            <div
              id="heat-code-error"
              className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 text-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isWellFormed || checking || authLoading}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
              !isWellFormed || checking || authLoading
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 active:scale-[0.98]'
            }`}
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                Join Heat
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-white/40 text-xs mt-4">
            Codes look like <span className="font-mono">MA-7X4K</span>
          </p>
        </form>

        {/* Footer: link to create page for teachers */}
        <div className="mt-6 text-center">
          <Link
            href="/compete/create"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Or create a new Heat
          </Link>
        </div>
      </div>
    </div>
  );
}
