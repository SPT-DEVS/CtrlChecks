# Fix Backend URL Configuration
# This script helps fix the VITE_PYTHON_BACKEND_URL environment variable

Write-Host "Fixing Backend URL Configuration..." -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".env"

# Check if .env file exists
if (Test-Path $envFile) {
    Write-Host "Found .env file at: $envFile" -ForegroundColor Green
    
    # Read current content
    $content = Get-Content $envFile -Raw
    
    # Check current value
    if ($content -match "VITE_PYTHON_BACKEND_URL=(.+)") {
        $currentValue = $matches[1].Trim()
        Write-Host "Current value: $currentValue" -ForegroundColor Yellow
        
        if ($currentValue -eq "http://localhost:8000" -or $currentValue -eq "localhost:8000") {
            Write-Host "Found incorrect port (8000). Updating to port 3001..." -ForegroundColor Yellow
            
            # Replace the value
            $content = $content -replace "VITE_PYTHON_BACKEND_URL=.+", "VITE_PYTHON_BACKEND_URL=http://localhost:3001"
            
            # Write back
            Set-Content -Path $envFile -Value $content -NoNewline
            
            Write-Host "Updated VITE_PYTHON_BACKEND_URL to http://localhost:3001" -ForegroundColor Green
        } elseif ($currentValue -eq "http://localhost:3001" -or $currentValue -eq "localhost:3001") {
            Write-Host "Configuration is already correct!" -ForegroundColor Green
        } else {
            Write-Host "Found custom value: $currentValue" -ForegroundColor Yellow
            Write-Host "If you're getting 404 errors, make sure this points to your worker service (port 3001)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "VITE_PYTHON_BACKEND_URL not found in .env file" -ForegroundColor Yellow
        Write-Host "Adding it now..." -ForegroundColor Yellow
        
        # Add the variable
        $newLine = "`n# Worker service (handles workflows, agents, etc.)`nVITE_PYTHON_BACKEND_URL=http://localhost:3001"
        Add-Content -Path $envFile -Value $newLine
        
        Write-Host "Added VITE_PYTHON_BACKEND_URL=http://localhost:3001" -ForegroundColor Green
    }
} else {
    Write-Host ".env file not found. Creating it..." -ForegroundColor Yellow
    
    # Create .env file with correct configuration
    $lines = @(
        "# Supabase Configuration (REQUIRED)",
        "VITE_SUPABASE_URL=your-supabase-url-here",
        "VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here",
        "",
        "# Worker service (handles workflows, agents, etc.) - REQUIRED",
        "VITE_PYTHON_BACKEND_URL=http://localhost:3001",
        "",
        "# Ollama URL (Optional)",
        "VITE_OLLAMA_BASE_URL=http://localhost:11434"
    )
    
    Set-Content -Path $envFile -Value $lines
    
    Write-Host "Created .env file with correct configuration" -ForegroundColor Green
    Write-Host "IMPORTANT: Update VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY with your Supabase credentials!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your frontend dev server (if running)" -ForegroundColor White
Write-Host "   2. Check browser console for 'App Configuration' log" -ForegroundColor White
Write-Host "   3. Verify itemBackend shows: http://localhost:3001" -ForegroundColor White
Write-Host "   4. Make sure worker service is running on port 3001" -ForegroundColor White
Write-Host ""
Write-Host "Test worker service:" -ForegroundColor Cyan
Write-Host '   Invoke-WebRequest -Uri http://localhost:3001/health' -ForegroundColor Gray
Write-Host ""
