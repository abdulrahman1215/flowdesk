# app/api/tasks.py
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.task import TaskStatus, TaskPriority
from app.schemas.task import (
    TaskCreateRequest, TaskUpdateRequest, TaskMoveRequest,
    TaskResponse, PaginatedTaskResponse, TaskFilterParams,
    CommentCreateRequest, CommentResponse, ActivityResponse,
    LabelCreate, LabelResponse,
)
from app.services.task_service import TaskService

router = APIRouter()


# ── Labels ────────────────────────────────────────────────────────────────────

@router.post("/{workspace_id}/labels", response_model=LabelResponse, status_code=201)
async def create_label(
    workspace_id: uuid.UUID, data: LabelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).create_label(workspace_id, data, current_user)


@router.get("/{workspace_id}/labels", response_model=list[LabelResponse])
async def list_labels(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).list_labels(workspace_id, current_user)


# ── Tasks ─────────────────────────────────────────────────────────────────────

@router.post("/{workspace_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    workspace_id: uuid.UUID, data: TaskCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).create_task(workspace_id, data, current_user)


@router.get("/{workspace_id}/tasks", response_model=PaginatedTaskResponse)
async def list_tasks(
    workspace_id: uuid.UUID,
    # Query params map directly to TaskFilterParams
    status: TaskStatus | None = Query(None),
    priority: TaskPriority | None = Query(None),
    assignee_id: uuid.UUID | None = Query(None),
    label_id: uuid.UUID | None = Query(None),
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = TaskFilterParams(
        status=status, priority=priority, assignee_id=assignee_id,
        label_id=label_id, search=search, page=page, page_size=page_size,
    )
    return await TaskService(db).list_tasks(workspace_id, filters, current_user)


@router.get("/{workspace_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    workspace_id: uuid.UUID, task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).get_task(workspace_id, task_id, current_user)


@router.patch("/{workspace_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    workspace_id: uuid.UUID, task_id: uuid.UUID, data: TaskUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).update_task(workspace_id, task_id, data, current_user)


@router.post("/{workspace_id}/tasks/{task_id}/move", response_model=TaskResponse)
async def move_task(
    workspace_id: uuid.UUID, task_id: uuid.UUID, data: TaskMoveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Drag-and-drop: move a task to a new status column and position."""
    return await TaskService(db).move_task(workspace_id, task_id, data, current_user)


@router.delete("/{workspace_id}/tasks/{task_id}", status_code=204)
async def delete_task(
    workspace_id: uuid.UUID, task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await TaskService(db).delete_task(workspace_id, task_id, current_user)


# ── Comments & Activity ───────────────────────────────────────────────────────

@router.post("/{workspace_id}/tasks/{task_id}/comments",
             response_model=CommentResponse, status_code=201)
async def add_comment(
    workspace_id: uuid.UUID, task_id: uuid.UUID, data: CommentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).add_comment(workspace_id, task_id, data, current_user)


@router.get("/{workspace_id}/tasks/{task_id}/comments",
            response_model=list[CommentResponse])
async def list_comments(
    workspace_id: uuid.UUID, task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).list_comments(workspace_id, task_id, current_user)


@router.get("/{workspace_id}/tasks/{task_id}/activity",
            response_model=list[ActivityResponse])
async def get_task_activity(
    workspace_id: uuid.UUID, task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService(db).get_activity(workspace_id, task_id, current_user)