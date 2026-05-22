# app/api/analytics.py
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import WorkspaceAnalytics
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/{workspace_id}/analytics", response_model=WorkspaceAnalytics)
async def get_workspace_analytics(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a full analytics snapshot for the workspace dashboard:
    - Task counts by status (for the status board summary)
    - Overdue count
    - Per-member productivity stats
    - Daily task creation + completion for the last 30 days (for the chart)
    """
    return await AnalyticsService(db).get_workspace_analytics(
        workspace_id, current_user
    )