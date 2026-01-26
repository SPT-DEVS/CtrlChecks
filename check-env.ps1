# Environment Variables Checker for Windows PowerShell
# Run: .\check-env.ps1

Write-Host "`n🔍 Checking Environment Variables...`n" -ForegroundColor Cyan

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "✓ .env file found`n" -ForegroundColor Green
    
    $content = Get-Content $envPath
    $requiredVars = @("VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY")
    $optionalVars = @("VITE_PYTHON_BACKEND_URL", "VITE_OLLAMA_BASE_URL", "VITE_USE_DIRECT_BACKEND", "VITE_PUBLIC_BASE_URL", "VITE_HUGGINGFACE_API_KEY")
    
    $foundVars = @{}
    foreach ($line in $content) {
        if ($line -match '^VITE_([^=]+)=(.+)$') {
            $key = "VITE_" + $matches[1].Trim()
            $value = $matches[2].Trim()
            $foundVars[$key] = $value
        }
    }
    
    Write-Host "REQUIRED VARIABLES:" -ForegroundColor Yellow
    $allRequired = $true
    foreach ($var in $requiredVars) {
        if ($foundVars.ContainsKey($var) -and $foundVars[$var] -ne "" -and $foundVars[$var] -notmatch "your-|placeholder") {
            $displayValue = if ($var -match "KEY|SECRET") { "[HIDDEN]" } else { $foundVars[$var] }
            Write-Host "  ✓ $var = $displayValue" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $var = MISSING or INVALID" -ForegroundColor Red
            $allRequired = $false
        }
    }
    
    Write-Host "`nOPTIONAL VARIABLES:" -ForegroundColor Yellow
    foreach ($var in $optionalVars) {
        if ($foundVars.ContainsKey($var) -and $foundVars[$var] -ne "" -and $foundVars[$var] -notmatch "your-|placeholder") {
            Write-Host "  ✓ $var = $($foundVars[$var])" -ForegroundColor Green
        } else {
            Write-Host "  ○ $var = Not set (will use default)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
    
    if ($allRequired) {
        Write-Host "`n✅ All required variables are set!`n" -ForegroundColor Green
        Write-Host "You can now run: npm run dev`n" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Some required variables are missing!`n" -ForegroundColor Red
        Write-Host "Please check ENV_VARIABLES_GUIDE.md for setup instructions.`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found!`n" -ForegroundColor Red
    Write-Host "Please create a .env file in the ctrl_checks directory.`n" -ForegroundColor Yellow
    Write-Host "See ENV_VARIABLES_GUIDE.md for instructions.`n" -ForegroundColor Yellow
}
