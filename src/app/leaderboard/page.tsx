// =============================================================================
// MathAthlone — /leaderboard
// =============================================================================
// Global leaderboard page — shows top-rated athletes from the
// global_leaderboard materialized view (refreshed every 60 s via ISR).
//
// Falls back gracefully when the view is empty (no athlete has ≥5 games yet).
// =============================================================================
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';

export const revalidate = 60;

// Tier badge config
const TIERS: Array<{ min: number; label: string; color: string; bg: string }> = [
  { min: 2200, label: 'Elite',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { min: 1800, label: 'Expert',        color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { min: 1500, label: 'Advanced',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { min: 1300, label: 'Intermediate',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { min: 0,    label: 'Developing',    color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
];

function getTier(rating: number) {
  return TIERS.find((t) => rating >= t.min) ?? TIERS[TIERS.length - 1];
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_HUES = [210, 340, 160, 30, 270, 190, 0, 45];

export default async function LeaderboardPage() {
  const supabase = await createSupabaseServer();

  // Attempt to read from the materialized view; fall back to athlete_ratings
  // joined to users if the view isn't populated yet.
  let rows: any[] = [];
  const { data: viewData, error: viewErr } = await supabase
    .from('global_leaderboard')
    .select('*')
    .order('current_rating', { ascending: false })
    .limit(100);

  if (!viewErr && viewData && viewData.length > 0) {
    rows = viewData;
  } else {
    // Fallback: direct join (no 5-game floor)
    const { data: fallback } = await supabase
      .from('athlete_ratings')
      .select(`
        athlete_id,
        rating,
        peak_rating,
        games_played,
        is_provisional,
        users:athlete_id (
          display_name,
          grade_level,
          schools:school_id ( name, state )
        )
      `)
      .is('division_id', null)
      .order('rating', { ascending: false })
      .limit(100);

    rows = (fallback ?? []).map((r: any) => ({
      athlete_id: r.athlete_id,
      display_name: r.users?.display_name ?? 'Mathlete',
      grade_level: r.users?.grade_level ?? null,
      current_rating: r.rating,
      peak_rating: r.peak_rating,
      total_games: r.games_played,
      is_provisional: r.is_provisional,
      school_name: r.users?.schools?.name ?? null,
      school_state: r.users?.schools?.state ?? null,
      season_points: 0,
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Math<span className="text-amber-500">Athlone</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/dashboard/athlete" className="hover:text-blue-600 transition">Dashboard</Link>
            <Link href="/compete" className="hover:text-blue-600 transition">Compete</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">
            🏆 Global Leaderboard
          </h1>
          <p className="text-gray-500 text-sm">
            Top-rated Mathletes by ELO · Updated every 60 seconds
            {rows.length > 0 && ` · ${rows.length} ranked athletes`}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <p className="text-5xl mb-4">🧮</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No ratings yet</h2>
            <p className="text-gray-500 mb-6">
              Athletes appear here after completing their first rated Heat.
            </p>
            <Link
              href="/compete"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Join a Heat
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {rows.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[rows[1], rows[0], rows[2]].map((row, podiumIdx) => {
                  const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                  const tier = getTier(Number(row.current_rating));
                  const hue = AVATAR_HUES[(rank - 1) % AVATAR_HUES.length];
                  const podiumHeight = rank === 1 ? 'pt-0' : 'pt-6';
                  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                  return (
                    <div
                      key={row.athlete_id}
                      className={`flex flex-col items-center ${podiumHeight}`}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl mb-2 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${hue + 30},55%,40%))`,
                        }}
                      >
                        {initials(row.display_name)}
                      </div>
                      <span className="text-2xl mb-1">{medalEmoji}</span>
                      <p className="font-bold text-gray-900 text-sm text-center leading-tight">
                        {row.display_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">{row.school_name ?? ''}</p>
                      <p
                        className="text-lg font-black font-mono"
                        style={{ color: tier.color }}
                      >
                        {Math.round(Number(row.current_rating))}
                      </p>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded mt-1"
                        style={{ color: tier.color, background: tier.bg }}
                      >
                        {tier.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['#', 'Mathlete', 'School', 'ELO', 'Peak', 'Games', 'Tier'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider ${
                          i < 2 ? 'text-left' : 'text-center'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => {
                    const rank = i + 1;
                    const rating = Math.round(Number(row.current_rating));
                    const peak = Math.round(Number(row.peak_rating ?? row.current_rating));
                    const tier = getTier(rating);
                    const hue = AVATAR_HUES[i % AVATAR_HUES.length];
                    const medalColor =
                      rank === 1 ? 'text-amber-500' :
                      rank === 2 ? 'text-gray-400' :
                      rank === 3 ? 'text-amber-600' :
                      'text-gray-300';

                    return (
                      <tr
                        key={row.athlete_id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition"
                      >
                        {/* Rank */}
                        <td className={`px-4 py-3 font-black font-mono text-sm w-10 ${medalColor}`}>
                          {rank}
                        </td>
                        {/* Mathlete */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${hue + 30},55%,40%))`,
                              }}
                            >
                              {initials(row.display_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-tight">
                                {row.display_name}
                                {row.is_provisional && (
                                  <span className="ml-1.5 text-xs text-gray-400 font-normal">(P)</span>
                                )}
                              </p>
                              {row.grade_level && (
                                <p className="text-xs text-gray-400">Grade {row.grade_level}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* School */}
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[160px] truncate">
                          {row.school_name
                            ? `${row.school_name}${row.school_state ? `, ${row.school_state}` : ''}`
                            : '—'}
                        </td>
                        {/* ELO */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className="font-black font-mono text-base"
                            style={{ color: tier.color }}
                          >
                            {rating}
                          </span>
                        </td>
                        {/* Peak */}
                        <td className="px-4 py-3 text-center text-sm font-mono text-gray-400">
                          {peak}
                        </td>
                        {/* Games */}
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {row.total_games ?? 0}
                        </td>
                        {/* Tier */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ color: tier.color, background: tier.bg }}
                          >
                            {tier.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              (P) = Provisional — fewer than 5 rated Heats completed
            </p>
          </>
        )}
      </main>
    </div>
  );
}
