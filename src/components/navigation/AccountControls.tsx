'use client';

import Link from 'next/link';
import { LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AccountControlsProps = {
  tone?: 'dark' | 'light';
};

const TONES = {
  dark: {
    wrapper: 'text-slate-200',
    identity: 'text-slate-300',
    link: 'border-white/15 bg-white/[0.06] text-white hover:bg-white/10',
    signOut: 'border-white/15 text-slate-200 hover:bg-white/10 hover:text-white',
  },
  light: {
    wrapper: 'text-slate-700',
    identity: 'text-slate-600',
    link: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    signOut: 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  },
} as const;

/**
 * Compact, role-aware account controls for operational pages that do not use
 * the full dashboard header. The existing server-side POST /auth/signout route
 * remains the only logout mechanism; this component exposes it visibly.
 */
export default function AccountControls({ tone = 'dark' }: AccountControlsProps) {
  const { claims, isAuthenticated, loading, profile, user } = useAuth();
  const styles = TONES[tone];

  if (loading) {
    return <span className={`text-xs ${styles.identity}`}>Checking account…</span>;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login?role=mathlete"
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.link}`}
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in
      </Link>
    );
  }

  const isMathlete = claims?.user_role === 'mathlete';
  const homeHref = isMathlete ? '/dashboard/athlete' : '/dashboard';
  const homeLabel = isMathlete ? 'Mathlete Home' : 'Dashboard';
  const identity = profile?.display_name || user?.email || 'Signed in';

  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${styles.wrapper}`}>
      <span className={`hidden max-w-44 truncate text-sm sm:inline ${styles.identity}`} title={identity}>
        {identity}
      </span>
      <Link
        href={homeHref}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.link}`}
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        {homeLabel}
      </Link>
      <form action="/auth/signout" method="POST">
        <button
          type="submit"
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${styles.signOut}`}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );
}
