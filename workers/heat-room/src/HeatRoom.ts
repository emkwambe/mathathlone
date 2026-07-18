// =============================================================================
// HeatRoom.ts — MathAthlone HeatRoom Durable Object
// =============================================================================
// Each live Heat is managed by exactly one HeatRoom Durable Object instance.
// The instance is named by heatId, ensuring a single point of coordination.
//
// Lifecycle:
//   lobby → countdown → active (question loop) → calculating → complete
//
// The Durable Object uses WebSocket Hibernation so it is not billed during
// the idle time between public heats.
// =============================================================================

import { DurableObject } from 'cloudflare:workers';
import {
  Env,
  HeatPhase,
  HeatRoomState,
  Participant,
  StoredQuestion,
  AnswerRecord,
  ClientMessage,
  ServerMessage,
  ClientQuestion,
} from './types';
import {
  createSupabaseClient,
  fetchHeat,
  fetchHeatQuestions,
  fetchUser,
  updateHeatStatus,
  upsertParticipation,
  insertSubmission,
} from './supabase';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PARTICIPANTS = 20;
const COUNTDOWN_SECONDS = 5;
const QUESTION_BUFFER_MS = 500;   // Grace period after time limit before advancing
const LEADERBOARD_PAUSE_MS = 3000; // Show leaderboard for 3 s between questions

// ── HeatRoom Durable Object ───────────────────────────────────────────────────

export class HeatRoom extends DurableObject<Env> {

  // ── Initialisation ──────────────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }

    // HTTP control endpoints (called by Next.js API routes)
    if (pathname === '/init' && request.method === 'POST') {
      return this.handleInit(request);
    }
    if (pathname === '/status' && request.method === 'GET') {
      return this.handleStatus();
    }

    return new Response('Not found', { status: 404 });
  }

  // ── HTTP: /init ─────────────────────────────────────────────────────────────
  // Called by the Next.js API route after createHeat() to pre-load the heat
  // data into the Durable Object before the first participant connects.

  private async handleInit(request: Request): Promise<Response> {
    const { heatId, supabaseUrl } = await request.json() as { heatId: string; supabaseUrl: string };
    const db = createSupabaseClient(supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);

    const heat = await fetchHeat(db, heatId);
    if (!heat) return new Response('Heat not found', { status: 404 });

    const questions = await fetchHeatQuestions(db, heatId);
    if (questions.length === 0) return new Response('No questions found for heat', { status: 422 });

    const storedQuestions: StoredQuestion[] = questions.map(q => ({
      questionId: q.id,
      questionText: q.question_text,
      questionLatex: q.question_latex,
      answerType: q.answer_type as 'free_response' | 'multiple_choice',
      options: q.options,
      correctAnswer: q.correct_answer,
      timeLimitSeconds: q.time_limit_seconds,
      pointsValue: q.points_value,
    }));

    const state: HeatRoomState = {
      heatId,
      phase: 'lobby',
      maxParticipants: MAX_PARTICIPANTS,
      durationSeconds: heat.duration_seconds,
      participants: {},
      questions: storedQuestions,
      currentQuestionIndex: 0,
      heatStartedAt: null,
      heatEndedAt: null,
      supabaseUrl,
    };

    await this.ctx.storage.put('state', state);
    return new Response(JSON.stringify({ ok: true, questionCount: storedQuestions.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── HTTP: /status ───────────────────────────────────────────────────────────

  private async handleStatus(): Promise<Response> {
    const state = await this.getState();
    if (!state) return new Response(JSON.stringify({ phase: 'uninitialized' }), { headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({
      phase: state.phase,
      participantCount: Object.keys(state.participants).length,
      maxParticipants: state.maxParticipants,
      currentQuestionIndex: state.currentQuestionIndex,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── WebSocket upgrade ───────────────────────────────────────────────────────

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const displayName = url.searchParams.get('displayName') ?? 'Mathlete';
    const countryCode = (url.searchParams.get('countryCode') ?? 'US').toUpperCase();

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const state = await this.getState();
    if (!state) return new Response('Heat not initialized', { status: 503 });

    if (state.phase === 'complete' || state.phase === 'calculating') {
      return new Response('Heat has ended', { status: 410 });
    }

    const participantCount = Object.keys(state.participants).length;
    if (state.phase === 'lobby' && participantCount >= state.maxParticipants) {
      return new Response('Heat is full', { status: 409 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server, [userId]);

    // Attach metadata to the WebSocket for retrieval after hibernation
    server.serializeAttachment({ userId, displayName, countryCode });

    // Register participant if not already present
    if (!state.participants[userId]) {
      const participant: Participant = {
        userId,
        displayName,
        countryCode,
        joinedAt: Date.now(),
        score: 0,
        questionsAttempted: 0,
        questionsCorrect: 0,
        totalTimeMs: 0,
        rankInHeat: null,
      };
      state.participants[userId] = participant;
      await this.saveState(state);

      // Notify all other participants
      this.broadcast({
        type: 'participant_joined',
        participant,
        totalCount: Object.keys(state.participants).length,
      }, userId);

      // Persist to Supabase (fire-and-forget)
      this.persistJoin(state.supabaseUrl, state.heatId, userId).catch(() => {});

      // Auto-start countdown when heat is full
      if (Object.keys(state.participants).length >= state.maxParticipants && state.phase === 'lobby') {
        this.ctx.storage.setAlarm(Date.now() + 100); // Trigger countdown immediately
      }
    }

    // Send current lobby state to the new connection
    this.sendTo(server, {
      type: 'lobby_state',
      participants: this.sortedParticipants(state),
      maxParticipants: state.maxParticipants,
      heatStartsAt: null,
      phase: state.phase,
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  // ── WebSocket message handler ───────────────────────────────────────────────

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    const attachment = ws.deserializeAttachment() as { userId: string; displayName: string; countryCode: string } | null;
    if (!attachment) return;
    const { userId } = attachment;

    if (msg.type === 'pong') return; // Keepalive, no action needed

    if (msg.type === 'answer') {
      await this.handleAnswer(userId, msg.questionIndex, msg.answer, msg.submittedAt);
    }
  }

  // ── WebSocket close handler ─────────────────────────────────────────────────

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    const attachment = ws.deserializeAttachment() as { userId: string } | null;
    if (!attachment) return;
    const { userId } = attachment;

    const state = await this.getState();
    if (!state) return;

    // Only remove from lobby if the heat hasn't started
    if (state.phase === 'lobby') {
      delete state.participants[userId];
      await this.saveState(state);
      this.broadcast({
        type: 'participant_left',
        userId,
        totalCount: Object.keys(state.participants).length,
      });
    }
    // During active phase, keep the participant in state (they may reconnect)
  }

  // ── Alarm handler (drives the heat lifecycle) ───────────────────────────────

  async alarm(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    if (state.phase === 'lobby') {
      await this.startCountdown(state);
    } else if (state.phase === 'countdown') {
      await this.startActivePhase(state);
    } else if (state.phase === 'active') {
      await this.advanceQuestion(state);
    }
  }

  // ── Lifecycle: Countdown ────────────────────────────────────────────────────

  private async startCountdown(state: HeatRoomState): Promise<void> {
    state.phase = 'countdown';
    await this.saveState(state);

    const db = createSupabaseClient(state.supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    await updateHeatStatus(db, state.heatId, 'countdown');

    const startsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
    this.broadcast({ type: 'countdown_started', startsAt });

    // Schedule the active phase start
    this.ctx.storage.setAlarm(startsAt);
  }

  // ── Lifecycle: Active phase ─────────────────────────────────────────────────

  private async startActivePhase(state: HeatRoomState): Promise<void> {
    state.phase = 'active';
    state.heatStartedAt = Date.now();
    state.currentQuestionIndex = 0;
    await this.saveState(state);

    const db = createSupabaseClient(state.supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    await updateHeatStatus(db, state.heatId, 'active', { started_at: new Date().toISOString() });

    await this.deliverQuestion(state, 0);
  }

  // ── Question delivery ───────────────────────────────────────────────────────

  private async deliverQuestion(state: HeatRoomState, index: number): Promise<void> {
    const q = state.questions[index];
    if (!q) {
      await this.endHeat(state);
      return;
    }

    const endsAt = Date.now() + q.timeLimitSeconds * 1000;

    const clientQuestion: ClientQuestion = {
      questionIndex: index,
      totalQuestions: state.questions.length,
      questionId: q.questionId,
      questionText: q.questionText,
      questionLatex: q.questionLatex,
      answerType: q.answerType,
      options: q.options,
      timeLimitSeconds: q.timeLimitSeconds,
      pointsValue: q.pointsValue,
      endsAt,
    };

    this.broadcast({ type: 'question', question: clientQuestion });

    // Schedule auto-advance when time expires
    this.ctx.storage.setAlarm(endsAt + QUESTION_BUFFER_MS);
  }

  // ── Answer handling ─────────────────────────────────────────────────────────

  private async handleAnswer(
    userId: string,
    questionIndex: number,
    answer: string,
    submittedAt: number
  ): Promise<void> {
    const state = await this.getState();
    if (!state || state.phase !== 'active') return;
    if (questionIndex !== state.currentQuestionIndex) return;

    const participant = state.participants[userId];
    if (!participant) return;

    const q = state.questions[questionIndex];
    if (!q) return;

    // Check if already answered this question
    const answerKey = `answer:${userId}:${questionIndex}`;
    const alreadyAnswered = await this.ctx.storage.get<boolean>(answerKey);
    if (alreadyAnswered) return;
    await this.ctx.storage.put(answerKey, true);

    // Score the answer
    const correct = this.checkAnswer(answer, q.correctAnswer, q.answerType);
    const timeMs = Math.max(0, submittedAt - (state.heatStartedAt ?? submittedAt));
    const pointsEarned = correct ? this.calculatePoints(q.pointsValue, timeMs, q.timeLimitSeconds) : 0;

    // Update participant state
    participant.questionsAttempted += 1;
    if (correct) participant.questionsCorrect += 1;
    participant.totalTimeMs += timeMs;
    participant.score += pointsEarned;
    state.participants[userId] = participant;
    await this.saveState(state);

    // Record the answer
    const record: AnswerRecord = {
      userId,
      questionIndex,
      answer,
      submittedAt,
      timeMs,
      correct,
      pointsEarned,
    };

    // Persist submission to Supabase (fire-and-forget)
    this.persistSubmission(state.supabaseUrl, state.heatId, q.questionId, record).catch(() => {});

    // Send acknowledgement to the answering participant
    const ws = this.getWebSocketForUser(userId);
    if (ws) {
      this.sendTo(ws, {
        type: 'answer_ack',
        questionIndex,
        correct,
        pointsEarned,
        correctAnswer: q.correctAnswer,
      });
    }
  }

  // ── Question advance (called by alarm) ─────────────────────────────────────

  private async advanceQuestion(state: HeatRoomState): Promise<void> {
    const completedIndex = state.currentQuestionIndex;

    // Broadcast leaderboard after the completed question
    this.broadcast({
      type: 'leaderboard',
      participants: this.rankedParticipants(state),
      afterQuestion: completedIndex,
    });

    const nextIndex = completedIndex + 1;

    if (nextIndex >= state.questions.length) {
      // All questions delivered — end the heat after leaderboard pause
      await this.saveState(state);
      this.ctx.storage.setAlarm(Date.now() + LEADERBOARD_PAUSE_MS);
      // Mark state so next alarm knows to end
      state.currentQuestionIndex = nextIndex;
      await this.saveState(state);
      return;
    }

    // Pause to show leaderboard, then deliver next question
    state.currentQuestionIndex = nextIndex;
    await this.saveState(state);
    this.ctx.storage.setAlarm(Date.now() + LEADERBOARD_PAUSE_MS);
    // The next alarm will call advanceQuestion again, but currentQuestionIndex
    // is now nextIndex. We need to deliver the question after the pause.
    // Use a flag to distinguish "deliver next question" from "end heat".
    await this.ctx.storage.put('pendingDelivery', nextIndex);
  }

  // Override alarm to handle the pending delivery flag
  // (Cloudflare only supports one alarm at a time, so we use storage flags)
  private async handleAlarmWithFlags(state: HeatRoomState): Promise<void> {
    const pendingDelivery = await this.ctx.storage.get<number>('pendingDelivery');
    if (pendingDelivery !== undefined && pendingDelivery !== null) {
      await this.ctx.storage.delete('pendingDelivery');
      if (pendingDelivery >= state.questions.length) {
        await this.endHeat(state);
      } else {
        await this.deliverQuestion(state, pendingDelivery);
      }
      return;
    }

    // No pending delivery — normal alarm routing
    if (state.phase === 'lobby') {
      await this.startCountdown(state);
    } else if (state.phase === 'countdown') {
      await this.startActivePhase(state);
    } else if (state.phase === 'active') {
      await this.advanceQuestion(state);
    }
  }

  // ── End heat ────────────────────────────────────────────────────────────────

  private async endHeat(state: HeatRoomState): Promise<void> {
    state.phase = 'calculating';
    state.heatEndedAt = Date.now();
    await this.saveState(state);

    const db = createSupabaseClient(state.supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    await updateHeatStatus(db, state.heatId, 'calculating', { ended_at: new Date().toISOString() });

    // Assign final ranks
    const ranked = this.rankedParticipants(state);
    ranked.forEach((p, i) => {
      state.participants[p.userId].rankInHeat = i + 1;
    });

    // Persist final participation records to Supabase
    await this.persistFinalResults(state);

    state.phase = 'complete';
    await this.saveState(state);
    await updateHeatStatus(db, state.heatId, 'complete');

    // Broadcast final results to all connected clients
    this.broadcast({
      type: 'heat_complete',
      participants: this.rankedParticipants(state),
      heatId: state.heatId,
    });
  }

  // ── Supabase persistence helpers ────────────────────────────────────────────

  private async persistJoin(supabaseUrl: string, heatId: string, userId: string): Promise<void> {
    const db = createSupabaseClient(supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    await upsertParticipation(db, heatId, userId, {
      status: 'queued',
      joined_at: new Date().toISOString(),
    });
  }

  private async persistSubmission(
    supabaseUrl: string,
    heatId: string,
    questionId: string,
    record: AnswerRecord
  ): Promise<void> {
    const db = createSupabaseClient(supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    await insertSubmission(db, {
      heat_id: heatId,
      athlete_id: record.userId,
      question_id: questionId,
      submitted_answer: record.answer,
      is_correct: record.correct,
      time_taken_ms: record.timeMs,
      points_earned: record.pointsEarned,
      submitted_at: new Date(record.submittedAt).toISOString(),
    });
  }

  private async persistFinalResults(state: HeatRoomState): Promise<void> {
    const db = createSupabaseClient(state.supabaseUrl, this.env.SUPABASE_SERVICE_ROLE_KEY);
    const participants = Object.values(state.participants);

    await Promise.allSettled(
      participants.map(p =>
        upsertParticipation(db, state.heatId, p.userId, {
          status: 'finished',
          finished_at: new Date().toISOString(),
          questions_attempted: p.questionsAttempted,
          questions_correct: p.questionsCorrect,
          total_time_ms: p.totalTimeMs,
          cta_score: p.score,
          rank_in_heat: p.rankInHeat,
        })
      )
    );
  }

  // ── Scoring helpers ─────────────────────────────────────────────────────────

  private checkAnswer(submitted: string, correct: string, answerType: string): boolean {
    if (answerType === 'multiple_choice') {
      return submitted.trim().toUpperCase() === correct.trim().toUpperCase();
    }
    // Free response: normalise whitespace and compare
    const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalise(submitted) === normalise(correct);
  }

  private calculatePoints(basePoints: number, timeMs: number, timeLimitSeconds: number): number {
    // Time bonus: full points if answered in first 25% of time, scaling down to 50% at the limit
    const timeLimitMs = timeLimitSeconds * 1000;
    const ratio = Math.min(1, timeMs / timeLimitMs);
    const timeMultiplier = 1 - ratio * 0.5; // 1.0 → 0.5
    return Math.round(basePoints * timeMultiplier);
  }

  // ── Participant sorting helpers ─────────────────────────────────────────────

  private sortedParticipants(state: HeatRoomState): Participant[] {
    return Object.values(state.participants).sort((a, b) => a.joinedAt - b.joinedAt);
  }

  private rankedParticipants(state: HeatRoomState): Participant[] {
    return Object.values(state.participants).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeMs - b.totalTimeMs; // Faster wins on tie
    });
  }

  // ── WebSocket broadcast helpers ─────────────────────────────────────────────

  private broadcast(msg: ServerMessage, excludeUserId?: string): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as { userId: string } | null;
      if (attachment?.userId === excludeUserId) continue;
      try { ws.send(payload); } catch { /* ignore closed sockets */ }
    }
  }

  private sendTo(ws: WebSocket, msg: ServerMessage): void {
    try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
  }

  private getWebSocketForUser(userId: string): WebSocket | null {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as { userId: string } | null;
      if (attachment?.userId === userId) return ws;
    }
    return null;
  }

  // ── State persistence helpers ───────────────────────────────────────────────

  private async getState(): Promise<HeatRoomState | null> {
    return (await this.ctx.storage.get<HeatRoomState>('state')) ?? null;
  }

  private async saveState(state: HeatRoomState): Promise<void> {
    await this.ctx.storage.put('state', state);
  }
}
