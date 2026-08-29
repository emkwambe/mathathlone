'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

interface DevAccount {
  email: string;
  role: string;
  label: string;
  icon: string;
}

// This component is excluded from production rendering. Account identities are
// useful for local role testing, but credentials must never be committed or
// embedded in a client bundle. Supply a locally managed password at run time.
const DEV_ACCOUNTS: DevAccount[] = [
  { email: 'dev.mathlete.g7@test.com', role: 'athlete', label: 'Mathlete (G7)', icon: '🧮' },
  { email: 'dev.mathlete.g10@test.com', role: 'athlete', label: 'Mathlete (G10)', icon: '🧮' },
  { email: 'dev.teacher@test.com', role: 'teacher', label: 'Teacher', icon: '👩‍🏫' },
  { email: 'dev.parent@test.com', role: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { email: 'dev.admin@test.com', role: 'school_admin', label: 'School Admin', icon: '🏫' },
  { email: 'dev.broadcast@test.com', role: 'broadcast_host', label: 'Broadcast Host', icon: '📺' },
];

export default function DevAccountSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep the tool completely absent in production. Never change this guard to
  // a public feature flag; it is intentionally limited to local development.
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const switchAccount = async (account: DevAccount) => {
    const suppliedPassword = password.trim();
    if (!suppliedPassword) {
      setError('Enter the account password stored in your private local credentials.');
      return;
    }

    setLoading(account.email);
    setError(null);
    const supabase = createSupabaseBrowser();

    await supabase.auth.signOut();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: suppliedPassword,
    });

    if (signInError) {
      setError('Sign-in failed. Verify the locally stored development credentials.');
      setLoading(null);
      return;
    }

    setLoading(null);
    setIsOpen(false);
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition"
        title="Development Account Switcher"
        aria-expanded={isOpen}
        aria-controls="dev-account-switcher"
      >
        🔧
      </button>

      {isOpen && (
        <div id="dev-account-switcher" className="absolute bottom-16 right-0 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-900 text-white text-sm font-medium">
            Development Account Switcher
          </div>
          <div className="p-3 border-b border-gray-100">
            <label htmlFor="dev-account-password" className="block text-xs font-medium text-gray-700 mb-1">
              Local development password
            </label>
            <input
              id="dev-account-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Not stored or committed"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
            {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
          <div className="p-2">
            {DEV_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => switchAccount(account)}
                disabled={loading !== null || !password.trim()}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-xl">{account.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{account.label}</p>
                  <p className="text-xs text-gray-500">{account.role}</p>
                </div>
                {loading === account.email && (
                  <span className="ml-auto text-xs text-blue-600">Loading…</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Local development only · credentials stay outside Git
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
