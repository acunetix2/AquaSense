from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.observation import Observation
from app.models.profile import Profile
from app.models.social import ProfileFollow, ProfileLike
from app.schemas.profile import ProfileRead, ProfileReadWithEmail, ProfileUpsert, ProfileUpdate
from app.services.social_service import SocialService


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
    async def sync_observation_attribution(db: AsyncSession, profile: Profile) -> None:
        """
        Propagate profile edits to the user's existing observations.

        Observations store a denormalized snapshot of the observer's name,
        avatar, role, location, and email. Without this sync, renaming an
        account would leave every past observation stuck on the old name.
        """
        await db.execute(
            update(Observation)
            .where(Observation.user_id == profile.user_id)
            .values(
                observer_name=profile.full_name,
                observer_avatar=profile.avatar_url,
                observer_role=profile.role,
                observer_location=profile.location,
                observer_email=profile.email,
            )
        )
        await db.commit()

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
        await ProfileService.sync_observation_attribution(db, profile)
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
        await ProfileService.sync_observation_attribution(db, profile)
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
        """Record a follow edge (idempotent) and recompute both counters from the edge table."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        existing = await db.execute(
            select(ProfileFollow).where(
                ProfileFollow.follower_id == follower_user_id,
                ProfileFollow.followee_id == target_user_id,
            )
        )
        created = False
        if existing.scalar_one_or_none() is None:
            db.add(ProfileFollow(follower_id=follower_user_id, followee_id=target_user_id))
            try:
                await db.commit()
                created = True
            except IntegrityError:
                await db.rollback()  # concurrent duplicate follow — already recorded

        target_profile.followers_count = await SocialService.follower_count(db, target_user_id)
        res_follower = await db.execute(select(Profile).where(Profile.user_id == follower_user_id))
        follower_profile = res_follower.scalar_one_or_none()
        if follower_profile:
            follower_profile.following_count = await SocialService.following_count(db, follower_user_id)
            await db.commit()

        if created:
            from app.services.notification_service import NotificationService

            follower_name = follower_profile.full_name if follower_profile else follower_user_id
            await NotificationService.notify(
                db,
                user_id=target_user_id,
                type="follow",
                title="New follower",
                body=f"{follower_name} started following you.",
                actor_id=follower_user_id,
                actor_name=follower_name,
            )

        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

    @staticmethod
    async def unfollow_profile(db: AsyncSession, target_user_id: str, follower_user_id: str) -> ProfileRead | None:
        """Remove a follow edge (idempotent) and recompute both counters from the edge table."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        await db.execute(
            delete(ProfileFollow).where(
                ProfileFollow.follower_id == follower_user_id,
                ProfileFollow.followee_id == target_user_id,
            )
        )
        await db.commit()

        target_profile.followers_count = await SocialService.follower_count(db, target_user_id)
        res_follower = await db.execute(select(Profile).where(Profile.user_id == follower_user_id))
        follower_profile = res_follower.scalar_one_or_none()
        if follower_profile:
            follower_profile.following_count = await SocialService.following_count(db, follower_user_id)
            await db.commit()

        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

    @staticmethod
    async def like_profile(
        db: AsyncSession, target_user_id: str, liker_user_id: str
    ) -> ProfileRead | None:
        """Record a profile like edge (idempotent) and recompute likes_received from the edge table."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        existing = await db.execute(
            select(ProfileLike).where(
                ProfileLike.target_id == target_user_id,
                ProfileLike.liker_id == liker_user_id,
            )
        )
        if existing.scalar_one_or_none() is None:
            db.add(ProfileLike(target_id=target_user_id, liker_id=liker_user_id))
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()

        target_profile.likes_received = await SocialService.profile_like_count(db, target_user_id)
        await db.commit()
        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

    @staticmethod
    async def unlike_profile(
        db: AsyncSession, target_user_id: str, liker_user_id: str
    ) -> ProfileRead | None:
        """Remove a profile like edge (idempotent) and recompute likes_received."""
        res_target = await db.execute(select(Profile).where(Profile.user_id == target_user_id))
        target_profile = res_target.scalar_one_or_none()
        if not target_profile:
            return None

        await db.execute(
            delete(ProfileLike).where(
                ProfileLike.target_id == target_user_id,
                ProfileLike.liker_id == liker_user_id,
            )
        )
        await db.commit()

        target_profile.likes_received = await SocialService.profile_like_count(db, target_user_id)
        await db.commit()
        await db.refresh(target_profile)
        return ProfileRead.model_validate(target_profile)

