"""
Integration tests for the AquaSense API.

Uses an in-memory SQLite database (see conftest.py) so tests run without
any external database connection.
"""
import uuid

from fastapi.testclient import TestClient

from conftest import _create_observation, _create_profile


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "service" in body


# ---------------------------------------------------------------------------
# Observations — create
# ---------------------------------------------------------------------------


def test_create_observation_normal(client: TestClient) -> None:
    """Baseline observation with no issues → signal: normal."""
    payload = {
        "site_name": "Clear Creek",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "water_appearance": "clear",
        "odour": "none",
        "waste_visible": False,
        "flow_rate": "normal",
        "user_id": "test-observer-1",
        "assessment_answers": {},
    }
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["site_name"] == "Clear Creek"
    assert data["signal"] == "normal"
    assert data["status"] == "pending"
    assert isinstance(data["key_evidence"], list)
    assert isinstance(data["suggested_steps"], list)
    assert data["confidence"] > 0


def test_create_observation_watch(client: TestClient) -> None:
    """Single issue → signal: watch."""
    payload = {
        "site_name": "River Bend",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "water_appearance": "murky",
        "odour": "none",
        "waste_visible": False,
        "flow_rate": "normal",
        "user_id": "test-observer-1",
        "assessment_answers": {},
    }
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["signal"] == "watch"


def test_create_observation_investigate(client: TestClient) -> None:
    """Multiple issues → signal: investigate."""
    payload = {
        "site_name": "Polluted Pond",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "water_appearance": "murky",
        "odour": "chemical",
        "waste_visible": True,
        "flow_rate": "stagnant",
        "user_id": "test-observer-1",
        "assessment_answers": {"algae": True},
    }
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["signal"] == "investigate"
    assert data["confidence"] >= 0.60
    assert len(data["key_evidence"]) > 1


def test_create_observation_rejects_data_uri_images(client: TestClient) -> None:
    """Data-URL payloads are for AI analysis only; they must not be stored in the DB."""
    payload = {
        "site_name": "Data URI Site",
        "latitude": 12.5,
        "longitude": -13.5,
        "user_id": "user_data_uri_test",
        "image_url": "data:image/png;base64,AAAA",
        "image_urls": ["data:image/png;base64,AAAA"],
        "assessment_answers": {},
    }
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["image_url"] in (None, "")
    assert data["image_urls"] == []


def test_create_observation_validation_error(client: TestClient) -> None:
    """Missing required site_name → 422 Unprocessable Entity."""
    payload = {"latitude": 40.7, "longitude": -74.0}
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 422


def test_create_observation_invalid_coordinates(client: TestClient) -> None:
    """Out-of-range latitude → 422."""
    payload = {
        "site_name": "Bad Coords",
        "latitude": 999,
        "longitude": -74.0,
        "assessment_answers": {},
    }
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Observations — list
# ---------------------------------------------------------------------------


def test_list_observations_empty(client: TestClient) -> None:
    response = client.get("/api/v1/observations")
    assert response.status_code == 200
    assert response.json() == []


def test_list_observations_returns_created(client: TestClient) -> None:
    payload = {
        "site_name": "Test Stream",
        "latitude": 40.0,
        "longitude": -73.0,
        "user_id": "test-observer-1",
        "assessment_answers": {},
    }
    client.post("/api/v1/observations", json=payload)
    response = client.get("/api/v1/observations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["site_name"] == "Test Stream"


def test_list_observations_signal_filter(client: TestClient) -> None:
    """Only observations matching the signal filter should be returned."""
    # Create a 'normal' observation
    client.post("/api/v1/observations", json={
        "site_name": "Normal Site",
        "latitude": 10.0,
        "longitude": 10.0,
        "water_appearance": "clear",
        "user_id": "test-observer-1",
        "assessment_answers": {},
    })
    # Create an 'investigate' observation
    client.post("/api/v1/observations", json={
        "site_name": "Bad Site",
        "latitude": 20.0,
        "longitude": 20.0,
        "water_appearance": "murky",
        "odour": "chemical",
        "waste_visible": True,
        "user_id": "test-observer-1",
        "assessment_answers": {},
    })

    response = client.get("/api/v1/observations?signal=investigate")
    assert response.status_code == 200
    results = response.json()
    assert all(r["signal"] == "investigate" for r in results)


# ---------------------------------------------------------------------------
# Observations — get single
# ---------------------------------------------------------------------------


def test_get_observation_not_found(client: TestClient) -> None:
    response = client.get(f"/api/v1/observations/{uuid.uuid4()}")
    assert response.status_code == 404


def test_get_observation_by_id(client: TestClient) -> None:
    created = _create_observation(client, site_name="Fetch Test", latitude=1.0, longitude=1.0)
    obs_id = created["id"]

    response = client.get(f"/api/v1/observations/{obs_id}")
    assert response.status_code == 200
    assert response.json()["id"] == obs_id


# ---------------------------------------------------------------------------
# Observations — review
# ---------------------------------------------------------------------------


REVIEWER_ID = "test-reviewer-1"
CITIZEN_ID = "test-citizen-1"


def test_review_observation_verified(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    created = _create_observation(client, site_name="Review Site", latitude=5.0, longitude=5.0)
    obs_id = created["id"]

    review_payload = {
        "action": "verified",
        "reviewer_name": "Dr. Test Reviewer",
        "notes": "Confirmed conditions on site visit.",
        "ai_assessment_alignment": "agreed",
    }
    response = client.patch(
        f"/api/v1/observations/{obs_id}/review",
        json=review_payload,
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"
    assert data["reviewed_by"] == "Dr. Test Reviewer"
    assert data["reviewer_notes"] == "Confirmed conditions on site visit."
    assert data["reviewed_at"] is not None
    event = data["ai_trail"]["review_events"][-1]
    assert event["action"] == "verified"
    assert event["reviewer_user_id"] == REVIEWER_ID
    assert event["reviewer_name"] == "Dr. Test Reviewer"
    assert event["ai_assessment_alignment"] == "agreed"


def test_review_observation_flagged(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    created = _create_observation(client, site_name="Flag Site", latitude=6.0, longitude=6.0)
    obs_id = created["id"]

    response = client.patch(
        f"/api/v1/observations/{obs_id}/review",
        json={
            "action": "flagged",
            "reviewer_name": "Field Inspector",
            "notes": "Needs follow-up inspection.",
        },
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "flagged"


def test_review_observation_not_found(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    response = client.patch(
        f"/api/v1/observations/{uuid.uuid4()}/review",
        json={
            "action": "verified",
            "reviewer_name": "Nobody",
        },
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 404


def test_review_observation_invalid_action(client: TestClient) -> None:
    created = _create_observation(client, site_name="Invalid Action", latitude=7.0, longitude=7.0)
    obs_id = created["id"]

    response = client.patch(f"/api/v1/observations/{obs_id}/review", json={
        "action": "approve",  # not a valid literal
        "reviewer_name": "Someone",
    })
    assert response.status_code == 422


def test_review_observation_requires_header(client: TestClient) -> None:
    """Reviewing without X-User-Id → 401 Unauthorized."""
    created = _create_observation(client, site_name="No Header Site", latitude=8.5, longitude=8.5)
    response = client.patch(
        f"/api/v1/observations/{created['id']}/review",
        json={"action": "verified", "reviewer_name": "Nobody"},
    )
    assert response.status_code == 401


def test_review_observation_forbidden_for_citizen(client: TestClient) -> None:
    """A citizen-level profile may not verify or flag records → 403 Forbidden."""
    _create_profile(client, CITIZEN_ID, "citizen")
    created = _create_observation(client, site_name="Citizen Site", latitude=9.0, longitude=9.0)

    response = client.patch(
        f"/api/v1/observations/{created['id']}/review",
        json={"action": "verified", "reviewer_name": "Sneaky Citizen"},
        headers={"X-User-Id": CITIZEN_ID},
    )
    assert response.status_code == 403


def test_review_observation_forbidden_without_profile(client: TestClient) -> None:
    """A user with no profile row cannot review → 403 Forbidden."""
    created = _create_observation(client, site_name="Ghost Site", latitude=9.5, longitude=9.5)

    response = client.patch(
        f"/api/v1/observations/{created['id']}/review",
        json={"action": "verified", "reviewer_name": "Ghost"},
        headers={"X-User-Id": "user-without-profile"},
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Observations — delete
# ---------------------------------------------------------------------------


def test_delete_observation_success(client: TestClient) -> None:
    created = _create_observation(client, site_name="Delete Me", latitude=8.0, longitude=8.0)
    obs_id = created["id"]

    delete_resp = client.delete(
        f"/api/v1/observations/{obs_id}",
        headers={"X-User-Id": "test-observer-1"},
    )
    assert delete_resp.status_code == 204

    # Verify 404 on get
    get_resp = client.get(f"/api/v1/observations/{obs_id}")
    assert get_resp.status_code == 404


def test_delete_observation_not_found(client: TestClient) -> None:
    response = client.delete(f"/api/v1/observations/{uuid.uuid4()}")
    assert response.status_code == 404


def test_delete_observation_forbidden_for_other_user(client: TestClient) -> None:
    """Another signed-in user may not delete someone else's record → 403."""
    _create_profile(client, CITIZEN_ID, "citizen")
    created = _create_observation(client, site_name="Private Site", latitude=11.0, longitude=11.0)

    response = client.delete(
        f"/api/v1/observations/{created['id']}",
        headers={"X-User-Id": CITIZEN_ID},
    )
    assert response.status_code == 403


def test_delete_observation_reviewer_override(client: TestClient) -> None:
    """A reviewer-level profile may delete a record as part of escalation."""
    _create_profile(client, REVIEWER_ID, "reviewer")
    created = _create_observation(client, site_name="Escalated Site", latitude=12.0, longitude=12.0)

    response = client.delete(
        f"/api/v1/observations/{created['id']}",
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 204


def test_delete_observation_requires_header(client: TestClient) -> None:
    """Even the owner must present X-User-Id; anonymous DELETEs are rejected."""
    created = _create_observation(client, site_name="Header Required", latitude=13.0, longitude=13.0)

    response = client.delete(f"/api/v1/observations/{created['id']}")
    assert response.status_code == 401

    # Record still present
    assert client.get(f"/api/v1/observations/{created['id']}").status_code == 200


def test_delete_observation_ownerless_requires_reviewer(client: TestClient) -> None:
    """
    Observations whose owner is gone (FK SET NULL after profile deletion)
    must not be deletable by arbitrary signed-in users — reviewers only.
    """
    import asyncio
    from uuid import UUID as PyUUID

    from sqlalchemy import update

    from app.models import Observation

    _create_profile(client, CITIZEN_ID, "citizen")
    _create_profile(client, REVIEWER_ID, "reviewer")
    created = _create_observation(client, site_name="Orphaned Site", latitude=14.0, longitude=14.0)
    obs_id = PyUUID(created["id"])

    async def _strip_owner() -> None:
        async with client.session_factory() as session:
            await session.execute(
                update(Observation)
                .where(Observation.id == obs_id)
                .values(user_id=None)
            )
            await session.commit()

    asyncio.run(_strip_owner())

    # A citizen may not delete it
    citizen_resp = client.delete(
        f"/api/v1/observations/{created['id']}",
        headers={"X-User-Id": CITIZEN_ID},
    )
    assert citizen_resp.status_code == 403

    # Anonymous DELETE may not delete it
    anon_resp = client.delete(f"/api/v1/observations/{created['id']}")
    assert anon_resp.status_code == 401

    # A reviewer may delete it
    reviewer_resp = client.delete(
        f"/api/v1/observations/{created['id']}",
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert reviewer_resp.status_code == 204


# ---------------------------------------------------------------------------
# Observations — update (owner-only PATCH)
# ---------------------------------------------------------------------------


def test_update_observation_owner_can_edit(client: TestClient) -> None:
    created = _create_observation(client, site_name="Original Name", latitude=15.0, longitude=15.0)

    response = client.patch(
        f"/api/v1/observations/{created['id']}",
        json={"site_name": "Renamed By Owner"},
        headers={"X-User-Id": "test-observer-1"},
    )
    assert response.status_code == 200
    assert response.json()["site_name"] == "Renamed By Owner"


def test_update_observation_forbidden_for_other_user(client: TestClient) -> None:
    """A different signed-in user may not edit someone else's record."""
    _create_profile(client, CITIZEN_ID, "citizen")
    created = _create_observation(client, site_name="Not Yours", latitude=16.0, longitude=16.0)

    response = client.patch(
        f"/api/v1/observations/{created['id']}",
        json={"site_name": "Hijacked"},
        headers={"X-User-Id": CITIZEN_ID},
    )
    assert response.status_code == 403

    # Record unchanged
    assert client.get(f"/api/v1/observations/{created['id']}").json()["site_name"] == "Not Yours"


def test_update_observation_reviewer_cannot_edit_citizens_record(client: TestClient) -> None:
    """Reviewers may flag/verify and delete, but editing notes is owner-only."""
    _create_profile(client, REVIEWER_ID, "reviewer")
    created = _create_observation(client, site_name="Citizen Record", latitude=17.0, longitude=17.0)

    response = client.patch(
        f"/api/v1/observations/{created['id']}",
        json={"site_name": "Reviewer Edit"},
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 403


def test_update_observation_requires_header(client: TestClient) -> None:
    created = _create_observation(client, site_name="Header Needed", latitude=18.0, longitude=18.0)

    response = client.patch(
        f"/api/v1/observations/{created['id']}",
        json={"site_name": "No Header"},
    )
    assert response.status_code == 401


def test_analytics_returns_full_metric_shape(client: TestClient) -> None:
    """The analytics endpoint aggregates all metrics in one round trip."""
    _create_observation(client)

    response = client.get("/api/v1/observations/analytics")
    assert response.status_code == 200
    body = response.json()

    assert body["total_observations"] >= 1
    assert set(body["signals"]) == {"normal", "watch", "investigate"}
    assert sum(body["signals"].values()) == body["total_observations"]
    assert 0 <= body["water_health_index"] <= 100
    assert body["average_confidence"] >= 0
    assert body["active_observers"] >= 1


# ---------------------------------------------------------------------------
# Profile rename propagates to existing observations
# ---------------------------------------------------------------------------


def test_profile_rename_propagates_to_observations(client: TestClient) -> None:
    """PATCH /profiles/me must backfill observer_name on the user's records."""
    _create_profile(client, "rename-user", "citizen")
    obs = _create_observation(
        client, user_id="rename-user", observer_name="Old Name", site_name="Renamed Site",
        latitude=41.0, longitude=-71.0,
    )
    assert obs["observer_name"] == "Old Name"

    resp = client.patch(
        "/api/v1/profiles/me",
        json={"full_name": "New Name"},
        headers={"X-User-Id": "rename-user"},
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "New Name"

    fetched = client.get(f"/api/v1/observations/{obs['id']}")
    assert fetched.json()["observer_name"] == "New Name"


def test_profile_upsert_syncs_observation_attribution(client: TestClient) -> None:
    """Login upsert must refresh attribution columns on existing records."""
    _create_profile(client, "sync-user", "citizen")
    obs = _create_observation(
        client, user_id="sync-user", observer_name="Pre Sync",
        site_name="Synced Site", latitude=42.0, longitude=-72.0,
    )

    client.post("/api/v1/profiles/upsert", json={
        "user_id": "sync-user",
        "email": "sync-user@example.test",
        "full_name": "Post Sync",
        "role": "reviewer",
    })

    fetched = client.get(f"/api/v1/observations/{obs['id']}").json()
    assert fetched["observer_name"] == "Post Sync"
    assert fetched["observer_role"] == "reviewer"


def test_profile_rename_updates_all_records(client: TestClient) -> None:
    """Every record owned by the user is updated, not just the first."""
    _create_profile(client, "batch-rename", "citizen")
    ids = []
    for i in range(3):
        obs = _create_observation(
            client, user_id="batch-rename", observer_name="Before",
            site_name=f"Batch Site {i}", latitude=43.0 + i, longitude=-73.0,
        )
        ids.append(obs["id"])

    client.patch(
        "/api/v1/profiles/me",
        json={"full_name": "After"},
        headers={"X-User-Id": "batch-rename"},
    )

    for obs_id in ids:
        fetched = client.get(f"/api/v1/observations/{obs_id}")
        assert fetched.json()["observer_name"] == "After"
