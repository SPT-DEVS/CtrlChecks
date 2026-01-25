# Test Cloudflare Tunnel Connection
# Verifies that the tunnel is working and Ollama is accessible via HTTPS

Write-Host ""
Write-Host "Testing Cloudflare Tunnel Connection..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

$tunnelUrl = "https://diego-ski-deutsche-choir.trycloudflare.com"
$localUrl = "http://localhost:11434"

# Test 1: Check if Cloudflare Tunnel process is running
Write-Host "Test 1: Checking if Cloudflare Tunnel is running..." -ForegroundColor Yellow
$tunnelProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcess) {
    Write-Host "   [OK] Cloudflare Tunnel process found (PID: $($tunnelProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Cloudflare Tunnel process NOT found" -ForegroundColor Red
    Write-Host "   Start tunnel: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Check if Ollama service is running locally
Write-Host "Test 2: Checking if Ollama service is running locally..." -ForegroundColor Yellow
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "   [OK] Ollama process found (PID: $($ollamaProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Ollama process NOT found" -ForegroundColor Red
    Write-Host "   Start Ollama: ollama serve" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Test local Ollama endpoint
Write-Host "Test 3: Testing local Ollama endpoint ($localUrl)..." -ForegroundColor Yellow
$localWorking = $false
try {
    $localResponse = Invoke-WebRequest -Uri "$localUrl/api/tags" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($localResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Local Ollama is accessible" -ForegroundColor Green
        $localWorking = $true
        try {
            $localData = $localResponse.Content | ConvertFrom-Json
            $modelCount = ($localData.models | Measure-Object).Count
            Write-Host "   Found $modelCount model(s) locally" -ForegroundColor Cyan
        }
        catch {
            Write-Host "   [WARN] Response received but couldn't parse JSON" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [FAIL] Local Ollama returned status: $($localResponse.StatusCode)" -ForegroundColor Red
    }
}
catch {
    Write-Host "   [FAIL] Local Ollama is NOT accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure Ollama is running: ollama serve" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Test Cloudflare Tunnel endpoint (via HTTPS)
Write-Host "Test 4: Testing Cloudflare Tunnel endpoint ($tunnelUrl)..." -ForegroundColor Yellow
$tunnelWorking = $false
try {
    $tunnelResponse = Invoke-WebRequest -Uri "$tunnelUrl/api/tags" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($tunnelResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Cloudflare Tunnel is working!" -ForegroundColor Green
        $tunnelWorking = $true
        try {
            $tunnelData = $tunnelResponse.Content | ConvertFrom-Json
            $modelCount = ($tunnelData.models | Measure-Object).Count
            Write-Host "   Found $modelCount model(s) via tunnel" -ForegroundColor Cyan
        }
        catch {
            Write-Host "   [WARN] Response received but couldn't parse JSON" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [FAIL] Tunnel returned status: $($tunnelResponse.StatusCode)" -ForegroundColor Red
        Write-Host "   Check Cloudflare Dashboard for Access/WAF settings" -ForegroundColor Yellow
    }
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    catch {
        # Status code not available
    }
    $errorMsg = $_.Exception.Message
    
    if ($statusCode -eq 403) {
        Write-Host "   [FAIL] HTTP 403 Forbidden - Cloudflare is blocking the request" -ForegroundColor Red
        Write-Host "   Fix: Disable Cloudflare Access for coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor Yellow
        Write-Host "   See: FIX_CLOUDFLARE_403_ERROR.md" -ForegroundColor Yellow
    }
    elseif ($statusCode -eq 530) {
        Write-Host "   [FAIL] HTTP 530 - Cloudflare Tunnel is not running" -ForegroundColor Red
        Write-Host "   Fix: Start tunnel: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor Yellow
        Write-Host "   See: FIX_CLOUDFLARE_530_ERROR.md" -ForegroundColor Yellow
    }
    elseif ($statusCode -eq 404) {
        Write-Host "   [FAIL] HTTP 404 - Endpoint not found" -ForegroundColor Red
        Write-Host "   Check tunnel config: cloudflare-tunnel-config.yml" -ForegroundColor Yellow
    }
    else {
        Write-Host "   [FAIL] Tunnel error: $errorMsg" -ForegroundColor Red
        if ($statusCode) {
            Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Test 5: Test DNS resolution
Write-Host "Test 5: Testing DNS resolution..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name "coverage-francis-distributor-sauce.trycloudflare.com" -ErrorAction Stop
    if ($dnsResult) {
        Write-Host "   [OK] DNS resolution successful" -ForegroundColor Green
        $ips = $dnsResult | Where-Object { $_.Type -eq 'A' } | Select-Object -ExpandProperty IPAddress
        if ($ips) {
            Write-Host "   IP Address(es): $($ips -join ', ')" -ForegroundColor Cyan
            $isCloudflare = $ips | Where-Object { $_ -match '^(104\.|172\.64\.|172\.65\.|172\.67\.)' }
            if ($isCloudflare) {
                Write-Host "   [OK] Resolves to Cloudflare IP (tunnel configured)" -ForegroundColor Green
            } else {
                Write-Host "   [WARN] IP doesn't look like Cloudflare (may need DNS update)" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    Write-Host "   [FAIL] DNS resolution failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Check Cloudflare DNS settings" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host ""

$allTests = @(
    @{Name="Tunnel Process"; Status=($tunnelProcess -ne $null)},
    @{Name="Ollama Process"; Status=($ollamaProcess -ne $null)},
    @{Name="Local Ollama"; Status=$localWorking},
    @{Name="Tunnel Connection"; Status=$tunnelWorking}
)

foreach ($test in $allTests) {
    $icon = if ($test.Status) { "[OK]" } else { "[FAIL]" }
    $color = if ($test.Status) { "Green" } else { "Red" }
    Write-Host "   $icon $($test.Name)" -ForegroundColor $color
}

Write-Host ""

# Final recommendation
$allPassed = ($allTests | Where-Object { -not $_.Status }).Count -eq 0
if ($allPassed) {
    Write-Host "All tests passed! Cloudflare Tunnel is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Your backend should now be able to connect." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Please fix the issues above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Fixes:" -ForegroundColor Cyan
    if (-not $tunnelProcess) {
        Write-Host "   1. Start tunnel: .\scripts\ps1\start\start-cloudflare-tunnel.ps1" -ForegroundColor White
    }
    if (-not $ollamaProcess) {
        Write-Host "   2. Start Ollama: ollama serve" -ForegroundColor White
    }
    if ($tunnelProcess -and $ollamaProcess -and -not $tunnelWorking) {
        Write-Host "   3. Check Cloudflare Dashboard for Access/WAF settings" -ForegroundColor White
        Write-Host "   4. See: FIX_CLOUDFLARE_403_ERROR.md" -ForegroundColor White
    }
}

Write-Host ""
