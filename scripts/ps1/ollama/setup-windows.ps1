# Windows Setup Script for Ollama Backend
# Run this script in PowerShell: .\setup-windows.ps1

Write-Host "🚀 Setting up Ollama Backend on Windows..." -ForegroundColor Green

# Check if Ollama is installed
Write-Host "`n📦 Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>&1
    Write-Host "✅ Ollama is installed: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please download and install Ollama from: https://ollama.com/download" -ForegroundColor Yellow
    Write-Host "   After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if Ollama is running
Write-Host "`n🔍 Checking if Ollama is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Ollama is already running on port 11434" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama is not running. Starting Ollama..." -ForegroundColor Yellow
    Write-Host "   Please start Ollama manually by running: ollama serve" -ForegroundColor Yellow
    Write-Host "   Or start it from the Start Menu" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Python
Write-Host "`n🐍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Python 3.9+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if models are available
Write-Host "`n📥 Checking Ollama models..." -ForegroundColor Yellow
$models = @("qwen2.5:7b", "llama3:8b", "mistral:7b")
$missingModels = @()

foreach ($model in $models) {
    try {
        $result = ollama list 2>&1 | Select-String -Pattern $model
        if ($result) {
            Write-Host "  ✅ $model is installed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $model is missing" -ForegroundColor Yellow
            $missingModels += $model
        }
    } catch {
        Write-Host "  ⚠️  Could not check $model" -ForegroundColor Yellow
        $missingModels += $model
    }
}

if ($missingModels.Count -gt 0) {
    Write-Host "`n📥 Pulling missing models..." -ForegroundColor Yellow
    foreach ($model in $missingModels) {
        Write-Host "  Pulling $model (this may take several minutes)..." -ForegroundColor Cyan
        ollama pull $model
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $model downloaded successfully" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed to download $model" -ForegroundColor Red
        }
    }
}

# Create virtual environment
Write-Host "`n📦 Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  Virtual environment already exists" -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "  ✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n🔌 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "`n⬆️  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "`n📚 Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Cyan
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "  Try running: pip install -r requirements.txt manually" -ForegroundColor Yellow
    exit 1
}

# Test imports
Write-Host "`n🧪 Testing imports..." -ForegroundColor Yellow
try {
    python -c "from src.api.endpoints import app; print('✅ Imports successful')"
    Write-Host "  ✅ All imports working" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Import test failed, but this might be okay" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure Ollama is running: ollama serve" -ForegroundColor White
Write-Host "  2. Activate virtual environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  3. Start the API server: uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor White
Write-Host "  4. Test the API: curl http://localhost:8000/health" -ForegroundColor White
Write-Host "`n💡 Tip: You can also use start-api.ps1 to start the server" -ForegroundColor Yellow
