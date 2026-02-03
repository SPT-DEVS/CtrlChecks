# How to Run the Frontend

## Prerequisites

1. **Node.js 20+** installed ([Download](https://nodejs.org/))
2. **npm** (comes with Node.js)
3. **.env file** configured (see Configuration section below)

## Quick Start

### Option 1: Development Mode (Recommended for Development)

```powershell
cd ctrl_checks
npm install
npm run dev
```

The frontend will start at: **http://localhost:8080**

### Option 2: Using the Batch File

```powershell
cd ctrl_checks
.\start_project.bat
```

### Option 3: Production Build Preview

```powershell
cd ctrl_checks
npm run build
npm run preview
```

## Step-by-Step Instructions

### 1. Install Dependencies (First Time Only)

```powershell
cd ctrl_checks
npm install
```

### 2. Configure Environment Variables

Make sure your `.env` file exists in the `ctrl_checks` directory with:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Backend API Configuration
VITE_PYTHON_BACKEND_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001

# Optional
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:8080
```

### 3. Start Development Server

```powershell
npm run dev
```

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### 4. Open in Browser

Open your browser and navigate to: **http://localhost:8080**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## Troubleshooting

### Port 8080 Already in Use

If you get an error that port 8080 is in use:

1. **Change the port** in `vite.config.ts`:
   ```typescript
   server: {
     port: 3000, // Change to any available port
   }
   ```

2. **Or kill the process using port 8080**:
   ```powershell
   # Find process using port 8080
   netstat -ano | findstr :8080
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### Missing Environment Variables

If you see errors about missing Supabase variables:

1. Check that `.env` file exists in `ctrl_checks` directory
2. Verify all required variables are set
3. Restart the dev server after changing `.env`

### Cannot Connect to Backend

If the frontend can't connect to the backend:

1. Verify backend is running on the configured port
2. Check `VITE_API_URL` or `VITE_PYTHON_BACKEND_URL` in `.env`
3. Check CORS settings on backend
4. Check browser console for specific errors

### Build Errors

```powershell
# Clear cache and reinstall
rm -r node_modules
rm package-lock.json
npm install

# Or on Windows PowerShell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## Production Deployment

### Build for Production

```powershell
npm run build
```

This creates optimized files in the `dist/` directory.

### Deploy with Docker

```powershell
# Build Docker image
docker build -t ctrlchecks-frontend .

# Run container
docker run -p 8080:80 ctrlchecks-frontend
```

### Deploy with Nginx

See `nginx-setup-guide.md` and `DEPLOYMENT-CHECKLIST.md` for detailed instructions.

## Development Tips

1. **Hot Reload**: Changes to code automatically refresh the browser
2. **Console Logs**: Check browser DevTools console for errors
3. **Network Tab**: Use browser DevTools Network tab to debug API calls
4. **React DevTools**: Install React DevTools browser extension for debugging

## Need Help?

- Check `README.md` for more details
- Review `nginx-setup-guide.md` for deployment
- Check browser console for specific error messages
