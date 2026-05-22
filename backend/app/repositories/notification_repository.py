# app/repositories/notification_repository.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_
from app.models.notification import Notification, NotificationType


class NotificationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        recipient_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        actor_id: uuid.UUID | None = None,
        context: dict | None = None,
    ) -> Notification:
        notif = Notification(
            recipient_id=recipient_id,
            actor_id=actor_id,
            notification_type=notification_type,
            title=title,
            message=message,
            context=context,
        )
        self.db.add(notif)
        await self.db.flush()
        await self.db.refresh(notif)
        return notif

    async def get_for_user(
        self,
        user_id: uuid.UUID,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        q = select(Notification).where(Notification.recipient_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read == False)  # noqa: E712
        q = q.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(
                    Notification.recipient_id == user_id,
                    Notification.is_read == False,  # noqa: E712
                )
            )
        )
        return result.scalar_one()

    async def mark_read(
        self, user_id: uuid.UUID, notification_ids: list[uuid.UUID] | None = None
    ) -> int:
        """
        Mark specific notifications as read, or ALL if notification_ids is None/empty.
        Returns the count of updated rows.
        """
        q = (
            update(Notification)
            .where(
                and_(
                    Notification.recipient_id == user_id,
                    Notification.is_read == False,  # noqa: E712
                )
            )
            .values(is_read=True)
        )
        if notification_ids:
            q = q.where(Notification.id.in_(notification_ids))

        result = await self.db.execute(q)
        await self.db.flush()
        return result.rowcount