from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AssessmentMetrics(BaseModel):
    speech_rate: float | None
    pause_count: int | None
    total_pause_seconds: float | None
    average_pause_seconds: float | None
    hesitation_count: int | None
    repetition_count: int | None
    segment_count: int | None


class AssessmentAnalysisResponse(BaseModel):
    assessment_id: UUID
    prediction: str
    confidence: float
    transcript: str
    metrics: AssessmentMetrics
    created_at: datetime


class AssessmentListItem(BaseModel):
    id: UUID
    prediction: str
    confidence: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentDetail(BaseModel):
    id: UUID
    user_id: UUID | None
    transcript: str
    raw_words: list[dict]
    prediction: str
    confidence: float
    metrics: AssessmentMetrics
    audio_duration: float | None
    created_at: datetime
