# Install cloudflared - Multiple Methods

Write-Host "`n=== Installing cloudflared ===" -ForegroundColor Cyan
Write-Host ""

# Method 1: Try Chocolatey with admin (if available)
Write-Host "Method 1: Trying Chocolatey..." -ForegroundColor Yellow
try {
    # Check if running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        choco install cloudflared -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Installed via Chocolatey" -ForegroundColor Green
            exit 0
        }
    } else {
        Write-Host "⚠️  Not running as admin. Trying alternative methods..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Chocolatey failed. Trying alternative..." -ForegroundColor Yellow
}

# Method 2: Download directly (no admin needed)
Write-Host "`nMethod 2: Downloading cloudflared directly..." -ForegroundColor Yellow

$downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$installDir = "$env:USERPROFILE\cloudflared"
$exePath = "$installDir\cloudflared.exe"

# Create directory
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Download
Write-Host "Downloading from GitHub..." -ForegroundColor Gray
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath -UseBasicParsing
    Write-Host "✅ Downloaded to: $exePath" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Add to PATH (user-level, no admin needed)
Write-Host "`nAdding to PATH..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    Write-Host "✅ Added to PATH (restart terminal for changes)" -ForegroundColor Green
} else {
    Write-Host "✅ Already in PATH" -ForegroundColor Green
}

# Test installation
Write-Host "`nTesting installation..." -ForegroundColor Yellow
$env:Path = "$env:Path;$installDir"
$version = & "$exePath" --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ cloudflared installed successfully!" -ForegroundColor Green
    Write-Host "Version: $version" -ForegroundColor White
    Write-Host "`nLocation: $exePath" -ForegroundColor Gray
    Write-Host "`nNote: Restart your terminal or run: `$env:Path += ';$installDir'" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Installation complete but test failed. Try restarting terminal." -ForegroundColor Yellow
}
