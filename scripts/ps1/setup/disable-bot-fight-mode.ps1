# Disable Bot Fight Mode which might be blocking API requests

param(
    [string]$Email = "vusalashivakumar@gmail.com",
    [string]$ApiKey = "c9d747f81f6f34dd0eca4d118860aad1e5eb0",
    [string]$ZoneId = "e855c58329f079afc2e5c8ba8bfd975b"
)

Write-Host ""
Write-Host "Checking and Disabling Bot Fight Mode..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$headers = @{
    "X-Auth-Email" = $Email
    "X-Auth-Key" = $ApiKey
    "Content-Type" = "application/json"
}

# Check current Bot Fight Mode status
Write-Host "Step 1: Checking Bot Fight Mode status..." -ForegroundColor Yellow
try {
    $botUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/bot_fight_mode"
    $botResponse = Invoke-RestMethod -Uri $botUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $currentStatus = $botResponse.result.value
    Write-Host "   Current Bot Fight Mode: $currentStatus" -ForegroundColor $(if ($currentStatus -eq "off") { "Green" } else { "Yellow" })
    
    if ($currentStatus -eq "off") {
        Write-Host "   [OK] Bot Fight Mode is already disabled" -ForegroundColor Green
        Write-Host "   No changes needed." -ForegroundColor Gray
    } else {
        Write-Host "   [WARN] Bot Fight Mode is enabled - this might be blocking API requests" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Step 2: Disabling Bot Fight Mode..." -ForegroundColor Yellow
        
        $updateUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/bot_fight_mode"
        $body = @{
            value = "off"
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri $updateUrl -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        
        if ($updateResponse.success) {
            Write-Host "   [OK] Bot Fight Mode disabled" -ForegroundColor Green
            Write-Host ""
            Write-Host "Waiting 30 seconds for changes to propagate..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
        } else {
            Write-Host "   [FAIL] Failed to disable Bot Fight Mode" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   [WARN] Could not check/update Bot Fight Mode: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test endpoint
Write-Host "Step 3: Testing endpoint..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://diego-ski-deutsche-choir.trycloudflare.com/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Endpoint is now accessible!" -ForegroundColor Green
        Write-Host "   Status: $($testResponse.StatusCode)" -ForegroundColor Gray
        try {
            $data = $testResponse.Content | ConvertFrom-Json
            $modelCount = ($data.models | Measure-Object).Count
            Write-Host "   Found $modelCount model(s)" -ForegroundColor Cyan
        } catch {
            Write-Host "   Response received (couldn't parse JSON)" -ForegroundColor Gray
        }
    }
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    } catch {}
    
    if ($statusCode -eq 403) {
        Write-Host "   [WARN] Still getting 403. Check other settings:" -ForegroundColor Yellow
        Write-Host "   1. Security > WAF > Custom Rules" -ForegroundColor White
        Write-Host "   2. Zero Trust > Access > Applications (domain-wide)" -ForegroundColor White
        Write-Host "   3. Security > Settings > Challenge Passage" -ForegroundColor White
    } else {
        Write-Host "   [WARN] Endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "If still getting 403, manually check Cloudflare Dashboard:" -ForegroundColor Yellow
Write-Host "  Security > Bots > Bot Fight Mode (should be OFF)" -ForegroundColor White
Write-Host "  Security > WAF > Custom Rules (check for blocking rules)" -ForegroundColor White
Write-Host "  Zero Trust > Access > Applications (check for domain policies)" -ForegroundColor White
Write-Host ""
