import uuid
from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import UUID, Date, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BasinAnalytics(Base):
    __tablename__ = "basin_analytics"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    snapshot_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    basin_name: Mapped[str] = mapped_column(String(255), default="Regional Basin", nullable=False)
    total_samples: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    normal_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    watch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    investigate_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verified_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    health_index_score: Mapped[float] = mapped_column(Float, default=75.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
