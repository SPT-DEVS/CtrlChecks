# Test Ollama Integration Script
# Run this to verify Ollama is working in your project

Write-Host "Testing Ollama Integration..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Ollama Backend Health
Write-Host "1. Testing Ollama Backend (port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Ollama backend is running" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [FAIL] Ollama backend is NOT running" -ForegroundColor Red
    Write-Host "   Start it: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Yellow
}

# Test 2: List Models
Write-Host "`n2. Testing Models Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/models" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Models endpoint working" -ForegroundColor Green
        $models = $response.Content | ConvertFrom-Json
        Write-Host "   Available models: $($models.Count)" -ForegroundColor Gray
        foreach ($model in $models) {
            Write-Host "     - $($model.name) ($($model.id))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Models endpoint failed" -ForegroundColor Red
}

# Test 3: Completion Endpoint
Write-Host "`n3. Testing Completion Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        model = "mistral_7b"
        prompt = "Say hello in one sentence."
        temperature = 0.7
        max_tokens = 50
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8000/completions" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Completion endpoint working" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        if ($result.choices -and $result.choices.Count -gt 0) {
            Write-Host "   Response: $($result.choices[0].text)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Completion endpoint failed: $_" -ForegroundColor Red
}

# Test 4: Chat Endpoint
Write-Host "`n4. Testing Chat Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        model = "mistral_7b"
        messages = @(
            @{
                role = "user"
                content = "Hello! What is AI?"
            }
        )
        temperature = 0.7
        max_tokens = 100
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8000/chat/completions" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Chat endpoint working" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        if ($result.choices -and $result.choices.Count -gt 0) {
            $content = $result.choices[0].message.content
            $preview = if ($content.Length -gt 100) { $content.Substring(0, 100) + "..." } else { $content }
            Write-Host "   Response: $preview" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Chat endpoint failed: $_" -ForegroundColor Red
}

# Test 5: Python Backend
Write-Host "`n5. Testing Python Multimodal Backend (port 8501)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8501/health" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Python backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARN] Python backend is NOT running (optional for Ollama testing)" -ForegroundColor Yellow
    Write-Host "   Start it: cd ..\Fast_API_Ollama && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
}

# Test 6: Frontend
Write-Host "`n6. Testing Frontend (port 5173)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend is running" -ForegroundColor Green
        Write-Host "   Open: http://localhost:5173" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   [WARN] Frontend is NOT running" -ForegroundColor Yellow
    Write-Host "   Start it: npm run dev" -ForegroundColor Gray
}

# Test 7: Ollama Server
Write-Host "`n7. Testing Ollama Server (port 11434)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Ollama server is running" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        if ($data.models) {
            Write-Host "   Installed models: $($data.models.Count)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Ollama server is NOT running" -ForegroundColor Red
    Write-Host "   Start it: ollama serve (in a separate window)" -ForegroundColor Yellow
}

Write-Host "`n[OK] Testing Complete!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "   - Ollama Backend: http://localhost:8000" -ForegroundColor White
Write-Host "   - Python Backend: http://localhost:8501" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   - Ollama Server: http://localhost:11434" -ForegroundColor White
