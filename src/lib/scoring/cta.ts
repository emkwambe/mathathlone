// ============================================
// CTA SCORING ALGORITHM
// Content × Time × Accuracy
// ============================================

import type { DepthLevel, CTAScoreBreakdown, Submission } from '@/types/database';

// ============================================
// CONSTANTS
// ============================================

// Points per depth level
export const DEPTH_POINTS: Record<DepthLevel, number> = {
  1: 30,  // Foundation
  2: 45,  // Developing
  3: 60,  // Proficient
  4: 80,  // Elite
};

// CTA Weights (must sum to 1.0)
export const CTA_WEIGHTS = {
  CONTENT: 0.50,
  TIME: 0.30,
  ACCURACY: 0.20,
} as const;

// Time scoring constants
export const TIME_SCORING = {
  MAX_SECONDS: 900,      // 15 minutes total
  IDEAL_PER_QUESTION: 30, // seconds
  MIN_SCORE: 100,        // Floor for time component
  MAX_SCORE: 1000,       // Ceiling for time component
} as const;

// Medal thresholds (percentile-based)
export const MEDAL_THRESHOLDS = {
  GOLD: 0.99,    // Top 1%
  SILVER: 0.95,  // Top 5%
  BRONZE: 0.90,  // Top 10%
} as const;

// ============================================
// CONTENT SCORE CALCULATION
// ============================================

/**
 * Calculate Content score based on correct answers and their difficulty
 * 
 * Formula: Sum of (points_value) for each correct answer
 * Normalized to 0-1000 scale
 * 
 * @param submissions - Array of submissions with correctness and depth
 * @param maxPossible - Maximum possible points (sum of all question point values)
 */
export function calculateContentScore(
  submissions: Array<{ is_correct: boolean; depth_level: DepthLevel }>,
  maxPossible: number
): number {
  if (maxPossible === 0) return 0;

  const earnedPoints = submissions
    .filter(s => s.is_correct)
    .reduce((sum, s) => sum + DEPTH_POINTS[s.depth_level], 0);

  // Normalize to 0-1000
  return Math.round((earnedPoints / maxPossible) * 1000);
}

// ============================================
// TIME SCORE CALCULATION
// ============================================

/**
 * Calculate Time score based on speed of correct answers
 * 
 * Only time spent on CORRECT answers counts
 * Faster = higher score
 * 
 * @param totalTimeMs - Total milliseconds spent on correct answers
 * @param correctCount - Number of correct answers
 */
export function calculateTimeScore(
  totalTimeMs: number,
  correctCount: number
): number {
  if (correctCount === 0) return TIME_SCORING.MIN_SCORE;

  const totalSeconds = totalTimeMs / 1000;
  const avgSecondsPerQuestion = totalSeconds / correctCount;
  
  // Ideal time benchmark
  const idealTime = TIME_SCORING.IDEAL_PER_QUESTION * correctCount;
  
  // Ratio: < 1 means faster than ideal, > 1 means slower
  const timeRatio = totalSeconds / idealTime;
  
  // Convert to score (inverse relationship - faster = higher)
  // Using exponential decay: score = 1000 * e^(-0.5 * (ratio - 1))
  // This gives 1000 at ratio=1, ~600 at ratio=2, ~370 at ratio=3
  let score: number;
  
  if (timeRatio <= 1) {
    // Faster than ideal: bonus up to 1000
    score = TIME_SCORING.MAX_SCORE;
  } else {
    // Slower than ideal: decay
    score = Math.round(TIME_SCORING.MAX_SCORE * Math.exp(-0.5 * (timeRatio - 1)));
  }
  
  // Clamp to valid range
  return Math.max(TIME_SCORING.MIN_SCORE, Math.min(TIME_SCORING.MAX_SCORE, score));
}

// ============================================
// ACCURACY SCORE CALCULATION
// ============================================

/**
 * Calculate Accuracy score based on first-touch success rate
 * 
 * First-touch = correct on first attempt (no second chances counted)
 * 
 * @param firstTouchCorrect - Number of questions correct on first attempt
 * @param totalAttempted - Total questions attempted
 */
export function calculateAccuracyScore(
  firstTouchCorrect: number,
  totalAttempted: number
): number {
  if (totalAttempted === 0) return 0;

  const accuracy = firstTouchCorrect / totalAttempted;
  
  // Direct mapping: 100% accuracy = 1000, 0% = 0
  return Math.round(accuracy * 1000);
}

// ============================================
// COMPOSITE CTA SCORE
// ============================================

/**
 * Calculate weighted CTA score
 * 
 * Formula: (Content × 0.50) + (Time × 0.30) + (Accuracy × 0.20)
 * 
 * @param content - Content score (0-1000)
 * @param time - Time score (0-1000)
 * @param accuracy - Accuracy score (0-1000)
 */
export function calculateCTAScore(
  content: number,
  time: number,
  accuracy: number
): number {
  const weighted = 
    (content * CTA_WEIGHTS.CONTENT) +
    (time * CTA_WEIGHTS.TIME) +
    (accuracy * CTA_WEIGHTS.ACCURACY);
  
  return Math.round(weighted);
}

// ============================================
// FULL BREAKDOWN CALCULATOR
// ============================================

export interface ScoreInput {
  submissions: Array<{
    is_correct: boolean;
    depth_level: DepthLevel;
    time_to_answer_ms: number;
    attempt_number: number;
  }>;
  maxPossiblePoints: number;
  accuracyMultiplier?: number; // Applied for focus violations
}

/**
 * Calculate complete CTA breakdown from raw submission data
 */
export function calculateFullBreakdown(input: ScoreInput): CTAScoreBreakdown {
  const { submissions, maxPossiblePoints, accuracyMultiplier = 1.0 } = input;

  // Filter for scoring
  const correctSubmissions = submissions.filter(s => s.is_correct);
  const firstAttempts = submissions.filter(s => s.attempt_number === 1);
  const firstTouchCorrect = firstAttempts.filter(s => s.is_correct).length;

  // Calculate components
  const content = calculateContentScore(
    submissions.map(s => ({ is_correct: s.is_correct, depth_level: s.depth_level })),
    maxPossiblePoints
  );

  const totalCorrectTimeMs = correctSubmissions.reduce(
    (sum, s) => sum + s.time_to_answer_ms, 
    0
  );
  const time = calculateTimeScore(totalCorrectTimeMs, correctSubmissions.length);

  // Apply accuracy multiplier (from focus violations)
  const rawAccuracy = calculateAccuracyScore(firstTouchCorrect, firstAttempts.length);
  const accuracy = Math.round(rawAccuracy * accuracyMultiplier);

  // Calculate weighted total
  const weighted = calculateCTAScore(content, time, accuracy);

  return {
    content,
    time,
    accuracy,
    weighted,
    percentile: 0, // Calculated after all participants scored
  };
}

// ============================================
// PERCENTILE CALCULATION
// ============================================

/**
 * Calculate percentile rank given a score and all scores
 * 
 * @param score - The score to rank
 * @param allScores - Array of all scores in the Heat
 */
export function calculatePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  
  const belowCount = allScores.filter(s => s < score).length;
  const percentile = (belowCount / allScores.length) * 100;
  
  return Math.round(percentile * 100) / 100; // Round to 2 decimal places
}

// ============================================
// MEDAL DETERMINATION
// ============================================

/**
 * Determine medal based on rank and participant count
 * 
 * @param rank - Position in Heat (1 = first place)
 * @param totalParticipants - Total athletes in Heat
 */
export function determineMedal(
  rank: number,
  totalParticipants: number
): 'gold' | 'silver' | 'bronze' | null {
  if (totalParticipants < 3) {
    // Not enough participants for medals
    return null;
  }

  const percentile = 1 - ((rank - 1) / totalParticipants);

  if (percentile >= MEDAL_THRESHOLDS.GOLD) return 'gold';
  if (percentile >= MEDAL_THRESHOLDS.SILVER) return 'silver';
  if (percentile >= MEDAL_THRESHOLDS.BRONZE) return 'bronze';
  
  return null;
}

// ============================================
// RANKING POINTS
// ============================================

/**
 * Calculate ranking points earned from a Heat
 * 
 * Based on medal + participation
 */
export function calculateRankingPoints(
  medal: 'gold' | 'silver' | 'bronze' | null,
  heatType: 'official' | 'practice'
): number {
  if (heatType === 'practice') return 0;

  const basePoints: Record<string, number> = {
    gold: 100,
    silver: 85,
    bronze: 70,
    participation: 10, // Just for completing
  };

  if (medal) {
    return basePoints[medal];
  }

  return basePoints.participation;
}

// ============================================
// EXPORTS SUMMARY
// ============================================

export const scoring = {
  calculateContentScore,
  calculateTimeScore,
  calculateAccuracyScore,
  calculateCTAScore,
  calculateFullBreakdown,
  calculatePercentile,
  determineMedal,
  calculateRankingPoints,
  DEPTH_POINTS,
  CTA_WEIGHTS,
  TIME_SCORING,
  MEDAL_THRESHOLDS,
};

export default scoring;
