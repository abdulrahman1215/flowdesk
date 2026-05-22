# app/models/notification.py
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum, JSON, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class NotificationType(str, PyEnum):
    TASK_ASSIGNED    = "task.assigned"      # someone assigned you a task
    TASK_COMMENTED   = "task.commented"     # someone commented on your task
    TASK_STATUS      = "task.status"        # a task you own changed status
    MEMBER_JOINED    = "member.joined"      # new member joined your workspace
    MENTION          = "mention"            # someone @mentioned you


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Who receives this notification
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Who triggered it (null = system notification)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType), nullable=False
    )
    # Human-readable text e.g. "Alice assigned you 'Fix login bug'"
    title:   Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)

    # Context data — flexible JSON for linking to the relevant resource
    # e.g. {"task_id": "...", "workspace_id": "...", "comment_id": "..."}
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])  # type: ignore
    actor:     Mapped["User | None"] = relationship("User", foreign_keys=[actor_id])  # type: ignore

    __table_args__ = (
        # Most common query: "all unread notifications for user X, newest first"
        Index("ix_notifications_recipient_read", "recipient_id", "is_read"),
        Index("ix_notifications_recipient_created", "recipient_id", "created_at"),
    )