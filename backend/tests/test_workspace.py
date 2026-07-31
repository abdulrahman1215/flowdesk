import asyncio
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

from app.models.workspace import Workspace, WorkspaceRole
from app.services.workspace_service import WorkspaceService


def test_get_my_workspaces_includes_current_user_role() -> None:
    user_id = uuid.uuid4()
    workspace = Workspace(
        id=uuid.uuid4(),
        name="Demo Workspace",
        slug="demo-workspace",
        description="Demo",
        owner_id=user_id,
        created_at=datetime.now(timezone.utc),
    )

    class FakeWorkspaceRepository:
        async def get_user_workspaces(self, requested_user_id):
            assert requested_user_id == user_id
            return [(workspace, WorkspaceRole.ADMIN)]

    service = WorkspaceService(db=None)
    service.repo = FakeWorkspaceRepository()

    result = asyncio.run(
        service.get_my_workspaces(
            SimpleNamespace(id=user_id)
        )
    )

    assert len(result) == 1
    assert result[0].slug == "demo-workspace"
    assert result[0].my_role == WorkspaceRole.ADMIN
