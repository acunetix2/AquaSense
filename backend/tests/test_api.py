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
