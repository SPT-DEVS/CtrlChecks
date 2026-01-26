# Test FastAPI Proxy Endpoints
# Comprehensive testing of all proxy endpoints

Write-Host "Testing FastAPI Proxy Endpoints" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true
$baseUrlLocal = "http://localhost:8000"
$baseUrlRemote = "https://diego-ski-deutsche-choir.trycloudflare.com"

# Test 1: Check Ollama Service
Write-Host "1. Checking Ollama Service (localhost:11434)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   Ollama service is running" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   Models available: $($models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   Ollama service is NOT running: $_" -ForegroundColor Red
    Write-Host "   Start Ollama: ollama serve" -ForegroundColor Yellow
    $allTestsPassed = $false
    exit 1
}

# Test 2: Check FastAPI Backend (Local)
Write-Host ""
Write-Host "2. Checking FastAPI Backend (localhost:8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrlLocal/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   FastAPI backend is running" -ForegroundColor Green
} catch {
    Write-Host "   FastAPI backend is NOT running: $_" -ForegroundColor Red
    Write-Host "   Start backend: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Yellow
    $allTestsPassed = $false
    exit 1
}

# Test 3: GET /models (Local)
Write-Host ""
Write-Host "3. Testing GET /models (Local)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrlLocal/models" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        $modelCount = if ($data.models) { $data.models.Count } else { 0 }
        Write-Host "   GET /models: SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   Models returned: $modelCount" -ForegroundColor Cyan
    } else {
        Write-Host "   GET /models: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   GET /models: ERROR - $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: POST /chat (Local)
Write-Host ""
Write-Host "4. Testing POST /chat (Local)..." -ForegroundColor Yellow
try {
    $body = @{
        model = "mistral:7b"
        messages = @(
            @{ role = "user"; content = "Say 'Hello' and nothing else." }
        )
        stream = $false
    } | ConvertTo-Json -Depth 10

    $response = Invoke-WebRequest -Uri "$baseUrlLocal/chat" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop

    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        $content = if ($data.message) { $data.message.content } elseif ($data.response) { $data.response } else { "N/A" }
        Write-Host "   POST /chat: SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
        Write-Host "   Response preview: $($content.Substring(0, [Math]::Min(50, $content.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "   POST /chat: FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   POST /chat: ERROR - $_" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 5: Check Cloudflare Tunnel
Write-Host ""
Write-Host "5. Checking Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   Cloudflare Tunnel is running" -ForegroundColor Green
} else {
    Write-Host "   Cloudflare Tunnel is NOT running" -ForegroundColor Yellow
    Write-Host "   Skipping remote tests..." -ForegroundColor Gray
    $remoteTestsSkipped = $true
}

# Test 6: GET /models (Remote via Tunnel)
if (-not $remoteTestsSkipped) {
    Write-Host ""
    Write-Host "6. Testing GET /models (Remote via Tunnel)..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrlRemote/models" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   GET /models (Remote): SUCCESS (Status: $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "   GET /models (Remote): FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "   GET /models (Remote): 403 Forbidden - Cloudflare Access blocking" -ForegroundColor Yellow
            Write-Host "   Fix: Disable Cloudflare Access for coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor Yellow
        } else {
            Write-Host "   GET /models (Remote): ERROR - $_" -ForegroundColor Red
            $allTestsPassed = $false
        }
    }
}

# Test 7: Verify Ollama NOT Exposed (Should be 403)
Write-Host ""
Write-Host "7. Verifying Ollama is NOT Exposed (Should return 403)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrlRemote/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   WARNING: Ollama endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Red
    Write-Host "   Ollama should NOT be exposed directly!" -ForegroundColor Red
    $allTestsPassed = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   Ollama NOT exposed: 403 Forbidden (CORRECT!)" -ForegroundColor Green
        Write-Host "   This is expected - Ollama should not be accessible directly" -ForegroundColor Cyan
    } else {
        Write-Host "   Unexpected error: $_" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "All Tests Passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your FastAPI proxy is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Endpoints:" -ForegroundColor Cyan
    Write-Host "   Local:  http://localhost:8000" -ForegroundColor White
    Write-Host "   Remote: https://diego-ski-deutsche-choir.trycloudflare.com" -ForegroundColor White
} else {
    Write-Host "Some Tests Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the errors above and:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Ollama is running: ollama serve" -ForegroundColor White
    Write-Host "   2. Ensure FastAPI backend is running: uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000" -ForegroundColor White
    Write-Host "   3. Ensure Cloudflare Tunnel is running (for remote tests)" -ForegroundColor White
}
Write-Host ""
