#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Checking Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker Desktop / Docker Engine."
  exit 1
fi

echo "[2/4] Starting WebClaw Hybrid Gateway..."
docker compose up -d --build --remove-orphans

echo "[3/4] Waiting for gateway health..."
for i in {1..30}; do
  if curl -fsS "http://localhost:8822/health" >/dev/null 2>&1; then
    echo "[4/4] Gateway is healthy."
    echo "Open: http://localhost:8822"
    exit 0
  fi
  sleep 2
done

echo "Gateway did not become healthy in time."
exit 1
