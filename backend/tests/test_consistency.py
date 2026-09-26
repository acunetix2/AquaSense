"""
Tests for the consistency-check service and the AI decision trail (PRD FR-06/FR-07).
"""
from fastapi.testclient import TestClient

from app.services.consistency_service import check_consistency, image_quality_note


# ---------------------------------------------------------------------------
# Unit tests – consistency rules
# ---------------------------------------------------------------------------


def test_flags_clear_reported_but_cloudy_photo() -> None:
    flags = check_consistency(
        indicators={"turbidity": "very_cloudy", "color_anomaly": "none",
                    "waste_visible": False, "flow_condition": "healthy"},
        water_appearance="clear",
    )
    assert len(flags) == 1
    flag = flags[0]
    assert flag["field"] == "water_clarity"
    assert flag["type"] == "consistency"
    assert flag["severity"] == "warning"
    assert "possible inconsistency" in flag["message"]


def test_flags_turbid_reported_but_clear_photo() -> None:
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "none",
                    "waste_visible": False, "flow_condition": "healthy"},
        water_appearance="turbid",
    )
    assert [f["field"] for f in flags] == ["water_clarity"]


def test_no_flags_when_answers_agree() -> None:
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "none",
                    "waste_visible": False, "flow_condition": "healthy"},
        water_appearance="clear",
        unusual_color="no",
        waste_visible=False,
        flow_rate="normal",
    )
    assert flags == []


def test_flags_unusual_color_denied_but_anomaly_present() -> None:
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "greenish",
                    "waste_visible": False, "flow_condition": "healthy"},
        unusual_color="no",
    )
    assert [f["field"] for f in flags] == ["unusual_color"]


def test_flags_waste_denied_but_detected() -> None:
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "none",
                    "waste_visible": True, "flow_condition": "healthy"},
        waste_visible=False,
    )
    assert [f["field"] for f in flags] == ["waste_visible"]


def test_flags_flow_mismatch() -> None:
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "none",
                    "waste_visible": False, "flow_condition": "stagnant"},
        flow_rate="normal",
    )
    assert [f["field"] for f in flags] == ["flow_rate"]


def test_odour_is_never_flagged_from_photo() -> None:
    """The camera cannot smell – odour answers must never be second-guessed."""
    flags = check_consistency(
        indicators={"turbidity": "clear", "color_anomaly": "none",
                    "waste_visible": False, "flow_condition": "healthy"},
        water_appearance="clear",
    )
    assert all(f["field"] != "odour" for f in flags)


def test_image_quality_note_shape() -> None:
    note = image_quality_note("vision model unavailable")
    assert note["type"] == "image_quality"
    assert note["severity"] == "info"
    assert note["observed"] == "vision model unavailable"


# ---------------------------------------------------------------------------
# API tests – flags and decision trail persist with an observation
# ---------------------------------------------------------------------------


def test_create_without_photo_records_image_quality_flag_and_trail(client: TestClient) -> None:
    response = client.post("/api/v1/observations", json={
        "site_name": "No Photo Site",
        "latitude": 41.0,
        "longitude": -74.0,
        "user_id": "trail-test-user",
        "assessment_answers": {},
    })
    assert response.status_code == 201
    data = response.json()

    flags = data["consistency_flags"]
    assert isinstance(flags, list)
    assert any(f["type"] == "image_quality" for f in flags)

    trail = data["ai_trail"]
    assert trail["source"] == "questionnaire"
    assert trail["image_count"] == 0
    assert trail["output"]["signal"] == data["signal"]
    assert trail["reused_step4_analysis"] is False


def test_create_reuses_step4_analysis_and_keeps_flags(client: TestClient) -> None:
    """The assessment produced on Step 4 is reused instead of re-analysing."""
    ai_result = {
        "signal": "watch",
        "confidence": 0.91,
        "title": "Minor turbidity near outflow",
        "summary": "Photo shows slightly cloudy water near the outflow.",
        "water_quality_score": 64,
        "key_evidence": ["Cloudy water at outflow"],
        "suggested_steps": ["Re-photograph in 48 hours"],
        "urgency": "monitor",
        "consistency_flags": [{
            "field": "water_clarity",
            "type": "consistency",
            "reported": "clear",
            "observed": "cloudy",
            "message": "We noticed a possible inconsistency — you reported clear water, but the photo appears cloudy.",
            "severity": "warning",
        }],
        "analysis_meta": {
            "source": "groq",
            "model": "qwen/qwen3.8-27b",
            "prompt_version": "aquasense-vision-2026-09-v1",
            "image_count": 2,
            "analysed_at": "2026-09-25T10:00:00+00:00",
        },
    }
    response = client.post("/api/v1/observations", json={
        "site_name": "Reuse Site",
        "latitude": 42.0,
        "longitude": -75.0,
        "user_id": "trail-test-user",
        "water_appearance": "clear",
        "flow_rate": "normal",
        "assessment_answers": {"waterClarity": "clear", "ai_result": ai_result},
    })
    assert response.status_code == 201
    data = response.json()

    assert data["signal"] == "watch"
    assert data["confidence"] == 0.91
    assert [f["field"] for f in data["consistency_flags"]] == ["water_clarity"]

    trail = data["ai_trail"]
    assert trail["reused_step4_analysis"] is True
    assert trail["source"] == "groq"
    assert trail["model"] == "qwen/qwen3.8-27b"
    assert trail["image_count"] == 2
    assert trail["consistency_rule_hits"] == ["water_clarity"]
    assert "analysed_at" in trail


def test_consistency_flags_survive_fetch(client: TestClient) -> None:
    created = client.post("/api/v1/observations", json={
        "site_name": "Persisted Flags",
        "latitude": 43.0,
        "longitude": -76.0,
        "user_id": "trail-test-user",
        "assessment_answers": {},
    }).json()

    fetched = client.get(f"/api/v1/observations/{created['id']}")
    assert fetched.status_code == 200
    data = fetched.json()
    assert len(data["consistency_flags"]) >= 1
    assert data["ai_trail"]["source"] == "questionnaire"
