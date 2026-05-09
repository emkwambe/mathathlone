'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createHeatEngine } from '@/lib/competition/heat-engine';
import { LobbyScreen, CountdownOverlay, QuestionDisplay, FeedbackOverlay, Leaderboard } from '@/components/competition';

export default function CompetitionPage() {
  const params = useParams();
  const code = params.code as string;
  const [status, setStatus] = useState<string>('loading');
  const [engine, setEngine] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const heatEngine = createHeatEngine(supabase);
      
      heatEngine.on('heat:status_changed', ({ status }: any) => setStatus(status));
      heatEngine.on('heat:participant_joined', ({ participant }: any) => {
        setParticipants(prev => [...prev, participant]);
      });
      heatEngine.on('heat:leaderboard_updated', ({ leaderboard }: any) => setLeaderboard(leaderboard));
      heatEngine.on('heat:question_started', ({ question }: any) => {
        setCurrentQuestion(question);
        setTimeRemaining(question.time_limit_seconds);
      });
      
      try {
        await heatEngine.joinHeat(code);
        setEngine(heatEngine);
        setStatus(heatEngine.getCurrentHeat()?.status || 'lobby');
      } catch (err) {
        console.error('Failed to join:', err);
      }
    };
    init();
  }, [code]);

  useEffect(() => {
    if (status !== 'active' || timeRemaining <= 0) return;
    const timer = setInterval(() => setTimeRemaining(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [status, timeRemaining]);

  const handleSubmit = async (answer: string) => {
    if (!engine || !currentQuestion) return;
    const timeTaken = (currentQuestion.time_limit_seconds - timeRemaining) * 1000;
    const result = await engine.submitAnswer(currentQuestion.id, answer, timeTaken);
    setFeedback({
      isCorrect: result.validation.is_correct,
      scoring: result.scoring,
      correctAnswer: result.validation.is_correct ? undefined : currentQuestion.correct_answer,
    });
  };

  const handleContinue = () => {
    setFeedback(null);
    const nextQ = engine?.getCurrentQuestion();
    if (nextQ) {
      setCurrentQuestion(nextQ);
      setTimeRemaining(nextQ.time_limit_seconds);
    } else {
      setStatus('finished');
    }
  };

  if (status === 'loading') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  if (status === 'lobby') return <LobbyScreen heatName={engine?.getCurrentHeat()?.name || 'Heat'} heatCode={code} participants={participants} />;
  if (status === 'countdown') return <CountdownOverlay seconds={5} onComplete={() => setStatus('active')} />;
  if (status === 'active' && currentQuestion) return (
    <>
      <QuestionDisplay question={currentQuestion} questionIndex={currentQuestion.question_number - 1} totalQuestions={engine?.getQuestions().length || 0} timeRemaining={timeRemaining} onSubmit={handleSubmit} disabled={!!feedback} />
      {feedback && <FeedbackOverlay isCorrect={feedback.isCorrect} scoring={feedback.scoring} correctAnswer={feedback.correctAnswer} onContinue={handleContinue} />}
    </>
  );
  if (status === 'finished') {
    const p = engine?.getCurrentParticipation();
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Heat Complete!</h1>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 rounded-xl p-6 mb-6 text-center">
            <p className="text-4xl font-bold text-yellow-400">{p?.total_points || 0}</p>
            <p className="text-white/60">Total Points</p>
          </div>
          <Leaderboard entries={leaderboard} currentUserId={p?.athlete_id} />
        </div>
      </div>
    );
  }
  return null;
}