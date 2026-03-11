# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```bash
./dev.sh
```

Starts PostgreSQL (Docker, detached), the backend, and the frontend. Ctrl+C kills all three.

- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:8000/docs

## Database Migrations

Alembic migrations run from `/backend` with the venv active. The `DATABASE_URL` is read from `backend/.env` — `alembic.ini` has a placeholder URL that is overridden by `alembic/env.py`.

```bash
# Apply migrations
alembic upgrade head

# Create a new migration (after changing models)
alembic revision --autogenerate -m "description"
```

## Architecture

### Backend (`/backend`)

FastAPI app in `app/`:
- `main.py` — app entry point, CORS config (allows localhost:5173), router registration
- `database.py` — SQLAlchemy engine + `get_db` dependency, `Base` class
- `models/` — SQLAlchemy models (Activity, Reward, ActivityLog, RewardRedemption)
- `schemas/` — Pydantic v2 schemas (Create/Update/Out variants)
- `routers/` — one file per resource: activities, rewards, logs, redemptions, progress

All four models use **soft deletes** (`deleted_at` timestamp). All queries filter `deleted_at.is_(None)`.

### Frontend (`/frontend`)

React + Vite app in `src/`:
- `App.jsx` — router setup; default route redirects `/` → `/progress`
- `pages/` — full-page components (Progress, Activities, Rewards, Log)
- `components/` — Navbar, Modal, ConfirmDialog (shared UI)
- `lib/api.js` — all API calls via axios; `baseURL: "/api"` proxied by Vite to `localhost:8000`

TanStack Query handles server state. No global state manager.

### Points Model

- **All-time points** = `SUM(activity_log.points_snapshot)` where `deleted_at IS NULL`
- **Current points** = all-time points − `SUM(reward_redemptions.points_snapshot)` where `deleted_at IS NULL`
- `points_snapshot` is captured at log/redemption time, so editing an activity's point value doesn't retroactively change history.

Activities have a `points` field that can be positive or negative (good habits vs. bad habits).

### API → Frontend Proxy

Vite proxies `/api/*` → `http://localhost:8000/*`, stripping the `/api` prefix. All frontend API calls use relative `/api/...` paths — no hardcoded backend URLs.
