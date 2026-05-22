# app/services/analytics_service.py
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.analytics import (
    WorkspaceAnalytics, TaskStatusCount, MemberStat, DailyActivityPoint
)
from app.models.user import User
from app.core.permissions import Permission, require_permission


class AnalyticsService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AnalyticsRepository(db)
        self.ws_repo = WorkspaceRepository(db)

    async def get_workspace_analytics(
        self, workspace_id: uuid.UUID, current_user: User
    ) -> WorkspaceAnalytics:
        # Auth check
        member = await self.ws_repo.get_member(workspace_id, current_user.id)
        if not member:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a workspace member")
        require_permission(member.role, Permission.VIEW_TASKS)

        # Run all queries — these could be parallelised with asyncio.gather
        # for production, but sequential is fine for a portfolio project
        by_status_rows  = await self.repo.task_counts_by_status(workspace_id)
        overdue         = await self.repo.overdue_count(workspace_id)
        member_rows     = await self.repo.member_stats(workspace_id)
        activity_rows   = await self.repo.daily_activity(workspace_id, days=30)

        total_tasks = sum(r["count"] for r in by_status_rows)

        return WorkspaceAnalytics(
            workspace_id=str(workspace_id),
            total_tasks=total_tasks,
            by_status=[TaskStatusCount(**r) for r in by_status_rows],
            overdue_count=overdue,
            member_stats=[MemberStat(**r) for r in member_rows],
            activity_last_30_days=[DailyActivityPoint(**r) for r in activity_rows],
        )