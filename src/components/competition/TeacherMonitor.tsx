// =============================================================================
// MathAthlone — TeacherMonitor (Sprint 4)
// =============================================================================
// The teacher-side view rendered while heat.status ∈ {active, in_progress}.
// Teachers do NOT compete — they observe live Mathlete progress, watch for
// flagged sessions, and can end the Heat early.
//
// Realtime: piggy-backs on useHeatParticipants for the participants array, and
// uses its own postgres_changes subscription on heat_participations to react
// to questions_attempted / is_flagged updates without re-fetching constantly.
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Crown,
  Flag,
  Loader2,
  Octagon,
  ShieldAlert,
  Users,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { endHeat } from '@/lib/competition/heat-service';
import { listHeatParticipants } from '@/lib/competition/heat-service';
import { subscribeToHeat } from '@/lib/competition/heat-realtime';

// -----------------------------------------------------------------------------
// PROPS
// -----------------------------------------------------------------------------

interface TeacherMonitorProps {
  heatId: string;
  heatCode: string;
  questionCount: number;
  durationSeconds: number;
}

interface MonitorRow {
  id: string;
  athlete_id: string;
  display_name: string;
  questions_attempted: number;
  questions_correct: number;
  is_flagged: boolean;
  focus_violation_count: number;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function formatClock(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'M';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export default function TeacherMonitor({
  heatId,
  heatCode,
  questionCount,
  durationSeconds,
}: TeacherMonitorProps) {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<MonitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  // FIX 1 guard: ensure the timer-zero auto-end only fires once per mount.
  // Without this, a re-render after secondsRemaining settles at 0 (e.g. a
  // realtime tick) could re-enter the effect and call endHeat a second time.
  const autoEndFiredRef = useRef<boolean>(false);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await listHeatParticipants(supabase, heatId);
        if (cancelled) return;
        setRows(
          list.map((p) => ({
            id: p.id,
            athlete_id: p.athlete_id,
            display_name: p.display_name,
            questions_attempted: p.questions_attempted ?? 0,
            questions_correct: p.questions_correct ?? 0,
            is_flagged: !!p.is_flagged,
            focus_violation_count: p.focus_violation_count ?? 0,
          }))
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load participants');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [heatId, supabase]);

  // ── Realtime subscription: refresh on participant updates ───────────────
  useEffect(() => {
    if (!heatId) return;
    const channel = subscribeToHeat(supabase, heatId, {
      channelSuffix: 'monitor',                      // own channel — parent page already runs useHeatParticipants
      onParticipantInsert: async () => {
        // New joiner mid-Heat (rare) — refetch to pick up display_name
        const list = await listHeatParticipants(supabase, heatId);
        setRows(
          list.map((p) => ({
            id: p.id,
            athlete_id: p.athlete_id,
            display_name: p.display_name,
            questions_attempted: p.questions_attempted ?? 0,
            questions_correct: p.questions_correct ?? 0,
            is_flagged: !!p.is_flagged,
            focus_violation_count: p.focus_violation_count ?? 0,
          }))
        );
      },
      onParticipantUpdate: (row: any) => {
        // We get the new row directly — patch in place, preserve display_name.
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            questions_attempted: row.questions_attempted ?? next[idx].questions_attempted,
            questions_correct: row.questions_correct ?? next[idx].questions_correct,
            is_flagged: row.is_flagged ?? next[idx].is_flagged,
            focus_violation_count:
              row.focus_violation_count ?? next[idx].focus_violation_count,
          };
          return next;
        });
      },
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [heatId, supabase]);

  // ── Global timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const t = setTimeout(() => setSecondsRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsRemaining]);

  // FIX 1 — Auto-end Heat when the timer hits zero.
  // The teacher view promises "The Heat ends automatically when the timer
  // reaches zero" — actually honor that. Guarded by autoEndFiredRef so it
  // runs at most once, and gated on the live heat status being 'active'
  // (skip the call entirely if the teacher already ended early, or the
  // server has already advanced status).
  useEffect(() => {
    if (secondsRemaining > 0) return;
    if (ending) return;
    if (autoEndFiredRef.current) return;
    autoEndFiredRef.current = true;
    (async () => {
      try {
        const { data: heatRow } = await supabase
          .from('heats')
          .select('status')
          .eq('id', heatId)
          .maybeSingle();
        const status = (heatRow as { status: string } | null)?.status;
        if (status !== 'active' && status !== 'in_progress') {
          // Heat already advanced beyond active — nothing to do.
          return;
        }
        await handleEnd(true);
      } catch (err) {
        console.warn('[TeacherMonitor] auto-end on timer-zero failed:', err);
        // Allow a manual retry by un-latching the ref.
        autoEndFiredRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  // ── Sorted rows (most progress first; flagged sink) ────────────────────
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.questions_attempted !== a.questions_attempted) {
        return b.questions_attempted - a.questions_attempted;
      }
      return b.questions_correct - a.questions_correct;
    });
  }, [rows]);

  const flaggedCount = rows.filter((r) => r.is_flagged).length;
  const totalAttempts = rows.reduce((sum, r) => sum + (r.questions_attempted ?? 0), 0);
  const totalSlots = Math.max(rows.length * questionCount, 1);
  const aggregatePct = Math.round((totalAttempts / totalSlots) * 100);

  // ── End Heat ────────────────────────────────────────────────────────────
  const handleEnd = useCallback(
    async (isAuto: boolean) => {
      if (ending) return;
      setEnding(true);
      setEndError(null);
      try {
        await endHeat(supabase, heatId);
      } catch (err: any) {
        console.error('[TeacherMonitor] endHeat failed:', err);
        if (!isAuto) {
          setEndError(err?.message ?? 'Failed to end Heat');
          setEnding(false);
        }
      }
    },
    [ending, heatId, supabase]
  );

  // ── Timer color ─────────────────────────────────────────────────────────
  const totalSeconds = durationSeconds;
  const timerColor =
    secondsRemaining > totalSeconds * 0.5
      ? 'text-emerald-300'
      : secondsRemaining > totalSeconds * 0.25
      ? 'text-amber-300'
      : 'text-red-300 animate-pulse';

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Live
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Heat <span className="font-mono">{heatCode}</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-1 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Hosting this Heat
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 mb-1">
              <Clock className={`w-5 h-5 ${timerColor}`} />
              <span className={`text-3xl md:text-4xl font-bold font-mono ${timerColor}`}>
                {formatClock(secondsRemaining)}
              </span>
            </div>
            <p className="text-xs text-white/50 uppercase tracking-wider">remaining</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {endError && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{endError}</span>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatTile label="Mathletes" value={rows.length.toString()} icon={<Users className="w-4 h-4" />} />
          <StatTile label="Avg progress" value={`${aggregatePct}%`} icon={<Octagon className="w-4 h-4" />} />
          <StatTile
            label="Flagged"
            value={flaggedCount.toString()}
            icon={<ShieldAlert className="w-4 h-4" />}
            warn={flaggedCount > 0}
          />
        </div>

        {/* Participants progress */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 md:p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Live Progress
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading roster…
            </div>
          ) : sortedRows.length === 0 ? (
            <p className="text-white/40 italic text-sm">No one joined this Heat.</p>
          ) : (
            <ul className="space-y-2">
              {sortedRows.map((p) => {
                const pct = questionCount
                  ? Math.min(100, Math.round((p.questions_attempted / questionCount) * 100))
                  : 0;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      p.is_flagged
                        ? 'border-red-400/40 bg-red-400/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {initialsOf(p.display_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                          {p.display_name}
                          {p.is_flagged && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-200 bg-red-500/30 border border-red-400/40 rounded-full px-1.5 py-0.5">
                              <Flag className="w-2.5 h-2.5" />
                              Flagged
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-white/60 font-mono tabular-nums whitespace-nowrap">
                          {p.questions_attempted}/{questionCount} ({p.questions_correct} correct)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            p.is_flagged
                              ? 'bg-red-400'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {p.focus_violation_count > 0 && (
                        <p className="text-[10px] text-amber-300/80 mt-1">
                          {p.focus_violation_count} focus violation
                          {p.focus_violation_count === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* End Heat */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {!confirmEnd ? (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              disabled={ending}
              className={`flex-1 py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                ending
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
              }`}
            >
              End Heat Early
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                disabled={ending}
                className="flex-1 py-4 rounded-xl font-medium text-base bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleEnd(false)}
                disabled={ending}
                className={`flex-1 py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                  ending
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 active:scale-[0.98]'
                }`}
              >
                {ending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ending…
                  </span>
                ) : (
                  'Yes, end the Heat'
                )}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-4">
          The Heat ends automatically when the timer reaches zero.
        </p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  warn = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        warn
          ? 'border-red-400/40 bg-red-400/10 text-red-100'
          : 'border-white/10 bg-white/5 text-white'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${warn ? 'text-red-200' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
