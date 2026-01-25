# Start Ollama Backend with Localhost Ollama
# This uses http://localhost:11434 instead of the remote endpoint

# Get project root (two levels up from scripts/ps1/start/)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$ollamaBackendPath = Join-Path $projectRoot "AI_Agent\ollama_backend"

Write-Host "🚀 Starting Ollama Backend with LOCALHOST Ollama..." -ForegroundColor Green
Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Check if Ollama is running locally
Write-Host "🔍 Verifying local Ollama is running..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($ollamaCheck.StatusCode -eq 200) {
        Write-Host "   ✅ Ollama is running on localhost:11434" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Ollama is NOT running on localhost:11434" -ForegroundColor Red
    Write-Host "   Please start Ollama first: ollama serve" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Setting OLLAMA_BASE_URL to localhost..." -ForegroundColor Cyan
$env:OLLAMA_BASE_URL = "http://localhost:11434"
Write-Host "   ✅ OLLAMA_BASE_URL=http://localhost:11434" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 Starting FastAPI server on http://localhost:8000" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location $ollamaBackendPath

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Start uvicorn with localhost Ollama
Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host "   OLLAMA_BASE_URL: $env:OLLAMA_BASE_URL" -ForegroundColor Gray
Write-Host ""
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
