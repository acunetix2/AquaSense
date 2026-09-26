"""Notification engine.

Generates and serves in-app notifications for meaningful platform events:
review decisions on your observations, new comments, new likes, and new
followers. Fire-and-forget from the services that cause the events.

Rules (Agents.md §8 — minimize data):
- No self-notifications (actor == recipient is skipped).
- Ownerless observations (user_id NULL) generate no notification.
- Bodies are truncated; only display names are stored.
"""
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.schemas.notification import NotificationListResponse, NotificationRead


class NotificationService:
    MAX_BODY = 200

    @staticmethod
    async def notify(
        db: AsyncSession,
        *,
        user_id: str | None,
        type: str,
        title: str,
        body: str | None = None,
        observation_id: UUID | None = None,
        actor_id: str | None = None,
        actor_name: str | None = None,
    ) -> None:
        """Persist a notification. Skips missing recipients and self-events."""
        if not user_id:
            return
        if actor_id and actor_id == user_id:
            return

        trimmed = (body or "").strip()[: NotificationService.MAX_BODY] or None
        db.add(
            Notification(
                user_id=user_id,
                type=type,
                title=title[:255],
                body=trimmed,
                observation_id=observation_id,
                actor_id=actor_id,
                actor_name=actor_name,
                read=False,
            )
        )
        await db.commit()

    @staticmethod
    async def list_for_user(db: AsyncSession, user_id: str, limit: int = 30) -> NotificationListResponse:
        """Latest notifications for a user plus the unread count (2 queries)."""
        rows = (
            await db.execute(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc(), Notification.id.desc())
                .limit(limit)
            )
        ).scalars().all()
        unread = (
            await db.execute(
                select(func.count())
                .select_from(Notification)
                .where(Notification.user_id == user_id, Notification.read.is_(False))
            )
        ).scalar() or 0
        return NotificationListResponse(
            items=[NotificationRead.model_validate(n) for n in rows],
            unread_count=int(unread),
        )

    @staticmethod
    async def mark_read(db: AsyncSession, notification_id: UUID, user_id: str) -> NotificationRead | None:
        """Mark one notification read. Returns None when missing or not owned by user_id."""
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        if notification is None:
            return None
        if not notification.read:
            notification.read = True
            await db.commit()
            await db.refresh(notification)
        return NotificationRead.model_validate(notification)

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: str) -> int:
        """Mark every unread notification for user_id as read. Returns rows affected."""
        result = await db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read.is_(False))
            .values(read=True)
        )
        await db.commit()
        return int(result.rowcount or 0)
