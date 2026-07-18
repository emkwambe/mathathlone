// =============================================================================
// heat-realtime-cf.ts — Cloudflare HeatRoom WebSocket transport
// =============================================================================
// This module replaces the Supabase Realtime transport (heat-realtime.ts) for
// live Heat sessions. It connects to the Cloudflare HeatRoom Durable Object
// via a native WebSocket and exposes the same React hook API so the compete
// page requires minimal changes.
//
// The Supabase Realtime hooks (useHeatRealtime, useHeatParticipants) are
// retained for non-competition pages (teacher monitor, admin dashboard) that
// only need DB-level change notifications, not the real-time competition feed.
//
// Hooks exported from this module:
//   useHeatRoom(heatId, userId)  → full competition state from the Worker
//
// Utility:
//   initHeatRoom(heatId)         → POST /heat/{heatId}/init (called server-side)
// =============================================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ── Types (mirrored from workers/heat-room/src/types.ts) ─────────────────────
// Keep these in sync with the Worker types. In a monorepo setup these would
// be imported from a shared package; for now they are duplicated here.

export interface CFParticipant {
  userId: string;
  displayName: string;
  countryCode: string;
  joinedAt: number;
  score: number;
  questionsAttempted: number;
  questionsCorrect: number;
  totalTimeMs: number;
  rankInHeat: number | null;
}

export type HeatPhase =
  | 'lobby'
  | 'countdown'
  | 'active'
  | 'calculating'
  | 'complete';

export interface CFQuestion {
  questionIndex: number;
  totalQuestions: number;
  questionId: string;
  questionText: string;
  questionLatex: string | null;
  answerType: 'free_response' | 'multiple_choice';
  options: string[] | null;
  timeLimitSeconds: number;
  pointsValue: number;
  endsAt: number;  // Server-authoritative Unix ms deadline
}

export interface AnswerAck {
  questionIndex: number;
  correct: boolean;
  pointsEarned: number;
  correctAnswer: string;
}

// ── Connection state ──────────────────────────────────────────────────────────

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// ── useHeatRoom hook ──────────────────────────────────────────────────────────

export interface UseHeatRoomOptions {
  heatId: string | null | undefined;
  userId: string | null | undefined;
  displayName: string;
  countryCode: string;
}

export interface UseHeatRoomResult {
  /** Current phase of the heat lifecycle */
  phase: HeatPhase;
  /** Ordered list of participants (lobby order or rank order during/after active) */
  participants: CFParticipant[];
  /** Maximum participants allowed in this heat */
  maxParticipants: number;
  /** Server-authoritative Unix ms timestamp when active phase begins (set during countdown) */
  heatStartsAt: number | null;
  /** Current question being delivered (null outside active phase) */
  currentQuestion: CFQuestion | null;
  /** Acknowledgement of the last submitted answer */
  lastAnswerAck: AnswerAck | null;
  /** WebSocket connection state */
  connectionState: ConnectionState;
  /** Submit an answer for the current question */
  submitAnswer: (answer: string) => void;
  /** Error message if connection failed */
  error: string | null;
}

const WORKER_URL = process.env.NEXT_PUBLIC_HEAT_WORKER_URL ?? '';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;
const PING_INTERVAL_MS = 25_000;

export function useHeatRoom({
  heatId,
  userId,
  displayName,
  countryCode,
}: UseHeatRoomOptions): UseHeatRoomResult {
  const [phase, setPhase] = useState<HeatPhase>('lobby');
  const [participants, setParticipants] = useState<CFParticipant[]>([]);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [heatStartsAt, setHeatStartsAt] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CFQuestion | null>(null);
  const [lastAnswerAck, setLastAnswerAck] = useState<AnswerAck | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!heatId || !userId || !WORKER_URL) return;

    const params = new URLSearchParams({
      userId,
      displayName,
      countryCode,
    });

    // Convert https:// → wss:// for the WebSocket URL
    const wsUrl = WORKER_URL
      .replace(/^https:\/\//, 'wss://')
      .replace(/^http:\/\//, 'ws://')
      + `/ws/${heatId}?${params.toString()}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnectionState('connecting');

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      reconnectAttemptsRef.current = 0;
      setConnectionState('connected');
      setError(null);

      // Start keepalive pings
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data as string) as Record<string, unknown>;
      } catch {
        return;
      }

      switch (msg.type) {
        case 'lobby_state': {
          setParticipants(msg.participants as CFParticipant[]);
          setMaxParticipants(msg.maxParticipants as number);
          setPhase(msg.phase as HeatPhase);
          break;
        }
        case 'participant_joined': {
          setParticipants(prev => {
            const existing = prev.find(p => p.userId === (msg.participant as CFParticipant).userId);
            if (existing) return prev;
            return [...prev, msg.participant as CFParticipant];
          });
          break;
        }
        case 'participant_left': {
          setParticipants(prev => prev.filter(p => p.userId !== (msg.userId as string)));
          break;
        }
        case 'countdown_started': {
          setPhase('countdown');
          setHeatStartsAt(msg.startsAt as number);
          break;
        }
        case 'question': {
          setPhase('active');
          setCurrentQuestion(msg.question as CFQuestion);
          setLastAnswerAck(null); // Reset ack for new question
          break;
        }
        case 'answer_ack': {
          setLastAnswerAck({
            questionIndex: msg.questionIndex as number,
            correct: msg.correct as boolean,
            pointsEarned: msg.pointsEarned as number,
            correctAnswer: msg.correctAnswer as string,
          });
          break;
        }
        case 'leaderboard': {
          setParticipants(msg.participants as CFParticipant[]);
          break;
        }
        case 'heat_complete': {
          setPhase('complete');
          setParticipants(msg.participants as CFParticipant[]);
          setCurrentQuestion(null);
          break;
        }
        case 'error': {
          setError((msg.message as string) ?? 'Unknown error from server');
          break;
        }
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setConnectionState('reconnecting');
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      // Don't reconnect if heat is complete or if closed intentionally (code 1000)
      if (event.code === 1000 || phase === 'complete') {
        setConnectionState('disconnected');
        return;
      }

      // Exponential backoff reconnect
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current - 1);
        setConnectionState('reconnecting');
        setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      } else {
        setConnectionState('disconnected');
        setError('Connection lost. Please refresh to rejoin.');
      }
    };
  }, [heatId, userId, displayName, countryCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    if (heatId && userId) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [heatId, userId, connect]);

  const submitAnswer = useCallback((answer: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentQuestion) return;
    ws.send(JSON.stringify({
      type: 'answer',
      questionIndex: currentQuestion.questionIndex,
      answer,
      submittedAt: Date.now(),
    }));
  }, [currentQuestion]);

  return {
    phase,
    participants,
    maxParticipants,
    heatStartsAt,
    currentQuestion,
    lastAnswerAck,
    connectionState,
    submitAnswer,
    error,
  };
}

// ── Server-side: initHeatRoom ─────────────────────────────────────────────────
// Called from a Next.js API route (server-side only) after createHeat() to
// pre-load the heat data into the Durable Object.

export async function initHeatRoom(heatId: string, supabaseUrl: string): Promise<void> {
  const workerUrl = process.env.HEAT_WORKER_URL ?? WORKER_URL;
  const secret = process.env.HEAT_ROOM_SECRET;
  if (!workerUrl || !secret) {
    throw new Error('HEAT_WORKER_URL and HEAT_ROOM_SECRET must be set');
  }
  const response = await fetch(`${workerUrl}/heat/${heatId}/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Heat-Secret': secret,
    },
    body: JSON.stringify({ heatId, supabaseUrl }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HeatRoom init failed (${response.status}): ${body}`);
  }
}
