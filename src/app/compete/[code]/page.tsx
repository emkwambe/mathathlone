// =============================================================================
// MathAthlone — /compete/[code] (Lobby + Live Heat Host)
// =============================================================================
// Sprint 3 — the meeting place for a single Heat. Handles:
//
//   - Heat metadata load (with division + unit topic JOINs)
//   - Auto-join for students who navigate here directly
//   - Teacher vs student role detection (heat.created_by === user.id)
//   - Live status + participant subscriptions via heat-realtime hooks
//   - Status-driven render: lobby / countdown / active / complete / not-found
//   - "Start Heat" button (teacher only) that drives the lobby → active
//     transition via heat-service.startHeat()
//
// Sprint 4 will replace the `active` placeholder with the question UI.
// Sprint 5 will replace the `complete` placeholder with results + awards.
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Crown,
  Flame,
  Loader2,
  Rocket,
  Trophy,
  Users,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  joinHeat,
  startHeat,
  type Heat,
  type HeatStatus,
} from '@/lib/competition/heat-service';
import {
  useHeatParticipants,
  useHeatRealtime,
} from '@/lib/competition/heat-realtime';
import CompetitionView from '@/components/competition/CompetitionView';
import TeacherMonitor from '@/components/competition/TeacherMonitor';
import StudentResults from '@/components/competition/StudentResults';
import TeacherResults from '@/components/competition/TeacherResults';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface HeatWithMeta extends Heat {
  division: { id: string; name: string; code: string } | null;
  unit_topic: { id: string; name: string; code: string } | null;
}

type LoadState =
  | 'loading'
  | 'found'
  | 'not_found'
  | 'expired_lobby'
  | 'session_expired'
  | 'student_locked_out'
  | 'error';

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const JOINABLE_STATUSES: HeatStatus[] = ['lobby', 'open', 'scheduled'];
const COMPLETE_STATUSES: HeatStatus[] = ['complete', 'finished'];
const CALCULATING_STATUSES: HeatStatus[] = ['calculating'];
const ACTIVE_STATUSES: HeatStatus[] = ['active', 'in_progress'];

function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'M';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function difficultyLabel(min: number, max: number): string {
  if (min === 4 && max === 4) return 'Platinum';
  if (min >= 3) return 'Gold';
  if (min >= 2) return 'Silver';
  return 'Bronze';
}

function formatHeatType(type: string | null): string {
  if (!type) return 'Heat';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// -----------------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------------

export default function HeatLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const code = useMemo(() => {
    const raw = params?.code;
    return (Array.isArray(raw) ? raw[0] : raw ?? '').toUpperCase();
  }, [params]);

  const supabase = useMemo(() => createClient(), []);
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // ── Heat metadata (one-time fetch with JOINs) ───────────────────────────
  const [heat, setHeat] = useState<HeatWithMeta | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Membership ──────────────────────────────────────────────────────────
  const [isTeacher, setIsTeacher] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinAttemptedRef = useRef(false);

  // ── Teacher actions ─────────────────────────────────────────────────────
  const [startingHeat, setStartingHeat] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Realtime: live heat status + participant roster ────────────────────
  const { status: liveStatus } = useHeatRealtime(heat?.id ?? null);
  const { participants, loading: participantsLoading } = useHeatParticipants(heat?.id ?? null);
  const participantsLoaded = !participantsLoading;

  // Effective status: prefer the live channel, fall back to initial load
  const effectiveStatus: HeatStatus | null =
    (liveStatus as HeatStatus | null) ?? heat?.status ?? null;

  // ── Redirect unauthenticated users to login (preserving target) ─────────
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(`/compete/${code}`)}`);
    }
  }, [authLoading, isAuthenticated, router, code]);

  // ── Load Heat by code (with retries + status-aware error mapping) ──────
  // BUG 0 fix: when the teacher just created the Heat, the row may not yet
  // be visible to a follow-up SELECT (RLS, replication, prepared-statement
  // caches). We retry up to 3 times with 1-second intervals before giving
  // up, and we set a 10-second overall hard cap so the spinner never spins
  // forever. BUG 1/2/5: missing rows, cancelled/complete heats, expired
  // sessions, and stale lobbies each get a specific error message instead
  // of an infinite spinner.
  //
  // BUG 6 fix — DO NOT add `user` (or any object Supabase re-emits on
  // TOKEN_REFRESHED) to the dependency array of this effect. When the tab
  // regains focus, Supabase fires TOKEN_REFRESHED with a freshly-deserialized
  // user object; even with the same id, the reference changes. If that
  // re-fires this effect, we call setLoadState('loading') which renders the
  // <FullScreenSpinner> branch, unmounting CompetitionView and obliterating
  // every Heat answer / timer / focus-mode counter the student had built up.
  // Use `userId` (stable string) and short-circuit when we've already loaded
  // the same Heat code. The `user` ref is captured locally inside the
  // closure for ownership detection.
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!code) return;
    if (authLoading || !isAuthenticated) return;
    // BUG 6 short-circuit: we've already loaded the Heat for this code and
    // the page is mounted. Don't ever reset state from inside this effect —
    // it would blow away CompetitionView mid-Heat on a token refresh.
    if (heat && heat.code === code && loadState === 'found') return;
    let cancelled = false;

    const MAX_ATTEMPTS = 3;
    const ATTEMPT_DELAY_MS = 1000;
    const HARD_TIMEOUT_MS = 10_000;
    const LOBBY_EXPIRY_MS = 30 * 60 * 1000;             // 30 min

    (async () => {
      setLoadState('loading');
      setLoadError(null);

      const startedAt = Date.now();
      console.log('[HeatLobby] load:start', { code, at: new Date().toISOString() });

      // Hard timeout — if we haven't resolved a row within 10s, surface an
      // error rather than spinning indefinitely.
      const timeoutId = setTimeout(() => {
        if (cancelled) return;
        console.warn('[HeatLobby] load:timeout', { code });
        setLoadError("This Heat is taking too long to load. Check your connection and try again.");
        setLoadState('error');
        cancelled = true;
      }, HARD_TIMEOUT_MS);

      let lastError: string | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;

        console.log('[HeatLobby] load:attempt', { code, attempt });

        const { data, error } = await supabase
          .from('heats')
          .select(`
            *,
            division:division_id ( id, name, code ),
            unit_topic:unit_topic_id ( id, name, code )
          `)
          .eq('code', code)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          // Auth-shaped errors → session expired
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('jwt') || msg.includes('expired') || (error as any).code === 'PGRST301') {
            console.warn('[HeatLobby] load:session_expired', { code, error: error.message });
            clearTimeout(timeoutId);
            setLoadError("Your session expired. Please log in again.");
            setLoadState('session_expired');
            return;
          }
          lastError = error.message;
          console.warn('[HeatLobby] load:error', { code, attempt, message: error.message });
        } else if (data) {
          // Found it — finish.
          clearTimeout(timeoutId);
          const heatRow = data as HeatWithMeta;
          console.log('[HeatLobby] load:found', {
            code,
            attempt,
            status: heatRow.status,
            created_by: heatRow.created_by,
            elapsedMs: Date.now() - startedAt,
          });

          // BUG 2: auto-expire stale lobbies (status='lobby' AND > 30 min old).
          const isOwner = !!user && heatRow.created_by === user.id;
          if (
            heatRow.status === 'lobby' &&
            heatRow.created_at &&
            Date.now() - new Date(heatRow.created_at).getTime() > LOBBY_EXPIRY_MS
          ) {
            console.warn('[HeatLobby] load:lobby_expired', {
              code,
              created_at: heatRow.created_at,
            });
            // Only the creator can flip it (RLS). If anyone else lands on it,
            // we still surface the expired UI so they don't sit in the lobby.
            if (isOwner) {
              await supabase
                .from('heats')
                .update({ status: 'cancelled' })
                .eq('id', heatRow.id);
            }
            setHeat({ ...heatRow, status: 'cancelled' as any });
            setIsTeacher(isOwner);
            setLoadState('expired_lobby');
            return;
          }

          // BUG 5: prevent students from auto-joining an active/calculating/
          // complete Heat they weren't already part of. We don't have the
          // participants list yet at this point, so the dedicated lock-out
          // check runs later in a separate effect below.
          setHeat(heatRow);
          setIsTeacher(isOwner);
          setLoadState('found');
          // NB: do NOT include `user` in the effect deps — see BUG 6 banner
          // above. The owner check above uses a closure capture of `user`
          // captured at first load; if the same browser somehow swaps users
          // (rare in practice), the lobby would need a full reload anyway.
          return;
        }

        // Not found yet on this attempt — wait then retry (unless last).
        if (attempt < MAX_ATTEMPTS) {
          console.log('[HeatLobby] load:retry-wait', { code, attempt });
          await new Promise((r) => setTimeout(r, ATTEMPT_DELAY_MS));
        }
      }

      if (cancelled) return;
      clearTimeout(timeoutId);

      if (lastError) {
        console.error('[HeatLobby] load:gave_up_with_error', { code, lastError });
        setLoadError(lastError);
        setLoadState('error');
      } else {
        console.warn('[HeatLobby] load:not_found_after_retries', { code });
        setLoadState('not_found');
      }
    })();

    return () => {
      cancelled = true;
    };
    // BUG 6: depend on userId (string) not user (object). Supabase emits a
    // new user object on every TOKEN_REFRESHED — keeping `user` in deps
    // would refire the effect on tab refocus and unmount CompetitionView.
    // `heat` and `loadState` are deliberately omitted from deps too: this
    // effect should run exactly once per (code, auth-ready, userId) tuple.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, supabase, authLoading, isAuthenticated, userId]);

  // ── Auto-join students (idempotent) ────────────────────────────────────
  useEffect(() => {
    if (!heat || !user) return;
    if (isTeacher) return;
    if (hasJoined || joinAttemptedRef.current) return;
    if (!effectiveStatus || !JOINABLE_STATUSES.includes(effectiveStatus)) return;

    joinAttemptedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        await joinHeat(supabase, code);
        if (!cancelled) setHasJoined(true);
      } catch (err: any) {
        if (!cancelled) {
          setJoinError(err?.message ?? 'Failed to join Heat');
          joinAttemptedRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [heat, user, isTeacher, hasJoined, effectiveStatus, code, supabase]);

  // ── Already-joined detection from the live participants list ───────────
  useEffect(() => {
    if (!user || hasJoined) return;
    if (participants.some((p) => p.athlete_id === user.id)) {
      setHasJoined(true);
    }
  }, [participants, user, hasJoined]);

  // ── Teacher: Start Heat ─────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!heat) return;
    setStartingHeat(true);
    setStartError(null);
    try {
      // startHeat awaits 5s internally between countdown and active. Other
      // clients pick up the status changes via realtime.
      await startHeat(supabase, heat.id, 5);
    } catch (err: any) {
      console.error('[HeatLobby] startHeat failed:', err);
      setStartError(err?.message ?? 'Failed to start Heat');
    } finally {
      setStartingHeat(false);
    }
  }, [heat, supabase]);

  // ── Copy heat code to clipboard ─────────────────────────────────────────
  const handleCopyCode = useCallback(async () => {
    if (!heat?.code) return;
    try {
      await navigator.clipboard.writeText(heat.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // navigator.clipboard can fail in non-secure contexts — silently skip
    }
  }, [heat?.code]);

  // ───────────────────────────────────────────────────────────────────────
  // EARLY RENDER STATES
  // ───────────────────────────────────────────────────────────────────────

  if (authLoading || (isAuthenticated && loadState === 'loading')) {
    return <FullScreenSpinner label="Loading Heat…" />;
  }
  if (!isAuthenticated) return null;       // redirect already in flight

  if (loadState === 'not_found') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-amber-300" />}
        title="This Heat doesn't exist"
        message={`We couldn't find a Heat with the code ${code}. Double-check with your teacher.`}
        action={{ label: 'Back to join', href: '/compete' }}
      />
    );
  }
  if (loadState === 'session_expired') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-amber-300" />}
        title="Session expired"
        message="You've been signed out. Please log in again to rejoin this Heat."
        action={{
          label: 'Log in',
          href: `/auth/login?next=${encodeURIComponent(`/compete/${code}`)}`,
        }}
      />
    );
  }
  if (loadState === 'expired_lobby') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-amber-300" />}
        title="This Heat expired"
        message="It sat in the lobby for more than 30 minutes without starting. Ask your teacher to create a fresh one."
        action={{ label: 'Back to compete', href: '/compete' }}
      />
    );
  }
  if (loadState === 'student_locked_out') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-amber-300" />}
        title="This Heat has already started"
        message="You weren't part of this Heat when it began, so you can't join now. Ask your teacher for the next one."
        action={{ label: 'Back to compete', href: '/compete' }}
      />
    );
  }
  if (loadState === 'error') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-red-300" />}
        title="Something went wrong"
        message={loadError ?? 'Failed to load Heat'}
        action={{ label: 'Try again', href: '/compete' }}
      />
    );
  }
  if (!heat) return null;

  // ───────────────────────────────────────────────────────────────────────
  // STATUS-DRIVEN RENDER
  // ───────────────────────────────────────────────────────────────────────

  // 1. Countdown
  if (effectiveStatus === 'countdown') {
    return (
      <CountdownView
        heat={heat}
        seconds={5}
      />
    );
  }

  // 2. Active / in_progress — Sprint 4 competition UI
  if (effectiveStatus && ACTIVE_STATUSES.includes(effectiveStatus)) {
    // Teacher → monitoring dashboard. They don't compete; they observe.
    if (isTeacher) {
      return (
        <TeacherMonitor
          heatId={heat.id}
          heatCode={heat.code}
          questionCount={heat.question_count}
          durationSeconds={heat.duration_seconds}
        />
      );
    }

    // Student → gameplay. Need their participation row from the live roster
    // to resolve participation_id (no need for an extra DB round-trip).
    const myParticipation = participants.find((p) => p.athlete_id === user?.id);
    if (!myParticipation) {
      // BUG 5: if the participants list has loaded and the student isn't in
      // it, they joined after the Heat started — surface a clear message
      // rather than spinning "Syncing your slot…" forever.
      if (participantsLoaded) {
        return (
          <FullScreenMessage
            icon={<AlertTriangle className="w-10 h-10 text-amber-300" />}
            title="This Heat has already started"
            message="You weren't part of this Heat when it began, so you can't join mid-Heat. Ask your teacher for the next one."
            action={{ label: 'Back to compete', href: '/compete' }}
          />
        );
      }
      return <FullScreenSpinner label="Syncing your slot…" />;
    }
    return (
      <CompetitionView
        heatId={heat.id}
        participationId={myParticipation.id}
        durationSeconds={heat.duration_seconds}
        integrityLevel={heat.integrity_level ?? 'practice'}
      />
    );
  }

  // 3. Calculating
  if (effectiveStatus && CALCULATING_STATUSES.includes(effectiveStatus)) {
    return (
      <FullScreenMessage
        icon={<Loader2 className="w-10 h-10 text-amber-300 animate-spin" />}
        title="Calculating results…"
        message="Hang tight while we score the Heat. This usually takes a few seconds."
        tone="active"
      />
    );
  }

  // 4. Complete / finished — Sprint 5 results UI
  if (effectiveStatus && COMPLETE_STATUSES.includes(effectiveStatus)) {
    if (isTeacher) {
      return (
        <TeacherResults
          heatId={heat.id}
          heatCode={heat.code}
          integrityLevel={heat.integrity_level ?? 'practice'}
        />
      );
    }

    // Student → personal results. Reuse the live participants array to
    // resolve participation_id without an extra fetch.
    const myParticipation = participants.find((p) => p.athlete_id === user?.id);
    if (!myParticipation || !user) {
      return (
        <FullScreenMessage
          icon={<Trophy className="w-10 h-10 text-amber-300" />}
          title="Heat complete"
          message="We couldn't find your participation row for this Heat — ask your teacher to check the roster."
          action={{ label: 'Back to compete', href: '/compete' }}
          tone="active"
        />
      );
    }
    return (
      <StudentResults
        heatId={heat.id}
        heatCode={heat.code}
        participationId={myParticipation.id}
        userId={user.id}
        integrityLevel={heat.integrity_level ?? 'practice'}
      />
    );
  }

  // 5. Cancelled
  if (effectiveStatus === 'cancelled') {
    return (
      <FullScreenMessage
        icon={<AlertTriangle className="w-10 h-10 text-red-300" />}
        title="This Heat was cancelled"
        message="The Heat host called it off. Ask for a new code or create your own."
        action={{ label: 'Back to compete', href: '/compete' }}
      />
    );
  }

  // 6. Default: LOBBY view
  return (
    <LobbyView
      heat={heat}
      isTeacher={isTeacher}
      hasJoined={hasJoined}
      joinError={joinError}
      participants={participants.map((p) => ({
        id: p.id,
        athlete_id: p.athlete_id,
        display_name: p.display_name,
      }))}
      onStart={handleStart}
      starting={startingHeat}
      startError={startError}
      copied={copied}
      onCopyCode={handleCopyCode}
      currentUserId={user?.id ?? null}
    />
  );
}

// =============================================================================
// LOBBY VIEW
// =============================================================================

interface LobbyParticipant {
  id: string;
  athlete_id: string;
  display_name: string;
}

function LobbyView({
  heat,
  isTeacher,
  hasJoined,
  joinError,
  participants,
  onStart,
  starting,
  startError,
  copied,
  onCopyCode,
  currentUserId,
}: {
  heat: HeatWithMeta;
  isTeacher: boolean;
  hasJoined: boolean;
  joinError: string | null;
  participants: LobbyParticipant[];
  onStart: () => void;
  starting: boolean;
  startError: string | null;
  copied: boolean;
  onCopyCode: () => void;
  currentUserId: string | null;
}) {
  const difficulty = difficultyLabel(heat.depth_min, heat.depth_max);
  const courseName = 'NC Math 1';                 // MVP — only one course
  const unitTopicName = heat.unit_topic?.name ?? 'Mixed topics';
  const divisionName = heat.division?.name ?? '—';
  const durationMin = Math.round((heat.duration_seconds ?? 0) / 60);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/compete"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-3">
            <Flame className="w-3.5 h-3.5" /> {formatHeatType(heat.type)} · {difficulty}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Heat <span className="font-mono">{heat.code}</span>
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            {courseName} · {unitTopicName} · {divisionName}
          </p>
          <p className="text-indigo-300/70 text-xs mt-1">
            {heat.question_count} questions · {durationMin} min · integrity:{' '}
            <span className="capitalize">{heat.integrity_level ?? 'practice'}</span>
          </p>
        </div>

        {/* Errors */}
        {joinError && !isTeacher && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{joinError}</span>
          </div>
        )}
        {startError && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{startError}</span>
          </div>
        )}

        {/* Code share card (teachers focus on this) */}
        {isTeacher && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 md:p-6 mb-6">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              Share this code with your Mathletes
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-2xl md:text-3xl font-bold text-amber-300 tracking-[0.2em] text-center">
                {heat.code}
              </div>
              <button
                type="button"
                onClick={onCopyCode}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
                aria-label="Copy Heat code"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Student "waiting" panel */}
        {!isTeacher && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 md:p-6 mb-6 text-center">
            {hasJoined ? (
              <>
                <div className="inline-flex items-center gap-2 text-emerald-300 text-sm font-medium mb-2">
                  <Check className="w-4 h-4" />
                  You're in
                </div>
                <p className="text-white text-base font-semibold">
                  Waiting for your teacher to start the Heat…
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-6 h-6 text-amber-300 animate-spin mx-auto mb-2" />
                <p className="text-white text-sm">Joining Heat…</p>
              </>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Mathletes ({participants.length})
              </h2>
            </div>
          </div>

          {participants.length === 0 ? (
            <p className="text-white/40 text-sm italic">No one's joined yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {participants.map((p) => {
                const isCurrent = p.athlete_id === currentUserId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border transition-all ${
                      isCurrent
                        ? 'border-emerald-400/50 bg-emerald-400/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {initialsOf(p.display_name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-900" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{p.display_name}</p>
                      {isCurrent && <p className="text-[10px] text-emerald-300 leading-none">you</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teacher start button */}
        {isTeacher && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onStart}
              disabled={starting || participants.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base md:text-lg transition-all shadow-lg ${
                starting || participants.length === 0
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white hover:from-emerald-300 hover:to-emerald-500 active:scale-[0.98]'
              }`}
            >
              {starting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Start Heat
                </>
              )}
            </button>
          </div>
        )}

        {/* Teacher badge footer */}
        {isTeacher && (
          <p className="text-center text-xs text-white/40 mt-6 inline-flex items-center gap-1 justify-center w-full">
            <Crown className="w-3 h-3 text-amber-300" />
            You're hosting this Heat
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COUNTDOWN VIEW
// =============================================================================

function CountdownView({ heat, seconds }: { heat: HeatWithMeta; seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const durationMin = Math.round((heat.duration_seconds ?? 0) / 60);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-amber-300 text-xs font-bold uppercase tracking-[0.3em] mb-6">
          Get ready
        </p>
        <div
          key={remaining}                                           // re-key triggers re-mount → re-runs scale animation
          className="text-[10rem] md:text-[14rem] leading-none font-black text-white drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-pulse"
        >
          {remaining > 0 ? remaining : 'GO!'}
        </div>
        <p className="text-indigo-200 text-sm mt-6">
          {heat.question_count} questions · {durationMin} min
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// SHARED MICRO-COMPONENTS
// =============================================================================

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-amber-300 animate-spin" />
      <p className="mt-4 text-white/70 text-sm">{label}</p>
    </div>
  );
}

function FullScreenMessage({
  icon,
  title,
  message,
  action,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: { label: string; href: string };
  tone?: 'neutral' | 'active';
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-6">
          {icon}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-indigo-200 text-sm md:text-base">{message}</p>
        {tone === 'active' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-amber-300/70">
            <Clock className="w-3.5 h-3.5" />
            Live now
          </div>
        )}
        {action && (
          <Link
            href={action.href}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
