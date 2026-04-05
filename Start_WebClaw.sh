#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js 20+ from https://nodejs.org/"
  exit 1
fi

echo "[1/3] npm install..."
npm install

echo "[2/3] npm run setup (Playwright Chromium + webclaw binary)..."
npm run setup

echo "[3/3] Starting WebClaw Hybrid Gateway..."
echo "Open http://localhost:8822 when ready."
exec npm start
