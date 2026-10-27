#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "$0")" && pwd)"
cd "$project_root"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Install Node.js 22 or newer, then run ./setup.command again."
  exit 1
fi
if command -v uv >/dev/null; then
  if [ ! -x backend/.venv/bin/python ]; then uv venv --python 3.12 backend/.venv; fi
  if [ "$(uname -s)" = Linux ]; then
    uv pip install --python backend/.venv/bin/python torch torchvision --index-url https://download.pytorch.org/whl/cpu
  fi
  uv pip install --python backend/.venv/bin/python -r backend/requirements.txt
else
  if ! command -v python3 >/dev/null; then echo "Install Python 3.12 and run this script again."; exit 1; fi
  if [ ! -x backend/.venv/bin/python ]; then python3 -m venv backend/.venv; fi
  if [ "$(uname -s)" = Linux ]; then
    backend/.venv/bin/python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  fi
  backend/.venv/bin/python -m pip install -r backend/requirements.txt
fi
npm ci --prefix next
echo "Setup complete. Run ./start.command to start Lucent."
