# Start All Services for Remote URL Testing
# Starts Ollama, Cloudflare Tunnel, Backends, and Frontend

Write-Host "🚀 Starting All Services for Remote URL Testing" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Get project root
$projectRoot = $PSScriptRoot
for ($i = 0; $i -lt 2; $i++) {
    $projectRoot = Split-Path $projectRoot -Parent
}

$remoteUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"

# Step 1: Start Ollama Service
Write-Host "1️⃣  Starting Ollama Service..." -ForegroundColor Yellow
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaProcess) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🦙 Ollama Service' -ForegroundColor Green; Write-Host 'Running on: http://localhost:11434' -ForegroundColor Cyan; ollama serve" -WindowStyle Normal
    Write-Host "   ✅ Started Ollama in new window" -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "   ✅ Ollama is already running" -ForegroundColor Green
}

# Step 2: Start Cloudflare Tunnel
Write-Host ""
Write-Host "2️⃣  Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if (-not $tunnelProcess) {
    $tunnelConfig = Join-Path $projectRoot "cloudflare-tunnel-config.yml"
    if (Test-Path $tunnelConfig) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host '☁️  Cloudflare Tunnel' -ForegroundColor Green; Write-Host 'Exposing: $remoteUrl' -ForegroundColor Cyan; cloudflared tunnel --config cloudflare-tunnel-config.yml run ollama-api" -WindowStyle Normal
        Write-Host "   ✅ Started Cloudflare Tunnel in new window" -ForegroundColor Green
        Write-Host "   ⏳ Waiting 10 seconds for tunnel to establish..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host "   ❌ Tunnel config not found: $tunnelConfig" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ Cloudflare Tunnel is already running" -ForegroundColor Green
}

# Step 3: Start Ollama Backend (Port 8000)
Write-Host ""
Write-Host "3️⃣  Starting Ollama Backend (Port 8000)..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "AI_Agent\ollama_backend"
if (Test-Path $backendPath) {
    $venvPath = Join-Path $backendPath "venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\Activate.ps1; Write-Host '🚀 Ollama Backend' -ForegroundColor Green; Write-Host 'Running on: http://localhost:8000' -ForegroundColor Cyan; Write-Host 'OLLAMA_BASE_URL: $remoteUrl' -ForegroundColor Yellow; `$env:OLLAMA_BASE_URL='$remoteUrl'; uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
        Write-Host "   ✅ Started Ollama Backend in new window" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Virtual environment not found. Starting without venv..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Ollama Backend' -ForegroundColor Green; `$env:OLLAMA_BASE_URL='$remoteUrl'; uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ⚠️  Ollama Backend directory not found" -ForegroundColor Yellow
}

# Step 4: Start Multimodal Backend (Port 8501)
Write-Host ""
Write-Host "4️⃣  Starting Multimodal Backend (Port 8501)..." -ForegroundColor Yellow
$multimodalPath = Join-Path $projectRoot "AI_Agent\multimodal_backend"
if (Test-Path $multimodalPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$multimodalPath'; Write-Host '🚀 Multimodal Backend' -ForegroundColor Green; Write-Host 'Running on: http://localhost:8501' -ForegroundColor Cyan; Write-Host 'OLLAMA_BASE_URL: $remoteUrl' -ForegroundColor Yellow; `$env:OLLAMA_BASE_URL='$remoteUrl'; python main.py" -WindowStyle Normal
    Write-Host "   ✅ Started Multimodal Backend in new window" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ⚠️  Multimodal Backend directory not found" -ForegroundColor Yellow
}

# Step 5: Start Frontend (Port 5173)
Write-Host ""
Write-Host "5️⃣  Starting Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host '🚀 Frontend' -ForegroundColor Green; Write-Host 'Running on: http://localhost:5173' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal
Write-Host "   ✅ Started Frontend in new window" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All Services Started!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Services Running:" -ForegroundColor Cyan
Write-Host "   🦙 Ollama Service:        http://localhost:11434" -ForegroundColor White
Write-Host "   ☁️  Cloudflare Tunnel:     $remoteUrl" -ForegroundColor White
Write-Host "   🚀 Ollama Backend:        http://localhost:8000" -ForegroundColor White
Write-Host "   🚀 Multimodal Backend:    http://localhost:8501" -ForegroundColor White
Write-Host "   🌐 Frontend:               http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Wait 15-20 seconds for all services to fully start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test the setup:" -ForegroundColor Cyan
Write-Host "   .\scripts\ps1\test\test-remote-url.ps1" -ForegroundColor White
Write-Host ""
