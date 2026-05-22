# app/schemas/workspace.py
import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator, EmailStr
import re
from app.models.workspace import WorkspaceRole, InvitationStatus


# ── Workspace ────────────────────────────────────────────────────────────────

class WorkspaceCreateRequest(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Workspace name must be 2–100 characters")
        return v


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    owner_id: uuid.UUID
    created_at: datetime
    model_config = {"from_attributes": True}


class WorkspaceWithRoleResponse(WorkspaceResponse):
    """Workspace + the current user's role in it."""
    my_role: WorkspaceRole


# ── Members ──────────────────────────────────────────────────────────────────

class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    full_name: str
    email: str
    role: WorkspaceRole
    joined_at: datetime
    model_config = {"from_attributes": True}


class UpdateMemberRoleRequest(BaseModel):
    role: WorkspaceRole


# ── Invitations ──────────────────────────────────────────────────────────────

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.MEMBER


class InvitationResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: WorkspaceRole
    status: InvitationStatus
    expires_at: datetime
    model_config = {"from_attributes": True}


class AcceptInvitationRequest(BaseModel):
    token: str