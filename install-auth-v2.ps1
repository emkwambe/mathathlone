# =============================================================================
# MathAthlone — Auth v2 Installer
# =============================================================================
# This script installs the auth v2 overhaul:
#   1. Validates all expected files are in Downloads
#   2. Backs up existing files (timestamped, recoverable)
#   3. Installs new files into the right locations
#   4. Reports remaining createClient() / createSupabaseBrowser() calls
#   5. Optionally clears .next cache
#   6. Reminds you about the SQL migrations + Supabase hook config
#
# Run from project root:
#   cd C:\Users\HP\Documents\mathathlone-app
#   .\install-auth-v2.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$REPO = "C:\Users\HP\Documents\mathathlone-app"
$DOWNLOADS = "$env:USERPROFILE\Downloads"
$TIMESTAMP = Get-Date -Format 'yyyyMMdd-HHmmss'
$BACKUP = "$REPO\.backup\auth-v2-$TIMESTAMP"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MathAthlone Auth v2 Installer" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 0. Verify we're in the right directory
# -----------------------------------------------------------------------------
if (-not (Test-Path "$REPO\package.json")) {
    Write-Host "[FATAL] Not a MathAthlone repo: $REPO" -ForegroundColor Red
    Write-Host "        Make sure you cd'd to the project root first." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Project root: $REPO" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 1. Locate downloaded files
# -----------------------------------------------------------------------------

# File mappings: download name → repo path
$fileMap = @{
    "client.ts"            = "src\lib\supabase\client.ts"
    "server.ts"            = "src\lib\supabase\server.ts"
    "middleware-helper.ts" = "src\lib\supabase\middleware.ts"
    "middleware.ts"        = "src\middleware.ts"
    "AuthContext.tsx"      = "src\contexts\AuthContext.tsx"
    "layout.tsx"           = "src\app\layout.tsx"
    "login_page.tsx"       = "src\app\auth\login\page.tsx"
    "whoami-route.ts"      = "src\app\api\debug\whoami\route.ts"
}

$sqlFiles = @(
    "006_auth_v2_schema.sql",
    "007_auth_v2_rls.sql",
    "008_auth_v2_seed.sql"
)

Write-Host ""
Write-Host "[SCAN] Looking for files in $DOWNLOADS" -ForegroundColor Yellow
Write-Host ""

$allFiles = @($fileMap.Keys) + $sqlFiles
$missing = @()
foreach ($file in $allFiles) {
    $src = Join-Path $DOWNLOADS $file
    if (Test-Path $src) {
        $size = (Get-Item $src).Length
        Write-Host ("  [FOUND] {0,-24} ({1,5} bytes)" -f $file, $size) -ForegroundColor Green
    } else {
        Write-Host ("  [MISSING] {0}" -f $file) -ForegroundColor Red
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "Missing files. Download them from Claude into:" -ForegroundColor Red
    Write-Host "  $DOWNLOADS" -ForegroundColor Red
    Write-Host ""
    foreach ($f in $missing) { Write-Host "  - $f" -ForegroundColor Red }
    exit 1
}

# -----------------------------------------------------------------------------
# 2. Backup existing files (everything we're about to touch)
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[BACKUP] Saving existing files to $BACKUP" -ForegroundColor Yellow

New-Item -ItemType Directory -Path $BACKUP -Force | Out-Null

# Files we're replacing
foreach ($srcName in $fileMap.Keys) {
    $existing = Join-Path $REPO $fileMap[$srcName]
    if (Test-Path $existing) {
        $backupPath = Join-Path $BACKUP $fileMap[$srcName]
        $backupDir = Split-Path $backupPath -Parent
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item $existing $backupPath -Force
        Write-Host "  [SAVED] $($fileMap[$srcName])" -ForegroundColor Green
    }
}

# Other files that might reference old auth APIs (back up to be safe)
$auxBackupTargets = @(
    "src\app\compete\page.tsx",
    "src\app\compete\create\page.tsx",
    "src\app\compete\[code]\page.tsx",
    "src\app\auth\register\page.tsx",
    "src\components\dev\DevAccountSwitcher.tsx",
    "src\components\competition\attestation.tsx",
    "src\lib\competition\focus-mode.ts"
)

foreach ($target in $auxBackupTargets) {
    $existing = Join-Path $REPO $target
    if (Test-Path $existing) {
        $backupPath = Join-Path $BACKUP $target
        $backupDir = Split-Path $backupPath -Parent
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item $existing $backupPath -Force
        Write-Host "  [SAVED] $target (aux)" -ForegroundColor DarkGreen
    }
}

# -----------------------------------------------------------------------------
# 3. Create destination directories
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[DIRS] Creating destination directories..." -ForegroundColor Yellow

$dirs = @(
    "src\contexts",
    "src\lib\supabase",
    "src\app\auth\login",
    "src\app\api\debug\whoami",
    "supabase\migrations"
)

foreach ($dir in $dirs) {
    $path = Join-Path $REPO $dir
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "  [CREATED] $dir" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# 4. Install code files (UTF-8 without BOM)
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[INSTALL] Copying code files..." -ForegroundColor Yellow

foreach ($srcName in $fileMap.Keys) {
    $src = Join-Path $DOWNLOADS $srcName
    $dest = Join-Path $REPO $fileMap[$srcName]
    $content = [System.IO.File]::ReadAllText($src)
    [System.IO.File]::WriteAllText($dest, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [INSTALLED] $($fileMap[$srcName])" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 5. Copy SQL migrations
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[INSTALL] Copying SQL migrations..." -ForegroundColor Yellow

foreach ($sql in $sqlFiles) {
    $src = Join-Path $DOWNLOADS $sql
    $dest = Join-Path $REPO "supabase\migrations\$sql"
    $content = [System.IO.File]::ReadAllText($src)
    [System.IO.File]::WriteAllText($dest, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  [INSTALLED] supabase\migrations\$sql" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 6. Scan for remaining createClient() calls that should be using the new singleton
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[SCAN] Looking for files that may need manual updates..." -ForegroundColor Yellow

$problemPatterns = @{
    "createSupabaseBrowser\(\)" = "Replace with: import { supabase } from '@/lib/supabase/client'"
    "import \{ createClient \} from '@supabase/supabase-js'" = "Don't import createClient from supabase-js directly. Use @/lib/supabase/client."
    "createServerComponentClient" = "Use createSupabaseServer from @/lib/supabase/server (deprecated auth-helpers)."
    "createClientComponentClient" = "Use createClient from @/lib/supabase/client (deprecated auth-helpers)."
}

$problems = @()
$searchPaths = @("src\app", "src\components", "src\lib", "src\contexts", "src\hooks")

foreach ($path in $searchPaths) {
    $fullPath = Join-Path $REPO $path
    if (-not (Test-Path $fullPath)) { continue }

    $files = Get-ChildItem $fullPath -Recurse -Include *.ts,*.tsx
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        foreach ($pattern in $problemPatterns.Keys) {
            if ($content -match $pattern) {
                $rel = $file.FullName.Replace($REPO + "\", "")
                # Skip our own newly-installed files
                if ($rel -in @($fileMap.Values)) { continue }
                $problems += [PSCustomObject]@{
                    File    = $rel
                    Pattern = $pattern
                    Action  = $problemPatterns[$pattern]
                }
            }
        }
    }
}

if ($problems.Count -gt 0) {
    Write-Host ""
    Write-Host "  Found $($problems.Count) file(s) that may need manual updates:" -ForegroundColor Yellow
    foreach ($p in $problems) {
        Write-Host "    [WARN] $($p.File)" -ForegroundColor Yellow
        Write-Host "           Pattern: $($p.Pattern)" -ForegroundColor DarkYellow
        Write-Host "           Action:  $($p.Action)" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  [OK] No legacy patterns found." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 7. Optional: clear .next cache
# -----------------------------------------------------------------------------

Write-Host ""
$clearCache = Read-Host "Clear .next build cache? (y/n) [y]"
if ($clearCache -eq "" -or $clearCache.ToLower() -eq "y") {
    if (Test-Path "$REPO\.next") {
        Remove-Item -Recurse -Force "$REPO\.next" -ErrorAction SilentlyContinue
        Write-Host "  [OK] Cleared .next" -ForegroundColor Green
    }
    if (Test-Path "$REPO\node_modules\.cache") {
        Remove-Item -Recurse -Force "$REPO\node_modules\.cache" -ErrorAction SilentlyContinue
        Write-Host "  [OK] Cleared node_modules\.cache" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# 8. Done
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Auth v2 Installation COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "REMAINING STEPS (manual):" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Run SQL migrations in Supabase Dashboard SQL Editor IN ORDER:" -ForegroundColor White
Write-Host "       a) supabase\migrations\006_auth_v2_schema.sql" -ForegroundColor White
Write-Host "       b) supabase\migrations\007_auth_v2_rls.sql" -ForegroundColor White
Write-Host "       c) supabase\migrations\008_auth_v2_seed.sql" -ForegroundColor White
Write-Host ""
Write-Host "     Use: Get-Content <path> -Raw | Set-Clipboard" -ForegroundColor DarkGray
Write-Host "          (then paste into Supabase SQL Editor)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Enable the Custom Access Token Hook:" -ForegroundColor White
Write-Host "       Supabase Dashboard -> Authentication -> Hooks" -ForegroundColor White
Write-Host "       Find 'Custom Access Token Hook'" -ForegroundColor White
Write-Host "       Click ENABLE" -ForegroundColor White
Write-Host "       Schema:   public" -ForegroundColor White
Write-Host "       Function: custom_access_token_hook" -ForegroundColor White
Write-Host "       Click Save" -ForegroundColor White
Write-Host ""
Write-Host "  3. Clear browser state:" -ForegroundColor White
Write-Host "       F12 -> Application -> Storage -> Clear site data" -ForegroundColor White
Write-Host ""
Write-Host "  4. Restart dev server:" -ForegroundColor White
Write-Host "       pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "  5. Test the auth flow:" -ForegroundColor White
Write-Host "       a) Visit http://localhost:3000/auth/login" -ForegroundColor White
Write-Host "       b) Click Teacher quick-fill, click Sign In" -ForegroundColor White
Write-Host "       c) Should redirect to /dashboard within 1-2s" -ForegroundColor White
Write-Host "       d) Visit http://localhost:3000/api/debug/whoami" -ForegroundColor White
Write-Host "          Verify claims.user_role and claims.permissions are present" -ForegroundColor White
Write-Host ""
Write-Host "BACKUP LOCATION (in case anything broke):" -ForegroundColor Cyan
Write-Host "  $BACKUP" -ForegroundColor White
Write-Host ""
Write-Host "Restore command:" -ForegroundColor Cyan
Write-Host "  Copy-Item -Path `"$BACKUP\*`" -Destination `"$REPO`" -Recurse -Force" -ForegroundColor White
Write-Host ""
