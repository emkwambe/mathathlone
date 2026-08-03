// =============================================================================
// MathAthlone — /dashboard/parent  (Parent Dashboard)
// =============================================================================
// Read-only view for parents. Shows:
//   • Their linked child's profile + ELO rating
//   • Child's classroom league standing
//   • Child's recent heat results (last 10)
//   • Child's classroom league link
// Parents are linked to athletes via a parent_athlete_links table (if it exists)
// or via a parent_id FK on users. Falls back to showing school-wide public data.
// =============================================================================
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';
import { User, Trophy, TrendingUp, ArrowRight, Star } from 'lucide-react';

export default async function ParentDashboard() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, school_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return <MissingProfile email={user.email} role="parent" />;

  // ── Find linked child ─────────────────────────────────────────────────────
  // Try parent_athlete_links table first; fall back to users.parent_id
  let childProfile: any = null;

  let linkRow: { athlete_id: string } | null = null;
  try {
    const { data: lr } = await (supabase
      .from('parent_athlete_links' as any)
      .select('athlete_id')
      .eq('parent_id', user.id)
      .maybeSingle() as any);
    linkRow = lr as { athlete_id: string } | null;
  } catch {
    linkRow = null; // table may not exist yet
  }

  if (linkRow?.athlete_id) {
    const { data: child } = await supabase
      .from('users')
      .select('id, display_name, grade_level, avatar_url, school_id, schools!users_school_id_fkey ( name )')
      .eq('id', linkRow.athlete_id)
      .maybeSingle();
    childProfile = child;
  }

  // ── Child's ELO rating ────────────────────────────────────────────────────
  let childRating: number | null = null;
  let childDivision: string | null = null;
  if (childProfile?.id) {
    const { data: ratingRow } = await supabase
      .from('athlete_ratings')
      .select('rating, divisions:division_id ( name )')
      .eq('athlete_id', childProfile.id)
      .order('games_played', { ascending: false })
      .limit(1)
      .maybeSingle();
    childRating = ratingRow ? Number((ratingRow as any).rating) : null;
    childDivision = (ratingRow as any)?.divisions?.name ?? null;
  }

  // ── Child's classroom league standing ────────────────────────────────────
  let childStanding: any = null;
  let childLeague: any = null;
  if (childProfile?.id) {
    const { data: standing } = await supabase
      .from('league_standings')
      .select('rank, wins, losses, draws, points, current_elo, leagues:league_id ( id, name, level )')
      .eq('athlete_id', childProfile.id)
      .eq('leagues.level', 'classroom')
      .order('rank', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (standing) {
      childStanding = standing;
      childLeague = (standing as any).leagues;
    }
  }

  // ── Child's recent heat results ───────────────────────────────────────────
  let recentResults: any[] = [];
  if (childProfile?.id) {
    const { data: results } = await supabase
      .from('heat_participations')
      .select('rank_in_heat, cta_score, questions_correct, questions_attempted, total_time_ms, heats:heat_id ( title, created_at )')
      .eq('athlete_id', childProfile.id)
      .eq('status', 'finished')
      .order('created_at', { ascending: false, referencedTable: 'heats' })
      .limit(10);
    recentResults = (results ?? []) as any[];
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="border-b border-white/10 bg-[#0d1424]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Math<span className="text-amber-400">Athlone</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{(profile as any).display_name}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-medium border border-emerald-700/50">
              Parent
            </span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">Sign Out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Parent Dashboard</h1>
          <p className="text-gray-400 text-sm">Track your child's MathAthlone progress</p>
        </div>

        {/* ── No child linked ───────────────────────────────────────────────── */}
        {!childProfile && (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center space-y-3">
            <User className="w-10 h-10 text-gray-500 mx-auto" />
            <p className="text-gray-300 font-semibold">No athlete linked yet</p>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Ask your child's teacher to send you an invite link, or contact your school admin to link your account to your child's profile.
            </p>
          </div>
        )}

        {/* ── Child profile card ────────────────────────────────────────────── */}
        {childProfile && (
          <>
            <section className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-700 flex items-center justify-center text-lg font-bold text-white">
                  {childProfile.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{childProfile.display_name}</p>
                  <p className="text-sm text-gray-400">
                    Grade {childProfile.grade_level ?? '—'} · {childProfile.schools?.name ?? 'Unknown School'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-indigo-900/30 border border-indigo-700/40 p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">ELO Rating</p>
                  <p className="text-xl font-bold text-indigo-300">{childRating ?? '—'}</p>
                  {childDivision && <p className="text-[10px] text-gray-500 mt-0.5">{childDivision}</p>}
                </div>
                {childStanding && (
                  <>
                    <div className="rounded-lg bg-amber-900/30 border border-amber-700/40 p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">League Rank</p>
                      <p className="text-xl font-bold text-amber-300">#{childStanding.rank}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-900/30 border border-emerald-700/40 p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Record</p>
                      <p className="text-xl font-bold text-emerald-300">
                        {childStanding.wins}W–{childStanding.losses}L
                      </p>
                    </div>
                  </>
                )}
              </div>

              {childLeague && (
                <Link href={`/league/${childLeague.id}`} className="flex items-center justify-between p-3 rounded-lg bg-indigo-900/20 border border-indigo-700/30 hover:bg-indigo-900/40 transition-colors group">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-indigo-300">{childLeague.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </section>

            {/* ── Recent heat results ───────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-semibold">Recent Heats</h2>
              </div>
              {recentResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No heats completed yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Heat</th>
                        <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Rank</th>
                        <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">CTA</th>
                        <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map((r: any, i: number) => (
                        <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                          <td className="px-4 py-3 text-white">{r.heats?.title ?? 'Heat'}</td>
                          <td className="px-4 py-3 text-right text-gray-300">#{r.rank_in_heat}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-medium">{Number(r.cta_score ?? 0).toFixed(1)}</td>
                          <td className="px-4 py-3 text-right text-gray-400">{r.questions_correct ?? 0}/{r.questions_attempted ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
