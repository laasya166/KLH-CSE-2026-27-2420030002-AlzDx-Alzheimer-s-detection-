from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserResponse,
    UserStatsResponse,
)
from app.services.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    clean_username = request.username.strip()
    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long.",
        )

    # Check if username exists
    existing = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )

    # Check if email exists if provided
    clean_email = request.email.strip() if request.email else None
    if clean_email:
        existing_email = db.query(User).filter(User.email.ilike(clean_email)).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered.",
            )

    hashed = hash_password(request.password)
    user = User(
        username=clean_username,
        hashed_password=hashed,
        email=clean_email,
        full_name=request.full_name.strip() if request.full_name else clean_username.title(),
        role=request.role or "Clinician",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=str(user.id), username=user.username)

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    clean_username = request.username.strip()
    user = db.query(User).filter(User.username.ilike(clean_username)).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_id=str(user.id), username=user.username)

    return AuthResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
    )


@router.put("/profile", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.full_name is not None:
        current_user.full_name = request.full_name.strip()

    if request.email is not None:
        clean_email = request.email.strip() or None
        if clean_email and clean_email.lower() != (current_user.email or "").lower():
            existing = db.query(User).filter(User.email.ilike(clean_email)).first()
            if existing and existing.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already in use.",
                )
        current_user.email = clean_email

    if request.new_password:
        if not request.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password.",
            )
        if not verify_password(request.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )
        if len(request.new_password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 4 characters.",
            )
        current_user.hashed_password = hash_password(request.new_password)

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
    )


@router.get("/profile/stats", response_model=UserStatsResponse)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_query = db.query(Assessment).filter(Assessment.user_id == current_user.id)
    total = user_query.count()
    latest = user_query.order_by(Assessment.created_at.desc()).first()

    return UserStatsResponse(
        total_assessments=total,
        last_assessment_date=latest.created_at if latest else None,
        last_prediction=latest.prediction if latest else None,
        last_confidence=round(latest.confidence, 1) if latest else None,
    )
