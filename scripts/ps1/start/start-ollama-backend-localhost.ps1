# Start Ollama Backend with Localhost Ollama
# This uses http://localhost:11434 instead of the remote endpoint

# Get project root (two levels up from scripts/ps1/start/)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$fastApiOllamaPath = Join-Path $projectRoot "Fast_API_Ollama"

Write-Host "🚀 Starting Fast_API_Ollama with LOCALHOST Ollama..." -ForegroundColor Green
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
Write-Host "🌐 Starting Fast_API_Ollama on http://localhost:8000" -ForegroundColor Cyan
Write-Host ""

# Change to Fast_API_Ollama directory
Set-Location $fastApiOllamaPath

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Start uvicorn
Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
