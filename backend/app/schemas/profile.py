from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpsert(BaseModel):
    """Payload to create or update a user profile (called on every login)."""
    user_id: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    full_name: str = Field(..., min_length=1, max_length=255)
    avatar_url: str | None = None
    role: str = Field(default="citizen", max_length=64)
    bio: str | None = None
    organization: str | None = None
    phone: str | None = None
    location: str | None = None
    website: str | None = None


class ProfileUpdate(BaseModel):
    """Partial updates the user may apply via Settings page."""
    full_name: str | None = Field(None, max_length=255)
    avatar_url: str | None = None
    role: str | None = Field(None, max_length=64)
    bio: str | None = None
    organization: str | None = None
    phone: str | None = None
    location: str | None = None
    website: str | None = None


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    # email intentionally omitted from public read schema
    full_name: str
    avatar_url: str | None = None
    role: str
    bio: str | None = None
    organization: str | None = None
    phone: str | None = None
    location: str | None = None
    website: str | None = None
    observations_count: int
    verified_count: int
    followers_count: int = 0
    following_count: int = 0
    likes_received: int = 0
    created_at: datetime
    updated_at: datetime


class ProfileReadWithEmail(ProfileRead):
    """Extended schema for the owner's own profile – includes email."""
    email: str
