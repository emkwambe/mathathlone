// ============================================
// MATHATHLONE TYPE DEFINITIONS
// Auto-generated from database schema
// ============================================

// ============================================
// ENUMS
// ============================================

export type UserRole = 'athlete' | 'teacher' | 'parent' | 'school_admin' | 'judge' | 'platform_admin';
export type LicenseTier = 'free' | 'bronze' | 'silver' | 'gold' | 'platinum';
export type HeatType = 'official' | 'practice';
export type HeatScope = 'class' | 'school' | 'global';
export type HeatStatus = 'scheduled' | 'open' | 'in_progress' | 'calculating' | 'complete' | 'cancelled';
export type ParticipationStatus = 'queued' | 'synced' | 'competing' | 'finished' | 'voided' | 'abandoned';
export type MedalType = 'gold' | 'silver' | 'bronze';
export type DepthLevel = 1 | 2 | 3 | 4;
export type ViolationType = 'focus' | 'velocity' | 'suspected_solver' | 'answer_sharing' | 'identity';
export type ViolationSeverity = 'warning' | 'penalty' | 'disqualification';
export type ViolationStatus = 'flagged' | 'under_review' | 'confirmed' | 'cleared' | 'appealed' | 'final';
export type SelfReportReason = 'help_received' | 'saw_screen' | 'used_resource' | 'other';
export type EnrollmentStatus = 'active' | 'removed';
export type ParentLinkStatus = 'pending' | 'active' | 'revoked';
export type TopicCategory = 'algebra' | 'geometry' | 'statistics' | 'number_sense' | 'mixed';
export type GradeBand = '5-6' | '7-8' | '9-10' | '11-12';

// ============================================
// DATABASE MODELS
// ============================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string;
  country_code: string;
  date_of_birth?: string;
  grade_level?: number;
  school_id?: string;
  fair_play_acknowledged_at?: string;
  parent_consent_at?: string;
  proctor_certified_at?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  district?: string;
  state?: string;
  country_code: string;
  license_tier: LicenseTier;
  license_expires_at?: string;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  grade_level: number;
  join_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  athlete_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface ParentLink {
  id: string;
  parent_id: string;
  athlete_id: string;
  relationship: string;
  status: ParentLinkStatus;
  linked_at: string;
}

export interface Topic {
  id: string;
  name: string;
  category: TopicCategory;
  grade_band: GradeBand;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProblemTemplate {
  id: string;
  topic_id: string;
  depth_level: DepthLevel;
  template_structure: Record<string, unknown>;
  variable_constraints: Record<string, unknown>;
  answer_formula: string;
  points_value: number;
  display_template: string;
  answer_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Heat {
  id: string;
  code: string;
  topic_id: string;
  depth_min: DepthLevel;
  depth_max: DepthLevel;
  type: HeatType;
  scope: HeatScope;
  class_id?: string;
  school_id?: string;
  created_by: string;
  status: HeatStatus;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  question_count: number;
  duration_seconds: number;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface HeatProblem {
  id: string;
  heat_id: string;
  problem_template_id: string;
  sequence_number: number;
  created_at: string;
}

export interface HeatParticipation {
  id: string;
  heat_id: string;
  athlete_id: string;
  status: ParticipationStatus;
  joined_at: string;
  synced_at?: string;
  started_at?: string;
  finished_at?: string;
  questions_attempted: number;
  questions_correct: number;
  first_touch_correct: number;
  total_time_ms: number;
  content_score?: number;
  time_score?: number;
  accuracy_score?: number;
  cta_score?: number;
  rank_in_heat?: number;
  percentile?: number;
  medal?: MedalType;
  ranking_points_earned: number;
  focus_violations: number;
  accuracy_multiplier: number;
  voided_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  participation_id: string;
  heat_problem_id: string;
  variables_used: Record<string, number>;
  correct_answer: string;
  athlete_answer?: string;
  is_correct?: boolean;
  attempt_number: number;
  time_to_answer_ms?: number;
  displayed_at: string;
  submitted_at?: string;
  created_at: string;
}

export interface Ranking {
  id: string;
  athlete_id: string;
  grade_level: number;
  season: string;
  ranking_points: number;
  rank_position?: number;
  heats_completed: number;
  gold_medals: number;
  silver_medals: number;
  bronze_medals: number;
  avg_cta_score?: number;
  avg_content_score?: number;
  avg_time_score?: number;
  avg_accuracy_score?: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface Medal {
  id: string;
  athlete_id: string;
  heat_id: string;
  participation_id: string;
  type: MedalType;
  awarded_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon_url?: string;
  category?: string;
  threshold_value?: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface Violation {
  id: string;
  athlete_id: string;
  heat_id: string;
  participation_id?: string;
  type: ViolationType;
  severity: ViolationSeverity;
  status: ViolationStatus;
  details?: Record<string, unknown>;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  appeal_submitted_at?: string;
  appeal_text?: string;
  appeal_decided_at?: string;
  appeal_decision?: string;
  created_at: string;
  updated_at: string;
}

export interface SelfReport {
  id: string;
  athlete_id: string;
  heat_id: string;
  participation_id?: string;
  reason: SelfReportReason;
  description?: string;
  reported_at: string;
  heat_ended_at?: string;
  within_grace_period: boolean;
  grace_period_minutes: number;
  created_at: string;
}

// ============================================
// COMPOSITE / VIEW TYPES
// ============================================

export interface LeaderboardEntry {
  rank_position: number;
  athlete_id: string;
  display_name: string;
  country_code: string;
  grade_level: number;
  season: string;
  ranking_points: number;
  heats_completed: number;
  gold_medals: number;
  silver_medals: number;
  bronze_medals: number;
  avg_cta_score?: number;
}

export interface HeatResult {
  heat_id: string;
  athlete_id: string;
  display_name: string;
  country_code: string;
  rank_in_heat: number;
  cta_score: number;
  content_score: number;
  time_score: number;
  accuracy_score: number;
  medal?: MedalType;
  ranking_points_earned: number;
  questions_correct: number;
  questions_attempted: number;
  total_time_ms: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateHeatRequest {
  topic_id: string;
  depth_min: DepthLevel;
  depth_max: DepthLevel;
  type: HeatType;
  scope: HeatScope;
  class_id?: string;
  question_count?: number;
  duration_seconds?: number;
}

export interface JoinHeatRequest {
  heat_code: string;
}

export interface SubmitAnswerRequest {
  participation_id: string;
  heat_problem_id: string;
  answer: string;
  displayed_at: string;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  points_earned: number;
  time_ms: number;
  next_question?: HeatProblemWithVariables;
}

export interface SelfReportRequest {
  heat_id: string;
  reason: SelfReportReason;
  description?: string;
}

// ============================================
// CLIENT-SIDE TYPES
// ============================================

export interface HeatProblemWithVariables {
  id: string;
  sequence_number: number;
  display_template: string;
  variables: Record<string, number>;
  points_value: number;
  depth_level: DepthLevel;
}

export interface CTAScoreBreakdown {
  content: number;
  time: number;
  accuracy: number;
  weighted: number;
  percentile: number;
}

export interface AthleteProfile {
  user: User;
  ranking?: Ranking;
  recent_heats: HeatParticipation[];
  medals: Medal[];
  achievements: UserAchievement[];
}

export interface TeacherDashboard {
  user: User;
  school: School;
  classes: ClassWithStats[];
  recent_heats: Heat[];
}

export interface ClassWithStats extends Class {
  athlete_count: number;
  avg_cta_score?: number;
  heats_this_month: number;
}

export interface HeatLobby {
  heat: Heat;
  topic: Topic;
  participants: ParticipantPreview[];
  created_by_name: string;
}

export interface ParticipantPreview {
  athlete_id: string;
  display_name: string;
  country_code: string;
  status: ParticipationStatus;
}

// ============================================
// REAL-TIME / SYNC TYPES
// ============================================

export interface SyncMessage {
  type: 'SYNC' | 'START' | 'QUESTION' | 'RESULT' | 'END';
  timestamp: number;
  payload: unknown;
}

export interface ClockSyncData {
  server_time: number;
  client_time: number;
  offset: number;
  latency: number;
}

export interface FocusViolationEvent {
  participation_id: string;
  timestamp: number;
  violation_number: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface RegisterAthleteForm {
  email: string;
  password: string;
  display_name: string;
  country_code: string;
  date_of_birth: string;
  grade_level: number;
  class_code?: string;
  fair_play_acknowledged: boolean;
  parent_consent?: boolean;
}

export interface RegisterTeacherForm {
  email: string;
  password: string;
  display_name: string;
  school_name: string;
  school_code?: string;
  grades_taught: number[];
  proctor_certified: boolean;
}

export interface CreateClassForm {
  name: string;
  grade_level: number;
}

export interface HeatConfigForm {
  class_id: string;
  topic_id: string;
  depth_min: DepthLevel;
  depth_max: DepthLevel;
  type: HeatType;
  scope: HeatScope;
}
