# app/schemas/task.py
import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.task import TaskStatus, TaskPriority, ActivityEventType


# ── Labels ───────────────────────────────────────────────────────────────────

class LabelCreate(BaseModel):
    name: str
    color: str = "#6366f1"

    @field_validator("color")
    @classmethod
    def valid_hex(cls, v: str) -> str:
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("Color must be a 7-character hex like #6366f1")
        return v


class LabelResponse(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    model_config = {"from_attributes": True}


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskCreateRequest(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.NONE
    assignee_id: uuid.UUID | None = None
    label_ids: list[uuid.UUID] = []
    due_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 500:
            raise ValueError("Title too long (max 500 chars)")
        return v


class TaskUpdateRequest(BaseModel):
    """All fields optional — PATCH semantics."""
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: uuid.UUID | None = None
    label_ids: list[uuid.UUID] | None = None
    due_date: datetime | None = None
    position: int | None = None


class TaskMoveRequest(BaseModel):
    """Used for drag-and-drop reordering."""
    status: TaskStatus
    position: int


class AssigneeInfo(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str
    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    position: int
    due_date: datetime | None
    created_by: uuid.UUID
    assignee_id: uuid.UUID | None
    assignee: AssigneeInfo | None
    labels: list[LabelResponse]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Filtering & Pagination ────────────────────────────────────────────────────

class TaskFilterParams(BaseModel):
    """Query parameters for listing tasks."""
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: uuid.UUID | None = None
    label_id: uuid.UUID | None = None
    search: str | None = None       # searches title + description
    page: int = 1
    page_size: int = 50

    @field_validator("page_size")
    @classmethod
    def limit_page_size(cls, v: int) -> int:
        return min(v, 100)          # never allow more than 100 per page


class PaginatedTaskResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Comments ──────────────────────────────────────────────────────────────────

class CommentCreateRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment cannot be empty")
        return v


class CommentResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Activity ──────────────────────────────────────────────────────────────────

class ActivityResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    actor_id: uuid.UUID | None
    event_type: ActivityEventType
    old_value: dict | None
    new_value: dict | None
    created_at: datetime
    model_config = {"from_attributes": True}