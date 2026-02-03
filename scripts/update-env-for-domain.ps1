# PowerShell script to update .env file with custom domain
# Usage: .\scripts\update-env-for-domain.ps1 -Domain "yourdomain.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$ErrorActionPreference = "Stop"

Write-Host "Updating .env file for domain: $Domain" -ForegroundColor Cyan

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $scriptDir "..\.env"

# Check if .env exists
if (-not (Test-Path $envPath)) {
    Write-Host ".env file not found. Creating new one..." -ForegroundColor Yellow
    
    # Create basic .env template
    $envContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Backend API Configuration
VITE_PYTHON_BACKEND_URL=http://localhost:8001
VITE_OLLAMA_BASE_URL=http://localhost:11434

# Feature Flags
VITE_USE_DIRECT_BACKEND=false

# Public Base URL
VITE_PUBLIC_BASE_URL=https://$Domain

# API URL (if backend is on same domain, use relative path or full URL)
# VITE_API_URL=https://api.$Domain
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "Created new .env file" -ForegroundColor Green
} else {
    # Read existing .env
    $envContent = Get-Content $envPath -Raw
    
    # Update VITE_PUBLIC_BASE_URL
    if ($envContent -match 'VITE_PUBLIC_BASE_URL\s*=') {
        $envContent = $envContent -replace 'VITE_PUBLIC_BASE_URL\s*=.*', "VITE_PUBLIC_BASE_URL=https://$Domain"
        Write-Host "Updated VITE_PUBLIC_BASE_URL" -ForegroundColor Green
    } else {
        # Add if it doesn't exist
        $envContent += "`n# Public Base URL`nVITE_PUBLIC_BASE_URL=https://$Domain`n"
        Write-Host "Added VITE_PUBLIC_BASE_URL" -ForegroundColor Green
    }
    
    # Write back
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
}

Write-Host ""
Write-Host "SUCCESS: .env file updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review .env file and fill in missing values (Supabase keys, etc.)" -ForegroundColor White
Write-Host "  2. Build the frontend: npm run build" -ForegroundColor White
Write-Host "  3. Deploy using Docker or your preferred method" -ForegroundColor White
