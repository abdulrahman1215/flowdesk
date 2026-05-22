# app/repositories/workspace_repository.py
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.workspace import Workspace, WorkspaceMember, Invitation, WorkspaceRole, InvitationStatus


class WorkspaceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Workspace ─────────────────────────────────────────────────────────────

    async def create(self, name: str, slug: str, owner_id: uuid.UUID,
                     description: str | None = None) -> Workspace:
        ws = Workspace(name=name, slug=slug, owner_id=owner_id, description=description)
        self.db.add(ws)
        await self.db.flush()
        await self.db.refresh(ws)
        return ws

    async def get_by_id(self, workspace_id: uuid.UUID) -> Workspace | None:
        result = await self.db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Workspace | None:
        result = await self.db.execute(
            select(Workspace).where(Workspace.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_user_workspaces(self, user_id: uuid.UUID) -> list[tuple[Workspace, WorkspaceRole]]:
        """Returns all workspaces a user belongs to, with their role in each."""
        result = await self.db.execute(
            select(Workspace, WorkspaceMember.role)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
        )
        return result.all()

    async def slug_exists(self, slug: str) -> bool:
        result = await self.db.execute(
            select(Workspace.id).where(Workspace.slug == slug)
        )
        return result.scalar_one_or_none() is not None

    # ── Members ───────────────────────────────────────────────────────────────

    async def add_member(self, workspace_id: uuid.UUID, user_id: uuid.UUID,
                         role: WorkspaceRole) -> WorkspaceMember:
        member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_member(self, workspace_id: uuid.UUID,
                         user_id: uuid.UUID) -> WorkspaceMember | None:
        result = await self.db.execute(
            select(WorkspaceMember).where(
                and_(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_members_with_users(self, workspace_id: uuid.UUID) -> list[WorkspaceMember]:
        """Load members WITH their user data in one query (avoids N+1)."""
        result = await self.db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .options(selectinload(WorkspaceMember.user))
        )
        return list(result.scalars().all())

    async def update_member_role(self, member: WorkspaceMember,
                                  role: WorkspaceRole) -> WorkspaceMember:
        member.role = role
        await self.db.flush()
        return member

    async def remove_member(self, member: WorkspaceMember) -> None:
        await self.db.delete(member)
        await self.db.flush()

    # ── Invitations ───────────────────────────────────────────────────────────

    async def create_invitation(self, workspace_id: uuid.UUID, email: str,
                                 role: WorkspaceRole, token: str,
                                 expires_at) -> Invitation:
        inv = Invitation(
            workspace_id=workspace_id, email=email,
            role=role, token=token, expires_at=expires_at,
        )
        self.db.add(inv)
        await self.db.flush()
        await self.db.refresh(inv)
        return inv

    async def get_invitation_by_token(self, token: str) -> Invitation | None:
        result = await self.db.execute(
            select(Invitation)
            .where(Invitation.token == token)
            .options(selectinload(Invitation.workspace))
        )
        return result.scalar_one_or_none()

    async def get_pending_invitations(self, workspace_id: uuid.UUID) -> list[Invitation]:
        result = await self.db.execute(
            select(Invitation).where(
                and_(
                    Invitation.workspace_id == workspace_id,
                    Invitation.status == InvitationStatus.PENDING,
                )
            )
        )
        return list(result.scalars().all())