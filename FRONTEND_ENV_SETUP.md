# Frontend Environment Variables Setup

## ✅ Required Configuration

Your frontend needs to connect to your Node.js backend running on **port 3001**.

### Update Your `.env` File

Make sure your `ctrl_checks/.env` file has:

```env
# REQUIRED - Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# REQUIRED - Backend API URL
# IMPORTANT: Your Node.js backend runs on port 3001
VITE_PYTHON_BACKEND_URL=http://localhost:3001

# OPTIONAL - Ollama (if needed)
VITE_OLLAMA_BASE_URL=http://localhost:11434

# OPTIONAL - Other settings
VITE_USE_DIRECT_BACKEND=false
VITE_PUBLIC_BASE_URL=http://localhost:5173
```

## 🔧 Key Points

1. **Backend Port:** Your Node.js backend is running on **port 3001**
   - ✅ Correct: `VITE_PYTHON_BACKEND_URL=http://localhost:3001`
   - ❌ Wrong: `VITE_PYTHON_BACKEND_URL=http://localhost:8000` (old port)
   - ❌ Wrong: `VITE_PYTHON_BACKEND_URL=http://localhost:8001` (default, but not your port)

2. **Supabase Keys:**
   - Use **anon/public** key (NOT service_role key)
   - Get from: Supabase Dashboard → Settings → API

3. **After Changes:**
   - Restart your frontend dev server
   - Clear browser cache if needed

## 🧪 Verify Connection

After updating `.env`, test the connection:

```powershell
# Test backend health
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing

# Test from frontend (in browser console)
fetch('http://localhost:3001/health').then(r => r.json()).then(console.log)
```

## 📋 Quick Checklist

- [ ] `VITE_SUPABASE_URL` is set (your Supabase project URL)
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set (anon key, not service_role)
- [ ] `VITE_PYTHON_BACKEND_URL=http://localhost:3001` (port 3001!)
- [ ] Restarted frontend dev server after changes
- [ ] Backend is running on port 3001

## 🐛 Common Issues

### Frontend can't connect to backend
- **Check:** Is backend running? `npm run dev` in `worker/` directory
- **Check:** Is port 3001 correct in `.env`?
- **Check:** CORS is configured on backend (should be `*` for local dev)

### Supabase errors
- **Check:** Using anon key, not service_role key
- **Check:** Supabase URL is correct
- **Check:** Supabase project is active

### Port conflicts
- Backend: Port 3001
- Frontend: Port 5173 (Vite default) or 8080
- Ollama: Port 11434
- FastAPI Ollama: Port 8000 (optional)
