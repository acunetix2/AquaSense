"""
Shared authorisation rules for the AquaSense API.

Roles that may perform expert review actions (verify / flag records) are
listed in REVIEWER_ROLES. These mirror the frontend ROLE_OPTIONS
`isReviewerLevel` flags so the UI and API always agree on who can review.
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.services.profile_service import ProfileService

REVIEWER_ROLES: set[str] = {
    "reviewer",
    "limnologist",
    "inspector",
    "researcher",
    "officer",
}


def is_reviewer_role(role: str | None) -> bool:
    """True when the given role string grants expert review permission."""
    if not role:
        return False
    return role.strip().lower() in REVIEWER_ROLES


async def require_reviewer(db: AsyncSession, x_user_id: str | None) -> Profile:
    """
    Authorise a review action from the X-User-Id header.

    - 401 when the header is missing.
    - 403 when no profile exists for the user.
    - 403 when the profile's role is not reviewer-level.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required to review an observation.",
        )

    profile = await ProfileService.get_profile_by_user_id(db, x_user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this user. Please sign in again.",
        )

    if not is_reviewer_role(profile.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only certified reviewers can verify or flag observations.",
        )

    return profile
