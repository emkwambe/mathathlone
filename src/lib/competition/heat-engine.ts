// =============================================================================
// MathAthlone Heat Engine
// =============================================================================
// Core service for running real-time math competitions
// Handles: Heat creation, joining, question delivery, submissions, scoring
// Uses Supabase Realtime for live updates
// =============================================================================

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { generateQuestion, type GeneratedQuestion, type DifficultyLevel } from './mathathlone-generators';
import { validateAnswer, calculateCTAScore, type ValidationResult, type CTAScoreComponents } from './mathathlone-validation';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type HeatStatus = 'draft' | 'lobby' | 'countdown' | 'active' | 'paused' | 'finished' | 'cancelled';
export type HeatType = 'sprint' | 'target' | 'practice' | 'championship';

export interface Heat {
  id: string;
  code: string;                    // Join code like "MA-XXXX"
  name: string;
  created_by: string;              // Teacher/organizer user ID
  heat_type: HeatType;
  status: HeatStatus;
  max_participants: number;
  question_count: number;
  time_limit_minutes: number;
  
  // Timing
  scheduled_start?: Date;
  actual_start?: Date;
  ended_at?: Date;
  
  // Settings
  allow_late_join: boolean;
  show_leaderboard: boolean;
  show_answers_after: boolean;
  
  // Curriculum alignment
  topic_id?: string;
  topic_name?: string;
  
  created_at: Date;
}

export interface HeatParticipation {
  id: string;
  heat_id: string;
  athlete_id: string;
  display_name: string;
  
  // Progress
  questions_answered: number;
  questions_correct: number;
  current_question: number;
  
  // Scoring
  total_points: number;
  cta_score: number;
  rank: number;
  medal?: 'gold' | 'silver' | 'bronze';
  
  // Timing
  joined_at: Date;
  finished_at?: Date;
  total_time_ms: number;
}

export interface HeatQuestion {
  id: string;
  heat_id: string;
  question_number: number;
  difficulty: DifficultyLevel;
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: string;
  solution_steps: string[];
  points_value: number;
  time_limit_seconds: number;
}

export interface QuestionSubmission {
  id: string;
  heat_participation_id: string;
  heat_question_id: string;
  submitted_answer: string;
  is_correct: boolean;
  time_taken_ms: number;
  attempt_number: number;
  points_earned: number;
  cta_components: CTAScoreComponents;
  submitted_at: Date;
}

export interface LeaderboardEntry {
  rank: number;
  athlete_id: string;
  display_name: string;
  total_points: number;
  cta_score: number;
  questions_answered: number;
  questions_correct: number;
  streak: number;
}

// Realtime event types
export interface HeatRealtimeEvents {
  'heat:status_changed': { status: HeatStatus; timestamp: Date };
  'heat:question_started': { question_number: number; question: HeatQuestion; timestamp: Date };
  'heat:participant_joined': { participant: HeatParticipation };
  'heat:participant_finished': { participant: HeatParticipation };
  'heat:leaderboard_updated': { leaderboard: LeaderboardEntry[] };
  'heat:submission_received': { athlete_id: string; question_number: number; is_correct: boolean };
}

// -----------------------------------------------------------------------------
// HEAT CODE GENERATOR
// -----------------------------------------------------------------------------

/**
 * Generate a unique 4-character Heat code
 * Format: MA-XXXX (e.g., MA-K7PQ)
 */
export function generateHeatCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MA-${code}`;
}

// -----------------------------------------------------------------------------
// HEAT ENGINE CLASS
// -----------------------------------------------------------------------------

export class HeatEngine {
  private supabase: SupabaseClient;
  private realtimeChannel: RealtimeChannel | null = null;
  private currentHeat: Heat | null = null;
  private currentParticipation: HeatParticipation | null = null;
  private questions: HeatQuestion[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  
  // Event callbacks
  private eventListeners: Map<string, Set<Function>> = new Map();
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }
  
  // ---------------------------------------------------------------------------
  // EVENT SYSTEM
  // ---------------------------------------------------------------------------
  
  on<K extends keyof HeatRealtimeEvents>(
    event: K, 
    callback: (data: HeatRealtimeEvents[K]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  off<K extends keyof HeatRealtimeEvents>(
    event: K, 
    callback: (data: HeatRealtimeEvents[K]) => void
  ): void {
    this.eventListeners.get(event)?.delete(callback);
  }
  
  private emit<K extends keyof HeatRealtimeEvents>(
    event: K, 
    data: HeatRealtimeEvents[K]
  ): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }
  
  // ---------------------------------------------------------------------------
  // TEACHER: CREATE HEAT
  // ---------------------------------------------------------------------------
  
  /**
   * Create a new Heat competition
   */
  async createHeat(params: {
    name: string;
    heat_type: HeatType;
    question_count: number;
    time_limit_minutes: number;
    topic_id?: string;
    max_participants?: number;
    generators?: { generator_type: string; difficulty: DifficultyLevel }[];
  }): Promise<Heat> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to create a Heat');
    
    // Generate unique code
    let code = generateHeatCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await this.supabase
        .from('heats')
        .select('id')
        .eq('code', code)
        .single();
      
      if (!existing) break;
      code = generateHeatCode();
      attempts++;
    }
    
    // Create Heat record
    const { data: heat, error: heatError } = await this.supabase
      .from('heats')
      .insert({
        code,
        name: params.name,
        created_by: user.id,
        heat_type: params.heat_type,
        status: 'draft',
        question_count: params.question_count,
        time_limit_minutes: params.time_limit_minutes,
        max_participants: params.max_participants ?? 100,
        topic_id: params.topic_id,
        allow_late_join: true,
        show_leaderboard: true,
        show_answers_after: true,
      })
      .select()
      .single();
    
    if (heatError) throw heatError;
    
    // Generate questions if generators provided
    if (params.generators && params.generators.length > 0) {
      await this.generateHeatQuestions(heat.id, params.generators);
    }
    
    this.currentHeat = heat;
    return heat;
  }
  
  /**
   * Generate questions for a Heat using the generator system
   */
  async generateHeatQuestions(
    heatId: string,
    config: { generator_type: string; difficulty: DifficultyLevel }[]
  ): Promise<HeatQuestion[]> {
    const questions: Partial<HeatQuestion>[] = [];
    
    for (let i = 0; i < config.length; i++) {
      const { generator_type, difficulty } = config[i];
      const generated = generateQuestion(generator_type, difficulty);
      
      if (!generated) {
        console.error(`Failed to generate question for ${generator_type}`);
        continue;
      }
      
      questions.push({
        heat_id: heatId,
        question_number: i + 1,
        difficulty,
        question_latex: generated.question_latex,
        question_text: generated.question_text,
        correct_answer: generated.correct_answer,
        answer_type: generated.answer_type,
        solution_steps: generated.solution_steps,
        points_value: 100 + (difficulty - 1) * 25, // 100, 125, 150, 175
        time_limit_seconds: 60 + difficulty * 15, // 75, 90, 105, 120
      });
    }
    
    const { data, error } = await this.supabase
      .from('heat_questions')
      .insert(questions)
      .select();
    
    if (error) throw error;
    
    this.questions = data as HeatQuestion[];
    return this.questions;
  }
  
  /**
   * Open Heat lobby (allow participants to join)
   */
  async openLobby(heatId: string): Promise<void> {
    const { error } = await this.supabase
      .from('heats')
      .update({ status: 'lobby' })
      .eq('id', heatId);
    
    if (error) throw error;
    
    // Subscribe to realtime updates
    await this.subscribeToHeat(heatId);
    
    this.emit('heat:status_changed', { status: 'lobby', timestamp: new Date() });
  }
  
  /**
   * Start the Heat competition
   */
  async startHeat(heatId: string, countdownSeconds = 5): Promise<void> {
    // Set status to countdown
    await this.supabase
      .from('heats')
      .update({ status: 'countdown' })
      .eq('id', heatId);
    
    this.emit('heat:status_changed', { status: 'countdown', timestamp: new Date() });
    
    // Wait for countdown
    await new Promise(resolve => setTimeout(resolve, countdownSeconds * 1000));
    
    // Set status to active and record start time
    const { error } = await this.supabase
      .from('heats')
      .update({ 
        status: 'active',
        actual_start: new Date().toISOString(),
      })
      .eq('id', heatId);
    
    if (error) throw error;
    
    this.emit('heat:status_changed', { status: 'active', timestamp: new Date() });
    
    // Broadcast first question
    if (this.questions.length > 0) {
      this.emit('heat:question_started', {
        question_number: 1,
        question: this.questions[0],
        timestamp: new Date(),
      });
    }
  }
  
  /**
   * End the Heat competition
   */
  async endHeat(heatId: string): Promise<void> {
    const { error } = await this.supabase
      .from('heats')
      .update({ 
        status: 'finished',
        ended_at: new Date().toISOString(),
      })
      .eq('id', heatId);
    
    if (error) throw error;
    
    // Calculate final standings and medals
    await this.calculateFinalStandings(heatId);
    
    this.emit('heat:status_changed', { status: 'finished', timestamp: new Date() });
  }
  
  // ---------------------------------------------------------------------------
  // PARTICIPANT: JOIN & COMPETE
  // ---------------------------------------------------------------------------
  
  /**
   * Join a Heat by code
   */
  async joinHeat(code: string): Promise<HeatParticipation> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to join a Heat');
    
    // Find Heat by code
    const { data: heat, error: heatError } = await this.supabase
      .from('heats')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (heatError || !heat) throw new Error('Heat not found');
    if (heat.status !== 'lobby' && !heat.allow_late_join) {
      throw new Error('This Heat is not accepting participants');
    }
    
    // Get user's display name
    const { data: profile } = await this.supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    // Create participation record
    const { data: participation, error: partError } = await this.supabase
      .from('heat_participations')
      .insert({
        heat_id: heat.id,
        athlete_id: user.id,
        display_name: profile?.display_name || 'Anonymous',
        questions_answered: 0,
        questions_correct: 0,
        current_question: 1,
        total_points: 0,
        cta_score: 0,
        total_time_ms: 0,
      })
      .select()
      .single();
    
    if (partError) throw partError;
    
    this.currentHeat = heat;
    this.currentParticipation = participation;
    
    // Load questions
    const { data: questions } = await this.supabase
      .from('heat_questions')
      .select('*')
      .eq('heat_id', heat.id)
      .order('question_number');
    
    this.questions = questions || [];
    
    // Subscribe to realtime updates
    await this.subscribeToHeat(heat.id);
    
    return participation;
  }
  
  /**
   * Submit an answer to the current question
   */
  async submitAnswer(
    questionId: string,
    answer: string,
    timeTakenMs: number
  ): Promise<{
    validation: ValidationResult;
    scoring: CTAScoreComponents;
    newRank?: number;
  }> {
    if (!this.currentParticipation) {
      throw new Error('Not participating in a Heat');
    }
    
    // Get the question
    const question = this.questions.find(q => q.id === questionId);
    if (!question) throw new Error('Question not found');
    
    // Check for previous attempts
    const { data: previousAttempts } = await this.supabase
      .from('question_submissions')
      .select('attempt_number')
      .eq('heat_participation_id', this.currentParticipation.id)
      .eq('heat_question_id', questionId)
      .order('attempt_number', { ascending: false })
      .limit(1);
    
    const attemptNumber = (previousAttempts?.[0]?.attempt_number ?? 0) + 1;
    
    // Validate the answer
    const validation = validateAnswer(
      answer,
      question.correct_answer,
      question.answer_type as any
    );
    
    // Calculate CTA score
    const scoring = calculateCTAScore(
      validation.is_correct,
      timeTakenMs,
      question.time_limit_seconds * 1000,
      attemptNumber,
      question.points_value
    );
    
    // Save submission
    const { error: submitError } = await this.supabase
      .from('question_submissions')
      .insert({
        heat_participation_id: this.currentParticipation.id,
        heat_question_id: questionId,
        submitted_answer: answer,
        is_correct: validation.is_correct,
        time_taken_ms: timeTakenMs,
        attempt_number: attemptNumber,
        points_earned: scoring.points_earned,
      });
    
    if (submitError) throw submitError;
    
    // Update participation stats
    const { data: updated, error: updateError } = await this.supabase
      .from('heat_participations')
      .update({
        questions_answered: this.currentParticipation.questions_answered + 1,
        questions_correct: this.currentParticipation.questions_correct + (validation.is_correct ? 1 : 0),
        total_points: this.currentParticipation.total_points + scoring.points_earned,
        current_question: question.question_number + 1,
        total_time_ms: this.currentParticipation.total_time_ms + timeTakenMs,
      })
      .eq('id', this.currentParticipation.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    this.currentParticipation = updated;
    
    // Broadcast submission (without revealing answer)
    this.broadcastSubmission(
      this.currentParticipation.athlete_id,
      question.question_number,
      validation.is_correct
    );
    
    return { validation, scoring };
  }
  
  /**
   * Mark participation as finished
   */
  async finishHeat(): Promise<HeatParticipation> {
    if (!this.currentParticipation) {
      throw new Error('Not participating in a Heat');
    }
    
    const { data, error } = await this.supabase
      .from('heat_participations')
      .update({
        finished_at: new Date().toISOString(),
      })
      .eq('id', this.currentParticipation.id)
      .select()
      .single();
    
    if (error) throw error;
    
    this.currentParticipation = data;
    this.emit('heat:participant_finished', { participant: data });
    
    return data;
  }
  
  // ---------------------------------------------------------------------------
  // REALTIME SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  
  /**
   * Subscribe to Heat realtime updates
   */
  private async subscribeToHeat(heatId: string): Promise<void> {
    // Unsubscribe from previous channel if any
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
    }
    
    this.realtimeChannel = this.supabase.channel(`heat:${heatId}`);
    
    // Listen for Heat status changes
    this.realtimeChannel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'heats', filter: `id=eq.${heatId}` },
      (payload) => {
        const newStatus = payload.new.status as HeatStatus;
        this.emit('heat:status_changed', { status: newStatus, timestamp: new Date() });
      }
    );
    
    // Listen for new participants
    this.realtimeChannel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'heat_participations', filter: `heat_id=eq.${heatId}` },
      (payload) => {
        this.emit('heat:participant_joined', { participant: payload.new as HeatParticipation });
      }
    );
    
    // Listen for participant updates (for leaderboard)
    this.realtimeChannel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'heat_participations', filter: `heat_id=eq.${heatId}` },
      async () => {
        // Refresh leaderboard
        const leaderboard = await this.getLeaderboard(heatId);
        this.emit('heat:leaderboard_updated', { leaderboard });
      }
    );
    
    // Listen for broadcast messages (submissions)
    this.realtimeChannel.on(
      'broadcast',
      { event: 'submission' },
      (payload) => {
        this.emit('heat:submission_received', payload.payload as any);
      }
    );
    
    await this.realtimeChannel.subscribe();
  }
  
  /**
   * Broadcast a submission event to all participants
   */
  private async broadcastSubmission(
    athleteId: string,
    questionNumber: number,
    isCorrect: boolean
  ): Promise<void> {
    if (!this.realtimeChannel) return;
    
    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'submission',
      payload: { athlete_id: athleteId, question_number: questionNumber, is_correct: isCorrect },
    });
  }
  
  // ---------------------------------------------------------------------------
  // LEADERBOARD & STANDINGS
  // ---------------------------------------------------------------------------
  
  /**
   * Get current leaderboard for a Heat
   */
  async getLeaderboard(heatId: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase
      .from('heat_participations')
      .select('*')
      .eq('heat_id', heatId)
      .order('total_points', { ascending: false })
      .order('cta_score', { ascending: false });
    
    if (error) throw error;
    
    this.leaderboard = (data || []).map((p, index) => ({
      rank: index + 1,
      athlete_id: p.athlete_id,
      display_name: p.display_name,
      total_points: p.total_points,
      cta_score: p.cta_score,
      questions_answered: p.questions_answered,
      questions_correct: p.questions_correct,
      streak: 0, // Calculate streak if needed
    }));
    
    return this.leaderboard;
  }
  
  /**
   * Calculate final standings and assign medals
   */
  private async calculateFinalStandings(heatId: string): Promise<void> {
    // Get all participations ordered by points
    const { data: participations, error } = await this.supabase
      .from('heat_participations')
      .select('*')
      .eq('heat_id', heatId)
      .order('total_points', { ascending: false })
      .order('cta_score', { ascending: false });
    
    if (error || !participations) return;
    
    // Calculate CTA scores and assign ranks/medals
    for (let i = 0; i < participations.length; i++) {
      const p = participations[i];
      const rank = i + 1;
      
      // Calculate overall CTA
      const cta = p.questions_answered > 0
        ? (p.total_points / (p.questions_answered * 100)) * 100
        : 0;
      
      // Assign medal
      let medal: 'gold' | 'silver' | 'bronze' | null = null;
      if (rank === 1) medal = 'gold';
      else if (rank === 2) medal = 'silver';
      else if (rank === 3) medal = 'bronze';
      
      await this.supabase
        .from('heat_participations')
        .update({
          rank,
          cta_score: Math.round(cta * 100) / 100,
          medal,
        })
        .eq('id', p.id);
    }
  }
  
  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------
  
  getCurrentHeat(): Heat | null {
    return this.currentHeat;
  }
  
  getCurrentParticipation(): HeatParticipation | null {
    return this.currentParticipation;
  }
  
  getQuestions(): HeatQuestion[] {
    return this.questions;
  }
  
  getCurrentQuestion(): HeatQuestion | null {
    if (!this.currentParticipation) return null;
    return this.questions.find(
      q => q.question_number === this.currentParticipation!.current_question
    ) || null;
  }
  
  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  
  async disconnect(): Promise<void> {
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.currentHeat = null;
    this.currentParticipation = null;
    this.questions = [];
    this.leaderboard = [];
    this.eventListeners.clear();
  }
}

// -----------------------------------------------------------------------------
// FACTORY FUNCTION
// -----------------------------------------------------------------------------

/**
 * Create a new HeatEngine instance
 */
export function createHeatEngine(supabaseClient: SupabaseClient): HeatEngine {
  return new HeatEngine(supabaseClient);
}
