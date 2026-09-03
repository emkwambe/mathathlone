// =============================================================================
// MathAthlone — Student Progress Dashboard  (Sprint 14)
// =============================================================================
// Route: /dashboard/athlete/progress
//
// Shows a student's full competitive history:
//   • ELO rating history (rating_history table) — sparkline-style trend
//   • Win/loss record across all heats
//   • Topics attempted and accuracy per topic
//   • Recent heat results (last 10)
//   • Division badges (all divisions the student has been unlocked for)
//
// This is a server component — all data is fetched server-side.
// =============================================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import MissingProfile from '@/components/auth/MissingProfile';

export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ratingDelta(before: number, after: number): string {
  const d = Math.round(after - before);
  if (d > 0) return `+${d}`;
  if (d < 0) return `${d}`;
  return '±0';
}

function medalEmoji(medal: string | null): string {
  if (medal === 'gold') return '🥇';
  if (medal === 'silver') return '🥈';
  if (medal === 'bronze') return '🥉';
  return '';
}

function rankSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentProgressPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, grade_level, school_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return <MissingProfile email={user.email} role="mathlete" />;
  }

  // ── 1. All division ratings ───────────────────────────────────────────────
  const { data: allRatings } = await supabase
    .from('athlete_ratings')
    .select(`
      rating, peak_rating, games_played, is_provisional, advancement_eligible,
      divisions:division_id ( id, name, code, grade_min, grade_max )
    `)
    .eq('athlete_id', user.id)
    .order('games_played', { ascending: false });

  // ── 2. ELO history (last 30 entries) ─────────────────────────────────────
  const { data: eloHistory } = await supabase
    .from('rating_history')
    .select('rating_before, rating_after, created_at, heat_id')
    .eq('athlete_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  // ── 3. Recent heat participations (last 10) ───────────────────────────────
  const { data: recentParticipations } = await supabase
    .from('heat_participations')
    .select(`
      id,
      questions_attempted,
      questions_correct,
      rank_in_heat,
      medal,
      content_score,
      finished_at,
      heats:heat_id (
        id,
        code,
        type,
        question_count,
        ranking_division_id,
        divisions:ranking_division_id ( name, code )
      )
    `)
    .eq('athlete_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(10);

  // ── 4. Topic accuracy (aggregate from question_submissions) ───────────────
  // Join: question_submissions → heat_questions → concepts → unit_topics
  // We aggregate correct/total per unit_topic_id.
  const { data: topicStats } = await supabase
    .from('question_submissions')
    .select(`
      is_correct,
      heat_questions:heat_question_id (
        concepts:concept_id (
          unit_topics:unit_topic_id ( id, name )
        )
      )
    `)
    .eq('athlete_id', user.id)
    .limit(500);

  // Aggregate topic stats
  const topicMap = new Map<string, { name: string; correct: number; total: number }>();
  for (const sub of topicStats ?? []) {
    const topicId = (sub.heat_questions as any)?.concepts?.unit_topics?.id;
    const topicName = (sub.heat_questions as any)?.concepts?.unit_topics?.name;
    if (!topicId || !topicName) continue;
    const existing = topicMap.get(topicId) ?? { name: topicName, correct: 0, total: 0 };
    existing.total += 1;
    if (sub.is_correct) existing.correct += 1;
    topicMap.set(topicId, existing);
  }
  const topicAccuracy = Array.from(topicMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  // ── 5. Win / loss summary ─────────────────────────────────────────────────
  const totalHeats = recentParticipations?.length ?? 0;
  const wins = (recentParticipations ?? []).filter((p) => (p.rank_in_heat ?? 99) === 1).length;
  const podiums = (recentParticipations ?? []).filter((p) => (p.rank_in_heat ?? 99) <= 3).length;
  const avgAccuracy = totalHeats > 0
    ? Math.round(
        (recentParticipations ?? []).reduce((sum, p) => {
          const attempted = p.questions_attempted ?? 0;
          const correct = p.questions_correct ?? 0;
          return sum + (attempted > 0 ? correct / attempted : 0);
        }, 0) / totalHeats * 100
      )
    : 0;

  // ── 6. ELO sparkline data (oldest → newest for display) ──────────────────
  const sparklineData = [...(eloHistory ?? [])].reverse();
  const sparklineMin = Math.min(...sparklineData.map((e) => e.rating_before), 800);
  const sparklineMax = Math.max(...sparklineData.map((e) => e.rating_after), 1200);
  const sparklineRange = Math.max(sparklineMax - sparklineMin, 50);

  function toSparkY(rating: number): number {
    return 60 - ((rating - sparklineMin) / sparklineRange) * 55;
  }

  const sparkPoints = sparklineData.map((e, i) => {
    const x = sparklineData.length <= 1 ? 50 : (i / (sparklineData.length - 1)) * 100;
    const y = toSparkY(e.rating_after);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const currentRating = allRatings?.[0];
  const primaryDivision = (currentRating?.divisions as any);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/athlete" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">My Progress</h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Current ELO" value={currentRating ? Math.round(currentRating.rating).toString() : '—'} sub={currentRating?.is_provisional ? 'Provisional' : 'Established'} />
          <StatCard label="Peak ELO" value={currentRating ? Math.round(currentRating.peak_rating ?? currentRating.rating).toString() : '—'} sub="All time" />
          <StatCard label="Heats Played" value={(currentRating?.games_played ?? 0).toString()} sub="Total" />
          <StatCard label="Avg Accuracy" value={`${avgAccuracy}%`} sub="Last 10 heats" />
        </div>

        {/* Win/Loss/Podium row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{wins}</p>
            <p className="text-xs text-gray-500 mt-1">Wins (1st place)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{podiums}</p>
            <p className="text-xs text-gray-500 mt-1">Podium finishes (top 3)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{totalHeats - wins}</p>
            <p className="text-xs text-gray-500 mt-1">Non-wins</p>
          </div>
        </div>

        {/* ELO Trend */}
        {sparklineData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">ELO Rating Trend</h2>
            <svg viewBox="0 0 100 65" className="w-full h-24" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="60" x2="100" y2="60" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.5" />
              <line x1="0" y1="5" x2="100" y2="5" stroke="#e5e7eb" strokeWidth="0.5" />
              {/* Sparkline */}
              <polyline
                points={sparkPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last point dot */}
              {sparklineData.length > 0 && (() => {
                const last = sparklineData[sparklineData.length - 1];
                const x = 100;
                const y = toSparkY(last.rating_after);
                return <circle cx={x} cy={y} r="2" fill="#6366f1" />;
              })()}
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{sparklineMin} ELO</span>
              <span>{sparklineMax} ELO</span>
            </div>
          </div>
        )}

        {/* Division badges */}
        {(allRatings ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Divisions</h2>
            <div className="flex flex-wrap gap-3">
              {(allRatings ?? []).map((r, i) => {
                const div = r.divisions as any;
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${r.advancement_eligible ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="text-sm font-semibold text-gray-800">{div?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{Math.round(r.rating)} ELO</span>
                    {r.advancement_eligible && <span className="text-xs text-amber-700 font-medium">⭐ Eligible</span>}
                    {r.is_provisional && <span className="text-xs text-gray-400">Provisional</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Topic Accuracy */}
        {topicAccuracy.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Topic Accuracy</h2>
            <div className="space-y-3">
              {topicAccuracy.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate max-w-[60%]">{t.name}</span>
                      <span className="font-medium">{pct}% ({t.correct}/{t.total})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Heats */}
        {(recentParticipations ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Heats</h2>
            <div className="space-y-2">
              {(recentParticipations ?? []).map((p, i) => {
                const heat = p.heats as any;
                const div = heat?.divisions;
                const accuracy = (p.questions_attempted ?? 0) > 0
                  ? Math.round(((p.questions_correct ?? 0) / (p.questions_attempted ?? 1)) * 100)
                  : 0;
                const rank = p.rank_in_heat;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {p.medal && <span>{medalEmoji(p.medal)}</span>}
                        <span className="text-sm font-medium text-gray-800 capitalize">{heat?.type ?? 'Heat'}</span>
                        {div?.name && <span className="text-xs text-gray-400">{div.name}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.finished_at)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                      <span className="text-gray-600">{accuracy}% accuracy</span>
                      {rank != null && (
                        <span className={`font-semibold ${rank === 1 ? 'text-amber-500' : rank <= 3 ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {rank}{rankSuffix(rank)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(recentParticipations ?? []).length === 0 && topicAccuracy.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">No competition data yet. Join a heat to start building your record.</p>
            <Link href="/compete" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Browse open heats →</Link>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
