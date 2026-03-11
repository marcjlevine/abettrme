#!/bin/bash
set -e

# Start postgres (detached)
docker-compose up -d

# Kill background jobs on Ctrl+C
trap 'kill $(jobs -p) 2>/dev/null' SIGINT SIGTERM

# Backend
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload) &

# Frontend
(cd frontend && npm run dev) &

wait
