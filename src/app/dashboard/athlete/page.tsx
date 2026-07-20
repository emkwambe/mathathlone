import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';

export default async function AthleteDashboard() {
  const supabase = await createSupabaseServer();

  // Get current user (middleware already redirects unauthenticated users)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user profile. If it's missing we render a recoverable error instead
  // of redirecting — redirecting to /auth/login would bounce through the
  // middleware back to /dashboard → /dashboard/athlete → here, infinite loop.
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return <MissingProfile email={user.email} role="mathlete" />;
  }

  // Get user's ranking
  const { data: ranking } = await supabase
    .from('rankings')
    .select('*')
    .eq('athlete_id', user.id)
    .eq('season', '2025-2026')
    .single();

  // Get ELO rating (null if athlete hasn't played 1+ rated heat yet)
  const { data: eloRating } = await supabase
    .from('athlete_ratings')
    .select('rating, peak_rating, games_played, is_provisional, last_competition')
    .eq('athlete_id', user.id)
    .is('division_id', null)
    .maybeSingle();

  // Get recent ELO change (last 2 rating_history rows)
  let recentEloChange: number | null = null;
  if (eloRating && eloRating.games_played > 0) {
    const { data: recentHistory } = await supabase
      .from('rating_history')
      .select('rating_before, rating_after')
      .eq('athlete_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (recentHistory && recentHistory.length > 0) {
      const last = recentHistory[0] as any;
      recentEloChange = Number(last.rating_after) - Number(last.rating_before);
    }
  }

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

  // Derive ELO display values
  const eloValue = eloRating ? Math.round(Number(eloRating.rating)) : null;
  const eloPeak = eloRating ? Math.round(Number(eloRating.peak_rating)) : null;
  const eloGames = eloRating?.games_played ?? 0;
  const eloProvisional = eloRating?.is_provisional ?? true;

  // ELO tier label
  function eloTier(r: number): { label: string; color: string } {
    if (r >= 2200) return { label: 'Elite', color: '#a78bfa' };
    if (r >= 1800) return { label: 'Expert', color: '#6366f1' };
    if (r >= 1500) return { label: 'Advanced', color: '#3b82f6' };
    if (r >= 1300) return { label: 'Intermediate', color: '#10b981' };
    return { label: 'Developing', color: '#6b7280' };
  }
  const tier = eloValue ? eloTier(eloValue) : null;

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
          {/* Season Rank */}
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

        {/* ELO Rating Card */}
        <div className="bg-gradient-to-br from-indigo-950 to-violet-950 rounded-2xl p-6 mb-8 border border-indigo-800/40">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Your ELO Rating</h2>
              <p className="text-indigo-300 text-sm">
                {eloGames === 0
                  ? 'Complete your first rated Heat to earn a rating.'
                  : eloProvisional
                  ? `Provisional — ${eloGames} of 5 rated Heats completed`
                  : `Established • ${eloGames} rated Heats`}
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs text-indigo-300 hover:text-white border border-indigo-700 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition"
            >
              Global Leaderboard →
            </Link>
          </div>

          {eloValue ? (
            <div className="flex items-end gap-6">
              {/* Main rating */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white font-mono">{eloValue}</span>
                  {recentEloChange !== null && (
                    <span
                      className={`text-lg font-bold font-mono ${
                        recentEloChange > 0
                          ? 'text-emerald-400'
                          : recentEloChange < 0
                          ? 'text-red-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {recentEloChange > 0 ? '+' : ''}
                      {Math.round(recentEloChange)}
                    </span>
                  )}
                </div>
                {tier && (
                  <span
                    className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: tier.color, background: `${tier.color}22`, border: `1px solid ${tier.color}44` }}
                  >
                    {tier.label}
                  </span>
                )}
              </div>

              {/* Peak */}
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-200 font-mono">{eloPeak}</p>
                <p className="text-xs text-indigo-400">Peak</p>
              </div>

              {/* Progress bar toward next tier */}
              {eloValue < 2200 && (
                <div className="flex-1 max-w-xs">
                  {(() => {
                    const tiers = [800, 1300, 1500, 1800, 2200, 3000];
                    const tierNames = ['Developing', 'Intermediate', 'Advanced', 'Expert', 'Elite'];
                    const idx = tiers.findIndex((t) => eloValue < t) - 1;
                    const lo = tiers[Math.max(0, idx)];
                    const hi = tiers[Math.min(tiers.length - 1, idx + 1)];
                    const pct = Math.round(((eloValue - lo) / (hi - lo)) * 100);
                    const nextTier = tierNames[Math.min(idx + 1, tierNames.length - 1)];
                    return (
                      <>
                        <div className="flex justify-between text-xs text-indigo-400 mb-1">
                          <span>{lo}</span>
                          <span className="text-indigo-300">{nextTier} at {hi}</span>
                        </div>
                        <div className="h-2 bg-indigo-900/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                        <p className="text-xs text-indigo-400 mt-1">{pct}% to {nextTier}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <div className="text-4xl font-black text-indigo-700 font-mono">—</div>
              <p className="text-indigo-400 text-sm">
                Play a Heat to earn your first rating. Ratings unlock after your first scored competition.
              </p>
            </div>
          )}
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
