# Start Cloudflare Tunnel for Ollama API
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan

# Get project root: scripts/ps1/start -> go up 3 levels
$currentDir = $PSScriptRoot
$projectRoot = (Get-Item $currentDir).Parent.Parent.Parent.FullName
$configPath = Join-Path $projectRoot "cloudflare-tunnel-config.yml"

Write-Host "Script location: $currentDir" -ForegroundColor Gray
Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host "Config path: $configPath" -ForegroundColor Gray

# Check if config exists
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Config file not found at: $configPath" -ForegroundColor Red
    Write-Host "`nPlease ensure cloudflare-tunnel-config.yml exists in the project root." -ForegroundColor Yellow
    Write-Host "`nYou can also run manually:" -ForegroundColor Cyan
    Write-Host "  cloudflared tunnel --config `"$configPath`" run ollama-api" -ForegroundColor White
    exit 1
}

Write-Host "✅ Config file found" -ForegroundColor Green
cloudflared tunnel --config $configPath run ollama-api
