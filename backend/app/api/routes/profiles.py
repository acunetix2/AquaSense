from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import is_reviewer_role
from app.db.session import get_db
from app.schemas.profile import ProfileRead, ProfileReadWithEmail, ProfileUpdate, ProfileUpsert
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _require_user(x_user_id: str | None = Header(None)) -> str:
    """Extract and validate the X-User-Id request header."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required.",
        )
    return x_user_id


@router.post("/upsert", response_model=ProfileReadWithEmail, status_code=status.HTTP_200_OK)
async def upsert_profile(
    payload: ProfileUpsert,
    db: AsyncSession = Depends(get_db),
) -> ProfileReadWithEmail:
    """
    Create or update a profile row.
    Called automatically on every successful login (both Google OAuth and email/password).
    """
    return await ProfileService.upsert_profile(db, payload)


@router.get("/me", response_model=ProfileReadWithEmail)
async def get_my_profile(
    user_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileReadWithEmail:
    """Fetch the authenticated user's own profile (includes email)."""
    profile = await ProfileService.get_profile_by_user_id(db, user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please sign in again to create one.",
        )
    return ProfileReadWithEmail.model_validate(profile)


@router.patch("/me", response_model=ProfileReadWithEmail)
async def update_my_profile(
    updates: ProfileUpdate,
    user_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileReadWithEmail:
    """Update the authenticated user's own profile fields."""
    updated = await ProfileService.update_profile(db, user_id, updates)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please sign in again to create one.",
        )
    return updated


@router.patch("/{user_id}", response_model=ProfileReadWithEmail)
async def update_profile_by_user_id(
    user_id: str,
    updates: ProfileUpdate,
    x_user_id: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ProfileReadWithEmail:
    """Update a profile by user_id, but only for the owner or reviewer."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required.",
        )

    if x_user_id != user_id:
        requester = await ProfileService.get_profile_by_user_id(db, x_user_id)
        if requester is None or not is_reviewer_role(requester.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this profile.",
            )

    updated = await ProfileService.update_profile(db, user_id, updates)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )
    return updated


@router.get("/{user_id}", response_model=ProfileRead)
async def get_public_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProfileRead:
    """
    Fetch any user's public profile.
    Email is NOT included in this response.
    """
    profile = await ProfileService.get_profile_by_user_id(db, user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )
    return ProfileRead.model_validate(profile)


@router.post("/{user_id}/follow", response_model=ProfileRead)
async def follow_user(
    user_id: str,
    follower_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileRead:
    """Follow a user profile (increments follower count)."""
    if user_id == follower_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself.",
        )
    profile = await ProfileService.follow_profile(db, user_id, follower_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.delete("/{user_id}/follow", response_model=ProfileRead)
async def unfollow_user(
    user_id: str,
    follower_id: str = Depends(_require_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileRead:
    """Unfollow a user profile (decrements follower count)."""
    profile = await ProfileService.unfollow_profile(db, user_id, follower_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.post("/{user_id}/like", response_model=ProfileRead)
async def like_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProfileRead:
    """Like a user profile (increments likes_received)."""
    profile = await ProfileService.like_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile

