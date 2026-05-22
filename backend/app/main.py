# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import get_redis, close_redis
# Register all models
from app.models import ( user, workspace, task,  notification,)  # noqa: F401
# API routers
from app.api import (auth, workspaces, tasks, notifications, analytics,)
# WebSocket router
from app.websockets.router import router as ws_router
# ─────────────────────────────────────────────
# Lifespan
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Warm Redis connection pool
    await get_redis()
    print("All systems ready ✓")
    yield
    # Shutdown
    await close_redis()
    await engine.dispose()
    print("Shutdown complete")
# ─────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ─────────────────────────────────────────────
# REST API Routes
# ─────────────────────────────────────────────
app.include_router(auth.router,   prefix="/api/v1/auth", tags=["Auth"],)
app.include_router( workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"],)
app.include_router( tasks.router, prefix="/api/v1/workspaces", tags=["Tasks"],)
app.include_router( notifications.router, prefix="/api/v1/notifications", tags=["Notifications"],)
app.include_router( analytics.router, prefix="/api/v1/workspaces", tags=["Analytics"],)
# ─────────────────────────────────────────────
# WebSocket Routes
# ─────────────────────────────────────────────
app.include_router( ws_router, tags=["WebSocket"],)
# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    redis = await get_redis()
    await redis.ping()
    from app.websockets.manager import manager
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ws_connections": manager.connection_count(),
    }