# app/services/task_service.py

import uuid
import math

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.task_repository import TaskRepository
from app.repositories.workspace_repository import WorkspaceRepository

from app.schemas.task import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskMoveRequest,
    TaskResponse,
    PaginatedTaskResponse,
    TaskFilterParams,
    CommentCreateRequest,
    CommentResponse,
    ActivityResponse,
    LabelCreate,
    LabelResponse,
)

from app.models.task import ActivityEventType
from app.models.user import User

# 🔴 NEW IMPORTS
from app.models.notification import NotificationType
from app.services.notification_service import NotificationService

from app.core.permissions import (
    Permission,
    require_permission,
)

# WebSocket imports
from app.websockets.manager import manager
from app.websockets.events import (
    task_created_event,
    task_updated_event,
    task_deleted_event,
    task_moved_event,
    comment_added_event,
)


class TaskService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TaskRepository(db)
        self.ws_repo = WorkspaceRepository(db)

    # ─────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────

    async def _get_member_role(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
    ):
        member = await self.ws_repo.get_member(
            workspace_id,
            user_id,
        )

        if not member:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Not a workspace member",
            )

        return member.role

    async def _get_task_or_404(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ):
        task = await self.repo.get_by_id(task_id)

        if not task or task.workspace_id != workspace_id:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Task not found",
            )

        return task

    # ─────────────────────────────────────────────────────────────
    # Labels
    # ─────────────────────────────────────────────────────────────

    async def create_label(
        self,
        workspace_id: uuid.UUID,
        data: LabelCreate,
        current_user: User,
    ) -> LabelResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.CREATE_TASK,
        )

        label = await self.repo.create_label(
            workspace_id,
            data.name,
            data.color,
        )

        return LabelResponse.model_validate(label)

    async def list_labels(
        self,
        workspace_id: uuid.UUID,
        current_user: User,
    ) -> list[LabelResponse]:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        labels = await self.repo.get_labels(workspace_id)

        return [
            LabelResponse.model_validate(l)
            for l in labels
        ]

    # ─────────────────────────────────────────────────────────────
    # Tasks
    # ─────────────────────────────────────────────────────────────

    async def create_task(
        self,
        workspace_id: uuid.UUID,
        data: TaskCreateRequest,
        current_user: User,
    ) -> TaskResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.CREATE_TASK,
        )

        # Validate assignee
        if data.assignee_id:

            assignee_member = await self.ws_repo.get_member(
                workspace_id,
                data.assignee_id,
            )

            if not assignee_member:
                raise HTTPException(
                    400,
                    "Assignee must be a workspace member",
                )

        # Validate labels
        labels = await self.repo.get_labels_by_ids(
            data.label_ids,
            workspace_id,
        )

        if len(labels) != len(data.label_ids):
            raise HTTPException(
                400,
                "One or more label IDs are invalid",
            )

        # Create task
        task = await self.repo.create(
            workspace_id=workspace_id,
            created_by=current_user.id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            assignee_id=data.assignee_id,
            due_date=data.due_date,
        )

        # Attach labels
        task.labels = labels
        await self.db.flush()

        # Activity log
        await self.repo.log_activity(
            task_id=task.id,
            actor_id=current_user.id,
            event_type=ActivityEventType.CREATED,
            new_value={
                "title": task.title,
                "status": task.status,
            },
        )

        response = TaskResponse.model_validate(task)

        # 🔴 Publish WebSocket event
        await manager.publish(
            str(workspace_id),
            task_created_event(
                workspace_id=str(workspace_id),
                task=response.model_dump(mode="json"),
                actor_id=str(current_user.id),
            ),
        )

        # 🔴 Notify assignee
        if (
            data.assignee_id
            and data.assignee_id != current_user.id
        ):

            notif_service = NotificationService(self.db)

            await notif_service.create_and_deliver(
                recipient_id=data.assignee_id,
                notification_type=NotificationType.TASK_ASSIGNED,
                title="New task assigned to you",
                message=(
                    f'{current_user.full_name} assigned you: '
                    f'"{task.title[:60]}"'
                ),
                actor_id=current_user.id,
                context={
                    "task_id": str(task.id),
                    "workspace_id": str(workspace_id),
                },
                workspace_id=str(workspace_id),
            )

        return response

    async def list_tasks(
        self,
        workspace_id: uuid.UUID,
        filters: TaskFilterParams,
        current_user: User,
    ) -> PaginatedTaskResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        tasks, total = await self.repo.list_with_filters(
            workspace_id,
            filters,
        )

        return PaginatedTaskResponse(
            items=[
                TaskResponse.model_validate(t)
                for t in tasks
            ],
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=(
                math.ceil(total / filters.page_size)
                if total else 0
            ),
        )

    async def get_task(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> TaskResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        task = await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        return TaskResponse.model_validate(task)

    async def update_task(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        data: TaskUpdateRequest,
        current_user: User,
    ) -> TaskResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        task = await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        is_creator = task.created_by == current_user.id

        if not is_creator:
            require_permission(
                role,
                Permission.EDIT_ANY_TASK,
            )

        changes = {}

        if (
            data.status is not None
            and data.status != task.status
        ):
            changes["status"] = {
                "old": task.status,
                "new": data.status,
            }

        if (
            data.assignee_id is not None
            and data.assignee_id != task.assignee_id
        ):

            if data.assignee_id:

                member = await self.ws_repo.get_member(
                    workspace_id,
                    data.assignee_id,
                )

                if not member:
                    raise HTTPException(
                        400,
                        "Assignee must be a workspace member",
                    )

            changes["assignee_id"] = {
                "old": str(task.assignee_id),
                "new": str(data.assignee_id),
            }

        update_fields = data.model_dump(
            exclude_none=True,
            exclude={"label_ids"},
        )

        task = await self.repo.update(
            task,
            **update_fields,
        )

        if data.label_ids is not None:

            labels = await self.repo.get_labels_by_ids(
                data.label_ids,
                workspace_id,
            )

            task.labels = labels
            await self.db.flush()

        for field, vals in changes.items():

            event = (
                ActivityEventType.STATUS
                if field == "status"
                else ActivityEventType.UPDATED
            )

            await self.repo.log_activity(
                task_id=task.id,
                actor_id=current_user.id,
                event_type=event,
                old_value={field: vals["old"]},
                new_value={field: vals["new"]},
            )

        response = TaskResponse.model_validate(task)

        if changes:

            await manager.publish(
                str(workspace_id),
                task_updated_event(
                    workspace_id=str(workspace_id),
                    task_id=str(task_id),
                    changes={
                        k: v["new"]
                        for k, v in changes.items()
                    },
                    actor_id=str(current_user.id),
                ),
            )

        return response

    async def move_task(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        data: TaskMoveRequest,
        current_user: User,
    ) -> TaskResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        task = await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        if task.created_by != current_user.id:
            require_permission(
                role,
                Permission.EDIT_ANY_TASK,
            )

        old_status = task.status

        await self.repo.reorder(
            workspace_id,
            task_id,
            data.status,
            data.position,
        )

        task = await self.repo.update(
            task,
            status=data.status,
            position=data.position,
        )

        if old_status != data.status:

            await self.repo.log_activity(
                task_id=task.id,
                actor_id=current_user.id,
                event_type=ActivityEventType.STATUS,
                old_value={"status": old_status},
                new_value={"status": data.status},
            )

        response = TaskResponse.model_validate(task)

        await manager.publish(
            str(workspace_id),
            task_moved_event(
                workspace_id=str(workspace_id),
                task_id=str(task_id),
                new_status=data.status,
                new_position=data.position,
                actor_id=str(current_user.id),
            ),
        )

        return response

    async def delete_task(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> None:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        task = await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        if task.created_by != current_user.id:
            require_permission(
                role,
                Permission.DELETE_ANY_TASK,
            )

        await self.repo.delete(task)

        await manager.publish(
            str(workspace_id),
            task_deleted_event(
                workspace_id=str(workspace_id),
                task_id=str(task_id),
                actor_id=str(current_user.id),
            ),
        )

    # ─────────────────────────────────────────────────────────────
    # Comments
    # ─────────────────────────────────────────────────────────────

    async def add_comment(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        data: CommentCreateRequest,
        current_user: User,
    ) -> CommentResponse:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        comment = await self.repo.create_comment(
            task_id,
            current_user.id,
            data.content,
        )

        await self.repo.log_activity(
            task_id=task_id,
            actor_id=current_user.id,
            event_type=ActivityEventType.COMMENTED,
            new_value={
                "content": data.content[:100]
            },
        )

        response = CommentResponse.model_validate(comment)

        # 🔴 Publish WebSocket event
        await manager.publish(
            str(workspace_id),
            comment_added_event(
                workspace_id=str(workspace_id),
                task_id=str(task_id),
                comment=response.model_dump(mode="json"),
                actor_id=str(current_user.id),
            ),
        )

        # 🔴 Notify task creator
        full_task = await self.repo.get_by_id(task_id)

        if (
            full_task
            and full_task.created_by != current_user.id
        ):

            notif_service = NotificationService(self.db)

            await notif_service.create_and_deliver(
                recipient_id=full_task.created_by,
                notification_type=NotificationType.TASK_COMMENTED,
                title="New comment on your task",
                message=(
                    f'{current_user.full_name} commented on '
                    f'"{full_task.title[:50]}"'
                ),
                actor_id=current_user.id,
                context={
                    "task_id": str(task_id),
                    "workspace_id": str(workspace_id),
                },
                workspace_id=str(workspace_id),
            )

        return response

    async def list_comments(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> list[CommentResponse]:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        comments = await self.repo.get_comments(task_id)

        return [
            CommentResponse.model_validate(c)
            for c in comments
        ]

    async def get_activity(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> list[ActivityResponse]:

        role = await self._get_member_role(
            workspace_id,
            current_user.id,
        )

        require_permission(
            role,
            Permission.VIEW_TASKS,
        )

        await self._get_task_or_404(
            task_id,
            workspace_id,
        )

        activity = await self.repo.get_activity(task_id)

        return [
            ActivityResponse.model_validate(a)
            for a in activity
        ]