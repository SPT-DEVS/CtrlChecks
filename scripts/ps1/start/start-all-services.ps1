# Start All Services Script
# Starts Ollama Backend, Python Backend, and Frontend

Write-Host "🚀 Starting All Services..." -ForegroundColor Green
Write-Host ""

# Check if services are already running
Write-Host "🔍 Checking existing services..." -ForegroundColor Yellow

$services = @(
    @{Name="Ollama Backend"; Port=8000; Path="AI_Agent\ollama_backend"; Command=".\venv\Scripts\Activate.ps1; uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload"},
    @{Name="Python Backend"; Port=8501; Path="AI_Agent\multimodal_backend"; Command="python main.py"},
    @{Name="Frontend"; Port=5173; Path="."; Command="npm run dev"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ⚠️  $($service.Name) is already running on port $($service.Port)" -ForegroundColor Yellow
    } catch {
        Write-Host "   ✅ Port $($service.Port) is free for $($service.Name)" -ForegroundColor Green
    }
}

Write-Host "`n📦 Starting services in separate windows..." -ForegroundColor Cyan

# Start Ollama Backend
Write-Host "`n1️⃣  Starting Ollama Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\AI_Agent\ollama_backend'; .\venv\Scripts\Activate.ps1; Write-Host '🚀 Ollama Backend Starting...' -ForegroundColor Green; uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Python Backend
Write-Host "2️⃣  Starting Python Backend..." -ForegroundColor Yellow
# Set OLLAMA_BASE_URL if not already set
$ollamaUrl = $env:OLLAMA_BASE_URL
if (-not $ollamaUrl) {
    $ollamaUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"
    Write-Host "   ℹ️  Using default OLLAMA_BASE_URL: $ollamaUrl" -ForegroundColor Cyan
} else {
    Write-Host "   ℹ️  Using OLLAMA_BASE_URL from environment: $ollamaUrl" -ForegroundColor Cyan
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\AI_Agent\multimodal_backend'; `$env:OLLAMA_BASE_URL='$ollamaUrl'; Write-Host '🚀 Python Backend Starting...' -ForegroundColor Green; Write-Host 'OLLAMA_BASE_URL: $ollamaUrl' -ForegroundColor Cyan; python main.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "3️⃣  Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🚀 Frontend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host "`n✅ All services starting in separate windows!" -ForegroundColor Green
Write-Host "`n⏳ Wait 10-15 seconds for services to start..." -ForegroundColor Yellow
Write-Host "`n📝 Services:" -ForegroundColor Cyan
Write-Host "   - Ollama Backend: http://localhost:8000" -ForegroundColor White
Write-Host "   - Python Backend: http://localhost:8501" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`n🧪 Test integration: .\test-ollama-integration.ps1" -ForegroundColor Yellow
