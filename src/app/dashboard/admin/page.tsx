// =============================================================================
// MathAthlone — /dashboard/admin  (School Admin Dashboard)
// =============================================================================
// Server component. Fetches:
//   • Admin profile + school info
//   • All teachers in the school
//   • All classroom leagues in the school (with standings counts)
//   • School-level league (if it exists)
//   • Pending advancement alert
// =============================================================================
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';
import { Users, BookOpen, Trophy, TrendingUp, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*, schools!users_school_id_fkey ( id, name, district, state )')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return <MissingProfile email={user.email} role="school_admin" />;

  const schoolId = (profile as any).school_id as string | null;
  const schoolName = (profile as any).schools?.name ?? 'Your School';
  const district = (profile as any).schools?.district ?? '';

  const { data: teachers } = schoolId
    ? await supabase
        .from('users')
        .select('id, display_name, email, created_at')
        .eq('school_id', schoolId)
        .eq('role', 'teacher')
        .order('display_name', { ascending: true })
    : { data: [] };

  const { data: classroomLeagues } = schoolId
    ? await supabase
        .from('leagues')
        .select('id, name, status, league_standings ( count ), league_advancement!league_advancement_source_league_id_fkey ( slots_allocated, target_league_id )')
        .eq('school_id', schoolId)
        .eq('level', 'classroom')
        .order('name', { ascending: true })
    : { data: [] };

  const { data: schoolLeagues } = schoolId
    ? await supabase
        .from('leagues')
        .select('id, name, status')
        .eq('school_id', schoolId)
        .eq('level', 'school')
        .order('created_at', { ascending: false })
        .limit(1)
    : { data: [] };

  const schoolLeague = schoolLeagues?.[0] ?? null;

  const { count: mathleteCount } = schoolId
    ? await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'athlete')
    : { count: 0 };

  const teacherList = (teachers ?? []) as any[];
  const classLeagueList = (classroomLeagues ?? []) as any[];
  const pendingAdvancement = schoolLeague == null && classLeagueList.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="border-b border-white/10 bg-[#0d1424]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Math<span className="text-amber-400">Athlone</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{(profile as any).display_name}</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-medium border border-indigo-700/50">
              School Admin
            </span>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">Sign Out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">{schoolName}</h1>
          <p className="text-gray-400 text-sm">{district} · School Admin Dashboard</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-indigo-400" />} label="Mathletes" value={String(mathleteCount ?? 0)} bg="bg-indigo-900/30" />
          <StatCard icon={<BookOpen className="w-5 h-5 text-emerald-400" />} label="Teachers" value={String(teacherList.length)} bg="bg-emerald-900/30" />
          <StatCard icon={<Trophy className="w-5 h-5 text-amber-400" />} label="Classroom Leagues" value={String(classLeagueList.length)} bg="bg-amber-900/30" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-violet-400" />} label="School League" value={schoolLeague ? 'Active' : 'Not started'} bg="bg-violet-900/30" />
        </div>

        {pendingAdvancement && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/30 border border-amber-700/50">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">School League not yet created</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Classroom leagues are running but no school-level league exists yet. Call{' '}
                <code className="bg-amber-900/60 px-1 rounded">POST /api/league/split/close</code> to
                trigger advancement and seed the school league bracket.
              </p>
            </div>
          </div>
        )}

        {schoolLeague && (
          <section>
            <h2 className="text-lg font-semibold mb-3">School League</h2>
            <Link href={`/league/${schoolLeague.id}`} className="flex items-center justify-between p-4 rounded-xl bg-indigo-900/30 border border-indigo-700/50 hover:bg-indigo-900/50 transition-colors group">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="font-semibold text-white">{(schoolLeague as any).name}</p>
                  <p className="text-xs text-indigo-300 capitalize">{(schoolLeague as any).status}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Classroom Leagues</h2>
          {classLeagueList.length === 0 ? (
            <p className="text-gray-500 text-sm">No classroom leagues found for this school.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classLeagueList.map((league: any) => {
                const standingCount = league.league_standings?.[0]?.count ?? 0;
                const adv = league.league_advancement?.[0];
                return (
                  <Link key={league.id} href={`/league/${league.id}`} className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-white truncate">{league.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${league.status === 'active' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {league.status ?? 'pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{standingCount} mathletes</span>
                      {adv && (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <TrendingUp className="w-3 h-3" />
                          Top {adv.slots_allocated} advance
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all self-end" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Teachers</h2>
          {teacherList.length === 0 ? (
            <p className="text-gray-500 text-sm">No teachers found for this school.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {teacherList.map((t: any, i: number) => (
                    <tr key={t.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                      <td className="px-4 py-3 font-medium text-white">{t.display_name}</td>
                      <td className="px-4 py-3 text-gray-400">{t.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right"><CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" /></td>
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

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`rounded-xl p-4 border border-white/10 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
