import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, auth, health, notifications, observations, profiles
from app.core.config import get_settings
from app.db.session import check_database_connection, create_db

logger = logging.getLogger(__name__)
settings = get_settings()
# Comma-separated origins from CORS_ORIGINS (e.g. "https://app.vercel.app,http://localhost:5173"),
# or "*" to allow every origin.
cors_origins = [
    origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
] or ["*"]


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting AquaSense API lifecycle.")
    try:
        await create_db()
        db_ok = await check_database_connection()
        if db_ok:
            logger.info("Database startup validation passed: connected.")
        else:
            logger.warning("Database startup validation failed: disconnected or unavailable.")
    except Exception as exc:  # pragma: no cover
        logger.exception("Database startup validation failed: %s", exc)
    yield


app = FastAPI(
    title="AquaSense API",
    description="Backend for citizen science observation, review, and environmental assessment workflows.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(observations.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")


@app.api_route("/", methods=["GET", "HEAD"])
def root() -> dict[str, str]:
    return {"message": "AquaSense API is running."}
