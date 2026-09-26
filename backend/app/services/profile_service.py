from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.schemas.profile import ProfileRead, ProfileReadWithEmail, ProfileUpsert, ProfileUpdate


class ProfileService:
    @staticmethod
    def _sanitize_profile_string(value: str | None, *, max_length: int | None = None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        if not cleaned:
            return None

        if cleaned.startswith("data:image/"):
            return None

        if max_length is not None and len(cleaned) > max_length:
            return None

        return cleaned

    @staticmethod
    async def upsert_profile(db: AsyncSession, payload: ProfileUpsert) -> ProfileReadWithEmail:
        """Create or update a profile row keyed by user_id while preserving user-edited values."""
        result = await db.execute(select(Profile).where(Profile.user_id == payload.user_id))
        profile = result.scalar_one_or_none()

        sanitized_avatar = ProfileService._sanitize_profile_string(payload.avatar_url, max_length=500)
        sanitized_website = ProfileService._sanitize_profile_string(payload.website, max_length=500)

        if profile is None:
            profile = Profile(
                user_id=payload.user_id,
                email=payload.email,
                full_name=payload.full_name,
                avatar_url=sanitized_avatar,
                role=payload.role,
                bio=payload.bio,
                organization=payload.organization,
                phone=payload.phone,
                location=payload.location,
                website=sanitized_website,
            )
            db.add(profile)
        else:
            # Keep the canonical auth email synced, but avoid overwriting user-customized profile content
            # when the incoming payload is blank or just the provider default.
            profile.email = payload.email or profile.email

            if payload.full_name and payload.full_name.strip():
                profile.full_name = payload.full_name.strip()

            sanitized_avatar = ProfileService._sanitize_profile_string(payload.avatar_url, max_length=500)
            if sanitized_avatar is not None:
                profile.avatar_url = sanitized_avatar
            elif profile.avatar_url is None:
                profile.avatar_url = None

            if payload.role and payload.role.strip():
                if profile.role == "citizen" or payload.role.lower() in {"reviewer", "limnologist", "inspector", "researcher", "steward", "officer", "volunteer"}:
                    profile.role = payload.role.strip()

            if payload.bio is not None and payload.bio.strip():
                profile.bio = payload.bio.strip()
            elif payload.bio is not None and not payload.bio.strip() and profile.bio is None:
                profile.bio = None

            if payload.location is not None and payload.location.strip():
                profile.location = payload.location.strip()
            elif payload.location is not None and not payload.location.strip() and profile.location is None:
                profile.location = None

            sanitized_website = ProfileService._sanitize_profile_string(payload.website, max_length=500)
            if sanitized_website is not None:
                profile.website = sanitized_website
            elif payload.website is not None and not payload.website.strip() and profile.website is None:
                profile.website = None

            if payload.organization is not None and payload.organization.strip():
                profile.organization = payload.organization.strip()
            elif payload.organization is not None and not payload.organization.strip() and profile.organization is None:
                profile.organization = None

            if payload.phone is not None and payload.phone.strip():
                profile.phone = payload.phone.strip()
            elif payload.phone is not None and not payload.phone.strip() and profile.phone is None:
                profile.phone = None

        await db.commit()
        await db.refresh(profile)
        return ProfileReadWithEmail.model_validate(profile)

    @staticmethod
    async def get_profile_by_user_id(db: AsyncSession, user_id: str) -> Profile | None:
        result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user_id: str,
        updates: ProfileUpdate,
    ) -> ProfileReadWithEmail | None:
        """Apply partial updates to a user's own profile."""
        result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if profile is None:
            return None

        data = updates.model_dump(exclude_unset=True)
        for field, value in data.items():
            if field == "avatar_url":
                sanitized = ProfileService._sanitize_profile_string(value, max_length=500)
                setattr(profile, field, sanitized)
            elif field in {"website"}:
                setattr(profile, field, ProfileService._sanitize_profile_string(value, max_length=500))
            else:
                setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)
        return ProfileReadWithEmail.model_validate(profile)

    @staticmethod
    async def increment_observation_count(db: AsyncSession, user_id: str) -> None:
        """Increment the cached observation counter after a new submission."""
        result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if profile:
            profile.observations_count = (profile.observations_count or 0) + 1
            await db.commit()

    @staticmethod
    async def follow_profile(db: AsyncSession, target_user_id: str, follower_user_id: str) -> ProfileRead | None:
        """Increment follower count on target and following count on follower."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        target_profile.followers_count = (target_profile.followers_count or 0) + 1

        res_follower = await db.execute(select(Profile).where(Profile.user_id == follower_user_id))
        follower_profile = res_follower.scalar_one_or_none()
        if follower_profile:
            follower_profile.following_count = (follower_profile.following_count or 0) + 1

        await db.commit()
        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

    @staticmethod
    async def unfollow_profile(db: AsyncSession, target_user_id: str, follower_user_id: str) -> ProfileRead | None:
        """Decrement follower count on target and following count on follower."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        target_profile.followers_count = max(0, (target_profile.followers_count or 0) - 1)

        res_follower = await db.execute(select(Profile).where(Profile.user_id == follower_user_id))
        follower_profile = res_follower.scalar_one_or_none()
        if follower_profile:
            follower_profile.following_count = max(0, (follower_profile.following_count or 0) - 1)

        await db.commit()
        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

    @staticmethod
    async def like_profile(db: AsyncSession, target_user_id: str) -> ProfileRead | None:
        """Increment likes_received on target profile."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        target_profile.likes_received = (target_profile.likes_received or 0) + 1
        await db.commit()
        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

