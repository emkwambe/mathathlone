import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';

export default async function TeacherDashboard() {
  const supabase = await createSupabaseServer();

  // Get current user (middleware already redirects unauthenticated users)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user profile with school. If it's missing we render a recoverable
  // error instead of redirecting — redirecting to /auth/login would bounce
  // through middleware back to /dashboard → /dashboard/teacher → here,
  // infinite loop.
  const { data: profile } = await supabase
    .from('users')
    .select(`
      *,
      schools!users_school_id_fkey ( name, district, state )
    `)
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) {
    return <MissingProfile email={user.email} role="teacher" />;
  }

  // Get teacher's classes with athlete counts
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      class_enrollments ( count )
    `)
    .eq('teacher_id', user.id)
    .eq('is_active', true);

  // Get recent heats created by this teacher
  const { data: recentHeats } = await supabase
    .from('heats')
    .select(`
      *,
      topics ( name ),
      heat_participations ( count )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile.display_name}! 👩‍🏫
          </h1>
          <p className="text-gray-600">
            {profile.schools?.name} • {profile.schools?.district}, {profile.schools?.state}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {/* Start Heat */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white flex flex-col">
            <h2 className="text-2xl font-bold mb-2">🏁 Start a Heat</h2>
            <p className="text-blue-100 mb-6 flex-1">
              Create a new competition for your class. Choose the topic and difficulty.
            </p>
            <Link
              href="/compete/create"
              className="inline-block self-start px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Create Heat
            </Link>
          </div>

          {/* Generate Assessment */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white flex flex-col">
            <h2 className="text-2xl font-bold mb-2">📋 Generate Assessment</h2>
            <p className="text-emerald-100 mb-6 flex-1">
              Build a printable take-home — Quiz, Homework, Unit Test, and more. No heat required.
            </p>
            <Link
              href="/assessment/generate"
              className="inline-block self-start px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition"
            >
              Generate Assessment
            </Link>
          </div>
        </div>

        {/* Classes */}
        {classes && classes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls: any) => (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
                >
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">Grade {cls.grade_level}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm text-gray-600">
                      {cls.class_enrollments?.[0]?.count || 0} mathletes
                    </span>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {cls.join_code}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Heats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Heats</h2>
          
          {recentHeats && recentHeats.length > 0 ? (
            <div className="space-y-3">
              {recentHeats.map((heat: any) => (
                <Link
                  key={heat.id}
                  href={`/compete/${heat.code}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {heat.topics?.name || 'Heat'} • <span className="font-mono">{heat.code}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {heat.started_at ? new Date(heat.started_at).toLocaleDateString() : 'Scheduled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      heat.status === 'complete' || heat.status === 'finished' ? 'bg-green-100 text-green-700' :
                      heat.status === 'active' || heat.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {heat.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {heat.heat_participations?.[0]?.count || 0} Mathletes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No Heats created yet. Start your first Heat to get your mathletes competing!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
