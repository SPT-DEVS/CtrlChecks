# Quick Fix for Blank Screen Issue

## Immediate Steps to Fix Blank Screen

### Step 1: Check Browser Console
1. Open your browser
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Look for any **red error messages**
5. Take a screenshot or copy the error messages

### Step 2: Verify Environment Variables

Create a `.env` file in the `ctrl_checks` directory:

```bash
cd ctrl_checks
```

Create `.env` file with this content (replace with your actual Supabase credentials):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_PYTHON_BACKEND_URL=http://localhost:8000
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

### Step 3: Clear Cache and Reinstall

```powershell
# In PowerShell (Windows)
cd ctrl_checks
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Step 4: Restart Dev Server

```powershell
npm run dev
```

### Step 5: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page (F5)
4. Look for any **red/failed requests**
5. Check if `index.html` loads (should be 200 OK)
6. Check if CSS and JS files load

## Common Error Messages and Fixes

### Error: "Missing Supabase environment variables"
**Fix:** Create `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Error: "Cannot find module"
**Fix:** Run `npm install` again

### Error: "Failed to fetch" or "Network error"
**Fix:** 
- Check if dev server is running on port 8080
- Try accessing `http://localhost:8080` directly
- Check firewall/antivirus settings

### Error: "React is not defined"
**Fix:** Already fixed in the codebase - if you still see this, clear cache and rebuild

### Blank screen with no errors
**Possible causes:**
1. CSS not loading - check Network tab for CSS files
2. React not mounting - check if `#root` element exists in HTML
3. JavaScript disabled - check browser settings

## Verification Checklist

- [ ] `.env` file exists in `ctrl_checks/` directory
- [ ] Environment variables start with `VITE_`
- [ ] `npm install` completed without errors
- [ ] Dev server starts without errors
- [ ] Browser console shows no red errors
- [ ] Network tab shows all files loading (200 OK)
- [ ] Can see HTML structure in Elements tab

## Still Not Working?

1. **Check the exact error message** in browser console
2. **Verify the port** - should be 8080 (check `vite.config.ts`)
3. **Try a different browser** - Chrome, Firefox, Edge
4. **Check if React is mounting:**
   - Open DevTools → Elements
   - Look for `<div id="root">` 
   - Check if it has any children

## Test if React is Working

Add this to `src/main.tsx` temporarily to verify React is mounting:

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found!");
}

console.log("Root element found, mounting React...");
createRoot(rootElement).render(<App />);
console.log("React app mounted!");
```

If you see these console messages, React is mounting correctly.
