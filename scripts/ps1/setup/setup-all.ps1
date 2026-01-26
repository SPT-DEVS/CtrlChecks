# Setup All Components - Simple Script
Write-Host "====================================" -ForegroundColor Green
Write-Host "Complete Setup and Installation" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# 1. Install Python dependencies
Write-Host "1. Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   Installing Fast_API_Ollama dependencies..." -ForegroundColor Cyan
Set-Location "..\Fast_API_Ollama"
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt 2>&1 | Out-Null
    Write-Host "   Fast_API_Ollama packages installed" -ForegroundColor Green
}
Set-Location "..\worker"
if (Test-Path "requirements.txt") {
    pip install -r requirements.txt 2>&1 | Out-Null
    Write-Host "   Worker packages installed" -ForegroundColor Green
}
Set-Location "..\ctrl_checks"

Write-Host ""

# 2. Verify Ollama models
Write-Host "2. Verifying Ollama models..." -ForegroundColor Yellow
$models = ollama list
$hasLlava = $models -match "llava"
$hasMistral = $models -match "mistral:7b"

if ($hasLlava) {
    Write-Host "   llava (Vision) - OK" -ForegroundColor Green
} else {
    Write-Host "   Pulling llava..." -ForegroundColor Cyan
    ollama pull llava
}

if ($hasMistral) {
    Write-Host "   mistral:7b (Text) - OK" -ForegroundColor Green
} else {
    Write-Host "   Pulling mistral:7b..." -ForegroundColor Cyan
    ollama pull mistral:7b
}

Write-Host ""

# 3. Create .env files if needed
Write-Host "3. Setting up environment..." -ForegroundColor Yellow
$fastApiEnvFile = "..\Fast_API_Ollama\.env"
if (-not (Test-Path $fastApiEnvFile)) {
    @"
OLLAMA_URL=http://localhost:11434
PORT=8000
ALLOWED_ORIGINS=*
TIMEOUT_SECONDS=180.0
"@ | Out-File -FilePath $fastApiEnvFile -Encoding UTF8
    Write-Host "   Fast_API_Ollama .env file created" -ForegroundColor Green
} else {
    Write-Host "   Fast_API_Ollama .env file already exists" -ForegroundColor Green
}

$workerEnvFile = "..\worker\.env"
if (-not (Test-Path $workerEnvFile)) {
    Copy-Item "..\worker\env.example" $workerEnvFile -ErrorAction SilentlyContinue
    Write-Host "   Worker .env file created from example" -ForegroundColor Green
} else {
    Write-Host "   Worker .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the services:" -ForegroundColor Cyan
Write-Host "  .\scripts\ps1\start\start-all-services.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or manually:" -ForegroundColor Cyan
Write-Host "  Fast_API_Ollama: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor White
Write-Host "  Worker: cd ..\worker && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -ForegroundColor White
