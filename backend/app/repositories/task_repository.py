# app/repositories/task_repository.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.orm import selectinload

from app.models.task import Task, Label, Comment, TaskActivity, task_labels, ActivityEventType, TaskStatus
from app.schemas.task import TaskFilterParams


class TaskRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Task CRUD ─────────────────────────────────────────────────────────────

    async def create(self, workspace_id: uuid.UUID, created_by: uuid.UUID,
                     title: str, **kwargs) -> Task:
        # Position = count of tasks in that status + 1 (goes to bottom of column)
        count_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.workspace_id == workspace_id,
                     Task.status == kwargs.get("status", TaskStatus.TODO))
            )
        )
        position = count_result.scalar_one()

        task = Task(
            workspace_id=workspace_id,
            created_by=created_by,
            position=position,
            title=title,
            **kwargs,
        )
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def get_by_id(self, task_id: uuid.UUID) -> Task | None:
        result = await self.db.execute(
            select(Task)
            .where(Task.id == task_id)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.labels),
                selectinload(Task.creator),
            )
        )
        return result.scalar_one_or_none()

    async def list_with_filters(
        self, workspace_id: uuid.UUID, filters: TaskFilterParams
    ) -> tuple[list[Task], int]:
        """Returns (tasks, total_count) — total_count for pagination metadata."""

        # Build the base query
        base = select(Task).where(Task.workspace_id == workspace_id)

        # Apply filters dynamically
        if filters.status:
            base = base.where(Task.status == filters.status)
        if filters.priority:
            base = base.where(Task.priority == filters.priority)
        if filters.assignee_id:
            base = base.where(Task.assignee_id == filters.assignee_id)
        if filters.label_id:
            # Semi-join: tasks that have this label
            base = base.where(
                Task.id.in_(
                    select(task_labels.c.task_id).where(
                        task_labels.c.label_id == filters.label_id
                    )
                )
            )
        if filters.search:
            term = f"%{filters.search}%"
            base = base.where(
                or_(
                    Task.title.ilike(term),
                    Task.description.ilike(term),
                )
            )

        # Count total (before pagination) for page metadata
        count_q = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        # Apply ordering + pagination
        offset = (filters.page - 1) * filters.page_size
        data_q = (
            base
            .order_by(Task.status, Task.position, Task.created_at.desc())
            .offset(offset)
            .limit(filters.page_size)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.labels),
            )
        )
        tasks = list((await self.db.execute(data_q)).scalars().all())
        return tasks, total

    async def update(self, task: Task, **fields) -> Task:
        for key, value in fields.items():
            if value is not None:
                setattr(task, key, value)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.flush()

    async def reorder(self, workspace_id: uuid.UUID, task_id: uuid.UUID,
                      new_status: TaskStatus, new_position: int) -> None:
        """
        Shift other tasks to make room for the moved task.
        Example: moving task to position 2 shifts tasks at 2,3,4... up by 1.
        """
        await self.db.execute(
            update(Task)
            .where(
                and_(
                    Task.workspace_id == workspace_id,
                    Task.status == new_status,
                    Task.position >= new_position,
                    Task.id != task_id,
                )
            )
            .values(position=Task.position + 1)
        )
        await self.db.flush()

    # ── Labels ────────────────────────────────────────────────────────────────

    async def create_label(self, workspace_id: uuid.UUID, name: str, color: str) -> Label:
        label = Label(workspace_id=workspace_id, name=name, color=color)
        self.db.add(label)
        await self.db.flush()
        await self.db.refresh(label)
        return label

    async def get_labels(self, workspace_id: uuid.UUID) -> list[Label]:
        result = await self.db.execute(
            select(Label).where(Label.workspace_id == workspace_id).order_by(Label.name)
        )
        return list(result.scalars().all())

    async def get_labels_by_ids(self, label_ids: list[uuid.UUID],
                                 workspace_id: uuid.UUID) -> list[Label]:
        if not label_ids:
            return []
        result = await self.db.execute(
            select(Label).where(
                and_(Label.id.in_(label_ids), Label.workspace_id == workspace_id)
            )
        )
        return list(result.scalars().all())

    # ── Comments ──────────────────────────────────────────────────────────────

    async def create_comment(self, task_id: uuid.UUID, author_id: uuid.UUID,
                              content: str) -> Comment:
        comment = Comment(task_id=task_id, author_id=author_id, content=content)
        self.db.add(comment)
        await self.db.flush()
        await self.db.refresh(comment)
        return comment

    async def get_comments(self, task_id: uuid.UUID) -> list[Comment]:
        result = await self.db.execute(
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.asc())
        )
        return list(result.scalars().all())

    # ── Activity log ──────────────────────────────────────────────────────────

    async def log_activity(self, task_id: uuid.UUID, actor_id: uuid.UUID,
                            event_type: ActivityEventType,
                            old_value: dict | None = None,
                            new_value: dict | None = None) -> TaskActivity:
        entry = TaskActivity(
            task_id=task_id,
            actor_id=actor_id,
            event_type=event_type,
            old_value=old_value,
            new_value=new_value,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_activity(self, task_id: uuid.UUID) -> list[TaskActivity]:
        result = await self.db.execute(
            select(TaskActivity)
            .where(TaskActivity.task_id == task_id)
            .order_by(TaskActivity.created_at.desc())
        )
        return list(result.scalars().all())