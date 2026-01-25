@echo off
REM Start script for Multimodal AI Backend (Windows)

echo 🚀 Starting CtrlChecks Multimodal AI Backend...

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Check for API key
if "%HUGGINGFACE_API_KEY%"=="" (
    echo ⚠️  WARNING: HUGGINGFACE_API_KEY not set!
    echo    Set it with: set HUGGINGFACE_API_KEY=your_key
)

REM Start server
echo ✅ Starting FastAPI server on http://localhost:8000
echo 📖 API docs available at http://localhost:8000/docs
echo.
python main.py

