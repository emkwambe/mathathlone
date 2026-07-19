// =============================================================================
// MathAthlone — TeacherResults (Sprint 5)
// =============================================================================
// Teacher-side post-Heat dashboard rendered when heat.status ∈ {complete,
// finished}. Shows class analytics, award distribution, concept mastery
// heatmap, full leaderboard with CSV export, and per-student drill-down.
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Download,
  Flag,
  Gem,
  Loader2,
  Medal,
  RefreshCw,
  Rocket,
  Scroll,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { resolveDisplayLabel } from '@/lib/competition/heat-service';

// -----------------------------------------------------------------------------
// PROPS
// -----------------------------------------------------------------------------

interface TeacherResultsProps {
  heatId: string;
  heatCode: string;
  integrityLevel: string;
}

type AwardLevel =
  | 'participation'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'champion';

interface ResultRow {
  id: string;
  athlete_id: string;
  display_name: string;
  grade_level: number | null;
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
  is_flagged: boolean;
  focus_violation_count: number;
  award_level: AwardLevel;
}

interface ConceptBucket {
  key: string;
  label: string;
  category: 'concept' | 'unit_topic' | 'visual' | 'static' | 'other';
  attempts: number;
  correct: number;
  accuracy: number;       // 0..100
}

interface SubmissionRow {
  id: string;
  heat_participation_id: string;
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
    points_value: number;
    solution_steps: any;
    question_generators?: {
      atomic_concepts?: {
        name: string;
        lesson_number: string;
        unit_topics?: { name: string } | null;
      } | null;
    } | null;
  } | null;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const AWARD_META: Record<AwardLevel, { label: string; emoji: string; icon: React.ReactNode; color: string }> = {
  participation: { label: 'Participation', emoji: '📜', icon: <Scroll className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' },
  bronze:        { label: 'Bronze',        emoji: '🥉', icon: <Medal className="w-4 h-4" />, color: 'text-amber-800 bg-amber-100' },
  silver:        { label: 'Silver',        emoji: '🥈', icon: <Medal className="w-4 h-4" />, color: 'text-slate-700 bg-slate-100' },
  gold:          { label: 'Gold',          emoji: '🥇', icon: <Medal className="w-4 h-4" />, color: 'text-yellow-800 bg-yellow-100' },
  platinum:      { label: 'Platinum',      emoji: '💎', icon: <Gem className="w-4 h-4" />,   color: 'text-indigo-800 bg-indigo-100' },
  champion:      { label: 'Champion',      emoji: '🏆', icon: <Crown className="w-4 h-4" />, color: 'text-amber-900 bg-gradient-to-r from-amber-200 to-orange-200' },
};

const AWARD_ORDER: AwardLevel[] = ['champion', 'platinum', 'gold', 'silver', 'bronze', 'participation'];

/**
 * Format an ISO timestamp as "MMM D, YYYY" (e.g. "Jun 4, 2026") for the
 * results header. Returns null when the input is null/undefined/invalid so
 * the caller can omit the date line entirely instead of rendering "—".
 */
function formatHeatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function TeacherResults({ heatId, heatCode, integrityLevel }: TeacherResultsProps) {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [conceptBuckets, setConceptBuckets] = useState<ConceptBucket[]>([]);
  const [submissionsByPart, setSubmissionsByPart] = useState<Map<string, SubmissionRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  // FIX 4 — header meta: course + topics covered + distinct concepts count.
  const [courseName, setCourseName] = useState<string | null>(null);
  const [primaryTopicName, setPrimaryTopicName] = useState<string | null>(null);
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [conceptsCount, setConceptsCount] = useState<number>(0);
  // Migration 032 — assessment mode flags + per-student letter grades.
  const [isAssessment, setIsAssessment] = useState<boolean>(false);
  const [resultsReleased, setResultsReleased] = useState<boolean>(true);
  const [heatType, setHeatType] = useState<string | null>(null);
  const [gradeBands, setGradeBands] = useState<{ A: number; B: number; C: number; D: number } | null>(null);
  const [letterGradeByAthlete, setLetterGradeByAthlete] = useState<Map<string, 'A' | 'B' | 'C' | 'D' | 'F'>>(new Map());
  const [releasing, setReleasing] = useState<boolean>(false);

  // ── Load everything ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [heatResult, participationsResult, awardsResult] = await Promise.all([
          supabase
            .from('heats')
            .select(`
              question_count, created_at, type,
              is_assessment, results_released, grade_bands,
              unit_topic:unit_topic_id (
                id, name,
                course:course_id ( id, name )
              )
            `)
            .eq('id', heatId)
            .maybeSingle(),
          supabase
            .from('heat_participations')
            .select(
              `
              id, athlete_id,
              questions_attempted, questions_correct, first_touch_correct,
              total_time_ms, accuracy_score, cta_score, ranking_points_earned,
              rank_in_heat, percentile, medal,
              is_flagged, focus_violation_count,
              users:athlete_id ( display_name, grade_level, email )
            `
            )
            .eq('heat_id', heatId)
            .order('rank_in_heat', { ascending: true, nullsFirst: false }),
          supabase.from('heat_awards').select('athlete_id, award_level, letter_grade').eq('heat_id', heatId),
        ]);

        if (cancelled) return;

        if (participationsResult.error) {
          throw new Error(participationsResult.error.message);
        }

        setQuestionCount(heatResult.data?.question_count ?? 0);
        setCreatedAt(heatResult.data?.created_at ?? null);
        // FIX 4 — header meta. Pull course name (via unit_topic→course) and
        // the single-topic name (when the heat targeted one topic).
        const heatMeta: any = heatResult.data;
        const ut = heatMeta?.unit_topic;
        setCourseName(ut?.course?.name ?? null);
        setPrimaryTopicName(ut?.name ?? null);
        // Migration 032 — assessment mode + grade bands.
        setIsAssessment(!!heatMeta?.is_assessment);
        setResultsReleased(heatMeta?.results_released !== false);
        setHeatType(heatMeta?.type ?? null);
        setGradeBands(heatMeta?.grade_bands ?? null);

        // Letter-grade map (keyed by athlete_id) for the gradebook + distribution.
        const grades = new Map<string, 'A' | 'B' | 'C' | 'D' | 'F'>();
        for (const a of ((awardsResult.data ?? []) as any[])) {
          if (a.letter_grade) grades.set(a.athlete_id, a.letter_grade as 'A' | 'B' | 'C' | 'D' | 'F');
        }
        setLetterGradeByAthlete(grades);

        const awardsMap = new Map<string, AwardLevel>(
          ((awardsResult.data ?? []) as any[]).map((a) => [a.athlete_id, a.award_level])
        );

        const merged: ResultRow[] = (participationsResult.data ?? []).map((p: any) => ({
          id: p.id,
          athlete_id: p.athlete_id,
          // Resolver returns display_name → email local-part → short id.
          // We never want the teacher leaderboard to show "Mathlete" when a
          // real name (or even just an email) is available.
          display_name: resolveDisplayLabel({
            display_name: p.users?.display_name,
            email: p.users?.email,
            athlete_id: p.athlete_id,
          }),
          grade_level: p.users?.grade_level ?? null,
          questions_attempted: p.questions_attempted ?? 0,
          questions_correct: p.questions_correct ?? 0,
          first_touch_correct: p.first_touch_correct ?? 0,
          total_time_ms: p.total_time_ms ?? 0,
          accuracy_score: p.accuracy_score,
          cta_score: p.cta_score,
          ranking_points_earned: p.ranking_points_earned ?? 0,
          rank_in_heat: p.rank_in_heat,
          percentile: p.percentile,
          medal: p.medal,
          is_flagged: !!p.is_flagged,
          focus_violation_count: p.focus_violation_count ?? 0,
          award_level: (awardsMap.get(p.athlete_id) ?? 'participation') as AwardLevel,
        }));
        setRows(merged);

        // Submissions for concept analysis + drill-down
        const participationIds = merged.map((r) => r.id);
        if (participationIds.length > 0) {
          const { data: subData, error: subErr } = await supabase
            .from('question_submissions')
            .select(
              `
              id, heat_participation_id, submitted_answer, is_correct,
              time_taken_ms, points_earned, attempt_number,
              heat_questions:heat_question_id (
                id, question_number, question_text, question_latex,
                correct_answer, points_value, solution_steps,
                question_generators:generator_id (
                  atomic_concepts:concept_id (
                    name, lesson_number,
                    unit_topics:unit_topic_id ( name )
                  )
                )
              )
            `
            )
            .in('heat_participation_id', participationIds);

          if (subErr) {
            console.warn('[TeacherResults] submissions load failed:', subErr.message);
          }

          const subs = ((subData as unknown) as SubmissionRow[]) ?? [];

          // Group by participation_id for drill-down
          const grouped = new Map<string, SubmissionRow[]>();
          for (const s of subs) {
            const arr = grouped.get(s.heat_participation_id) ?? [];
            arr.push(s);
            grouped.set(s.heat_participation_id, arr);
          }
          // Sort each list by question_number
          grouped.forEach((arr) =>
            arr.sort(
              (a, b) =>
                (a.heat_questions?.question_number ?? 0) -
                (b.heat_questions?.question_number ?? 0)
            )
          );
          setSubmissionsByPart(grouped);

          // Concept mastery aggregation
          setConceptBuckets(buildConceptBuckets(subs));

          // FIX 4 — Topics covered + distinct concept count.
          // Dedupe by question_id first so a question that 10 students each
          // attempted only counts once.
          const seenQuestions = new Set<string>();
          const topicCounts = new Map<string, number>();
          const conceptKeys = new Set<string>();
          for (const s of subs) {
            const q = s.heat_questions;
            if (!q || !q.id || seenQuestions.has(q.id)) continue;
            seenQuestions.add(q.id);
            const concept = q.question_generators?.atomic_concepts;
            const topicName = concept?.unit_topics?.name;
            if (topicName) {
              topicCounts.set(topicName, (topicCounts.get(topicName) ?? 0) + 1);
            }
            if (concept?.lesson_number) conceptKeys.add(concept.lesson_number);
            else if ((q.solution_steps as any)?.kind === 'visual') {
              const k = (q.solution_steps as any)?.generator_key
                ?? (q.solution_steps as any)?.concept_name
                ?? 'visual';
              conceptKeys.add(`visual:${k}`);
            } else if ((q.solution_steps as any)?.kind === 'static') {
              conceptKeys.add(`static:${q.id}`);
            }
          }
          const ranked = Array.from(topicCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name]) => name);
          setTopicsCovered(ranked);
          setConceptsCount(conceptKeys.size);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heatId, supabase]);

  // ── Derived metrics ────────────────────────────────────────────────────
  const competed = rows.length;
  const avgAccuracy =
    competed === 0
      ? 0
      : Math.round(rows.reduce((sum, r) => sum + (r.accuracy_score ?? 0), 0) / competed);
  const avgCta =
    competed === 0
      ? 0
      : Math.round(rows.reduce((sum, r) => sum + (r.cta_score ?? 0), 0) / competed);
  const avgTimeMs =
    competed === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + (r.total_time_ms ?? 0), 0) / competed);

  const awardDistribution = useMemo(() => {
    const counts: Record<AwardLevel, number> = {
      champion: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, participation: 0,
    };
    for (const r of rows) counts[r.award_level] = (counts[r.award_level] ?? 0) + 1;
    return counts;
  }, [rows]);

  const flaggedCount = rows.filter((r) => r.is_flagged).length;

  // ── CSV export ──────────────────────────────────────────────────────────
  // Assessment heats add letter_grade + grade_band columns to the export.
  const handleExport = useCallback(() => {
    const baseHeader = [
      'Rank',
      'Mathlete',
      'Grade',
      'CTA',
      'Accuracy %',
      'Correct',
      'Attempted',
      'Total Time (ms)',
      'Points',
      'Award',
      'Flagged',
      'Focus violations',
    ];
    const header = isAssessment
      ? [...baseHeader, 'Letter Grade', 'Grade Bands']
      : baseHeader;
    const bandsLabel = gradeBands
      ? `A=${gradeBands.A}+ B=${gradeBands.B}+ C=${gradeBands.C}+ D=${gradeBands.D}+`
      : '';
    const lines = [header.map(csvEscape).join(',')];
    for (const r of rows) {
      const base = [
        r.rank_in_heat ?? '',
        r.display_name,
        r.grade_level ?? '',
        Math.round(r.cta_score ?? 0),
        Math.round(r.accuracy_score ?? 0),
        r.questions_correct,
        r.questions_attempted,
        r.total_time_ms,
        r.ranking_points_earned,
        AWARD_META[r.award_level].label,
        r.is_flagged ? 'yes' : 'no',
        r.focus_violation_count,
      ];
      const row = isAssessment
        ? [...base, letterGradeByAthlete.get(r.athlete_id) ?? '', bandsLabel]
        : base;
      lines.push(row.map(csvEscape).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = isAssessment ? 'gradebook' : 'results';
    a.download = `heat-${heatCode}-${suffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows, heatCode, isAssessment, gradeBands, letterGradeByAthlete]);

  // ── Release Results (Test mode) ─────────────────────────────────────────
  // Flips heats.results_released to TRUE so students can finally see their
  // grade card. No-op for non-test heats. Disabled while in-flight.
  const handleReleaseResults = useCallback(async () => {
    if (releasing || resultsReleased) return;
    setReleasing(true);
    try {
      const { error: upErr } = await supabase
        .from('heats')
        .update({ results_released: true })
        .eq('id', heatId);
      if (upErr) {
        setError(`Failed to release results: ${upErr.message}`);
        return;
      }
      setResultsReleased(true);
    } finally {
      setReleasing(false);
    }
  }, [releasing, resultsReleased, heatId, supabase]);

  // ── Grade distribution (assessment heats only) ──────────────────────────
  const gradeDistribution = useMemo(() => {
    if (!isAssessment) return null;
    const counts: Record<'A' | 'B' | 'C' | 'D' | 'F', number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const r of rows) {
      const g = letterGradeByAthlete.get(r.athlete_id);
      if (g) counts[g] += 1;
    }
    return counts;
  }, [isAssessment, rows, letterGradeByAthlete]);

  const drillRow = drillId ? rows.find((r) => r.id === drillId) ?? null : null;
  const drillSubs = drillId ? submissionsByPart.get(drillId) ?? [] : [];

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
        <p className="mt-4 text-white/70 text-sm">Loading class results…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/10 border border-red-400/30 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-1">Couldn't load results</h1>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header — FIX 4: course + topics + concept count + integrity */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="min-w-0">
            <p className="text-xs text-indigo-300 uppercase tracking-[0.3em] mb-1">Results</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Heat <span className="font-mono">{heatCode}</span>
            </h1>
            {/* Date · course */}
            {(formatHeatDate(createdAt) || courseName) && (
              <p className="text-indigo-200 text-sm mt-1">
                {[formatHeatDate(createdAt), courseName].filter(Boolean).join(' · ')}
              </p>
            )}
            {/* Topics: <primary topic> OR <top 3 covered> */}
            <p className="text-indigo-300/80 text-xs mt-1">
              Topics:{' '}
              <span className="text-indigo-100">
                {primaryTopicName
                  ?? (topicsCovered.length === 0
                    ? 'Mixed'
                    : topicsCovered.length <= 3
                    ? topicsCovered.join(', ')
                    : `Mixed (${topicsCovered.slice(0, 3).join(', ')}, …)`)}
              </span>
            </p>
            {/* n concepts · integrity */}
            <p className="text-indigo-300/70 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              {conceptsCount > 0 && (
                <>
                  <span>{conceptsCount} concept{conceptsCount === 1 ? '' : 's'}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <span>
                integrity <span className="capitalize">{integrityLevel}</span>
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isAssessment && heatType === 'test' && !resultsReleased && (
              <button
                type="button"
                onClick={handleReleaseResults}
                disabled={releasing}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-amber-400 text-amber-950 text-sm font-semibold hover:bg-amber-300 disabled:opacity-50 transition-colors"
                title="Make results visible to students"
              >
                {releasing ? 'Releasing…' : 'Release Results'}
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              {isAssessment ? 'Gradebook CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Overview stats — CTA framework (docs/CTA_SCORING_FRAMEWORK.md) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Tile label="Competed" value={competed.toString()} icon={<Users className="w-4 h-4" />} />
          <Tile label="Avg accuracy" value={`${avgAccuracy}%`} icon={<Target className="w-4 h-4" />} />
          <Tile label="Avg CTA" value={`${avgCta}/100`} icon={<TrendingUp className="w-4 h-4" />} />
          <Tile label="Avg time" value={formatTime(avgTimeMs)} icon={<Clock className="w-4 h-4" />} />
          <Tile
            label="Concepts mastered"
            value={
              conceptBuckets.length > 0
                ? `${conceptBuckets.filter((b) => b.accuracy >= 80).length}/${conceptBuckets.length}`
                : '—'
            }
            icon={<Award className="w-4 h-4" />}
          />
        </div>

        {/* Distribution — Award (competition) OR Grade (assessment) */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            {isAssessment ? 'Grade distribution' : 'Award distribution'}
          </p>
          {isAssessment && gradeDistribution ? (
            <div className="flex flex-wrap items-center gap-3">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => {
                const count = gradeDistribution[g];
                const color =
                  g === 'A' ? 'text-emerald-700 bg-emerald-100' :
                  g === 'B' ? 'text-sky-700 bg-sky-100' :
                  g === 'C' ? 'text-amber-700 bg-amber-100' :
                  g === 'D' ? 'text-orange-700 bg-orange-100' :
                              'text-red-700 bg-red-100';
                return (
                  <div
                    key={g}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${color}`}
                  >
                    <span className="text-lg leading-none">{g}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
              {gradeBands && (
                <span className="text-[11px] text-white/50 ml-2">
                  (cutoffs: A≥{gradeBands.A}, B≥{gradeBands.B}, C≥{gradeBands.C}, D≥{gradeBands.D})
                </span>
              )}
              {!resultsReleased && (
                <span className="text-[11px] text-amber-300 ml-1 font-semibold uppercase tracking-wider">
                  · Not yet released to students
                </span>
              )}
            </div>
          ) : (
          <div className="flex flex-wrap items-center gap-3">
            {AWARD_ORDER.map((level) => {
              const count = awardDistribution[level];
              const meta = AWARD_META[level];
              return (
                <div
                  key={level}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${meta.color}`}
                >
                  <span>{meta.emoji}</span>
                  <span>{count}</span>
                  <span className="font-normal opacity-80">{meta.label}</span>
                </div>
              );
            })}
            {flaggedCount > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-red-700 bg-red-100 border border-red-200">
                <Flag className="w-3.5 h-3.5" />
                {flaggedCount} flagged
              </div>
            )}
          </div>
          )}
        </div>

        {/* Concept mastery */}
        {conceptBuckets.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 mb-6">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              Concept mastery
            </p>
            <ul className="space-y-3">
              {conceptBuckets.map((b) => {
                const color =
                  b.accuracy >= 80
                    ? 'bg-emerald-400'
                    : b.accuracy >= 60
                    ? 'bg-amber-400'
                    : 'bg-red-400';
                const badge =
                  b.accuracy >= 80 ? (
                    <span className="text-emerald-300 text-xs font-semibold">✓ Mastered</span>
                  ) : b.accuracy >= 60 ? (
                    <span className="text-amber-300 text-xs font-semibold">⚠ Developing</span>
                  ) : (
                    <span className="text-red-300 text-xs font-semibold">✗ Needs work</span>
                  );
                return (
                  <li key={b.key}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-sm text-white font-medium truncate">{b.label}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-white/60 font-mono">
                          {b.correct}/{b.attempts} · {b.accuracy}%
                        </span>
                        {badge}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all`}
                        style={{ width: `${b.accuracy}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] text-white/40 mt-4">
              ✓ ≥ 80% mastered · ⚠ 60–80% developing · ✗ &lt; 60% needs work
            </p>
          </div>
        )}

        {/* Post-heat navigation */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <Link
            href="/compete/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white text-sm font-medium transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Start New Heat
          </Link>
          <Link
            href={`/compete/create?repeat=${heatCode}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/30 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Run Again
          </Link>
        </div>

        {/* Full leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Full leaderboard ({rows.length})
            </p>
            <p className="text-[10px] text-white/40 hidden sm:block">Click a row to drill in</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-white/60 text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Mathlete</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3 text-right">CTA</th>
                  <th className="px-4 py-3 text-right">Accuracy</th>
                  <th className="px-4 py-3 text-right">Q</th>
                  <th className="px-4 py-3 text-right">Time</th>
                  <th className="px-4 py-3">Award</th>
                  <th className="px-4 py-3 text-center">Flag</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((r) => {
                  const meta = AWARD_META[r.award_level];
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setDrillId(r.id)}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white/80 font-semibold">
                        {r.rank_in_heat ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-white">{r.display_name}</td>
                      <td className="px-4 py-3 text-white/70">{r.grade_level ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-white font-mono">
                        {Math.round(r.cta_score ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-white/80 font-mono">
                        {Math.round(r.accuracy_score ?? 0)}%
                      </td>
                      <td className="px-4 py-3 text-right text-white/80 font-mono">
                        {r.questions_correct}/{r.questions_attempted}
                      </td>
                      <td className="px-4 py-3 text-right text-white/80 font-mono">
                        {formatTime(r.total_time_ms)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.color}`}>
                          <span>{meta.emoji}</span> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.is_flagged ? (
                          <Flag className="w-4 h-4 text-red-400 mx-auto" />
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-white/40 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="p-5 text-white/40 italic text-sm text-center">
                No participants competed in this Heat.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drillRow && (
        <DrillDownModal
          row={drillRow}
          submissions={drillSubs}
          questionCount={questionCount}
          onClose={() => setDrillId(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function Tile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/15 p-3">
      <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase tracking-wider mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-white font-mono leading-tight">{value}</p>
    </div>
  );
}

function DrillDownModal({
  row,
  submissions,
  questionCount,
  onClose,
}: {
  row: ResultRow;
  submissions: SubmissionRow[];
  questionCount: number;
  onClose: () => void;
}) {
  const meta = AWARD_META[row.award_level];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex md:hidden items-center gap-1 text-xs text-gray-500 mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
              {row.display_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                #{row.rank_in_heat ?? '—'} ·{' '}
                {row.percentile !== null ? `${Math.round(row.percentile)}th pct` : '—'}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.color}`}
              >
                <span>{meta.emoji}</span>
                {meta.label}
              </span>
              {row.is_flagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-red-700 bg-red-100 border border-red-200">
                  <Flag className="w-3 h-3" />
                  Flagged
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-2 p-5 border-b border-gray-100">
          <SmallStat label="CTA" value={`${Math.round(row.cta_score ?? 0)}/100`} />
          <SmallStat label="Accuracy" value={`${Math.round(row.accuracy_score ?? 0)}%`} />
          <SmallStat label="Correct" value={`${row.questions_correct}/${row.questions_attempted}`} />
          <SmallStat label="Time" value={formatTime(row.total_time_ms)} />
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Question-by-question
          </p>

          {submissions.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No submissions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s) => {
                const q = s.heat_questions;
                const correct = !!s.is_correct;
                const isSvg =
                  typeof q?.question_text === 'string' &&
                  q.question_text.trim().startsWith('<svg');
                return (
                  <li
                    key={s.id}
                    className={`rounded-lg border p-3 ${
                      correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5 ${
                          correct ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      >
                        {correct ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          Q{q?.question_number ?? '?'} ·{' '}
                          {q?.points_value ?? 0} pts ·{' '}
                          {formatTime(s.time_taken_ms ?? 0)}
                        </div>
                        <div
                          className="text-sm text-gray-900 font-medium mt-0.5"
                          dangerouslySetInnerHTML={renderMath(
                            isSvg ? q?.question_latex ?? 'Visual question' : q?.question_text ?? ''
                          )}
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          <span>
                            Answer:{' '}
                            <span
                              className="font-mono text-gray-900"
                              dangerouslySetInnerHTML={renderMath(
                                s.submitted_answer ?? '—'
                              )}
                            />
                          </span>
                          {!correct && (
                            <span className="ml-3">
                              Correct:{' '}
                              <span
                                className="font-mono text-emerald-700"
                                dangerouslySetInnerHTML={renderMath(
                                  q?.correct_answer ?? ''
                                )}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {questionCount > submissions.length && (
            <p className="mt-3 text-xs text-gray-500 italic">
              {questionCount - submissions.length} question(s) not attempted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
      <p className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 font-mono">{value}</p>
    </div>
  );
}

// =============================================================================
// CONCEPT BUCKETING
// =============================================================================

function buildConceptBuckets(subs: SubmissionRow[]): ConceptBucket[] {
  const buckets = new Map<string, ConceptBucket>();

  for (const s of subs) {
    const q = s.heat_questions;
    if (!q) continue;

    // Pick a bucket: prefer atomic_concept name, then unit_topic, then visual/static
    const concept = q.question_generators?.atomic_concepts;
    let key: string;
    let label: string;
    let category: ConceptBucket['category'];

    if (concept?.name) {
      key = `concept:${concept.lesson_number}`;
      label = concept.name;
      category = 'concept';
    } else if (concept?.unit_topics?.name) {
      key = `unit:${concept.unit_topics.name}`;
      label = concept.unit_topics.name;
      category = 'unit_topic';
    } else if (s.heat_questions?.solution_steps?.kind === 'visual') {
      // Use the per-question concept name that question-delivery stored, so
      // visual questions show their real concept (e.g. "Scatter Plot
      // Interpretation") instead of a generic bucket.
      const visualName =
        (typeof s.heat_questions?.solution_steps?.concept_name === 'string' &&
          s.heat_questions.solution_steps.concept_name) ||
        (typeof s.heat_questions?.solution_steps?.generator_key === 'string' &&
          s.heat_questions.solution_steps.generator_key) ||
        'Visual questions';
      key = `visual:${visualName}`;
      label = visualName;
      category = 'visual';
    } else if (s.heat_questions?.solution_steps?.kind === 'static') {
      key = 'static';
      label = 'Concept review';
      category = 'static';
    } else {
      key = 'other';
      label = 'Other';
      category = 'other';
    }

    const b =
      buckets.get(key) ?? {
        key,
        label,
        category,
        attempts: 0,
        correct: 0,
        accuracy: 0,
      };
    b.attempts += 1;
    if (s.is_correct) b.correct += 1;
    buckets.set(key, b);
  }

  const result = [...buckets.values()].map((b) => ({
    ...b,
    accuracy: b.attempts === 0 ? 0 : Math.round((b.correct / b.attempts) * 100),
  }));

  // Sort by accuracy ascending — weakest concepts first (most actionable)
  result.sort((a, b) => a.accuracy - b.accuracy);
  return result;
}
