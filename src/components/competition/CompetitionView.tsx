// =============================================================================
// MathAthlone — CompetitionView (Sprint 4)
// =============================================================================
// The student gameplay surface rendered while heat.status ∈ {active, in_progress}.
//
// Responsibilities:
//   - Fetch heat_questions for the Heat (ordered by question_number)
//   - Render one question at a time with the right input type:
//       * MC buttons for visual (SVG) and static questions
//       * Free-text input for generator questions
//   - Validate answers (validation.ts), INSERT question_submissions
//   - Update heat_participations counters per submission
//   - Show instant feedback (green/red) → auto-advance
//   - Track running score + streak + a global countdown timer
//   - Activate Focus Mode based on integrity_level
//
// Column references match LIVE_QUERY_RESULTS.md:
//   question_submissions: heat_participation_id, heat_question_id, submitted_answer,
//                         is_correct, time_taken_ms, attempt_number, points_earned
//   heat_participations:  questions_attempted, questions_correct, first_touch_correct,
//                         total_time_ms, ranking_points_earned,
//                         focus_violation_count (INTEGER), is_flagged
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Check,
  Clock,
  Flame,
  Loader2,
  Trophy,
  X,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { validateAnswer } from '@/lib/competition/validation';
import type { AnswerType } from '@/lib/competition/generators';
import {
  FocusMode,
  loadIntegrityConfig,
  type IntegrityConfig,
  type IntegrityLevel,
} from '@/lib/competition/focus-mode';
import {
  FlaggedBanner,
  FocusWarningOverlay,
} from '@/components/competition/focus-mode-ui';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface HeatQuestionRow {
  id: string;
  heat_id: string;
  question_number: number;
  generator_id: string | null;
  difficulty: number;
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: string;
  solution_steps: any;
  points_value: number;
  time_limit_seconds: number;
  /** Joined from question_generators when generator_id is set. */
  question_generators?: { generator_type: string } | null;
}

interface CompetitionViewProps {
  heatId: string;
  participationId: string;
  durationSeconds: number;
  integrityLevel: string;        // 'practice' | 'school' | 'district' | ...
  /** Stays false here; teachers see TeacherMonitor instead. */
  isTeacher?: boolean;
}

type Phase = 'integrity_check' | 'loading' | 'playing' | 'finished' | 'time_up';

interface QuestionShape {
  kind: 'free_text' | 'multiple_choice_text' | 'multiple_choice_svg';
  options: string[];
  svg: string | null;
  prompt: string;                // text to display above input/options
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Detect whether a heat_questions row is a multiple-choice (visual or static)
 * or a free-text generator question. The shape is deduced from solution_steps
 * (set by question-delivery.ts) plus the legacy fallback of `question_text`
 * starting with `<svg`.
 */
function shapeOf(q: HeatQuestionRow): QuestionShape {
  const steps: any = q.solution_steps;
  const isSvg =
    (steps && typeof steps === 'object' && steps.kind === 'visual') ||
    (typeof q.question_text === 'string' && q.question_text.trim().startsWith('<svg'));
  const isStatic = steps && typeof steps === 'object' && steps.kind === 'static';

  if (isSvg) {
    return {
      kind: 'multiple_choice_svg',
      options: Array.isArray(steps?.options) ? steps.options : [],
      svg: q.question_text,
      prompt: q.question_latex || 'Choose the correct answer:',
    };
  }
  if (isStatic) {
    return {
      kind: 'multiple_choice_text',
      options: Array.isArray(steps?.options) ? steps.options : [],
      svg: null,
      prompt: q.question_text,
    };
  }
  return {
    kind: 'free_text',
    options: [],
    svg: null,
    prompt: q.question_text,
  };
}

/**
 * Light-weight LaTeX-ish renderer. We do NOT pull in KaTeX for the MVP — we
 * just transform `^N` / `_N` to <sup>/<sub>, simple \frac{a}{b} → (a)/(b),
 * and \sqrt{x} → √(x). Everything else falls through verbatim.
 */
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

/**
 * Format-hint resolver for free-text questions. Returns a short instruction
 * shown beneath the answer input so Mathletes know the expected form.
 *
 * Priority: generator_type substring match wins over raw answer_type because
 * some generators (e.g. `linear_eq_*`) produce numeric answers stored as
 * `integer`/`text` while still benefiting from a structural hint, and others
 * (`point_slope_form`) require a specific equation layout.
 */
function formatHintFor(
  answerType: string | null | undefined,
  generatorType: string | null | undefined
): string {
  const at = (answerType ?? '').toLowerCase();
  const gt = (generatorType ?? '').toLowerCase();

  // Generator-shape rules (apply across text / equation / expression types)
  if (gt.includes('point_slope')) {
    return 'Format: y - b = m(x - a) (e.g., y - 2 = 3(x - 4))';
  }
  if (gt.includes('linear_eq') || gt.includes('write_linear_eq') || gt.includes('write_parallel_perp_eq')) {
    return 'Format: y = mx + b (e.g., y = 2x + 3)';
  }
  if (gt.includes('inequality')) {
    return 'Format: x > 5 or x ≤ -3';
  }
  if (gt.includes('factor')) {
    return 'Format: (x + a)(x + b) (e.g., (x + 2)(x - 3))';
  }
  if (gt.includes('system_solution')) {
    return 'Format: no solution, infinite, or one solution';
  }

  // Pure answer_type fallbacks
  switch (at) {
    case 'integer':
      return 'Enter a whole number (e.g., 5)';
    case 'decimal':
      return 'Enter a number (e.g., 3.5)';
    case 'fraction':
      return 'Enter as a fraction (e.g., 3/4 or -1/2)';
    case 'ordered_pair':
    case 'point':
      return 'Format: (x, y) (e.g., (2, 3))';
    case 'integer_pair':
      return 'Format: {a, b} (order doesn\'t matter)';
    case 'inequality':
      return 'Format: x > 5 or x ≤ -3';
    case 'interval':
      return 'Format: (a, b), [a, b], (a, b], or [a, b)';
    case 'equation':
      return 'Format: y = mx + b (e.g., y = 2x + 3)';
    case 'expression':
      return 'Enter the simplified expression';
    case 'text':
    default:
      return 'Enter your answer exactly';
  }
}

function formatClock(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MC_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const INTEGRITY_LEVEL_REQUIRES_FOCUS: Record<string, boolean> = {
  practice: false,
  school: true,
  district: true,
  regional: true,
  state: true,
  national: true,
};

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export default function CompetitionView({
  heatId,
  participationId,
  durationSeconds,
  integrityLevel,
}: CompetitionViewProps) {
  const supabase = useMemo(() => createClient(), []);

  // ── Phase & questions ───────────────────────────────────────────────────
  const requiresFocus =
    INTEGRITY_LEVEL_REQUIRES_FOCUS[integrityLevel as IntegrityLevel] ?? false;

  const [phase, setPhase] = useState<Phase>(requiresFocus ? 'integrity_check' : 'loading');
  const [questions, setQuestions] = useState<HeatQuestionRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Active question state ───────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const questionDisplayedAtRef = useRef<number>(0);

  // ── Score / streak ──────────────────────────────────────────────────────
  const [score, setScore] = useState(0);                  // running points (used only for FeedbackOverlay)
  const [streak, setStreak] = useState(0);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0); // surfaced as "Correct: X/Y" in HUD

  // ── Feedback overlay ────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState<
    | {
        isCorrect: boolean;
        pointsEarned: number;
        timeBonus: number;
        correctAnswer?: string;
      }
    | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Global timer ────────────────────────────────────────────────────────
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const heatStartedAtRef = useRef<number>(Date.now());

  // ── Focus Mode ──────────────────────────────────────────────────────────
  const focusModeRef = useRef<FocusMode | null>(null);
  const [focusConfig, setFocusConfig] = useState<IntegrityConfig | null>(null);
  const [focusWarning, setFocusWarning] = useState<{
    message: string;
    violationCount: number;
    penaltySeconds?: number;
  } | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // ───────────────────────────────────────────────────────────────────────
  // Load Heat questions
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'integrity_check') return;        // wait for user consent
    if (phase !== 'loading') return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('heat_questions')
        .select('*, question_generators ( generator_type )')
        .eq('heat_id', heatId)
        .order('question_number', { ascending: true });

      if (cancelled) return;

      if (error) {
        setLoadError(error.message);
        return;
      }
      if (!data || data.length === 0) {
        setLoadError('No questions found for this Heat.');
        return;
      }

      setQuestions(data as HeatQuestionRow[]);
      heatStartedAtRef.current = Date.now();
      questionDisplayedAtRef.current = Date.now();
      setPhase('playing');
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, heatId, supabase]);

  // ───────────────────────────────────────────────────────────────────────
  // Global countdown timer
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    if (secondsRemaining <= 0) {
      setPhase('time_up');
      return;
    }
    const t = setTimeout(
      () => setSecondsRemaining((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearTimeout(t);
  }, [phase, secondsRemaining]);

  // ───────────────────────────────────────────────────────────────────────
  // Focus Mode boot
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    if (!requiresFocus) return;
    if (focusModeRef.current) return;            // already started

    let cancelled = false;
    (async () => {
      const config = await loadIntegrityConfig(integrityLevel as IntegrityLevel);
      if (cancelled || !config) return;
      setFocusConfig(config);

      const focus = new FocusMode(participationId, config, {
        onViolation: async (_violation, total) => {
          setViolationCount(total);
          await bumpFocusViolationCount(total);
        },
        onWarning: (message, count) => {
          setFocusWarning({
            message,
            violationCount: count,
            penaltySeconds: 5,
          });
        },
        onPenalty: (seconds, totalPenalty) => {
          setFocusWarning((prev) =>
            prev
              ? { ...prev, penaltySeconds: seconds }
              : { message: 'Focus penalty applied', violationCount: violationCount, penaltySeconds: seconds }
          );
          // Apply the time penalty to the global clock
          setSecondsRemaining((s) => Math.max(0, s - seconds));
          void totalPenalty;
        },
        onFlag: async (reason) => {
          setIsFlagged(true);
          await markFlagged(reason);
        },
        onDisqualify: async () => {
          setIsFlagged(true);
          await markFlagged('Automatic disqualification — too many focus violations');
          setPhase('finished');
        },
      });
      focus.start();
      focusModeRef.current = focus;

      // District+ : try to enter fullscreen
      if (['district', 'regional', 'state', 'national'].includes(integrityLevel)) {
        try {
          await document.documentElement.requestFullscreen?.();
        } catch {
          /* user-initiated requirement may block this — Focus Mode logs it */
        }
      }
    })();

    return () => {
      cancelled = true;
      if (focusModeRef.current) {
        focusModeRef.current.stop();
        focusModeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, requiresFocus, integrityLevel, participationId]);

  // Tell Focus Mode which question we're on so its violation rows are accurate
  useEffect(() => {
    if (focusModeRef.current && questions[currentIndex]) {
      focusModeRef.current.setCurrentQuestion(questions[currentIndex].question_number);
    }
  }, [currentIndex, questions]);

  // ───────────────────────────────────────────────────────────────────────
  // DB helpers
  // ───────────────────────────────────────────────────────────────────────

  const bumpFocusViolationCount = useCallback(
    async (totalCount: number) => {
      // focus_violation_count is the canonical INTEGER counter on
      // heat_participations (focus_violations is a legacy duplicate). We
      // overwrite with the running total so it always matches what the
      // client observed.
      await supabase
        .from('heat_participations')
        .update({ focus_violation_count: totalCount })
        .eq('id', participationId);
    },
    [participationId, supabase]
  );

  const markFlagged = useCallback(
    async (reason: string) => {
      await supabase
        .from('heat_participations')
        .update({ is_flagged: true, flag_reason: reason })
        .eq('id', participationId);
    },
    [participationId, supabase]
  );

  // ───────────────────────────────────────────────────────────────────────
  // Submission
  // ───────────────────────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const shape = useMemo(
    () => (currentQuestion ? shapeOf(currentQuestion) : null),
    [currentQuestion]
  );

  const handleSubmit = useCallback(
    async (submittedAnswer: string) => {
      if (!currentQuestion || submitting || phase !== 'playing') return;
      const trimmed = submittedAnswer.trim();
      if (!trimmed) return;

      setSubmitting(true);
      const now = Date.now();
      const timeTakenMs = now - questionDisplayedAtRef.current;

      // Validate
      let isCorrect = false;
      if (shape?.kind === 'free_text') {
        const result = validateAnswer(
          trimmed,
          currentQuestion.correct_answer,
          currentQuestion.answer_type as AnswerType
        );
        isCorrect = result.is_correct;
      } else {
        // MC: compare letters case-insensitively
        isCorrect =
          trimmed.toUpperCase() === currentQuestion.correct_answer.trim().toUpperCase();
      }

      // Scoring (per Sprint 4 spec)
      const basePoints = currentQuestion.points_value ?? 100;
      const remainingMs = currentQuestion.time_limit_seconds * 1000 - timeTakenMs;
      const timeBonus = Math.max(0, Math.floor(remainingMs / 1000));
      const cappedBonus = Math.min(timeBonus, 50);
      const pointsEarned = isCorrect ? basePoints + cappedBonus : 0;

      // INSERT question_submissions (verified column names)
      const { error: subError } = await supabase.from('question_submissions').insert({
        heat_participation_id: participationId,
        heat_question_id: currentQuestion.id,
        submitted_answer: trimmed,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        attempt_number: 1,
        points_earned: pointsEarned,
      });

      if (subError) {
        console.error('[CompetitionView] failed to save submission:', subError.message);
      }

      // Update heat_participations counters (verified column names)
      const nextAttempted = questionsAttempted + 1;
      const updates: Record<string, any> = {
        questions_attempted: nextAttempted,
        questions_correct: score > 0 || isCorrect ? undefined : 0, // placeholder
        total_time_ms: (Date.now() - heatStartedAtRef.current),
        ranking_points_earned: score + pointsEarned,
      };
      // Compute correctly via DB read-modify? — keep client-authoritative for
      // MVP. The scoring-service.calculateHeatResults() recomputes from the
      // submission rows at end-of-Heat anyway, so transient drift is fine.
      const { data: cur } = await supabase
        .from('heat_participations')
        .select('questions_correct, first_touch_correct')
        .eq('id', participationId)
        .maybeSingle();

      const newCorrect = (cur?.questions_correct ?? 0) + (isCorrect ? 1 : 0);
      const newFirstTouch = (cur?.first_touch_correct ?? 0) + (isCorrect ? 1 : 0);

      await supabase
        .from('heat_participations')
        .update({
          questions_attempted: nextAttempted,
          questions_correct: newCorrect,
          first_touch_correct: newFirstTouch,
          ranking_points_earned: score + pointsEarned,
          total_time_ms: Date.now() - heatStartedAtRef.current,
        })
        .eq('id', participationId);

      // Local state updates
      setScore((s) => s + pointsEarned);
      setStreak((s) => (isCorrect ? s + 1 : 0));
      setQuestionsAttempted(nextAttempted);
      if (isCorrect) setQuestionsCorrect((c) => c + 1);
      setFeedback({
        isCorrect,
        pointsEarned,
        timeBonus: cappedBonus,
        correctAnswer: isCorrect ? undefined : currentQuestion.correct_answer,
      });

      // Auto-advance after a short pause
      const pause = isCorrect ? 800 : 1200;
      setTimeout(() => {
        setFeedback(null);
        setAnswer('');
        setSubmitting(false);
        if (currentIndex >= questions.length - 1) {
          setPhase('finished');
        } else {
          setCurrentIndex((i) => i + 1);
          questionDisplayedAtRef.current = Date.now();
        }
      }, pause);
    },
    [
      currentQuestion,
      shape,
      submitting,
      phase,
      currentIndex,
      questions.length,
      questionsAttempted,
      score,
      participationId,
      supabase,
    ]
  );

  // Auto-submit any text in flight when time runs out
  useEffect(() => {
    if (phase !== 'time_up') return;
    if (focusModeRef.current) {
      focusModeRef.current.stop();
      focusModeRef.current = null;
    }
  }, [phase]);

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  if (phase === 'integrity_check') {
    // Lightweight integrity check — full IntegrityCheckModal is reserved
    // for higher-tier Heats. For MVP we just confirm intent and proceed.
    return (
      <IntegrityGate
        level={integrityLevel as IntegrityLevel}
        onAccept={() => setPhase('loading')}
      />
    );
  }

  if (loadError) {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-red-300" />}
        title="Could not load Heat"
        message={loadError}
      />
    );
  }

  if (phase === 'loading' || !currentQuestion || !shape) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
        <p className="mt-4 text-white/70 text-sm">Loading questions…</p>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <FullScreenMessage
        icon={<Trophy className="w-10 h-10 text-amber-300" />}
        title="You're done!"
        message="Hang tight — waiting for your teacher to end the Heat so we can score everyone."
        correct={questionsCorrect}
        total={questions.length}
        streak={streak}
      />
    );
  }

  if (phase === 'time_up') {
    return (
      <FullScreenMessage
        icon={<Clock className="w-10 h-10 text-amber-300" />}
        title="Time's up!"
        message="The timer ran out. Your answers have been saved — waiting for results."
        correct={questionsCorrect}
        total={questions.length}
        streak={streak}
      />
    );
  }

  // ── Playing UI ──────────────────────────────────────────────────────────
  const progressPct = questions.length
    ? Math.round((questionsAttempted / questions.length) * 100)
    : 0;
  const totalSeconds = durationSeconds;
  const timerColor =
    secondsRemaining > totalSeconds * 0.5
      ? 'text-emerald-300'
      : secondsRemaining > totalSeconds * 0.25
      ? 'text-amber-300'
      : 'text-red-300 animate-pulse';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col">
      {isFlagged && (
        <FlaggedBanner
          reason="Your session has been flagged — your teacher will review it."
          onAcknowledge={() => setIsFlagged(false)}
        />
      )}

      {/* Top bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 text-white text-sm">
              <span className="font-semibold">
                Q {currentIndex + 1}/{questions.length}
              </span>
              {streak >= 2 && (
                <span className="inline-flex items-center gap-1 text-amber-300 text-xs font-semibold bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
                  <Flame className="w-3 h-3" />
                  {streak}x streak
                </span>
              )}
            </div>
            <div className="text-right">
              {/* CTA framework: hide raw point totals during gameplay — they
                  encourage "pointsification" (Kapp 2012). Show progress
                  toward correctness instead, which is pedagogically actionable. */}
              <p className="text-xs text-white/50 uppercase tracking-wider leading-none mb-0.5">
                Correct
              </p>
              <p className="text-lg font-bold text-emerald-300 font-mono leading-none">
                {questionsCorrect}/{questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${timerColor}`} />
              <span className={`text-lg font-bold font-mono ${timerColor}`}>
                {formatClock(secondsRemaining)}
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 px-4 py-6 md:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-full px-2.5 py-1">
            <Award className="w-3.5 h-3.5" />
            {currentQuestion.points_value} pts
            <span className="text-white/40">·</span>
            Depth {currentQuestion.difficulty}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
            {/* Prompt */}
            <div
              className="text-gray-900 text-lg md:text-2xl font-semibold leading-snug mb-6"
              dangerouslySetInnerHTML={renderMath(shape.prompt)}
            />

            {/* SVG */}
            {shape.svg && (
              <div
                className="w-full overflow-x-auto mb-6 bg-gray-50 rounded-xl p-3 border border-gray-100 [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: shape.svg }}
              />
            )}

            {/* Input */}
            {shape.kind === 'free_text' ? (
              <>
                <FreeTextInput
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={() => handleSubmit(answer)}
                  disabled={submitting || !!feedback}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {formatHintFor(
                    currentQuestion.answer_type,
                    currentQuestion.question_generators?.generator_type ?? null
                  )}
                </p>
              </>
            ) : (
              <MCButtons
                options={shape.options}
                onPick={(letter) => handleSubmit(letter)}
                disabled={submitting || !!feedback}
              />
            )}
          </div>
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <FeedbackOverlay
          isCorrect={feedback.isCorrect}
          pointsEarned={feedback.pointsEarned}
          timeBonus={feedback.timeBonus}
          correctAnswer={feedback.correctAnswer}
        />
      )}

      {/* Focus warning */}
      {focusWarning && focusConfig && (
        <FocusWarningOverlay
          isVisible
          message={focusWarning.message}
          violationCount={focusWarning.violationCount}
          maxViolations={focusConfig.flag_threshold}
          penaltySeconds={focusWarning.penaltySeconds}
          onDismiss={() => setFocusWarning(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function IntegrityGate({
  level,
  onAccept,
}: {
  level: IntegrityLevel;
  onAccept: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-100 mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Ready to compete?
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          This Heat is running at the <span className="font-semibold capitalize">{level}</span> integrity level.
          Tab switching, copying, and developer tools will be monitored.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="w-full py-3 rounded-xl font-bold text-base bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 active:scale-[0.98] transition-all shadow-lg"
        >
          I'm ready
        </button>
      </div>
    </div>
  );
}

function FreeTextInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer…"
        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-lg font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={`px-6 py-3 min-h-[48px] rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
          disabled || !value.trim()
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
        }`}
      >
        Submit
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function MCButtons({
  options,
  onPick,
  disabled,
}: {
  options: string[];
  onPick: (letter: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((opt, idx) => {
        const letter = MC_LETTERS[idx] ?? `${idx + 1}`;
        return (
          <button
            key={`${letter}-${idx}`}
            type="button"
            onClick={() => onPick(letter)}
            disabled={disabled}
            className={`group flex items-center gap-3 p-4 min-h-[56px] rounded-xl border-2 text-left transition-all ${
              disabled
                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 bg-white text-gray-900 hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.99]'
            }`}
          >
            <span
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                disabled
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
              } transition-colors`}
            >
              {letter}
            </span>
            <span
              className="text-base font-medium"
              dangerouslySetInnerHTML={renderMath(opt)}
            />
          </button>
        );
      })}
    </div>
  );
}

function FeedbackOverlay({
  isCorrect,
  pointsEarned,
  timeBonus,
  correctAnswer,
}: {
  isCorrect: boolean;
  pointsEarned: number;
  timeBonus: number;
  correctAnswer?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
      <div
        className={`max-w-sm w-[90%] rounded-2xl p-6 md:p-8 shadow-2xl text-center border-4 animate-in zoom-in-90 fade-in duration-150 ${
          isCorrect
            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
            : 'bg-red-50 border-red-400 text-red-900'
        }`}
      >
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            isCorrect ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {isCorrect ? (
            <Check className="w-9 h-9 text-white" />
          ) : (
            <X className="w-9 h-9 text-white" />
          )}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-2">
          {isCorrect ? 'Correct!' : 'Not quite.'}
        </h3>
        {isCorrect ? (
          <p className="text-base md:text-lg font-semibold">
            +{pointsEarned} pts
            {timeBonus > 0 && (
              <span className="text-emerald-700 text-sm font-medium ml-2">
                ({timeBonus} time bonus)
              </span>
            )}
          </p>
        ) : (
          correctAnswer && (
            <p className="text-base md:text-lg">
              Correct answer:{' '}
              <span
                className="font-bold font-mono"
                dangerouslySetInnerHTML={renderMath(correctAnswer)}
              />
            </p>
          )
        )}
      </div>
    </div>
  );
}

function FullScreenMessage({
  icon,
  title,
  message,
  correct,
  total,
  streak,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  correct?: number;
  total?: number;
  streak?: number;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-6">
          {icon}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-indigo-200 text-sm md:text-base">{message}</p>
        {typeof correct === 'number' && typeof total === 'number' && (
          <div className="mt-6 flex items-center justify-center gap-6">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Correct</p>
              <p className="text-3xl font-bold text-emerald-300 font-mono">
                {correct}/{total}
              </p>
            </div>
            {typeof streak === 'number' && (
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Best streak</p>
                <p className="text-3xl font-bold text-amber-300 font-mono">{streak}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
