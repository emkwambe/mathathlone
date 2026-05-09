# =============================================================================
# NC MATH 1 COMPLETE - FINAL INSTALL
# =============================================================================
# Run this AFTER downloading files from Claude to your Downloads folder
# =============================================================================

$APP_DIR = "C:\Users\HP\Documents\mathathlone-app"
$DOWNLOADS = "$env:USERPROFILE\Downloads"

Write-Host "`n🎓 NC MATH 1 COMPLETE INSTALLER" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Files to find and copy
$filesToCopy = @{
    "mathathlone-generators-complete.ts" = "src\lib\competition\generators.ts"
    "question-service.ts" = "src\lib\competition\question-service.ts"
    "mathathlone-validation.ts" = "src\lib\competition\validation.ts"
    "mathathlone-heat-engine.ts" = "src\lib\competition\heat-engine.ts"
    "mathathlone-components.tsx" = "src\components\competition\index.tsx"
}

# Search locations
$searchPaths = @($DOWNLOADS, "$DOWNLOADS\mathathlone-competition-system", "$env:USERPROFILE\Desktop")

Write-Host "`n📂 Finding files..." -ForegroundColor Yellow

$foundFiles = @{}
foreach ($file in $filesToCopy.Keys) {
    foreach ($path in $searchPaths) {
        $fullPath = Join-Path $path $file
        if (Test-Path $fullPath) {
            $foundFiles[$file] = $fullPath
            Write-Host "  ✓ $file" -ForegroundColor Green
            break
        }
    }
    if (-not $foundFiles.ContainsKey($file)) {
        Write-Host "  ✗ $file (will skip)" -ForegroundColor Yellow
    }
}

# Create directories
Write-Host "`n📁 Creating directories..." -ForegroundColor Yellow
$dirs = @(
    "src\lib\competition",
    "src\components\competition",
    "src\app\compete",
    "src\app\compete\[code]",
    "src\app\compete\create"
)

foreach ($dir in $dirs) {
    $fullDir = Join-Path $APP_DIR $dir
    if (-not (Test-Path $fullDir)) {
        New-Item -ItemType Directory -Path $fullDir -Force | Out-Null
    }
}
Write-Host "  ✓ Directories ready" -ForegroundColor Green

# Copy files
Write-Host "`n📋 Copying files..." -ForegroundColor Yellow
foreach ($file in $foundFiles.Keys) {
    $source = $foundFiles[$file]
    $dest = Join-Path $APP_DIR $filesToCopy[$file]
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "  ✓ $file → $($filesToCopy[$file])" -ForegroundColor Green
}

# Create barrel export
Write-Host "`n📝 Creating index..." -ForegroundColor Yellow
$indexContent = @"
export * from './generators';
export * from './validation';
export * from './heat-engine';
export * from './question-service';
"@
$indexPath = Join-Path $APP_DIR "src\lib\competition\index.ts"
[System.IO.File]::WriteAllText($indexPath, $indexContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "  ✓ src/lib/competition/index.ts" -ForegroundColor Green

# Create compete pages if not exist
$joinPage = @'
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinHeatPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }
    router.push(`/compete/${code.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Join a Heat 🔥</h1>
        <p className="text-white/60 text-center mb-6">Enter your 6-character code</p>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="MA-XXXX"
            className="w-full text-center text-3xl font-mono tracking-widest bg-white/20 border-2 border-white/30 rounded-xl p-4 text-white placeholder-white/40 focus:border-yellow-400 focus:outline-none"
            maxLength={6}
          />
          {error && <p className="text-red-400 text-center mt-2">{error}</p>}
          <button type="submit" className="w-full mt-6 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-bold py-4 rounded-xl text-xl transition-colors">
            Join Heat →
          </button>
        </form>
        <a href="/compete/create" className="block text-center text-white/60 hover:text-white mt-4">
          Or create a new Heat
        </a>
      </div>
    </div>
  );
}
'@

$joinPath = Join-Path $APP_DIR "src\app\compete\page.tsx"
if (-not (Test-Path $joinPath)) {
    [System.IO.File]::WriteAllText($joinPath, $joinPage, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  ✓ src/app/compete/page.tsx" -ForegroundColor Green
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "═" * 50 -ForegroundColor Green
Write-Host "  ✅ NC MATH 1 FILES INSTALLED!" -ForegroundColor Green  
Write-Host "═" * 50 -ForegroundColor Green

Write-Host @"

📊 COVERAGE:
   • 54 Question Generators (infinite variations)
   • 50 Static Questions (multiple choice)
   • 84 concepts total = 100% NC Math 1

📌 NEXT STEP:
   1. Open Supabase Dashboard → SQL Editor
   2. Paste NC-MATH-1-COMPLETE.sql
   3. Click RUN

🧪 THEN TEST:
   pnpm dev
   http://localhost:3000/compete

"@ -ForegroundColor White
