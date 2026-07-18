// =============================================================================
// MathAthlone — 403 Forbidden Page
// =============================================================================
// Shown when an authenticated user tries to access a route they don't have
// permission for (e.g., a Mathlete navigating to /dashboard/admin).
// =============================================================================

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Access Denied — MathAthlone',
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-2 text-sm font-semibold uppercase tracking-wider">
          Error 403 — Forbidden
        </p>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to view this page. If you believe this is a
          mistake, please contact your school administrator or{' '}
          <a href="mailto:support@mathathlone.com" className="text-blue-600 hover:underline">
            support@mathathlone.com
          </a>
          .
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
