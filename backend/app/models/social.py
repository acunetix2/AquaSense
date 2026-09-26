"""Social graph tables: observation comments, likes, and profile follow edges."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ObservationComment(Base):
    __tablename__ = "observation_comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("observations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    author_role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class ObservationLike(Base):
    __tablename__ = "observation_likes"
    __table_args__ = (UniqueConstraint("observation_id", "user_id", name="uq_observation_like"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    observation_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("observations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class ProfileFollow(Base):
    __tablename__ = "profile_follows"
    __table_args__ = (UniqueConstraint("follower_id", "followee_id", name="uq_profile_follow"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    follower_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    followee_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class ProfileLike(Base):
    __tablename__ = "profile_likes"
    __table_args__ = (UniqueConstraint("target_id", "liker_id", name="uq_profile_like"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    target_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    liker_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
