# PowerShell script to set up nginx configuration for custom domain
# Usage: .\scripts\setup-nginx-domain.ps1 -Domain "yourdomain.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up nginx configuration for domain: $Domain" -ForegroundColor Cyan

# Validate domain format
if ($Domain -notmatch '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$') {
    Write-Host "ERROR: Invalid domain format: $Domain" -ForegroundColor Red
    exit 1
}

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nginxConfPath = Join-Path $scriptDir "..\nginx.conf" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $nginxConfPath) {
    $nginxConfPath = Join-Path $scriptDir "..\nginx.conf"
}

# Check if nginx.conf already exists and has placeholders
$needsUpdate = $false
if (Test-Path $nginxConfPath) {
    $currentContent = Get-Content $nginxConfPath -Raw -ErrorAction SilentlyContinue
    if ($currentContent -and $currentContent -match 'YOUR_DOMAIN') {
        $needsUpdate = $true
        Write-Host "Found nginx.conf with domain placeholders. Updating..." -ForegroundColor Green
    } else {
        $overwrite = Read-Host "nginx.conf exists but doesn't contain placeholders. Overwrite? (y/N)"
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            $needsUpdate = $true
        } else {
            Write-Host "Aborted. Existing nginx.conf not modified." -ForegroundColor Yellow
            exit 0
        }
    }
} else {
    $needsUpdate = $true
    Write-Host "Creating new nginx.conf..." -ForegroundColor Green
}

if ($needsUpdate) {
    # Read the nginx.conf file (it should have YOUR_DOMAIN.com placeholders)
    if (Test-Path $nginxConfPath) {
        $content = Get-Content $nginxConfPath -Raw
    } else {
        # If file doesn't exist, read from example or create basic config
        $nginxConfExamplePath = Join-Path $scriptDir "..\nginx.conf.example"
        if (Test-Path $nginxConfExamplePath) {
            $content = Get-Content $nginxConfExamplePath -Raw
        } else {
            Write-Host "ERROR: nginx.conf or nginx.conf.example not found." -ForegroundColor Red
            Write-Host "Please ensure nginx.conf exists with YOUR_DOMAIN.com placeholders." -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Replace domain placeholders
    $content = $content -replace 'YOUR_DOMAIN\.com', $Domain
    $content = $content -replace 'YOUR_DOMAIN', $Domain
    
    # Write new configuration
    try {
        $content | Out-File -FilePath $nginxConfPath -Encoding UTF8 -NoNewline
        Write-Host "SUCCESS: nginx.conf updated successfully!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to write nginx.conf: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review nginx.conf and adjust SSL certificate paths if needed" -ForegroundColor White
Write-Host "  2. Set up SSL certificate using Let's Encrypt:" -ForegroundColor White
Write-Host "     sudo certbot --nginx -d $Domain -d www.$Domain" -ForegroundColor Yellow
Write-Host "  3. Update your .env file with:" -ForegroundColor White
Write-Host "     VITE_PUBLIC_BASE_URL=https://$Domain" -ForegroundColor Yellow
Write-Host "  4. Rebuild and deploy your frontend" -ForegroundColor White
Write-Host ""
Write-Host "See nginx-setup-guide.md for detailed instructions" -ForegroundColor Cyan
