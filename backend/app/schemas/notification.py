"""Schemas for the in-app notification engine."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str
    body: str | None = None
    observation_id: UUID | None = None
    actor_name: str | None = None
    read: bool = False
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationRead] = Field(default_factory=list)
    unread_count: int = 0
