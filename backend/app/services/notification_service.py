# app/services/notification_service.py
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import (
    NotificationResponse, UnreadCountResponse, MarkReadRequest
)
from app.models.notification import NotificationType
from app.models.user import User
from app.websockets.manager import manager
from app.websockets.events import WSEvent, WSEventType


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def create_and_deliver(
        self,
        recipient_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        actor_id: uuid.UUID | None = None,
        context: dict | None = None,
        workspace_id: str | None = None,
    ) -> NotificationResponse:
        """
        Create a notification in DB and push it to the user
        via WebSocket if they're currently connected.
        """
        notif = await self.repo.create(
            recipient_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            actor_id=actor_id,
            context=context,
        )

        # Real-time delivery — push to user's WebSocket if online
        if workspace_id:
            notif_response = NotificationResponse.model_validate(notif)
            await manager.send_to_user(
                user_id=str(recipient_id),
                workspace_id=workspace_id,
                event=WSEvent(
                    type=WSEventType.TASK_ASSIGNED,  # reuse event channel
                    workspace_id=workspace_id,
                    actor_id=str(actor_id) if actor_id else None,
                    payload={
                        "notification": notif_response.model_dump(mode="json")
                    },
                ),
            )

        return NotificationResponse.model_validate(notif)

    async def list_notifications(
        self,
        current_user: User,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> list[NotificationResponse]:
        offset = (page - 1) * page_size
        notifications = await self.repo.get_for_user(
            current_user.id,
            unread_only=unread_only,
            limit=page_size,
            offset=offset,
        )
        return [NotificationResponse.model_validate(n) for n in notifications]

    async def get_unread_count(self, current_user: User) -> UnreadCountResponse:
        count = await self.repo.get_unread_count(current_user.id)
        return UnreadCountResponse(unread_count=count)

    async def mark_read(
        self, data: MarkReadRequest, current_user: User
    ) -> dict:
        updated = await self.repo.mark_read(
            user_id=current_user.id,
            notification_ids=data.notification_ids if data.notification_ids else None,
        )
        return {"marked_read": updated}