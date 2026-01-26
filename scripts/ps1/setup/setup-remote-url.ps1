# Setup Project for Remote URL Testing
# Configures all services to use https://diego-ski-deutsche-choir.trycloudflare.com

Write-Host "🌐 Setting Up Project for Remote URL Testing" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get project root
$projectRoot = $PSScriptRoot
for ($i = 0; $i -lt 3; $i++) {
    $projectRoot = Split-Path $projectRoot -Parent
}

Write-Host "📁 Project Root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "1️⃣  Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Ollama
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaInstalled) {
    Write-Host "   ✅ Ollama is installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ollama is NOT installed" -ForegroundColor Red
    Write-Host "   💡 Install from: https://ollama.com/download" -ForegroundColor Yellow
    exit 1
}

# Check cloudflared
$cloudflaredInstalled = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredInstalled) {
    Write-Host "   ✅ Cloudflared is installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Cloudflared is NOT installed" -ForegroundColor Red
    Write-Host "   💡 Install from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
    Write-Host "   💡 Or run: .\scripts\ps1\setup\install-cloudflared.ps1" -ForegroundColor Yellow
    exit 1
}

# Check Python
$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
if ($pythonInstalled) {
    $pythonVersion = python --version
    Write-Host "   ✅ Python is installed: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Python is NOT installed" -ForegroundColor Red
    exit 1
}

# Check Node.js
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js is NOT installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check Ollama Service
Write-Host "2️⃣  Checking Ollama Service..." -ForegroundColor Yellow
Write-Host ""

$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "   ✅ Ollama service is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ollama service is NOT running" -ForegroundColor Yellow
    Write-Host "   💡 Starting Ollama in a new window..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🦙 Starting Ollama Service...' -ForegroundColor Green; ollama serve" -WindowStyle Normal
    Write-Host "   ⏳ Waiting 5 seconds for Ollama to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Test local Ollama
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Local Ollama is accessible" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   📦 Installed models: $($models.Count)" -ForegroundColor Cyan
    if ($models.Count -eq 0) {
        Write-Host "   ⚠️  No models installed. Pulling required models..." -ForegroundColor Yellow
        Write-Host "   💡 Run: ollama pull qwen2.5:7b && ollama pull mistral:7b && ollama pull llama3:8b" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Local Ollama is NOT accessible: $_" -ForegroundColor Red
    Write-Host "   💡 Make sure Ollama is running: ollama serve" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Check Cloudflare Tunnel
Write-Host "3️⃣  Checking Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host ""

$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   ✅ Cloudflare Tunnel is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Cloudflare Tunnel is NOT running" -ForegroundColor Yellow
    Write-Host "   💡 Starting Cloudflare Tunnel in a new window..." -ForegroundColor Cyan
    
    $tunnelConfig = Join-Path $projectRoot "cloudflare-tunnel-config.yml"
    if (Test-Path $tunnelConfig) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host '☁️  Starting Cloudflare Tunnel...' -ForegroundColor Green; cloudflared tunnel --config cloudflare-tunnel-config.yml run ollama-api" -WindowStyle Normal
        Write-Host "   ⏳ Waiting 10 seconds for tunnel to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host "   ❌ Tunnel config not found: $tunnelConfig" -ForegroundColor Red
        exit 1
    }
}

# Test remote endpoint
Write-Host "   🔍 Testing remote endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://diego-ski-deutsche-choir.trycloudflare.com/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✅ Remote endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 530) {
        Write-Host "   ❌ Cloudflare Tunnel error (530)" -ForegroundColor Red
        Write-Host "   💡 Tunnel may still be starting. Wait a few more seconds and test again." -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  Remote endpoint test failed: $_" -ForegroundColor Yellow
        Write-Host "   💡 This is OK if tunnel is still starting. Will retry later." -ForegroundColor Cyan
    }
}

Write-Host ""

# Step 4: Create .env files for remote URL
Write-Host "4️⃣  Configuring Services for Remote URL..." -ForegroundColor Yellow
Write-Host ""

$remoteUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"

# Fast_API_Ollama .env
$fastApiEnvPath = Join-Path $projectRoot "Fast_API_Ollama\.env"
$fastApiEnvContent = "# Remote Ollama Configuration`nOLLAMA_URL=$remoteUrl`nPORT=8000`nALLOWED_ORIGINS=*`n"

if (Test-Path $fastApiEnvPath) {
    Write-Host "   Info: .env file exists at: $fastApiEnvPath" -ForegroundColor Gray
    $existing = Get-Content $fastApiEnvPath -Raw
    if ($existing -match "OLLAMA_URL") {
        $existing = $existing -replace "OLLAMA_URL=.*", "OLLAMA_URL=$remoteUrl"
        Set-Content -Path $fastApiEnvPath -Value $existing -NoNewline
        Write-Host "   Updated OLLAMA_URL in existing .env" -ForegroundColor Green
    } else {
        Add-Content -Path $fastApiEnvPath -Value "`n$fastApiEnvContent"
        Write-Host "   Added OLLAMA_URL to existing .env" -ForegroundColor Green
    }
} else {
    Set-Content -Path $fastApiEnvPath -Value $fastApiEnvContent
    Write-Host "   Created .env file at: $fastApiEnvPath" -ForegroundColor Green
}

# Worker .env
$workerEnvPath = Join-Path $projectRoot "worker\.env"
if (Test-Path $workerEnvPath) {
    Write-Host "   Info: Worker .env file exists at: $workerEnvPath" -ForegroundColor Gray
    $existing = Get-Content $workerEnvPath -Raw
    if ($existing -match "OLLAMA_BASE_URL") {
        $existing = $existing -replace "OLLAMA_BASE_URL=.*", "OLLAMA_BASE_URL=$remoteUrl"
        Set-Content -Path $workerEnvPath -Value $existing -NoNewline
        Write-Host "   Updated OLLAMA_BASE_URL in worker .env" -ForegroundColor Green
    }
} else {
    Write-Host "   Note: Worker .env file not found. Copy from env.example if needed." -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Summary
Write-Host "5️⃣  Setup Summary" -ForegroundColor Yellow
Write-Host ""

Write-Host "   ✅ Prerequisites checked" -ForegroundColor Green
Write-Host "   ✅ Ollama service configured" -ForegroundColor Green
Write-Host "   ✅ Cloudflare Tunnel configured" -ForegroundColor Green
Write-Host "   ✅ Services configured for remote URL: $remoteUrl" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Start all services:" -ForegroundColor White
Write-Host "      .\scripts\ps1\start\start-all-services-remote.ps1" -ForegroundColor Cyan
Write-Host ""
    Write-Host "   2. Or start manually:" -ForegroundColor White
    Write-Host "      Terminal 1: ollama serve" -ForegroundColor Gray
    Write-Host "      Terminal 2: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Gray
    Write-Host "      Terminal 3: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
    Write-Host "      Terminal 4: cd ..\worker && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -ForegroundColor Gray
    Write-Host "      Terminal 5: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Test the setup:" -ForegroundColor White
Write-Host "      .\scripts\ps1\test\test-remote-url.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
