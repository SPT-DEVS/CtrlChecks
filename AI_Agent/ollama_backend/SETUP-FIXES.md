# Setup Fixes Applied - Windows

## ✅ Issues Fixed

### 1. **Pydantic Installation Error (Rust Required)**
**Problem:** `pydantic==2.5.0` requires `pydantic-core` which needs Rust to compile on Windows.

**Fix:** Updated `requirements.txt` to use `pydantic>=2.8.0` which has pre-built wheels for Windows (no Rust needed).

### 2. **Import Path Error**
**Problem:** `from src.models.model_manager import ModelManager` was using incorrect relative path.

**Fix:** Changed to `from ..models.model_manager import ModelManager` in `endpoints.py`.

### 3. **Config Path Issues**
**Problem:** Config file path resolution was too strict.

**Fix:** Updated `model_manager.py` to try multiple paths and provide sensible defaults if config file not found.

### 4. **Windows-Specific Setup**
**Problem:** No Windows-specific setup instructions or scripts.

**Fix:** Created:
- `setup-windows.ps1` - Automated Windows setup script
- `start-api.ps1` - Easy server startup script
- `README-WINDOWS.md` - Complete Windows guide

### 5. **Ollama Already Running**
**Problem:** Port 11434 already in use (Ollama is already running).

**Fix:** Setup script now detects if Ollama is running and uses existing instance.

## 🚀 Quick Setup (Run These Commands)

### Step 1: Navigate to Directory
```powershell
cd C:\Users\User\Desktop\ctrlchecks-ai-workflow-os\AI_Agent\ollama_backend
```

### Step 2: Run Setup Script
```powershell
.\setup-windows.ps1
```

This will:
- ✅ Check Ollama installation
- ✅ Verify Ollama is running (or tell you to start it)
- ✅ Check Python installation
- ✅ Pull missing models
- ✅ Create virtual environment
- ✅ Install all dependencies (with fixed versions)

### Step 3: Start API Server
```powershell
.\start-api.ps1
```

Or manually:
```powershell
.\venv\Scripts\Activate.ps1
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
```

## 🔍 If Setup Script Fails

### Manual Installation

```powershell
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
.\venv\Scripts\Activate.ps1

# 3. Upgrade pip
python -m pip install --upgrade pip

# 4. Install dependencies (using fixed versions)
pip install fastapi>=0.104.1 uvicorn[standard]>=0.24.0 pydantic>=2.8.0 httpx>=0.25.1 PyYAML>=6.0.1 python-multipart>=0.0.6 websockets>=12.0 aiofiles>=23.2.1

# 5. Start server
uvicorn src.api.endpoints:app --host 0.0.0.0 --port 8000 --reload
```

## ✅ Verification

After setup, test the API:

```powershell
# Health check
curl http://localhost:8000/health

# Should return: {"status": "healthy", "service": "ollama-api"}
```

## 📝 Notes

1. **Ollama Must Be Running**: The API needs Ollama running on port 11434. If you see "port already in use", that's fine - Ollama is already running!

2. **Models Already Downloaded**: From your terminal output, I can see you already have:
   - qwen2.5:7b ✅
   - llama3:8b ✅
   - mistral:7b ✅

3. **Virtual Environment**: The setup script creates a `venv` folder. Always activate it before running the server:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

## 🎯 Next Steps

1. Run `.\setup-windows.ps1` to complete setup
2. Run `.\start-api.ps1` to start the server
3. Test with `curl http://localhost:8000/health`
4. Update your frontend to use `http://localhost:8000` instead of Hugging Face

## 📚 Documentation

- **Windows Guide**: `README-WINDOWS.md`
- **Main README**: `README.md`
- **Migration Guide**: `../../Debugging/02-Deployment/OLLAMA_MIGRATION_GUIDE.md`
