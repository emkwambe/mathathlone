# =============================================================================
# MathAthlone Integrity System Installer
# =============================================================================
# Run from: C:\Users\HP\Documents\mathathlone-app\
# =============================================================================

param(
    [string]$DownloadsPath = "$env:USERPROFILE\Downloads"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MathAthlone Integrity System Install" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# Verify we're in the right directory
# -----------------------------------------------------------------------------

$AppRoot = Get-Location
$PackageJson = Join-Path $AppRoot "package.json"

if (-not (Test-Path $PackageJson)) {
    Write-Host "[ERROR] package.json not found. Run this from mathathlone-app root." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Found mathathlone-app at: $AppRoot" -ForegroundColor Green

# -----------------------------------------------------------------------------
# Find source files in Downloads
# -----------------------------------------------------------------------------

$FilesToInstall = @(
    @{
        Name = "003_integrity_system.sql"
        Target = "supabase\migrations\003_integrity_system.sql"
        Required = $true
    },
    @{
        Name = "focus-mode.ts"
        Target = "src\lib\competition\focus-mode.ts"
        Required = $true
    },
    @{
        Name = "focus-mode-ui.tsx"
        Target = "src\components\competition\focus-mode-ui.tsx"
        Required = $true
    },
    @{
        Name = "create-heat-page.tsx"
        Target = "src\app\compete\create\page.tsx"
        Required = $true
    },
    @{
        Name = "attestation.tsx"
        Target = "src\components\competition\attestation.tsx"
        Required = $true
    }
)

Write-Host ""
Write-Host "[SCAN] Looking for files in: $DownloadsPath" -ForegroundColor Yellow
Write-Host ""

$FoundFiles = @()
$MissingFiles = @()

foreach ($file in $FilesToInstall) {
    $SourcePath = Join-Path $DownloadsPath $file.Name
    
    if (Test-Path $SourcePath) {
        Write-Host "  [FOUND] $($file.Name)" -ForegroundColor Green
        $FoundFiles += @{
            Source = $SourcePath
            Target = Join-Path $AppRoot $file.Target
            Name = $file.Name
        }
    } else {
        Write-Host "  [MISSING] $($file.Name)" -ForegroundColor Red
        if ($file.Required) {
            $MissingFiles += $file.Name
        }
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "[ERROR] Missing required files:" -ForegroundColor Red
    $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Please download the files from Claude and try again." -ForegroundColor Yellow
    exit 1
}

# -----------------------------------------------------------------------------
# Create directories and install files
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "[INSTALL] Installing files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $FoundFiles) {
    $TargetDir = Split-Path $file.Target -Parent
    
    # Create directory if needed
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        Write-Host "  [DIR] Created: $TargetDir" -ForegroundColor Gray
    }
    
    # Copy file (BOM-free UTF-8)
    $Content = Get-Content -Path $file.Source -Raw -Encoding UTF8
    [System.IO.File]::WriteAllText($file.Target, $Content, [System.Text.UTF8Encoding]::new($false))
    
    Write-Host "  [COPY] $($file.Name) -> $($file.Target)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files installed:" -ForegroundColor White
Write-Host "  - SQL migration: supabase\migrations\003_integrity_system.sql" -ForegroundColor Gray
Write-Host "  - Focus Mode:    src\lib\competition\focus-mode.ts" -ForegroundColor Gray
Write-Host "  - Focus Mode UI: src\components\competition\focus-mode-ui.tsx" -ForegroundColor Gray
Write-Host "  - Create Heat:   src\app\compete\create\page.tsx" -ForegroundColor Gray
Write-Host "  - Attestation:   src\components\competition\attestation.tsx" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Run the SQL migration in Supabase:" -ForegroundColor White
Write-Host "     - Open Supabase Dashboard -> SQL Editor" -ForegroundColor Gray
Write-Host "     - Paste contents of 003_integrity_system.sql" -ForegroundColor Gray
Write-Host "     - Click 'Run'" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test the application:" -ForegroundColor White
Write-Host "     pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Create a Heat with integrity settings:" -ForegroundColor White
Write-Host "     http://localhost:3000/compete/create" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Integrity System Ready! " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
