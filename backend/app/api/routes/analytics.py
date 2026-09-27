"""Public watershed analytics endpoints (region rollups + per-observation)."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.analytics import AIEvaluationMetrics, ObservationAnalytics, RegionAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/ai-evaluation", response_model=AIEvaluationMetrics)
async def ai_evaluation_metrics(db: AsyncSession = Depends(get_db)) -> AIEvaluationMetrics:
    """Responsible-AI metrics derived from reviewers' explicit alignment decisions."""
    return await AnalyticsService.ai_evaluation_metrics(db)


@router.get("/regions", response_model=RegionAnalyticsResponse)
async def region_analytics(db: AsyncSession = Depends(get_db)) -> RegionAnalyticsResponse:
    """Per-location rollups, trusted-source sections (by basin), and basin snapshots."""
    return await AnalyticsService.region_breakdown(db)


@router.get("/observations/{observation_id}", response_model=ObservationAnalytics)
async def observation_analytics(
    observation_id: UUID, db: AsyncSession = Depends(get_db)
) -> ObservationAnalytics:
    """Analytics for a single observation: engagement, AI trail, site and region context."""
    result = await AnalyticsService.observation_analytics(db, observation_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found"
        )
    return result
