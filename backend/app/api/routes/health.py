from fastapi import APIRouter

from app.db.session import check_database_connection

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
async def health_check() -> dict[str, str]:
    db_ok = await check_database_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "AquaSense API",
        "database": "connected" if db_ok else "disconnected",
    }
