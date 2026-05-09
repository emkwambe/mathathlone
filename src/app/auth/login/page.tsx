'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const { signIn, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in (e.g., user manually navigated here), redirect.
  // Middleware also handles this server-side, so this is just a UX nicety.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(next);
    }
  }, [authLoading, isAuthenticated, next, router]);

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

    // Don't redirect manually — the middleware will see the new session
    // cookie on the next request and route us correctly. Just trigger a
    // navigation to the destination.
    router.replace(next);
  };

  // Quick-fill helper for dev
  const fillDevAccount = (key: 'teacher' | 'mathlete-g7' | 'mathlete-g10') => {
    const map = {
      teacher: 'dev.teacher@test.com',
      'mathlete-g7': 'dev.mathlete.g7@test.com',
      'mathlete-g10': 'dev.mathlete.g10@test.com',
    };
    setEmail(map[key]);
    setPassword('devpass123');
  };

  // Disable the button only while a request is actually in flight.
  // We DON'T disable on authLoading — that initial check completes in <1s
  // and there's no harm in letting the user start typing.
  const buttonDisabled = submitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white">
              Math<span className="text-amber-400">Athlone</span>
            </h1>
          </Link>
          <p className="text-blue-200 mt-2">Welcome back, mathlete!</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="you@example.com"
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
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={buttonDisabled}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
              Register
            </Link>
          </div>
        </div>

        {/* Dev Quick-Fill (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-xl text-white text-sm">
            <p className="font-medium mb-2">🧪 Dev Quick-Fill</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDevAccount('teacher')}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs transition"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => fillDevAccount('mathlete-g7')}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs transition"
              >
                Mathlete G7
              </button>
              <button
                type="button"
                onClick={() => fillDevAccount('mathlete-g10')}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs transition"
              >
                Mathlete G10
              </button>
            </div>
            <p className="text-blue-200 text-xs mt-3">
              All dev accounts use password{' '}
              <code className="bg-white/10 px-1 rounded">devpass123</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
