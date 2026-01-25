# Verify Cloudflare Tunnel Status
# Checks if tunnel is running and connected

Write-Host "Verifying Cloudflare Tunnel Status" -ForegroundColor Cyan
Write-Host ""

# Check if tunnel process is running
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "Cloudflare Tunnel process is running (PID: $($tunnelProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "Cloudflare Tunnel process is NOT running" -ForegroundColor Red
    Write-Host "Start it with: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Yellow
    exit 1
}

# Test local Ollama
Write-Host ""
Write-Host "1. Testing Local Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   Local Ollama is accessible" -ForegroundColor Green
} catch {
    Write-Host "   Local Ollama is NOT accessible" -ForegroundColor Red
    Write-Host "   Start Ollama: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Test remote endpoint
Write-Host ""
Write-Host "2. Testing Remote Endpoint..." -ForegroundColor Yellow
$remoteUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"
try {
    $response = Invoke-WebRequest -Uri "$remoteUrl/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   Remote endpoint is accessible!" -ForegroundColor Green
    Write-Host "   Tunnel is working correctly!" -ForegroundColor Green
    
    # Parse models
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   Models available via tunnel: $($models.Count)" -ForegroundColor Cyan
} catch {
    $errorObj = $_
    $statusCode = $null
    if ($errorObj.Exception.Response) {
        $statusCode = $errorObj.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 403) {
        Write-Host "   403 Forbidden - Cloudflare Access is blocking" -ForegroundColor Red
        Write-Host "   Fix: Disable Cloudflare Access for coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor Yellow
        Write-Host "   Run: .\scripts\ps1\fix-remote-endpoint-403.ps1" -ForegroundColor Yellow
    } elseif ($statusCode -eq 530) {
        Write-Host "   530 Error - Tunnel not fully connected yet" -ForegroundColor Red
        Write-Host "   Wait a few more seconds and check tunnel logs" -ForegroundColor Yellow
    } else {
        Write-Host "   Error: $($errorObj.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Tunnel Status Indicators:" -ForegroundColor Cyan
Write-Host "   Registered tunnel connection in logs = Tunnel is connected" -ForegroundColor Green
Write-Host "   Multiple connections (connIndex=0,1,2,3) = Good redundancy" -ForegroundColor Green
Write-Host "   Failed to initialize DNS local resolver = Warning only, not critical" -ForegroundColor Yellow
Write-Host ""
