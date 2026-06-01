// =============================================================================
// MathAthlone — StudentResults (Sprint 5)
// =============================================================================
// Personal results view rendered when heat.status ∈ {complete, finished}.
//
// Loads:
//   1. The current Mathlete's heat_participations row (with users JOIN)
//   2. Their heat_awards row (award_level)
//   3. The full leaderboard (heat_participations + users + heat_awards merged)
//   4. Their question_submissions joined to heat_questions for question review
//
// Renders:
//   - Personal summary card with award badge + stats tiles
//   - Leaderboard (top 5 always; if user outside top 5, also show their row + neighbours)
//   - Collapsible question review
//   - Share result button (Web Share API → clipboard fallback)
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Flame,
  Gem,
  Loader2,
  Medal,
  Scroll,
  Share2,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';
import {
  resolveIdentity,
  type AthleteProfile,
  type CompetitionLevel,
} from '@/lib/identity-resolver';

// -----------------------------------------------------------------------------
// PROPS
// -----------------------------------------------------------------------------

interface StudentResultsProps {
  heatId: string;
  heatCode: string;
  participationId: string;
  userId: string;
  integrityLevel: string;
}

type AwardLevel =
  | 'participation'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'champion';

interface ParticipationRow {
  id: string;
  athlete_id: string;
  questions_attempted: number;
  questions_correct: number;
  first_touch_correct: number;
  total_time_ms: number;
  accuracy_score: number | null;
  cta_score: number | null;
  ranking_points_earned: number;
  rank_in_heat: number | null;
  percentile: number | null;
  medal: 'gold' | 'silver' | 'bronze' | null;
  is_flagged: boolean | null;
  finished_at: string | null;
  users: {
    display_name: string;
    grade_level: number | null;
    school_id: string | null;
  } | null;
}

interface AwardRow {
  athlete_id: string;
  award_level: AwardLevel;
  raw_score: number | null;
  accuracy_pct: number | null;
  percentile: number | null;
}

interface LeaderboardRow extends ParticipationRow {
  award: AwardRow | null;
}

interface SubmissionWithQuestion {
  id: string;
  submitted_answer: string | null;
  is_correct: boolean | null;
  time_taken_ms: number | null;
  points_earned: number | null;
  attempt_number: number | null;
  heat_questions: {
    id: string;
    question_number: number;
    question_text: string;
    question_latex: string | null;
    correct_answer: string;
    answer_type: string;
    points_value: number;
    solution_steps: any;
  } | null;
}

interface HeatMeta {
  code: string;
  question_count: number;
  duration_seconds: number;
  type: string | null;
  division: { id: string; name: string; code: string } | null;
  unit_topic: { id: string; name: string; code: string } | null;
  course: { id: string; name: string } | null;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const AWARD_META: Record<
  AwardLevel,
  { label: string; bgClass: string; borderClass: string; textClass: string; icon: React.ReactNode; emoji: string }
> = {
  participation: {
    label: 'Participation',
    bgClass: 'bg-gray-100',
    borderClass: 'border-gray-300',
    textClass: 'text-gray-700',
    icon: <Scroll className="w-10 h-10" />,
    emoji: '📜',
  },
  bronze: {
    label: 'Bronze',
    bgClass: 'bg-amber-100',
    borderClass: 'border-amber-600',
    textClass: 'text-amber-800',
    icon: <Medal className="w-10 h-10" />,
    emoji: '🥉',
  },
  silver: {
    label: 'Silver',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-400',
    textClass: 'text-slate-700',
    icon: <Medal className="w-10 h-10" />,
    emoji: '🥈',
  },
  gold: {
    label: 'Gold',
    bgClass: 'bg-yellow-100',
    borderClass: 'border-yellow-500',
    textClass: 'text-yellow-800',
    icon: <Medal className="w-10 h-10" />,
    emoji: '🥇',
  },
  platinum: {
    label: 'Platinum',
    bgClass: 'bg-indigo-100',
    borderClass: 'border-indigo-400',
    textClass: 'text-indigo-800',
    icon: <Gem className="w-10 h-10" />,
    emoji: '💎',
  },
  champion: {
    label: 'Champion',
    bgClass: 'bg-gradient-to-br from-amber-100 to-orange-200',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-900',
    icon: <Crown className="w-10 h-10" />,
    emoji: '🏆',
  },
};

function integrityToCompetitionLevel(level: string | null | undefined): CompetitionLevel {
  if (!level || level === 'practice') return 'classroom';
  if (
    level === 'school' ||
    level === 'district' ||
    level === 'regional' ||
    level === 'state' ||
    level === 'national'
  ) {
    return level;
  }
  return 'classroom';
}

function splitName(displayName: string): { first: string; last: string } {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' };
  return { first: parts[0]!, last: parts.slice(-1).join('') };
}

function formatTime(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderMath(input: string): { __html: string } {
  let html = input
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>')
    .replace(/\^(-?\d+)/g, '<sup>$1</sup>')
    .replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>')
    .replace(/_(-?\d+)/g, '<sub>$1</sub>')
    .replace(/\*/g, '·');
  return { __html: html };
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function StudentResults({
  heatId,
  heatCode,
  participationId,
  userId,
  integrityLevel,
}: StudentResultsProps) {
  const supabase = useMemo(() => createClient(), []);

  const [heatMeta, setHeatMeta] = useState<HeatMeta | null>(null);
  const [me, setMe] = useState<LeaderboardRow | null>(null);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // ── Load everything in parallel ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [heatResult, participationsResult, awardsResult, submissionsResult] =
          await Promise.all([
            supabase
              .from('heats')
              .select(
                `
                code, question_count, duration_seconds, type,
                division:division_id ( id, name, code ),
                unit_topic:unit_topic_id ( id, name, code ),
                course:unit_topic_id ( courses ( id, name ) )
              `
              )
              .eq('id', heatId)
              .maybeSingle(),
            supabase
              .from('heat_participations')
              .select(
                `
                id, athlete_id,
                questions_attempted, questions_correct, first_touch_correct,
                total_time_ms, accuracy_score, cta_score, ranking_points_earned,
                rank_in_heat, percentile, medal, is_flagged, finished_at,
                users:athlete_id ( display_name, grade_level, school_id )
              `
              )
              .eq('heat_id', heatId)
              .order('rank_in_heat', { ascending: true, nullsFirst: false }),
            supabase.from('heat_awards').select('*').eq('heat_id', heatId),
            supabase
              .from('question_submissions')
              .select(
                `
                id, submitted_answer, is_correct, time_taken_ms,
                points_earned, attempt_number,
                heat_questions:heat_question_id (
                  id, question_number, question_text, question_latex,
                  correct_answer, answer_type, points_value, solution_steps
                )
              `
              )
              .eq('heat_participation_id', participationId),
          ]);

        if (cancelled) return;

        if (heatResult.error) throw new Error(heatResult.error.message);
        if (participationsResult.error)
          throw new Error(participationsResult.error.message);

        // Heat meta
        const h: any = heatResult.data;
        const hm: HeatMeta = {
          code: h?.code ?? heatCode,
          question_count: h?.question_count ?? 0,
          duration_seconds: h?.duration_seconds ?? 0,
          type: h?.type ?? null,
          division: h?.division ?? null,
          unit_topic: h?.unit_topic ?? null,
          course: h?.course?.courses ?? null,
        };
        setHeatMeta(hm);

        // Merge participations + awards
        const awardsMap = new Map<string, AwardRow>(
          (awardsResult.data ?? []).map((a: any) => [a.athlete_id, a])
        );
        const rows: LeaderboardRow[] = (participationsResult.data ?? []).map((p: any) => ({
          ...(p as ParticipationRow),
          award: awardsMap.get(p.athlete_id) ?? null,
        }));
        setLeaderboard(rows);

        // Pick out the current Mathlete
        const myRow = rows.find((r) => r.id === participationId) ?? null;
        setMe(myRow);

        // Build identity profile for resolveIdentity()
        if (myRow?.users?.display_name) {
          const { first, last } = splitName(myRow.users.display_name);
          // Fetch school context if available (graceful — schools table fields may be sparse)
          let schoolName: string | null = null;
          let schoolMascot: string | null = null;
          let primaryColor: string | null = null;
          let secondaryColor: string | null = null;
          let city: string | null = null;
          let districtName: string | null = null;
          let stateCode: string | null = null;
          let stateName: string | null = null;
          let countryCode: string | null = null;
          let countryName: string | null = null;
          let countryFlag: string | null = null;

          if (myRow.users.school_id) {
            const { data: school } = await supabase
              .from('schools')
              .select(
                'name, mascot, primary_color, secondary_color, city, district, state, state_name, country_code, country_name, country_flag'
              )
              .eq('id', myRow.users.school_id)
              .maybeSingle();
            if (school) {
              schoolName = school.name ?? null;
              schoolMascot = school.mascot ?? null;
              primaryColor = school.primary_color ?? null;
              secondaryColor = school.secondary_color ?? null;
              city = school.city ?? null;
              districtName = school.district ?? null;
              stateCode = school.state ?? null;
              stateName = school.state_name ?? null;
              countryCode = school.country_code ?? null;
              countryName = school.country_name ?? null;
              countryFlag = school.country_flag ?? null;
            }
          }

          setProfile({
            id: userId,
            display_name: myRow.users.display_name,
            first_name: first || myRow.users.display_name,
            last_name: last,
            grade_level: myRow.users.grade_level,
            school_name: schoolName,
            school_mascot: schoolMascot,
            school_colors:
              primaryColor && secondaryColor ? [primaryColor, secondaryColor] : null,
            city,
            district_name: districtName,
            state_code: stateCode,
            state_name: stateName,
            country_code: countryCode,
            country_name: countryName,
            country_flag: countryFlag,
            avatar_url: null,
            division: hm.division?.code ?? '',
          });
        }

        // Submissions: sort by question_number
        if (submissionsResult.error) {
          console.warn(
            '[StudentResults] submissions load failed:',
            submissionsResult.error.message
          );
        }
        const subs = ((submissionsResult.data as unknown) as SubmissionWithQuestion[]) ?? [];
        subs.sort(
          (a, b) =>
            (a.heat_questions?.question_number ?? 0) -
            (b.heat_questions?.question_number ?? 0)
        );
        setSubmissions(subs);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heatId, participationId, userId, heatCode, supabase]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const myAwardLevel: AwardLevel = (me?.award?.award_level as AwardLevel) ?? 'participation';
  const meta = AWARD_META[myAwardLevel];
  const competitionLevel = integrityToCompetitionLevel(integrityLevel);
  const identity = profile ? resolveIdentity(profile, competitionLevel) : null;

  const myRank = me?.rank_in_heat ?? null;
  const myPercentile = me?.percentile ?? null;
  const totalParticipants = leaderboard.length;
  const correctStreakBest = useMemo(() => {
    let best = 0;
    let cur = 0;
    for (const s of submissions) {
      if (s.is_correct) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    return best;
  }, [submissions]);

  // Window the leaderboard: always show top 5 + (if needed) ... + user + neighbours
  const visibleLeaderboard = useMemo(() => {
    if (leaderboard.length === 0) return [];
    const top = leaderboard.slice(0, 5);
    const meIndex = leaderboard.findIndex((r) => r.id === participationId);
    if (meIndex < 5 || meIndex < 0) return top;

    const lo = Math.max(5, meIndex - 1);
    const hi = Math.min(leaderboard.length, meIndex + 2);
    const tail = leaderboard.slice(lo, hi);
    return [...top, '__gap__' as const, ...tail];
  }, [leaderboard, participationId]);

  // ── Share handler (Task 5) ──────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!me || !identity) return;
    const courseName = heatMeta?.course?.name ?? 'NC Math 1';
    const topicName = heatMeta?.unit_topic?.name ?? 'Mixed';
    const shareText = [
      '🏟️ MathAthlone Result',
      `${identity.compact} — ${meta.emoji} ${meta.label}`,
      myRank
        ? `#${myRank} of ${totalParticipants} Mathletes`
        : `${totalParticipants} Mathletes competed`,
      `CTA: ${Math.round(me.cta_score ?? 0)} · Accuracy: ${Math.round(me.accuracy_score ?? 0)}%`,
      `${courseName} · ${topicName}`,
      'Can you beat my score? mathathlone.com/compete',
    ].join('\n');

    const shareData = {
      title: 'MathAthlone Result',
      text: shareText,
    };
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share(shareData);
        setShareFeedback('Shared!');
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('Copied to clipboard');
      } else {
        setShareFeedback('Sharing not supported in this browser');
      }
    } catch (err: any) {
      // user-cancelled is the common case — silent
      if (err?.name !== 'AbortError') {
        setShareFeedback('Could not share');
      }
    }
    setTimeout(() => setShareFeedback(null), 1800);
  }, [me, identity, heatMeta, meta, myRank, totalParticipants]);

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
        <p className="mt-4 text-white/70 text-sm">Loading your results…</p>
      </div>
    );
  }
  if (error || !me) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 border border-red-400/30 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-1">Results unavailable</h1>
          <p className="text-red-200 text-sm">{error ?? 'No participation found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-8 md:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-indigo-300 uppercase tracking-[0.3em] mb-2">
            Heat {heatMeta?.code ?? heatCode} · Complete
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Your Results</h1>
        </div>

        {/* ── Personal summary card ────────────────────────────────────── */}
        <div
          className={`relative rounded-3xl border-4 ${meta.borderClass} ${meta.bgClass} p-6 md:p-8 mb-6 shadow-2xl`}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Award badge */}
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <div
                className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-2 ${meta.textClass}`}
              >
                {meta.icon}
              </div>
              <span
                className={`text-2xl md:text-3xl font-extrabold uppercase tracking-wide ${meta.textClass}`}
              >
                {meta.label}
              </span>
              {me.is_flagged && (
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 border border-red-300 rounded-full px-2 py-0.5">
                  Flagged — pending review
                </span>
              )}
            </div>

            {/* Identity block */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {identity?.display_name ?? me.users?.display_name ?? 'Mathlete'}
              </h2>
              {identity?.subtitle && (
                <p className="text-gray-600 text-sm">{identity.subtitle}</p>
              )}
              <p className="text-gray-700 text-sm mt-2">
                {myRank ? (
                  <>
                    <span className="font-bold">#{myRank}</span> of {totalParticipants}{' '}
                    Mathletes
                  </>
                ) : (
                  <>{totalParticipants} Mathletes competed</>
                )}
                {myPercentile !== null && (
                  <> · {Math.round(myPercentile)}th percentile</>
                )}
              </p>
            </div>
          </div>

          {/* Stats tiles */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatTile label="CTA" value={Math.round(me.cta_score ?? 0).toString()} icon={<TrendingUp className="w-4 h-4" />} />
            <StatTile
              label="Accuracy"
              value={`${Math.round(me.accuracy_score ?? 0)}%`}
              icon={<Target className="w-4 h-4" />}
            />
            <StatTile label="Time" value={formatTime(me.total_time_ms ?? 0)} icon={<Clock className="w-4 h-4" />} />
            <StatTile
              label="Correct"
              value={`${me.questions_correct ?? 0}/${me.questions_attempted ?? 0}`}
              icon={<Check className="w-4 h-4" />}
            />
            <StatTile label="Best streak" value={correctStreakBest.toString()} icon={<Flame className="w-4 h-4" />} />
            <StatTile
              label="Points"
              value={(me.ranking_points_earned ?? 0).toLocaleString()}
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>

          {/* Share button */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share result
            </button>
            {shareFeedback && (
              <span className="text-sm text-gray-700">{shareFeedback}</span>
            )}
          </div>
        </div>

        {/* ── Leaderboard ─────────────────────────────────────────────── */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Leaderboard
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <p className="p-5 text-white/40 italic text-sm">No participants found.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {visibleLeaderboard.map((row, idx) => {
                if (row === '__gap__') {
                  return (
                    <li
                      key={`gap-${idx}`}
                      className="px-5 py-2 text-center text-white/40 text-xs tracking-widest"
                    >
                      · · ·
                    </li>
                  );
                }
                const isMe = row.id === participationId;
                const award = (row.award?.award_level as AwardLevel) ?? 'participation';
                const awardMeta = AWARD_META[award];
                const rankDisplay =
                  row.rank_in_heat === 1
                    ? '🥇'
                    : row.rank_in_heat === 2
                    ? '🥈'
                    : row.rank_in_heat === 3
                    ? '🥉'
                    : `${row.rank_in_heat ?? '—'}`;
                return (
                  <li
                    key={row.id}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      isMe ? 'bg-emerald-400/15 ring-1 ring-emerald-400/40' : ''
                    }`}
                  >
                    <span className="w-8 text-center font-semibold text-white/80 text-sm">
                      {rankDisplay}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {row.users?.display_name ?? 'Mathlete'}
                        {isMe && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-white/60 font-mono w-12 text-right">
                      {Math.round(row.cta_score ?? 0)}
                    </span>
                    <span className="text-xs text-white/60 font-mono w-10 text-right">
                      {Math.round(row.accuracy_score ?? 0)}%
                    </span>
                    <span className="text-base w-7 text-center">{awardMeta.emoji}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Back to dashboard */}
        <div className="text-center mb-6">
          <Link
            href="/dashboard/athlete"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>

        {/* ── Question Review (collapsible) ───────────────────────────── */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setReviewOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Question Review ({submissions.length})
            </span>
            {reviewOpen ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>
          {reviewOpen && (
            <ul className="divide-y divide-white/10 max-h-[480px] overflow-y-auto">
              {submissions.length === 0 ? (
                <li className="p-5 text-white/40 italic text-sm">
                  No submissions recorded.
                </li>
              ) : (
                submissions.map((s) => {
                  const q = s.heat_questions;
                  const correct = !!s.is_correct;
                  const isSvg =
                    typeof q?.question_text === 'string' &&
                    q.question_text.trim().startsWith('<svg');
                  return (
                    <li key={s.id} className="px-5 py-3 flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 ${
                          correct ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      >
                        {correct ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/50 mb-1">
                          Q{q?.question_number ?? '?'} · {q?.points_value ?? 100} pts
                        </div>
                        <div
                          className="text-sm text-white font-medium leading-snug mb-1"
                          dangerouslySetInnerHTML={renderMath(
                            isSvg ? q?.question_latex ?? 'Visual question' : q?.question_text ?? ''
                          )}
                        />
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                          <span className="text-white/60">
                            Your answer:{' '}
                            <span
                              className="text-white font-mono"
                              dangerouslySetInnerHTML={renderMath(
                                s.submitted_answer ?? '—'
                              )}
                            />
                          </span>
                          {!correct && (
                            <span className="text-emerald-300/90">
                              Answer:{' '}
                              <span
                                className="font-mono"
                                dangerouslySetInnerHTML={renderMath(
                                  q?.correct_answer ?? ''
                                )}
                              />
                            </span>
                          )}
                          {correct && (
                            <span className="text-emerald-300/90 font-medium">
                              +{s.points_earned ?? 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/40 border border-white/60 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-600 uppercase tracking-wider mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg md:text-xl font-bold text-gray-900 font-mono leading-tight">
        {value}
      </p>
    </div>
  );
}
