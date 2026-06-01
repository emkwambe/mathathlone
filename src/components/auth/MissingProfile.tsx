// =============================================================================
// MathAthlone — Missing Profile Fallback
// =============================================================================
// Rendered when an authenticated user has no row in public.users (the
// handle_new_user_v2 trigger didn't fire, RLS blocks SELECT, or a dev account
// was inserted via Studio without a profile row).
//
// Previously the dashboard subpages redirected to /auth/login in this case,
// but the middleware then bounces authenticated users off /auth/login to
// /dashboard, which redirects to /dashboard/{role}, which loops back here —
// an infinite 307 cascade. Rendering an actionable error instead breaks the
// loop while still surfacing the data-integrity issue to the user.
// =============================================================================

import Link from 'next/link';

interface MissingProfileProps {
  email?: string | null;
  role?: string;
}

export default function MissingProfile({ email, role }: MissingProfileProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-4">
            <span className="text-3xl" aria-hidden>
              ⚙️
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Your account needs setup
          </h1>
          <p className="text-sm text-gray-600">
            You&apos;re signed in
            {email ? (
              <>
                {' '}
                as <span className="font-mono text-gray-900">{email}</span>
              </>
            ) : null}
            , but we couldn&apos;t find your Mathlete profile in our database.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6 text-sm text-gray-700 space-y-2">
          <p className="font-semibold">This usually means one of:</p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            <li>
              The <code className="bg-gray-200 px-1 rounded">handle_new_user_v2</code>{' '}
              trigger didn&apos;t fire when your account was created
            </li>
            <li>Row-level security is blocking the lookup</li>
            <li>
              An admin created your auth account but didn&apos;t insert a{' '}
              <code className="bg-gray-200 px-1 rounded">public.users</code> row
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="block w-full text-center py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition min-h-[44px]"
            >
              Sign out and try again
            </button>
          </form>
          <Link
            href="/"
            className="block w-full text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition min-h-[44px] flex items-center justify-center"
          >
            Back to homepage
          </Link>
        </div>

        {role && (
          <p className="text-center text-xs text-gray-400 mt-6 font-mono">
            requested role: {role}
          </p>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Stuck? Email{' '}
          <a
            href="mailto:eddy@mpingosystems.com"
            className="text-indigo-600 hover:underline"
          >
            eddy@mpingosystems.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
