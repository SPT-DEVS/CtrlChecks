# Start All Services Script
# Starts Ollama Backend, Python Backend, and Frontend

Write-Host "🚀 Starting All Services..." -ForegroundColor Green
Write-Host ""

# Check if services are already running
Write-Host "🔍 Checking existing services..." -ForegroundColor Yellow

$services = @(
    @{Name="Fast_API_Ollama"; Port=8000; Path="..\Fast_API_Ollama"; Command=".\venv\Scripts\Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"},
    @{Name="Worker"; Port=8001; Path="..\worker"; Command=".\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"},
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

# Start Fast_API_Ollama
Write-Host "`n1️⃣  Starting Fast_API_Ollama..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\..\Fast_API_Ollama'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; Write-Host '🚀 Fast_API_Ollama Starting...' -ForegroundColor Green; uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Worker
Write-Host "2️⃣  Starting Worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\..\worker'; if (Test-Path 'venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; Write-Host '🚀 Worker Starting...' -ForegroundColor Green; uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "3️⃣  Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🚀 Frontend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host "`n✅ All services starting in separate windows!" -ForegroundColor Green
Write-Host "`n⏳ Wait 10-15 seconds for services to start..." -ForegroundColor Yellow
Write-Host "`n📝 Services:" -ForegroundColor Cyan
Write-Host "   - Fast_API_Ollama: http://localhost:8000" -ForegroundColor White
Write-Host "   - Worker: http://localhost:8001" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`n🧪 Test integration: .\test-ollama-integration.ps1" -ForegroundColor Yellow
