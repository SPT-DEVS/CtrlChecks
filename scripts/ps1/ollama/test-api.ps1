# Test API Script
# Run this to test if the API is working

Write-Host "🧪 Testing Ollama API..." -ForegroundColor Cyan

# Test health endpoint
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $_" -ForegroundColor Red
    Write-Host "   Make sure the server is running!" -ForegroundColor Yellow
}

# Test models endpoint
Write-Host "`n2. Testing models endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/models" -Method GET -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Models endpoint failed: $_" -ForegroundColor Red
}

# Test completion endpoint
Write-Host "`n3. Testing completion endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        model = "mistral:7b"
        prompt = "Hello!"
        temperature = 0.7
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8000/completions" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Completion endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Testing complete!" -ForegroundColor Green
