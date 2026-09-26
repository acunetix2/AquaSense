import uuid
from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import UUID, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    site_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    basin_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    catchment_area_sq_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    baseline_quality: Mapped[str] = mapped_column(String(32), default="normal", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
