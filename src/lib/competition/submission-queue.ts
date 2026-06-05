// =============================================================================
// MathAthlone — Offline-Resilient Submission Queue
// =============================================================================
// Holds question_submissions inserts that failed (network error, transient
// auth issue, RLS hiccup) so they can be retried in the background while
// the student keeps answering. Persisted to sessionStorage so it survives
// reloads.
//
// API:
//   enqueue(payload)            — push a failed insert onto the queue
//   queueSize()                 — current backlog length
//   peekQueue()                 — read-only snapshot for UI rendering
//   flushQueue(supabase)        — try every item once; survivors stay
//   clearQueue()                — drop everything (used on Heat completion)
//
// The queue is intentionally simple: no per-item exponential backoff state.
// The CompetitionView calls flushQueue() on a 5-second interval and on
// `window.online`, which gives effectively-backoff behavior without the
// bookkeeping.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

const QUEUE_KEY = 'mathathlone:submissionQueue';
const MAX_QUEUE_SIZE = 50;

export interface QueuedSubmissionPayload {
  heat_participation_id: string;
  heat_question_id: string;
  submitted_answer: string;
  is_correct: boolean;
  time_taken_ms: number;
  attempt_number: number;
  points_earned: number;
}

export interface QueuedSubmission {
  id: string;
  enqueuedAt: number;
  attempts: number;
  payload: QueuedSubmissionPayload;
}

function readQueue(): QueuedSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSubmission[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedSubmission[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch (err) {
    console.warn('[submission-queue] write failed', err);
  }
}

function shortId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function enqueue(payload: QueuedSubmissionPayload): QueuedSubmission {
  const q = readQueue();
  const item: QueuedSubmission = {
    id: shortId(),
    enqueuedAt: Date.now(),
    attempts: 0,
    payload,
  };
  q.push(item);
  // Cap the queue so a runaway offline session can't blow sessionStorage.
  while (q.length > MAX_QUEUE_SIZE) q.shift();
  writeQueue(q);
  return item;
}

export function queueSize(): number {
  return readQueue().length;
}

export function peekQueue(): QueuedSubmission[] {
  return readQueue();
}

export function clearQueue(): void {
  writeQueue([]);
}

export async function flushQueue(
  supabase: SupabaseClient
): Promise<{ flushed: number; remaining: number; errored: number }> {
  const q = readQueue();
  if (q.length === 0) return { flushed: 0, remaining: 0, errored: 0 };

  const survivors: QueuedSubmission[] = [];
  let flushed = 0;
  let errored = 0;

  for (const item of q) {
    try {
      const { error } = await supabase
        .from('question_submissions')
        .insert(item.payload);
      if (error) {
        // Unique-violation (23505) means the submission was already saved
        // on a previous attempt — treat as flushed, not as a retry.
        if ((error as any).code === '23505') {
          flushed++;
        } else {
          survivors.push({ ...item, attempts: item.attempts + 1 });
          errored++;
        }
      } else {
        flushed++;
      }
    } catch {
      survivors.push({ ...item, attempts: item.attempts + 1 });
      errored++;
    }
  }

  writeQueue(survivors);
  return { flushed, remaining: survivors.length, errored };
}
