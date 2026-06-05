'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// -----------------------------------------------------------------------------
// HEAT CODE NORMALIZATION
// -----------------------------------------------------------------------------
// Canonical form: "MA-XXXX". Mirrors the per-keystroke normalizer on /compete
// so a Mathlete can paste a code straight into the login form and get pushed
// to /compete/[code] after sign-in. See src/app/compete/page.tsx for the full
// rule table.

const HEAT_CODE_PATTERN = /^MA-[A-Z0-9]{4}$/;

function normalizeHeatCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned === 'M') return 'M';
  if (cleaned.startsWith('MA')) {
    const body = cleaned.slice(2);
    return body.length > 0 ? `MA-${body.slice(0, 4)}` : 'MA-';
  }
  return `MA-${cleaned.slice(0, 4)}`;
}

// -----------------------------------------------------------------------------
// SHARED HELPERS
// -----------------------------------------------------------------------------

function safeNext(next: string | null): string | null {
  if (!next) return null;
  // Local paths only — never let a malicious ?next= bounce us off-site.
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.startsWith('/auth/')) return null;          // avoid login→login loop
  return next;
}

// -----------------------------------------------------------------------------
// ROOT — switches between role picker / educator form / mathlete form
// -----------------------------------------------------------------------------

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = searchParams.get('role');
  const next = safeNext(searchParams.get('next'));

  const { isAuthenticated, loading: authLoading } = useAuth();

  // Already signed in → bounce to the right destination immediately. The
  // middleware also enforces this server-side; this is just a UX nicety
  // so the form doesn't flash before the redirect.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    router.replace(next ?? '/dashboard');
  }, [authLoading, isAuthenticated, next, router]);

  if (role === 'educator' || role === 'teacher') {
    return <EducatorLogin next={next} />;
  }
  if (role === 'mathlete' || role === 'athlete') {
    return <MathleteLogin next={next} />;
  }
  return <RolePicker next={next} />;
}

// -----------------------------------------------------------------------------
// ROLE PICKER
// -----------------------------------------------------------------------------

function RolePicker({ next }: { next: string | null }) {
  const qs = next ? `&next=${encodeURIComponent(next)}` : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
          </Link>
          <p className="text-blue-200 mt-2">Sign in to continue</p>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Educator */}
          <Link
            href={`/auth/login?role=educator${qs}`}
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mb-5">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              I&apos;m an Educator
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              Teachers, coaches, and school administrators
            </p>
            <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Mathlete */}
          <Link
            href={`/auth/login?role=mathlete${qs}`}
            className="group bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-0.5 transition-all text-black"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/15 text-black mb-5">
              <Flame className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold mb-1">I&apos;m a Mathlete</h2>
            <p className="text-black/70 text-sm mb-5">
              Students and competitors
            </p>
            <span className="inline-flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all">
              Join the Arena
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Register link */}
        <div className="text-center mt-8 text-sm text-blue-100">
          New to MathAthlone?{' '}
          <Link href="/auth/register" className="font-semibold text-white hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// EDUCATOR LOGIN
// -----------------------------------------------------------------------------

function EducatorLogin({ next }: { next: string | null }) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    router.replace(next ?? '/dashboard/teacher');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
          </Link>
          <p className="text-blue-200 mt-2">Welcome back, coach!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back to role picker */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Educator Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="................"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            New here?{' '}
            <Link
              href="/auth/register?role=teacher"
              className="text-blue-600 font-medium hover:underline"
            >
              Create an educator account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MATHLETE LOGIN — sign-in + optional Heat code in one step
// -----------------------------------------------------------------------------

function MathleteLogin({ next }: { next: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const initialCode = searchParams.get('code') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rawCode, setRawCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizedCode = useMemo(() => normalizeHeatCode(rawCode), [rawCode]);
  const codeIsBlank = normalizedCode === '';
  const codeIsWellFormed = HEAT_CODE_PATTERN.test(normalizedCode);
  const codeIsValid = codeIsBlank || codeIsWellFormed;

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!codeIsValid) {
        setError('Heat codes look like MA-XXXX. Leave it empty if you don’t have one.');
        return;
      }

      setSubmitting(true);

      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
        setSubmitting(false);
        return;
      }

      // Destination priority:
      //   1. ?next= (explicit redirect from a protected page)
      //   2. Heat code typed on this form
      //   3. /compete (join page) as a sane default
      const dest = next
        ?? (codeIsWellFormed ? `/compete/${normalizedCode}` : '/compete');
      router.replace(dest);
    },
    [codeIsValid, codeIsWellFormed, normalizedCode, signIn, email, password, next, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
          </Link>
          <p className="text-indigo-200 mt-2">Ready to compete?</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl p-6 md:p-8">
          {/* Back to role picker */}
          <Link
            href={next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login'}
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-black">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-white">Mathlete Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Heat code (optional, at the top by design) */}
            <div>
              <label htmlFor="heat-code" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Have a Heat code? (optional)
              </label>
              <input
                id="heat-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                maxLength={8}
                value={normalizedCode}
                onChange={(e) => setRawCode(e.target.value)}
                placeholder="MA-XXXX"
                className="w-full px-4 py-3.5 text-center text-xl font-mono font-bold tracking-[0.25em] bg-white/15 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
              />
              <p className="mt-1.5 text-xs text-white/40">
                Drop you straight into the lobby after sign-in. Skip it to land on the join page.
              </p>
            </div>

            <div className="border-t border-white/10 my-4" />

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-white/80">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-amber-300 hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 outline-none transition"
                placeholder="................"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !codeIsValid}
              className={`w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                submitting || !codeIsValid
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 active:scale-[0.98]'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : codeIsWellFormed ? (
                <>
                  Sign in &amp; Join {normalizedCode}
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/60">
            New here?{' '}
            <Link
              href="/auth/register?role=athlete"
              className="text-amber-300 font-medium hover:underline"
            >
              Create a Mathlete account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUSPENSE WRAPPER
// -----------------------------------------------------------------------------
// Required because LoginPageInner / MathleteLogin call useSearchParams(),
// which Next.js 14 production builds will refuse to prerender without a
// surrounding <Suspense> boundary.

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
