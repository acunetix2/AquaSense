from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.observation import Observation
from app.schemas.observation import (
    ObservationCreate,
    ObservationRead,
    ObservationReview,
    ObservationUpdate,
)
from app.services.ai_service import analyze_multiple_images_with_groq
from app.services.consistency_service import image_quality_note


class ObservationService:
    @staticmethod
    def _sanitize_external_image(value: str | None, *, max_length: int = 500) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        if not cleaned:
            return None

        if cleaned.startswith(("data:", "blob:")):
            return None

        if len(cleaned) > max_length:
            return None

        return cleaned

    @staticmethod
    def _sanitize_image_list(values: list[str] | None, *, max_length: int = 500) -> list[str]:
        if not values:
            return []

        cleaned: list[str] = []
        for value in values:
            sanitized = ObservationService._sanitize_external_image(value, max_length=max_length)
            if sanitized and sanitized not in cleaned:
                cleaned.append(sanitized)
        return cleaned[:3]

    @staticmethod
    async def create_observation(
        db: AsyncSession,
        payload: ObservationCreate,
    ) -> ObservationRead:
        """
        Create a new observation.
        If image_data or image_data_list is provided, runs GROQ vision analysis (up to 3 images).
        Otherwise uses pre-computed fields from payload.
        """
        # Resolve image list – prefer image_data_list, fall back to single image_data
        image_data_list: list[str] = []
        if payload.image_data_list:
            image_data_list = payload.image_data_list[:3]
        elif payload.image_data:
            image_data_list = [payload.image_data]

        answers = payload.assessment_answers or {}
        precomputed = answers.get("ai_result") if isinstance(answers, dict) else None

        # Strip vendor model ids from client-submitted Step4 meta before it
        # is stored and echoed back with the observation.
        if isinstance(precomputed, dict) and isinstance(precomputed.get("analysis_meta"), dict):
            submitted_meta = precomputed["analysis_meta"]
            if "/" in str(submitted_meta.get("model", "")):
                submitted_meta["model"] = "vision-model"

        consistency_flags: list[dict] = []
        analysis_meta: dict | None = None
        reused_step4_analysis = False

        if isinstance(precomputed, dict) and precomputed.get("signal") and "confidence" in precomputed:
            # Step 4 already analysed these photos in the browser session –
            # reuse that assessment instead of calling GROQ a second time.
            reused_step4_analysis = True
            signal = precomputed.get("signal", "normal")
            if signal not in ("normal", "watch", "investigate"):
                signal = "normal"
            confidence = float(precomputed.get("confidence", 0.7))
            ai_summary = precomputed.get("summary") or "Observation submitted."
            key_evidence = precomputed.get("key_evidence") or []
            suggested_steps = precomputed.get("suggested_steps") or []
            consistency_flags = list(precomputed.get("consistency_flags") or [])
            analysis_meta = precomputed.get("analysis_meta") or {
                "source": "step4_reuse",
                "model": "unknown",
                "prompt_version": "unknown",
                "image_count": len(image_data_list),
                "analysed_at": datetime.now(timezone.utc).isoformat(),
            }
            precomputed_urgency = precomputed.get("urgency", "routine")
        # Run real AI analysis if any images are attached
        elif image_data_list:
            assessment = await analyze_multiple_images_with_groq(
                image_data_list=image_data_list,
                image_mime=getattr(payload, "image_mime", "image/jpeg"),
                site_name=payload.site_name,
                water_appearance=payload.water_appearance or "not specified",
                odour=payload.odour or "not specified",
                waste_visible=payload.waste_visible,
                flow_rate=payload.flow_rate or "not specified",
                notes=payload.notes or "",
                assessment_answers=answers,
            )
            signal = assessment["signal"]
            confidence = assessment["confidence"]
            ai_summary = assessment["summary"]
            key_evidence = assessment["key_evidence"]
            suggested_steps = assessment["suggested_steps"]
            consistency_flags = list(assessment.get("consistency_flags") or [])
            analysis_meta = assessment.get("analysis_meta")
            precomputed_urgency = assessment.get("urgency", "routine")
        else:
            precomputed_urgency = "routine"
            # Check if caller already supplied pre-computed AI fields
            if payload.confidence > 0:
                signal = payload.signal
                confidence = payload.confidence
                ai_summary = payload.ai_summary or "Preliminary water body observation."
                key_evidence = payload.key_evidence or ["Field assessment parameters recorded."]
                suggested_steps = payload.suggested_steps or ["Routine monitoring."]
            else:
                # Heuristic assessment based on observer answers
                issues = 0
                evidence = []

                appearance = (payload.water_appearance or "").lower()
                if appearance in ("murky", "cloudy", "very cloudy", "very_cloudy", "oily", "discolored"):
                    issues += 1
                    evidence.append(f"Water appearance reported as {payload.water_appearance}.")

                odour = (payload.odour or "").lower()
                if odour in ("chemical", "sewage", "pungent", "rotten", "noticeable", "yes"):
                    issues += 1
                    evidence.append(f"Noticeable odour reported ({payload.odour}).")

                if payload.waste_visible:
                    issues += 1
                    evidence.append("Visible solid waste or litter detected.")

                flow = (payload.flow_rate or "").lower()
                if flow in ("stagnant", "flooding", "fast"):
                    issues += 1
                    evidence.append(f"Abnormal stream flow condition ({payload.flow_rate}).")

                answer_algae = answers.get("algae")
                if answer_algae:
                    issues += 1
                    evidence.append("Algae presence or bloom observed.")

                if issues >= 2:
                    signal = "investigate"
                    confidence = 0.85
                    ai_summary = "Multiple water quality anomalies observed requiring urgent investigation."
                    suggested_steps = [
                        "Dispatch certified field inspector for chemical testing",
                        "Alert regional watershed management authority",
                        "Log repeat photographic evidence within 24 hours",
                    ]
                elif issues == 1:
                    signal = "watch"
                    confidence = 0.75
                    ai_summary = "Mild visual anomaly noted. Recommend routine monitoring and follow-up."
                    suggested_steps = [
                        "Monitor site over the next 48-72 hours",
                        "Document stream conditions under different sunlight and flow conditions",
                    ]
                else:
                    signal = "normal"
                    confidence = 0.82
                    ai_summary = "Water conditions appear healthy with baseline clarity and no obvious pollutants."
                    evidence = ["Water body appears clear with no visible contaminants."]
                    suggested_steps = [
                        "Continue standard civic science monitoring schedule",
                        "Record seasonal baseline photographs",
                    ]
                key_evidence = evidence

            # No vision model ran – tell the reviewer exactly why (PRD FR-06).
            analysis_meta = {
                "source": "questionnaire",
                "model": "none",
                "prompt_version": "n/a",
                "image_count": 0,
                "analysed_at": datetime.now(timezone.utc).isoformat(),
            }
            consistency_flags = [
                image_quality_note(
                    "no photograph provided",
                    "No photograph was provided for this observation, so the "
                    "assessment is based on your questionnaire answers only.",
                )
            ]

        if analysis_meta is None:
            analysis_meta = {
                "source": "questionnaire",
                "model": "unknown",
                "prompt_version": "n/a",
                "image_count": len(image_data_list),
                "analysed_at": datetime.now(timezone.utc).isoformat(),
            }

        # A deliberately abstaining vision assessment must not become a
        # misleading map signal. The citizen can retake the photo and submit
        # once the image is suitable for analysis.
        if analysis_meta.get("assessment_status") == "needs_better_photo":
            raise ValueError("A clearer photo is required before this observation can be submitted.")

        # AI decision trail – auditable record of how the signal was produced
        # (Agents.md §5: log whenever AI output influences a signal).
        # Never store or expose vendor model ids in the trail — legacy
        # sessions or hand-crafted payloads may still carry them.
        trail_model = str(analysis_meta.get("model", "none"))
        if "/" in trail_model:
            trail_model = "vision-model"
        ai_trail = {
            "source": analysis_meta.get("source", "questionnaire"),
            "model": trail_model,
            "prompt_version": analysis_meta.get("prompt_version", "n/a"),
            "analysed_at": analysis_meta.get("analysed_at"),
            "image_count": analysis_meta.get("image_count", len(image_data_list)),
            "assessment_status": analysis_meta.get("assessment_status", "assessed"),
            "reused_step4_analysis": reused_step4_analysis,
            "inputs": {
                "site_name": payload.site_name,
                "water_appearance": payload.water_appearance,
                "odour": payload.odour,
                "waste_visible": payload.waste_visible,
                "flow_rate": payload.flow_rate,
            },
            "output": {
                "signal": signal,
                "confidence": round(float(confidence), 3),
                "urgency": precomputed_urgency,
            },
            "consistency_rule_hits": [f.get("field") for f in consistency_flags],
            "observer_consistency_response": {
                "action": (
                    "kept_reported_answers"
                    if bool(answers.get("consistency_acknowledged"))
                    else "not_recorded"
                ),
                "flagged_fields": [f.get("field") for f in consistency_flags if f.get("type") == "consistency"],
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            },
        }

        # Normalise image_urls: combine payload.image_urls and payload.image_url while rejecting raw data/blob payloads.
        image_urls = ObservationService._sanitize_image_list(payload.image_urls)
        primary_image = ObservationService._sanitize_external_image(payload.image_url)
        if primary_image:
            if primary_image not in image_urls:
                image_urls.insert(0, primary_image)
        image_urls = image_urls[:3]

        observation = Observation(
            site_name=payload.site_name,
            location_address=payload.location_address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            image_url=image_urls[0] if image_urls else None,
            image_urls=image_urls,
            water_appearance=payload.water_appearance,
            odour=payload.odour,
            waste_visible=payload.waste_visible,
            flow_rate=payload.flow_rate,
            notes=payload.notes,
            assessment_answers=payload.assessment_answers,
            signal=signal,
            confidence=float(confidence),
            ai_summary=ai_summary,
            key_evidence=key_evidence,
            suggested_steps=suggested_steps,
            consistency_flags=consistency_flags,
            ai_trail=ai_trail,
            status="pending",
            user_id=payload.user_id,
            observer_name=payload.observer_name,
            observer_email=payload.observer_email,
            observer_avatar=payload.observer_avatar,
            observer_location=payload.observer_location,
            observer_role=payload.observer_role,
        )

        db.add(observation)
        await db.commit()
        await db.refresh(observation)

        return ObservationRead.model_validate(observation)

    @staticmethod
    async def get_observation(db: AsyncSession, observation_id: UUID) -> Observation | None:
        """Fetch a single observation by primary key."""
        result = await db.execute(
            select(Observation).where(Observation.id == observation_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_observations(
        db: AsyncSession,
        *,
        signal: str | None = None,
        status: str | None = None,
        user_id: str | None = None,
        limit: int = 200,
        offset: int = 0,
    ) -> list[ObservationRead]:
        """
        Return observations ordered by most-recent first.
        Supports optional filtering by signal type, review status, and user_id.
        """
        query = select(Observation).order_by(Observation.created_at.desc())

        if signal:
            query = query.where(Observation.signal == signal)
        if status:
            query = query.where(Observation.status == status)
        if user_id:
            query = query.where(Observation.user_id == user_id)

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        observations = result.scalars().all()
        return [ObservationRead.model_validate(item) for item in observations]

    @staticmethod
    async def update_observation(
        db: AsyncSession,
        observation_id: UUID,
        updates: ObservationUpdate,
        requesting_user_id: str,
    ) -> ObservationRead | None:
        """
        Owner-only PATCH: update editable fields of an observation.
        Returns None if not found or requester is not the owner.
        """
        result = await db.execute(
            select(Observation).where(Observation.id == observation_id)
        )
        observation = result.scalar_one_or_none()
        if observation is None:
            return None

        # Ownership check – only the original submitter can edit
        if observation.user_id != requesting_user_id:
            raise PermissionError("Only the observation owner can edit it.")

        data = updates.model_dump(exclude_unset=True)

        # Handle image_urls merge
        if "image_urls" in data and data["image_urls"] is not None:
            merged = ObservationService._sanitize_image_list(list(data["image_urls"]))
            if merged:
                data["image_url"] = merged[0]
            else:
                data["image_url"] = None
            data["image_urls"] = merged

        if "image_url" in data:
            data["image_url"] = ObservationService._sanitize_external_image(data["image_url"])

        for field, value in data.items():
            setattr(observation, field, value)

        observation.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(observation)
        return ObservationRead.model_validate(observation)

    @staticmethod
    async def review_observation(
        db: AsyncSession,
        observation_id: UUID,
        review: ObservationReview,
        reviewer_user_id: str | None = None,
    ) -> ObservationRead | None:
        """
        Apply a reviewer decision (verified / flagged) to an observation.
        Returns the updated ObservationRead, or None if the observation was not found.
        """
        result = await db.execute(
            select(Observation).where(Observation.id == observation_id)
        )
        observation = result.scalar_one_or_none()
        if observation is None:
            return None

        observation.status = review.action
        observation.reviewer_notes = review.notes or None
        observation.reviewed_by = review.reviewer_name
        observation.reviewed_at = datetime.now(timezone.utc)

        # Preserve a review event in the AI decision trail. The latest review
        # fields above support the product UI; this history makes the human
        # decision traceable alongside the AI assessment for later evaluation.
        ai_trail = dict(observation.ai_trail or {})
        review_events = list(ai_trail.get("review_events") or [])
        review_events.append({
            "action": review.action,
            "ai_assessment_alignment": review.ai_assessment_alignment,
            "reviewer_name": review.reviewer_name,
            "reviewer_user_id": reviewer_user_id,
            "notes": review.notes or None,
            "reviewed_at": observation.reviewed_at.isoformat(),
            "ai_signal_at_review": observation.signal,
            "ai_source": ai_trail.get("source", "unknown"),
        })
        ai_trail["review_events"] = review_events
        observation.ai_trail = ai_trail

        await db.commit()
        await db.refresh(observation)
        read_result = ObservationRead.model_validate(observation)

        # Notify the owner of the review outcome (no self/ownerless notifications).
        from app.services.notification_service import NotificationService

        await NotificationService.notify(
            db,
            user_id=observation.user_id,
            type="review",
            title="Observation verified" if review.action == "verified" else "Observation flagged",
            body=(review.notes or None)
            or f"Your observation at {observation.site_name} was reviewed and marked {review.action}.",
            observation_id=observation.id,
            actor_id=reviewer_user_id,
            actor_name=review.reviewer_name,
        )
        return read_result

    @staticmethod
    async def delete_observation(db: AsyncSession, observation_id: UUID) -> bool:
        """Delete an observation by primary key."""
        result = await db.execute(
            select(Observation).where(Observation.id == observation_id)
        )
        observation = result.scalar_one_or_none()
        if observation is None:
            return False

        await db.delete(observation)
        await db.commit()
        return True

    @staticmethod
    async def get_analytics(db: AsyncSession) -> dict:
        """Compute live analytics in a single round trip (conditional aggregation).

        The remote database has high per-query latency, so all metrics are
        collected with one SELECT instead of one query per metric.
        """
        from sqlalchemy import func, distinct

        row = (
            await db.execute(
                select(
                    func.count(Observation.id).label("total"),
                    func.count(Observation.id)
                    .filter(Observation.status == "verified")
                    .label("verified"),
                    func.count(Observation.id)
                    .filter(Observation.status == "pending")
                    .label("pending"),
                    func.count(Observation.id)
                    .filter(Observation.status == "flagged")
                    .label("flagged"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "normal")
                    .label("normal"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "watch")
                    .label("watch"),
                    func.count(Observation.id)
                    .filter(Observation.signal == "investigate")
                    .label("investigate"),
                    func.count(distinct(Observation.user_id)).label("observers"),
                    func.count(distinct(Observation.site_name)).label("sites"),
                    func.avg(Observation.confidence).label("avg_conf"),
                    func.count(Observation.id)
                    .filter(Observation.waste_visible == True)  # noqa: E712
                    .label("waste"),
                )
            )
        ).one()

        total = int(row.total or 0)
        normal = int(row.normal or 0)

        return {
            "total_observations": total,
            "verified_count": int(row.verified or 0),
            "pending_count": int(row.pending or 0),
            "flagged_count": int(row.flagged or 0),
            "signals": {
                "normal": normal,
                "watch": int(row.watch or 0),
                "investigate": int(row.investigate or 0),
            },
            "active_observers": int(row.observers or 0),
            "monitored_sites": int(row.sites or 0),
            "average_confidence": round(float(row.avg_conf or 0.0), 2),
            "waste_reported_count": int(row.waste or 0),
            "water_health_index": round((normal / max(total, 1)) * 100, 1),
        }

