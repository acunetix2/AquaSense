from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import is_reviewer_role, require_reviewer
from app.db.session import get_db
from app.schemas.observation import (
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    MultiImageAnalysisRequest,
    ObservationCreate,
    ObservationRead,
    ObservationReview,
    ObservationUpdate,
)
from app.schemas.social import CommentCreate, CommentRead, LikeState
from app.services.ai_service import analyze_image_with_groq, analyze_multiple_images_with_groq
from app.services.observation_service import ObservationService
from app.services.profile_service import ProfileService
from app.services.social_service import SocialService

router = APIRouter(prefix="/observations", tags=["observations"])


async def _attach_social(
    db: AsyncSession, observations: list[ObservationRead], viewer_id: str | None
) -> None:
    """Attach like/comment counts and the viewer's like state to a page of observations."""
    counts = await SocialService.social_counts(
        db, [o.id for o in observations], viewer_id=viewer_id
    )
    for obs in observations:
        entry = counts.get(obs.id, {})
        obs.like_count = int(entry.get("like_count", 0))  # type: ignore[arg-type]
        obs.comment_count = int(entry.get("comment_count", 0))  # type: ignore[arg-type]
        obs.liked_by_me = bool(entry.get("liked_by_me", False))


# ---------------------------------------------------------------------------
# Standalone image analysis – no DB write, real-time GROQ response
# ---------------------------------------------------------------------------

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(payload: ImageAnalysisRequest) -> ImageAnalysisResponse:
    """
    Run GROQ Vision analysis on a single base64-encoded water body image.
    Returns a structured environmental assessment without persisting to DB.
    """
    result = await analyze_image_with_groq(
        image_data=payload.image_data,
        image_mime=payload.image_mime,
        site_name=payload.site_name,
        water_appearance=payload.water_appearance,
        odour=payload.odour,
        waste_visible=payload.waste_visible,
        flow_rate=payload.flow_rate,
        notes=payload.notes,
        assessment_answers=payload.assessment_answers,
    )
    return ImageAnalysisResponse(**result)


@router.post("/analyze-images", response_model=ImageAnalysisResponse)
async def analyze_multiple_images(payload: MultiImageAnalysisRequest) -> ImageAnalysisResponse:
    """
    Run GROQ Vision analysis on up to 3 base64-encoded water body images simultaneously.
    Provides synthesized multi-angle environmental assessment.
    """
    result = await analyze_multiple_images_with_groq(
        image_data_list=payload.image_data_list[:3],
        image_mime=payload.image_mime,
        site_name=payload.site_name,
        water_appearance=payload.water_appearance,
        odour=payload.odour,
        waste_visible=payload.waste_visible,
        flow_rate=payload.flow_rate,
        notes=payload.notes,
        assessment_answers=payload.assessment_answers,
    )
    return ImageAnalysisResponse(**result)


# ---------------------------------------------------------------------------
# Image CORS Proxy – allows loading recent web/URL images safely in the frontend
# ---------------------------------------------------------------------------

@router.get("/proxy-image")
async def proxy_image(url: str = Query(..., description="External image URL to proxy")) -> Response:
    """
    Fetch an image from an external URL and stream back to frontend with permissive CORS headers.
    Solves browser CORS canvas/fetch restrictions on 'From URL' water body images.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AquaSense-Proxy/1.0"})
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch image from upstream server ({resp.status_code})",
                )
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*",
                },
            )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Network error fetching image: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Analytics endpoint
# ---------------------------------------------------------------------------

@router.get("/analytics")
async def get_analytics(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Return live, computed aggregate metrics from all observations in the database.
    Used for the Impact Data page and Dashboard metrics.
    """
    return await ObservationService.get_analytics(db)


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ObservationRead])
async def list_observations(
    signal: str | None = Query(None, description="Filter by signal: normal, watch, investigate"),
    obs_status: str | None = Query(None, alias="status", description="Filter by status: pending, verified, flagged"),
    user_id: str | None = Query(None, description="Filter by observer user_id"),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    x_user_id: str | None = Header(None, description="Viewer id — enables liked_by_me in the response."),
    db: AsyncSession = Depends(get_db),
) -> list[ObservationRead]:
    """List observations with optional filtering and pagination. observer_email is redacted."""
    observations = await ObservationService.list_observations(
        db, signal=signal, status=obs_status, user_id=user_id, limit=limit, offset=offset
    )
    # Redact email from all public-facing responses
    for obs in observations:
        obs.observer_email = None
    await _attach_social(db, observations, viewer_id=x_user_id)
    return observations


@router.post("", response_model=ObservationRead, status_code=status.HTTP_201_CREATED)
async def create_observation(
    payload: ObservationCreate,
    db: AsyncSession = Depends(get_db),
) -> ObservationRead:
    """Submit a new citizen observation. GROQ vision analysis runs if image_data or image_data_list is included."""
    obs = await ObservationService.create_observation(db, payload)
    # Increment profile observation counter if user is authenticated
    if payload.user_id:
        await ProfileService.increment_observation_count(db, payload.user_id)
    obs.observer_email = None
    return obs


@router.get("/{observation_id}", response_model=ObservationRead)
async def get_observation(
    observation_id: UUID,
    x_user_id: str | None = Header(None, description="Viewer id — enables liked_by_me in the response."),
    db: AsyncSession = Depends(get_db),
) -> ObservationRead:
    """Retrieve a single observation by ID. observer_email is redacted."""
    observation = await ObservationService.get_observation(db, observation_id)
    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    result = ObservationRead.model_validate(observation)
    result.observer_email = None
    await _attach_social(db, [result], viewer_id=x_user_id)
    return result


@router.patch("/{observation_id}", response_model=ObservationRead)
async def update_observation(
    observation_id: UUID,
    updates: ObservationUpdate,
    x_user_id: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ObservationRead:
    """
    Owner-only update of observation details (notes, site name, appearance, etc.).
    Requires X-User-Id header matching the observation's creator.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required to edit an observation.",
        )

    try:
        updated = await ObservationService.update_observation(
            db, observation_id, updates, requesting_user_id=x_user_id
        )
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this observation. Only the original author can edit it.",
        )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )

    updated.observer_email = None
    return updated


@router.patch("/{observation_id}/review", response_model=ObservationRead)
async def review_observation(
    observation_id: UUID,
    review: ObservationReview,
    x_user_id: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ObservationRead:
    """
    Submit a reviewer decision for an observation.
    Requires X-User-Id belonging to a reviewer-level profile
    (reviewer, limnologist, inspector, researcher or officer).
    """
    await require_reviewer(db, x_user_id)

    updated = await ObservationService.review_observation(db, observation_id, review)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    updated.observer_email = None
    return updated


@router.delete("/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_observation(
    observation_id: UUID,
    x_user_id: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete an observation by ID.
    Requires X-User-Id header matching the observation's owner or reviewer role.
    Observations without an owner may only be deleted by a reviewer.
    """
    observation = await ObservationService.get_observation(db, observation_id)
    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )

    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-User-Id header is required to delete this observation.",
        )

    is_owner = bool(observation.user_id) and observation.user_id == x_user_id
    if not is_owner:
        # Not the owner (or the record has no owner) — reviewer role required.
        requesting_profile = await ProfileService.get_profile_by_user_id(db, x_user_id)
        if requesting_profile is None or not is_reviewer_role(requesting_profile.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this observation.",
            )

    deleted = await ObservationService.delete_observation(db, observation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )


# ---------------------------------------------------------------------------
# Social – comments and likes on an observation
# ---------------------------------------------------------------------------

@router.get("/{observation_id}/comments", response_model=list[CommentRead])
async def list_comments(
    observation_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[CommentRead]:
    """List comments on an observation (oldest first)."""
    observation = await ObservationService.get_observation(db, observation_id)
    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    return await SocialService.list_comments(db, observation_id)


@router.post("/{observation_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    observation_id: UUID,
    payload: CommentCreate,
    x_user_id: str = Header(..., description="User id of the commenter."),
    db: AsyncSession = Depends(get_db),
) -> CommentRead:
    """Comment on an observation. Requires X-User-Id; author details come from the profile when available."""
    profile = await ProfileService.get_profile_by_user_id(db, x_user_id)
    comment = await SocialService.create_comment(
        db,
        observation_id,
        x_user_id,
        payload,
        author_name=(profile.full_name if profile else None) or "Citizen Scientist",
        author_avatar=(profile.avatar_url if profile else None),
        author_role=(profile.role if profile else None),
    )
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    return comment


@router.delete("/{observation_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    observation_id: UUID,
    comment_id: UUID,
    x_user_id: str = Header(..., description="User id of the commenter."),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a comment. Only the comment's author may delete it."""
    try:
        deleted = await SocialService.delete_comment(db, comment_id, x_user_id)
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} not found.",
        )


@router.post("/{observation_id}/like", response_model=LikeState)
async def like_observation(
    observation_id: UUID,
    x_user_id: str = Header(..., description="User id doing the liking."),
    db: AsyncSession = Depends(get_db),
) -> LikeState:
    """Like an observation (idempotent)."""
    state = await SocialService.like_observation(db, observation_id, x_user_id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    return state


@router.delete("/{observation_id}/like", response_model=LikeState)
async def unlike_observation(
    observation_id: UUID,
    x_user_id: str = Header(..., description="User id removing the like."),
    db: AsyncSession = Depends(get_db),
) -> LikeState:
    """Remove a like from an observation (idempotent)."""
    state = await SocialService.unlike_observation(db, observation_id, x_user_id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found.",
        )
    return state

