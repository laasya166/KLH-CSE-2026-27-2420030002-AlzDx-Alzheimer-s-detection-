from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    assessment_id: UUID = Field(..., alias="assessmentId")
    message: str
    history: list[ChatMessageItem] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class ChatResponse(BaseModel):
    reply: str
    assessment_id: UUID

    model_config = ConfigDict(populate_by_name=True)
