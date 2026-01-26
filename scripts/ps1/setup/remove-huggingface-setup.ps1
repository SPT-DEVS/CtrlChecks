# Remove Hugging Face Dependencies and Use Only Ollama
# This script removes Hugging Face packages and sets up Ollama-only configuration

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Removing Hugging Face Dependencies" -ForegroundColor Cyan
Write-Host "Switching to Ollama-only Models" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Pull required Ollama models
Write-Host "1. Pulling Ollama models..." -ForegroundColor Yellow

# llava:13b (already pulled, but verify)
Write-Host "   Checking llava:13b..." -ForegroundColor Cyan
$llava13b = ollama list | Select-String "llava:13b"
if ($llava13b) {
    Write-Host "   llava:13b - Already installed" -ForegroundColor Green
} else {
    Write-Host "   Pulling llava:13b..." -ForegroundColor Yellow
    ollama pull llava:13b
}

# Try qwen2.5-vl (qwen-vl doesn't exist)
Write-Host "   Trying qwen2.5-vl (qwen-vl doesn't exist)..." -ForegroundColor Cyan
ollama pull qwen2.5-vl 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   qwen2.5-vl - Installed" -ForegroundColor Green
} else {
    Write-Host "   qwen2.5-vl - Not available in Ollama (this is normal)" -ForegroundColor Yellow
}

# Note about whisper
Write-Host "   Note: whisper doesn't exist in Ollama" -ForegroundColor Yellow
Write-Host "   Audio processing will use alternative methods" -ForegroundColor Yellow

Write-Host ""

# 2. Update requirements.txt to remove Hugging Face packages (if needed)
Write-Host "2. Checking requirements files..." -ForegroundColor Yellow
$reqPath = "..\Fast_API_Ollama\requirements.txt"
if (Test-Path $reqPath) {
    $content = Get-Content $reqPath -Raw
    # Comment out Hugging Face dependencies
    $content = $content -replace "transformers>=4.35.0", "# transformers>=4.35.0  # Removed - using Ollama instead"
    $content = $content -replace "diffusers>=0.21.0", "# diffusers>=0.21.0  # Removed - Ollama doesn't support text-to-image"
    $content = $content -replace "huggingface_hub>=0.20.0", "# huggingface_hub>=0.20.0  # Removed - using Ollama instead"
    $content = $content -replace "accelerate>=0.24.0", "# accelerate>=0.24.0  # Only needed for transformers/diffusers"
    
    Set-Content -Path $reqPath -Value $content -Encoding UTF8
    Write-Host "   requirements.txt updated (Hugging Face packages commented out)" -ForegroundColor Green
} else {
    Write-Host "   requirements.txt not found" -ForegroundColor Yellow
}

Write-Host ""

# 3. Create updated requirements-ollama-only.txt
Write-Host "3. Creating Ollama-only requirements file..." -ForegroundColor Yellow
$ollamaOnlyReqs = @"
# CtrlChecks Multimodal AI Backend Requirements - Ollama Only
# Python 3.9+

# Web Framework
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0

# Note: Removed Hugging Face dependencies (transformers, diffusers, huggingface_hub)
# All processing now uses Ollama models via API

# Image Processing (basic PIL operations)
Pillow>=10.0.0

# Audio Processing (basic libraries)
soundfile>=0.12.0
librosa>=0.10.0
scipy>=1.10.0
numpy>=1.24.0

# Environment variable management
python-dotenv>=1.0.0

# HTTP client for async requests (for Ollama API)
aiohttp>=3.9.0

# Note: torch is kept for potential future use but not required for Ollama
# torch>=2.0.0  # Optional - only if needed for other features
"@

$newReqPath = "..\Fast_API_Ollama\requirements-ollama-only.txt"
Set-Content -Path $newReqPath -Value $ollamaOnlyReqs -Encoding UTF8
Write-Host "   Created: requirements-ollama-only.txt" -ForegroundColor Green

Write-Host ""

# 4. Summary
Write-Host "====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installed Ollama Models:" -ForegroundColor Cyan
ollama list | Select-String -Pattern "llava|mistral|qwen" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }

Write-Host ""
Write-Host "Notes:" -ForegroundColor Yellow
Write-Host "  - qwen-vl doesn't exist - correct name is qwen2.5-vl (if available)" -ForegroundColor White
Write-Host "  - whisper doesn't exist in Ollama - audio uses alternative methods" -ForegroundColor White
Write-Host "  - Text-to-image generation requires Hugging Face (Ollama doesn't support it)" -ForegroundColor White
Write-Host "  - Text and Image processing now use Ollama only" -ForegroundColor White
Write-Host ""
Write-Host "To install Ollama-only dependencies:" -ForegroundColor Cyan
Write-Host "  cd ..\Fast_API_Ollama" -ForegroundColor White
Write-Host "  pip install -r requirements-ollama-only.txt" -ForegroundColor White
Write-Host ""
Write-Host "Note: Fast_API_Ollama already uses Ollama only - this script may not be needed." -ForegroundColor Yellow