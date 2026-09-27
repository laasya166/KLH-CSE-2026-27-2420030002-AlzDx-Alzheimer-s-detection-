import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "alzdx-secure-clinical-key-2026-auth-token")
ITERATIONS = 100_000

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a unique cryptographic salt."""
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored PBKDF2 salt$hash."""
    try:
        salt_hex, key_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, ITERATIONS)
        return hmac.compare_digest(expected_key, actual_key)
    except Exception:
        return False


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(user_id: str, username: str, expires_days: int = 7) -> str:
    """Generate a tamper-proof HMAC-SHA256 signed auth token with expiration."""
    exp = int(time.time()) + (expires_days * 86400)
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": exp,
        "iat": int(time.time()),
    }
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64encode(payload_json)

    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _b64encode(signature)

    return f"{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[dict]:
    """Verify signature and return token payload if valid and unexpired."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, sig_b64 = parts

        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256
        ).digest()
        actual_sig = _b64decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and validate the current authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token user identity.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency that returns current user if authenticated, else None."""
    if not credentials or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        return None

    try:
        user_uuid = uuid.UUID(payload["sub"])
        return db.query(User).filter(User.id == user_uuid).first()
    except Exception:
        return None
