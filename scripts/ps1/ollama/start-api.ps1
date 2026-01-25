# Windows PowerShell script to start the Ollama API server
# Run this after setup: .\start-api.ps1

Write-Host "🚀 Starting Ollama API Server..." -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "❌ Virtual environment not found. Run setup-windows.ps1 first." -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check if Ollama is running
Write-Host "🔍 Checking Ollama server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running on port 11434" -ForegroundColor Red
    Write-Host "   Please start Ollama first:" -ForegroundColor Yellow
    Write-Host "   1. Open a new PowerShell window" -ForegroundColor White
    Write-Host "   2. Run: ollama serve" -ForegroundColor White
    Write-Host "   3. Then run this script again" -ForegroundColor White
    exit 1
}

# Check if uvicorn is installed
Write-Host "🔍 Checking uvicorn..." -ForegroundColor Yellow
try {
    $uvicornVersion = uvicorn --version 2>&1
    Write-Host "✅ uvicorn is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ uvicorn is not installed. Installing..." -ForegroundColor Yellow
    pip install uvicorn[standard]
}

# Set OLLAMA_BASE_URL if not already set
$ollamaUrl = $env:OLLAMA_BASE_URL
if (-not $ollamaUrl) {
    $ollamaUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"
    Write-Host "`n📝 Setting OLLAMA_BASE_URL: $ollamaUrl" -ForegroundColor Cyan
    $env:OLLAMA_BASE_URL = $ollamaUrl
} else {
    Write-Host "`n📝 Using OLLAMA_BASE_URL from environment: $ollamaUrl" -ForegroundColor Cyan
}

# Start the server
Write-Host "`n🌐 Starting FastAPI server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
