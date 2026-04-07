#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js 20+ from https://nodejs.org/"
  exit 1
fi

echo
echo "=============================================================="
echo "                 WEBCLAW HYBRID ENGINE BOOT"
echo "=============================================================="
echo
echo "[1/3] Installing dependencies (npm install)"
npm install

echo
echo "[2/3] Running setup (Playwright Chromium + webclaw binary)"
npm run setup

echo
echo "[3/3] Starting WebClaw Hybrid Engine"
echo
echo "=============================================================="
echo " DASHBOARD URL"
echo " ------------------------------------------------------------"
echo "   http://localhost:558822"
echo
echo " IMPORTANT: Open URL above in your browser to see dashboard."
echo "=============================================================="
echo
exec npm start
