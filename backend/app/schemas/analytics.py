"""Schemas for watershed analytics: per-location rollups, trusted-source sections,
per-observation analytics, and basin trend snapshots."""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LocationStat(BaseModel):
    """Aggregated citizen observations for one site/location."""
    site_name: str
    location_address: str | None = None
    latitude: float
    longitude: float
    total: int = 0
    normal: int = 0
    watch: int = 0
    investigate: int = 0
    verified: int = 0
    pending: int = 0
    flagged: int = 0
    avg_confidence: float = 0.0
    views: int = 0
    likes: int = 0
    comments: int = 0
    last_observed: datetime | None = None


class TrustedSite(BaseModel):
    """A monitoring site from a trusted (scraped/curated) source."""
    site_name: str
    basin_name: str
    latitude: float
    longitude: float
    description: str | None = None
    catchment_area_sq_km: float | None = None
    baseline_quality: str = "normal"


class TrustedSiteSection(BaseModel):
    """Trusted sites sectionized by basin."""
    basin_name: str
    sites: list[TrustedSite] = Field(default_factory=list)


class BasinSnapshot(BaseModel):
    """One day of regional basin analytics from trusted sources."""
    snapshot_date: date
    basin_name: str
    total_samples: int
    normal_count: int
    watch_count: int
    investigate_count: int
    verified_rate: float
    health_index_score: float


class RegionAnalyticsResponse(BaseModel):
    """Full public watershed analytics payload."""
    locations: list[LocationStat] = Field(default_factory=list)
    trusted_sections: list[TrustedSiteSection] = Field(default_factory=list)
    basin_snapshots: list[BasinSnapshot] = Field(default_factory=list)


class AIEvaluationMetrics(BaseModel):
    """Aggregate human-feedback metrics for responsible AI evaluation."""
    total_observations: int = 0
    vision_assessed: int = 0
    questionnaire_only: int = 0
    observations_with_consistency_flags: int = 0
    reviewed_with_alignment: int = 0
    reviewer_agreements: int = 0
    reviewer_overrides: int = 0
    agreement_rate: float | None = None


class ObservationEngagement(BaseModel):
    views: int = 0
    likes: int = 0
    comments: int = 0


class RegionContext(BaseModel):
    """How this observation sits within its site/location cohort."""
    site_name: str
    total_at_site: int = 0
    avg_confidence: float = 0.0
    normal: int = 0
    watch: int = 0
    investigate: int = 0
    verified: int = 0
    engagement_rank: int | None = None
    top_confidence: float = 0.0


class ObservationAnalytics(BaseModel):
    """Per-observation watershed analytics."""
    observation_id: UUID
    site_name: str
    signal: str
    status: str
    confidence: float
    consistency_flag_count: int = 0
    engagement: ObservationEngagement = Field(default_factory=ObservationEngagement)
    ai: dict = Field(default_factory=dict, description="AI trail meta: source, model, prompt_version, image_count, analysed_at")
    site_context: TrustedSite | None = None
    region: RegionContext | None = None
