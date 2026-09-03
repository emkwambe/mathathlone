// =============================================================================
// MathAthlone — /dashboard/broadcast  (Broadcast Host Dashboard)
// =============================================================================
// Read-only overlay dashboard for live event hosts / commentators.
// Shows: active heats, live standings for all leagues, recent results.
// No write actions — purely observational.
// =============================================================================
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';
import { Radio, Trophy, Zap, ArrowRight, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BroadcastDashboard() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, school_id, schools!users_school_id_fkey ( name )')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return <MissingProfile email={user.email} role="broadcast_host" />;

  const schoolId = (profile as any).school_id as string | null;

  // ── Active heats (status = 'active') ─────────────────────────────────────
  const { data: activeHeats } = await supabase
    .from('heats')
    .select('id, title, status, created_at, heat_participations ( count )')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  // ── Recent completed heats (last 24 h) ───────────────────────────────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentHeats } = await supabase
    .from('heats')
    .select('id, title, status, created_at, heat_participations ( count )')
    .eq('status', 'completed')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  // ── Top standings across all leagues (school scope if available) ──────────
  const leagueQuery = supabase
    .from('leagues')
    .select('id, name, level, status')
    .in('status', ['active', 'playoffs'])
    .order('level', { ascending: true })
    .limit(12);

  const { data: activeLeagues } = schoolId
    ? await leagueQuery.eq('school_id', schoolId)
    : await leagueQuery;

  const heatList = (activeHeats ?? []) as any[];
  const recentList = (recentHeats ?? []) as any[];
  const leagueList = (activeLeagues ?? []) as any[];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="border-b border-white/10 bg-[#0d1424]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold">
              Math<span className="text-amber-400">Athlone</span>
            </Link>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 text-xs font-medium border border-red-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              BROADCAST
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{(profile as any).display_name}</span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">Sign Out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Broadcast Center</h1>
          <p className="text-gray-400 text-sm">Live event overview — read-only</p>
        </div>

        {/* ── Active heats ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-red-400" />
            <h2 className="text-lg font-semibold">Live Heats</h2>
            {heatList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 text-xs font-medium border border-red-700/50">
                {heatList.length} active
              </span>
            )}
          </div>
          {heatList.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-gray-500 text-sm">
              No heats currently live.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {heatList.map((h: any) => (
                <Link key={h.id} href={`/compete/${h.id}`} className="flex items-center justify-between p-4 rounded-xl bg-red-900/20 border border-red-700/40 hover:bg-red-900/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="font-medium text-sm text-white">{h.title ?? 'Untitled Heat'}</p>
                      <p className="text-xs text-gray-400">{h.heat_participations?.[0]?.count ?? 0} participants</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Active leagues ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-semibold">Active Leagues</h2>
          </div>
          {leagueList.length === 0 ? (
            <p className="text-gray-500 text-sm">No active leagues found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {leagueList.map((l: any) => (
                <Link key={l.id} href={`/league/${l.id}`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div>
                    <p className="font-medium text-sm text-white">{l.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{l.level} · {l.status}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent results ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-lg font-semibold">Recent Results (last 24 h)</h2>
          </div>
          {recentList.length === 0 ? (
            <p className="text-gray-500 text-sm">No completed heats in the last 24 hours.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Heat</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Participants</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentList.map((h: any, i: number) => (
                    <tr key={h.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 font-medium text-white">{h.title ?? 'Untitled Heat'}</td>
                      <td className="px-4 py-3 text-gray-400">{h.heat_participations?.[0]?.count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(h.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/compete/${h.id}/results`} className="text-xs text-indigo-400 hover:text-indigo-300">
                          Results →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
