import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';

export default async function AthleteDashboard() {
  const supabase = await createSupabaseServer();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  // Get user's ranking
  const { data: ranking } = await supabase
    .from('rankings')
    .select('*')
    .eq('athlete_id', user.id)
    .eq('season', '2025-2026')
    .single();

  // Get recent participations
  const { data: recentHeats } = await supabase
    .from('heat_participations')
    .select(`
      *,
      heats (
        code,
        topic_id,
        type,
        started_at,
        topics ( name )
      )
    `)
    .eq('athlete_id', user.id)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(5);

  // Get medal counts
  const { data: medals } = await supabase
    .from('medals')
    .select('type')
    .eq('athlete_id', user.id);

  const medalCounts = {
    gold: medals?.filter(m => m.type === 'gold').length || 0,
    silver: medals?.filter(m => m.type === 'silver').length || 0,
    bronze: medals?.filter(m => m.type === 'bronze').length || 0,
  };

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
        {/* Welcome & Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.display_name}! 🧮
          </h1>
          <p className="text-gray-600">
            Grade {profile.grade_level} • {profile.country_code}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Medals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🥇</span>
              <span className="text-3xl font-bold text-amber-500">{medalCounts.gold}</span>
            </div>
            <p className="text-gray-500 text-sm">Gold Medals</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🥈</span>
              <span className="text-3xl font-bold text-gray-400">{medalCounts.silver}</span>
            </div>
            <p className="text-gray-500 text-sm">Silver Medals</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🥉</span>
              <span className="text-3xl font-bold text-amber-600">{medalCounts.bronze}</span>
            </div>
            <p className="text-gray-500 text-sm">Bronze Medals</p>
          </div>
          {/* Ranking */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-3xl font-bold text-blue-600">
                {ranking?.rank_position || '—'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">Season Rank</p>
          </div>
        </div>

        {/* Join Heat Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Compete?</h2>
          <p className="text-blue-100 mb-6">
            Join a Heat and test your skills against mathletes worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/compete"
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center"
            >
              Enter Heat Code
            </Link>
            <Link
              href="/compete"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition text-center"
            >
              Practice Heat
            </Link>
          </div>
        </div>

        {/* CTA Profile */}
        {ranking && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your CTA Profile</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Content</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${(ranking.avg_content_score || 0) / 10}%` }}
                  />
                </div>
                <p className="text-sm font-medium mt-1">{ranking.avg_content_score?.toFixed(0) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(ranking.avg_time_score || 0) / 10}%` }}
                  />
                </div>
                <p className="text-sm font-medium mt-1">{ranking.avg_time_score?.toFixed(0) || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Accuracy</p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${(ranking.avg_accuracy_score || 0) / 10}%` }}
                  />
                </div>
                <p className="text-sm font-medium mt-1">{ranking.avg_accuracy_score?.toFixed(0) || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Heats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My recent results</h2>
          {recentHeats && recentHeats.length > 0 ? (
            <div className="space-y-3">
              {recentHeats.map((participation: any) => {
                const heatCode = participation.heats?.code;
                const rank = participation.rank_in_heat;
                return (
                  <Link
                    key={participation.id}
                    href={heatCode ? `/compete/${heatCode}` : '/compete'}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition min-h-[44px]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {participation.heats?.topics?.name || 'Heat'}
                        {heatCode && (
                          <span className="ml-2 text-xs text-gray-400 font-mono">{heatCode}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participation.heats?.started_at
                          ? new Date(participation.heats.started_at).toLocaleDateString()
                          : '—'}
                        {rank && <span className="ml-2">· rank #{rank}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {participation.medal && (
                        <span className="text-xl" aria-label={`${participation.medal} medal`}>
                          {participation.medal === 'gold' ? '🥇' : participation.medal === 'silver' ? '🥈' : '🥉'}
                        </span>
                      )}
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {participation.cta_score != null
                            ? Number(participation.cta_score).toFixed(0)
                            : '—'}
                        </p>
                        <p className="text-xs text-gray-500">CTA</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No Heats completed yet.{' '}
              <Link href="/compete" className="text-blue-600 hover:underline">
                Join your first Heat
              </Link>{' '}
              to start competing!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
