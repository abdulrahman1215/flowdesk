# app/models/task.py
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    String, Text, Integer, DateTime, ForeignKey,
    Enum, Table, Column, JSON, func, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TaskStatus(str, PyEnum):
    BACKLOG     = "backlog"
    TODO        = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW   = "in_review"
    DONE        = "done"
    CANCELLED   = "cancelled"


class TaskPriority(str, PyEnum):
    NONE   = "none"
    LOW    = "low"
    MEDIUM = "medium"
    HIGH   = "high"
    URGENT = "urgent"


class ActivityEventType(str, PyEnum):
    CREATED    = "created"
    UPDATED    = "updated"      # generic field change
    STATUS     = "status"       # status change (most common)
    ASSIGNED   = "assigned"
    UNASSIGNED = "unassigned"
    COMMENTED  = "commented"
    LABELED    = "labeled"
    UNLABELED  = "unlabeled"
    DELETED    = "deleted"


# Pure join table — no model class needed, just a Table object
task_labels = Table(
    "task_labels",
    Base.metadata,
    Column("task_id",  UUID(as_uuid=True), ForeignKey("tasks.id",  ondelete="CASCADE"), primary_key=True),
    Column("label_id", UUID(as_uuid=True), ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.TODO, nullable=False
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), default=TaskPriority.NONE, nullable=False
    )

    # Board position within a status column (for drag-and-drop ordering)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    creator:  Mapped["User"] = relationship("User", foreign_keys=[created_by])        # type: ignore
    assignee: Mapped["User | None"] = relationship("User", foreign_keys=[assignee_id]) # type: ignore
    labels:   Mapped[list["Label"]] = relationship("Label", secondary=task_labels, back_populates="tasks")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    activity: Mapped[list["TaskActivity"]] = relationship("TaskActivity", back_populates="task", cascade="all, delete-orphan")

    # Composite indexes for the queries we run most
    __table_args__ = (
        Index("ix_tasks_workspace_status", "workspace_id", "status"),
        Index("ix_tasks_workspace_assignee", "workspace_id", "assignee_id"),
        Index("ix_tasks_workspace_position", "workspace_id", "status", "position"),
    )

    def __repr__(self) -> str:
        return f"<Task {self.title[:30]}>"


class Label(Base):
    __tablename__ = "labels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name:  Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")  # hex color

    tasks: Mapped[list["Task"]] = relationship("Task", secondary=task_labels, back_populates="labels")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content:    Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    task:   Mapped["Task"] = relationship("Task", back_populates="comments")
    author: Mapped["User"] = relationship("User")  # type: ignore


class TaskActivity(Base):
    """Append-only audit log. Never updated, only inserted."""
    __tablename__ = "task_activity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id:  Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[ActivityEventType] = mapped_column(Enum(ActivityEventType), nullable=False)

    # Stores before/after for any field change — flexible JSON
    old_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task:  Mapped["Task"] = relationship("Task", back_populates="activity")
    actor: Mapped["User"] = relationship("User")  # type: ignore