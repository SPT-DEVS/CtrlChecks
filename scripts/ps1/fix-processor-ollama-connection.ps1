# Fix Processor Ollama Connection Issues
# This script helps diagnose and fix Ollama connection problems

Write-Host "🔧 Fixing Processor Ollama Connection Issues" -ForegroundColor Cyan
Write-Host ""

# Check Ollama service
Write-Host "1. Checking Ollama service..." -ForegroundColor Yellow
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    $pid = $ollamaProcess.Id
    Write-Host "   ✅ Ollama service is running (PID: $pid)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ollama service is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start Ollama: ollama serve" -ForegroundColor Yellow
}

# Check if Ollama is accessible locally
Write-Host ""
Write-Host "2. Testing local Ollama connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Local Ollama is accessible" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   📦 Installed models: $($models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Local Ollama is NOT accessible: $_" -ForegroundColor Red
    Write-Host "   💡 Make sure Ollama is running: ollama serve" -ForegroundColor Yellow
}

# Check Cloudflare Tunnel
Write-Host ""
Write-Host "3. Checking Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    $tunnelPid = $tunnelProcess.Id
    Write-Host "   ✅ Cloudflare Tunnel is running (PID: $tunnelPid)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Cloudflare Tunnel is NOT running" -ForegroundColor Red
    Write-Host "   💡 Start tunnel: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Yellow
}

# Test remote endpoint
Write-Host ""
Write-Host "4. Testing remote Ollama endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://diego-ski-deutsche-choir.trycloudflare.com/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Remote Ollama endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 530) {
        Write-Host "   ❌ Cloudflare Tunnel error (530) - Tunnel not running" -ForegroundColor Red
        Write-Host "   💡 Start the Cloudflare Tunnel to use remote endpoint" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Remote endpoint error: $_" -ForegroundColor Red
    }
}

# Recommendations
Write-Host ""
Write-Host "📋 Recommendations:" -ForegroundColor Cyan

if (-not $ollamaProcess) {
    Write-Host "   ⚠️  Start Ollama service first:" -ForegroundColor Yellow
    Write-Host "      ollama serve" -ForegroundColor White
    Write-Host ""
}

if ($ollamaProcess -and -not $tunnelProcess) {
    Write-Host "   💡 For LOCAL development (recommended):" -ForegroundColor Yellow
    Write-Host "      Set environment variable before starting backend:" -ForegroundColor White
    Write-Host "      `$env:OLLAMA_BASE_URL='http://localhost:11434'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   💡 For REMOTE access (requires tunnel):" -ForegroundColor Yellow
    Write-Host "      Start Cloudflare Tunnel:" -ForegroundColor White
    Write-Host "      .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Cyan
    Write-Host ""
}

if ($ollamaProcess -and $tunnelProcess) {
    Write-Host "   ✅ Both services are running!" -ForegroundColor Green
    Write-Host "   💡 Processors will automatically use localhost if remote fails" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ Processors have been updated with automatic fallback to localhost" -ForegroundColor Green
Write-Host "   If remote endpoint fails, they will automatically try localhost:11434" -ForegroundColor Gray
