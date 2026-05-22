# app/services/auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from jose import JWTError


class AuthService:
    """
    Business logic for authentication.
    Never talks to the DB directly — always goes through the repository.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def register(self, data: UserRegisterRequest) -> TokenResponse:
        # 1. Check uniqueness BEFORE hashing (fast fail)
        if await self.repo.exists_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        if await self.repo.exists_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already taken",
            )

        # 2. Hash password — NEVER store plain text
        hashed = hash_password(data.password)

        # 3. Create user in DB
        user = await self.repo.create(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=hashed,
        )

        # 4. Issue tokens immediately (no separate login step needed)
        return self._build_token_response(user)

    async def login(self, data: UserLoginRequest) -> TokenResponse:
        # 1. Find user by email
        user = await self.repo.get_by_email(data.email)

        # 2. Always verify password even if user not found (timing attack prevention)
        # If we return early on "user not found", attackers can probe which emails exist
        dummy_hash = "$2b$12$notarealhashbutlongenoughtopassthecheckXXXXXXXXXXXXXXXXX"
        password_ok = verify_password(
            data.password,
            user.hashed_password if user else dummy_hash
        )

        if not user or not password_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        return self._build_token_response(user)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise credentials_exception
            user_id = payload.get("sub")
        except JWTError:
            raise credentials_exception

        from uuid import UUID
        user = await self.repo.get_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise credentials_exception

        return self._build_token_response(user)

    def _build_token_response(self, user: User) -> TokenResponse:
        """Private helper — builds the token pair + user payload."""
        token_data = {"sub": str(user.id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=UserResponse.model_validate(user),
        )