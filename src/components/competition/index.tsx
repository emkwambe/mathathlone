// =============================================================================
// MathAthlone Competition UI Components
// =============================================================================
// React components for real-time math competitions
// =============================================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { hintForAnswerType } from '@/lib/competition/generators';

// -----------------------------------------------------------------------------
// TYPES (shared with engine)
// -----------------------------------------------------------------------------

interface HeatQuestion {
  id: string;
  question_number: number;
  difficulty: 1 | 2 | 3 | 4;
  question_latex: string;
  question_text: string;
  correct_answer: string;
  answer_type: string;
  points_value: number;
  time_limit_seconds: number;
}

interface LeaderboardEntry {
  rank: number;
  athlete_id: string;
  display_name: string;
  total_points: number;
  cta_score: number;
  questions_answered: number;
  questions_correct: number;
}

interface CTAScoreComponents {
  content_score: number;
  time_score: number;
  accuracy_score: number;
  cta_score: number;
  points_earned: number;
}

// -----------------------------------------------------------------------------
// HEAT JOIN SCREEN
// -----------------------------------------------------------------------------

interface JoinHeatProps {
  onJoin: (code: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function JoinHeatScreen({ onJoin, isLoading, error }: JoinHeatProps) {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Handle code input (4 separate boxes for MA-XXXX)
  const handleCodeChange = (index: number, value: string) => {
    const char = value.toUpperCase().slice(-1);
    if (!/^[A-Z0-9]$/.test(char) && char !== '') return;
    
    const newCode = code.split('');
    newCode[index] = char;
    setCode(newCode.join(''));
    
    // Auto-focus next input
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4) {
      setLocalError('Please enter a complete 4-character code');
      return;
    }
    setLocalError('');
    await onJoin(`MA-${code}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏃‍♂️ MathAthlone
          </h1>
          <p className="text-indigo-200">Enter your Heat code to compete</p>
        </div>
        
        {/* Code Input */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl font-mono text-white/60">MA-</span>
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={code[i] || ''}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-16 text-center text-3xl font-mono font-bold 
                           bg-white/20 border-2 border-white/30 rounded-lg
                           text-white placeholder-white/30
                           focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50
                           transition-all"
                placeholder="•"
              />
            ))}
          </div>
          
          {/* Error Message */}
          {(error || localError) && (
            <div className="text-red-300 text-center mb-4 text-sm">
              {error || localError}
            </div>
          )}
          
          {/* Join Button */}
          <button
            type="submit"
            disabled={isLoading || code.length !== 4}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 
                       text-black font-bold text-lg rounded-lg
                       hover:from-yellow-300 hover:to-orange-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Joining...
              </span>
            ) : (
              'Join Heat 🔥'
            )}
          </button>
        </form>
        
        {/* Help Text */}
        <p className="text-center text-white/50 text-sm mt-6">
          Ask your teacher for the Heat code
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LOBBY SCREEN (Waiting for Heat to start)
// -----------------------------------------------------------------------------

interface LobbyProps {
  heatName: string;
  heatCode: string;
  participants: { id: string; display_name: string }[];
  isTeacher?: boolean;
  onStart?: () => void;
  onLeave?: () => void;
}

export function LobbyScreen({ 
  heatName, 
  heatCode, 
  participants, 
  isTeacher,
  onStart,
  onLeave 
}: LobbyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white mb-2">{heatName}</h1>
          <div className="inline-block bg-white/20 px-4 py-2 rounded-lg">
            <span className="text-white/60 text-sm">Code: </span>
            <span className="text-yellow-400 font-mono font-bold text-xl">{heatCode}</span>
          </div>
        </div>
        
        {/* Waiting Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white/80">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Waiting for Heat to start</span>
          </div>
        </div>
        
        {/* Participants Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h2 className="text-white/60 text-sm font-medium mb-4">
            MATHLETES ({participants.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className="bg-white/10 rounded-lg p-3 text-center animate-fadeIn"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 
                               rounded-full mx-auto mb-2 flex items-center justify-center
                               text-white font-bold">
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-sm truncate">{p.display_name}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Teacher Controls */}
        {isTeacher && onStart && (
          <div className="flex gap-4">
            <button
              onClick={onStart}
              className="flex-1 py-4 bg-gradient-to-r from-green-400 to-emerald-500 
                         text-white font-bold text-lg rounded-lg
                         hover:from-green-300 hover:to-emerald-400
                         transform hover:scale-[1.02] active:scale-[0.98]
                         transition-all shadow-lg"
            >
              Start Heat 🚀
            </button>
            <button
              onClick={onLeave}
              className="px-6 py-4 bg-white/10 text-white rounded-lg
                         hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// COUNTDOWN OVERLAY
// -----------------------------------------------------------------------------

interface CountdownProps {
  seconds: number;
  onComplete?: () => void;
}

export function CountdownOverlay({ seconds, onComplete }: CountdownProps) {
  const [count, setCount] = useState(seconds);
  
  useEffect(() => {
    if (count <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        <p className="text-white/60 text-xl mb-4">GET READY!</p>
        <div className="text-9xl font-bold text-yellow-400 animate-pulse">
          {count || 'GO!'}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// QUESTION DISPLAY
// -----------------------------------------------------------------------------

interface QuestionDisplayProps {
  question: HeatQuestion;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  timeRemaining,
  onSubmit,
  onSkip,
  disabled,
}: QuestionDisplayProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    setAnswer('');
  }, [question.id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || disabled) return;
    
    setIsSubmitting(true);
    await onSubmit(answer.trim());
    setIsSubmitting(false);
  };
  
  // Difficulty badge colors
  const difficultyColors = {
    1: 'bg-green-500',
    2: 'bg-yellow-500',
    3: 'bg-orange-500',
    4: 'bg-red-500',
  };
  
  const difficultyNames = {
    1: 'Bronze',
    2: 'Silver',
    3: 'Gold',
    4: 'Diamond',
  };
  
  // Time warning
  const timeWarning = timeRemaining <= 10;
  const timeCritical = timeRemaining <= 5;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Question Counter */}
        <div className="bg-white/10 px-4 py-2 rounded-lg">
          <span className="text-white/60">Q </span>
          <span className="text-white font-bold">{questionIndex + 1}</span>
          <span className="text-white/40"> / {totalQuestions}</span>
        </div>
        
        {/* Difficulty Badge */}
        <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${difficultyColors[question.difficulty]}`}>
          {difficultyNames[question.difficulty]}
        </div>
        
        {/* Timer */}
        <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg transition-colors
                        ${timeCritical ? 'bg-red-500 text-white animate-pulse' : 
                          timeWarning ? 'bg-yellow-500 text-black' : 
                          'bg-white/10 text-white'}`}>
          {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
        </div>
      </div>
      
      {/* Points */}
      <div className="text-center mb-4">
        <span className="text-yellow-400 font-bold">{question.points_value}</span>
        <span className="text-white/40"> pts</span>
      </div>
      
      {/* Question Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl max-w-2xl mx-auto">
        <p className="text-2xl text-slate-800 text-center leading-relaxed">
          {question.question_text}
        </p>
      </div>
      
      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="relative mb-2">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled || isSubmitting}
            placeholder="Enter your answer..."
            className="w-full px-6 py-4 text-xl text-center font-medium
                       bg-white/10 border-2 border-white/30 rounded-xl
                       text-white placeholder-white/30
                       focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50
                       disabled:opacity-50 transition-all"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {/* Format hint: shared lookup from ANSWER_TYPE_HINTS in generators.ts.
            Positioned BELOW the input and ABOVE the submit button so students
            see the expected format before they start typing. Empty hints
            (MC / multiple_choice / text / unknown) render nothing. */}
        {(() => {
          const hint = hintForAnswerType(question.answer_type);
          if (!hint) return null;
          return (
            <p className="text-xs italic text-white/50 mt-1 mb-3 text-center">
              📝 Format: {hint}
            </p>
          );
        })()}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!answer.trim() || disabled || isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-green-400 to-emerald-500
                       text-white font-bold text-lg rounded-xl
                       hover:from-green-300 hover:to-emerald-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all shadow-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit ✓'}
          </button>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={disabled}
              className="px-6 py-4 bg-white/10 text-white/60 rounded-xl
                         hover:bg-white/20 hover:text-white
                         disabled:opacity-50 transition-all"
            >
              Skip →
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ANSWER FEEDBACK
// -----------------------------------------------------------------------------

interface FeedbackOverlayProps {
  isCorrect: boolean;
  scoring: CTAScoreComponents;
  correctAnswer?: string;
  onContinue: () => void;
}

export function FeedbackOverlay({ 
  isCorrect, 
  scoring, 
  correctAnswer,
  onContinue 
}: FeedbackOverlayProps) {
  useEffect(() => {
    // Auto-continue after delay
    const timer = setTimeout(onContinue, isCorrect ? 1500 : 2500);
    return () => clearTimeout(timer);
  }, [isCorrect, onContinue]);
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 transition-colors
                  ${isCorrect ? 'bg-green-500/90' : 'bg-red-500/90'}`}
      onClick={onContinue}
    >
      <div className="text-center text-white">
        {/* Result Icon */}
        <div className="text-8xl mb-4 animate-bounce">
          {isCorrect ? '✓' : '✗'}
        </div>
        
        {/* Points Earned */}
        {isCorrect && (
          <div className="mb-4">
            <span className="text-5xl font-bold">+{scoring.points_earned}</span>
            <span className="text-xl ml-2">pts</span>
          </div>
        )}
        
        {/* CTA Score Breakdown (for correct answers) */}
        {isCorrect && (
          <div className="flex justify-center gap-6 text-sm opacity-80">
            <div>
              <div className="font-bold">{scoring.content_score}</div>
              <div>Content</div>
            </div>
            <div>
              <div className="font-bold">{scoring.time_score}</div>
              <div>Time</div>
            </div>
            <div>
              <div className="font-bold">{scoring.accuracy_score}</div>
              <div>Accuracy</div>
            </div>
          </div>
        )}
        
        {/* Correct Answer (for wrong answers) */}
        {!isCorrect && correctAnswer && (
          <div className="mt-4">
            <p className="text-white/60 mb-1">Correct answer:</p>
            <p className="text-2xl font-bold">{correctAnswer}</p>
          </div>
        )}
        
        <p className="text-white/60 mt-6 text-sm">Tap to continue</p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LIVE LEADERBOARD
// -----------------------------------------------------------------------------

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  compact?: boolean;
}

export function Leaderboard({ entries, currentUserId, compact }: LeaderboardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-black';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-black';
    return 'bg-white/10 text-white';
  };
  
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };
  
  if (compact) {
    // Mini leaderboard for during competition
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3">
        <h3 className="text-white/60 text-xs font-medium mb-2">LEADERBOARD</h3>
        <div className="space-y-1">
          {entries.slice(0, 5).map((entry) => (
            <div
              key={entry.athlete_id}
              className={`flex items-center gap-2 px-2 py-1 rounded text-sm
                         ${entry.athlete_id === currentUserId ? 'bg-yellow-400/20' : ''}`}
            >
              <span className="w-5 text-center">{getRankEmoji(entry.rank)}</span>
              <span className="flex-1 truncate text-white">{entry.display_name}</span>
              <span className="text-yellow-400 font-bold">{entry.total_points}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Full leaderboard
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <h2 className="text-white/60 text-sm font-medium mb-4">LEADERBOARD</h2>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.athlete_id}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all
                       ${getRankStyle(entry.rank)}
                       ${entry.athlete_id === currentUserId ? 'ring-2 ring-yellow-400' : ''}`}
          >
            {/* Rank */}
            <div className="w-10 h-10 flex items-center justify-center text-2xl">
              {getRankEmoji(entry.rank)}
            </div>
            
            {/* Name & Stats */}
            <div className="flex-1">
              <p className="font-bold">{entry.display_name}</p>
              <p className="text-xs opacity-70">
                {entry.questions_correct}/{entry.questions_answered} correct
              </p>
            </div>
            
            {/* Points */}
            <div className="text-right">
              <p className="text-2xl font-bold">{entry.total_points}</p>
              <p className="text-xs opacity-70">CTA: {entry.cta_score}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// RESULTS SCREEN
// -----------------------------------------------------------------------------

interface ResultsProps {
  rank: number;
  totalParticipants: number;
  totalPoints: number;
  questionsCorrect: number;
  questionsTotal: number;
  ctaScore: number;
  medal?: 'gold' | 'silver' | 'bronze';
  leaderboard: LeaderboardEntry[];
  onPlayAgain?: () => void;
  onExit?: () => void;
}

export function ResultsScreen({
  rank,
  totalParticipants,
  totalPoints,
  questionsCorrect,
  questionsTotal,
  ctaScore,
  medal,
  leaderboard,
  onPlayAgain,
  onExit,
}: ResultsProps) {
  const medalEmoji = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Medal/Rank Display */}
        <div className="text-center mb-8">
          {medalEmoji && (
            <div className="text-8xl mb-4 animate-bounce">{medalEmoji}</div>
          )}
          <h1 className="text-4xl font-bold text-white mb-2">
            {rank === 1 ? '🎉 CHAMPION!' : 
             rank <= 3 ? '🌟 Podium Finish!' :
             rank <= 10 ? '💪 Top 10!' :
             'Great Effort!'}
          </h1>
          <p className="text-indigo-200">
            You finished <span className="font-bold text-yellow-400">#{rank}</span> out of {totalParticipants}
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{totalPoints}</p>
            <p className="text-white/60 text-sm">Points</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{questionsCorrect}/{questionsTotal}</p>
            <p className="text-white/60 text-sm">Correct</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{ctaScore}</p>
            <p className="text-white/60 text-sm">CTA Score</p>
          </div>
        </div>
        
        {/* Leaderboard */}
        <Leaderboard entries={leaderboard.slice(0, 10)} />
        
        {/* Actions */}
        <div className="flex gap-4 mt-8">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-4 bg-gradient-to-r from-green-400 to-emerald-500 
                         text-white font-bold text-lg rounded-xl
                         hover:from-green-300 hover:to-emerald-400
                         transition-all shadow-lg"
            >
              Play Again 🔄
            </button>
          )}
          <button
            onClick={onExit}
            className="flex-1 py-4 bg-white/10 text-white font-bold text-lg rounded-xl
                       hover:bg-white/20 transition-all"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TEACHER: HEAT CREATION FORM
// -----------------------------------------------------------------------------

interface CreateHeatFormProps {
  onSubmit: (data: {
    name: string;
    heat_type: 'sprint' | 'target' | 'practice' | 'championship';
    question_count: number;
    time_limit_minutes: number;
    topic_id?: string;
  }) => Promise<void>;
  topics?: { id: string; name: string }[];
  isLoading?: boolean;
}

export function CreateHeatForm({ onSubmit, topics, isLoading }: CreateHeatFormProps) {
  const [name, setName] = useState('');
  const [heatType, setHeatType] = useState<'sprint' | 'target' | 'practice' | 'championship'>('sprint');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(15);
  const [topicId, setTopicId] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: name || `${heatType.charAt(0).toUpperCase() + heatType.slice(1)} Heat`,
      heat_type: heatType,
      question_count: questionCount,
      time_limit_minutes: timeLimit,
      topic_id: topicId || undefined,
    });
  };
  
  const heatTypeOptions = [
    { value: 'sprint', label: '⚡ Sprint', desc: '15 min, 20 questions', questions: 20, time: 15 },
    { value: 'target', label: '🎯 Target', desc: '20 min, 10 deep questions', questions: 10, time: 20 },
    { value: 'practice', label: '📚 Practice', desc: 'Relaxed pace, easier questions', questions: 15, time: 20 },
    { value: 'championship', label: '🏆 Championship', desc: '25 min, 25 challenging questions', questions: 25, time: 25 },
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Heat Name */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Heat Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Monday Quiz - Equations"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg
                     text-white placeholder-white/40
                     focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
        />
      </div>
      
      {/* Heat Type Selection */}
      <div>
        <label className="block text-white/60 text-sm mb-2">Heat Type</label>
        <div className="grid grid-cols-2 gap-3">
          {heatTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setHeatType(option.value as any);
                setQuestionCount(option.questions);
                setTimeLimit(option.time);
              }}
              className={`p-4 rounded-xl text-left transition-all
                         ${heatType === option.value 
                           ? 'bg-yellow-400/20 border-2 border-yellow-400' 
                           : 'bg-white/10 border-2 border-transparent hover:bg-white/20'}`}
            >
              <p className="text-white font-bold">{option.label}</p>
              <p className="text-white/60 text-sm">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Topic Selection */}
      {topics && topics.length > 0 && (
        <div>
          <label className="block text-white/60 text-sm mb-2">Topic Focus (optional)</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg
                       text-white appearance-none cursor-pointer
                       focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            <option value="">All Topics (Mixed)</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 
                   text-black font-bold text-lg rounded-xl
                   hover:from-yellow-300 hover:to-orange-400
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all shadow-lg"
      >
        {isLoading ? 'Creating...' : 'Create Heat 🔥'}
      </button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// CSS ANIMATIONS (add to globals.css)
// -----------------------------------------------------------------------------

/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
*/
