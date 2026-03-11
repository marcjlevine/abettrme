#!/bin/bash
set -e

cd "$(dirname "$0")"

source venv/bin/activate

echo "Running migrations..."
alembic upgrade head

echo "Starting API server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
