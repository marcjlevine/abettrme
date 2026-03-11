# A Bettr Me — Project Status

## What this is
A self-improvement gamification app. Log activities (good/bad) that earn/cost points.
Spend points on rewards. Track progress over time.

## Tech Stack
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Frontend: React + Vite + Tailwind CSS + TanStack Query + React Router

## Points Model
- **All-time points** = SUM of all activity_log.points_snapshot (+ and -, excludes redemptions)
- **Current points** = all_time_points - SUM of reward_redemptions.points_snapshot
- Points snapshot is stored at time of logging (preserves history if activity edited later)

## What's Been Built
All code is scaffolded and ready to run. Nothing has been tested yet.

### Backend (`/backend`)
- `app/models/` — Activity, Reward, ActivityLog, RewardRedemption (all with soft delete)
- `app/schemas/` — Pydantic v2 schemas for all models
- `app/routers/` — Full CRUD for activities, rewards, logs; redeem endpoint; progress summary
- `app/main.py` — FastAPI app with CORS for localhost:5173
- `alembic/versions/0001_initial_schema.py` — Initial migration (not yet run)
- `.env` — DATABASE_URL set to postgresql://abettrme:abettrme@localhost:5432/abettrme

### Frontend (`/frontend`)
- `src/pages/Activities.jsx` — List/create/edit/delete activities
- `src/pages/Rewards.jsx` — List/create/edit/delete rewards, redeem button with balance check
- `src/pages/Log.jsx` — List/create/edit/delete activity log entries
- `src/pages/Progress.jsx` — Current/all-time point totals, date-range timeline of entries
- `src/components/` — Navbar, Modal, ConfirmDialog
- `src/lib/api.js` — All API calls via axios, proxied through Vite to localhost:8000

### Database
- `docker-compose.yml` at project root — runs PostgreSQL 16 in a container
- Credentials: user=abettrme, password=abettrme, db=abettrme, port=5432

## Where We Left Off
Trying to get Docker + PostgreSQL running. Blocked by WSL1.
**Next step: upgrade WSL to v2, then run the app for the first time.**

## First-Time Startup Sequence (after WSL2 + Docker working)
```
# 1. Start postgres
cd ~/src/abettrme
docker-compose up -d

# 2. Backend (Terminal 2)
cd ~/src/abettrme/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend (Terminal 3)
cd ~/src/abettrme/frontend
npm install
npm run dev
```
Then open http://localhost:5173
API docs at http://localhost:8000/docs
