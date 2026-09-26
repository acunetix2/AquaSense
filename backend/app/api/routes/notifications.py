"""In-app notification endpoints (list, mark read, mark all read)."""
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.notification import NotificationListResponse, NotificationRead
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _require_user(x_user_id: str | None = Header(None)) -> str:
    """Extract and validate the X-User-Id request header."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required.",
        )
    return x_user_id


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    user_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationListResponse:
    """Latest notifications for the signed-in user plus the unread count."""
    return await NotificationService.list_for_user(db, user_id)


@router.post("/read-all", response_model=dict)
async def mark_all_notifications_read(
    user_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark every unread notification as read for the signed-in user."""
    marked = await NotificationService.mark_all_read(db, user_id)
    return {"marked": marked, "unread_count": 0}


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: UUID,
    user_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationRead:
    """Mark a single notification read. 404 when missing or not owned by the caller."""
    result = await NotificationService.mark_read(db, notification_id, user_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return result
