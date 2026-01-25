# Pull Required Ollama Models for Multimodal Backend
# This script pulls all models needed for image, text, and audio processing

Write-Host "🔍 Pulling Ollama Models for Multimodal Backend..." -ForegroundColor Cyan
Write-Host ""

# Define models to pull
$models = @(
    @{Name="llava"; Description="Vision model for image captioning"; Status="pending"},
    @{Name="qwen2.5-vl"; Description="Vision model alternative"; Status="pending"},
    @{Name="mistral:7b"; Description="Text model (default)"; Status="pending"},
    @{Name="qwen2.5:7b"; Description="Text model alternative"; Status="pending"},
    @{Name="llama3:8b"; Description="Text model alternative"; Status="pending"}
)

$successCount = 0
$failCount = 0

foreach ($model in $models) {
    Write-Host "📥 Pulling $($model.Name)..." -ForegroundColor Yellow
    Write-Host "   Description: $($model.Description)" -ForegroundColor Gray
    
    try {
        $output = ollama pull $model.Name 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Successfully pulled $($model.Name)" -ForegroundColor Green
            $model.Status = "success"
            $successCount++
        } else {
            Write-Host "   ❌ Failed to pull $($model.Name)" -ForegroundColor Red
            Write-Host "   Error: $($output -join ' ')" -ForegroundColor Red
            $model.Status = "failed"
            $failCount++
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $model.Status = "failed"
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

# Show what was pulled
Write-Host "📋 Models Status:" -ForegroundColor Cyan
foreach ($model in $models) {
    $statusIcon = if ($model.Status -eq "success") { "✅" } else { "❌" }
    Write-Host "   $statusIcon $($model.Name) - $($model.Description)" -ForegroundColor $(if ($model.Status -eq "success") { "Green" } else { "Red" })
}

Write-Host ""

# Note about audio models
Write-Host "💡 Note: Audio processing (Whisper) is handled differently:" -ForegroundColor Yellow
Write-Host "   - Whisper models are not available in Ollama" -ForegroundColor White
Write-Host "   - Audio transcription uses OpenAI Whisper or local MMS models" -ForegroundColor White
Write-Host "   - See audio_processor.py for audio implementation" -ForegroundColor White

Write-Host ""
Write-Host "✅ Model pulling complete!" -ForegroundColor Green
