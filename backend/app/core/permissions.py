# app/core/permissions.py
from enum import Enum
from app.models.workspace import WorkspaceRole


class Permission(str, Enum):
    # Workspace-level
    VIEW_WORKSPACE    = "view_workspace"
    MANAGE_WORKSPACE  = "manage_workspace"   # rename, update settings
    DELETE_WORKSPACE  = "delete_workspace"

    # Member management
    VIEW_MEMBERS      = "view_members"
    INVITE_MEMBERS    = "invite_members"
    REMOVE_MEMBERS    = "remove_members"
    CHANGE_ROLES      = "change_roles"

    # Tasks (used in Module 3)
    CREATE_TASK       = "create_task"
    EDIT_ANY_TASK     = "edit_any_task"
    DELETE_ANY_TASK   = "delete_any_task"
    VIEW_TASKS        = "view_tasks"


# Role → set of permissions
# This is the single source of truth for RBAC in the entire app
ROLE_PERMISSIONS: dict[WorkspaceRole, set[Permission]] = {
    WorkspaceRole.VIEWER: {
        Permission.VIEW_WORKSPACE,
        Permission.VIEW_MEMBERS,
        Permission.VIEW_TASKS,
    },
    WorkspaceRole.MEMBER: {
        Permission.VIEW_WORKSPACE,
        Permission.VIEW_MEMBERS,
        Permission.VIEW_TASKS,
        Permission.CREATE_TASK,
    },
    WorkspaceRole.ADMIN: {
        Permission.VIEW_WORKSPACE,
        Permission.MANAGE_WORKSPACE,
        Permission.VIEW_MEMBERS,
        Permission.INVITE_MEMBERS,
        Permission.REMOVE_MEMBERS,
        Permission.CHANGE_ROLES,
        Permission.VIEW_TASKS,
        Permission.CREATE_TASK,
        Permission.EDIT_ANY_TASK,
        Permission.DELETE_ANY_TASK,
    },
    WorkspaceRole.OWNER: {p for p in Permission},  # owner gets everything
}


def has_permission(role: WorkspaceRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())


def require_permission(role: WorkspaceRole, permission: Permission) -> None:
    """Raise an error if the role doesn't have the permission."""
    from fastapi import HTTPException, status
    if not has_permission(role, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role '{role}' does not have permission: {permission}",
        )