# Reconnect Cloudflare Tunnel
# Quick script to verify and reconnect the tunnel

Write-Host ""
Write-Host "Reconnecting Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

# Step 1: Check cloudflared
Write-Host "Step 1: Checking cloudflared..." -ForegroundColor Yellow
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "   [FAIL] cloudflared not found!" -ForegroundColor Red
    Write-Host "   Install: .\scripts\ps1\setup\install-cloudflared.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "   [OK] cloudflared found" -ForegroundColor Green
Write-Host ""

# Step 2: Check tunnel exists
Write-Host "Step 2: Checking tunnel..." -ForegroundColor Yellow
$tunnelList = cloudflared tunnel list 2>&1
if ($tunnelList -match "ollama-api") {
    Write-Host "   [OK] Tunnel 'ollama-api' exists" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Tunnel 'ollama-api' not found" -ForegroundColor Red
    Write-Host "   Run setup: .\scripts\ps1\setup\setup-cloudflare-tunnel.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 3: Check credentials
Write-Host "Step 3: Checking credentials..." -ForegroundColor Yellow
$credsPath = "C:\Users\User\.cloudflared\f8dffe0b-25b2-4101-8b3a-2e92733b0c58.json"
if (Test-Path $credsPath) {
    Write-Host "   [OK] Credentials file exists" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Credentials file not found" -ForegroundColor Red
    Write-Host "   Re-authenticate: cloudflared tunnel login" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Check Ollama
Write-Host "Step 4: Checking Ollama service..." -ForegroundColor Yellow
$ollama = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollama) {
    Write-Host "   [OK] Ollama is running (PID: $($ollama.Id))" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Ollama is NOT running" -ForegroundColor Yellow
    Write-Host "   Start Ollama first: ollama serve" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Gray
}
Write-Host ""

# Step 5: Check config
Write-Host "Step 5: Checking config file..." -ForegroundColor Yellow
$configPath = Join-Path (Get-Location) "cloudflare-tunnel-config.yml"
if (Test-Path $configPath) {
    Write-Host "   [OK] Config file exists" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Config file not found" -ForegroundColor Red
    Write-Host "   Run setup: .\scripts\ps1\setup\setup-cloudflare-tunnel.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Check if tunnel is already running
Write-Host "Step 6: Checking if tunnel is already running..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   [WARN] Tunnel process already running (PID: $($tunnelProcess.Id))" -ForegroundColor Yellow
    Write-Host "   Do you want to stop it and restart? (y/n)" -ForegroundColor Cyan
    $restart = Read-Host
    if ($restart -eq "y") {
        Write-Host "   Stopping existing tunnel..." -ForegroundColor Yellow
        Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    } else {
        Write-Host "   Keeping existing tunnel running" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "   [OK] No existing tunnel process" -ForegroundColor Green
}
Write-Host ""

# Step 7: Start tunnel
Write-Host "Step 7: Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "   Config: $configPath" -ForegroundColor Gray
Write-Host "   Tunnel: ollama-api" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting tunnel (keep this window open)..." -ForegroundColor Cyan
Write-Host ""

# Start the tunnel
cloudflared tunnel --config $configPath run ollama-api
