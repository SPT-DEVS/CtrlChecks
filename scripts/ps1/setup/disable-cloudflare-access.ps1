# Disable Cloudflare Access for coverage-francis-distributor-sauce.trycloudflare.com using Cloudflare API
# This script removes Access protection so the API is publicly accessible

param(
    [string]$ApiToken = "",
    [string]$ApiKey = "",
    [string]$Email = "",
    [string]$ZoneId = "e855c58329f079afc2e5c8ba8bfd975b",
    [string]$AccountId = "201625088e5bc6142832014d02731ada",
    [string]$Hostname = "coverage-francis-distributor-sauce.trycloudflare.com"
)

Write-Host ""
Write-Host "Disabling Cloudflare Access for $Hostname..." -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

# Step 1: Get API Credentials
$useGlobalKey = $false

if ([string]::IsNullOrWhiteSpace($ApiToken) -and [string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Host "Step 1: Cloudflare API Credentials Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: API Token (Recommended - More Secure)" -ForegroundColor Cyan
    Write-Host "  Get from: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Global API Key (Less Secure)" -ForegroundColor Cyan
    Write-Host "  Get from: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor White
    Write-Host "  (Scroll down to 'API Keys' section)" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Use API Token (1) or Global API Key (2)? [1]"
    
    if ($choice -eq "2") {
        $useGlobalKey = $true
        if ([string]::IsNullOrWhiteSpace($Email)) {
            $Email = Read-Host "Enter your Cloudflare account email"
        }
        if ([string]::IsNullOrWhiteSpace($ApiKey)) {
            $ApiKey = Read-Host "Enter your Global API Key" -AsSecureString
            $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiKey)
            )
        }
    } else {
        $ApiToken = Read-Host "Enter your Cloudflare API Token" -AsSecureString
        $ApiToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiToken)
        )
    }
}

# Use provided Global API Key if available
if ([string]::IsNullOrWhiteSpace($ApiToken) -and -not [string]::IsNullOrWhiteSpace($ApiKey)) {
    $useGlobalKey = $true
    if ([string]::IsNullOrWhiteSpace($Email)) {
        Write-Host "Email required for Global API Key" -ForegroundColor Yellow
        $Email = Read-Host "Enter your Cloudflare account email"
    }
}

if ($useGlobalKey) {
    if ([string]::IsNullOrWhiteSpace($ApiKey) -or [string]::IsNullOrWhiteSpace($Email)) {
        Write-Host "[FAIL] Global API Key and Email are required" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Using Global API Key" -ForegroundColor Green
} else {
    if ([string]::IsNullOrWhiteSpace($ApiToken)) {
        Write-Host "[FAIL] API Token is required" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Using API Token" -ForegroundColor Green
}
Write-Host ""

# Step 2: List Access Applications
Write-Host "Step 2: Finding Access Application..." -ForegroundColor Yellow

if ($useGlobalKey) {
    $headers = @{
        "X-Auth-Email" = $Email
        "X-Auth-Key" = $ApiKey
        "Content-Type" = "application/json"
    }
} else {
    $headers = @{
        "Authorization" = "Bearer $ApiToken"
        "Content-Type" = "application/json"
    }
}

try {
    # List all Access applications
    $listUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/access/apps"
    $listResponse = Invoke-RestMethod -Uri $listUrl -Method GET -Headers $headers -ErrorAction Stop
    
    $app = $null
    foreach ($application in $listResponse.result) {
        # Check if any domain matches our hostname
        if ($application.domains -contains $Hostname) {
            $app = $application
            break
        }
    }
    
    if ($app) {
        Write-Host "[OK] Found Access Application: $($app.name)" -ForegroundColor Green
        Write-Host "     Application ID: $($app.id)" -ForegroundColor Gray
        Write-Host "     Domains: $($app.domains -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "[INFO] No Access Application found for $Hostname" -ForegroundColor Yellow
        Write-Host "       Access might already be disabled or not configured." -ForegroundColor Gray
        Write-Host ""
        Write-Host "Testing endpoint..." -ForegroundColor Cyan
        try {
            $testResponse = Invoke-WebRequest -Uri "https://$Hostname/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($testResponse.StatusCode -eq 200) {
                Write-Host "[OK] Endpoint is accessible! Access is already disabled." -ForegroundColor Green
                exit 0
            }
        } catch {
            Write-Host "[WARN] Endpoint still returns error. Check manually in dashboard." -ForegroundColor Yellow
        }
        exit 0
    }
}
catch {
    Write-Host "[FAIL] Error listing Access applications" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host ""
        Write-Host "API Token is invalid or doesn't have required permissions." -ForegroundColor Yellow
        Write-Host "Make sure your token has 'Cloudflare Zero Trust:Edit' permission." -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""

# Step 3: Delete Access Application
Write-Host "Step 3: Deleting Access Application..." -ForegroundColor Yellow
Write-Host "       This will make $Hostname publicly accessible." -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

try {
    $deleteUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/access/apps/$($app.id)"
    $deleteResponse = Invoke-RestMethod -Uri $deleteUrl -Method DELETE -Headers $headers -ErrorAction Stop
    
    if ($deleteResponse.success) {
        Write-Host "[OK] Access Application deleted successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Waiting 30 seconds for changes to propagate..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } else {
        Write-Host "[FAIL] Failed to delete Access Application" -ForegroundColor Red
        Write-Host "Response: $($deleteResponse | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[FAIL] Error deleting Access Application" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "Response: $errorText" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Test endpoint
Write-Host ""
Write-Host "Step 4: Testing endpoint..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "https://$Hostname/api/tags" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "[OK] Endpoint is now accessible!" -ForegroundColor Green
        Write-Host "     Status: $($testResponse.StatusCode)" -ForegroundColor Gray
        try {
            $data = $testResponse.Content | ConvertFrom-Json
            $modelCount = ($data.models | Measure-Object).Count
            Write-Host "     Found $modelCount model(s)" -ForegroundColor Cyan
        } catch {
            Write-Host "     Response received (couldn't parse JSON)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[WARN] Endpoint returned status: $($testResponse.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    $statusCode = $null
    try {
        $statusCode = $_.Exception.Response.StatusCode.value__
    } catch {}
    
    if ($statusCode -eq 403) {
        Write-Host "[WARN] Still getting 403. Changes may take a few minutes to propagate." -ForegroundColor Yellow
        Write-Host "       Wait 2-3 minutes and test again." -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Endpoint test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Access Application deleted" -ForegroundColor Green
Write-Host "[OK] $Hostname should now be publicly accessible" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 1-2 minutes for changes to fully propagate" -ForegroundColor White
Write-Host "  2. Test: curl https://$Hostname/api/tags" -ForegroundColor White
Write-Host "  3. Run: .\scripts\ps1\test\test-cloudflare-tunnel.ps1" -ForegroundColor White
Write-Host ""
