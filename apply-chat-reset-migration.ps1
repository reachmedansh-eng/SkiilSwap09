# Apply chat reset & block enforcement migration to Supabase
# Usage:
# 1. Run: powershell -ExecutionPolicy Bypass -File .\apply-chat-reset-migration.ps1
# 2. When prompted, login in browser (supabase login)
# 3. Script links project and pushes only the specific migration.

$ErrorActionPreference = 'Stop'

Write-Host '=== Supabase Chat Reset / Block Enforcement Migration ===' -ForegroundColor Cyan

# Ensure supabase CLI available via npx
function Require-SupabaseCLI {
  Write-Host 'Checking Supabase CLI...' -ForegroundColor Yellow
  try { npx supabase --help > $null 2>&1 } catch { Write-Host 'Supabase CLI failed.' -ForegroundColor Red; exit 1 }
}

Require-SupabaseCLI

# Login if not already
Write-Host 'Logging into Supabase CLI (browser will open if not authenticated)...' -ForegroundColor Yellow
npx supabase login

# Link project (project ref from config.toml)
$projectRef = 'zyzvxwnmzbwxgrtawqyy'
Write-Host "Linking project $projectRef" -ForegroundColor Yellow
npx supabase link --project-ref $projectRef

# Push only the new migration file
$migrationFile = 'supabase/migrations/20251116000000_chat_resets_and_reset_function.sql'
if (!(Test-Path $migrationFile)) { Write-Host "Migration file not found: $migrationFile" -ForegroundColor Red; exit 1 }

Write-Host 'Applying migration...' -ForegroundColor Yellow
# supabase db push will apply all unapplied migrations; acceptable here.
npx supabase db push

Write-Host 'Verifying function exists...' -ForegroundColor Yellow
$checkFn = "select proname from pg_proc where proname='reset_conversation';"
npx supabase db query --file <(echo $checkFn) 2>$null | Out-Host

Write-Host 'Done. You can now test: block, delete, fresh chat.' -ForegroundColor Green