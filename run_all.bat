@echo off
TITLE Fake Info Detector - Service Orchestrator
echo ===================================================
echo     Fake Info Detector - Multi-Modal AI Platform
echo ===================================================
echo Starting all 3 services locally...
echo.

set "SCRIPT_DIR=%~dp0"

:: Add portable tools to path if present
if exist "%SCRIPT_DIR%bin\nodejs\node.exe" (
    set "PATH=%SCRIPT_DIR%bin\nodejs;%SCRIPT_DIR%bin;%PATH%"
)

:: Check Node
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not found in PATH or portable bin.
    echo Please install Node.js 18+
    pause
    exit /b 1
)

:: Check Python / venv
set "PYTHON_EXE=python"
if exist "%SCRIPT_DIR%ai-engine\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%SCRIPT_DIR%ai-engine\venv\Scripts\python.exe"
)

echo [1/3] Starting AI Engine (FastAPI on http://localhost:8000)...
start "Fake Info - AI Engine" /D "%SCRIPT_DIR%ai-engine" cmd /k "call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting Backend (Express on http://localhost:5000)...
start "Fake Info - Backend API" /D "%SCRIPT_DIR%backend" cmd /k "node src/server.js"

echo [3/3] Starting Frontend (Next.js on http://localhost:3000)...
start "Fake Info - Frontend" /D "%SCRIPT_DIR%frontend" cmd /k "node node_modules/next/dist/bin/next dev -p 3000"

echo.
echo ===================================================
echo All 3 services launched in separate windows!
echo - AI Engine docs: http://localhost:8000/docs
echo - Backend API:    http://localhost:5000/api
echo - Frontend UI:     http://localhost:3000
echo ===================================================
echo.
pause
