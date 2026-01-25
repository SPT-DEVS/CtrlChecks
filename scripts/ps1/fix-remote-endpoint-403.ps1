# Fix 403 Error on Remote Ollama Endpoint
# This script helps fix Cloudflare Access/WAF blocking the remote endpoint

Write-Host "🔧 Fixing 403 Error on Remote Ollama Endpoint" -ForegroundColor Cyan
Write-Host ""

$remoteUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"

# Step 1: Check if tunnel is running
Write-Host "1️⃣  Checking Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   ✅ Cloudflare Tunnel is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Cloudflare Tunnel is NOT running" -ForegroundColor Red
    Write-Host "   💡 Starting tunnel..." -ForegroundColor Yellow
    
    $projectRoot = $PSScriptRoot
    for ($i = 0; $i -lt 3; $i++) {
        $projectRoot = Split-Path $projectRoot -Parent
    }
    
    $tunnelConfig = Join-Path $projectRoot "cloudflare-tunnel-config.yml"
    if (Test-Path $tunnelConfig) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'Starting Cloudflare Tunnel...' -ForegroundColor Green; cloudflared tunnel --config cloudflare-tunnel-config.yml run ollama-api" -WindowStyle Normal
        Write-Host "   ⏳ Waiting 10 seconds for tunnel to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host "   ❌ Tunnel config not found" -ForegroundColor Red
    }
}

# Step 2: Test remote endpoint
Write-Host ""
Write-Host "2️⃣  Testing Remote Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$remoteUrl/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Remote endpoint is accessible!" -ForegroundColor Green
    Write-Host "   🎉 Setup complete!" -ForegroundColor Green
    exit 0
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "   ❌ 403 Forbidden - Cloudflare Access/WAF is blocking" -ForegroundColor Red
    } elseif ($statusCode -eq 530) {
        Write-Host "   ❌ 530 Error - Tunnel not connected" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Error $statusCode: $_" -ForegroundColor Red
    }
}

# Step 3: Instructions to fix 403
Write-Host ""
Write-Host "3️⃣  Fix Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   The 403 error is caused by Cloudflare Access or WAF blocking the endpoint." -ForegroundColor White
Write-Host ""
Write-Host "   Option 1: Disable Cloudflare Access (Recommended)" -ForegroundColor Cyan
Write-Host "   1. Go to: https://dash.cloudflare.com" -ForegroundColor Gray
Write-Host "   2. Select your domain (ctrlchecks.ai)" -ForegroundColor Gray
Write-Host "   3. Go to: Zero Trust → Access → Applications" -ForegroundColor Gray
Write-Host "   4. Find application for: coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor Gray
Write-Host "   5. Delete or disable it" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option 2: Use PowerShell script" -ForegroundColor Cyan
Write-Host "   .\scripts\ps1\setup\disable-cloudflare-access.ps1" -ForegroundColor White
Write-Host ""
Write-Host "   Option 3: Check WAF Rules" -ForegroundColor Cyan
Write-Host "   1. Go to: Security → WAF → Custom Rules" -ForegroundColor Gray
Write-Host "   2. Look for rules blocking coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor Gray
Write-Host "   3. Disable or modify them" -ForegroundColor Gray
Write-Host ""
   Write-Host "   After fixing, test again:" -ForegroundColor Yellow
   Write-Host "   Invoke-WebRequest -Uri `"$remoteUrl/api/tags`" -UseBasicParsing" -ForegroundColor White
Write-Host ""
