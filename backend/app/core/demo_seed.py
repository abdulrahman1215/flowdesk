from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, WorkspaceRole
from app.utils.security import hash_password


@dataclass(frozen=True)
class DemoAccount:
    role: WorkspaceRole
    email: str
    username: str
    full_name: str


@dataclass(frozen=True)
class DemoSeedResult:
    workspace_name: str
    workspace_slug: str
    password: str
    accounts: tuple[DemoAccount, ...]


DEMO_ACCOUNTS = (
    DemoAccount(
        role=WorkspaceRole.OWNER,
        email="flowdesk.owner@example.com",
        username="demo_owner",
        full_name="Demo Owner",
    ),
    DemoAccount(
        role=WorkspaceRole.ADMIN,
        email="flowdesk.admin@example.com",
        username="demo_admin",
        full_name="Demo Admin",
    ),
    DemoAccount(
        role=WorkspaceRole.MEMBER,
        email="flowdesk.member@example.com",
        username="demo_member",
        full_name="Demo Member",
    ),
    DemoAccount(
        role=WorkspaceRole.VIEWER,
        email="flowdesk.viewer@example.com",
        username="demo_viewer",
        full_name="Demo Viewer",
    ),
)


def validate_demo_password() -> None:
    if len(settings.DEMO_PASSWORD) < 8:
        raise ValueError("DEMO_PASSWORD must be at least 8 characters.")
    if len(settings.DEMO_PASSWORD.encode("utf-8")) > 72:
        raise ValueError("DEMO_PASSWORD must be 72 bytes or fewer.")


async def _get_or_create_user(
    db: AsyncSession,
    account: DemoAccount,
    hashed_password: str,
) -> User:
    result = await db.execute(
        select(User).where(User.email == account.email.lower())
    )
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=account.email.lower(),
            username=account.username,
            full_name=account.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
    else:
        user.username = account.username
        user.full_name = account.full_name
        user.hashed_password = hashed_password
        user.is_active = True
        user.is_verified = True

    await db.flush()
    return user


async def _get_or_create_workspace(db: AsyncSession, owner: User) -> Workspace:
    result = await db.execute(
        select(Workspace).where(Workspace.slug == settings.DEMO_WORKSPACE_SLUG)
    )
    workspace = result.scalar_one_or_none()

    if workspace is None:
        workspace = Workspace(
            name=settings.DEMO_WORKSPACE_NAME,
            slug=settings.DEMO_WORKSPACE_SLUG,
            description="Demo workspace with one account for each role.",
            owner_id=owner.id,
        )
        db.add(workspace)
    else:
        workspace.name = settings.DEMO_WORKSPACE_NAME
        workspace.description = "Demo workspace with one account for each role."
        workspace.owner_id = owner.id

    await db.flush()
    return workspace


async def _upsert_member(
    db: AsyncSession,
    workspace_id,
    user_id,
    role: WorkspaceRole,
) -> WorkspaceMember:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()

    if member is None:
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
        )
        db.add(member)
    else:
        member.role = role

    await db.flush()
    return member


async def seed_demo_users() -> DemoSeedResult:
    from app.core.database import AsyncSessionLocal

    validate_demo_password()
    hashed_password = hash_password(settings.DEMO_PASSWORD)
    users: dict[WorkspaceRole, User] = {}

    async with AsyncSessionLocal() as db:
        for account in DEMO_ACCOUNTS:
            user = await _get_or_create_user(db, account, hashed_password)
            users[account.role] = user

        workspace = await _get_or_create_workspace(db, users[WorkspaceRole.OWNER])

        for account in DEMO_ACCOUNTS:
            await _upsert_member(
                db,
                workspace.id,
                users[account.role].id,
                account.role,
            )

        await db.commit()

    return DemoSeedResult(
        workspace_name=settings.DEMO_WORKSPACE_NAME,
        workspace_slug=settings.DEMO_WORKSPACE_SLUG,
        password=settings.DEMO_PASSWORD,
        accounts=DEMO_ACCOUNTS,
    )


def format_demo_credentials(result: DemoSeedResult) -> str:
    lines = [
        "Demo users are ready.",
        f"Workspace: {result.workspace_name} ({result.workspace_slug})",
        f"Password: {result.password}",
    ]
    lines.extend(
        f"{account.role.value:>6}: {account.email}" for account in result.accounts
    )
    return "\n".join(lines)
