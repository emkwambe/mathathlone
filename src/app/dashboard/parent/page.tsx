import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';

export default async function ParentDashboard() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, country_code, school_id')
    .eq('id', user.id)
    .maybeSingle();

  // Render recoverable error instead of redirecting — see athlete/page.tsx
  // for why redirecting here would create an infinite middleware loop.
  if (!profile) {
    return <MissingProfile email={user.email} role="parent" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Math<span className="text-amber-500">Athlone</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{profile.display_name}</span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-gray-500 hover:text-gray-700">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile.display_name}! 👨‍👩‍👧
          </h1>
          <p className="text-gray-600">
            Parent / Guardian
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Family Dashboard
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            View your children's Heat results, manage parental consent, set time limits, and track progress. The parent experience is being built — check back soon.
          </p>
        </div>
      </main>
    </div>
  );
}