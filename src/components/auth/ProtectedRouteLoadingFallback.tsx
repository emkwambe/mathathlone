'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogIn, RefreshCw } from 'lucide-react';

interface ProtectedRouteLoadingFallbackProps {
  loginHref: string;
  title?: string;
}

/**
 * A resilience boundary for protected client routes. Authentication hydration
 * normally lasts less than a second; if it exceeds the recovery threshold,
 * the user receives deterministic actions instead of an indefinite spinner.
 */
export function ProtectedRouteLoadingFallback({
  loginHref,
  title = 'Loading your workspace',
}: ProtectedRouteLoadingFallbackProps) {
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowRecovery(true), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 mx-auto animate-spin" />
        <h1 className="mt-4 text-base font-semibold text-gray-800">{title}</h1>
        {!showRecovery ? (
          <p className="mt-1 text-sm text-gray-500">Checking your secure session…</p>
        ) : (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-medium text-amber-900">This is taking longer than expected.</p>
            <p className="mt-1 text-sm text-amber-800">
              Your session may need to be refreshed. You can reload the page or sign in again safely.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
              >
                <RefreshCw className="w-4 h-4" />
                Reload page
              </button>
              <a
                href={loginHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <LogIn className="w-4 h-4" />
                Sign in again
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
