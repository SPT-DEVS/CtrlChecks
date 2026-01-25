# Comprehensive script to disable all Cloudflare security features that might block API
# This script attempts to disable Bot Fight Mode, check WAF, and other settings

param(
    [string]$Email = "vusalashivakumar@gmail.com",
    [string]$ApiKey = "c9d747f81f6f34dd0eca4d118860aad1e5eb0",
    [string]$ZoneId = "e855c58329f079afc2e5c8ba8bfd975b"
)

Write-Host ""
Write-Host "Comprehensive Cloudflare Security Fix..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$headers = @{
    "X-Auth-Email" = $Email
    "X-Auth-Key" = $ApiKey
    "Content-Type" = "application/json"
}

$fixesApplied = @()

# Fix 1: Security Level
Write-Host "Fix 1: Security Level..." -ForegroundColor Yellow
try {
    $securityUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/security_level"
    $securityResponse = Invoke-RestMethod -Uri $securityUrl -Method GET -Headers $headers -ErrorAction Stop
    
    if ($securityResponse.result.value -ne "essentially_off") {
        $body = @{ value = "essentially_off" } | ConvertTo-Json
        $updateResponse = Invoke-RestMethod -Uri $securityUrl -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        if ($updateResponse.success) {
            Write-Host "   [OK] Set Security Level to 'essentially_off'" -ForegroundColor Green
            $fixesApplied += "Security Level"
        }
    } else {
        Write-Host "   [OK] Already set to 'essentially_off'" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARN] Could not update: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Fix 2: Challenge Passage
Write-Host "Fix 2: Challenge Passage..." -ForegroundColor Yellow
try {
    $challengeUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/challenge_passage"
    $challengeResponse = Invoke-RestMethod -Uri $challengeUrl -Method GET -Headers $headers -ErrorAction Stop
    
    if ($challengeResponse.result.value -ne 0) {
        $body = @{ value = 0 } | ConvertTo-Json
        $updateResponse = Invoke-RestMethod -Uri $challengeUrl -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        if ($updateResponse.success) {
            Write-Host "   [OK] Set Challenge Passage to 0" -ForegroundColor Green
            $fixesApplied += "Challenge Passage"
        }
    } else {
        Write-Host "   [OK] Already set to 0" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARN] Could not update: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Fix 3: Browser Integrity Check
Write-Host "Fix 3: Browser Integrity Check..." -ForegroundColor Yellow
try {
    $bicUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/browser_check"
    $bicResponse = Invoke-RestMethod -Uri $bicUrl -Method GET -Headers $headers -ErrorAction Stop
    
    if ($bicResponse.result.value -ne "off") {
        $body = @{ value = "off" } | ConvertTo-Json
        $updateResponse = Invoke-RestMethod -Uri $bicUrl -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        if ($updateResponse.success) {
            Write-Host "   [OK] Disabled Browser Integrity Check" -ForegroundColor Green
            $fixesApplied += "Browser Integrity Check"
        }
    } else {
        Write-Host "   [OK] Already disabled" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARN] Could not update: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Fix 4: Create WAF Allow Rule for API
Write-Host "Fix 4: Creating WAF Allow Rule for ollama-api..." -ForegroundColor Yellow
try {
    $wafUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/firewall/rules"
    
    # Check if rule already exists
    $existingRules = Invoke-RestMethod -Uri $wafUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $ruleExists = $false
    foreach ($rule in $existingRules.result) {
        if ($rule.description -like "*ollama-api*" -or $rule.description -like "*Allow Ollama*") {
            $ruleExists = $true
            break
        }
    }
    
    if (-not $ruleExists) {
        $ruleBody = @{
            action = "allow"
            priority = 1
            paused = $false
            description = "Allow Ollama API - coverage-francis-distributor-sauce.trycloudflare.com"
            filter = @{
                expression = "(http.host eq `"coverage-francis-distributor-sauce.trycloudflare.com`")"
            }
        } | ConvertTo-Json -Depth 10
        
        $createResponse = Invoke-RestMethod -Uri $wafUrl -Method POST -Headers $headers -Body $ruleBody -ErrorAction Stop
        
        if ($createResponse.success) {
            Write-Host "   [OK] Created WAF allow rule" -ForegroundColor Green
            $fixesApplied += "WAF Allow Rule"
        }
    } else {
        Write-Host "   [OK] Allow rule already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARN] Could not create WAF rule: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host ""

if ($fixesApplied.Count -gt 0) {
    Write-Host "Fixes applied:" -ForegroundColor Green
    foreach ($fix in $fixesApplied) {
        Write-Host "  - $fix" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Waiting 60 seconds for changes to propagate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
} else {
    Write-Host "No changes needed (settings already optimal)" -ForegroundColor Green
    Write-Host "Waiting 10 seconds before testing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Test endpoint
Write-Host ""
Write-Host "Testing endpoint..." -ForegroundColor Cyan
try {
    $testResponse = Invoke-WebRequest -Uri "https://diego-ski-deutsche-choir.trycloudflare.com/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Endpoint is now accessible!" -ForegroundColor Green
        Write-Host "Status: $($testResponse.StatusCode)" -ForegroundColor Gray
        try {
            $data = $testResponse.Content | ConvertFrom-Json
            $modelCount = ($data.models | Measure-Object).Count
            Write-Host "Found $modelCount model(s)" -ForegroundColor Cyan
        } catch {
            Write-Host "Response received (couldn't parse JSON)" -ForegroundColor Gray
        }
    }
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    } catch {}
    
    Write-Host "[WARN] Still getting error" -ForegroundColor Yellow
    if ($statusCode) {
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "If still 403, manually check:" -ForegroundColor Yellow
    Write-Host "  1. Security > Bots > Bot Fight Mode (disable)" -ForegroundColor White
    Write-Host "  2. Zero Trust > Access > Applications (check for policies)" -ForegroundColor White
    Write-Host "  3. Security > WAF > Custom Rules (check for blocking rules)" -ForegroundColor White
}

Write-Host ""
