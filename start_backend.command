#!/bin/bash
set -e
cd "$(dirname "$0")/backend"
if [ ! -x .venv/bin/python ]; then
  echo "The Python environment is missing. Follow README.md to install it."
  exit 1
fi
echo "Loading both models and starting the backend at http://127.0.0.1:8000 ..."
exec .venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
