@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo          FLOWFORGE - EDITORIAL PRODUCTIVITY SAAS
echo      Turn ambitious plans into meaningful progress
echo =======================================================
echo.

:: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not found on PATH.
    echo Please install Python 3.10+ from python.org and add to PATH.
    pause
    exit /b 1
)

:: Create Virtual Environment if not exists
if not exist ".venv" (
    echo [SETUP] Creating Python virtual environment in .venv...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo [WARNING] Failed to create .venv. Falling back to global Python.
    ) else (
        echo [SETUP] Activating virtual environment...
        call .venv\Scripts\activate.bat
        echo [SETUP] Installing required dependencies...
        python -m pip install -r requirements.txt
    )
) else (
    echo [SETUP] Activating existing virtual environment...
    call .venv\Scripts\activate.bat
)

echo.
echo [STARTING] Starting FlowForge Server on http://127.0.0.1:8000 ...
echo [API DOCS] Interactive Swagger documentation at http://127.0.0.1:8000/docs
echo.
echo Press Ctrl+C in this terminal to gracefully stop the application.
echo.

start "" "http://127.0.0.1:8000"

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
