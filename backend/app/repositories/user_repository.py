# app/repositories/user_repository.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User


class UserRepository:
    """
    All database operations for the User model live here.
    The service layer never writes SQL — it calls these methods.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        email: str,
        username: str,
        full_name: str,
        hashed_password: str,
    ) -> User:
        user = User(
            email=email.lower(),
            username=username.lower(),
            full_name=full_name,
            hashed_password=hashed_password,
        )
        self.db.add(user)
        await self.db.flush()   # sends INSERT to DB but doesn't commit yet
        await self.db.refresh(user)  # loads generated fields (id, created_at)
        return user

    async def exists_by_email(self, email: str) -> bool:
        result = await self.db.execute(
            select(User.id).where(User.email == email.lower())
        )
        return result.scalar_one_or_none() is not None

    async def exists_by_username(self, username: str) -> bool:
        result = await self.db.execute(
            select(User.id).where(User.username == username.lower())
        )
        return result.scalar_one_or_none() is not None