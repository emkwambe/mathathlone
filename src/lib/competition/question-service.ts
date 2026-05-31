// =============================================================================
// MathAthlone Unified Question Service
// =============================================================================
// Handles three question sources behind one interface:
//   1. Procedural generators (generators.ts)         → text/LaTeX
//   2. Visual generators     (visual-generators.ts)  → SVG + multiple choice
//   3. Static questions      (static_questions table) → multiple choice
//
// Used by:
//   - In-browser previews / practice mode (no Heat row required)
//   - Tests / dev tools that need a unified question shape
//
// Heat creation itself goes through src/lib/competition/question-delivery.ts,
// which writes directly into the heat_questions table.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateQuestion,
  GENERATORS,
  type DifficultyLevel,
} from './generators';
import {
  generateVisualQuestion,
  VISUAL_GENERATORS,
  type VisualQuestion,
} from './visual-generators';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface StaticQuestion {
  id: string;
  concept_id: string;
  concept_name: string;
  question_type: 'multiple_choice' | 'true_false' | 'select_all' | 'image_choice';
  question_text: string;
  question_latex?: string;
  question_image_url?: string;
  options: string[];
  option_images?: string[];
  correct_answer: string;
  correct_answer_index: number;
  explanation?: string;
  difficulty: DifficultyLevel;
  category: string;
}

/**
 * Unified question shape returned by QuestionService.generateHeatQuestions().
 * `source_type` discriminates which fields are populated:
 *
 *   'generator' → question_text (plain), question_latex (LaTeX), correct_answer (free-form)
 *   'visual'    → question_text (prompt), question_svg (raw SVG), options (A–D), correct_answer (letter)
 *   'static'    → question_text, options, correct_answer (letter or index)
 */
export interface UnifiedQuestion {
  id: string;
  source_type: 'generator' | 'visual' | 'static';

  // Display
  question_number: number;
  question_text: string;
  question_latex?: string;
  question_image_url?: string;
  question_svg?: string;                  // present for source_type 'visual'

  // For MC-style questions (visual + static)
  is_multiple_choice: boolean;
  options?: string[];
  option_images?: string[];

  // Answer
  correct_answer: string;
  answer_type: string;

  // Metadata
  difficulty: DifficultyLevel;
  concept_id: string;
  points_value: number;
  time_limit_seconds: number;

  // Solution / explanation
  solution_steps?: string[];
  explanation?: string;
}

export interface HeatQuestionConfig {
  total_questions: number;
  static_ratio?: number;                   // 0..1 fraction from static_questions
  visual_ratio?: number;                   // 0..1 fraction from visual generators
  concept_ids?: string[];                  // restrict static pool by concept
  difficulty_distribution?: {
    1: number;                             // Bronze count
    2: number;                             // Silver count
    3: number;                             // Gold count
    4: number;                             // Platinum count
  };
}

// -----------------------------------------------------------------------------
// UNIFIED QUESTION SERVICE
// -----------------------------------------------------------------------------

export class QuestionService {
  private supabase: SupabaseClient;
  private staticQuestionsCache: Map<string, StaticQuestion[]> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ---------------------------------------------------------------------------
  // STATIC QUESTIONS
  // ---------------------------------------------------------------------------

  /**
   * Load all active static questions (optionally filtered by concept_id).
   * `concept_id` here is the TEXT lesson_number, not a UUID FK — that
   * matches the live `static_questions.concept_id` column shape from the
   * Sprint 0 audit.
   */
  async loadStaticQuestions(conceptIds?: string[]): Promise<StaticQuestion[]> {
    let query = this.supabase
      .from('static_questions')
      .select('*')
      .eq('is_active', true);

    if (conceptIds && conceptIds.length > 0) {
      query = query.in('concept_id', conceptIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load static questions:', error);
      return [];
    }

    return (data || []).map((q: any) => ({
      id: q.id,
      concept_id: q.concept_id,
      concept_name: q.concept_name,
      question_type: q.question_type,
      question_text: q.question_text,
      question_latex: q.question_latex,
      question_image_url: q.question_image_url,
      options: q.options || [],
      option_images: q.option_images,
      correct_answer: q.correct_answer,
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation,
      difficulty: q.difficulty,
      category: q.category,
    }));
  }

  /**
   * Get N random static questions, optionally filtered by difficulty + concepts.
   */
  async getRandomStaticQuestions(
    count: number,
    difficulty?: DifficultyLevel,
    conceptIds?: string[]
  ): Promise<StaticQuestion[]> {
    const cacheKey = `${conceptIds?.join(',') || 'all'}-${difficulty || 'any'}`;

    if (!this.staticQuestionsCache.has(cacheKey)) {
      let query = this.supabase
        .from('static_questions')
        .select('*')
        .eq('is_active', true);

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }
      if (conceptIds && conceptIds.length > 0) {
        query = query.in('concept_id', conceptIds);
      }

      const { data } = await query;
      this.staticQuestionsCache.set(cacheKey, data || []);
    }

    const questions = this.staticQuestionsCache.get(cacheKey) || [];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ---------------------------------------------------------------------------
  // GENERATE MIXED QUESTION SET
  // ---------------------------------------------------------------------------

  /**
   * Generate a mixed Heat question set in memory (no DB writes).
   * For DB-backed Heat creation use question-delivery.generateAndInsertQuestions().
   */
  async generateHeatQuestions(config: HeatQuestionConfig): Promise<UnifiedQuestion[]> {
    const {
      total_questions,
      static_ratio = 0.3,
      visual_ratio = 0.2,
      concept_ids,
      difficulty_distribution = { 1: 5, 2: 8, 3: 5, 4: 2 },
    } = config;

    // Carve out fixed counts for each source. Static + visual come out of the
    // non-generator portion of the total — generator gets the remainder.
    const visualCount = Math.min(
      total_questions,
      Math.max(0, Math.round(total_questions * visual_ratio))
    );
    const staticCount = Math.min(
      total_questions - visualCount,
      Math.max(0, Math.round(total_questions * static_ratio))
    );
    const generatorCount = total_questions - visualCount - staticCount;

    const questions: UnifiedQuestion[] = [];
    let questionNumber = 1;

    // Build difficulty queue from the distribution (and shuffle for variety)
    const difficultyQueue: DifficultyLevel[] = [];
    for (const [diff, count] of Object.entries(difficulty_distribution)) {
      for (let i = 0; i < count; i++) {
        difficultyQueue.push(Number(diff) as DifficultyLevel);
      }
    }
    difficultyQueue.sort(() => Math.random() - 0.5);

    // Helper to pick a difficulty without blowing up if the queue runs short
    const nextDifficulty = (): DifficultyLevel =>
      (difficultyQueue.pop() ?? 2) as DifficultyLevel;

    // -------------------------------------------------------------------------
    // STATIC (multiple choice) questions
    // -------------------------------------------------------------------------
    if (staticCount > 0) {
      const staticQuestions = await this.getRandomStaticQuestions(
        staticCount,
        undefined,
        concept_ids
      );

      for (const sq of staticQuestions) {
        const difficulty = nextDifficulty();
        questions.push({
          id: sq.id,
          source_type: 'static',
          question_number: questionNumber++,
          question_text: sq.question_text,
          question_latex: sq.question_latex,
          question_image_url: sq.question_image_url,
          is_multiple_choice: true,
          options: sq.options,
          option_images: sq.option_images,
          correct_answer: sq.correct_answer,
          answer_type: 'multiple_choice',
          difficulty: sq.difficulty,
          concept_id: sq.concept_id,
          points_value: 100 + (sq.difficulty - 1) * 25,
          time_limit_seconds: 45,
          explanation: sq.explanation,
        });
      }
    }

    // -------------------------------------------------------------------------
    // VISUAL (SVG multiple choice) questions
    // -------------------------------------------------------------------------
    if (visualCount > 0) {
      const visualKeys = Object.keys(VISUAL_GENERATORS);
      for (let i = 0; i < visualCount; i++) {
        if (visualKeys.length === 0) break;
        const key = visualKeys[Math.floor(Math.random() * visualKeys.length)];
        let v: VisualQuestion | null = null;
        try {
          v = generateVisualQuestion(key);
        } catch (err) {
          console.warn(`Visual generator ${key} failed:`, err);
        }
        if (!v) continue;

        const difficulty = (Math.min(4, Math.max(1, v.difficulty)) as DifficultyLevel);
        questions.push({
          id: `visual-${Date.now()}-${i}`,
          source_type: 'visual',
          question_number: questionNumber++,
          question_text: v.question_text,
          question_svg: v.question_svg,
          is_multiple_choice: true,
          options: v.options,
          correct_answer: v.correct_answer,
          answer_type: 'multiple_choice',
          difficulty,
          concept_id: v.concept_id,
          points_value: 100 + (difficulty - 1) * 25,
          time_limit_seconds: 45,
          explanation: v.explanation,
        });
      }
    }

    // -------------------------------------------------------------------------
    // GENERATOR questions
    // -------------------------------------------------------------------------
    if (generatorCount > 0) {
      const generatorTypes = Object.keys(GENERATORS);
      const usedGenerators = new Set<string>();

      for (let i = 0; i < generatorCount; i++) {
        const difficulty = nextDifficulty();

        // Avoid repeats up to a small attempt budget
        let generatorType: string;
        let attempts = 0;
        do {
          generatorType =
            generatorTypes[Math.floor(Math.random() * generatorTypes.length)];
          attempts++;
        } while (usedGenerators.has(generatorType) && attempts < 20);
        usedGenerators.add(generatorType);

        const generated = generateQuestion(generatorType, difficulty);
        if (!generated) continue;

        questions.push({
          id: `gen-${Date.now()}-${i}`,
          source_type: 'generator',
          question_number: questionNumber++,
          question_text: generated.question_text,
          question_latex: generated.question_latex,
          is_multiple_choice: false,
          correct_answer: generated.correct_answer,
          answer_type: generated.answer_type,
          difficulty: generated.difficulty,
          concept_id: generated.concept_id,
          points_value: 100 + (generated.difficulty - 1) * 25,
          time_limit_seconds: 60 + generated.difficulty * 15,
          solution_steps: generated.solution_steps,
        });
      }
    }

    // -------------------------------------------------------------------------
    // SHUFFLE & RENUMBER
    // -------------------------------------------------------------------------
    questions.sort(() => Math.random() - 0.5);
    questions.forEach((q, i) => {
      q.question_number = i + 1;
    });

    return questions;
  }

  // ---------------------------------------------------------------------------
  // VALIDATE (lightweight pre-check for the unified shape)
  // ---------------------------------------------------------------------------

  /**
   * Lightweight answer check that handles MC + generator answers uniformly.
   * For full type-aware validation (fractions, intervals, etc.) use
   * `validateAnswer()` from validation.ts directly.
   */
  validateAnswer(
    question: UnifiedQuestion,
    submittedAnswer: string
  ): { is_correct: boolean; feedback?: string } {
    if (question.is_multiple_choice) {
      const submitted = submittedAnswer.toUpperCase().trim();
      const correct = question.correct_answer.toUpperCase().trim();

      // Accept 'A'..'D' or '0'..'3'
      const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      const indexToLetter = ['A', 'B', 'C', 'D'];

      const submittedIndex =
        submitted in letterToIndex
          ? letterToIndex[submitted]
          : parseInt(submitted, 10);
      const correctIndex =
        correct in letterToIndex
          ? letterToIndex[correct]
          : parseInt(correct, 10);

      return {
        is_correct: submittedIndex === correctIndex,
        feedback:
          submittedIndex !== correctIndex
            ? `Correct answer: ${indexToLetter[correctIndex] ?? correct}`
            : undefined,
      };
    }

    const submitted = submittedAnswer.trim().toLowerCase();
    const correct = question.correct_answer.trim().toLowerCase();
    const is_correct = submitted === correct;

    return {
      is_correct,
      feedback: !is_correct ? `Correct answer: ${question.correct_answer}` : undefined,
    };
  }
}

// -----------------------------------------------------------------------------
// FACTORY
// -----------------------------------------------------------------------------

export function createQuestionService(supabase: SupabaseClient): QuestionService {
  return new QuestionService(supabase);
}

// -----------------------------------------------------------------------------
// PRESETS
// -----------------------------------------------------------------------------

export const HEAT_PRESETS = {
  // Standard: 50% generator, 30% static, 20% visual
  STANDARD: {
    total_questions: 20,
    static_ratio: 0.3,
    visual_ratio: 0.2,
    difficulty_distribution: { 1: 5, 2: 8, 3: 5, 4: 2 },
  },

  // Pure procedural (no MC at all)
  PURE_CALC: {
    total_questions: 20,
    static_ratio: 0,
    visual_ratio: 0,
    difficulty_distribution: { 1: 5, 2: 8, 3: 5, 4: 2 },
  },

  // Visual-heavy (great for geometry/graphing units)
  VISUAL_HEAVY: {
    total_questions: 15,
    static_ratio: 0.2,
    visual_ratio: 0.5,
    difficulty_distribution: { 1: 4, 2: 6, 3: 4, 4: 1 },
  },

  // Concept review (more MC)
  CONCEPT_REVIEW: {
    total_questions: 15,
    static_ratio: 0.5,
    visual_ratio: 0.2,
    difficulty_distribution: { 1: 6, 2: 6, 3: 3, 4: 0 },
  },

  // Championship (harder, balanced)
  CHAMPIONSHIP: {
    total_questions: 25,
    static_ratio: 0.2,
    visual_ratio: 0.2,
    difficulty_distribution: { 1: 4, 2: 8, 3: 8, 4: 5 },
  },

  // Quick practice (easy, mostly MC)
  QUICK_PRACTICE: {
    total_questions: 10,
    static_ratio: 0.4,
    visual_ratio: 0.3,
    difficulty_distribution: { 1: 5, 2: 4, 3: 1, 4: 0 },
  },
};
