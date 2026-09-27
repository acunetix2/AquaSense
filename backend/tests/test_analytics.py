"""Watershed analytics endpoints: per-location rollups, trusted-source sections,
basin snapshots, and per-observation analytics."""
import asyncio
import uuid

from fastapi.testclient import TestClient

from tests.conftest import _create_observation

API = "/api/v1"


def _seed_trusted_rows(client: TestClient) -> None:
    """Insert one monitoring site + one basin snapshot directly (no public API for these)."""
    from datetime import date

    from app.models.analytics import BasinAnalytics
    from app.models.monitoring_site import MonitoringSite

    async def _seed() -> None:
        async with client.session_factory() as session:
            session.add(
                MonitoringSite(
                    site_name="Gamma Creek",
                    basin_name="Kijabe Basin",
                    latitude=40.0,
                    longitude=-73.0,
                    description="Upstream reference station",
                    catchment_area_sq_km=12.5,
                    baseline_quality="normal",
                )
            )
            session.add(
                BasinAnalytics(
                    snapshot_date=date(2026, 9, 20),
                    basin_name="Kijabe Basin",
                    total_samples=40,
                    normal_count=30,
                    watch_count=8,
                    investigate_count=2,
                    verified_rate=0.75,
                    health_index_score=82.0,
                )
            )
            await session.commit()

    asyncio.run(_seed())


# ---------------------------------------------------------------------------
# Responsible-AI evaluation
# ---------------------------------------------------------------------------


def test_ai_evaluation_reports_reviewer_alignment(client: TestClient) -> None:
    from tests.test_api import REVIEWER_ID, _create_profile

    _create_profile(client, REVIEWER_ID, "reviewer")
    agreed = _create_observation(
        client,
        site_name="AI Agree",
        latitude=40.0,
        longitude=-73.0,
        assessment_answers={
            "ai_result": {
                "signal": "watch",
                "confidence": 0.82,
                "summary": "Cloudy water is visible near the bank.",
                "key_evidence": ["Cloudy water is visible."],
                "suggested_steps": ["Record a follow-up photo."],
                "urgency": "monitor",
                "analysis_meta": {
                    "source": "groq",
                    "model": "qwen/qwen3.8-27b",
                    "prompt_version": "aquasense-vision-2026-09-v1",
                    "image_count": 1,
                    "assessment_status": "assessed",
                    "analysed_at": "2026-09-25T10:00:00+00:00",
                },
            },
        },
    )
    overridden = _create_observation(client, site_name="AI Override", latitude=41.0, longitude=-74.0)

    for observation, alignment in ((agreed, "agreed"), (overridden, "overridden")):
        response = client.patch(
            f"{API}/observations/{observation['id']}/review",
            json={
                "action": "verified",
                "reviewer_name": "Evaluation Reviewer",
                "notes": "Reviewed against submitted evidence.",
                "ai_assessment_alignment": alignment,
            },
            headers={"X-User-Id": REVIEWER_ID},
        )
        assert response.status_code == 200

    body = client.get(f"{API}/analytics/ai-evaluation").json()
    assert body["total_observations"] == 2
    assert body["vision_assessed"] == 1
    assert body["reviewed_with_alignment"] == 2
    assert body["reviewer_agreements"] == 1
    assert body["reviewer_overrides"] == 1
    assert body["agreement_rate"] == 0.5


# ---------------------------------------------------------------------------
# Region breakdown (per-location rollups + sections)
# ---------------------------------------------------------------------------


def test_region_breakdown_groups_by_site(client: TestClient) -> None:
    """Observations roll up per site with signal counts and confidence."""
    _create_observation(client, site_name="Alpha River", latitude=40.0, longitude=-73.0)
    _create_observation(
        client,
        site_name="Alpha River",
        latitude=40.1,
        longitude=-73.1,
        water_appearance="murky",
        odour="none",
        flow_rate="normal",
    )
    _create_observation(
        client,
        site_name="Beta Lake",
        latitude=41.0,
        longitude=-74.0,
        water_appearance="murky",
        odour="chemical",
        waste_visible=True,
        flow_rate="stagnant",
    )

    response = client.get(f"{API}/analytics/regions")
    assert response.status_code == 200
    body = response.json()

    by_site = {loc["site_name"]: loc for loc in body["locations"]}
    alpha = by_site["Alpha River"]
    assert alpha["total"] == 2
    assert alpha["normal"] == 1
    assert alpha["watch"] == 1
    assert alpha["investigate"] == 0
    assert alpha["avg_confidence"] > 0
    assert alpha["last_observed"] is not None

    beta = by_site["Beta Lake"]
    assert beta["total"] == 1
    assert beta["investigate"] == 1
    assert beta["pending"] == 1  # unreviewed

    assert isinstance(body["trusted_sections"], list)
    assert isinstance(body["basin_snapshots"], list)


def test_region_breakdown_includes_engagement(client: TestClient) -> None:
    """Per-location rollups aggregate likes, comments, and views."""
    obs = _create_observation(client, site_name="Engaged Site", latitude=42.0, longitude=-74.0)

    client.post(
        f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "like-user-1"}
    )
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Noted"},
        headers={"X-User-Id": "commenter-1"},
    )
    client.post(f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-1"})
    client.post(f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-2"})

    body = client.get(f"{API}/analytics/regions").json()
    loc = next(l for l in body["locations"] if l["site_name"] == "Engaged Site")
    assert loc["likes"] == 1
    assert loc["comments"] == 1
    assert loc["views"] == 2


def test_region_breakdown_trusted_sections_and_snapshots(client: TestClient) -> None:
    """Trusted monitoring sources come back sectionized by basin; snapshots in date order."""
    _seed_trusted_rows(client)

    body = client.get(f"{API}/analytics/regions").json()

    sections = {s["basin_name"]: s["sites"] for s in body["trusted_sections"]}
    assert "Kijabe Basin" in sections
    site = sections["Kijabe Basin"][0]
    assert site["site_name"] == "Gamma Creek"
    assert site["baseline_quality"] == "normal"
    assert site["catchment_area_sq_km"] == 12.5

    assert len(body["basin_snapshots"]) == 1
    snap = body["basin_snapshots"][0]
    assert snap["basin_name"] == "Kijabe Basin"
    assert snap["health_index_score"] == 82.0
    assert snap["verified_rate"] == 0.75
    assert snap["snapshot_date"] == "2026-09-20"


def test_region_breakdown_empty_database(client: TestClient) -> None:
    """Empty DB still returns a valid, well-shaped payload."""
    body = client.get(f"{API}/analytics/regions").json()
    assert body["locations"] == []
    assert body["trusted_sections"] == []
    assert body["basin_snapshots"] == []


# ---------------------------------------------------------------------------
# Per-observation analytics
# ---------------------------------------------------------------------------


def test_observation_analytics_full_shape(client: TestClient) -> None:
    """Single-observation endpoint returns engagement, AI meta, and region context."""
    obs = _create_observation(client, site_name="Gamma Creek", latitude=40.0, longitude=-73.0)
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "like-user-2"})
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Following this site"},
        headers={"X-User-Id": "commenter-2"},
    )
    client.post(f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-3"})

    response = client.get(f"{API}/analytics/observations/{obs['id']}")
    assert response.status_code == 200
    body = response.json()

    assert body["observation_id"] == obs["id"]
    assert body["site_name"] == "Gamma Creek"
    assert body["signal"] == "normal"
    assert body["status"] == "pending"
    assert body["confidence"] > 0
    assert body["engagement"] == {"views": 1, "likes": 1, "comments": 1}
    assert isinstance(body["consistency_flag_count"], int)
    assert isinstance(body["ai"], dict)
    assert body["region"]["site_name"] == "Gamma Creek"
    assert body["region"]["total_at_site"] >= 1
    assert body["region"]["avg_confidence"] > 0
    # No trusted site seeded for this client yet
    assert body["site_context"] is None


def test_observation_analytics_site_context_and_rank(client: TestClient) -> None:
    """Trusted-source site context is matched by name; rank orders the site cohort."""
    _seed_trusted_rows(client)

    lead = _create_observation(client, site_name="Gamma Creek", latitude=40.0, longitude=-73.0)
    quiet = _create_observation(
        client, site_name="Gamma Creek", latitude=40.05, longitude=-73.05
    )

    # Drive engagement on the lead observation only
    for viewer in ("v-1", "v-2", "v-3"):
        client.post(f"{API}/observations/{lead['id']}/view", headers={"X-User-Id": viewer})
    client.post(f"{API}/observations/{lead['id']}/like", headers={"X-User-Id": "l-1"})
    client.post(f"{API}/observations/{lead['id']}/like", headers={"X-User-Id": "l-2"})

    lead_body = client.get(f"{API}/analytics/observations/{lead['id']}").json()
    quiet_body = client.get(f"{API}/analytics/observations/{quiet['id']}").json()

    assert lead_body["site_context"]["basin_name"] == "Kijabe Basin"
    assert lead_body["site_context"]["site_name"] == "Gamma Creek"
    assert lead_body["region"]["total_at_site"] == 2
    assert lead_body["region"]["engagement_rank"] == 1
    assert quiet_body["region"]["engagement_rank"] == 2
    assert quiet_body["engagement"]["views"] == 0
    assert lead_body["engagement"]["views"] == 3


def test_observation_analytics_unknown_id_404(client: TestClient) -> None:
    missing = str(uuid.uuid4())
    response = client.get(f"{API}/analytics/observations/{missing}")
    assert response.status_code == 404
