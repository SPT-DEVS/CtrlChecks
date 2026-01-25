# Setup All Components - Simple Script
Write-Host "====================================" -ForegroundColor Green
Write-Host "Complete Setup and Installation" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# 1. Install Python dependencies
Write-Host "1. Installing Python dependencies..." -ForegroundColor Yellow
Set-Location "AI_Agent\multimodal_backend"
pip install -r requirements.txt 2>&1 | Out-Null
Write-Host "   Python packages installed" -ForegroundColor Green
Set-Location ..\..

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

# 3. Create .env file if needed
Write-Host "3. Setting up environment..." -ForegroundColor Yellow
$envFile = "AI_Agent\multimodal_backend\.env"
if (-not (Test-Path $envFile)) {
    @"
OLLAMA_BASE_URL=https://diego-ski-deutsche-choir.trycloudflare.com
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "   .env file created" -ForegroundColor Green
} else {
    Write-Host "   .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Cyan
Write-Host "  cd AI_Agent\multimodal_backend" -ForegroundColor White
Write-Host "  python main.py" -ForegroundColor White
Write-Host ""
Write-Host "Or use:" -ForegroundColor Cyan
Write-Host "  .\start-all-services.ps1" -ForegroundColor White
