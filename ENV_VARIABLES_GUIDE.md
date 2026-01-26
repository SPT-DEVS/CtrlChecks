# Environment Variables Guide

## Required Variables (Must Have)

### 1. `VITE_SUPABASE_URL`
- **Description:** Your Supabase project URL
- **Format:** `https://your-project-id.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Example:** `https://abcdefghijklmnop.supabase.co`

### 2. `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Description:** Your Supabase anon/public key (safe for frontend)
- **Format:** JWT token starting with `eyJ`
- **Where to find:** Supabase Dashboard → Settings → API → anon public key
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **⚠️ Important:** Use the **anon/public** key, NOT the service_role key!

## Optional Variables (Have Defaults)

### 3. `VITE_PYTHON_BACKEND_URL`
- **Description:** URL of your FastAPI worker service (handles workflows, agents, etc.)
- **Default:** `http://localhost:8001` (Worker service)
- **Note:** Port 8000 is Fast_API_Ollama (Ollama proxy), port 8001 is Worker service
- **Example:** `http://localhost:8001` or `https://api.yourdomain.com`

### 4. `VITE_OLLAMA_BASE_URL`
- **Description:** URL of your Ollama service
- **Default:** `http://localhost:11434` (or same as `VITE_PYTHON_BACKEND_URL`)
- **Example:** `http://localhost:11434`

### 5. `VITE_USE_DIRECT_BACKEND`
- **Description:** Use direct backend calls (for local development)
- **Default:** `false`
- **Values:** `true` or `false`
- **When to use:** Set to `true` for local development without Supabase

### 6. `VITE_PUBLIC_BASE_URL`
- **Description:** Public base URL of your frontend
- **Default:** `http://localhost:8080`
- **Example:** `http://localhost:8080` or `https://yourdomain.com`

### 7. `VITE_HUGGINGFACE_API_KEY` (Optional)
- **Description:** HuggingFace API key for prompt analysis
- **Default:** Not required
- **Where to find:** [HuggingFace Settings](https://huggingface.co/settings/tokens)

## Example .env File

```env
# REQUIRED - Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OPTIONAL - Backend URLs (defaults shown)
# IMPORTANT: Port 8001 is Worker service, port 8000 is Fast_API_Ollama
VITE_PYTHON_BACKEND_URL=http://localhost:8001
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:8080

# OPTIONAL - HuggingFace API Key
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## How to Get Supabase Credentials

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Select your project** (or create a new one)
3. **Navigate to:** Settings → API
4. **Copy:**
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public key** → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`

## Verification

### Quick Check
Run the verification script:
```bash
node verify-env.js
```

### Manual Check
1. Ensure `.env` file exists in `ctrl_checks/` directory
2. All variables start with `VITE_` (required for Vite)
3. No spaces around `=` sign
4. No quotes needed (unless value contains spaces)
5. Restart dev server after changing `.env`

## Common Issues

### Issue: Variables not loading
**Solution:**
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`
- Check file is named exactly `.env` (not `.env.local` or `.env.development`)

### Issue: "Missing Supabase environment variables" warning
**Solution:**
- Verify `.env` file exists in `ctrl_checks/` directory
- Check variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Ensure no typos or extra spaces

### Issue: Authentication not working
**Solution:**
- Verify you're using the **anon/public** key, not service_role key
- Check Supabase URL is correct (should end with `.supabase.co`)
- Ensure Supabase project is active and not paused

### Issue: Backend connection errors
**Solution:**
- Verify `VITE_PYTHON_BACKEND_URL` is correct
- Ensure backend service is running
- Check CORS settings on backend

## Security Notes

- ✅ **Safe for frontend:** All `VITE_` variables are exposed to the browser
- ✅ **Use anon key:** `VITE_SUPABASE_PUBLISHABLE_KEY` is safe to expose
- ❌ **Never expose:** Service role keys, API secrets, or private keys
- ❌ **Don't commit:** Never commit `.env` file to git (it's in .gitignore)

## Testing Your Configuration

After setting up `.env`:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for: `App Configuration: { ... }`
   - Should show your backend URLs
   - No red errors about missing variables

3. **Test Supabase connection:**
   - Try signing up or signing in
   - Should work without errors

## Need Help?

- Check browser console for specific error messages
- Run `node verify-env.js` to validate your setup
- See `SETUP_LOCAL.md` for complete setup instructions
- See `QUICK_FIX_BLANK_SCREEN.md` for troubleshooting
