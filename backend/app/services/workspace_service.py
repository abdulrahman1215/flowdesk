# app/services/workspace_service.py
import uuid
import secrets
import re
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.workspace_repository import WorkspaceRepository
from app.repositories.user_repository import UserRepository
from app.schemas.workspace import (
    WorkspaceCreateRequest, WorkspaceResponse, WorkspaceWithRoleResponse,
    MemberResponse, InviteMemberRequest, InvitationResponse, AcceptInvitationRequest,
)
from app.models.workspace import WorkspaceRole, InvitationStatus
from app.core.permissions import Permission, require_permission
from app.models.user import User


def _slugify(name: str) -> str:
    """Convert 'My Workspace' → 'my-workspace'"""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:100]


class WorkspaceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WorkspaceRepository(db)
        self.user_repo = UserRepository(db)

    # ── Workspace CRUD ────────────────────────────────────────────────────────

    async def create_workspace(self, data: WorkspaceCreateRequest,
                                current_user: User) -> WorkspaceResponse:
        # Generate a unique slug
        base_slug = _slugify(data.name)
        slug = base_slug
        counter = 1
        while await self.repo.slug_exists(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        workspace = await self.repo.create(
            name=data.name,
            slug=slug,
            owner_id=current_user.id,
            description=data.description,
        )
        # Creator automatically becomes OWNER member
        await self.repo.add_member(workspace.id, current_user.id, WorkspaceRole.OWNER)

        return WorkspaceResponse.model_validate(workspace)

    async def get_my_workspaces(self, current_user: User) -> list[WorkspaceWithRoleResponse]:
        rows = await self.repo.get_user_workspaces(current_user.id)
        result = []
        for workspace, role in rows:
            data = WorkspaceWithRoleResponse.model_validate(workspace)
            data.my_role = role
            result.append(data)
        return result

    async def _get_workspace_or_404(self, workspace_id: uuid.UUID) -> object:
        ws = await self.repo.get_by_id(workspace_id)
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return ws

    async def _get_member_or_403(self, workspace_id: uuid.UUID,
                                   user_id: uuid.UUID) -> object:
        """Get membership or raise 403 — user must be a member to do anything."""
        member = await self.repo.get_member(workspace_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this workspace",
            )
        return member

    # ── Member management ─────────────────────────────────────────────────────

    async def list_members(self, workspace_id: uuid.UUID,
                            current_user: User) -> list[MemberResponse]:
        await self._get_member_or_403(workspace_id, current_user.id)
        members = await self.repo.get_members_with_users(workspace_id)
        return [
            MemberResponse(
                id=m.id,
                user_id=m.user_id,
                username=m.user.username,
                full_name=m.user.full_name,
                email=m.user.email,
                role=m.role,
                joined_at=m.joined_at,
            )
            for m in members
        ]

    async def update_member_role(self, workspace_id: uuid.UUID, target_user_id: uuid.UUID,
                                  new_role: WorkspaceRole, current_user: User) -> MemberResponse:
        # 1. Check caller's permissions
        caller = await self._get_member_or_403(workspace_id, current_user.id)
        require_permission(caller.role, Permission.CHANGE_ROLES)

        # 2. Cannot demote yourself if you're the only owner
        if target_user_id == current_user.id and new_role != WorkspaceRole.OWNER:
            raise HTTPException(400, detail="You cannot change your own role")

        # 3. Cannot change the workspace owner's role
        workspace = await self._get_workspace_or_404(workspace_id)
        if workspace.owner_id == target_user_id:
            raise HTTPException(400, detail="Cannot change the workspace owner's role")

        target_member = await self._get_member_or_403(workspace_id, target_user_id)
        updated = await self.repo.update_member_role(target_member, new_role)

        return MemberResponse(
            id=updated.id,
            user_id=updated.user_id,
            username=updated.user.username,
            full_name=updated.user.full_name,
            email=updated.user.email,
            role=updated.role,
            joined_at=updated.joined_at,
        )

    async def remove_member(self, workspace_id: uuid.UUID, target_user_id: uuid.UUID,
                             current_user: User) -> None:
        caller = await self._get_member_or_403(workspace_id, current_user.id)

        # Users can always remove themselves (leave workspace)
        if target_user_id != current_user.id:
            require_permission(caller.role, Permission.REMOVE_MEMBERS)

        workspace = await self._get_workspace_or_404(workspace_id)
        if workspace.owner_id == target_user_id:
            raise HTTPException(400, detail="Cannot remove the workspace owner")

        target = await self._get_member_or_403(workspace_id, target_user_id)
        await self.repo.remove_member(target)

    # ── Invitations ───────────────────────────────────────────────────────────

    async def invite_member(self, workspace_id: uuid.UUID, data: InviteMemberRequest,
                             current_user: User) -> InvitationResponse:
        caller = await self._get_member_or_403(workspace_id, current_user.id)
        require_permission(caller.role, Permission.INVITE_MEMBERS)

        # Check they're not already a member
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            existing_member = await self.repo.get_member(workspace_id, existing_user.id)
            if existing_member:
                raise HTTPException(409, detail="This user is already a member")

        # Generate secure random token (64 hex chars = 256 bits of entropy)
        token = secrets.token_hex(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = await self.repo.create_invitation(
            workspace_id=workspace_id,
            email=data.email,
            role=data.role,
            token=token,
            expires_at=expires_at,
        )
        # In production: send email with link containing the token
        # e.g. https://flowdesk.app/invite/{token}
        return InvitationResponse.model_validate(invitation)

    async def accept_invitation(self, data: AcceptInvitationRequest,
                                 current_user: User) -> WorkspaceResponse:
        invitation = await self.repo.get_invitation_by_token(data.token)

        if not invitation:
            raise HTTPException(404, detail="Invitation not found")
        if invitation.status != InvitationStatus.PENDING:
            raise HTTPException(400, detail="Invitation has already been used or revoked")
        if invitation.expires_at < datetime.now(timezone.utc):
            invitation.status = InvitationStatus.EXPIRED
            raise HTTPException(400, detail="Invitation has expired")
        if invitation.email.lower() != current_user.email.lower():
            raise HTTPException(403, detail="This invitation was sent to a different email")

        # Add to workspace
        await self.repo.add_member(invitation.workspace_id, current_user.id, invitation.role)

        # Mark invitation as used
        invitation.status = InvitationStatus.ACCEPTED
        await self.db.flush()

        workspace = await self._get_workspace_or_404(invitation.workspace_id)
        return WorkspaceResponse.model_validate(workspace)