# Quick Fix: Workflow Execution 404 Error

## Problem

When trying to run a workflow, you get:
```
POST http://localhost:8000/api/execute-workflow 404 (Not Found)
Execution error: Error: Execution failed
```

## Root Cause

The frontend is trying to call `/api/execute-workflow` on port 8000, but:
- **Port 8000** = Fast_API_Ollama service (Ollama proxy only - doesn't have `/api/execute-workflow`)
- **Port 3001** = Worker service (has `/api/execute-workflow` endpoint)

## Solution

### Option 1: Update Environment Variable (Recommended)

Create or update your `.env` file in the `ctrl_checks` directory:

```env
# Worker service (handles workflows, agents, etc.) - REQUIRED
VITE_PYTHON_BACKEND_URL=http://localhost:3001

# Fast_API_Ollama (Ollama proxy) - Optional
VITE_OLLAMA_BASE_URL=http://localhost:8000
```

**Then restart your frontend dev server:**
```bash
npm run dev
```

### Option 2: Use Default (Already Fixed)

The code defaults to port 3001. If you don't have a `.env` file, it should work automatically.

**However, if you have an existing `.env` file with the old value, update it:**

1. Open `ctrl_checks/.env` (or create it if it doesn't exist)
2. Set: `VITE_PYTHON_BACKEND_URL=http://localhost:3001`
3. Restart the frontend dev server

## Verify Services Are Running

Make sure both services are running:

1. **Worker Service (Port 3001):**
   ```bash
   cd worker
   npm install
   npm run dev
   ```
   
   Verify it's running:
   ```powershell
   # PowerShell
   Invoke-WebRequest -Uri "http://localhost:3001/health"
   ```

2. **Fast_API_Ollama (Port 8000) - Optional:**
   ```bash
   cd Fast_API_Ollama
   .\setup.ps1  # Windows
   .\start.ps1  # Windows
   # or manually:
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Test the Fix

1. Open your browser console
2. Check the "App Configuration" log - it should show:
   ```
   App Configuration: {
     itemBackend: "http://localhost:3001",
     ...
   }
   ```
3. Try running a workflow - it should now work!

## Service Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Port 5173)   │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Worker Service │  │ Fast_API_Ollama │
│  (Port 3001)    │  │  (Port 8000)    │
│                 │  │                 │
│ /api/execute-   │  │  /process       │
│   workflow      │  │  /api/chat      │
│ /api/execute-   │  │  /api/generate  │
│   agent         │  │                 │
│ /api/generate-* │  │                 │
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│     Ollama      │
│  (Port 11434)   │
└─────────────────┘
```

## Common Issues

### Still Getting 404?

1. **Check Worker is Running:**
   ```powershell
   # PowerShell
   Invoke-WebRequest -Uri "http://localhost:3001/health"
   ```
   Should return: `{"status":"healthy",...}`

2. **Check Environment Variable:**
   - Open browser console
   - Look for "App Configuration" log
   - Verify `itemBackend` is `http://localhost:3001`
   - If it shows `http://localhost:8000`, you need to update your `.env` file

3. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or restart the dev server

### Port Already in Use?

If port 3001 is already in use:
1. Find what's using it: `netstat -ano | findstr :3001` (Windows)
2. Kill the process or use a different port
3. Update `VITE_PYTHON_BACKEND_URL` to match
4. Update worker `.env` file `PORT` variable

## Related Files

- `ctrl_checks/src/config/endpoints.ts` - Endpoint configuration
- `worker/src/api/execute-workflow.ts` - `/api/execute-workflow` endpoint
- `ctrl_checks/.env` - Environment variables (create if missing)
- `worker/.env` - Worker service configuration
