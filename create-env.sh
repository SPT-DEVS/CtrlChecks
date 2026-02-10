#!/bin/bash
# Create .env file for frontend with production API URL
# Run this script in the ctrl_checks directory

cat > .env << 'EOF'
# ============================================
# CtrlChecks Frontend - Environment Variables
# ============================================
# Created automatically - Update values as needed

# ============================================
# REQUIRED - Supabase Configuration
# ============================================
VITE_SUPABASE_URL=https://nvrrqvlqnnvlihtlgmzn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cnJxdmxxbm52bGlodGxnbXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjQ5MDMsImV4cCI6MjA4MTA0MDkwM30.3So6zpF15ORuOF-R6YY2ya1XE9bTCjnsvAxf1B7HZMo

# ============================================
# Worker Service Configuration - PRODUCTION
# ============================================
# Production: https://worker.ctrlchecks.ai
VITE_API_URL=https://worker.ctrlchecks.ai

# ============================================
# FastAPI Ollama Service Configuration
# ============================================
VITE_PYTHON_BACKEND_URL=http://ollama.ctrlchecks.ai:8000
VITE_OLLAMA_BASE_URL=http://ollama.ctrlchecks.ai:8000

# ============================================
# Optional - Advanced Configuration
# ============================================
VITE_USE_DIRECT_BACKEND=false

# Public base URL (for OAuth redirects, etc.)
VITE_PUBLIC_BASE_URL=https://ctrlchecks.ai
EOF

echo "✅ .env file created!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Check browser console - should see: https://worker.ctrlchecks.ai"
echo ""
