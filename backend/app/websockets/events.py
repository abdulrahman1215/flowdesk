# app/websockets/events.py
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Any
import uuid


class WSEventType(str, Enum):
    # Task events
    TASK_CREATED  = "task.created"
    TASK_UPDATED  = "task.updated"
    TASK_DELETED  = "task.deleted"
    TASK_MOVED    = "task.moved"
    TASK_ASSIGNED = "task.assigned"

    # Comment events
    COMMENT_ADDED = "comment.added"

    # Presence events
    USER_JOINED   = "user.joined"    # user opened the workspace
    USER_LEFT     = "user.left"      # user closed / disconnected
    USER_TYPING   = "user.typing"    # user is typing a comment

    # System
    ERROR         = "error"
    PING          = "ping"
    PONG          = "pong"


class WSEvent(BaseModel):
    """
    Every message sent over WebSocket uses this exact shape.
    Consistent structure means the frontend can handle all events
    with a single dispatcher function.
    """
    type: WSEventType
    workspace_id: str
    payload: dict[str, Any]
    actor_id: str | None = None
    timestamp: str = ""

    def model_post_init(self, __context: Any) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_json(self) -> str:
        return self.model_dump_json()

    @classmethod
    def from_json(cls, data: str) -> "WSEvent":
        return cls.model_validate_json(data)


# ── Factory helpers — consistent event creation ───────────────────────────────

def task_updated_event(workspace_id: str, task_id: str,
                        changes: dict, actor_id: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.TASK_UPDATED,
        workspace_id=workspace_id,
        actor_id=actor_id,
        payload={"task_id": task_id, "changes": changes},
    )


def task_created_event(workspace_id: str, task: dict, actor_id: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.TASK_CREATED,
        workspace_id=workspace_id,
        actor_id=actor_id,
        payload={"task": task},
    )


def task_deleted_event(workspace_id: str, task_id: str, actor_id: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.TASK_DELETED,
        workspace_id=workspace_id,
        actor_id=actor_id,
        payload={"task_id": task_id},
    )


def task_moved_event(workspace_id: str, task_id: str,
                      new_status: str, new_position: int, actor_id: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.TASK_MOVED,
        workspace_id=workspace_id,
        actor_id=actor_id,
        payload={"task_id": task_id, "status": new_status, "position": new_position},
    )


def comment_added_event(workspace_id: str, task_id: str,
                         comment: dict, actor_id: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.COMMENT_ADDED,
        workspace_id=workspace_id,
        actor_id=actor_id,
        payload={"task_id": task_id, "comment": comment},
    )


def user_joined_event(workspace_id: str, user_id: str, username: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.USER_JOINED,
        workspace_id=workspace_id,
        actor_id=user_id,
        payload={"user_id": user_id, "username": username},
    )


def user_left_event(workspace_id: str, user_id: str, username: str) -> WSEvent:
    return WSEvent(
        type=WSEventType.USER_LEFT,
        workspace_id=workspace_id,
        actor_id=user_id,
        payload={"user_id": user_id, "username": username},
    )