# Check Cloudflare Access and WAF settings
# Lists all Access applications and checks what might be blocking

param(
    [string]$Email = "vusalashivakumar@gmail.com",
    [string]$ApiKey = "c9d747f81f6f34dd0eca4d118860aad1e5eb0",
    [string]$AccountId = "201625088e5bc6142832014d02731ada",
    [string]$ZoneId = "e855c58329f079afc2e5c8ba8bfd975b",
    [string]$Hostname = "coverage-francis-distributor-sauce.trycloudflare.com"
)

Write-Host ""
Write-Host "Checking Cloudflare Access and Security Settings..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$headers = @{
    "X-Auth-Email" = $Email
    "X-Auth-Key" = $ApiKey
    "Content-Type" = "application/json"
}

# Step 1: List ALL Access Applications
Write-Host "Step 1: Listing all Access Applications..." -ForegroundColor Yellow
try {
    $listUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/access/apps"
    $listResponse = Invoke-RestMethod -Uri $listUrl -Method GET -Headers $headers -ErrorAction Stop
    
    if ($listResponse.result.Count -eq 0) {
        Write-Host "   [INFO] No Access Applications found" -ForegroundColor Yellow
    } else {
        Write-Host "   Found $($listResponse.result.Count) Access Application(s):" -ForegroundColor Green
        foreach ($app in $listResponse.result) {
            Write-Host "     - $($app.name) (ID: $($app.id))" -ForegroundColor Gray
            Write-Host "       Domains: $($app.domains -join ', ')" -ForegroundColor Gray
            if ($app.domains -contains $Hostname) {
                Write-Host "       [MATCH] This application affects $Hostname" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    Write-Host "   [FAIL] Error listing Access applications: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 2: Check WAF Rules
Write-Host "Step 2: Checking WAF Rules..." -ForegroundColor Yellow
try {
    $wafUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/firewall/rules"
    $wafResponse = Invoke-RestMethod -Uri $wafUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $blockingRules = $wafResponse.result | Where-Object { 
        $_.action -eq "block" -or $_.action -eq "challenge" 
    }
    
    if ($blockingRules.Count -eq 0) {
        Write-Host "   [OK] No blocking WAF rules found" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Found $($blockingRules.Count) blocking/challenge rule(s)" -ForegroundColor Yellow
        foreach ($rule in $blockingRules) {
            Write-Host "     - Rule: $($rule.description)" -ForegroundColor Gray
            Write-Host "       Action: $($rule.action)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "   [WARN] Could not check WAF rules: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check Security Level
Write-Host "Step 3: Checking Security Settings..." -ForegroundColor Yellow
try {
    $securityUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/settings/security_level"
    $securityResponse = Invoke-RestMethod -Uri $securityUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $level = $securityResponse.result.value
    Write-Host "   Security Level: $level" -ForegroundColor $(if ($level -eq "essentially_off") { "Green" } else { "Yellow" })
    
    if ($level -ne "essentially_off") {
        Write-Host "   [INFO] Security level is not 'essentially_off'" -ForegroundColor Yellow
        Write-Host "         This might be blocking some requests." -ForegroundColor Gray
    }
}
catch {
    Write-Host "   [WARN] Could not check security level: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Test endpoint and check response
Write-Host "Step 4: Testing endpoint..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://$Hostname/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   [OK] Endpoint is accessible!" -ForegroundColor Green
    Write-Host "   Status: $($testResponse.StatusCode)" -ForegroundColor Gray
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    } catch {}
    
    Write-Host "   [FAIL] Endpoint returned error" -ForegroundColor Red
    if ($statusCode) {
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 403) {
            Write-Host ""
            Write-Host "   403 Forbidden - Possible causes:" -ForegroundColor Yellow
            Write-Host "   1. Cloudflare Access (even if not listed, might be domain-wide)" -ForegroundColor White
            Write-Host "   2. WAF rules blocking the request" -ForegroundColor White
            Write-Host "   3. Bot Fight Mode blocking automated requests" -ForegroundColor White
            Write-Host "   4. Security level set too high" -ForegroundColor White
        }
    }
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 5: Check DNS record
Write-Host "Step 5: Checking DNS record..." -ForegroundColor Yellow
try {
    $dnsUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records?name=coverage-francis-distributor-sauce.trycloudflare.com"
    $dnsResponse = Invoke-RestMethod -Uri $dnsUrl -Method GET -Headers $headers -ErrorAction Stop
    
    if ($dnsResponse.result.Count -gt 0) {
        $record = $dnsResponse.result[0]
        Write-Host "   [OK] DNS record found" -ForegroundColor Green
        Write-Host "   Type: $($record.type)" -ForegroundColor Gray
        Write-Host "   Content: $($record.content)" -ForegroundColor Gray
        Write-Host "   Proxied: $($record.proxied)" -ForegroundColor Gray
        
        if (-not $record.proxied) {
            Write-Host "   [WARN] DNS record is not proxied (orange cloud)" -ForegroundColor Yellow
            Write-Host "         This means Cloudflare features won't work" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [FAIL] DNS record not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "   [WARN] Could not check DNS: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "If endpoint still returns 403, try:" -ForegroundColor Yellow
Write-Host "  1. Check Cloudflare Dashboard manually" -ForegroundColor White
Write-Host "  2. Go to Security > WAF and disable temporarily" -ForegroundColor White
Write-Host "  3. Go to Security > Settings and set Security Level to 'Essentially Off'" -ForegroundColor White
Write-Host "  4. Check Zero Trust > Access > Applications for any domain-wide policies" -ForegroundColor White
Write-Host ""
