// =============================================================================
// types.ts — Shared types for the MathAthlone HeatRoom Durable Object
// =============================================================================
// These types define the WebSocket message protocol between the Cloudflare
// Worker (server) and the Next.js client. They must be kept in sync with
// src/lib/competition/heat-realtime.ts in the Next.js app.
// =============================================================================

// ── Participant ───────────────────────────────────────────────────────────────

export interface Participant {
  userId: string;
  displayName: string;
  countryCode: string;      // ISO 3166-1 alpha-2, e.g. "US", "NG", "ZW"
  joinedAt: number;         // Unix ms — determines lobby display order
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
  totalTimeMs: number;
  rankInHeat: number | null;
}

// ── Heat lifecycle states ─────────────────────────────────────────────────────

export type HeatPhase =
  | 'lobby'        // Waiting for participants; countdown visible
  | 'countdown'    // 5-second countdown before first question
  | 'active'       // Questions being delivered
  | 'calculating'  // Scoring in progress
  | 'complete';    // Results available

// ── Question delivered to clients ────────────────────────────────────────────

export interface ClientQuestion {
  questionIndex: number;    // 0-based index within the heat
  totalQuestions: number;
  questionId: string;
  questionText: string;
  questionLatex: string | null;
  answerType: 'free_response' | 'multiple_choice';
  options: string[] | null; // null for free_response
  timeLimitSeconds: number;
  pointsValue: number;
  endsAt: number;           // Server-authoritative Unix ms deadline
}

// ── Server → Client messages ──────────────────────────────────────────────────

export type ServerMessage =
  | { type: 'lobby_state';       participants: Participant[]; maxParticipants: number; heatStartsAt: number | null; phase: HeatPhase }
  | { type: 'participant_joined'; participant: Participant; totalCount: number }
  | { type: 'participant_left';   userId: string; totalCount: number }
  | { type: 'countdown_started';  startsAt: number }   // Unix ms when active phase begins
  | { type: 'question';           question: ClientQuestion }
  | { type: 'answer_ack';         questionIndex: number; correct: boolean; pointsEarned: number; correctAnswer: string }
  | { type: 'leaderboard';        participants: Participant[]; afterQuestion: number }
  | { type: 'heat_complete';      participants: Participant[]; heatId: string }
  | { type: 'error';              code: string; message: string }
  | { type: 'ping' };

// ── Client → Server messages ──────────────────────────────────────────────────

export type ClientMessage =
  | { type: 'join';   heatId: string; userId: string; displayName: string; countryCode: string; authToken: string }
  | { type: 'answer'; questionIndex: number; answer: string; submittedAt: number }
  | { type: 'pong' };

// ── Internal HeatRoom state (persisted to Durable Object storage) ─────────────

export interface HeatRoomState {
  heatId: string;
  phase: HeatPhase;
  maxParticipants: number;
  durationSeconds: number;
  participants: Record<string, Participant>;  // keyed by userId
  questions: StoredQuestion[];
  currentQuestionIndex: number;
  heatStartedAt: number | null;              // Unix ms
  heatEndedAt: number | null;
  supabaseUrl: string;
}

export interface StoredQuestion {
  questionId: string;
  questionText: string;
  questionLatex: string | null;
  answerType: 'free_response' | 'multiple_choice';
  options: string[] | null;
  correctAnswer: string;
  timeLimitSeconds: number;
  pointsValue: number;
}

export interface AnswerRecord {
  userId: string;
  questionIndex: number;
  answer: string;
  submittedAt: number;
  timeMs: number;
  correct: boolean;
  pointsEarned: number;
}

// ── Environment bindings ──────────────────────────────────────────────────────

export interface Env {
  HEAT_ROOM: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  HEAT_ROOM_SECRET: string;   // Shared secret: Next.js signs requests with this
}
