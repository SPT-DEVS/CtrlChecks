# Fix Cloudflare Security Settings that might be blocking requests
# Sets Security Level to "essentially_off" to allow API access

param(
    [string]$Email = "vusalashivakumar@gmail.com",
    [string]$ApiKey = "c9d747f81f6f34dd0eca4d118860aad1e5eb0",
    [string]$ZoneId = "e855c58329f079afc2e5c8ba8bfd975b"
)

Write-Host ""
Write-Host "Fixing Cloudflare Security Settings..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$headers = @{
    "X-Auth-Email" = $Email
    "X-Auth-Key" = $ApiKey
    "Content-Type" = "application/json"
}

# Step 1: Check current security level
Write-Host "Step 1: Checking current Security Level..." -ForegroundColor Yellow
try {
    $securityUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/security_level"
    $securityResponse = Invoke-RestMethod -Uri $securityUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $currentLevel = $securityResponse.result.value
    Write-Host "   Current Security Level: $currentLevel" -ForegroundColor $(if ($currentLevel -eq "essentially_off") { "Green" } else { "Yellow" })
    
    if ($currentLevel -eq "essentially_off") {
        Write-Host "   [OK] Security level is already 'essentially_off'" -ForegroundColor Green
        Write-Host "   No changes needed." -ForegroundColor Gray
        exit 0
    }
}
catch {
    Write-Host "   [FAIL] Could not check security level: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Set security level to essentially_off
Write-Host "Step 2: Setting Security Level to 'essentially_off'..." -ForegroundColor Yellow
Write-Host "   This will allow API requests without Cloudflare challenges." -ForegroundColor Gray
Write-Host ""

try {
    $updateUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/security_level"
    $body = @{
        value = "essentially_off"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-RestMethod -Uri $updateUrl -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
    
    if ($updateResponse.success) {
        Write-Host "   [OK] Security Level updated to 'essentially_off'" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Failed to update Security Level" -ForegroundColor Red
        Write-Host "   Response: $($updateResponse | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "   [FAIL] Error updating Security Level: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorText = $reader.ReadToEnd()
            Write-Host "   Response: $errorText" -ForegroundColor Red
        } catch {}
    }
    exit 1
}

Write-Host ""
Write-Host "Waiting 30 seconds for changes to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 3: Test endpoint
Write-Host ""
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
    } else {
        Write-Host "   [WARN] Endpoint returned status: $($testResponse.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    } catch {}
    
    if ($statusCode -eq 403) {
        Write-Host "   [WARN] Still getting 403. There might be other settings blocking." -ForegroundColor Yellow
        Write-Host "   Check:" -ForegroundColor White
        Write-Host "   1. Security > Bot Fight Mode (disable if enabled)" -ForegroundColor White
        Write-Host "   2. Zero Trust > Access > Applications (check for domain-wide policies)" -ForegroundColor White
        Write-Host "   3. Security > WAF (check custom rules)" -ForegroundColor White
    } else {
        Write-Host "   [WARN] Endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($statusCode) {
            Write-Host "   Status Code: $statusCode" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Security Level set to 'essentially_off'" -ForegroundColor Green
Write-Host "[OK] API should now be accessible" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test: curl https://diego-ski-deutsche-choir.trycloudflare.com/api/tags" -ForegroundColor White
Write-Host "  2. Run: .\scripts\ps1\test\test-cloudflare-tunnel.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Note: If you still get 403, check Bot Fight Mode in Security settings." -ForegroundColor Gray
Write-Host ""
