# Cloudflare Tunnel Setup Script for Ollama API
# This script helps set up Cloudflare Tunnel to expose your local Ollama server globally

Write-Host "`n=== Cloudflare Tunnel Setup for Ollama API ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if cloudflared is installed
Write-Host "Step 1: Checking cloudflared installation..." -ForegroundColor Yellow
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "❌ cloudflared not found!" -ForegroundColor Red
    Write-Host "`nPlease install cloudflared:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://github.com/cloudflare/cloudflared/releases/latest" -ForegroundColor White
    Write-Host "  2. Extract cloudflared.exe" -ForegroundColor White
    Write-Host "  3. Add to PATH or place in project folder" -ForegroundColor White
    Write-Host "`nOr use Chocolatey: choco install cloudflared" -ForegroundColor White
    exit 1
}

Write-Host "✅ cloudflared found" -ForegroundColor Green

# Step 2: Login to Cloudflare
Write-Host "`nStep 2: Cloudflare Login" -ForegroundColor Yellow
Write-Host "This will open your browser to authorize the tunnel..." -ForegroundColor Gray
Write-Host "If this is your first time, select 'n' to login." -ForegroundColor Cyan
$login = Read-Host "Have you already logged in? (y/n)"
if ($login -ne "y") {
    Write-Host "`nOpening browser for Cloudflare login..." -ForegroundColor Yellow
    Write-Host "Please:" -ForegroundColor Cyan
    Write-Host "  1. Login to your Cloudflare account" -ForegroundColor White
    Write-Host "  2. Select domain: ctrlchecks.ai" -ForegroundColor White
    Write-Host "  3. Authorize the tunnel" -ForegroundColor White
    cloudflared tunnel login
    Write-Host "✅ Login complete" -ForegroundColor Green
} else {
    Write-Host "✅ Using existing login" -ForegroundColor Green
}

# Step 3: Create tunnel
Write-Host "`nStep 3: Creating tunnel..." -ForegroundColor Yellow
$tunnelName = Read-Host "Enter tunnel name (default: ollama-api)"
if ([string]::IsNullOrWhiteSpace($tunnelName)) {
    $tunnelName = "ollama-api"
}

Write-Host "Creating tunnel: $tunnelName" -ForegroundColor Gray
$tunnelOutput = cloudflared tunnel create $tunnelName 2>&1 | Out-String

# Extract tunnel ID from output
$tunnelId = $null

# Try multiple patterns to find tunnel ID
if ($tunnelOutput -match "Created tunnel\s+([a-f0-9-]{36})") {
    $tunnelId = $matches[1]
} elseif ($tunnelOutput -match "Tunnel\s+([a-f0-9-]{36})\s+created") {
    $tunnelId = $matches[1]
} elseif ($tunnelOutput -match "([a-f0-9-]{36})") {
    # Last resort: find any UUID in the output
    $tunnelId = $matches[1]
}

# If still not found, list tunnels and find by name
if (-not $tunnelId) {
    Write-Host "Listing tunnels to find ID..." -ForegroundColor Gray
    $tunnelList = cloudflared tunnel list 2>&1 | Out-String
    
    # Parse the table format: ID NAME CREATED CONNECTIONS
    $lines = $tunnelList -split "`n" | Where-Object { $_ -match $tunnelName }
    if ($lines) {
        # Extract UUID from the line (first column)
        if ($lines[0] -match "([a-f0-9-]{36})") {
            $tunnelId = $matches[1]
        }
    }
}

if ($tunnelId) {
    Write-Host "✅ Tunnel created: $tunnelId" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not extract tunnel ID automatically." -ForegroundColor Yellow
    Write-Host "Listing all tunnels:" -ForegroundColor Gray
    cloudflared tunnel list
    Write-Host "`nPlease find the tunnel ID (UUID) for '$tunnelName' above" -ForegroundColor Yellow
    $tunnelId = Read-Host "Enter tunnel ID manually"
}

# Step 4: Get domain
Write-Host "`nStep 4: Domain Configuration" -ForegroundColor Yellow
$domain = "ctrlchecks.ai"  # Your domain
$subdomain = "ollama-api"  # Subdomain for Ollama API
$fullDomain = "$subdomain.$domain"
Write-Host "Using domain: $fullDomain" -ForegroundColor Green

# Step 5: Create config file
Write-Host "`nStep 5: Creating configuration file..." -ForegroundColor Yellow

$configContent = @"
tunnel: $tunnelId
credentials-file: $env:USERPROFILE\.cloudflared\$tunnelId.json

ingress:
  # Ollama FastAPI Backend - Global Access
  - hostname: $fullDomain
    service: http://localhost:8000
  
  # Catch-all rule (must be last)
  - service: http_status:404
"@

$configPath = "cloudflare-tunnel-config.yml"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "✅ Config file created: $configPath" -ForegroundColor Green

# Step 6: Configure DNS
Write-Host "`nStep 6: Configuring DNS..." -ForegroundColor Yellow
Write-Host "Creating DNS record: $fullDomain -> $tunnelId.cfargotunnel.com" -ForegroundColor Gray

try {
    cloudflared tunnel route dns $tunnelName $fullDomain
    Write-Host "✅ DNS record created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create DNS record automatically" -ForegroundColor Yellow
    Write-Host "Please create it manually in Cloudflare Dashboard:" -ForegroundColor White
    Write-Host "  - Type: CNAME" -ForegroundColor White
    Write-Host "  - Name: $subdomain" -ForegroundColor White
    Write-Host "  - Target: $tunnelId.cfargotunnel.com" -ForegroundColor White
    Write-Host "  - Proxy: ✅ Proxied (orange cloud)" -ForegroundColor White
}

# Step 7: Create startup script
Write-Host "`nStep 7: Creating startup script..." -ForegroundColor Yellow

$startScript = @"
# Start Cloudflare Tunnel for Ollama API
`$configPath = "`$PSScriptRoot\cloudflare-tunnel-config.yml"
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
cloudflared tunnel --config `$configPath run $tunnelName
"@

$startScriptPath = "start-cloudflare-tunnel.ps1"
$startScript | Out-File -FilePath $startScriptPath -Encoding UTF8
Write-Host "✅ Startup script created: $startScriptPath" -ForegroundColor Green

# Step 8: Summary
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  Tunnel Name: $tunnelName" -ForegroundColor White
Write-Host "  Tunnel ID: $tunnelId" -ForegroundColor White
Write-Host "  Domain: https://$fullDomain" -ForegroundColor White
Write-Host "  Config File: $configPath" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure FastAPI backend is running on port 8000" -ForegroundColor White
Write-Host "  2. Start the tunnel: .\start-cloudflare-tunnel.ps1" -ForegroundColor White
Write-Host "  3. Update backend OLLAMA_BASE_URL to: https://$fullDomain" -ForegroundColor White
Write-Host "  4. Test: curl https://$fullDomain/health" -ForegroundColor White

Write-Host "`n✅ Ready to start the tunnel!" -ForegroundColor Green
