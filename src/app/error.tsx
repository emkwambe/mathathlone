'use client';

// =============================================================================
// MathAthlone — Root Error Boundary (Sprint 6)
// =============================================================================
// Caught when any client component below throws. Replaces Next.js's default
// "Application error" screen with a friendly, on-brand recovery panel.
// =============================================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  // Surface to the console so devs can still see it during local work.
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  const isAuth =
    /auth|session|jwt|unauthor/i.test(error?.message ?? '') ||
    /auth|session|jwt|unauthor/i.test((error as any)?.code ?? '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-400/30 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-300" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {isAuth ? 'Your session expired' : 'Something went wrong'}
        </h1>
        <p className="text-indigo-200 text-sm md:text-base mb-8">
          {isAuth
            ? 'For your security we signed you out. Log back in to keep going.'
            : 'We hit an unexpected error. The team has been notified — try refreshing or head back home.'}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {isAuth ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-indigo-950 text-sm font-bold hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
            >
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-indigo-950 text-sm font-bold hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
            >
              <RotateCw className="w-4 h-4" />
              Try again
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back home
          </Link>
        </div>

        {error?.digest && (
          <p className="mt-6 text-xs text-white/30 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
