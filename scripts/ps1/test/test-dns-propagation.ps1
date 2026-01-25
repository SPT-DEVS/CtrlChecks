# Test DNS Propagation for coverage-francis-distributor-sauce.trycloudflare.com
# Run this script to check when DNS is ready

Write-Host "`n=== Testing DNS Propagation ===" -ForegroundColor Cyan
Write-Host "Checking if coverage-francis-distributor-sauce.trycloudflare.com resolves..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 20
$attempt = 0
$resolved = $false

while ($attempt -lt $maxAttempts -and -not $resolved) {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    try {
        $result = Resolve-DnsName -Name "coverage-francis-distributor-sauce.trycloudflare.com" -ErrorAction Stop
        Write-Host "`n✅ DNS RESOLVED!" -ForegroundColor Green
        Write-Host "Record Type: $($result.Type)" -ForegroundColor White
        Write-Host "Name: $($result.Name)" -ForegroundColor White
        Write-Host "Value: $($result.NameHost)" -ForegroundColor White
        $resolved = $true
        
        Write-Host "`nTesting HTTPS connection..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "https://diego-ski-deutsche-choir.trycloudflare.com/health" -TimeoutSec 10 -ErrorAction Stop
            Write-Host "✅ Health endpoint working!" -ForegroundColor Green
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
            Write-Host "Response: $($response.Content)" -ForegroundColor White
        } catch {
            Write-Host "⚠️  DNS resolved but health endpoint not accessible yet" -ForegroundColor Yellow
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "`nMake sure:" -ForegroundColor Cyan
            Write-Host "  1. Cloudflare Tunnel is running: .\start-cloudflare-tunnel.ps1" -ForegroundColor White
            Write-Host "  2. FastAPI backend is running on port 8000" -ForegroundColor White
        }
    } catch {
        Write-Host "  Not resolved yet..." -ForegroundColor Gray
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 30
        }
    }
}

if (-not $resolved) {
    Write-Host "`n⚠️  DNS not resolved after $maxAttempts attempts" -ForegroundColor Yellow
    Write-Host "`nThis is normal - DNS propagation can take 5-30 minutes." -ForegroundColor Cyan
    Write-Host "`nTo check manually:" -ForegroundColor Yellow
    Write-Host "  nslookup coverage-francis-distributor-sauce.trycloudflare.com" -ForegroundColor White
    Write-Host "  curl https://diego-ski-deutsche-choir.trycloudflare.com/health" -ForegroundColor White
    Write-Host "`nOr check in Cloudflare Dashboard:" -ForegroundColor Yellow
    Write-Host "  DNS → Records → Look for ollama-api CNAME" -ForegroundColor White
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
