# Complete Installation Script for Multimodal Backend
# Installs all dependencies, sets up environment, and pulls models

Write-Host "🚀 Complete Setup and Installation" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Check Python
Write-Host "1️⃣  Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Python not found. Please install Python 3.9+ first." -ForegroundColor Red
    exit 1
}

# Step 2: Check Ollama
Write-Host ""
Write-Host "2️⃣  Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>&1
    Write-Host "   ✅ Ollama found: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ollama not found. Please install Ollama first." -ForegroundColor Red
    Write-Host "   Download from: https://ollama.ai" -ForegroundColor Yellow
    exit 1
}

# Step 3: Navigate to Fast_API_Ollama
Write-Host ""
Write-Host "3️⃣  Setting up Fast_API_Ollama..." -ForegroundColor Yellow
$backendPath = "..\Fast_API_Ollama"
if (-not (Test-Path $backendPath)) {
    Write-Host "   ❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

# Step 4: Create/Activate virtual environment
Write-Host ""
Write-Host "4. Setting up virtual environment..." -ForegroundColor Yellow
$venvDir = if (Test-Path ".venv") { ".venv" } elseif (Test-Path "venv") { "venv" } else { $null }

if (-not $venvDir) {
    Write-Host "   Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Failed to create virtual environment" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "   Virtual environment created" -ForegroundColor Green
    $venvDir = ".venv"
} else {
    Write-Host "   Virtual environment already exists: $venvDir" -ForegroundColor Green
}

Write-Host "   Activating virtual environment..." -ForegroundColor Cyan
$venvPath = if (Test-Path ".venv\Scripts\Activate.ps1") { ".venv\Scripts\Activate.ps1" } elseif (Test-Path "venv\Scripts\Activate.ps1") { "venv\Scripts\Activate.ps1" } else { $null }

if ($venvPath) {
    & $venvPath
    Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Virtual environment activation script not found, continuing with global Python" -ForegroundColor Yellow
}

# Step 5: Upgrade pip
Write-Host ""
Write-Host "5️⃣  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Pip upgrade failed, continuing..." -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Pip upgraded" -ForegroundColor Green
}

# Step 6: Install requirements
Write-Host ""
Write-Host "6️⃣  Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "   This may take several minutes..." -ForegroundColor Cyan

if (Test-Path "requirements.txt") {
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to install some dependencies" -ForegroundColor Red
        Write-Host "   Continuing anyway..." -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ All dependencies installed successfully" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  requirements.txt not found, skipping..." -ForegroundColor Yellow
}

# Step 7: Pull Ollama models
Write-Host ""
Write-Host "7️⃣  Checking Ollama models..." -ForegroundColor Yellow
Pop-Location

# Check if models exist
$llavaExists = ollama list | Select-String "llava"
$mistralExists = ollama list | Select-String "mistral:7b"

if (-not $llavaExists) {
    Write-Host "   Pulling llava (Vision model)..." -ForegroundColor Cyan
    ollama pull llava
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ llava pulled successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Failed to pull llava" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ llava already installed" -ForegroundColor Green
}

if (-not $mistralExists) {
    Write-Host "   Pulling mistral:7b (Text model)..." -ForegroundColor Cyan
    ollama pull mistral:7b
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ mistral:7b pulled successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Failed to pull mistral:7b" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✅ mistral:7b already installed" -ForegroundColor Green
}

# Step 8: Create .env file if needed
Write-Host ""
Write-Host "8️⃣  Setting up environment variables..." -ForegroundColor Yellow
$envPath = "$backendPath\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "   Creating .env file..." -ForegroundColor Cyan
    @"
# Ollama API Configuration
OLLAMA_BASE_URL=https://diego-ski-deutsche-choir.trycloudflare.com

# Optional: Hugging Face Token (for private models)
# HUGGING_FACE_TOKEN=your_token_here
"@ | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "   ✅ .env file created" -ForegroundColor Green
    Write-Host "   📝 Edit $envPath to customize settings" -ForegroundColor Cyan
} else {
    Write-Host "   ✅ .env file already exists" -ForegroundColor Green
}

# Step 9: Verify installation
Write-Host ""
Write-Host "9️⃣  Verifying installation..." -ForegroundColor Yellow
Push-Location $backendPath

# Check key packages
$packages = @("fastapi", "uvicorn", "torch", "transformers", "diffusers", "aiohttp")
$allInstalled = $true

foreach ($package in $packages) {
    $result = pip show $package 2>&1
    if ($LASTEXITCODE -eq 0) {
        $version = ($result | Select-String "Version:").ToString() -replace "Version: ", ""
        Write-Host "   ✅ $package $version" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $package not installed" -ForegroundColor Red
        $allInstalled = $false
    }
}

Pop-Location

# Summary
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

if ($allInstalled) {
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Start the services:" -ForegroundColor White
    Write-Host "   .\scripts\ps1\start\start-all-services.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Or start manually:" -ForegroundColor White
    Write-Host "   Fast_API_Ollama: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
    Write-Host "   Worker: cd ..\worker && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Verify models are available:" -ForegroundColor White
    Write-Host "   ollama list" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  Some packages failed to install. Please check the errors above." -ForegroundColor Yellow
    Write-Host "   You may need to install them manually:" -ForegroundColor Yellow
    Write-Host "   Fast_API_Ollama: cd ..\Fast_API_Ollama && pip install -r requirements.txt" -ForegroundColor Gray
    Write-Host "   Worker: cd ..\worker && pip install -r requirements.txt" -ForegroundColor Gray
}

Write-Host "✅ Setup script complete!" -ForegroundColor Green
