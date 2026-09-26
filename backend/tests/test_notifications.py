"""Notification engine: event generation, scoping, and read-state endpoints."""
import asyncio
import uuid

from fastapi.testclient import TestClient

from tests.conftest import _create_observation, _create_profile

API = "/api/v1"
OWNER = "test-observer-1"
REVIEWER_ID = "test-reviewer-1"
OTHER = "test-citizen-1"


def _get_notifications(client: TestClient, user_id: str) -> dict:
    response = client.get(f"{API}/notifications", headers={"X-User-Id": user_id})
    assert response.status_code == 200, response.text
    return response.json()


def _types(body: dict) -> list[str]:
    return [n["type"] for n in body["items"]]


# ---------------------------------------------------------------------------
# Event generation
# ---------------------------------------------------------------------------


def test_review_verified_notifies_owner(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="Notify Site", latitude=1.0, longitude=1.0)

    response = client.patch(
        f"{API}/observations/{obs['id']}/review",
        json={"action": "verified", "reviewer_name": "Dr. Reviewer", "notes": "Looks good."},
        headers={"X-User-Id": REVIEWER_ID},
    )
    assert response.status_code == 200

    body = _get_notifications(client, OWNER)
    assert body["unread_count"] == 1
    item = body["items"][0]
    assert item["type"] == "review"
    assert item["title"] == "Observation verified"
    assert item["observation_id"] == obs["id"]
    assert item["actor_name"] == "Dr. Reviewer"
    assert item["read"] is False


def test_review_flagged_notifies_owner(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="Flag Site", latitude=2.0, longitude=2.0)

    client.patch(
        f"{API}/observations/{obs['id']}/review",
        json={"action": "flagged", "reviewer_name": "Inspector", "notes": "Needs follow-up."},
        headers={"X-User-Id": REVIEWER_ID},
    )

    body = _get_notifications(client, OWNER)
    assert _types(body) == ["review"]
    assert body["items"][0]["title"] == "Observation flagged"


def test_review_ownerless_observation_creates_no_notification(client: TestClient) -> None:
    from sqlalchemy import update

    from app.models import Observation

    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="Orphan Site", latitude=3.0, longitude=3.0)

    async def _strip_owner() -> None:
        async with client.session_factory() as session:
            await session.execute(
                update(Observation).where(Observation.id == uuid.UUID(obs["id"])).values(user_id=None)
            )
            await session.commit()

    asyncio.run(_strip_owner())

    client.patch(
        f"{API}/observations/{obs['id']}/review",
        json={"action": "verified", "reviewer_name": "Inspector"},
        headers={"X-User-Id": REVIEWER_ID},
    )

    body = _get_notifications(client, REVIEWER_ID)
    assert body["items"] == []
    assert body["unread_count"] == 0


def test_comment_notifies_owner_but_not_self(client: TestClient) -> None:
    obs = _create_observation(client, site_name="Comment Site", latitude=4.0, longitude=4.0)

    # Someone else's comment notifies the owner
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Turbid near the outfall."},
        headers={"X-User-Id": OTHER},
    )
    body = _get_notifications(client, OWNER)
    assert _types(body) == ["comment"]
    assert body["items"][0]["title"] == f"New comment on {obs['site_name']}"
    assert body["items"][0]["actor_name"] == "Citizen Scientist"

    # The owner's own comment must not notify them
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Noted, thanks."},
        headers={"X-User-Id": OWNER},
    )
    body = _get_notifications(client, OWNER)
    assert len(body["items"]) == 1


def test_like_notifies_owner_once(client: TestClient) -> None:
    _create_profile(client, OTHER, "citizen")
    obs = _create_observation(client, site_name="Like Site", latitude=7.0, longitude=7.0)

    first = client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": OTHER})
    assert first.status_code == 200
    # Idempotent repeat must not duplicate the notification
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": OTHER})

    body = _get_notifications(client, OWNER)
    assert _types(body) == ["like"]
    assert body["items"][0]["title"] == f"New like on {obs['site_name']}"


def test_follow_notifies_target(client: TestClient) -> None:
    _create_profile(client, "follow-target", "citizen")
    _create_profile(client, "follow-follower", "citizen")

    client.post(
        f"{API}/profiles/follow-target/follow",
        headers={"X-User-Id": "follow-follower"},
    )
    # Idempotent repeat must not duplicate
    client.post(
        f"{API}/profiles/follow-target/follow",
        headers={"X-User-Id": "follow-follower"},
    )

    body = _get_notifications(client, "follow-target")
    assert _types(body) == ["follow"]
    assert body["items"][0]["actor_name"] == "Follow Follower"
    assert "started following you" in body["items"][0]["body"]

    # The follower gets nothing
    assert _get_notifications(client, "follow-follower")["items"] == []


# ---------------------------------------------------------------------------
# Endpoints: auth, scoping, read state
# ---------------------------------------------------------------------------


def test_notifications_require_header(client: TestClient) -> None:
    assert client.get(f"{API}/notifications").status_code == 401
    assert client.post(f"{API}/notifications/read-all").status_code == 401


def test_notifications_scoped_to_recipient(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs_a = _create_observation(client, site_name="Scope A", latitude=8.0, longitude=8.0)
    obs_b = _create_observation(
        client, site_name="Scope B", latitude=9.0, longitude=9.0, user_id=OTHER
    )

    for obs in (obs_a, obs_b):
        client.patch(
            f"{API}/observations/{obs['id']}/review",
            json={"action": "verified", "reviewer_name": "Inspector"},
            headers={"X-User-Id": REVIEWER_ID},
        )

    owner_body = _get_notifications(client, OWNER)
    assert len(owner_body["items"]) == 1
    assert owner_body["items"][0]["observation_id"] == obs_a["id"]

    other_body = _get_notifications(client, OTHER)
    assert len(other_body["items"]) == 1
    assert other_body["items"][0]["observation_id"] == obs_b["id"]

    # The reviewer's own list is empty (they are the actor, not the recipient)
    reviewer_body = _get_notifications(client, REVIEWER_ID)
    assert reviewer_body["items"] == []


def test_mark_notification_read(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="Read Site", latitude=10.0, longitude=10.0)
    client.patch(
        f"{API}/observations/{obs['id']}/review",
        json={"action": "verified", "reviewer_name": "Inspector"},
        headers={"X-User-Id": REVIEWER_ID},
    )

    notif_id = _get_notifications(client, OWNER)["items"][0]["id"]
    response = client.post(
        f"{API}/notifications/{notif_id}/read", headers={"X-User-Id": OWNER}
    )
    assert response.status_code == 200
    assert response.json()["read"] is True
    assert _get_notifications(client, OWNER)["unread_count"] == 0


def test_mark_read_other_users_notification_404(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="Private Site", latitude=11.0, longitude=11.0)
    client.patch(
        f"{API}/observations/{obs['id']}/review",
        json={"action": "flagged", "reviewer_name": "Inspector"},
        headers={"X-User-Id": REVIEWER_ID},
    )

    notif_id = _get_notifications(client, OWNER)["items"][0]["id"]
    response = client.post(
        f"{API}/notifications/{notif_id}/read", headers={"X-User-Id": OTHER}
    )
    assert response.status_code == 404


def test_mark_all_read(client: TestClient) -> None:
    _create_profile(client, REVIEWER_ID, "reviewer")
    obs = _create_observation(client, site_name="All Read Site", latitude=12.0, longitude=12.0)
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "First"},
        headers={"X-User-Id": OTHER},
    )
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": OTHER})
    assert _get_notifications(client, OWNER)["unread_count"] == 2

    response = client.post(f"{API}/notifications/read-all", headers={"X-User-Id": OWNER})
    assert response.status_code == 200
    assert response.json()["unread_count"] == 0

    body = _get_notifications(client, OWNER)
    assert body["unread_count"] == 0
    assert all(n["read"] for n in body["items"])
    assert len(body["items"]) == 2
