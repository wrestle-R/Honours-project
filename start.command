#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")" && pwd)"
cd "$project_root"
if [ ! -x backend/.venv/bin/python ] || [ ! -d next/node_modules ]; then
  echo "Dependencies are missing. Run ./setup.command once, then ./start.command."
  exit 1
fi
backend_pid=""
cleanup() {
  if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
backend_ready() {
  backend/.venv/bin/python - <<'PY'
import json, urllib.request
try:
    with urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=1) as response:
        data=json.load(response)
    ready=data.get('service')=='chest-xray-demo' and all(name in data.get('loaded_models',[]) for name in ['resnet50','densenet121'])
except Exception:
    ready=False
raise SystemExit(0 if ready else 1)
PY
}
if [ -n "${LUCENT_API_URL:-}" ]; then
  echo "Using the configured model service."
elif backend_ready; then
  echo "Reusing the running Lucent backend on port 8000."
else
  ./start_backend.command &
  backend_pid=$!
  for attempt in $(seq 1 60); do
    if backend_ready; then break; fi
    if ! kill -0 "$backend_pid" 2>/dev/null; then echo "Backend startup failed. See the error above."; exit 1; fi
    sleep 1
  done
  if ! backend_ready; then echo "The backend did not become ready. Check the model files and startup logs."; exit 1; fi
fi
echo "Starting the website at http://localhost:${PORT:-3000}"
echo "Keep this terminal open. Press Ctrl+C to stop the services started here."
npm run dev --prefix next -- --port "${PORT:-3000}"
