# Local Development Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd ctrl_checks
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `ctrl_checks` directory:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```env
# REQUIRED - Get these from your Supabase project settings
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Optional - Backend URLs (defaults shown)
VITE_PYTHON_BACKEND_URL=http://localhost:8000
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. Start Development Server

```bash
npm run dev
```

The app should open at `http://localhost:8080`

## Troubleshooting Blank Screen

### Check Browser Console

1. Open DevTools (F12)
2. Check the **Console** tab for errors
3. Check the **Network** tab for failed requests

### Common Issues

#### 1. Missing Environment Variables

**Symptom:** Blank screen, console shows Supabase warnings

**Fix:**
- Ensure `.env` file exists in `ctrl_checks/` directory
- Verify variables start with `VITE_`
- Restart the dev server after adding variables

#### 2. Supabase Connection Error

**Symptom:** Console shows Supabase errors

**Fix:**
- Verify your Supabase URL and key are correct
- Check if your Supabase project is active
- Ensure you're using the **anon/public** key, not the service role key

#### 3. Port Already in Use

**Symptom:** Server won't start, port 8080 in use

**Fix:**
```bash
# Change port in vite.config.ts or use:
npm run dev -- --port 3000
```

#### 4. Module Not Found Errors

**Symptom:** Console shows import errors

**Fix:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. TypeScript Errors

**Symptom:** Build fails with TypeScript errors

**Fix:**
```bash
# Check for type errors
npm run build

# If errors persist, check tsconfig.json settings
```

### Verify Setup

1. **Check if React is mounting:**
   - Open DevTools → Console
   - You should see: `App Configuration: { ... }`
   - No red errors

2. **Check if CSS is loading:**
   - Open DevTools → Network
   - Look for `index.css` or similar - should be 200 OK

3. **Check if routes work:**
   - Try navigating to `/signin` or `/signup`
   - Should see login/signup forms

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Next Steps

Once the frontend is running:

1. **Set up Worker Service** (if needed)
   - See `worker/README.md`

2. **Set up Ollama Service** (if needed)
   - See `Fast_API_Ollama/README.md`

3. **Configure Database**
   - Run SQL migrations in `sql_migrations/`
   - See `README.md` for details

## Need Help?

- Check browser console for specific errors
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check that port 8080 is available
