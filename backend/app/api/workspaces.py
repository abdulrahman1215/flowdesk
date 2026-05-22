# app/api/workspaces.py

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceRole
from app.schemas.workspace import (
    WorkspaceCreateRequest,
    WorkspaceResponse,
    WorkspaceWithRoleResponse,
    MemberResponse,
    UpdateMemberRoleRequest,
    InviteMemberRequest,
    InvitationResponse,
    AcceptInvitationRequest,
)
from app.services.workspace_service import WorkspaceService
from app.websockets.manager import manager

router = APIRouter()
@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=201,
)
async def create_workspace(
    data: WorkspaceCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WorkspaceService(db).create_workspace(
        data,
        current_user,
    )
@router.get(
    "",
    response_model=list[WorkspaceWithRoleResponse],
)
async def list_my_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all workspaces the current user belongs to."""
    return await WorkspaceService(db).get_my_workspaces(
        current_user,
    )
@router.get(
    "/{workspace_id}/members",
    response_model=list[MemberResponse],
)
async def list_members(
    workspace_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WorkspaceService(db).list_members(
        workspace_id, current_user,
    )
@router.patch(
    "/{workspace_id}/members/{user_id}/role",
    response_model=MemberResponse,
)
async def update_member_role(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    data: UpdateMemberRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WorkspaceService(db).update_member_role(
        workspace_id,  user_id, data.role, current_user,
    )
@router.delete(
    "/{workspace_id}/members/{user_id}",
    status_code=204,
)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await WorkspaceService(db).remove_member(
        workspace_id, user_id, current_user,
    )
@router.post(
    "/{workspace_id}/invitations",
    response_model=InvitationResponse,
    status_code=201,
)
async def invite_member(
    workspace_id: uuid.UUID,
    data: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WorkspaceService(db).invite_member(
        workspace_id, data, current_user,
    )
@router.post(
    "/invitations/accept",
    response_model=WorkspaceResponse,
)
async def accept_invitation(
    data: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WorkspaceService(db).accept_invitation(
        data,
        current_user,
    )
# 🔴 NEW PRESENCE ENDPOINT
@router.get("/{workspace_id}/presence")
async def get_presence(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    """
    Returns list of user IDs currently connected
    to this workspace via WebSocket.
    """
    online = manager.get_room_presence(
        str(workspace_id)
    )
    return {
        "workspace_id": str(workspace_id), "online_users": online,
    }