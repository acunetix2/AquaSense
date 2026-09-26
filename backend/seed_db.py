"""
Seed script: populates the AquaSense observations table via the ORM.

Usage (from the backend/ directory):
    .venv\\Scripts\\python.exe seed_db.py
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.observation import Observation
from app.db.base import Base

# Normalize DATABASE_URL
raw_url = os.environ.get("DATABASE_URL", "")
if raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(raw_url, echo=False)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

OBSERVATIONS = [
    # ── NORMAL ───────────────────────────────────────────────────────────
    dict(
        site_name="Oak River Reserve",
        location_address="Oak River Reserve, Brooklyn, NY 11201",
        latitude=40.6782, longitude=-73.9442,
        image_url="https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=1200&q=80",
        water_appearance="clear", odour="none", waste_visible=False, flow_rate="normal",
        notes="Pristine conditions. Stream bed river stones clearly visible with healthy macroinvertebrate presence.",
        assessment_answers={"waterClarity": "clear", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "normal"},
        signal="normal", confidence=0.94,
        ai_summary="Healthy baseline conditions. Exceptional river clarity, gravel substrate integrity, and thriving riparian vegetation along riverbanks.",
        key_evidence=["River substrate clearly visible to depth of >1.2m", "Zero foam, unnatural discoloration, or waste detected", "Healthy macroinvertebrate community observed"],
        suggested_steps=["Log into regional freshwater biodiversity registry", "Continue regular bi-weekly monitoring schedule"],
        status="verified",
        reviewer_notes="Verified normal. Benchmark pristine river sample.",
        reviewed_by="Marcus Vance (Watershed Steward)",
        reviewed_at=datetime(2025, 4, 24, 11, 0, 0, tzinfo=timezone.utc),
        created_at=datetime(2025, 4, 24, 9, 15, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Pine Stream Rapids",
        location_address="Pine Stream Conservation Area, Catskills, NY",
        latitude=40.7831, longitude=-73.9712,
        image_url="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
        water_appearance="clear", odour="none", waste_visible=False, flow_rate="fast",
        notes="Swift mountain river flow with well-oxygenated white water and clear pools.",
        assessment_answers={"waterClarity": "clear", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "fast"},
        signal="normal", confidence=0.91,
        ai_summary="Optimal dissolved oxygen indicators with vigorous aeration over rock rapids. Water clarity is high with no signs of anthropogenic disturbance.",
        key_evidence=["High flow velocity and natural aeration cascades", "Submerged gravel clean and free of silt deposition"],
        suggested_steps=["Maintain quarterly baseline records"],
        status="verified",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 23, 16, 45, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Willow River Nature Sanctuary",
        location_address="Willow River Protected Basin, Queens, NY 11435",
        latitude=40.7282, longitude=-73.8448,
        image_url="https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80",
        water_appearance="clear", odour="none", waste_visible=False, flow_rate="normal",
        notes="Lush riverbank vegetation intact. Clear water reflecting surrounding trees.",
        assessment_answers={"waterClarity": "clear", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "normal"},
        signal="normal", confidence=0.89,
        ai_summary="Superb ecological balance. High transparency, thriving native riverbank flora, and absence of chemical or solid waste markers.",
        key_evidence=["Dense riparian vegetation cover (>90% river buffer zone)", "Water clarity rating optimal for local river classification"],
        suggested_steps=["Include in regional OneAquaHealth biodiversity archive"],
        status="verified",
        reviewer_notes="Confirmed healthy state. Exemplary baseline river dataset.",
        reviewed_by="Dr. Sarah Lin (Eco-Surveyor)",
        reviewed_at=datetime(2025, 4, 22, 13, 40, 0, tzinfo=timezone.utc),
        created_at=datetime(2025, 4, 22, 11, 15, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Catskill River Bend",
        location_address="Catskill Mountain Basin, NY 12414",
        latitude=40.7589, longitude=-73.9851,
        image_url="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
        water_appearance="clear", odour="none", waste_visible=False, flow_rate="normal",
        notes="Crystal clear water flowing smoothly across rounded gravel bed. Native trout visible.",
        assessment_answers={"waterClarity": "clear", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "normal"},
        signal="normal", confidence=0.96,
        ai_summary="Pristine aquatic ecosystem. Transparent water column with healthy dissolved oxygen levels and thriving fish habitat.",
        key_evidence=["Full visibility of gravel river bed", "No detectable pollutants or unnatural organic film", "Native trout species observed"],
        suggested_steps=["Continue standard seasonal biological inventory"],
        status="verified",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 24, 18, 0, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Delaware River Headwaters",
        location_address="Delaware River Upper Basin, Sullivan County, NY 12738",
        latitude=41.7282, longitude=-74.9448,
        image_url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
        water_appearance="clear", odour="none", waste_visible=False, flow_rate="normal",
        notes="Outstanding riparian corridor with intact native vegetation. River visibility excellent at all depths.",
        assessment_answers={"waterClarity": "clear", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "normal"},
        signal="normal", confidence=0.92,
        ai_summary="Exceptional water quality in a protected upper watershed zone. Key biodiversity reservoir for migratory species.",
        key_evidence=["Near-perfect water transparency", "Undisturbed streambank with mature riparian buffer", "High benthic macroinvertebrate diversity"],
        suggested_steps=["Maintain quarterly water quality baseline", "Flag as reference site for regional watershed health benchmarking"],
        status="verified",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 21, 9, 30, 0, tzinfo=timezone.utc),
    ),
    # ── WATCH ─────────────────────────────────────────────────────────────
    dict(
        site_name="Riverside Park Runoff",
        location_address="Riverside Park Riverbank, New York, NY 10032",
        latitude=40.7128, longitude=-74.0060,
        image_url="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1200&q=80",
        water_appearance="slightly cloudy", odour="mild earth", waste_visible=False, flow_rate="low",
        notes="Green algae bloom forming along river stones. Flow slower than usual this week.",
        assessment_answers={"waterClarity": "slightly_cloudy", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "low"},
        signal="watch", confidence=0.78,
        ai_summary="The river image reveals noticeable algae biofilm and slightly cloudy water. Increased nutrient runoff may impact dissolved oxygen levels.",
        key_evidence=["Visible algae growth on river rocks (computer vision analysis)", "Slightly cloudy river water (field observation)", "Location has history of seasonal nutrient spikes"],
        suggested_steps=["Monitor river segment over the next 48 hours", "Flag for human review by regional limnology team", "Track nitrate and phosphorus runoff levels"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 25, 10, 42, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Maple Creek Watershed",
        location_address="Maple Creek Valley, Queens, NY 11354",
        latitude=40.7306, longitude=-73.9352,
        image_url="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
        water_appearance="murky", odour="none", waste_visible=False, flow_rate="normal",
        notes="Heavy sediment plume carrying brown clay runoff after morning storm.",
        assessment_answers={"waterClarity": "cloudy", "noticeableOdor": "no", "unusualColor": "no", "wasteVisible": False, "flowRate": "normal"},
        signal="watch", confidence=0.82,
        ai_summary="Elevated sediment loading detected in river channel following localized storm event. Temporary watch status recommended pending settling.",
        key_evidence=["Suspended mud and silt visible in river column", "Turbidity index 3.4x elevated compared to 30-day baseline"],
        suggested_steps=["Cross-reference with local watershed precipitation records", "Re-inspect in 24 hours to verify sedimentation clearance"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 24, 15, 20, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="East River Estuary North",
        location_address="East River Estuarine Zone, Bronx, NY 10465",
        latitude=40.8141, longitude=-73.8266,
        image_url="https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=80",
        water_appearance="slightly cloudy", odour="mild sulfur", waste_visible=False, flow_rate="low",
        notes="Slight tidal backflow discoloration. Low-tide exposure revealing darker sediment layers.",
        assessment_answers={"waterClarity": "slightly_cloudy", "noticeableOdor": "yes", "unusualColor": "no", "wasteVisible": False, "flowRate": "low"},
        signal="watch", confidence=0.74,
        ai_summary="Mild tidal estuarine anomaly. Elevated turbidity during low-tide cycle with sulfur odour indicating anaerobic sediment disturbance.",
        key_evidence=["Slight sulfur odour observed at low tide", "Turbidity elevated during tidal back-flow cycle"],
        suggested_steps=["Schedule tidal-cycle monitoring over 3 days", "Collect sediment core sample for anaerobic analysis"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 26, 8, 30, 0, tzinfo=timezone.utc),
    ),
    # ── INVESTIGATE ───────────────────────────────────────────────────────
    dict(
        site_name="Hudson Point Canal",
        location_address="Lower Hudson Canal Outfall, New York, NY 10004",
        latitude=40.7061, longitude=-74.0092,
        image_url="https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
        water_appearance="discoloured", odour="chemical", waste_visible=True, flow_rate="stagnant",
        notes="Oily chemical sheen on surface and plastic bottles/debris trapped near river culvert.",
        assessment_answers={"waterClarity": "very_cloudy", "noticeableOdor": "yes", "unusualColor": "yes", "wasteVisible": True, "flowRate": "stagnant"},
        signal="investigate", confidence=0.95,
        ai_summary="Severe multi-factor contamination: high density of floating plastic waste, dark discolored water, and petroleum-like sheen detected near culvert.",
        key_evidence=["High concentrations of floating anthropogenic debris", "Chemical odor reported with high confidence", "Severe surface hydrocarbons / oily sheen identified by vision model", "Impeded river flow near stormwater culvert"],
        suggested_steps=["Immediate alert dispatched to Municipal Water Protection", "Dispatch field team for chemical grab sample and containment boom", "Issue cleanup notice for culvert drainage catchment"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 25, 8, 30, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Bronx River Urban Reach",
        location_address="Bronx River Greenway, Soundview, NY 10473",
        latitude=40.8245, longitude=-73.8821,
        image_url="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=1200&q=80",
        water_appearance="discoloured", odour="chemical", waste_visible=True, flow_rate="stagnant",
        notes="Industrial runoff pipe discharge creating brown foaming eddies in river eddy.",
        assessment_answers={"waterClarity": "very_cloudy", "noticeableOdor": "yes", "unusualColor": "yes", "wasteVisible": True, "flowRate": "low"},
        signal="investigate", confidence=0.93,
        ai_summary="Critical signal: unnatural chemical foam and heavy grey-brown discoloration indicating active point-source or stormwater discharge.",
        key_evidence=["Persistent chemical foam clusters on river surface", "Industrial grey-brown discoloration plume", "Proximity to active urban stormwater discharge points"],
        suggested_steps=["Notify regional EPA / DEP emergency response", "Deploy drone survey upstream along the river corridor"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 25, 7, 15, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Newtown Creek Industrial Zone",
        location_address="Newtown Creek, Greenpoint, Brooklyn, NY 11222",
        latitude=40.7260, longitude=-73.9440,
        image_url="https://images.unsplash.com/photo-1543076499-a2a9a2a0bcb8?auto=format&fit=crop&w=1200&q=80",
        water_appearance="discoloured", odour="sewage", waste_visible=True, flow_rate="stagnant",
        notes="Persistent rainbow iridescent petroleum sheen. Floating debris with oily coating. Heavy algal mat on surface.",
        assessment_answers={"waterClarity": "very_cloudy", "noticeableOdor": "yes", "unusualColor": "yes", "wasteVisible": True, "flowRate": "stagnant"},
        signal="investigate", confidence=0.98,
        ai_summary="Maximum contamination risk: confirmed petroleum-based surface slick with sewage odour. Immediate remediation required.",
        key_evidence=["Iridescent petroleum surface slick confirmed by visual spectral analysis", "Sewage odour indicating active CSO event", "Anaerobic conditions -- no surface oxygen exchange visible", "Dense floating solid waste accumulation"],
        suggested_steps=["File emergency CSO report with NYC DEP", "Deploy containment booms immediately", "Collect water sample for heavy metal and hydrocarbon panel", "Notify Newtown Creek Alliance field coordinator"],
        status="flagged",
        reviewer_notes="Confirmed CSO event in progress. NYC DEP notified. Emergency cleanup ordered.",
        reviewed_by="Dr. Elena Rostova (Senior Environmental Officer)",
        reviewed_at=datetime(2025, 4, 25, 14, 30, 0, tzinfo=timezone.utc),
        created_at=datetime(2025, 4, 25, 6, 0, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Gowanus Canal Outfall",
        location_address="Gowanus Canal, 3rd St Bridge, Brooklyn, NY 11215",
        latitude=40.6712, longitude=-73.9975,
        image_url="https://images.unsplash.com/photo-1623241899289-73b0ff72b5f4?auto=format&fit=crop&w=1200&q=80",
        water_appearance="discoloured", odour="chemical", waste_visible=True, flow_rate="stagnant",
        notes="Dark turquoise-black water with industrial discharge foam. Biologically dead zone indicators.",
        assessment_answers={"waterClarity": "very_cloudy", "noticeableOdor": "yes", "unusualColor": "yes", "wasteVisible": True, "flowRate": "stagnant"},
        signal="investigate", confidence=0.97,
        ai_summary="Superfund site contamination indicators: extreme turbidity, chemical foam, dark unnatural coloration, and complete absence of visible aquatic life.",
        key_evidence=["Extreme turbidity -- zero visibility at any depth", "Active industrial discharge foam accumulation", "Characteristic Gowanus black sediment disturbance", "No surface aquatic life detected"],
        suggested_steps=["EPA Superfund monitoring protocol triggered", "Cross-reference against Gowanus Cleanup Baseline Monitoring", "Alert Gowanus Canal Conservancy environmental response team"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 26, 9, 45, 0, tzinfo=timezone.utc),
    ),
    dict(
        site_name="Flushing Bay Inlet",
        location_address="Flushing Bay Marine Transfer Station, Queens, NY 11368",
        latitude=40.7776, longitude=-73.8479,
        image_url="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
        water_appearance="discoloured", odour="sewage", waste_visible=True, flow_rate="low",
        notes="Post-storm CSO discharge visible. Turbid brown water with floating plastics and foam bands.",
        assessment_answers={"waterClarity": "cloudy", "noticeableOdor": "yes", "unusualColor": "yes", "wasteVisible": True, "flowRate": "low"},
        signal="investigate", confidence=0.91,
        ai_summary="Combined sewer overflow event confirmed. High pathogen risk from raw sewage mixed with stormwater runoff into tidal bay inlet.",
        key_evidence=["Brown discoloration consistent with CSO event mixing", "Floating macro-plastic debris accumulation at inlet mouth", "Sewage odour at sampling point"],
        suggested_steps=["Issue public health advisory for recreational water contact", "Deploy tidal CSO monitoring buoy for 72-hour event tracking", "Notify NYC Parks Department"],
        status="pending",
        reviewer_notes=None, reviewed_by=None, reviewed_at=None,
        created_at=datetime(2025, 4, 26, 11, 0, 0, tzinfo=timezone.utc),
    ),
]


async def seed() -> None:
    async with SessionLocal() as session:
        result = await session.execute(select(Observation))
        existing = result.scalars().all()
        if existing:
            print(f"[INFO] Database already has {len(existing)} observations. Skipping seed.")
            return

    print(f"[SEED] Seeding {len(OBSERVATIONS)} observations...")

    async with SessionLocal() as session:
        for i, data in enumerate(OBSERVATIONS):
            obs = Observation(**data)
            session.add(obs)
            print(f"  [{i+1}/{len(OBSERVATIONS)}] {data['site_name']} ({data['signal'].upper()})")

        await session.commit()

    print("[DONE] Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
