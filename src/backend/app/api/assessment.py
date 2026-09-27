import asyncio
import os
import tempfile
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.transcribe import (
    SUPPORTED_EXTENSIONS,
    _transcribe_audio_file,
    calculate_linguistic_metrics,
)
from app.database.connection import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.assessment import (
    AssessmentAnalysisResponse,
    AssessmentDetail,
    AssessmentListItem,
)
from app.services.assessment import assessment_metrics, create_assessment
from app.services.auth import get_optional_current_user
from app.services.pdf_report import generate_alzdx_pdf_report
from app.services.predictor import predict_alzheimers
from app.services.transcription_cache import cache_transcription, get_cached_transcription

router = APIRouter(prefix="/api", tags=["assessments"])


def _audio_duration(path, raw_words):
    try:
        import av

        with av.open(path) as container:
            if container.duration is not None:
                return float(container.duration / av.time_base)
    except Exception:
        pass
    return max((float(word.get("end", 0)) for word in raw_words), default=0.0)


@router.post("/assessment/analyze", response_model=AssessmentAnalysisResponse)
async def analyze_assessment(
    file: UploadFile = File(...),
    transcript: str | None = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported audio file format.")

    temporary_path = None
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary_file:
            temporary_file.write(content)
            temporary_path = temporary_file.name

        if transcript and transcript.strip():
            cached_transcription = get_cached_transcription(content)
            if cached_transcription:
                transcription = cached_transcription
                transcription["text"] = transcript
            else:
                transcription = {
                    "text": transcript,
                    "segments": [],
                    "raw_words": [],
                    "metrics": calculate_linguistic_metrics(transcript, [], []),
                }
        else:
            try:
                transcription = await asyncio.to_thread(_transcribe_audio_file, temporary_path)
                cache_transcription(content, transcription)
            except ValueError as error:
                raise HTTPException(status_code=400, detail=f"Invalid audio: {error}") from error
            except Exception as error:
                raise HTTPException(status_code=500, detail="Audio transcription failed.") from error

        try:
            prediction = await asyncio.to_thread(predict_alzheimers, transcription["text"])
            if not isinstance(prediction, dict) or "prediction" not in prediction or "confidence" not in prediction:
                raise ValueError("Predictor returned an invalid response.")
            confidence = float(prediction["confidence"])
        except Exception as error:
            raise HTTPException(status_code=502, detail="Assessment prediction failed.") from error

        try:
            assessment = create_assessment(
                db,
                transcript=transcription["text"],
                raw_words=transcription["raw_words"],
                prediction=str(prediction["prediction"]),
                confidence=confidence,
                metrics=transcription["metrics"],
                audio_duration=_audio_duration(temporary_path, transcription["raw_words"]),
                user_id=current_user.id if current_user else None,
            )
        except SQLAlchemyError as error:
            raise HTTPException(status_code=503, detail="Assessment could not be saved to the database.") from error

        return {
            "assessment_id": assessment.id,
            "prediction": assessment.prediction,
            "confidence": assessment.confidence,
            "transcript": assessment.transcript,
            "metrics": assessment_metrics(assessment),
            "created_at": assessment.created_at,
        }
    finally:
        if temporary_path:
            try:
                os.remove(temporary_path)
            except OSError:
                pass
        await file.close()


@router.get("/assessments", response_model=list[AssessmentListItem])
def list_assessments(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Return only assessments belonging to the currently authenticated patient."""
    if current_user:
        return (
            db.query(Assessment)
            .filter(Assessment.user_id == current_user.id)
            .order_by(Assessment.created_at.desc())
            .all()
        )
    return []


def _get_assessment_or_404(db: Session, assessment_id: UUID):
    record = db.get(Assessment, assessment_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return record


@router.get("/assessments/{assessment_id}", response_model=AssessmentDetail)
def get_assessment(
    assessment_id: UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    record = _get_assessment_or_404(db, assessment_id)
    if current_user and record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this assessment.")

    return {
        "id": record.id,
        "user_id": record.user_id,
        "transcript": record.transcript,
        "raw_words": record.raw_words,
        "prediction": record.prediction,
        "confidence": record.confidence,
        "metrics": assessment_metrics(record),
        "audio_duration": record.audio_duration,
        "created_at": record.created_at,
    }


@router.get("/assessments/{assessment_id}/pdf")
def download_assessment_pdf(
    assessment_id: UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    record = _get_assessment_or_404(db, assessment_id)
    if current_user and record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this report.")

    pdf_bytes = generate_alzdx_pdf_report(record)
    filename = f"AlzDx_Report_{record.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/assessments/{assessment_id}", status_code=204)
def delete_assessment(
    assessment_id: UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    record = _get_assessment_or_404(db, assessment_id)
    if current_user and record.user_id and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this assessment.")

    try:
        db.delete(record)
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(status_code=503, detail="Assessment could not be deleted.") from error
