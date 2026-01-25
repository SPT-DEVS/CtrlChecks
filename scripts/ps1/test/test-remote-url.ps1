# Test Remote URL Setup
# Comprehensive testing of all services with remote Ollama endpoint

Write-Host "🧪 Testing Remote URL Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$remoteUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"
$allTestsPassed = $true

# Test 1: Local Ollama Service
Write-Host "1️⃣  Testing Local Ollama Service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Local Ollama is accessible" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   📦 Models available: $($models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Local Ollama is NOT accessible: $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 2: Remote Ollama Endpoint (via Cloudflare Tunnel)
Write-Host ""
Write-Host "2️⃣  Testing Remote Ollama Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$remoteUrl/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Remote endpoint is accessible" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   📦 Models available via tunnel: $($models.Count)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 530) {
        Write-Host "   ❌ Cloudflare Tunnel error (530) - Tunnel not running or not connected" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Remote endpoint error: $_" -ForegroundColor Red
    }
    $allTestsPassed = $false
}

# Test 3: Ollama Backend Health
Write-Host ""
Write-Host "3️⃣  Testing Ollama Backend (Port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Ollama Backend is running" -ForegroundColor Green
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   📊 Status: $($health.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Ollama Backend is NOT running: $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: Multimodal Backend Health
Write-Host ""
Write-Host "4️⃣  Testing Multimodal Backend (Port 8501)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8501/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Multimodal Backend is running" -ForegroundColor Green
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   📊 Status: $($health.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Multimodal Backend is NOT running: $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 5: Frontend
Write-Host ""
Write-Host "5️⃣  Testing Frontend (Port 5173)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Frontend is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend is NOT running: $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 6: Processor Integration Test
Write-Host ""
Write-Host "6️⃣  Testing Processor Integration..." -ForegroundColor Yellow
try {
    $testPayload = @{
        task = "chat"
        input = "Hello, this is a test message."
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:8501/process" -Method POST -ContentType "application/json" -Body $testPayload -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        if ($result.success) {
            Write-Host "   ✅ Processor integration test passed" -ForegroundColor Green
            Write-Host "   💬 Response: $($result.output.Substring(0, [Math]::Min(50, $result.output.Length)))..." -ForegroundColor Cyan
        } else {
            Write-Host "   ⚠️  Processor returned error: $($result.error)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Processor test failed with status: $($response.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ Processor integration test failed: $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Summary
Write-Host ""
Write-Host "============================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "✅ All Tests Passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your project is fully configured for remote URL testing!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Access Points:" -ForegroundColor Cyan
    Write-Host "   🌐 Frontend:        http://localhost:5173" -ForegroundColor White
    Write-Host "   🚀 Ollama Backend:  http://localhost:8000" -ForegroundColor White
    Write-Host "   🚀 Multimodal:      http://localhost:8501" -ForegroundColor White
    Write-Host "   ☁️  Remote Ollama:  $remoteUrl" -ForegroundColor White
} else {
    Write-Host "❌ Some Tests Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure all services are running" -ForegroundColor White
    Write-Host "   2. Check Cloudflare Tunnel is connected" -ForegroundColor White
    Write-Host "   3. Verify Ollama is running locally" -ForegroundColor White
    Write-Host "   4. Run diagnostic: .\scripts\ps1\fix-processor-ollama-connection.ps1" -ForegroundColor White
}
Write-Host ""
