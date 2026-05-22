# app/schemas/analytics.py
from pydantic import BaseModel


class TaskStatusCount(BaseModel):
    status: str
    count: int


class MemberStat(BaseModel):
    user_id: str
    username: str
    full_name: str
    assigned_count: int
    completed_count: int
    completion_rate: float          # 0.0 – 1.0


class DailyActivityPoint(BaseModel):
    date: str                       # "2025-01-15"
    created: int
    completed: int


class WorkspaceAnalytics(BaseModel):
    workspace_id: str
    total_tasks: int
    by_status: list[TaskStatusCount]
    overdue_count: int
    member_stats: list[MemberStat]
    activity_last_30_days: list[DailyActivityPoint]