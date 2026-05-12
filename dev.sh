#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Pick Python from venv if available, else system python3
if [ -f "$ROOT/.venv/bin/python" ]; then
  PYTHON="$ROOT/.venv/bin/python"
else
  PYTHON="python3"
fi

echo "[StealthPay] Starting backend on :5000 ..."
"$PYTHON" "$ROOT/backend/run.py" &
BACKEND_PID=$!

echo "[StealthPay] Starting frontend on :5173 ..."
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

# Kill both children when this script exits (Ctrl+C)
trap "echo '[StealthPay] Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

echo "[StealthPay] Both servers running. Press Ctrl+C to stop."
wait
