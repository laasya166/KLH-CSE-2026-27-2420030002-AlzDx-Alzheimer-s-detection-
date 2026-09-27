import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    raw_words: Mapped[list] = mapped_column(JSONB, nullable=False)
    prediction: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    speech_rate: Mapped[float | None] = mapped_column(Float)
    pause_count: Mapped[int | None] = mapped_column(Integer)
    total_pause_seconds: Mapped[float | None] = mapped_column(Float)
    average_pause_seconds: Mapped[float | None] = mapped_column(Float)
    hesitation_count: Mapped[int | None] = mapped_column(Integer)
    repetition_count: Mapped[int | None] = mapped_column(Integer)
    segment_count: Mapped[int | None] = mapped_column(Integer)
    audio_duration: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
