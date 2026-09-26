"""
Create and seed all new tables: profiles, reviews, monitoring_sites, basin_analytics.
"""

import asyncio
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # registers all 5 models
from app.db.base import Base
from app.models.profile import Profile
from app.models.review import Review
from app.models.monitoring_site import MonitoringSite
from app.models.analytics import BasinAnalytics

raw_url = os.environ.get("DATABASE_URL", "")
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    raw_url,
    echo=False,
    connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0}
)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

PROFILES = [
    {
        "user_id": "demo-citizen-elena",
        "email": "elena.rostova@civicscience.org",
        "full_name": "Elena Rostova",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
        "role": "citizen",
        "bio": "Civic river guardian focusing on Hudson & Brooklyn tidal tributaries. Passionate about youth freshwater education.",
        "organization": "Civic River Guardians NYC",
        "phone": "+1 (555) 234-8910",
        "observations_count": 14,
        "verified_count": 12,
    },
    {
        "user_id": "demo-reviewer-sarah",
        "email": "sarah.lin@watershed.org",
        "full_name": "Dr. Sarah Lin",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80",
        "role": "reviewer",
        "bio": "Senior Limnologist & Regional Watershed Director. Specializing in urban runoff mitigation and macroinvertebrate health indices.",
        "organization": "Northeast Watershed Alliance",
        "phone": "+1 (555) 478-9921",
        "observations_count": 28,
        "verified_count": 28,
    }
]

SITES = [
    {"site_name": "Oak River Reserve", "basin_name": "Lower Hudson River Basin", "latitude": 40.6782, "longitude": -73.9442, "description": "Pristine gravel stream bed with thriving riparian vegetation and macroinvertebrates.", "catchment_area_sq_km": 14.2, "baseline_quality": "normal"},
    {"site_name": "Hudson River North Pier", "basin_name": "Hudson River Estuary", "latitude": 40.8510, "longitude": -73.9312, "description": "Tidal monitoring station with seasonal salinity and turbidity tracking.", "catchment_area_sq_km": 82.5, "baseline_quality": "normal"},
    {"site_name": "Bronx River Greenway", "basin_name": "Bronx River Basin", "latitude": 40.8258, "longitude": -73.8820, "description": "Urban restored river corridor with active citizen stewardship programs.", "catchment_area_sq_km": 18.0, "baseline_quality": "normal"},
    {"site_name": "Onondaga Lake Outlet", "basin_name": "Oswego River Basin", "latitude": 43.0889, "longitude": -76.2089, "description": "Historical remediation zone subject to seasonal cyanobacteria and phosphorus spikes.", "catchment_area_sq_km": 45.1, "baseline_quality": "watch"},
    {"site_name": "Gowanus Canal Outfall", "basin_name": "Upper New York Bay", "latitude": 40.6712, "longitude": -73.9975, "description": "EPA Superfund industrial canal with severe sediment contamination and industrial foam risks.", "catchment_area_sq_km": 6.8, "baseline_quality": "investigate"},
    {"site_name": "Flushing Bay Inlet", "basin_name": "Long Island Sound Basin", "latitude": 40.7776, "longitude": -73.8479, "description": "Tidal inlet monitored for post-storm combined sewer overflow (CSO) events.", "catchment_area_sq_km": 12.4, "baseline_quality": "investigate"},
]

ANALYTICS = [
    {
        "snapshot_date": date.today() - timedelta(days=i),
        "basin_name": "Regional Basin Overview",
        "total_samples": 42 + (7 - i) * 3,
        "normal_count": 28 + (7 - i) * 2,
        "watch_count": 9 + (i % 2),
        "investigate_count": 5 + (i % 3),
        "verified_rate": 0.88,
        "health_index_score": 78.5 + (i % 4),
    }
    for i in range(7)
]


async def main():
    print("[*] Creating all database tables in Supabase PostgreSQL...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Tables created successfully!")

    async with SessionLocal() as db:
        # 1. Profiles
        for p in PROFILES:
            stmt = select(Profile).where(Profile.email == p["email"])
            existing = (await db.execute(stmt)).scalars().first()
            if not existing:
                db.add(Profile(**p))
                print(f"[+] Added profile: {p['full_name']}")

        # 2. Monitoring Sites
        for s in SITES:
            stmt = select(MonitoringSite).where(MonitoringSite.site_name == s["site_name"])
            existing = (await db.execute(stmt)).scalars().first()
            if not existing:
                db.add(MonitoringSite(**s))
                print(f"[+] Added monitoring site: {s['site_name']}")

        # 3. Analytics
        for a in ANALYTICS:
            stmt = select(BasinAnalytics).where(BasinAnalytics.snapshot_date == a["snapshot_date"])
            existing = (await db.execute(stmt)).scalars().first()
            if not existing:
                db.add(BasinAnalytics(**a))

        await db.commit()
        print("[+] All initial data committed successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
