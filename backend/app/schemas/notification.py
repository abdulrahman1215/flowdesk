# app/schemas/notification.py
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    actor_id: uuid.UUID | None
    notification_type: NotificationType
    title: str
    message: str
    context: dict | None
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    unread_count: int


class MarkReadRequest(BaseModel):
    notification_ids: list[uuid.UUID]  # empty list = mark ALL as read