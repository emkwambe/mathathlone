import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';
import AdvancementEligiblePanel from '@/components/teacher/AdvancementEligiblePanel';

export const dynamic = 'force-dynamic';

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

  // For each class, look up its classroom league (level = 'classroom', name matches class)
  // We join via league_memberships → leagues to find which classroom league belongs to each class.
  // Since classroom leagues are named after the class, we match by school_id + level + name.
  // More robustly: query all classroom leagues for this teacher's school and match by name.
  let classLeagueMap: Record<string, { id: string; name: string }> = {};
  if (profile.school_id && classes && classes.length > 0) {
    const { data: classroomLeagues } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('school_id', profile.school_id)
      .eq('level', 'classroom');

    if (classroomLeagues) {
      // Map by normalised name: match league name to class name
      for (const league of classroomLeagues) {
        const matchingClass = (classes as any[]).find(
          (cls) => cls.name === league.name || league.name.includes(cls.name)
        );
        if (matchingClass) {
          classLeagueMap[matchingClass.id] = { id: league.id, name: league.name };
        }
      }
    }
  }

  // Get advancement-eligible students across all classes taught by this teacher.
  // A student is eligible when their athlete_ratings.advancement_eligible = true.
  let advancementStudents: Array<{ athlete_id: string; display_name: string; grade_level: number | null; rating: number; division_id: string; division_name: string | null; class_name: string }> = [];
  if (classes && classes.length > 0) {
    const classIds = (classes as any[]).map((c) => c.id);
    const { data: advData } = await supabase
      .from('class_enrollments')
      .select(`
        classes:class_id ( name ),
        users:athlete_id (
          display_name, grade_level,
          athlete_ratings (
            rating,
            advancement_eligible,
            divisions:division_id ( name )
          )
        )
      `)
      .in('class_id', classIds);
    if (advData) {
      for (const row of advData as any[]) {
        const u = row.users;
        if (!u) continue;
        const eligibleRating = (u.athlete_ratings ?? []).find((r: any) => r.advancement_eligible === true);
        if (eligibleRating) {
          advancementStudents.push({
            athlete_id: u.id ?? '',
            display_name: u.display_name ?? 'Mathlete',
            grade_level: u.grade_level ?? null,
            rating: eligibleRating.rating ?? 0,
            division_id: eligibleRating.division_id ?? '',
            division_name: eligibleRating.divisions?.name ?? null,
            class_name: row.classes?.name ?? 'Unknown Class',
          });
        }
      }
    }
  }

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
            <Link href="/leaderboard" className="text-sm text-gray-500 hover:text-blue-600 transition">
              Leaderboard
            </Link>
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
          {(profile as any).schools?.name && (
            <p className="text-gray-600">
              {(profile as any).schools.name}
              {(profile as any).schools.district ? ` • ${(profile as any).schools.district}` : ''}
              {(profile as any).schools.state ? `, ${(profile as any).schools.state}` : ''}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {/* Classes & Roster */}
          <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-2xl p-8 text-white flex flex-col">
            <h2 className="text-2xl font-bold mb-2">👥 Classes &amp; Roster</h2>
            <p className="text-sky-100 mb-6 flex-1">
              Set up your classes, import Mathletes, and print private login cards before a classroom Heat.
            </p>
            <Link
              href="/dashboard/teacher/classes"
              className="inline-block self-start px-6 py-3 bg-white text-sky-700 font-semibold rounded-lg hover:bg-sky-50 transition"
            >
              Manage Classes
            </Link>
          </div>

          {/* Create League */}
          <div className="bg-gradient-to-r from-violet-700 to-purple-700 rounded-2xl p-8 text-white flex flex-col">
            <h2 className="text-2xl font-bold mb-2">🏟️ Create a League</h2>
            <p className="text-violet-200 mb-6 flex-1">
              Run a season-long bracket competition for your class or school. ELO ratings, standings, and championship points included.
            </p>
            <Link
              href="/league/create"
              className="inline-block self-start px-6 py-3 bg-white text-violet-700 font-semibold rounded-lg hover:bg-violet-50 transition"
            >
              Create League
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
              {(classes as any[]).map((cls) => {
                const league = classLeagueMap[cls.id] ?? null;
                return (
                  <div
                    key={cls.id}
                    className="p-4 border border-gray-200 rounded-lg flex flex-col gap-3"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-500">Grade {cls.grade_level}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {cls.class_enrollments?.[0]?.count || 0} mathletes
                      </span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {cls.join_code}
                      </span>
                    </div>
                    {/* Classroom league link */}
                    {league ? (
                      <Link
                        href={`/league/${league.id}`}
                        className="flex items-center justify-between px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition text-sm font-medium text-indigo-700"
                      >
                        <span>🏫 View Classroom League</span>
                        <span className="text-indigo-400">→</span>
                      </Link>
                    ) : (
                      <p className="text-xs text-gray-400">No classroom league yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Advancement Eligible Students */}
        <AdvancementEligiblePanel students={advancementStudents} />

        {/* Recent Heats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Heats</h2>

          {recentHeats && recentHeats.length > 0 ? (
            <div className="space-y-3">
              {(recentHeats as any[]).map((heat) => (
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
