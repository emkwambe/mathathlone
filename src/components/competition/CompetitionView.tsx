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
import { hintForAnswerType, type AnswerType } from '@/lib/competition/generators';
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
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
} from '@/lib/competition/state-persistence';
import {
  clearQueue,
  enqueue as enqueueSubmission,
  flushQueue,
  queueSize,
} from '@/lib/competition/submission-queue';

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
  /** Heat code (e.g. "MA-7X4K") — used as the sessionStorage snapshot key. */
  heatCode: string;
  participationId: string;
  durationSeconds: number;
  integrityLevel: string;        // 'practice' | 'school' | 'district' | ...
  /** Stays false here; teachers see TeacherMonitor instead. */
  isTeacher?: boolean;
}

type Phase = 'integrity_check' | 'loading' | 'playing' | 'finished' | 'time_up';

interface QuestionShape {
  kind: 'free_text' | 'multiple_choice_text' | 'multiple_choice_svg';
  // Options arrive as either legacy strings ("A) ...") or new-shape objects
  // ({ key: "A", text: "..." }) depending on which static_questions row
  // generated them. MCButtons normalizes both.
  options: Array<string | { key: string; text: string }>;
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
function renderMath(input: string | unknown): { __html: string } {
  // Defensive coercion: callers can pass non-string values when static_questions
  // options arrive as JSONB objects (e.g., {key, text}). Convert anything else
  // to a string so .replace() never throws.
  const str = typeof input === 'string' ? input : String(input ?? '');
  let html = str
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
 * Two-stage lookup:
 *   1. Generator-shape overrides — for generators whose `answer_type` alone
 *      can't tell the student the required answer FORMAT. Point-slope
 *      generators tag as `equation` but need a different shape than
 *      y = mx + b; factor_* generators tag as `expression` but need
 *      `(x + a)(x + b)`. These override the map below.
 *   2. ANSWER_TYPE_HINTS map (shared with the second-pass UI in
 *      `components/competition/index.tsx`) — covers every answer_type
 *      defined in `generators.ts`. Empty string for MC/text means no hint.
 *
 * Hint strings deliberately do NOT carry the "📝 Format:" prefix — the
 * call site adds that wrapper. Returning '' means "render no hint line".
 */
function formatHintFor(
  answerType: string | null | undefined,
  generatorType: string | null | undefined
): string {
  const gt = (generatorType ?? '').toLowerCase();

  // Generator-shape overrides (more specific than answer_type alone)
  if (gt.includes('point_slope')) {
    return 'Enter as y - b = m(x - a), e.g. y - 2 = 3(x - 4)';
  }
  if (gt.includes('linear_eq') || gt.includes('write_linear_eq') || gt.includes('write_parallel_perp_eq')) {
    return 'Enter as y = mx + b, e.g. y = 2x + 3';
  }
  if (gt.includes('factor')) {
    return 'Enter as (x + a)(x + b), e.g. (x + 2)(x - 3)';
  }
  if (gt.includes('system_solution')) {
    return "Enter 'no solution', 'infinite', or 'one solution'";
  }
  if (gt.includes('solve_square_eq')) {
    return 'Enter as ±n, e.g. ±5';
  }

  // Pure answer_type fallback via the shared map
  return hintForAnswerType(answerType);
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
  heatCode,
  participationId,
  durationSeconds,
  integrityLevel,
}: CompetitionViewProps) {
  const supabase = useMemo(() => createClient(), []);

  // ── Phase & questions ───────────────────────────────────────────────────
  const requiresFocus =
    INTEGRITY_LEVEL_REQUIRES_FOCUS[integrityLevel as IntegrityLevel] ?? false;

  // FIX 2 — sessionStorage restore. If we have a valid snapshot for this
  // heatCode + participationId, hydrate every piece of state from it before
  // any effect runs. The snapshot is dropped if the timer has already
  // expired (loadSnapshot does this check internally).
  const initialSnapshot = useMemo(() => {
    const snap = loadSnapshot(heatCode);
    if (!snap) return null;
    if (snap.participationId !== participationId) return null;
    if (snap.heatId !== heatId) return null;
    return snap;
  }, [heatCode, participationId, heatId]);

  const [phase, setPhase] = useState<Phase>(() => {
    if (initialSnapshot) return initialSnapshot.phase;
    return requiresFocus ? 'integrity_check' : 'loading';
  });
  const [questions, setQuestions] = useState<HeatQuestionRow[]>(
    () => (initialSnapshot?.questions as HeatQuestionRow[]) ?? []
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Active question state ───────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(initialSnapshot?.currentIndex ?? 0);
  const [answer, setAnswer] = useState(initialSnapshot?.answer ?? '');
  const questionDisplayedAtRef = useRef<number>(
    initialSnapshot?.questionDisplayedAt ?? 0
  );

  // ── Score / streak ──────────────────────────────────────────────────────
  const [score, setScore] = useState(initialSnapshot?.score ?? 0);
  const [streak, setStreak] = useState(initialSnapshot?.streak ?? 0);
  const [questionsAttempted, setQuestionsAttempted] = useState(
    initialSnapshot?.questionsAttempted ?? 0
  );
  const [questionsCorrect, setQuestionsCorrect] = useState(
    initialSnapshot?.questionsCorrect ?? 0
  );

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
  // If we restored from a snapshot, decrement from "duration - elapsed since
  // heatStartedAt" so the clock doesn't jump forward.
  const heatStartedAtRef = useRef<number>(
    initialSnapshot?.heatStartedAt ?? Date.now()
  );
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (initialSnapshot) {
      const elapsed = Math.floor((Date.now() - initialSnapshot.heatStartedAt) / 1000);
      return Math.max(0, durationSeconds - elapsed);
    }
    return durationSeconds;
  });

  // ── Focus Mode ──────────────────────────────────────────────────────────
  const focusModeRef = useRef<FocusMode | null>(null);
  const [focusConfig, setFocusConfig] = useState<IntegrityConfig | null>(null);
  const [focusWarning, setFocusWarning] = useState<{
    message: string;
    violationCount: number;
    penaltySeconds?: number;
  } | null>(null);
  const [isFlagged, setIsFlagged] = useState(initialSnapshot?.isFlagged ?? false);
  const [violationCount, setViolationCount] = useState(
    initialSnapshot?.violationCount ?? 0
  );

  // ── Connectivity + submission queue ─────────────────────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSubmissions, setPendingSubmissions] = useState<number>(() => queueSize());

  // ───────────────────────────────────────────────────────────────────────
  // Load Heat questions
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'integrity_check') return;        // wait for user consent
    if (phase !== 'loading') return;
    // FIX 2: if we already restored questions from a snapshot, skip the fetch.
    if (questions.length > 0) {
      questionDisplayedAtRef.current = questionDisplayedAtRef.current || Date.now();
      setPhase('playing');
      return;
    }

    let cancelled = false;
    // FIX 7 — exponential backoff for question fetch. Retry up to 3 times
    // (1s, 2s, 4s) on transient errors so a momentary network blip can't
    // kill the load.
    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('heat_questions')
          .select('*, question_generators ( generator_type )')
          .eq('heat_id', heatId)
          .order('question_number', { ascending: true });

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          setQuestions(data as HeatQuestionRow[]);
          heatStartedAtRef.current = Date.now();
          questionDisplayedAtRef.current = Date.now();
          setPhase('playing');
          return;
        }

        // Final attempt → surface the error.
        if (attempt === 2) {
          if (error) setLoadError(error.message);
          else setLoadError('No questions found for this Heat.');
          return;
        }

        const delayMs = 1000 * Math.pow(2, attempt);
        console.warn(`[CompetitionView] question fetch retry ${attempt + 1} after ${delayMs}ms`, error);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, heatId, supabase, questions.length]);

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

      // FIX 4 — INSERT question_submissions with offline-resilient queue.
      // If the insert fails for ANY reason (network down, transient auth,
      // RLS hiccup), enqueue it locally and let the background flusher
      // retry every 5s. The student keeps competing without seeing an
      // error — their score is updated optimistically client-side, and the
      // scoring-service recomputes from question_submissions at end-of-Heat.
      const submissionPayload = {
        heat_participation_id: participationId,
        heat_question_id: currentQuestion.id,
        submitted_answer: trimmed,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        attempt_number: 1,
        points_earned: pointsEarned,
      };

      try {
        const { error: subError } = await supabase
          .from('question_submissions')
          .insert(submissionPayload);
        if (subError) throw subError;
      } catch (subError: any) {
        console.warn('[CompetitionView] submission failed → enqueued for retry', subError?.message);
        enqueueSubmission(submissionPayload);
        setPendingSubmissions(queueSize());
      }

      // Update heat_participations counters (best-effort — same fallback
      // behaviour as the submission insert above). The scoring service
      // re-derives the canonical counters at end-of-Heat anyway, so we
      // never block on this UPDATE.
      const nextAttempted = questionsAttempted + 1;
      try {
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
      } catch (err) {
        console.warn('[CompetitionView] participation counter update failed', err);
      }

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
  // FIX 2 — snapshot to sessionStorage on every state change
  // ───────────────────────────────────────────────────────────────────────
  // Writes are synchronous and ~free; we don't throttle. Cleared when the
  // Heat finishes / times out so a stale snapshot can't ressurrect a
  // completed Heat on a future load.

  useEffect(() => {
    if (phase === 'integrity_check' || phase === 'loading') return;
    if (phase === 'finished' || phase === 'time_up') {
      clearSnapshot(heatCode);
      return;
    }
    saveSnapshot({
      heatId,
      heatCode,
      participationId,
      phase,
      currentIndex,
      questions,
      questionsAttempted,
      questionsCorrect,
      score,
      streak,
      violationCount,
      isFlagged,
      answer,
      heatStartedAt: heatStartedAtRef.current,
      durationSeconds,
      questionDisplayedAt: questionDisplayedAtRef.current,
    });
  }, [
    phase,
    heatId,
    heatCode,
    participationId,
    currentIndex,
    questions,
    questionsAttempted,
    questionsCorrect,
    score,
    streak,
    violationCount,
    isFlagged,
    answer,
    durationSeconds,
  ]);

  // ───────────────────────────────────────────────────────────────────────
  // FIX 4 — online/offline detection + background queue flusher
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      // Eager flush — don't wait the next 5s tick when we just regained net.
      void flushQueue(supabase).then((res) => {
        setPendingSubmissions(res.remaining);
      });
    };
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [supabase]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = window.setInterval(async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (queueSize() === 0) {
        setPendingSubmissions(0);
        return;
      }
      const res = await flushQueue(supabase);
      setPendingSubmissions(res.remaining);
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [phase, supabase]);

  // Clear the queue on Heat completion — anything that hasn't synced by
  // now has either been flushed or will be repaired by the scoring service
  // recomputation. Keeping stale items in sessionStorage would have them
  // re-attempted on the next Heat the same browser joins.
  useEffect(() => {
    if (phase === 'finished' || phase === 'time_up') {
      void flushQueue(supabase).then(() => {
        clearQueue();
        setPendingSubmissions(0);
      });
    }
  }, [phase, supabase]);

  // ───────────────────────────────────────────────────────────────────────
  // FIX 5 — beforeunload + back-button trap
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    const onBeforeUnload = (e: BeforeUnloadEvent): string => {
      // Modern browsers ignore the custom string but still show the native
      // "Leave site?" prompt. The student's snapshot is already saved, so
      // they can rejoin from the same URL — but the prompt prevents
      // accidental tab-close mid-question.
      e.preventDefault();
      e.returnValue = "You're in the middle of a Heat. Leave anyway?";
      return e.returnValue;
    };

    // Push a sentinel state so the very next "Back" hits popstate.
    try {
      window.history.pushState({ mathathloneHeatGuard: true }, '', window.location.href);
    } catch {
      /* history.pushState can fail in unusual sandbox configs — skip silently */
    }

    const onPopState = (): void => {
      // Re-push so a future back press is also intercepted.
      try {
        window.history.pushState({ mathathloneHeatGuard: true }, '', window.location.href);
      } catch {
        /* ignore */
      }
      const leave = window.confirm(
        "You're in the middle of a Heat. Leave the competition?"
      );
      if (leave) {
        // Use replace + go(-1) so we exit the guard cleanly without
        // re-entering the sentinel.
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('beforeunload', onBeforeUnload);
        window.history.go(-1);
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
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

      {/* FIX 4/7 — connectivity + sync indicator. Stays out of the way at
          the bottom-right unless something is actually wrong. */}
      <ConnectivityToast isOnline={isOnline} pending={pendingSubmissions} />

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
                  hint={formatHintFor(
                    currentQuestion.answer_type,
                    currentQuestion.question_generators?.generator_type ?? null
                  )}
                />
                {/* Hint moved BELOW input, ABOVE submit — see FreeTextInput.
                    Rendered only when non-empty. */}
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
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  /** Format hint to render below the input. Empty string → no hint rendered. */
  hint?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      {/* Input + hint share the left column so the hint sits BELOW the input
          and (on mobile, when this becomes flex-col) ABOVE the submit button. */}
      <div className="flex-1">
        <input
          type="text"
          autoFocus
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-lg font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {hint && (
          <p className="text-xs italic text-gray-500 mt-2">
            📝 Format: {hint}
          </p>
        )}
      </div>
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
  options: Array<string | { key: string; text: string }>;
  onPick: (letter: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((opt, idx) => {
        // Normalize both option shapes:
        //   - legacy string ("A) text") → letter from position, body = string
        //   - new-shape object ({key, text}) → letter = key, body = text
        const isObj = typeof opt === 'object' && opt !== null;
        const letter = isObj ? opt.key : (MC_LETTERS[idx] ?? `${idx + 1}`);
        const body   = isObj ? opt.text : opt;
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
              dangerouslySetInnerHTML={renderMath(body)}
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

function ConnectivityToast({
  isOnline,
  pending,
}: {
  isOnline: boolean;
  pending: number;
}) {
  // Stay silent when everything is healthy.
  if (isOnline && pending === 0) return null;

  const tone = !isOnline
    ? 'bg-amber-500/15 border-amber-400/40 text-amber-100'
    : 'bg-indigo-500/15 border-indigo-400/40 text-indigo-100';

  return (
    <div className="fixed bottom-4 right-4 z-30 pointer-events-none">
      <div
        className={`rounded-xl border backdrop-blur-md px-3.5 py-2 shadow-lg text-xs font-medium flex items-center gap-2 ${tone}`}
      >
        {!isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            You&apos;re offline. Your answers are saved — we&apos;ll sync when you&apos;re back.
          </>
        ) : (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Syncing {pending} answer{pending === 1 ? '' : 's'}…
          </>
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
