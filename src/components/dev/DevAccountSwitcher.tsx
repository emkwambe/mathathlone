'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

interface DevAccount {
  email: string;
  password: string;
  role: string;
  label: string;
  icon: string;
}

// Dev accounts - set these up in Supabase with matching passwords
const DEV_ACCOUNTS: DevAccount[] = [
  {
    email: 'dev.mathlete.g7@test.com',
    password: 'devpass123',
    role: 'athlete',
    label: 'Mathlete (G7)',
    icon: '🧮',
  },
  {
    email: 'dev.mathlete.g10@test.com',
    password: 'devpass123',
    role: 'athlete',
    label: 'Mathlete (G10)',
    icon: '🧮',
  },
  {
    email: 'dev.teacher@test.com',
    password: 'devpass123',
    role: 'teacher',
    label: 'Teacher',
    icon: '👩‍🏫',
  },
  {
    email: 'dev.parent@test.com',
    password: 'devpass123',
    role: 'parent',
    label: 'Parent',
    icon: '👨‍👩‍👧',
  },
  {
    email: 'dev.admin@test.com',
    password: 'devpass123',
    role: 'school_admin',
    label: 'School Admin',
    icon: '🏫',
  },
  {
    email: 'dev.broadcast@test.com',
    password: 'devpass123',
    role: 'broadcast_host',
    label: 'Broadcast Host',
    icon: '📺',
  },
];

export default function DevAccountSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const switchAccount = async (account: DevAccount) => {
    setLoading(account.email);
    const supabase = createSupabaseBrowser();

    // Sign out current user
    await supabase.auth.signOut();

    // Sign in as new account
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (error) {
      console.error('Dev switch failed:', error.message);
      alert(`Failed to switch: ${error.message}\n\nMake sure dev accounts are set up in Supabase.`);
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
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition"
        title="Dev Account Switcher"
      >
        🔧
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-900 text-white text-sm font-medium">
            🔧 Dev Account Switcher
          </div>
          <div className="p-2">
            {DEV_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => switchAccount(account)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <span className="text-xl">{account.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{account.label}</p>
                  <p className="text-xs text-gray-500">{account.role}</p>
                </div>
                {loading === account.email && (
                  <span className="ml-auto text-xs text-blue-600">Loading...</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Dev mode only • Set up accounts in Supabase
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
