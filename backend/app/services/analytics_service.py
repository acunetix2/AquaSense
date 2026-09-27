"""Watershed analytics service.

Aggregates citizen observations per location, joins trusted monitoring-source
sections (basin-sectionized), computes basin trend snapshots, and produces
per-observation analytics with regional context.

Design: remote DB latency is high, so aggregation uses conditional-aggregation
queries (one SELECT per dimension instead of one per metric).
"""
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import BasinAnalytics
from app.models.monitoring_site import MonitoringSite
from app.models.observation import Observation
from app.models.social import ObservationComment, ObservationLike, ObservationView
from app.schemas.analytics import (
    AIEvaluationMetrics,
    BasinSnapshot,
    LocationStat,
    ObservationAnalytics,
    ObservationEngagement,
    RegionAnalyticsResponse,
    RegionContext,
    TrustedSite,
    TrustedSiteSection,
)
from app.services.social_service import SocialService

# Engagement scoring shared with the frontend feed (likes x3, comments x5, views x0.5)
def engagement_score(counts: dict) -> float:
    return (counts.get("like_count", 0) or 0) * 3 + (counts.get("comment_count", 0) or 0) * 5 + (
        counts.get("view_count", 0) or 0
    ) * 0.5


def _sanitize_ai_trail(trail: dict | None) -> dict:
    """Expose only small, explainable AI-trail fields (Agents.md §5/§7)."""
    meta: dict = {}
    for key, value in (trail or {}).items():
        if isinstance(value, str):
            meta[key] = value[:500]
        elif isinstance(value, (int, float, bool)):
            meta[key] = value
        elif isinstance(value, list) and len(value) <= 20 and all(
            isinstance(item, (str, int, float, bool)) for item in value
        ):
            meta[key] = value
    return meta


class AnalyticsService:
    @staticmethod
    async def ai_evaluation_metrics(db: AsyncSession) -> AIEvaluationMetrics:
        """Summarise reviewer feedback without treating it as model accuracy.

        The metric answers a narrow, auditable question: when a reviewer records
        an alignment decision, did they agree with or override the AI's visual
        interpretation? Records without that explicit decision are excluded.
        """
        observations = (await db.execute(
            select(Observation.ai_trail, Observation.consistency_flags)
        )).all()

        vision_assessed = 0
        questionnaire_only = 0
        observations_with_flags = 0
        agreements = 0
        overrides = 0

        for trail_value, flags in observations:
            trail = trail_value if isinstance(trail_value, dict) else {}
            source = trail.get("source")
            assessment_status = trail.get("assessment_status")
            if source == "groq" and assessment_status != "needs_better_photo":
                vision_assessed += 1
            if assessment_status == "questionnaire_only" or source in {"heuristic", "questionnaire"}:
                questionnaire_only += 1
            if any(isinstance(flag, dict) and flag.get("type") == "consistency" for flag in (flags or [])):
                observations_with_flags += 1

            events = trail.get("review_events")
            if not isinstance(events, list) or not events:
                continue
            latest_event = events[-1]
            if not isinstance(latest_event, dict):
                continue
            alignment = latest_event.get("ai_assessment_alignment")
            if alignment == "agreed":
                agreements += 1
            elif alignment == "overridden":
                overrides += 1

        reviewed_with_alignment = agreements + overrides
        return AIEvaluationMetrics(
            total_observations=len(observations),
            vision_assessed=vision_assessed,
            questionnaire_only=questionnaire_only,
            observations_with_consistency_flags=observations_with_flags,
            reviewed_with_alignment=reviewed_with_alignment,
            reviewer_agreements=agreements,
            reviewer_overrides=overrides,
            agreement_rate=round(agreements / reviewed_with_alignment, 3)
            if reviewed_with_alignment
            else None,
        )

    @staticmethod
    async def region_breakdown(db: AsyncSession) -> RegionAnalyticsResponse:
        """Per-location rollups + trusted-source sections + basin snapshots."""
        # 1) Observations grouped by site (conditional aggregation).
        site_rows = (
            await db.execute(
                select(
                    Observation.site_name.label("site_name"),
                    func.count(Observation.id).label("total"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "normal")
                    .label("normal"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "watch")
                    .label("watch"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "investigate")
                    .label("investigate"),
                    func.count(Observation.id)
                    .filter(Observation.status == "verified")
                    .label("verified"),
                    func.count(Observation.id)
                    .filter(Observation.status == "pending")
                    .label("pending"),
                    func.count(Observation.id)
                    .filter(Observation.status == "flagged")
                    .label("flagged"),
                    func.avg(Observation.confidence).label("avg_conf"),
                    func.avg(Observation.latitude).label("lat"),
                    func.avg(Observation.longitude).label("lng"),
                    func.max(Observation.location_address).label("address"),
                    func.max(Observation.created_at).label("last_observed"),
                )
                .group_by(Observation.site_name)
                .order_by(func.count(Observation.id).desc())
            )
        ).all()

        # 2) Engagement per site (views / likes / comments — one grouped query each).
        views_by_site = dict(
            (
                await db.execute(
                    select(Observation.site_name, func.count(ObservationView.id))
                    .select_from(ObservationView)
                    .join(Observation, Observation.id == ObservationView.observation_id)
                    .group_by(Observation.site_name)
                )
            ).all()
        )
        likes_by_site = dict(
            (
                await db.execute(
                    select(Observation.site_name, func.count(ObservationLike.id))
                    .select_from(ObservationLike)
                    .join(Observation, Observation.id == ObservationLike.observation_id)
                    .group_by(Observation.site_name)
                )
            ).all()
        )
        comments_by_site = dict(
            (
                await db.execute(
                    select(Observation.site_name, func.count(ObservationComment.id))
                    .select_from(ObservationComment)
                    .join(Observation, Observation.id == ObservationComment.observation_id)
                    .group_by(Observation.site_name)
                )
            ).all()
        )

        locations: list[LocationStat] = []
        for row in site_rows:
            locations.append(
                LocationStat(
                    site_name=row.site_name,
                    location_address=row.address,
                    latitude=round(float(row.lat or 0.0), 6),
                    longitude=round(float(row.lng or 0.0), 6),
                    total=int(row.total or 0),
                    normal=int(row.normal or 0),
                    watch=int(row.watch or 0),
                    investigate=int(row.investigate or 0),
                    verified=int(row.verified or 0),
                    pending=int(row.pending or 0),
                    flagged=int(row.flagged or 0),
                    avg_confidence=round(float(row.avg_conf or 0.0), 2),
                    views=int(views_by_site.get(row.site_name, 0)),
                    likes=int(likes_by_site.get(row.site_name, 0)),
                    comments=int(comments_by_site.get(row.site_name, 0)),
                    last_observed=row.last_observed,
                )
            )

        # 3) Trusted monitoring sites, sectionized by basin.
        trusted_rows = (
            await db.execute(
                select(MonitoringSite).order_by(
                    MonitoringSite.basin_name, MonitoringSite.site_name
                )
            )
        ).scalars().all()
        basin_map: dict[str, list[TrustedSite]] = {}
        for site in trusted_rows:
            basin_map.setdefault(site.basin_name, []).append(
                TrustedSite(
                    site_name=site.site_name,
                    basin_name=site.basin_name,
                    latitude=site.latitude,
                    longitude=site.longitude,
                    description=site.description,
                    catchment_area_sq_km=site.catchment_area_sq_km,
                    baseline_quality=site.baseline_quality,
                )
            )
        trusted_sections = [
            TrustedSiteSection(basin_name=basin, sites=sites)
            for basin, sites in basin_map.items()
        ]

        # 4) Basin snapshots (latest 14 days, oldest first for charting).
        snapshot_rows = (
            await db.execute(
                select(BasinAnalytics)
                .order_by(BasinAnalytics.snapshot_date.desc())
                .limit(14)
            )
        ).scalars().all()
        basin_snapshots = [
            BasinSnapshot(
                snapshot_date=row.snapshot_date,
                basin_name=row.basin_name,
                total_samples=row.total_samples,
                normal_count=row.normal_count,
                watch_count=row.watch_count,
                investigate_count=row.investigate_count,
                verified_rate=row.verified_rate,
                health_index_score=row.health_index_score,
            )
            for row in reversed(list(snapshot_rows))
        ]

        return RegionAnalyticsResponse(
            locations=locations,
            trusted_sections=trusted_sections,
            basin_snapshots=basin_snapshots,
        )

    @staticmethod
    async def observation_analytics(
        db: AsyncSession, observation_id: UUID
    ) -> ObservationAnalytics | None:
        """Per-observation analytics: engagement, AI trail, site baseline, region context."""
        obs = (
            await db.execute(select(Observation).where(Observation.id == observation_id))
        ).scalar_one_or_none()
        if obs is None:
            return None

        # Region cohort: all observations at this site (includes this one).
        region_row = (
            await db.execute(
                select(
                    func.count(Observation.id).label("total"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "normal")
                    .label("normal"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "watch")
                    .label("watch"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "investigate")
                    .label("investigate"),
                    func.count(Observation.id)
                    .filter(Observation.status == "verified")
                    .label("verified"),
                    func.avg(Observation.confidence).label("avg_conf"),
                    func.max(Observation.confidence).label("top_conf"),
                ).where(Observation.site_name == obs.site_name)
            )
        ).one()

        # Engagement + rank within the site cohort (one bulk social_counts call).
        cohort_ids = (
            (
                await db.execute(
                    select(Observation.id)
                    .where(Observation.site_name == obs.site_name)
                    .limit(1000)
                )
            )
            .scalars()
            .all()
        )
        counts = await SocialService.social_counts(db, list(cohort_ids))
        own = counts.get(obs.id, {"like_count": 0, "comment_count": 0, "view_count": 0})
        own_score = engagement_score(own)
        rank = 1
        for oid, other in counts.items():
            if oid != obs.id and engagement_score(other) > own_score:
                rank += 1

        # Trusted-source context for this exact site (case-insensitive match).
        site_context = (
            await db.execute(
                select(MonitoringSite)
                .where(func.lower(MonitoringSite.site_name) == obs.site_name.lower())
                .limit(1)
            )
        ).scalar_one_or_none()

        return ObservationAnalytics(
            observation_id=obs.id,
            site_name=obs.site_name,
            signal=obs.signal,
            status=obs.status,
            confidence=round(float(obs.confidence or 0.0), 2),
            consistency_flag_count=len(obs.consistency_flags or []),
            engagement=ObservationEngagement(
                views=int(own.get("view_count") or 0),
                likes=int(own.get("like_count") or 0),
                comments=int(own.get("comment_count") or 0),
            ),
            ai=_sanitize_ai_trail(obs.ai_trail),
            site_context=TrustedSite(
                site_name=site_context.site_name,
                basin_name=site_context.basin_name,
                latitude=site_context.latitude,
                longitude=site_context.longitude,
                description=site_context.description,
                catchment_area_sq_km=site_context.catchment_area_sq_km,
                baseline_quality=site_context.baseline_quality,
            )
            if site_context
            else None,
            region=RegionContext(
                site_name=obs.site_name,
                total_at_site=int(region_row.total or 0),
                avg_confidence=round(float(region_row.avg_conf or 0.0), 2),
                normal=int(region_row.normal or 0),
                watch=int(region_row.watch or 0),
                investigate=int(region_row.investigate or 0),
                verified=int(region_row.verified or 0),
                engagement_rank=rank,
                top_confidence=round(float(region_row.top_conf or 0.0), 2),
            ),
        )
