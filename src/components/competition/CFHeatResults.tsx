'use client';
// =============================================================================
// CFHeatResults — Post-Heat Results Screen (Cloudflare HeatRoom transport)
// =============================================================================
// Displays the final podium, full leaderboard with country flags, and the
// current user's personal stats after a Heat completes.
// =============================================================================

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Medal, Target, Timer, Trophy, Zap } from 'lucide-react';
import type { CFParticipant } from '@/lib/competition/heat-realtime-cf';
import { CountryFlag } from '@/components/competition/CountryFlag';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CFHeatResultsProps {
  heatCode: string;
  participants: CFParticipant[];
  currentUserId: string;
  totalQuestions: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function podiumHeight(rank: number): string {
  if (rank === 1) return 'h-24';
  if (rank === 2) return 'h-16';
  return 'h-10';
}

function podiumColour(rank: number): string {
  if (rank === 1) return 'from-amber-400 to-yellow-500';
  if (rank === 2) return 'from-slate-300 to-slate-400';
  return 'from-orange-400 to-amber-600';
}

function medalIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-amber-300" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CFHeatResults({
  heatCode,
  participants,
  currentUserId,
  totalQuestions,
}: CFHeatResultsProps) {
  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTimeMs - b.totalTimeMs;
  });

  const me = sorted.find((p) => p.userId === currentUserId);
  const myRank = me ? sorted.indexOf(me) + 1 : null;
  const top3 = sorted.slice(0, 3);

  // Reorder podium: 2nd, 1st, 3rd for visual effect
  const podiumOrder =
    top3.length >= 3
      ? [top3[1]!, top3[0]!, top3[2]!]
      : top3.length === 2
      ? [top3[1]!, top3[0]!]
      : top3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-4">
            <Trophy className="w-3.5 h-3.5" /> Heat {heatCode} — Final Results
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {myRank === 1
              ? '🏆 You won!'
              : myRank && myRank <= 3
              ? `🎉 Top ${myRank} finish!`
              : 'Heat Complete'}
          </h1>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {podiumOrder.map((p, i) => {
              const rank = sorted.indexOf(p) + 1;
              return (
                <div key={p.userId} className="flex flex-col items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <CountryFlag code={p.countryCode} size="md" />
                    <p className="text-xs text-white font-semibold text-center max-w-[80px] truncate">
                      {p.displayName}
                    </p>
                    <p className="text-sm font-black text-amber-300">{p.score} pts</p>
                  </div>
                  <div
                    className={`w-20 ${podiumHeight(rank)} rounded-t-xl bg-gradient-to-b ${podiumColour(rank)} flex items-start justify-center pt-2`}
                  >
                    <span className="text-white font-black text-lg">#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My stats card */}
        {me && (
          <div className="bg-white/10 backdrop-blur-lg border border-amber-400/20 rounded-2xl p-5 mb-6">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Your Performance
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={<Trophy className="w-4 h-4 text-amber-300" />}
                label="Rank"
                value={`#${myRank}`}
              />
              <StatCard
                icon={<Zap className="w-4 h-4 text-amber-300" />}
                label="Score"
                value={`${me.score} pts`}
              />
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                label="Correct"
                value={`${me.questionsCorrect} / ${totalQuestions}`}
              />
              <StatCard
                icon={<Timer className="w-4 h-4 text-indigo-300" />}
                label="Avg time"
                value={
                  me.questionsAttempted > 0
                    ? formatTime(me.totalTimeMs / me.questionsAttempted)
                    : '—'
                }
              />
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-white/60" />
            <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Full Standings
            </h2>
          </div>
          <ol className="space-y-2">
            {sorted.map((p, idx) => {
              const rank = idx + 1;
              const isMe = p.userId === currentUserId;
              const accuracy =
                p.questionsAttempted > 0
                  ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100)
                  : 0;
              return (
                <li
                  key={p.userId}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isMe
                      ? 'bg-amber-400/10 border border-amber-400/30'
                      : 'bg-white/5 border border-transparent'
                  }`}
                >
                  <span
                    className={`text-sm font-black w-6 text-center flex-shrink-0 ${
                      rank === 1
                        ? 'text-amber-300'
                        : rank === 2
                        ? 'text-slate-300'
                        : rank === 3
                        ? 'text-orange-400'
                        : 'text-white/30'
                    }`}
                  >
                    {medalIcon(rank) ?? rank}
                  </span>
                  <CountryFlag code={p.countryCode} size="sm" />
                  <span className="flex-1 text-sm text-white font-medium truncate">
                    {p.displayName}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] text-amber-300 font-normal">(you)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <span className="text-xs text-white/40 hidden sm:block">
                      {accuracy}% acc
                    </span>
                    <span className="text-sm font-bold text-amber-300 tabular-nums w-14 text-right">
                      {p.score} pts
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/compete"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compete
          </Link>
          <Link
            href="/compete/create"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-sm font-bold hover:from-amber-300 hover:to-orange-400 transition-all"
          >
            <Zap className="w-4 h-4" />
            Start a New Heat
          </Link>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard micro-component
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white/5 rounded-xl p-3">
      {icon}
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
    </div>
  );
}
