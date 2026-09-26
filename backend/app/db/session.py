import logging
import os
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.base import Base

logger = logging.getLogger(__name__)
settings = get_settings()
log_sql = os.getenv("AQUASENSE_LOG_SQL", "false").strip().lower() in {"1", "true", "yes", "on"}

database_url = settings.database_url or (
    "sqlite+aiosqlite:///./aquasense.db" if settings.environment != "production" else ""
)
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine_kwargs = {
    "echo": log_sql,
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "connect_args": {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
}
if database_url.startswith("sqlite"):
    engine_kwargs = {
        "echo": log_sql,
        "connect_args": {"check_same_thread": False},
    }

engine = create_async_engine(database_url, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def check_database_connection() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection check succeeded.")
        return True
    except Exception:
        logger.exception("Database connection check failed.")
        return False


async def create_db() -> None:
    logger.info("Ensuring database tables exist.")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialization complete.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
