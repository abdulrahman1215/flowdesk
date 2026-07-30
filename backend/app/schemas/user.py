# app/schemas/user.py
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
import re

MAX_BCRYPT_PASSWORD_BYTES = 72


def validate_bcrypt_password(value: str) -> str:
    if len(value.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise ValueError("Password must be 72 bytes or fewer")
    return value


# ── Request schemas (what the client sends) ──────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr                    # Pydantic validates email format
    username: str
    full_name: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3–50 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return validate_bcrypt_password(v)

    @field_validator("full_name")
    @classmethod
    def full_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        return validate_bcrypt_password(v)


# ── Response schemas (what we send back) ────────────────────────────────────
# CRITICAL: password is never in a response schema

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}   # lets Pydantic read SQLAlchemy objects


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefreshRequest(BaseModel):
    refresh_token: str
