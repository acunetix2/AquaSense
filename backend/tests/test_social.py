"""
Tests for social features: observation comments, observation likes,
and edge-based profile follow/like (PRD FR-12 / FR-13).
"""
from fastapi.testclient import TestClient

from conftest import _create_observation, _create_profile

API = "/api/v1"


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------


def test_list_comments_missing_observation_404(client: TestClient) -> None:
    response = client.get(f"{API}/observations/00000000-0000-0000-0000-000000000000/comments")
    assert response.status_code == 404


def test_create_comment_requires_user_header(client: TestClient) -> None:
    obs = _create_observation(client)
    response = client.post(
        f"{API}/observations/{obs['id']}/comments", json={"body": "Nice work"}
    )
    assert response.status_code == 422


def test_create_comment_uses_profile_author_details(client: TestClient) -> None:
    _create_profile(client, "commenter-1", "citizen")
    obs = _create_observation(client)

    response = client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "  Looks turbid near the outfall.  "},
        headers={"X-User-Id": "commenter-1"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["body"] == "Looks turbid near the outfall."  # trimmed
    assert data["user_id"] == "commenter-1"
    assert data["author_name"] == "Commenter 1"
    assert data["author_role"] == "citizen"


def test_create_comment_unknown_profile_falls_back_to_default_name(client: TestClient) -> None:
    obs = _create_observation(client)
    response = client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Anonymous note"},
        headers={"X-User-Id": "no-profile-user"},
    )
    assert response.status_code == 201
    assert response.json()["author_name"] == "Citizen Scientist"


def test_comment_count_reflects_on_observation(client: TestClient) -> None:
    _create_profile(client, "commenter-2", "citizen")
    obs = _create_observation(client)

    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "First"},
        headers={"X-User-Id": "commenter-2"},
    )
    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Second"},
        headers={"X-User-Id": "commenter-2"},
    )

    fetched = client.get(f"{API}/observations/{obs['id']}")
    assert fetched.json()["comment_count"] == 2

    listed = client.get(f"{API}/observations/{obs['id']}/comments")
    assert listed.status_code == 200
    assert [c["body"] for c in listed.json()] == ["First", "Second"]  # oldest first


def test_delete_comment_by_author(client: TestClient) -> None:
    _create_profile(client, "commenter-3", "citizen")
    obs = _create_observation(client)
    created = client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Removable"},
        headers={"X-User-Id": "commenter-3"},
    ).json()

    response = client.delete(
        f"{API}/observations/{obs['id']}/comments/{created['id']}",
        headers={"X-User-Id": "commenter-3"},
    )
    assert response.status_code == 204

    listed = client.get(f"{API}/observations/{obs['id']}/comments")
    assert listed.json() == []
    assert client.get(f"{API}/observations/{obs['id']}").json()["comment_count"] == 0


def test_delete_comment_by_non_author_403(client: TestClient) -> None:
    _create_profile(client, "commenter-4", "citizen")
    _create_profile(client, "other-user", "citizen")
    obs = _create_observation(client)
    created = client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Not yours"},
        headers={"X-User-Id": "commenter-4"},
    ).json()

    response = client.delete(
        f"{API}/observations/{obs['id']}/comments/{created['id']}",
        headers={"X-User-Id": "other-user"},
    )
    assert response.status_code == 403


def test_delete_missing_comment_404(client: TestClient) -> None:
    obs = _create_observation(client)
    response = client.delete(
        f"{API}/observations/{obs['id']}/comments/00000000-0000-0000-0000-000000000000",
        headers={"X-User-Id": "anyone"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Observation likes
# ---------------------------------------------------------------------------


def test_like_is_idempotent(client: TestClient) -> None:
    obs = _create_observation(client)

    first = client.post(
        f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-1"}
    )
    assert first.status_code == 200
    assert first.json() == {"liked": True, "like_count": 1}

    second = client.post(
        f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-1"}
    )
    assert second.json() == {"liked": True, "like_count": 1}  # no double count


def test_unlike_is_idempotent(client: TestClient) -> None:
    obs = _create_observation(client)
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-2"})

    first = client.delete(
        f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-2"}
    )
    assert first.json() == {"liked": False, "like_count": 0}

    second = client.delete(
        f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-2"}
    )
    assert second.json() == {"liked": False, "like_count": 0}


def test_likes_accumulate_across_users(client: TestClient) -> None:
    obs = _create_observation(client)
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-a"})
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "liker-b"})

    fetched = client.get(f"{API}/observations/{obs['id']}")
    assert fetched.json()["like_count"] == 2


def test_liked_by_me_reflects_viewer(client: TestClient) -> None:
    obs = _create_observation(client)
    client.post(f"{API}/observations/{obs['id']}/like", headers={"X-User-Id": "viewer-1"})

    as_viewer = client.get(
        f"{API}/observations/{obs['id']}", headers={"X-User-Id": "viewer-1"}
    )
    assert as_viewer.json()["liked_by_me"] is True

    as_other = client.get(
        f"{API}/observations/{obs['id']}", headers={"X-User-Id": "viewer-2"}
    )
    assert as_other.json()["liked_by_me"] is False

    no_header = client.get(f"{API}/observations/{obs['id']}")
    assert no_header.json()["liked_by_me"] is False

    listed = client.get(f"{API}/observations", headers={"X-User-Id": "viewer-1"})
    target = [o for o in listed.json() if o["id"] == obs["id"]][0]
    assert target["liked_by_me"] is True
    assert target["like_count"] == 1


def test_like_missing_observation_404(client: TestClient) -> None:
    response = client.post(
        f"{API}/observations/00000000-0000-0000-0000-000000000000/like",
        headers={"X-User-Id": "liker-x"},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Profile follow / like (edge-based)
# ---------------------------------------------------------------------------


def test_follow_is_idempotent_and_updates_both_counters(client: TestClient) -> None:
    _create_profile(client, "target-1", "citizen")
    _create_profile(client, "follower-1", "citizen")

    first = client.post(
        f"{API}/profiles/target-1/follow", headers={"X-User-Id": "follower-1"}
    )
    assert first.status_code == 200
    assert first.json()["followers_count"] == 1
    assert first.json()["is_following"] is True

    second = client.post(
        f"{API}/profiles/target-1/follow", headers={"X-User-Id": "follower-1"}
    )
    assert second.json()["followers_count"] == 1  # edge is unique — no double count

    follower = client.get(f"{API}/profiles/follower-1")
    assert follower.json()["following_count"] == 1


def test_unfollow_is_idempotent(client: TestClient) -> None:
    _create_profile(client, "target-2", "citizen")
    _create_profile(client, "follower-2", "citizen")
    client.post(f"{API}/profiles/target-2/follow", headers={"X-User-Id": "follower-2"})

    first = client.delete(
        f"{API}/profiles/target-2/follow", headers={"X-User-Id": "follower-2"}
    )
    assert first.json()["followers_count"] == 0
    assert first.json()["is_following"] is False

    second = client.delete(
        f"{API}/profiles/target-2/follow", headers={"X-User-Id": "follower-2"}
    )
    assert second.json()["followers_count"] == 0

    follower = client.get(f"{API}/profiles/follower-2")
    assert follower.json()["following_count"] == 0


def test_self_follow_400(client: TestClient) -> None:
    _create_profile(client, "self-user", "citizen")
    response = client.post(
        f"{API}/profiles/self-user/follow", headers={"X-User-Id": "self-user"}
    )
    assert response.status_code == 400


def test_public_profile_exposes_viewer_follow_state(client: TestClient) -> None:
    _create_profile(client, "target-3", "citizen")
    _create_profile(client, "follower-3", "citizen")

    before = client.get(
        f"{API}/profiles/target-3", headers={"X-User-Id": "follower-3"}
    )
    assert before.json()["is_following"] is False

    client.post(f"{API}/profiles/target-3/follow", headers={"X-User-Id": "follower-3"})

    after = client.get(f"{API}/profiles/target-3", headers={"X-User-Id": "follower-3"})
    assert after.json()["is_following"] is True

    anonymous = client.get(f"{API}/profiles/target-3")
    assert anonymous.json()["is_following"] is False


def test_profile_like_requires_header_and_is_idempotent(client: TestClient) -> None:
    _create_profile(client, "target-4", "citizen")
    _create_profile(client, "liker-4", "citizen")

    missing = client.post(f"{API}/profiles/target-4/like")
    assert missing.status_code == 401

    first = client.post(
        f"{API}/profiles/target-4/like", headers={"X-User-Id": "liker-4"}
    )
    assert first.status_code == 200
    assert first.json()["likes_received"] == 1
    assert first.json()["liked_by_me"] is True

    second = client.post(
        f"{API}/profiles/target-4/like", headers={"X-User-Id": "liker-4"}
    )
    assert second.json()["likes_received"] == 1

    removed = client.delete(
        f"{API}/profiles/target-4/like", headers={"X-User-Id": "liker-4"}
    )
    assert removed.json()["likes_received"] == 0
    assert removed.json()["liked_by_me"] is False


def test_self_like_400(client: TestClient) -> None:
    _create_profile(client, "self-liker", "citizen")
    response = client.post(
        f"{API}/profiles/self-liker/like", headers={"X-User-Id": "self-liker"}
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Views (deduplicated per viewer)
# ---------------------------------------------------------------------------


def test_record_view_requires_viewer_header(client: TestClient) -> None:
    obs = _create_observation(client)
    response = client.post(f"{API}/observations/{obs['id']}/view")
    assert response.status_code == 422


def test_record_view_unknown_observation_404(client: TestClient) -> None:
    response = client.post(
        f"{API}/observations/00000000-0000-0000-0000-000000000000/view",
        headers={"X-User-Id": "viewer-0"},
    )
    assert response.status_code == 404


def test_record_view_is_deduplicated_per_viewer(client: TestClient) -> None:
    obs = _create_observation(client)

    first = client.post(
        f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-1"}
    )
    assert first.status_code == 200
    assert first.json()["view_count"] == 1

    # Repeat view by the same viewer must not inflate the count
    repeat = client.post(
        f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-1"}
    )
    assert repeat.json()["view_count"] == 1

    # A second viewer increments it
    second = client.post(
        f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-2"}
    )
    assert second.json()["view_count"] == 2

    # views_count is exposed on detail and list responses
    detail = client.get(f"{API}/observations/{obs['id']}")
    assert detail.json()["views_count"] == 2
    listed = client.get(f"{API}/observations")
    assert listed.json()[0]["views_count"] == 2


def test_record_view_does_not_count_other_people_views_as_yours(client: TestClient) -> None:
    _create_profile(client, "test-observer-1", "citizen")
    obs = _create_observation(client)

    client.post(f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-a"})
    client.post(f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-b"})

    profile = client.get(f"{API}/profiles/test-observer-1")
    assert profile.status_code == 200
    assert profile.json()["views_received"] == 2
    assert profile.json()["comments_received"] == 0


# ---------------------------------------------------------------------------
# Profile engagement aggregates (comments / views received)
# ---------------------------------------------------------------------------


def test_profile_engagement_aggregates(client: TestClient) -> None:
    _create_profile(client, "test-observer-1", "citizen")
    obs = _create_observation(client, site_name="Engagement Site", latitude=33.0, longitude=33.0)

    client.post(
        f"{API}/observations/{obs['id']}/comments",
        json={"body": "Great clarity on the sample."},
        headers={"X-User-Id": "commenter-eng"},
    )
    client.post(
        f"{API}/observations/{obs['id']}/view", headers={"X-User-Id": "viewer-eng"}
    )

    public = client.get(f"{API}/profiles/test-observer-1")
    assert public.status_code == 200
    assert public.json()["comments_received"] == 1
    assert public.json()["views_received"] == 1

    mine = client.get(f"{API}/profiles/me", headers={"X-User-Id": "test-observer-1"})
    assert mine.status_code == 200
    assert mine.json()["comments_received"] == 1
    assert mine.json()["views_received"] == 1
