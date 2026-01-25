# Ollama Backend - Windows Setup Guide

## 🚀 Quick Start for Windows

### Prerequisites

1. **Ollama** - Download from https://ollama.com/download
2. **Python 3.9+** - Download from https://www.python.org/downloads/
3. **PowerShell** (included with Windows)

### Step 1: Install Ollama

1. Download Ollama installer from https://ollama.com/download
2. Run the installer
3. Verify installation:
   ```powershell
   ollama --version
   ```

### Step 2: Start Ollama Server

**Option A: From Start Menu**
- Search for "Ollama" in Start Menu
- Click to start (it runs in background)

**Option B: From PowerShell**
```powershell
ollama serve
```
Keep this window open.

### Step 3: Pull Models

Open a **new PowerShell window** and run:

```powershell
ollama pull qwen2.5:7b
ollama pull llama3:8b
ollama pull mistral:7b
```

This will download ~13GB of models (takes 10-30 minutes depending on internet speed).

### Step 4: Setup Python Backend

Navigate to the ollama_backend directory:

```powershell
cd C:\Users\User\Desktop\ctrlchecks-ai-workflow-os\AI_Agent\ollama_backend
```

Run the setup script:

```powershell
.\setup-windows.ps1
```

This script will:
- ✅ Check Ollama installation
- ✅ Verify Ollama is running
- ✅ Check Python installation
- ✅ Pull missing models
- ✅ Create virtual environment
- ✅ Install Python dependencies

### Step 5: Start API Server

After setup completes, start the API server:

```powershell
.\start-api.ps1
```

Or manually:

```powershell
.\venv\Scripts\Activate.ps1
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
```

### Step 6: Test the API

Open a **new PowerShell window** and test:

```powershell
# Health check
curl http://localhost:8000/health

# List models
curl http://localhost:8000/models

# Test completion
curl -X POST http://localhost:8000/completions `
  -H "Content-Type: application/json" `
  -d '{\"model\": \"mistral:7b\", \"prompt\": \"Hello!\", \"temperature\": 0.7}'
```

## 🔧 Troubleshooting

### Issue: "Ollama is not running"

**Solution:**
1. Make sure Ollama is installed
2. Start Ollama from Start Menu or run `ollama serve` in a separate PowerShell window
3. Check if port 11434 is in use: `netstat -an | findstr 11434`

### Issue: "Port 11434 already in use"

**Solution:**
Ollama is already running! This is fine. You can:
- Use the existing Ollama instance
- Or stop it: Find Ollama in Task Manager and end the process

### Issue: "pydantic-core installation failed"

**Solution:**
The setup script now uses newer pydantic versions with pre-built wheels. If you still have issues:

```powershell
pip install --upgrade pip
pip install pydantic>=2.8.0
```

### Issue: "uvicorn not recognized"

**Solution:**
Make sure virtual environment is activated:

```powershell
.\venv\Scripts\Activate.ps1
pip install uvicorn[standard]
```

### Issue: "Module not found: src.models"

**Solution:**
Make sure you're in the ollama_backend directory:

```powershell
cd C:\Users\User\Desktop\ctrlchecks-ai-workflow-os\AI_Agent\ollama_backend
```

### Issue: "Execution Policy Error"

**Solution:**
If you get an execution policy error, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try running the script again.

## 📝 Manual Setup (Alternative)

If the setup script doesn't work, you can do it manually:

```powershell
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
.\venv\Scripts\Activate.ps1

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install dependencies
pip install fastapi uvicorn[standard] pydantic httpx PyYAML python-multipart websockets aiofiles

# 5. Start server
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
```

## ✅ Verification Checklist

- [ ] Ollama is installed (`ollama --version`)
- [ ] Ollama is running (check http://localhost:11434/api/tags)
- [ ] Models are downloaded (`ollama list`)
- [ ] Python virtual environment created
- [ ] Dependencies installed
- [ ] API server starts without errors
- [ ] Health endpoint works (`curl http://localhost:8000/health`)

## 🎯 Next Steps

Once the API is running:

1. Test all endpoints (see README.md)
2. Update your frontend to use `http://localhost:8000`
3. Deploy to production (see OLLAMA_MIGRATION_GUIDE.md)

## 📚 Additional Resources

- Main README: `README.md`
- Migration Guide: `../../Debugging/02-Deployment/OLLAMA_MIGRATION_GUIDE.md`
- Quick Reference: `../../Debugging/02-Deployment/OLLAMA_QUICK_REFERENCE.md`
