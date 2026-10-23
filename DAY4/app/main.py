import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import projects, tasks, activity, dashboard

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application start
    init_db()
    yield


app = FastAPI(
    title="FlowForge API",
    description="Turn ambitious plans into meaningful progress. Premium SaaS Project Management.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(activity.router)
app.include_router(dashboard.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "app": "FlowForge",
        "tagline": "Turn ambitious plans into meaningful progress.",
        "version": "1.0.0",
    }


# Ensure static directory exists
STATIC_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/")
async def read_index():
    """Serve the single-page frontend application."""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "FlowForge API is running. Frontend index.html not yet initialized."}


# Mount static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Also mount static directory at root as fallback for relative assets (css, js, etc.)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static_root")
