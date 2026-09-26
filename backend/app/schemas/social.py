"""Schemas for comments, likes, and follow state."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    """Payload to comment on an observation."""
    body: str = Field(..., min_length=1, max_length=1000)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    observation_id: UUID
    user_id: str
    author_name: str
    author_avatar: str | None = None
    author_role: str | None = None
    body: str
    created_at: datetime


class LikeState(BaseModel):
    """Result of a like/unlike action."""
    liked: bool
    like_count: int


class ViewCount(BaseModel):
    """Result of recording an observation view (unique per viewer)."""
    view_count: int
