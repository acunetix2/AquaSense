"""
Shared pytest fixtures for the AquaSense API test suite.

Uses an in-memory SQLite database so tests run without any external
database connection. The `TestClient` wraps the FastAPI app and drives
the full request → middleware → route → service → database lifecycle.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import StaticPool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app

SQLITE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture()
def client():
    """
    Provide a TestClient that overrides `get_db` with an in-memory SQLite
    session so each test is fully isolated and needs no external services.
    """
    engine = create_async_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async def _create_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    import asyncio
    asyncio.run(_create_tables())

    async def override_get_db():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


def _create_observation(client: TestClient, **overrides) -> dict:
    """POST an observation with a traceable user_id and return the created record."""
    payload = {
        "site_name": "Test Site",
        "latitude": 40.0,
        "longitude": -73.0,
        "user_id": "test-observer-1",
        "assessment_answers": {},
    }
    payload.update(overrides)
    response = client.post("/api/v1/observations", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def _create_profile(client: TestClient, user_id: str, role: str) -> None:
    """Seed a profile row so role checks have something to look up."""
    response = client.post("/api/v1/profiles/upsert", json={
        "user_id": user_id,
        "email": f"{user_id}@example.test",
        "full_name": user_id.replace("-", " ").title(),
        "role": role,
    })
    assert response.status_code == 200, response.text
