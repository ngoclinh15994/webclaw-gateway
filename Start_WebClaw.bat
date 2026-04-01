@echo off
setlocal

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Docker CLI not found. Please install Docker Desktop first.
  start "" "https://www.docker.com/products/docker-desktop/"
  exit /b 1
)

echo [1/4] Checking Docker daemon...
docker info >nul 2>&1
if errorlevel 1 (
  echo Docker daemon is not running. Please start Docker Desktop first.
  exit /b 1
)

echo [2/4] Starting WebClaw Hybrid Gateway...
docker compose up -d --build --remove-orphans
if errorlevel 1 (
  echo Failed to run docker compose up.
  exit /b 1
)

echo [3/4] Waiting for gateway health...
set /a RETRIES=30
:wait_loop
curl -fsS http://localhost:8822/health >nul 2>&1
if not errorlevel 1 goto open_browser
set /a RETRIES-=1
if %RETRIES% LEQ 0 (
  echo Gateway did not become healthy in time.
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto wait_loop

:open_browser
echo [4/4] Opening dashboard...
start "" "http://localhost:8822"
echo WebClaw Hybrid Gateway is ready at http://localhost:8822
endlocal
exit /b 0
