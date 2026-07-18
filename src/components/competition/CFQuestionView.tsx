'use client';
// =============================================================================
// CFQuestionView — Active Heat Question UI (Cloudflare HeatRoom transport)
// =============================================================================
// Renders the live question during an active Heat, handles answer submission,
// shows a server-authoritative countdown timer, and displays the live
// leaderboard sidebar after each answer is acknowledged.
//
// Props come directly from the useHeatRoom hook result.
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import type { CFQuestion, CFParticipant, AnswerAck } from '@/lib/competition/heat-realtime-cf';
import { CountryFlag } from '@/components/competition/CountryFlag';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CFQuestionViewProps {
  question: CFQuestion;
  participants: CFParticipant[];
  lastAnswerAck: AnswerAck | null;
  currentUserId: string;
  submitAnswer: (answer: string) => void;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CFQuestionView({
  question,
  participants,
  lastAnswerAck,
  currentUserId,
  submitAnswer,
  connectionState,
}: CFQuestionViewProps) {
  const [freeResponseInput, setFreeResponseInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(question.timeLimitSeconds);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Server-authoritative countdown ───────────────────────────────────────
  // We derive remaining time from the server-provided `endsAt` timestamp
  // rather than counting down from a local start, so all clients stay in sync.
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.floor((question.endsAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    tick(); // immediate first tick
    timerRef.current = setInterval(tick, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question.endsAt]);

  // ── Reset state when a new question arrives ───────────────────────────────
  useEffect(() => {
    setFreeResponseInput('');
    setSelectedOption(null);
    setSubmitted(false);
    if (inputRef.current) inputRef.current.focus();
  }, [question.questionIndex]);

  // ── Handle answer ack ─────────────────────────────────────────────────────
  const isAckForThisQuestion =
    lastAnswerAck?.questionIndex === question.questionIndex;

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleFreeResponseSubmit = useCallback(() => {
    if (submitted || !freeResponseInput.trim()) return;
    setSubmitted(true);
    submitAnswer(freeResponseInput.trim());
  }, [submitted, freeResponseInput, submitAnswer]);

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (submitted) return;
      setSelectedOption(option);
      setSubmitted(true);
      submitAnswer(option);
    },
    [submitted, submitAnswer]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleFreeResponseSubmit();
    },
    [handleFreeResponseSubmit]
  );

  // ── Timer colour ──────────────────────────────────────────────────────────
  const timerColour =
    timeRemaining > 10
      ? 'text-emerald-300'
      : timeRemaining > 5
      ? 'text-amber-300'
      : 'text-red-400 animate-pulse';

  // ── Sorted leaderboard ────────────────────────────────────────────────────
  const leaderboard = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTimeMs - b.totalTimeMs;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-6 md:py-10">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Left: Question panel ─────────────────────────────────────── */}
        <div className="md:col-span-2 flex flex-col gap-4">

          {/* Progress + timer bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Question {question.questionIndex + 1} / {question.totalQuestions}
            </span>
            <div className={`flex items-center gap-1.5 text-lg font-black tabular-nums ${timerColour}`}>
              <Clock className="w-4 h-4" />
              {timeRemaining}s
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{
                width: `${((question.questionIndex + 1) / question.totalQuestions) * 100}%`,
              }}
            />
          </div>

          {/* Connection warning */}
          {connectionState === 'reconnecting' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-sm">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              Reconnecting… your answers are saved locally.
            </div>
          )}
          {connectionState === 'disconnected' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Connection lost. Attempting to reconnect…
            </div>
          )}

          {/* Question card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-amber-300/70 uppercase tracking-wider">
                {question.pointsValue} pt{question.pointsValue !== 1 ? 's' : ''}
              </span>
              {submitted && isAckForThisQuestion && (
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    lastAnswerAck!.correct ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {lastAnswerAck!.correct ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> +{lastAnswerAck!.pointsEarned}</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Incorrect</>
                  )}
                </span>
              )}
            </div>

            {/* Question text — render LaTeX if present, otherwise plain text */}
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-6 whitespace-pre-wrap">
              {question.questionText}
            </p>

            {/* Answer UI */}
            {question.answerType === 'multiple_choice' && question.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = isAckForThisQuestion && lastAnswerAck?.correctAnswer === option;
                  const isWrong = isSelected && isAckForThisQuestion && !lastAnswerAck?.correct;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      disabled={submitted || timeRemaining === 0}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        isCorrect
                          ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200'
                          : isWrong
                          ? 'border-red-400 bg-red-400/10 text-red-200'
                          : isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                          : submitted
                          ? 'border-white/10 bg-white/5 text-white/40 cursor-not-allowed'
                          : 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={freeResponseInput}
                  onChange={(e) => setFreeResponseInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitted || timeRemaining === 0}
                  placeholder="Type your answer…"
                  className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/60 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleFreeResponseSubmit}
                  disabled={submitted || !freeResponseInput.trim() || timeRemaining === 0}
                  className="px-5 py-3 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Time's up */}
            {timeRemaining === 0 && !submitted && (
              <p className="mt-4 text-center text-sm text-red-300/80">
                Time&apos;s up — waiting for the next question…
              </p>
            )}

            {/* Correct answer reveal after ack */}
            {isAckForThisQuestion && !lastAnswerAck!.correct && (
              <p className="mt-3 text-sm text-white/50">
                Correct answer:{' '}
                <span className="text-emerald-300 font-semibold">
                  {lastAnswerAck!.correctAnswer}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Live leaderboard ──────────────────────────────────── */}
        <div className="md:col-span-1">
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-4 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-300" />
              <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Live Standings
              </h2>
            </div>
            <ol className="space-y-2">
              {leaderboard.map((p, idx) => {
                const isMe = p.userId === currentUserId;
                return (
                  <li
                    key={p.userId}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all ${
                      isMe
                        ? 'bg-amber-400/10 border border-amber-400/30'
                        : 'bg-white/5 border border-transparent'
                    }`}
                  >
                    <span
                      className={`text-xs font-black w-5 text-center flex-shrink-0 ${
                        idx === 0
                          ? 'text-amber-300'
                          : idx === 1
                          ? 'text-slate-300'
                          : idx === 2
                          ? 'text-orange-400'
                          : 'text-white/40'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <CountryFlag countryCode={p.countryCode} size="sm" />
                    <span className="flex-1 text-sm text-white font-medium truncate">
                      {p.displayName}
                      {isMe && (
                        <span className="ml-1 text-[10px] text-amber-300">(you)</span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-amber-300 tabular-nums flex-shrink-0">
                      {p.score}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
