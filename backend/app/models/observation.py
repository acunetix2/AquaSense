import uuid
from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import UUID, Boolean, DateTime, Float, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Location
    site_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    location_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # Observation fields – support up to 3 image URLs stored as JSON array
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)          # primary / legacy
    image_urls: Mapped[list] = mapped_column(JSON, default=list, nullable=False)        # up to 3 images
    water_appearance: Mapped[str | None] = mapped_column(String(100), nullable=True)
    odour: Mapped[str | None] = mapped_column(String(100), nullable=True)
    waste_visible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    flow_rate: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment_answers: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # AI assessment
    signal: Mapped[str] = mapped_column(String(32), default="normal", nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_evidence: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    suggested_steps: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    # Image-quality / answer-vs-photo issues (PRD FR-06/FR-07)
    consistency_flags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    # Auditable record of how the AI produced the signal (Agents.md §5)
    ai_trail: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # Review / verification workflow
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Submitter / Observer profile association
    user_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("profiles.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    observer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observer_avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    observer_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observer_role: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Updated-at for editable observations
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=func.now(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
