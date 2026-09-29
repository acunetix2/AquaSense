"""
AquaSense AI Service – GROQ Vision
Performs real image-based environmental analysis using the GROQ API.
Every result also carries consistency flags (PRD FR-06/FR-07) and analysis
metadata so the frontend can render an auditable AI decision trail.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any

from groq import Groq

from app.core.config import get_settings
from app.services.consistency_service import check_consistency, image_quality_note

logger = logging.getLogger(__name__)

def _get_api_key() -> str:
    settings = get_settings()
    return settings.groq_api_key or os.getenv("GROQ_API_KEY", "")

_VISION_MODEL = "qwen/qwen3.8-27b"
_PROMPT_VERSION = "aquasense-vision-2026-09-v1"
_SAFETY_CLAIM_RE = re.compile(
    r"\b(safe|unsafe|drink|drinkable|potable|consumption|medical|diagnos(?:e|is)|health\s+(?:risk|hazard))\b",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# System prompt – defines AI persona and structured JSON output contract
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are AquaSense Vision, an expert environmental analyst specialising in 
freshwater and riverine ecosystems. Your role is to analyse photographs submitted by citizen 
scientists and provide a detailed, structured water-quality assessment.

You will respond ONLY with a single valid JSON object (no markdown fences, no extra text). 
The JSON must have exactly these keys:

{
  "signal": "normal" | "watch" | "investigate",
  "confidence": <float 0.0–1.0>,
  "title": "<8–12 word headline>",
  "summary": "<2–4 sentence plain-language assessment>",
  "visual_condition_score": <integer 0–100, where 100 means the image shows fewer visible concerns; this is NOT a water-quality or safety score>,
  "assessment_status": "assessed" | "needs_better_photo",
  "detected_issues": [<list of short strings, can be empty>],
  "key_evidence": [<3–6 factual observations from the image>],
  "suggested_steps": [<2–5 actionable recommendations>],
  "ecosystem_indicators": {
    "turbidity": "clear" | "slightly_cloudy" | "cloudy" | "very_cloudy",
    "algae_presence": "none" | "minimal" | "moderate" | "heavy",
    "waste_visible": true | false,
    "flow_condition": "healthy" | "low" | "stagnant" | "flooding",
    "bank_condition": "vegetated" | "eroded" | "degraded" | "healthy",
    "color_anomaly": "none" | "greenish" | "brownish" | "reddish" | "blackish" | "foamy"
  },
  "urgency": "routine" | "monitor" | "urgent" | "critical"
}

Signal definitions:
- "normal" = healthy baseline, no significant concerns
- "watch"  = one or more mild indicators worth monitoring
- "investigate" = multiple or severe indicators needing field inspection

If the image is too dark, blurred, obstructed, unrelated to a water body, or
otherwise insufficient, set "assessment_status" to "needs_better_photo",
set confidence to 0, and explain what photograph would help. Do not infer a
condition from an insufficient image.

Be honest and calibrated. If image quality is low, reduce confidence accordingly.
Always base evidence directly on what you can observe in the image.
Never state or imply that water is safe, unsafe, drinkable, potable, or suitable
for consumption. Do not make health or medical claims.
"""

_USER_PROMPT_TEMPLATE = """Please analyse this water body photograph for AquaSense citizen science monitoring.

Contextual details from the observer:
- Site name: {site_name}
- Water appearance (reported): {water_appearance}
- Odour reported: {odour}
- Waste visible (reported): {waste_visible}
- Flow rate (reported): {flow_rate}
- Observer notes: {notes}

Please conduct a thorough visual analysis and return the structured JSON assessment.
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _finish(
    result: dict[str, Any],
    *,
    source: str,
    model: str,
    image_count: int,
    water_appearance: str = "not specified",
    waste_visible: bool = False,
    flow_rate: str = "not specified",
    assessment_answers: dict | None = None,
    fallback_reason: str | None = None,
) -> dict[str, Any]:
    """
    Attach consistency flags and analysis metadata to an assessment result.

    - source "groq": compare the model's ecosystem indicators with the
      observer's questionnaire answers (PRD FR-07).
    - source "heuristic": surface an image-quality flag instead, because the
      vision model never actually saw the photo (PRD FR-06).
    """
    answers = assessment_answers or {}
    meta = {
        "source": source,
        # Vendor model ids (vendor/model-name) are internal — the decision
        # trail and API responses only ever surface a generic label.
        "model": "vision-model" if "/" in model else model,
        "prompt_version": _PROMPT_VERSION if source == "groq" else "n/a",
        "image_count": image_count,
        "assessment_status": result.get("assessment_status", "assessed"),
        "analysed_at": datetime.now(timezone.utc).isoformat(),
    }

    if source == "groq":
        flags = check_consistency(
            indicators=result.get("ecosystem_indicators", {}),
            water_appearance=water_appearance,
            unusual_color=answers.get("unusualColor"),
            waste_visible=waste_visible,
            flow_rate=flow_rate,
        )
    else:
        flags = [image_quality_note(fallback_reason or "vision model unavailable")]

    result["consistency_flags"] = flags
    result["analysis_meta"] = meta
    return result

async def analyze_image_with_groq(
    *,
    image_data: str,          # base64-encoded image string (with or without data URI prefix)
    image_mime: str = "image/jpeg",
    site_name: str = "Unknown site",
    water_appearance: str = "not specified",
    odour: str = "not specified",
    waste_visible: bool = False,
    flow_rate: str = "not specified",
    notes: str = "",
    assessment_answers: dict | None = None,
) -> dict[str, Any]:
    """
    Call GROQ vision with the provided image and observer metadata.
    Returns a structured assessment dict.
    On failure, returns a safe fallback dict.
    """
    return await analyze_multiple_images_with_groq(
        image_data_list=[image_data],
        image_mime=image_mime,
        site_name=site_name,
        water_appearance=water_appearance,
        odour=odour,
        waste_visible=waste_visible,
        flow_rate=flow_rate,
        notes=notes,
        assessment_answers=assessment_answers,
    )


async def analyze_multiple_images_with_groq(
    *,
    image_data_list: list[str],   # up to 3 base64-encoded images
    image_mime: str = "image/jpeg",
    site_name: str = "Unknown site",
    water_appearance: str = "not specified",
    odour: str = "not specified",
    waste_visible: bool = False,
    flow_rate: str = "not specified",
    notes: str = "",
    assessment_answers: dict | None = None,
) -> dict[str, Any]:
    """
    Call GROQ vision with up to 3 images for a more comprehensive assessment.
    All images are included in the same request as multiple image_url content parts.
    Returns a structured assessment dict with consistency flags and analysis metadata.
    On failure, returns a safe fallback dict.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("GROQ_API_KEY not set – returning heuristic fallback.")
        return _finish(
            _heuristic_fallback(waste_visible=waste_visible, notes=notes),
            source="heuristic",
            model="none",
            image_count=len(image_data_list),
            fallback_reason="vision model unavailable (no API key)",
        )

    # Normalise and validate all images
    cleaned_images: list[str] = []
    for img in image_data_list[:3]:  # hard cap at 3
        if not img:
            continue
        # Strip data-URI prefix if present
        if "," in img:
            img = img.split(",", 1)[1]
        try:
            base64.b64decode(img, validate=True)
            cleaned_images.append(img)
        except Exception:
            logger.warning("Skipping invalid base64 image in multi-image analysis.")

    if not cleaned_images:
        logger.error("No valid base64 images received.")
        return _finish(
            _heuristic_fallback(waste_visible=waste_visible, notes=notes),
            source="heuristic",
            model="none",
            image_count=0,
            fallback_reason="no readable photograph (invalid image data)",
        )

    count_label = f"{len(cleaned_images)} image{'s' if len(cleaned_images) > 1 else ''}"
    user_text = _USER_PROMPT_TEMPLATE.format(
        site_name=site_name,
        water_appearance=water_appearance,
        odour=odour,
        waste_visible="yes" if waste_visible else "no",
        flow_rate=flow_rate,
        notes=(notes or "None provided") + f"\n\n[{count_label} provided for analysis]",
    )

    client = Groq(api_key=api_key)

    # Build content list: image parts + text
    content: list[dict] = []
    for img in cleaned_images:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{image_mime};base64,{img}",
            },
        })
    content.append({"type": "text", "text": user_text})

    try:
        # The Groq SDK is synchronous. Offload it so one slow vision request
        # does not block other FastAPI requests on the event loop.
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=_VISION_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        import json
        result = json.loads(raw)
        return _finish(
            _normalise(result),
            source="groq",
            model=_VISION_MODEL,
            image_count=len(cleaned_images),
            water_appearance=water_appearance,
            waste_visible=waste_visible,
            flow_rate=flow_rate,
            assessment_answers=assessment_answers,
        )

    except Exception as exc:
        logger.error("GROQ multi-image analysis failed: %s", exc)
        return _finish(
            _heuristic_fallback(waste_visible=waste_visible, notes=notes),
            source="heuristic",
            model="none",
            image_count=len(cleaned_images),
            fallback_reason="vision model unavailable (analysis failed)",
        )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _clean_text(value: Any, default: str, *, max_length: int) -> str:
    """Constrain untrusted model text before it reaches a citizen-facing result."""
    if not isinstance(value, str):
        return default
    cleaned = " ".join(value.split())[:max_length]
    if not cleaned or _SAFETY_CLAIM_RE.search(cleaned):
        return default
    return cleaned


def _clean_text_list(value: Any, *, limit: int, fallback: list[str]) -> list[str]:
    if not isinstance(value, list):
        return fallback
    cleaned = [
        item
        for item in (_clean_text(entry, "", max_length=280) for entry in value[:limit])
        if item
    ]
    return cleaned or fallback


def _enum(value: Any, allowed: set[str], default: str) -> str:
    return value if isinstance(value, str) and value in allowed else default


def _normalise(data: dict) -> dict:
    """Validate and constrain a model response before exposing it to users."""
    signal = data.get("signal", "normal")
    if signal not in ("normal", "watch", "investigate"):
        signal = "normal"

    confidence = float(data.get("confidence", 0.75))
    confidence = max(0.0, min(1.0, confidence))

    try:
        visual_score = int(data.get("visual_condition_score", data.get("water_quality_score", 70)))
    except (TypeError, ValueError):
        visual_score = 70
    visual_score = max(0, min(100, visual_score))

    assessment_status = data.get("assessment_status", "assessed")
    if assessment_status not in ("assessed", "needs_better_photo"):
        assessment_status = "assessed"
    if assessment_status == "needs_better_photo":
        confidence = 0.0
        visual_score = 0

    eco = data.get("ecosystem_indicators", {})
    if not isinstance(eco, dict):
        eco = {}

    return {
        "signal": signal,
        "confidence": confidence,
        "title": _clean_text(data.get("title"), "Visual observation summary", max_length=120),
        "summary": _clean_text(
            data.get("summary"),
            "The image was assessed for visible environmental indicators only.",
            max_length=900,
        ),
        "visual_condition_score": visual_score,
        "assessment_status": assessment_status,
        "detected_issues": _clean_text_list(data.get("detected_issues"), limit=6, fallback=[]),
        "key_evidence": _clean_text_list(
            data.get("key_evidence"),
            limit=6,
            fallback=["No additional visual evidence could be confirmed."],
        ),
        "suggested_steps": _clean_text_list(
            data.get("suggested_steps"),
            limit=5,
            fallback=["Use this observation as a monitoring record, not a safety assessment."],
        ),
        "ecosystem_indicators": {
            "turbidity": _enum(
                eco.get("turbidity"),
                {"clear", "slightly_cloudy", "cloudy", "very_cloudy"},
                "clear",
            ),
            "algae_presence": _enum(
                eco.get("algae_presence"),
                {"none", "minimal", "moderate", "heavy"},
                "none",
            ),
            "waste_visible": bool(eco.get("waste_visible", False)),
            "flow_condition": _enum(
                eco.get("flow_condition"),
                {"healthy", "low", "stagnant", "flooding"},
                "healthy",
            ),
            "bank_condition": _enum(
                eco.get("bank_condition"),
                {"vegetated", "eroded", "degraded", "healthy"},
                "healthy",
            ),
            "color_anomaly": _enum(
                eco.get("color_anomaly"),
                {"none", "greenish", "brownish", "reddish", "blackish", "foamy"},
                "none",
            ),
        },
        "urgency": _enum(data.get("urgency"), {"routine", "monitor", "urgent", "critical"}, "routine"),
    }


def _heuristic_fallback(*, waste_visible: bool = False, notes: str = "") -> dict:
    """Returns a safe heuristic assessment when GROQ is unavailable."""
    signal = "watch" if waste_visible else "normal"
    confidence = 0.60 if waste_visible else 0.72
    issues = ["visible waste reported by observer"] if waste_visible else []

    return {
        "signal": signal,
        "confidence": confidence,
        "title": "Questionnaire-only preliminary record",
        "summary": (
            "AI image analysis is currently unavailable. This assessment is based on "
            "observer-reported data only. A field inspection is recommended to verify conditions."
        ),
        "visual_condition_score": 0,
        "assessment_status": "questionnaire_only",
        "detected_issues": issues,
        "key_evidence": [
            "Assessment derived from observer questionnaire responses.",
            f"Waste reported: {'yes' if waste_visible else 'no'}.",
            f"Notes: {notes}" if notes else "No additional notes.",
        ],
        "suggested_steps": [
            "Conduct a follow-up visual inspection at the site.",
            "Document any changes with updated photography.",
            "Submit to reviewer queue for human verification.",
        ],
        "ecosystem_indicators": {
            "turbidity": "clear",
            "algae_presence": "none",
            "waste_visible": waste_visible,
            "flow_condition": "healthy",
            "bank_condition": "healthy",
            "color_anomaly": "none",
        },
        "urgency": "monitor" if waste_visible else "routine",
    }
