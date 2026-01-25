# Check All Services Status
# Verifies that all required backend services are running

Write-Host "🔍 Checking Service Status..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Ollama Backend"; Port=8000; Endpoint="/health"},
    @{Name="Python Multimodal Backend"; Port=8501; Endpoint="/health"},
    @{Name="Frontend"; Port=5173; Endpoint="/"}
)

$allRunning = $true

foreach ($service in $services) {
    $url = "http://localhost:$($service.Port)$($service.Endpoint)"
    Write-Host "Checking $($service.Name) on port $($service.Port)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ $($service.Name) is RUNNING" -ForegroundColor Green
        Write-Host "      Status: $($response.StatusCode)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ $($service.Name) is NOT RUNNING" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        $allRunning = $false
        
        # Provide helpful instructions
        if ($service.Name -eq "Python Multimodal Backend") {
            Write-Host "      💡 To start: cd AI_Agent\multimodal_backend; python main.py" -ForegroundColor Yellow
        } elseif ($service.Name -eq "Ollama Backend") {
            Write-Host "      💡 To start: cd AI_Agent\ollama_backend; .\venv\Scripts\Activate.ps1; uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Yellow
        } elseif ($service.Name -eq "Frontend") {
            Write-Host "      💡 To start: npm run dev" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Check Python backend specific endpoint
Write-Host "Testing Python Backend /api/agent/execute endpoint..." -ForegroundColor Yellow
try {
    $testPayload = @{
        task = "summarize"
        input = "Test input"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8501/api/agent/execute" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ /api/agent/execute endpoint is working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ /api/agent/execute endpoint failed" -ForegroundColor Red
    Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
    $allRunning = $false
}

Write-Host ""
if ($allRunning) {
    Write-Host "✅ All services are running!" -ForegroundColor Green
} else {
    Write-Host "❌ Some services are not running. Please start them before using the application." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Quick Start:" -ForegroundColor Yellow
    Write-Host "   Run: .\start-all-services.ps1" -ForegroundColor White
}
