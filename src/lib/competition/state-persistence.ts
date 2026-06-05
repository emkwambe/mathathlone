// =============================================================================
// MathAthlone — Competition State Persistence (sessionStorage)
// =============================================================================
// Snapshots the live CompetitionView state on every change. On reload / tab
// reopen / accidental nav, the page can restore exactly where the student
// left off without a Supabase round-trip — protecting against the most
// common forms of mid-Heat state loss (tab swap, browser crash, refresh).
//
// Storage layer: sessionStorage (tab-scoped). We deliberately avoid
// localStorage because:
//   - A teacher Heat shared across multiple browser tabs would collide.
//   - Heat snapshots SHOULD die when the tab closes for >a couple hours.
//   - Cross-tab racing of writes from two simultaneous Heats is impossible.
//
// Schema versioning protects against incompatible deploys: bumping
// STORAGE_VERSION invalidates every previous snapshot on the next read.
// =============================================================================

const STORAGE_VERSION = 1;
const KEY_PREFIX = 'mathathlone:heat:';
const MAX_AGE_MS = 4 * 60 * 60 * 1000;                  // 4 hours

export interface CompetitionSnapshot {
  v: number;
  heatId: string;
  heatCode: string;
  participationId: string;
  phase: 'integrity_check' | 'loading' | 'playing' | 'finished' | 'time_up';
  currentIndex: number;
  questions: any[];                                     // HeatQuestionRow[]
  questionsAttempted: number;
  questionsCorrect: number;
  score: number;
  streak: number;
  violationCount: number;
  isFlagged: boolean;
  answer: string;
  heatStartedAt: number;                                // ms epoch
  durationSeconds: number;
  questionDisplayedAt: number;
  savedAt: number;
}

function keyFor(heatCode: string): string {
  return KEY_PREFIX + heatCode.toUpperCase();
}

export function loadSnapshot(heatCode: string): CompetitionSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(keyFor(heatCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompetitionSnapshot;

    if (parsed.v !== STORAGE_VERSION) {
      clearSnapshot(heatCode);
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearSnapshot(heatCode);
      return null;
    }

    // If the Heat's wall-clock timer has already expired, the student can't
    // resume — let them fall back to the server-side finished UI.
    const elapsedSeconds = (Date.now() - parsed.heatStartedAt) / 1000;
    if (elapsedSeconds > parsed.durationSeconds) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[state-persistence] loadSnapshot failed', err);
    return null;
  }
}

export function saveSnapshot(
  snapshot: Omit<CompetitionSnapshot, 'v' | 'savedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CompetitionSnapshot = {
      ...snapshot,
      v: STORAGE_VERSION,
      savedAt: Date.now(),
    };
    window.sessionStorage.setItem(keyFor(snapshot.heatCode), JSON.stringify(payload));
  } catch (err) {
    // sessionStorage can fail in private mode / quota errors. Snapshots
    // are best-effort — never block gameplay on a save failure.
    console.warn('[state-persistence] saveSnapshot failed', err);
  }
}

export function clearSnapshot(heatCode: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(keyFor(heatCode));
  } catch {
    /* ignore */
  }
}
