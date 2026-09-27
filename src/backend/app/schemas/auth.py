from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field("Clinician", max_length=50)


class LoginRequest(BaseModel):
    username: str = Field(...)
    password: str = Field(...)


class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class UserStatsResponse(BaseModel):
    total_assessments: int
    last_assessment_date: Optional[datetime] = None
    last_prediction: Optional[str] = None
    last_confidence: Optional[float] = None
