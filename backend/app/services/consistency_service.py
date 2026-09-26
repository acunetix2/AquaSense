"""
Consistency checks between citizen questionnaire answers and AI image findings.

Implements PRD FR-06 / FR-07 (MVP acceptance criterion: "the platform identifies
likely image-quality or consistency issues"). The AI never overrides the citizen:
mismatches are surfaced as calm, explainable flags and the observer keeps the
final say on what gets recorded.
"""

from __future__ import annotations

from typing import Any

# Observer-reported values that claim reasonably clear water.
_CLEAR_REPORTED = {"clear", "slightly cloudy", "slightly_cloudy"}
# Observer-reported values that claim reduced visibility.
_TURBID_REPORTED = {
    "turbid",
    "cloudy",
    "very cloudy",
    "very_cloudy",
    "murky",
    "brown muddy",
    "silty",
}
_FAST_FLOW_REPORTED = {"normal", "fast", "rapid"}
_LOW_FLOW_REPORTED = {"low", "slow"}
_STAGNANT_FLOW_REPORTED = {"stagnant"}

_TITLE_CASE_SEPARATORS = ("_", "-")


def _norm(value: Any) -> str:
    """Normalise a reported/observed value for comparison."""
    if value is None:
        return ""
    text = str(value).strip().lower()
    for sep in _TITLE_CASE_SEPARATORS:
        text = text.replace(sep, " ")
    return " ".join(text.split())


def _human(value: Any) -> str:
    """Render a value in plain language for user-facing copy."""
    normalised = _norm(value)
    return normalised if normalised else "not specified"


def _consistency_flag(
    *,
    field: str,
    reported: Any,
    observed: Any,
    message: str,
) -> dict[str, str]:
    return {
        "field": field,
        "type": "consistency",
        "reported": _human(reported),
        "observed": _human(observed),
        "message": message,
        "severity": "warning",
    }


def image_quality_note(reason: str, message: str | None = None) -> dict[str, str]:
    """
    Flag an image-quality / availability problem (PRD FR-06).

    Used when no photograph was provided or the vision model could not run,
    so the assessment rests on questionnaire answers alone.
    """
    return {
        "field": "image_analysis",
        "type": "image_quality",
        "reported": "",
        "observed": reason,
        "message": message
        or (
            "AI image analysis is not available for this observation, so the "
            "assessment is based on your questionnaire answers only. A field "
            "inspection is recommended to verify conditions."
        ),
        "severity": "info",
    }


def check_consistency(
    *,
    indicators: dict[str, Any],
    water_appearance: str | None = None,
    unusual_color: str | None = None,
    waste_visible: bool | None = None,
    flow_rate: str | None = None,
) -> list[dict[str, str]]:
    """
    Compare citizen-reported answers with the model's ecosystem indicators.

    Returns a list of explainable flags. Deliberately conservative: only clear
    mismatches are raised, and odour is excluded because the camera cannot smell.
    The observer always decides which answer stands (confirm or correct).
    """
    flags: list[dict[str, str]] = []
    if not indicators:
        return flags

    turbidity = _norm(indicators.get("turbidity"))
    color_anomaly = _norm(indicators.get("color_anomaly"))
    ai_waste = bool(indicators.get("waste_visible"))
    flow_condition = _norm(indicators.get("flow_condition"))

    # 1. Water clarity: reported transparency vs photo turbidity.
    if water_appearance is not None and turbidity:
        reported = _norm(water_appearance)
        if reported in _CLEAR_REPORTED and turbidity in {"cloudy", "very cloudy"}:
            flags.append(_consistency_flag(
                field="water_clarity",
                reported=water_appearance,
                observed=indicators.get("turbidity"),
                message=(
                    f"We noticed a possible inconsistency — you reported {reported} "
                    f"water, but the photo appears {turbidity}. Re-check the photo, "
                    "or confirm your answer if conditions have changed."
                ),
            ))
        elif reported in _TURBID_REPORTED and turbidity == "clear":
            flags.append(_consistency_flag(
                field="water_clarity",
                reported=water_appearance,
                observed=indicators.get("turbidity"),
                message=(
                    f"We noticed a possible inconsistency — you reported {reported} "
                    "water, but the photo looks clear. Re-check the photo, or "
                    "confirm your answer if you are certain."
                ),
            ))

    # 2. Unusual colour: observer said "no" but the photo shows an anomaly.
    if _norm(unusual_color) == "no" and color_anomaly and color_anomaly != "none":
        flags.append(_consistency_flag(
            field="unusual_color",
            reported=unusual_color,
            observed=indicators.get("color_anomaly"),
            message=(
                f"We noticed a possible inconsistency — you reported no unusual "
                f"colour, but the photo suggests a {color_anomaly} tint. Re-check "
                "the photo, or confirm your answer."
            ),
        ))

    # 3. Visible waste: observer said "no" but the photo shows waste.
    if waste_visible is False and ai_waste:
        flags.append(_consistency_flag(
            field="waste_visible",
            reported="no waste visible",
            observed="waste detected in photo",
            message=(
                "We noticed a possible inconsistency — you reported no visible "
                "waste, but the photo appears to show some. Re-check the photo, "
                "or confirm your answer."
            ),
        ))

    # 4. Flow rate: reported movement vs photo flow condition.
    if flow_rate is not None and flow_condition:
        reported_flow = _norm(flow_rate)
        if reported_flow in _FAST_FLOW_REPORTED and flow_condition == "stagnant":
            flags.append(_consistency_flag(
                field="flow_rate",
                reported=flow_rate,
                observed=indicators.get("flow_condition"),
                message=(
                    f"We noticed a possible inconsistency — you reported {reported_flow} "
                    "flow, but the photo looks stagnant. Re-check the photo, or "
                    "confirm your answer."
                ),
            ))
        elif (
            reported_flow in _STAGNANT_FLOW_REPORTED
            and flow_condition in {"healthy", "flooding"}
        ):
            flags.append(_consistency_flag(
                field="flow_rate",
                reported=flow_rate,
                observed=indicators.get("flow_condition"),
                message=(
                    f"We noticed a possible inconsistency — you reported {reported_flow} "
                    f"water, but the photo appears to have {flow_condition} flow. "
                    "Re-check the photo, or confirm your answer."
                ),
            ))
        elif reported_flow in _LOW_FLOW_REPORTED and flow_condition == "flooding":
            flags.append(_consistency_flag(
                field="flow_rate",
                reported=flow_rate,
                observed=indicators.get("flow_condition"),
                message=(
                    f"We noticed a possible inconsistency — you reported {reported_flow} "
                    f"flow, but the photo appears to be flooding. Re-check the photo, "
                    "or confirm your answer."
                ),
            ))

    return flags
