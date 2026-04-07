@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Node.js/npm not found. Install Node.js 20+ from https://nodejs.org/
  exit /b 1
)

echo.
echo ==============================================================
echo                  WEBCLAW HYBRID ENGINE BOOT
echo ==============================================================
echo.
echo [1/3] Installing dependencies ^(npm install^)
call npm install
if errorlevel 1 exit /b 1

echo.
echo [2/3] Running setup ^(Playwright Chromium + webclaw binary^)
call npm run setup
if errorlevel 1 exit /b 1

echo.
echo [3/3] Starting WebClaw Hybrid Engine
echo.
echo ==============================================================
echo  DASHBOARD URL
echo  ------------------------------------------------------------
echo    http://localhost:558822
echo.
echo  IMPORTANT: Open URL above in your browser to see dashboard.
echo ==============================================================
echo.
call npm start
endlocal
exit /b 0
