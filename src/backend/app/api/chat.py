from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.assessment import Assessment
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_assistant import query_gemini_assistant

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Chat endpoint for AlzDx AI Assistant.
    Loads the specified assessment from PostgreSQL, packages the linguistic biomarkers
    and prediction as context, and calls Google Gemini (gemini-2.5-flash).
    Does NOT rerun transcription or the DeBERTa model.
    """
    record = db.get(Assessment, request.assessment_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    reply = await query_gemini_assistant(record, request.message, request.history)

    return ChatResponse(reply=reply, assessment_id=record.id)
