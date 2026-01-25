# Verify Ollama Endpoint Usage
# Checks which Ollama endpoint is being used by the processors

Write-Host "🔍 Verifying Ollama Endpoint Configuration..." -ForegroundColor Cyan
Write-Host ""

# Check environment variable
$ollamaUrl = $env:OLLAMA_BASE_URL
if ($ollamaUrl) {
    Write-Host "✅ OLLAMA_BASE_URL environment variable:" -ForegroundColor Green
    Write-Host "   $ollamaUrl" -ForegroundColor White
} else {
    Write-Host "⚠️  OLLAMA_BASE_URL not set (will use default: https://diego-ski-deutsche-choir.trycloudflare.com)" -ForegroundColor Yellow
}

Write-Host ""

# Check if backend is running
Write-Host "Testing Backend Connection..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:8501/health" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is running on port 8501" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running on port 8501" -ForegroundColor Red
    Write-Host "   Start it with: cd AI_Agent\multimodal_backend; python main.py" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test remote Ollama API
Write-Host "Testing Remote Ollama API..." -ForegroundColor Yellow
try {
    $testUrl = "https://diego-ski-deutsche-choir.trycloudflare.com/api/tags"
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Remote Ollama API is accessible" -ForegroundColor Green
    Write-Host "   URL: https://diego-ski-deutsche-choir.trycloudflare.com" -ForegroundColor White
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Cannot connect to remote Ollama API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Check:" -ForegroundColor Yellow
    Write-Host "   - Is the remote API running?" -ForegroundColor White
    Write-Host "   - Is the URL correct: https://diego-ski-deutsche-choir.trycloudflare.com" -ForegroundColor White
    Write-Host "   - Check network connectivity" -ForegroundColor White
}

Write-Host ""

# Instructions
Write-Host "📝 How to Verify in Logs:" -ForegroundColor Cyan
Write-Host ""
Write-Host "When you start the backend, look for these log lines:" -ForegroundColor White
Write-Host ""
Write-Host "✅ CORRECT (Using Remote):" -ForegroundColor Green
Write-Host "   OLLAMA_BASE_URL configured: https://diego-ski-deutsche-choir.trycloudflare.com" -ForegroundColor Gray
Write-Host "   TextProcessor initialized with Ollama at https://diego-ski-deutsche-choir.trycloudflare.com" -ForegroundColor Gray
Write-Host "   Skipping local FastAPI backend check - using remote Ollama API" -ForegroundColor Gray
Write-Host "   Calling Ollama API at: https://diego-ski-deutsche-choir.trycloudflare.com/api/chat" -ForegroundColor Gray
Write-Host ""
Write-Host "❌ WRONG (Using Local):" -ForegroundColor Red
Write-Host "   Using FastAPI backend at http://localhost:8000" -ForegroundColor Gray
Write-Host "   Calling Ollama API at: http://localhost:8000/chat/completions" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 After making a request, check logs for:" -ForegroundColor Yellow
Write-Host "   'Calling Ollama API at: [URL]'" -ForegroundColor White
Write-Host "   This will show you exactly which endpoint is being used." -ForegroundColor White
