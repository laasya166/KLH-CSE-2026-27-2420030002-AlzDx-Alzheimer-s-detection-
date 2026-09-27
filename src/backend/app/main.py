from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, SessionLocal, engine, test_database_connection
from app.models.assessment import Assessment  # noqa: F401 - registers model metadata
from app.models.user import User  # noqa: F401 - registers model metadata
from app.api.assessment import router as assessment_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.predict import router as predict_router
from app.api.transcribe import router as transcribe_router
from app.services.auth import hash_password

app = FastAPI(
    title="AlzDx API",
    description="Backend API for the Alzheimer's Disease Detection System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(transcribe_router)
app.include_router(assessment_router)
app.include_router(chat_router)
app.include_router(auth_router)


@app.on_event("startup")
def create_database_tables():
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        if session.query(User).count() == 0:
            demo_users = [
                User(
                    username="doctor_smith",
                    hashed_password=hash_password("alzdx2026"),
                    email="sarah.smith@alzdx.org",
                    full_name="Dr. Sarah Smith",
                    role="Clinical Neurologist",
                ),
                User(
                    username="demo",
                    hashed_password=hash_password("demo1234"),
                    email="alex.morgan@example.com",
                    full_name="Alex Morgan",
                    role="Healthcare Specialist",
                ),
            ]
            session.add_all(demo_users)
            session.commit()
    except Exception as exc:
        session.rollback()
        print(f"Warning: Could not seed demo users: {exc}")
    finally:
        session.close()


@app.get("/")
def root():
    return {
        "message": "AlzDx API is running"
    }


@app.get("/health")
def health_check():
    try:
        test_database_connection()

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error),
        }
