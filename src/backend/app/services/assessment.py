from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session

from app.models.assessment import Assessment


METRIC_FIELDS = (
    "speech_rate",
    "pause_count",
    "total_pause_seconds",
    "average_pause_seconds",
    "hesitation_count",
    "repetition_count",
    "segment_count",
)


def create_assessment(
    db: Session,
    *,
    transcript: str,
    raw_words: list,
    prediction: str,
    confidence: float,
    metrics: dict,
    audio_duration: float,
    user_id: Optional[UUID] = None,
):
    assessment = Assessment(
        user_id=user_id,
        transcript=transcript,
        raw_words=raw_words,
        prediction=prediction,
        confidence=confidence,
        audio_duration=audio_duration,
        **{field: metrics.get(field) for field in METRIC_FIELDS},
    )
    try:
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment
    except Exception:
        db.rollback()
        raise


def assessment_metrics(assessment):
    return {field: getattr(assessment, field) for field in METRIC_FIELDS}
