"""Social features: observation comments, observation likes, and follow/like state."""
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.observation import Observation
from app.models.social import (
    ObservationComment,
    ObservationLike,
    ObservationView,
    ProfileFollow,
    ProfileLike,
)
from app.schemas.social import CommentCreate, CommentRead, LikeState


class SocialService:
    # ------------------------------------------------------------------
    # Comments
    # ------------------------------------------------------------------

    @staticmethod
    async def list_comments(db: AsyncSession, observation_id: UUID) -> list[CommentRead]:
        result = await db.execute(
            select(ObservationComment)
            .where(ObservationComment.observation_id == observation_id)
            .order_by(ObservationComment.created_at.asc())
        )
        return [CommentRead.model_validate(c) for c in result.scalars().all()]

    @staticmethod
    async def create_comment(
        db: AsyncSession,
        observation_id: UUID,
        user_id: str,
        payload: CommentCreate,
        *,
        author_name: str,
        author_avatar: str | None = None,
        author_role: str | None = None,
    ) -> CommentRead | None:
        """Add a comment. Returns None when the observation does not exist."""
        obs = await db.execute(select(Observation).where(Observation.id == observation_id))
        if obs.scalar_one_or_none() is None:
            return None

        body = payload.body.strip()
        comment = ObservationComment(
            observation_id=observation_id,
            user_id=user_id,
            author_name=author_name or "Citizen Scientist",
            author_avatar=author_avatar,
            author_role=author_role,
            body=body,
        )
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return CommentRead.model_validate(comment)

    @staticmethod
    async def delete_comment(db: AsyncSession, comment_id: UUID, requesting_user_id: str) -> bool:
        """
        Delete a comment. Allowed for the comment author.
        Returns True when deleted, False when not found.
        Raises PermissionError when the requester is not the author.
        """
        result = await db.execute(select(ObservationComment).where(ObservationComment.id == comment_id))
        comment = result.scalar_one_or_none()
        if comment is None:
            return False

        if comment.user_id != requesting_user_id:
            raise PermissionError("Only the comment author can delete this comment.")

        await db.delete(comment)
        await db.commit()
        return True

    # ------------------------------------------------------------------
    # Observation likes
    # ------------------------------------------------------------------

    @staticmethod
    async def _observation_exists(db: AsyncSession, observation_id: UUID) -> bool:
        result = await db.execute(select(Observation.id).where(Observation.id == observation_id))
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def _like_count(db: AsyncSession, observation_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ObservationLike)
            .where(ObservationLike.observation_id == observation_id)
        )
        return int(result.scalar() or 0)

    @staticmethod
    async def like_observation(db: AsyncSession, observation_id: UUID, user_id: str) -> LikeState | None:
        """Idempotent like — returns None when the observation does not exist."""
        if not await SocialService._observation_exists(db, observation_id):
            return None

        existing = await db.execute(
            select(ObservationLike).where(
                ObservationLike.observation_id == observation_id,
                ObservationLike.user_id == user_id,
            )
        )
        if existing.scalar_one_or_none() is None:
            db.add(ObservationLike(observation_id=observation_id, user_id=user_id))
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()  # concurrent duplicate like — already recorded

        return LikeState(liked=True, like_count=await SocialService._like_count(db, observation_id))

    @staticmethod
    async def unlike_observation(db: AsyncSession, observation_id: UUID, user_id: str) -> LikeState | None:
        if not await SocialService._observation_exists(db, observation_id):
            return None

        await db.execute(
            delete(ObservationLike).where(
                ObservationLike.observation_id == observation_id,
                ObservationLike.user_id == user_id,
            )
        )
        await db.commit()
        return LikeState(liked=False, like_count=await SocialService._like_count(db, observation_id))

    # ------------------------------------------------------------------
    # Views (unique per viewer)
    # ------------------------------------------------------------------

    @staticmethod
    async def record_view(db: AsyncSession, observation_id: UUID, viewer_id: str) -> int | None:
        """
        Record a view of an observation by a viewer (idempotent — one row per
        viewer). Returns the total unique view count, or None when the
        observation does not exist.
        """
        if not await SocialService._observation_exists(db, observation_id):
            return None

        existing = await db.execute(
            select(ObservationView.id).where(
                ObservationView.observation_id == observation_id,
                ObservationView.viewer_id == viewer_id,
            )
        )
        if existing.scalar_one_or_none() is None:
            db.add(ObservationView(observation_id=observation_id, viewer_id=viewer_id))
            try:
                await db.commit()
            except IntegrityError:
                await db.rollback()  # concurrent duplicate view — already recorded

        return await SocialService._view_count(db, observation_id)

    @staticmethod
    async def _view_count(db: AsyncSession, observation_id: UUID) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ObservationView)
            .where(ObservationView.observation_id == observation_id)
        )
        return int(result.scalar() or 0)

    @staticmethod
    async def social_counts(
        db: AsyncSession, observation_ids: list[UUID], viewer_id: str | None = None
    ) -> dict[UUID, dict[str, int | bool]]:
        """
        Bulk-compute like/comment/view counts and the viewer's like state
        for a page of observations (4 queries total, regardless of page size).
        """
        if not observation_ids:
            return {}

        likes_result = await db.execute(
            select(ObservationLike.observation_id, func.count())
            .where(ObservationLike.observation_id.in_(observation_ids))
            .group_by(ObservationLike.observation_id)
        )
        comments_result = await db.execute(
            select(ObservationComment.observation_id, func.count())
            .where(ObservationComment.observation_id.in_(observation_ids))
            .group_by(ObservationComment.observation_id)
        )
        views_result = await db.execute(
            select(ObservationView.observation_id, func.count())
            .where(ObservationView.observation_id.in_(observation_ids))
            .group_by(ObservationView.observation_id)
        )

        liked_ids: set[UUID] = set()
        if viewer_id:
            liked_result = await db.execute(
                select(ObservationLike.observation_id).where(
                    ObservationLike.observation_id.in_(observation_ids),
                    ObservationLike.user_id == viewer_id,
                )
            )
            liked_ids = set(liked_result.scalars().all())

        counts: dict[UUID, dict[str, int | bool]] = {
            oid: {"like_count": 0, "comment_count": 0, "view_count": 0, "liked_by_me": oid in liked_ids}
            for oid in observation_ids
        }
        for oid, n in likes_result.all():
            counts[oid]["like_count"] = int(n)
        for oid, n in comments_result.all():
            counts[oid]["comment_count"] = int(n)
        for oid, n in views_result.all():
            counts[oid]["view_count"] = int(n)
        return counts

    # ------------------------------------------------------------------
    # Profile follow / like state helpers
    # ------------------------------------------------------------------

    @staticmethod
    async def is_following(db: AsyncSession, follower_id: str, followee_id: str) -> bool:
        result = await db.execute(
            select(ProfileFollow.id).where(
                ProfileFollow.follower_id == follower_id,
                ProfileFollow.followee_id == followee_id,
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def has_liked_profile(db: AsyncSession, liker_id: str, target_id: str) -> bool:
        result = await db.execute(
            select(ProfileLike.id).where(
                ProfileLike.liker_id == liker_id,
                ProfileLike.target_id == target_id,
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def follower_count(db: AsyncSession, followee_id: str) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ProfileFollow)
            .where(ProfileFollow.followee_id == followee_id)
        )
        return int(result.scalar() or 0)

    @staticmethod
    async def following_count(db: AsyncSession, follower_id: str) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ProfileFollow)
            .where(ProfileFollow.follower_id == follower_id)
        )
        return int(result.scalar() or 0)

    @staticmethod
    async def profile_like_count(db: AsyncSession, target_id: str) -> int:
        result = await db.execute(
            select(func.count())
            .select_from(ProfileLike)
            .where(ProfileLike.target_id == target_id)
        )
        return int(result.scalar() or 0)

    # ------------------------------------------------------------------
    # Profile engagement aggregates (across the user's observations)
    # ------------------------------------------------------------------

    @staticmethod
    async def comments_received(db: AsyncSession, user_id: str) -> int:
        """Total comments left on this user's observations."""
        result = await db.execute(
            select(func.count())
            .select_from(ObservationComment)
            .join(Observation, ObservationComment.observation_id == Observation.id)
            .where(Observation.user_id == user_id)
        )
        return int(result.scalar() or 0)

    @staticmethod
    async def views_received(db: AsyncSession, user_id: str) -> int:
        """Total unique views across this user's observations."""
        result = await db.execute(
            select(func.count())
            .select_from(ObservationView)
            .join(Observation, ObservationView.observation_id == Observation.id)
            .where(Observation.user_id == user_id)
        )
        return int(result.scalar() or 0)
