from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import activities, rewards, logs, redemptions, progress, fields

app = FastAPI(title="A Bettr Me API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(activities.router)
app.include_router(fields.router)
app.include_router(rewards.router)
app.include_router(logs.router)
app.include_router(redemptions.router)
app.include_router(progress.router)


@app.get("/health")
def health():
    return {"status": "ok"}
