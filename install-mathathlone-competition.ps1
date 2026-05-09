# =============================================================================
# MathAthlone Competition System - Installation Script
# =============================================================================
# Run this in PowerShell from your mathathlone-app directory
# =============================================================================

# -----------------------------------------------------------------------------
# STEP 0: Set your app directory
# -----------------------------------------------------------------------------
$APP_DIR = "C:\Users\HP\Documents\mathathlone-app"
Set-Location $APP_DIR

# Verify we're in the right place
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Not in mathathlone-app directory!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ In mathathlone-app directory" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 1: Create directory structure
# -----------------------------------------------------------------------------
Write-Host "`n📁 Creating directory structure..." -ForegroundColor Cyan

$dirs = @(
    "src/lib/competition",
    "src/components/competition",
    "src/app/compete",
    "src/app/compete/[code]",
    "src/app/compete/[code]/results",
    "src/app/compete/create",
    "supabase/migrations"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    }
}
Write-Host "✓ Directories ready" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 2: Download files from Claude outputs
# -----------------------------------------------------------------------------
Write-Host "`n📥 Copy these files from Claude's outputs:" -ForegroundColor Cyan
Write-Host @"

  FROM CLAUDE OUTPUTS:                    TO YOUR APP:
  ─────────────────────────────────────────────────────────────────
  mathathlone-generators.ts           →  src/lib/competition/generators.ts
  mathathlone-validation.ts           →  src/lib/competition/validation.ts
  mathathlone-heat-engine.ts          →  src/lib/competition/heat-engine.ts
  mathathlone-league-schema.sql       →  supabase/migrations/002_league_system.sql
  mathathlone-components.tsx          →  src/components/competition/index.tsx

"@ -ForegroundColor Yellow

Write-Host "Press Enter after copying files..." -ForegroundColor Magenta
Read-Host

# -----------------------------------------------------------------------------
# STEP 3: Create barrel export for competition lib
# -----------------------------------------------------------------------------
Write-Host "`n📝 Creating barrel exports..." -ForegroundColor Cyan

$indexContent = @"
// Competition System Exports
export * from './generators';
export * from './validation';
export * from './heat-engine';
"@

[System.IO.File]::WriteAllText(
    "$APP_DIR\src\lib\competition\index.ts",
    $indexContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "✓ Created src/lib/competition/index.ts" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 4: Create competition pages
# -----------------------------------------------------------------------------
Write-Host "`n📝 Creating competition pages..." -ForegroundColor Cyan

# Join page (compete/page.tsx)
$joinPageContent = @"
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
      const participation = await engine.joinHeat(code);
      
      // Navigate to competition
      router.push(\`/compete/\${code.toUpperCase()}\`);
    } catch (err: any) {
      setError(err.message || 'Failed to join Heat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <JoinHeatScreen 
      onJoin={handleJoin}
      isLoading={isLoading}
      error={error}
    />
  );
}
"@

[System.IO.File]::WriteAllText(
    "$APP_DIR\src\app\compete\page.tsx",
    $joinPageContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "✓ Created src/app/compete/page.tsx" -ForegroundColor Green

# Competition page placeholder
$competitionPageContent = @"
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createHeatEngine, type HeatEngine } from '@/lib/competition/heat-engine';
import { 
  LobbyScreen, 
  CountdownOverlay, 
  QuestionDisplay, 
  FeedbackOverlay,
  Leaderboard 
} from '@/components/competition';

export default function CompetitionPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [engine, setEngine] = useState<HeatEngine | null>(null);
  const [status, setStatus] = useState<'loading' | 'lobby' | 'countdown' | 'active' | 'finished'>('loading');
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const initEngine = async () => {
      const supabase = createClient();
      const heatEngine = createHeatEngine(supabase);
      
      // Set up event listeners
      heatEngine.on('heat:status_changed', ({ status }) => {
        setStatus(status as any);
      });
      
      heatEngine.on('heat:participant_joined', ({ participant }) => {
        setParticipants(prev => [...prev, participant]);
      });
      
      heatEngine.on('heat:leaderboard_updated', ({ leaderboard }) => {
        setLeaderboard(leaderboard);
      });
      
      heatEngine.on('heat:question_started', ({ question }) => {
        setCurrentQuestion(question);
        setTimeRemaining(question.time_limit_seconds);
      });
      
      // Join the heat
      try {
        await heatEngine.joinHeat(code);
        setEngine(heatEngine);
        
        const heat = heatEngine.getCurrentHeat();
        setStatus(heat?.status as any || 'lobby');
      } catch (err) {
        console.error('Failed to join:', err);
      }
    };
    
    initEngine();
    
    return () => {
      engine?.disconnect();
    };
  }, [code]);

  // Timer countdown
  useEffect(() => {
    if (status !== 'active' || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(t => Math.max(0, t - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status, timeRemaining]);

  const handleSubmit = async (answer: string) => {
    if (!engine || !currentQuestion) return;
    
    const startTime = Date.now() - ((currentQuestion.time_limit_seconds - timeRemaining) * 1000);
    const timeTaken = Date.now() - startTime;
    
    const result = await engine.submitAnswer(
      currentQuestion.id,
      answer,
      timeTaken
    );
    
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

  // Render based on status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'lobby') {
    return (
      <LobbyScreen
        heatName={engine?.getCurrentHeat()?.name || 'Heat'}
        heatCode={code}
        participants={participants}
      />
    );
  }

  if (status === 'countdown') {
    return <CountdownOverlay seconds={5} onComplete={() => setStatus('active')} />;
  }

  if (status === 'active' && currentQuestion) {
    return (
      <>
        <QuestionDisplay
          question={currentQuestion}
          questionIndex={currentQuestion.question_number - 1}
          totalQuestions={engine?.getQuestions().length || 0}
          timeRemaining={timeRemaining}
          onSubmit={handleSubmit}
          disabled={!!feedback}
        />
        
        {feedback && (
          <FeedbackOverlay
            isCorrect={feedback.isCorrect}
            scoring={feedback.scoring}
            correctAnswer={feedback.correctAnswer}
            onContinue={handleContinue}
          />
        )}
      </>
    );
  }

  if (status === 'finished') {
    const participation = engine?.getCurrentParticipation();
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Heat Complete!</h1>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 rounded-xl p-6 mb-6 text-center">
            <p className="text-4xl font-bold text-yellow-400">{participation?.total_points || 0}</p>
            <p className="text-white/60">Total Points</p>
          </div>
          <Leaderboard entries={leaderboard} currentUserId={participation?.athlete_id} />
        </div>
      </div>
    );
  }

  return null;
}
"@

[System.IO.File]::WriteAllText(
    "$APP_DIR\src\app\compete\[code]\page.tsx",
    $competitionPageContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "✓ Created src/app/compete/[code]/page.tsx" -ForegroundColor Green

# Teacher create page
$createPageContent = @"
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
      
      // Generate question config based on heat type
      const generatorTypes = Object.keys(GENERATORS);
      const config = [];
      
      for (let i = 0; i < data.question_count; i++) {
        const difficulty = i < 5 ? 1 : i < 13 ? 2 : i < 18 ? 3 : 4;
        const generatorType = generatorTypes[i % generatorTypes.length];
        config.push({ generator_type: generatorType, difficulty });
      }
      
      const heat = await engine.createHeat({
        ...data,
        generators: config,
      });
      
      await engine.openLobby(heat.id);
      
      // Navigate to lobby view
      router.push(\`/compete/\${heat.code}\`);
    } catch (err) {
      console.error('Failed to create heat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Create a Heat 🔥
        </h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <CreateHeatForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
"@

[System.IO.File]::WriteAllText(
    "$APP_DIR\src\app\compete\create\page.tsx",
    $createPageContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "✓ Created src/app/compete/create/page.tsx" -ForegroundColor Green

# -----------------------------------------------------------------------------
# STEP 5: Add CSS animations to globals.css
# -----------------------------------------------------------------------------
Write-Host "`n📝 Adding CSS animations..." -ForegroundColor Cyan

$cssAdditions = @"

/* MathAthlone Competition Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
"@

$globalsPath = "$APP_DIR\src\app\globals.css"
if (Test-Path $globalsPath) {
    $existingCss = Get-Content $globalsPath -Raw
    if (-not $existingCss.Contains("MathAthlone Competition")) {
        Add-Content -Path $globalsPath -Value $cssAdditions
        Write-Host "✓ Added animations to globals.css" -ForegroundColor Green
    } else {
        Write-Host "✓ Animations already in globals.css" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# STEP 6: Display SQL migration instructions
# -----------------------------------------------------------------------------
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DATABASE MIGRATION REQUIRED" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host @"

  1. Open Supabase Dashboard → SQL Editor
  
  2. Run the contents of:
     supabase/migrations/002_league_system.sql
  
  3. Or use Supabase CLI:
     npx supabase db push

"@ -ForegroundColor White

# -----------------------------------------------------------------------------
# STEP 7: Summary
# -----------------------------------------------------------------------------
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  INSTALLATION COMPLETE ✓" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host @"

  Files created:
  ─────────────────────────────────────────────────────────────────
  src/lib/competition/index.ts          (barrel export)
  src/app/compete/page.tsx              (join screen)
  src/app/compete/[code]/page.tsx       (competition)
  src/app/compete/create/page.tsx       (teacher create)

  Files you need to copy from Claude outputs:
  ─────────────────────────────────────────────────────────────────
  src/lib/competition/generators.ts
  src/lib/competition/validation.ts
  src/lib/competition/heat-engine.ts
  src/components/competition/index.tsx
  supabase/migrations/002_league_system.sql

  Next steps:
  ─────────────────────────────────────────────────────────────────
  1. Copy the 5 files listed above
  2. Run database migration in Supabase
  3. Start dev server: pnpm dev
  4. Test: http://localhost:3000/compete

"@ -ForegroundColor White

Write-Host "Ready to compete! 🏆" -ForegroundColor Green
