from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, model_validator
from supabase import Client, create_client
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.profile import ProfileUpsert
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str | None = Field(default=None, max_length=255)
    role: str | None = "citizen"
    name: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_name(cls, data):
        if isinstance(data, dict):
            if not data.get("full_name") and data.get("name"):
                data["full_name"] = data["name"]
            if not data.get("name") and data.get("full_name"):
                data["name"] = data["full_name"]
        return data

    @property
    def resolved_name(self) -> str:
        return (self.full_name or self.name or self.email.split("@", 1)[0]).strip() or "AquaSense User"


class SignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    user_id: str | None = None
    email: str | None = None
    full_name: str | None = None
    role: str = "citizen"
    needs_confirmation: bool = False
    session: dict | None = None
    message: str | None = None


def _get_supabase_client() -> Client:
    settings = get_settings()
    key = settings.supabase_anon_key or settings.supabase_service_role_key
    if not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase auth key is not configured on the backend.",
        )
    return create_client(settings.supabase_url, key)


def _normalize_supabase_user(user_payload: object | None) -> dict:
    if user_payload is None:
        return {}
    if isinstance(user_payload, dict):
        return user_payload
    if hasattr(user_payload, "model_dump"):
        return user_payload.model_dump()
    return getattr(user_payload, "dict", lambda: {})()


def _normalize_supabase_session(session_payload: object | None) -> dict | None:
    if session_payload is None:
        return None
    if isinstance(session_payload, dict):
        return session_payload
    if hasattr(session_payload, "model_dump"):
        return session_payload.model_dump()
    return getattr(session_payload, "dict", lambda: None)() or None


def _friendly_auth_error(exc: Exception) -> str:
    text = str(exc).lower()
    if any(marker in text for marker in ["email not confirmed", "not confirmed", "confirm your email", "email confirmation", "unsupported_grant_type", "grant type"]):
        return "Please confirm your email before signing in. Check your inbox for the confirmation link."
    if "invalid login" in text or "invalid credentials" in text:
        return "Invalid email or password."
    return "Authentication failed. Please try again."


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Create a Supabase user through the backend SDK and sync the profile row in AquaSense."""
    full_name = payload.resolved_name
    supabase_client = _get_supabase_client()
    result = supabase_client.auth.sign_up(
        {
            "email": str(payload.email),
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "name": full_name,
                    "role": payload.role or "citizen",
                }
            },
        }
    )

    user = _normalize_supabase_user(getattr(result, "user", None) or (getattr(result, "user", None) if isinstance(result, dict) else {}))
    session = _normalize_supabase_session(getattr(result, "session", None))

    if user.get("id"):
        await ProfileService.upsert_profile(
            db,
            ProfileUpsert(
                user_id=user["id"],
                email=user.get("email") or str(payload.email),
                full_name=user.get("user_metadata", {}).get("full_name") or full_name,
                avatar_url=(user.get("user_metadata") or {}).get("avatar_url") or None,
                role=(user.get("user_metadata") or {}).get("role") or (payload.role or "citizen"),
                bio=None,
                organization=None,
                phone=None,
                location=None,
                website=None,
            ),
        )

    needs_confirmation = bool(user.get("id") and not session)
    return AuthResponse(
        user_id=user.get("id"),
        email=user.get("email") or str(payload.email),
        full_name=user.get("user_metadata", {}).get("full_name") or full_name,
        role=(user.get("user_metadata") or {}).get("role") or (payload.role or "citizen"),
        needs_confirmation=needs_confirmation,
        session=session,
        message="Please check your email to confirm your account." if needs_confirmation else "Account created successfully.",
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: SignInRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Login through Supabase Auth and ensure the profile exists in the AquaSense database."""
    supabase_client = _get_supabase_client()
    try:
        result = supabase_client.auth.sign_in_with_password(
            {
                "email": str(payload.email),
                "password": payload.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_friendly_auth_error(exc),
        ) from exc

    user = _normalize_supabase_user(getattr(result, "user", None))
    session = _normalize_supabase_session(getattr(result, "session", None))

    if user.get("id"):
        user_meta = user.get("user_metadata") or {}
        await ProfileService.upsert_profile(
            db,
            ProfileUpsert(
                user_id=user["id"],
                email=user.get("email") or str(payload.email),
                full_name=user_meta.get("full_name") or user_meta.get("name") or str(payload.email).split("@", 1)[0],
                avatar_url=user_meta.get("avatar_url") or user_meta.get("picture") or None,
                role=user_meta.get("role") or "citizen",
                bio=user_meta.get("bio") or None,
                organization=None,
                phone=None,
                location=user_meta.get("location") or None,
                website=user_meta.get("website") or None,
            ),
        )

    if not user.get("id") and not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please confirm your email before signing in. Check your inbox for the confirmation link.",
        )

    return AuthResponse(
        user_id=user.get("id") or (session or {}).get("user_id"),
        email=user.get("email") or str(payload.email),
        full_name=(user.get("user_metadata", {}) or {}).get("full_name") or (user.get("user_metadata", {}) or {}).get("name") or str(payload.email).split("@", 1)[0],
        role=(user.get("user_metadata", {}) or {}).get("role") or "citizen",
        needs_confirmation=False,
        session=session,
        message="Signed in successfully.",
    )
