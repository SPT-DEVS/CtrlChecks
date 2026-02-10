# ============================================
# Setup Frontend for Local Testing
# Points to local Worker (localhost:3001) instead of production
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setting up Frontend for Local Testing" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PWD ".env"

# Check if .env exists
if (Test-Path $envPath) {
    Write-Host "[INFO] Found existing .env file" -ForegroundColor Yellow
    Write-Host "   Backing up to .env.backup..." -ForegroundColor Gray
    Copy-Item $envPath "$envPath.backup" -Force
}

# Create .env file for local testing
$envContent = @"
# ============================================
# CtrlChecks Frontend - Environment Variables
# LOCAL TESTING CONFIGURATION
# ============================================

# ============================================
# REQUIRED - Supabase Configuration
# ============================================
VITE_SUPABASE_URL=https://nvrrqvlqnnvlihtlgmzn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cnJxdmxxbm52bGlodGxnbXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjQ5MDMsImV4cCI6MjA4MTA0MDkwM30.3So6zpF15ORuOF-R6YY2ya1XE9bTCjnsvAxf1B7HZMo

# ============================================
# Worker Service Configuration - LOCAL
# ============================================
# Local: http://localhost:3001 (Worker running locally)
# Production: https://worker.ctrlchecks.ai
VITE_API_URL=http://localhost:3001

# ============================================
# FastAPI Ollama Service Configuration
# ============================================
# Note: Worker connects to AWS Ollama, so this is not directly used
# But kept for compatibility
VITE_PYTHON_BACKEND_URL=http://localhost:3001
VITE_OLLAMA_BASE_URL=http://localhost:3001

# ============================================
# Optional - Advanced Configuration
# ============================================
VITE_USE_DIRECT_BACKEND=false

# Public base URL (for OAuth redirects, etc.)
VITE_PUBLIC_BASE_URL=http://localhost:8080
"@

Write-Host "[STEP 1] Creating .env file for local testing..." -ForegroundColor Yellow
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
Write-Host "   [OK] .env file created!" -ForegroundColor Green
Write-Host ""

# Verify the file
Write-Host "[STEP 2] Verifying configuration..." -ForegroundColor Yellow
$envContent = Get-Content $envPath -Raw

if ($envContent -match "VITE_API_URL=http://localhost:3001") {
    Write-Host "   [OK] VITE_API_URL set to localhost:3001" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] VITE_API_URL not set correctly!" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Configuration:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   - Worker:   http://localhost:3001 (LOCAL)" -ForegroundColor White
Write-Host "   - Ollama:   AWS (via Worker)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Restart your dev server!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Stop your current dev server (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Restart: npm run dev" -ForegroundColor White
Write-Host "   3. Check browser console - should see:" -ForegroundColor White
Write-Host "      '🌐 API Client initialized with base URL: http://localhost:3001'" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 To switch back to production:" -ForegroundColor Cyan
Write-Host "   - Run: .\create-env.ps1" -ForegroundColor White
Write-Host "   - Or manually edit .env and set VITE_API_URL=https://worker.ctrlchecks.ai" -ForegroundColor White
Write-Host ""
