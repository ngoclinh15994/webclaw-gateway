@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Node.js/npm not found. Install Node.js 20+ from https://nodejs.org/
  exit /b 1
)

echo [1/3] npm install...
call npm install
if errorlevel 1 exit /b 1

echo [2/3] npm run setup ^(Playwright Chromium + webclaw binary^)...
call npm run setup
if errorlevel 1 exit /b 1

echo [3/3] Starting WebClaw Hybrid Gateway...
echo Open http://localhost:8822 when ready.
call npm start
endlocal
exit /b 0
