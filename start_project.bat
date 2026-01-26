@echo off
echo ===================================================
echo   Flow Genius AI - All-in-One Launcher
echo ===================================================
echo.

:MENU
echo Select an option:
echo 1. Start Frontend (Vite)
echo 2. Start Backend (FastAPI Multimodal)
echo 3. Start BOTH Frontend and Backend
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto START_FRONTEND
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_BOTH
if "%choice%"=="4" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:START_FRONTEND
echo Starting Frontend...
start cmd /k "npm run dev"
goto MENU

:START_BACKEND
echo Starting Fast_API_Ollama Backend...
cd ..\Fast_API_Ollama

:: Check if venv exists (basic check)
if exist "venv\Scripts\activate.bat" (
    call "venv\Scripts\activate.bat"
) else (
    echo Warning: Virtual environment not found at venv. 
    echo Attempting to run with globally available python or continuing...
)

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
goto MENU

:START_BOTH
echo Starting Fast_API_Ollama Backend in new window...
start "Fast_API_Ollama Backend" cmd /k "cd ..\Fast_API_Ollama && if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend in new window...
start "FlowGenius Frontend" cmd /k "npm run dev"

echo.
echo Both services have been launched in separate windows.
goto MENU

:EXIT
echo Exiting...
exit
