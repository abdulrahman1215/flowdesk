# app/repositories/analytics_repository.py
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case, text
from app.models.task import Task, TaskStatus, TaskActivity, ActivityEventType
from app.models.workspace import WorkspaceMember
from app.models.user import User


class AnalyticsRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def task_counts_by_status(self, workspace_id: uuid.UUID) -> list[dict]:
        """
        SELECT status, COUNT(*) as count FROM tasks
        WHERE workspace_id = ? GROUP BY status
        """
        result = await self.db.execute(
            select(Task.status, func.count(Task.id).label("count"))
            .where(Task.workspace_id == workspace_id)
            .group_by(Task.status)
        )
        return [{"status": row.status, "count": row.count} for row in result.all()]

    async def overdue_count(self, workspace_id: uuid.UUID) -> int:
        """Tasks past due date that aren't done/cancelled."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.workspace_id == workspace_id,
                    Task.due_date < now,
                    Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
                )
            )
        )
        return result.scalar_one()

    async def member_stats(self, workspace_id: uuid.UUID) -> list[dict]:
        """
        For each member: how many tasks assigned, how many completed.
        Uses a single GROUP BY query — no Python loops needed.
        """
        result = await self.db.execute(
            select(
                User.id.label("user_id"),
                User.username,
                User.full_name,
                func.count(Task.id).label("assigned_count"),
                func.sum(
                    case(
                        (Task.status == TaskStatus.DONE, 1),
                        else_=0,
                    )
                ).label("completed_count"),
            )
            .select_from(WorkspaceMember)
            .join(User, User.id == WorkspaceMember.user_id)
            .outerjoin(
                Task,
                and_(
                    Task.assignee_id == User.id,
                    Task.workspace_id == workspace_id,
                ),
            )
            .where(WorkspaceMember.workspace_id == workspace_id)
            .group_by(User.id, User.username, User.full_name)
            .order_by(func.count(Task.id).desc())
        )

        rows = result.all()
        stats = []
        for row in rows:
            assigned = row.assigned_count or 0
            completed = int(row.completed_count or 0)
            stats.append({
                "user_id": str(row.user_id),
                "username": row.username,
                "full_name": row.full_name,
                "assigned_count": assigned,
                "completed_count": completed,
                "completion_rate": round(completed / assigned, 2) if assigned > 0 else 0.0,
            })
        return stats

    async def daily_activity(
        self, workspace_id: uuid.UUID, days: int = 30
    ) -> list[dict]:
        """
        Tasks created and completed per day for the last N days.
        Uses PostgreSQL DATE_TRUNC for grouping.
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)

        # Tasks created per day
        created_result = await self.db.execute(
            select(
                func.date_trunc("day", Task.created_at).label("day"),
                func.count(Task.id).label("created"),
            )
            .where(
                and_(
                    Task.workspace_id == workspace_id,
                    Task.created_at >= since,
                )
            )
            .group_by(text("day"))
            .order_by(text("day"))
        )
        created_by_day = {
            str(row.day.date()): row.created
            for row in created_result.all()
        }

        # Tasks completed per day (status changed to DONE)
        completed_result = await self.db.execute(
            select(
                func.date_trunc("day", TaskActivity.created_at).label("day"),
                func.count(TaskActivity.id).label("completed"),
            )
            .join(Task, Task.id == TaskActivity.task_id)
            .where(
                and_(
                    Task.workspace_id == workspace_id,
                    TaskActivity.event_type == ActivityEventType.STATUS,
                    TaskActivity.new_value["status"].astext == TaskStatus.DONE,
                    TaskActivity.created_at >= since,
                )
            )
            .group_by(text("day"))
            .order_by(text("day"))
        )
        completed_by_day = {
            str(row.day.date()): row.completed
            for row in completed_result.all()
        }

        # Merge: generate a row for every day in the range
        result = []
        for i in range(days):
            day = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).date()
            day_str = str(day)
            result.append({
                "date": day_str,
                "created": created_by_day.get(day_str, 0),
                "completed": completed_by_day.get(day_str, 0),
            })
        return result