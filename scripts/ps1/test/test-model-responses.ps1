# Test Model Response Debugging Script
# This script tests the actual API endpoints and logs full responses

Write-Host "=== Testing Model API Responses ===" -ForegroundColor Cyan
Write-Host ""

$ollamaUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ollamaUrl/health" -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "   [OK] Health check passed: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: List Models
Write-Host "`n2. Testing Models Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ollamaUrl/models" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Models endpoint working" -ForegroundColor Green
        $models = $response.Content | ConvertFrom-Json
        Write-Host "   Available models: $($models.Count)" -ForegroundColor Gray
        foreach ($model in $models) {
            Write-Host "     - $($model.name)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Models endpoint failed: $_" -ForegroundColor Red
}

# Test 3: Chat Completion - Full Response Logging
Write-Host "`n3. Testing Chat Completion Endpoint (with full response logging)..." -ForegroundColor Yellow
try {
    $body = @{
        model = "qwen2_5_7b"
        messages = @(
            @{
                role = "user"
                content = "Say hello in one sentence."
            }
        )
        temperature = 0.7
        max_tokens = 50
    } | ConvertTo-Json -Depth 10
    
    Write-Host "   Request body:" -ForegroundColor Cyan
    Write-Host "   $body" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri "$ollamaUrl/chat/completions" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 60
    
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "   Full Response:" -ForegroundColor Cyan
    Write-Host "   $($response.Content)" -ForegroundColor Gray
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host "`n   Parsed Response Structure:" -ForegroundColor Cyan
        Write-Host "   - Has 'choices': $($result.choices -ne $null)" -ForegroundColor Gray
        if ($result.choices) {
            Write-Host "   - Choices count: $($result.choices.Count)" -ForegroundColor Gray
            if ($result.choices.Count -gt 0) {
                Write-Host "   - First choice has 'message': $($result.choices[0].message -ne $null)" -ForegroundColor Gray
                if ($result.choices[0].message) {
                    Write-Host "   - Message has 'content': $($result.choices[0].message.content -ne $null)" -ForegroundColor Gray
                    if ($result.choices[0].message.content) {
                        $content = $result.choices[0].message.content
                        Write-Host "   [OK] Content extracted successfully!" -ForegroundColor Green
                        Write-Host "   Content length: $($content.Length)" -ForegroundColor Gray
                        Write-Host "   Content preview: $($content.Substring(0, [Math]::Min(100, $content.Length)))" -ForegroundColor Gray
                    } else {
                        Write-Host "   [FAIL] Content is empty or null!" -ForegroundColor Red
                    }
                } else {
                    Write-Host "   [FAIL] Message is null!" -ForegroundColor Red
                }
            } else {
                Write-Host "   [FAIL] Choices array is empty!" -ForegroundColor Red
            }
        } else {
            Write-Host "   [FAIL] Response has no 'choices' field!" -ForegroundColor Red
            Write-Host "   Available fields: $($result.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   [FAIL] Chat completion failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error response: $responseBody" -ForegroundColor Red
    }
}

# Test 4a: Quick JSON test (smaller response)
Write-Host "`n4a. Testing Quick JSON Response (smaller prompt)..." -ForegroundColor Yellow
try {
    $body = @{
        model = "qwen2_5_7b"
        messages = @(
            @{
                role = "user"
                content = "Return a JSON object with 'name' field set to 'test' and 'nodes' as empty array."
            }
        )
        temperature = 0.7
        max_tokens = 50
    } | ConvertTo-Json -Depth 10
    
    Write-Host "   Sending quick test..." -ForegroundColor Cyan
    $startTime = Get-Date
    
    $response = Invoke-WebRequest -Uri "$ollamaUrl/chat/completions" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 60
    
    $duration = (Get-Date) - $startTime
    Write-Host "   Response received in $([Math]::Round($duration.TotalSeconds, 1)) seconds" -ForegroundColor Gray
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        if ($result.choices -and $result.choices.Count -gt 0 -and $result.choices[0].message.content) {
            $content = $result.choices[0].message.content
            Write-Host "   [OK] Quick test passed, content: $($content.Substring(0, [Math]::Min(100, $content.Length)))" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   [WARN] Quick test failed: $_" -ForegroundColor Yellow
}

# Test 4b: Test with longer prompt (like workflow generation)
Write-Host "`n4b. Testing Chat Completion with Workflow-like Prompt..." -ForegroundColor Yellow
Write-Host "   Note: This may take 60-180 seconds for complex responses..." -ForegroundColor Gray
try {
    $body = @{
        model = "qwen2_5_7b"
        messages = @(
            @{
                role = "system"
                content = "You are a workflow construction agent. Return ONLY valid JSON with 'nodes' and 'edges' arrays."
            },
            @{
                role = "user"
                content = "Create a simple workflow for chatbot"
            }
        )
        temperature = 0.7
        max_tokens = 300
    } | ConvertTo-Json -Depth 10
    
    Write-Host "   Sending request (timeout: 180 seconds)..." -ForegroundColor Cyan
    $startTime = Get-Date
    
    $response = Invoke-WebRequest -Uri "$ollamaUrl/chat/completions" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 180
    
    $duration = (Get-Date) - $startTime
    Write-Host "   Response received in $([Math]::Round($duration.TotalSeconds, 1)) seconds" -ForegroundColor Gray
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        Write-Host "   [OK] Request completed" -ForegroundColor Green
        
        if ($result.choices -and $result.choices.Count -gt 0 -and $result.choices[0].message.content) {
            $content = $result.choices[0].message.content
            Write-Host "   Content length: $($content.Length)" -ForegroundColor Gray
            Write-Host "   Content preview: $($content.Substring(0, [Math]::Min(300, $content.Length)))" -ForegroundColor Gray
            
            # Check if it's valid JSON
            try {
                $jsonContent = $content | ConvertFrom-Json
                Write-Host "   [OK] Response is valid JSON" -ForegroundColor Green
                
                # Check for correct format
                if ($jsonContent.nodes) {
                    Write-Host "   [OK] Has 'nodes' array" -ForegroundColor Green
                } else {
                    Write-Host "   [WARN] Missing 'nodes' array" -ForegroundColor Yellow
                }
                
                if ($jsonContent.edges) {
                    Write-Host "   [OK] Has 'edges' array" -ForegroundColor Green
                } else {
                    Write-Host "   [WARN] Missing 'edges' array" -ForegroundColor Yellow
                }
                
                if ($jsonContent.workflow -and $jsonContent.workflow.steps) {
                    Write-Host "   [ERROR] Model returned 'steps' instead of 'nodes' and 'edges'!" -ForegroundColor Red
                }
            } catch {
                Write-Host "   [WARN] Response is not valid JSON: $_" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   [FAIL] Could not extract content from response!" -ForegroundColor Red
            Write-Host "   Response structure: $($result | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
        }
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "   [FAIL] Test failed: $errorMsg" -ForegroundColor Red
    
    if ($errorMsg -like "*timeout*" -or $errorMsg -like "*timed out*") {
        Write-Host "   [INFO] Request timed out after 180 seconds" -ForegroundColor Yellow
        Write-Host "   [INFO] This could mean:" -ForegroundColor Yellow
        Write-Host "      - Model is processing a complex request" -ForegroundColor Gray
        Write-Host "      - Network/Cloudflare tunnel is slow" -ForegroundColor Gray
        Write-Host "      - Backend is overloaded" -ForegroundColor Gray
        Write-Host "   [INFO] Try reducing max_tokens or simplifying the prompt" -ForegroundColor Cyan
    } elseif ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
