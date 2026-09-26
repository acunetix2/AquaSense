from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


SignalType = Literal["normal", "watch", "investigate"]
StatusType = Literal["pending", "verified", "flagged"]


class ObservationBase(BaseModel):
    site_name: str = Field(..., min_length=2, max_length=255)
    location_address: str | None = Field(None, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    # Primary image (legacy compat)
    image_url: str | None = None
    # Up to 3 image URLs
    image_urls: list[str] = Field(default_factory=list, description="Up to 3 image URLs for multi-image support")
    water_appearance: str | None = Field(None, max_length=100)
    odour: str | None = Field(None, max_length=100)
    waste_visible: bool = False
    flow_rate: str | None = Field(None, max_length=100)
    notes: str | None = Field(None, max_length=2000)
    assessment_answers: dict = Field(default_factory=dict)

    # Submitter / Observer profile association
    user_id: str | None = None
    observer_name: str | None = None
    observer_email: str | None = None  # redacted in public responses
    observer_avatar: str | None = None
    observer_location: str | None = None
    observer_role: str | None = None


class ObservationCreate(ObservationBase):
    user_id: str = Field(..., min_length=1, description="ID of the submitting user")

    # Optional base64 images for AI analysis (up to 3, stripped before persistence)
    image_data: str | None = Field(
        None,
        description="Base64-encoded primary image (with or without data-URI prefix). "
                    "Used for GROQ AI analysis; not stored in DB.",
        exclude=True,
    )
    image_data_list: list[str] = Field(
        default_factory=list,
        description="Base64 images for all uploaded files (up to 3). Used for multi-image AI analysis.",
        exclude=True,
    )
    image_mime: str = Field(default="image/jpeg", exclude=True)

    # Pre-computed AI fields (set by service after analysis)
    signal: SignalType = "normal"
    confidence: float = 0.0
    ai_summary: str | None = None
    key_evidence: list[str] = Field(default_factory=list)
    suggested_steps: list[str] = Field(default_factory=list)


class ObservationUpdate(BaseModel):
    """Partial editable fields – owner-only PATCH."""
    site_name: str | None = Field(None, min_length=2, max_length=255)
    location_address: str | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    notes: str | None = Field(None, max_length=2000)
    water_appearance: str | None = Field(None, max_length=100)
    odour: str | None = Field(None, max_length=100)
    waste_visible: bool | None = None
    flow_rate: str | None = Field(None, max_length=100)
    image_url: str | None = None
    image_urls: list[str] | None = None


class ObservationReview(BaseModel):
    """Payload for a reviewer to verify or flag an observation."""

    action: Literal["verified", "flagged"] = Field(
        ..., description="Review decision: 'verified' or 'flagged'."
    )
    reviewer_name: str = Field(..., min_length=2, max_length=255)
    notes: str = Field(default="", max_length=2000)


class ConsistencyFlag(BaseModel):
    """
    A single image-quality or answer-vs-photo consistency issue (PRD FR-06/FR-07).
    Never overrides the observer: they may confirm their answer or correct it.
    """

    field: str = Field(..., description="Answer field the flag refers to")
    type: Literal["consistency", "image_quality"] = "consistency"
    reported: str = ""
    observed: str = ""
    message: str
    severity: Literal["info", "warning"] = "warning"


class AnalysisMeta(BaseModel):
    """Audit metadata describing how an AI assessment was produced (decision trail)."""

    source: Literal["groq", "heuristic", "questionnaire", "step4_reuse"] = "questionnaire"
    model: str = "none"
    prompt_version: str = "unknown"
    image_count: int = 0
    analysed_at: str = Field(..., description="ISO-8601 timestamp")


class ObservationRead(ObservationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    signal: str
    confidence: float
    ai_summary: str | None = None
    key_evidence: list[str] = []
    suggested_steps: list[str] = []
    consistency_flags: list[ConsistencyFlag] = []
    ai_trail: dict = Field(default_factory=dict, description="AI decision trail metadata")
    status: str = "pending"
    reviewer_notes: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    updated_at: datetime | None = None
    created_at: datetime
    # Social state — computed per request, not stored on the observation row
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False


# ---------------------------------------------------------------------------
# Image analysis request / response
# ---------------------------------------------------------------------------

class ImageAnalysisRequest(BaseModel):
    """Payload for the standalone /analyze-image endpoint."""
    image_data: str = Field(..., description="Base64-encoded image (with or without data-URI prefix).")
    image_mime: str = Field(default="image/jpeg")
    site_name: str = Field(default="Unknown site", max_length=255)
    water_appearance: str = Field(default="not specified", max_length=100)
    odour: str = Field(default="not specified", max_length=100)
    waste_visible: bool = False
    flow_rate: str = Field(default="not specified", max_length=100)
    notes: str = Field(default="", max_length=2000)
    assessment_answers: dict = Field(
        default_factory=dict,
        description="Raw questionnaire answers (e.g. unusualColor) used for consistency checks.",
    )


class MultiImageAnalysisRequest(BaseModel):
    """Payload for multi-image analysis (up to 3 images)."""
    image_data_list: list[str] = Field(
        ..., min_length=1, max_length=3,
        description="List of up to 3 base64-encoded images."
    )
    image_mime: str = Field(default="image/jpeg")
    site_name: str = Field(default="Unknown site", max_length=255)
    water_appearance: str = Field(default="not specified", max_length=100)
    odour: str = Field(default="not specified", max_length=100)
    waste_visible: bool = False
    flow_rate: str = Field(default="not specified", max_length=100)
    notes: str = Field(default="", max_length=2000)
    assessment_answers: dict = Field(
        default_factory=dict,
        description="Raw questionnaire answers (e.g. unusualColor) used for consistency checks.",
    )


class EcosystemIndicators(BaseModel):
    turbidity: str
    algae_presence: str
    waste_visible: bool
    flow_condition: str
    bank_condition: str
    color_anomaly: str


class ImageAnalysisResponse(BaseModel):
    signal: SignalType
    confidence: float
    title: str
    summary: str
    water_quality_score: int
    detected_issues: list[str]
    key_evidence: list[str]
    suggested_steps: list[str]
    ecosystem_indicators: EcosystemIndicators
    urgency: str
    consistency_flags: list[ConsistencyFlag] = []
    analysis_meta: AnalysisMeta | None = None
