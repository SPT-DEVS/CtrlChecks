# Environment Variables Checklist

Use this checklist to verify your `.env` file is configured correctly.

## ✅ Required Variables (Must Have)

- [ ] `VITE_SUPABASE_URL` is set
  - Format: `https://your-project-id.supabase.co`
  - Should start with `https://`
  - Should contain `.supabase.co`

- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set
  - Format: JWT token (starts with `eyJ`)
  - Should be the **anon/public** key (NOT service_role)
  - Should be long (50+ characters)

## 📝 Optional Variables (Have Defaults)

- [ ] `VITE_PYTHON_BACKEND_URL` (default: `http://localhost:8000`)
- [ ] `VITE_OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- [ ] `VITE_USE_DIRECT_BACKEND` (default: `false`)
- [ ] `VITE_PUBLIC_BASE_URL` (default: `http://localhost:8080`)
- [ ] `VITE_HUGGINGFACE_API_KEY` (optional, not required)

## 🔍 Quick Verification

### Windows PowerShell:
```powershell
cd ctrl_checks
.\check-env.ps1
```

### Manual Check:
1. Open `.env` file in `ctrl_checks/` directory
2. Verify all variables start with `VITE_`
3. Ensure no spaces around `=` sign
4. Check that Supabase URL and Key are filled in (not placeholders)

## 📋 Your .env File Should Look Like:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (with defaults)
VITE_PYTHON_BACKEND_URL=http://localhost:8000
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

## ⚠️ Common Mistakes

- ❌ Using `service_role` key instead of `anon` key
- ❌ Missing `VITE_` prefix
- ❌ Spaces around `=` sign
- ❌ Using placeholder values like `your-project.supabase.co`
- ❌ Forgetting to restart dev server after changing `.env`

## ✅ After Setup

1. Run verification: `.\check-env.ps1`
2. Start dev server: `npm run dev`
3. Check browser console for errors
4. Test authentication (sign up/sign in)

## 📚 More Information

- See `ENV_VARIABLES_GUIDE.md` for detailed explanations
- See `SETUP_LOCAL.md` for complete setup guide
- See `QUICK_FIX_BLANK_SCREEN.md` for troubleshooting
