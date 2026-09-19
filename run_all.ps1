# Fake Info Detector - Multi-Modal AI Platform
# PowerShell Service Orchestrator for VS Code

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Fake Info Detector - Multi-Modal AI Platform   " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting all 3 services locally...`n"

$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = $PWD }

# Add portable nodejs to PATH if present
$portableNode = Join-Path $baseDir "bin\nodejs"
if (Test-Path (Join-Path $portableNode "node.exe")) {
    $env:PATH = "$portableNode;$baseDir\bin;$env:PATH"
}

# 1. AI Engine
Write-Host "[1/3] Starting AI Engine (FastAPI on http://localhost:8000)..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Fake Info - AI Engine && cd /d `"$baseDir\ai-engine`" && call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Backend
Write-Host "[2/3] Starting Backend (Express on http://localhost:5000)..." -ForegroundColor Blue
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Fake Info - Backend API && cd /d `"$baseDir\backend`" && set PATH=$portableNode;%PATH% && node src/server.js"

# 3. Frontend
Write-Host "[3/3] Starting Frontend (Next.js on http://localhost:3000)..." -ForegroundColor Magenta
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Fake Info - Frontend && cd /d `"$baseDir\frontend`" && set PATH=$portableNode;%PATH% && node node_modules/next/dist/bin/next dev -p 3000"

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "All 3 services launched in separate windows!" -ForegroundColor Green
Write-Host "- AI Engine: http://localhost:8000/docs"
Write-Host "- Backend:   http://localhost:5000/api"
Write-Host "- Frontend:  http://localhost:3000"
Write-Host "===================================================`n"
