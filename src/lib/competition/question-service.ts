// =============================================================================
// MathAthlone Unified Question Service
// =============================================================================
// Handles both generator-based AND static (manual) questions
// Provides unified interface for Heat question delivery
// =============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { generateQuestion, GENERATORS, type GeneratedQuestion, type DifficultyLevel } from './generators';

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

export interface UnifiedQuestion {
  id: string;
  source_type: 'generator' | 'static';
  
  // Display
  question_number: number;
  question_text: string;
  question_latex?: string;
  question_image_url?: string;
  
  // For MC questions
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
  
  // Solution (shown after answering)
  solution_steps?: string[];
  explanation?: string;
}

export interface HeatQuestionConfig {
  total_questions: number;
  static_ratio: number;  // 0.0 to 1.0 (0 = all generators, 1 = all static)
  concept_ids?: string[];  // Limit to specific concepts
  difficulty_distribution?: {
    1: number;  // Bronze count
    2: number;  // Silver count
    3: number;  // Gold count
    4: number;  // Diamond count
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
  // FETCH STATIC QUESTIONS
  // ---------------------------------------------------------------------------
  
  /**
   * Load static questions from database
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
    
    return (data || []).map(q => ({
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
   * Get random static questions matching criteria
   */
  async getRandomStaticQuestions(
    count: number,
    difficulty?: DifficultyLevel,
    conceptIds?: string[]
  ): Promise<StaticQuestion[]> {
    const cacheKey = `${conceptIds?.join(',') || 'all'}-${difficulty || 'any'}`;
    
    // Check cache
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
    
    // Shuffle and take count
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  // ---------------------------------------------------------------------------
  // GENERATE MIXED QUESTION SET
  // ---------------------------------------------------------------------------
  
  /**
   * Generate questions for a Heat using both generators and static questions
   */
  async generateHeatQuestions(config: HeatQuestionConfig): Promise<UnifiedQuestion[]> {
    const {
      total_questions,
      static_ratio = 0.3,
      concept_ids,
      difficulty_distribution = { 1: 5, 2: 8, 3: 5, 4: 2 }
    } = config;
    
    const staticCount = Math.floor(total_questions * static_ratio);
    const generatorCount = total_questions - staticCount;
    
    const questions: UnifiedQuestion[] = [];
    let questionNumber = 1;
    
    // Build difficulty queue
    const difficultyQueue: DifficultyLevel[] = [];
    for (const [diff, count] of Object.entries(difficulty_distribution)) {
      for (let i = 0; i < count; i++) {
        difficultyQueue.push(Number(diff) as DifficultyLevel);
      }
    }
    // Shuffle for variety
    difficultyQueue.sort(() => Math.random() - 0.5);
    
    // ---------------------------------------------------------------------------
    // ADD STATIC QUESTIONS
    // ---------------------------------------------------------------------------
    
    if (staticCount > 0) {
      const staticQuestions = await this.getRandomStaticQuestions(
        staticCount,
        undefined,
        concept_ids
      );
      
      for (const sq of staticQuestions) {
        const difficulty = difficultyQueue.pop() || 2;
        
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
          time_limit_seconds: 45,  // MC questions are faster
          explanation: sq.explanation,
        });
      }
    }
    
    // ---------------------------------------------------------------------------
    // ADD GENERATOR QUESTIONS
    // ---------------------------------------------------------------------------
    
    if (generatorCount > 0) {
      const generatorTypes = Object.keys(GENERATORS);
      const usedGenerators = new Set<string>();
      
      for (let i = 0; i < generatorCount; i++) {
        const difficulty = difficultyQueue.pop() || 2;
        
        // Pick a generator (try to avoid repeats)
        let generatorType: string;
        let attempts = 0;
        do {
          generatorType = generatorTypes[Math.floor(Math.random() * generatorTypes.length)];
          attempts++;
        } while (usedGenerators.has(generatorType) && attempts < 20);
        
        usedGenerators.add(generatorType);
        
        // Generate the question
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
    
    // ---------------------------------------------------------------------------
    // SHUFFLE AND RENUMBER
    // ---------------------------------------------------------------------------
    
    // Shuffle questions
    questions.sort(() => Math.random() - 0.5);
    
    // Renumber
    questions.forEach((q, i) => {
      q.question_number = i + 1;
    });
    
    return questions;
  }
  
  // ---------------------------------------------------------------------------
  // VALIDATE ANSWER (unified)
  // ---------------------------------------------------------------------------
  
  /**
   * Validate an answer for any question type
   */
  validateAnswer(
    question: UnifiedQuestion,
    submittedAnswer: string
  ): { is_correct: boolean; feedback?: string } {
    
    if (question.is_multiple_choice) {
      // Multiple choice: check letter or index
      const submitted = submittedAnswer.toUpperCase().trim();
      const correct = question.correct_answer.toUpperCase().trim();
      
      // Handle both "B" and "1" style answers
      const letterToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const indexToLetter = ['A', 'B', 'C', 'D'];
      
      let submittedIndex: number;
      let correctIndex: number;
      
      if (submitted in letterToIndex) {
        submittedIndex = letterToIndex[submitted];
      } else {
        submittedIndex = parseInt(submitted, 10);
      }
      
      if (correct in letterToIndex) {
        correctIndex = letterToIndex[correct];
      } else {
        correctIndex = parseInt(correct, 10);
      }
      
      return {
        is_correct: submittedIndex === correctIndex,
        feedback: submittedIndex !== correctIndex 
          ? `Correct answer: ${indexToLetter[correctIndex]}` 
          : undefined
      };
    }
    
    // For generator questions, use existing validation
    // (import validateAnswer from validation.ts in real implementation)
    const submitted = submittedAnswer.trim().toLowerCase();
    const correct = question.correct_answer.trim().toLowerCase();
    
    // Basic comparison (real impl uses full validation)
    const is_correct = submitted === correct;
    
    return {
      is_correct,
      feedback: !is_correct ? `Correct answer: ${question.correct_answer}` : undefined
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
  // Standard competition: 70% generator, 30% static
  STANDARD: {
    total_questions: 20,
    static_ratio: 0.3,
    difficulty_distribution: { 1: 5, 2: 8, 3: 5, 4: 2 }
  },
  
  // Generator-only (pure calculation)
  PURE_CALC: {
    total_questions: 20,
    static_ratio: 0,
    difficulty_distribution: { 1: 5, 2: 8, 3: 5, 4: 2 }
  },
  
  // Concept review (more static/MC)
  CONCEPT_REVIEW: {
    total_questions: 15,
    static_ratio: 0.6,
    difficulty_distribution: { 1: 6, 2: 6, 3: 3, 4: 0 }
  },
  
  // Championship (harder, balanced)
  CHAMPIONSHIP: {
    total_questions: 25,
    static_ratio: 0.25,
    difficulty_distribution: { 1: 4, 2: 8, 3: 8, 4: 5 }
  },
  
  // Quick practice (easy, mostly MC)
  QUICK_PRACTICE: {
    total_questions: 10,
    static_ratio: 0.5,
    difficulty_distribution: { 1: 5, 2: 4, 3: 1, 4: 0 }
  }
};
