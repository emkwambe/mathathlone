// =============================================================================
// MathAthlone — 404 Not Found (Sprint 6)
// =============================================================================

import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-400/10 border border-amber-400/30 mb-6">
          <Compass className="w-10 h-10 text-amber-300" />
        </div>
        <p className="text-amber-300 text-xs font-bold uppercase tracking-[0.3em] mb-2">
          404
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Page not found
        </h1>
        <p className="text-indigo-200 text-sm md:text-base mb-8">
          The page you're looking for moved, ended, or never existed. No worries —
          let's get you back to a Heat.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 text-indigo-950 text-sm font-bold hover:bg-amber-300 active:scale-[0.98] transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back home
          </Link>
          <Link
            href="/compete"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors min-h-[44px]"
          >
            Join a Heat
          </Link>
        </div>
      </div>
    </div>
  );
}
