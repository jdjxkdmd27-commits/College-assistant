import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base
from .routers import auth, tickets, locations, ai

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="УПК: Цифровой помощник колледжа")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(locations.router)
app.include_router(ai.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
