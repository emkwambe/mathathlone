# =============================================================================
# MathAthlone Competition System - AUTO INSTALLER
# =============================================================================
# Automatically finds and copies files from Downloads folder
# =============================================================================

$APP_DIR = "C:\Users\HP\Documents\mathathlone-app"
$DOWNLOADS = "$env:USERPROFILE\Downloads"

Write-Host "`n🚀 MathAthlone Competition System Installer" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# STEP 1: Find the files
# -----------------------------------------------------------------------------
Write-Host "`n📂 Looking for files..." -ForegroundColor Yellow

# Check for extracted folder or individual files
$sourceLocations = @(
    "$DOWNLOADS",
    "$DOWNLOADS\mathathlone-competition-system",
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Desktop\mathathlone-competition-system"
)

$filesToCopy = @{
    "mathathlone-generators.ts" = "src\lib\competition\generators.ts"
    "mathathlone-validation.ts" = "src\lib\competition\validation.ts"
    "mathathlone-heat-engine.ts" = "src\lib\competition\heat-engine.ts"
    "mathathlone-components.tsx" = "src\components\competition\index.tsx"
    "mathathlone-league-schema.sql" = "supabase\migrations\002_league_system.sql"
}

$foundFiles = @{}

foreach ($file in $filesToCopy.Keys) {
    foreach ($location in $sourceLocations) {
        $fullPath = Join-Path $location $file
        if (Test-Path $fullPath) {
            $foundFiles[$file] = $fullPath
            Write-Host "  ✓ Found: $file" -ForegroundColor Green
            break
        }
    }
    if (-not $foundFiles.ContainsKey($file)) {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

if ($foundFiles.Count -eq 0) {
    Write-Host "`n❌ No files found! Please:" -ForegroundColor Red
    Write-Host "   1. Download mathathlone-competition-system.zip from Claude" -ForegroundColor White
    Write-Host "   2. Extract it to Downloads folder" -ForegroundColor White
    Write-Host "   3. Run this script again" -ForegroundColor White
    exit 1
}

# -----------------------------------------------------------------------------
# STEP 2: Create directories
# -----------------------------------------------------------------------------
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow

Set-Location $APP_DIR

$dirs = @(
    "src\lib\competition",
    "src\components\competition",
    "src\app\compete",
    "src\app\compete\[code]",
    "src\app\compete\create",
    "supabase\migrations"
)

foreach ($dir in $dirs) {
    $fullDir = Join-Path $APP_DIR $dir
    if (-not (Test-Path $fullDir)) {
        New-Item -ItemType Directory -Path $fullDir -Force | Out-Null
    }
}
Write-Host "  ✓ Directories ready" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 3: Copy files
# -----------------------------------------------------------------------------
Write-Host "`n📋 Copying files..." -ForegroundColor Yellow

foreach ($file in $foundFiles.Keys) {
    $source = $foundFiles[$file]
    $dest = Join-Path $APP_DIR $filesToCopy[$file]
    
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "  ✓ $file → $($filesToCopy[$file])" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# STEP 4: Create barrel export
# -----------------------------------------------------------------------------
Write-Host "`n📝 Creating index files..." -ForegroundColor Yellow

$indexContent = @"
// Competition System Exports
export * from './generators';
export * from './validation';
export * from './heat-engine';
"@

$indexPath = Join-Path $APP_DIR "src\lib\competition\index.ts"
[System.IO.File]::WriteAllText($indexPath, $indexContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "  ✓ Created src/lib/competition/index.ts" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 5: Create competition pages
# -----------------------------------------------------------------------------
Write-Host "`n📝 Creating pages..." -ForegroundColor Yellow

# Join page
$joinPage = @'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JoinHeatScreen } from '@/components/competition';
import { createClient } from '@/lib/supabase/client';
import { createHeatEngine } from '@/lib/competition/heat-engine';

export default function JoinHeatPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const engine = createHeatEngine(supabase);
      await engine.joinHeat(code);
      router.push(`/compete/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join Heat');
    } finally {
      setIsLoading(false);
    }
  };

  return <JoinHeatScreen onJoin={handleJoin} isLoading={isLoading} error={error} />;
}
'@

$joinPagePath = Join-Path $APP_DIR "src\app\compete\page.tsx"
[System.IO.File]::WriteAllText($joinPagePath, $joinPage, [System.Text.UTF8Encoding]::new($false))
Write-Host "  ✓ Created src/app/compete/page.tsx" -ForegroundColor Green

# Competition page
$competePage = @'
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
'@

$competePagePath = Join-Path $APP_DIR "src\app\compete\[code]\page.tsx"
[System.IO.File]::WriteAllText($competePagePath, $competePage, [System.Text.UTF8Encoding]::new($false))
Write-Host "  ✓ Created src/app/compete/[code]/page.tsx" -ForegroundColor Green

# Create page
$createPage = @'
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateHeatForm } from '@/components/competition';
import { createClient } from '@/lib/supabase/client';
import { createHeatEngine } from '@/lib/competition/heat-engine';
import { GENERATORS } from '@/lib/competition/generators';

export default function CreateHeatPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const engine = createHeatEngine(supabase);
      const generatorTypes = Object.keys(GENERATORS);
      const config = Array.from({ length: data.question_count }, (_, i) => ({
        generator_type: generatorTypes[i % generatorTypes.length],
        difficulty: (i < 5 ? 1 : i < 13 ? 2 : i < 18 ? 3 : 4) as 1 | 2 | 3 | 4
      }));
      const heat = await engine.createHeat({ ...data, generators: config });
      await engine.openLobby(heat.id);
      router.push(`/compete/${heat.code}`);
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Create a Heat 🔥</h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <CreateHeatForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
'@

$createPagePath = Join-Path $APP_DIR "src\app\compete\create\page.tsx"
[System.IO.File]::WriteAllText($createPagePath, $createPage, [System.Text.UTF8Encoding]::new($false))
Write-Host "  ✓ Created src/app/compete/create/page.tsx" -ForegroundColor Green

# -----------------------------------------------------------------------------
# DONE!
# -----------------------------------------------------------------------------
Write-Host "`n" -NoNewline
Write-Host "═" * 50 -ForegroundColor Green
Write-Host "  ✅ INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "═" * 50 -ForegroundColor Green

Write-Host @"

  Files copied: $($foundFiles.Count)/5
  
  📌 NEXT: Run the SQL migration in Supabase Dashboard
     File: supabase/migrations/002_league_system.sql
  
  🧪 TEST:
     pnpm dev
     http://localhost:3000/compete

"@ -ForegroundColor White
