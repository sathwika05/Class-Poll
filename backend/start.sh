#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d venv ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi
export PYTHONPATH="$(pwd)/venv/lib/python3.12/site-packages"
echo "Starting backend on http://0.0.0.0:8000 (reachable from phones on same Wi-Fi)"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
