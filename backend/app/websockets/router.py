# app/websockets/router.py
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from app.websockets.manager import manager
from app.websockets.events import (
    WSEvent, WSEventType,
    user_joined_event, user_left_event,
)
from app.utils.security import decode_token
from app.core.database import AsyncSessionLocal
from app.repositories.workspace_repository import WorkspaceRepository

logger = logging.getLogger(__name__)
router = APIRouter()


async def _authenticate_ws(token: str) -> dict | None:
    """
    WebSockets can't use HTTP headers the same way REST can.
    We accept the JWT as a query parameter on the WS upgrade request.
    Returns the decoded payload or None if invalid.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


@router.websocket("/ws/{workspace_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    workspace_id: str,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for real-time workspace collaboration.

    Connect: ws://localhost:8000/ws/{workspace_id}?token=<jwt>

    Client sends:  { "type": "ping" }
    Server sends:  { "type": "pong", ... }
    Server pushes: { "type": "task.updated", "payload": {...} }
    """
    # 1. Authenticate
    payload = await _authenticate_ws(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    user_id = payload.get("sub")

    # 2. Verify workspace membership
    async with AsyncSessionLocal() as db:
        ws_repo = WorkspaceRepository(db)
        from uuid import UUID
        try:
            member = await ws_repo.get_member(UUID(workspace_id), UUID(user_id))
        except Exception:
            member = None

    if not member:
        await websocket.close(code=4003, reason="Not a workspace member")
        return

    # 3. Connect
    await manager.connect(websocket, workspace_id, user_id)

    # 4. Announce presence to others in the room
    presence_event = user_joined_event(workspace_id, user_id, member.user.username
                                        if hasattr(member, 'user') and member.user else user_id)
    await manager.publish(workspace_id, presence_event)

    # 5. Send current room presence to the newly connected user
    online_users = manager.get_room_presence(workspace_id)
    await websocket.send_text(
        WSEvent(
            type=WSEventType.USER_JOINED,
            workspace_id=workspace_id,
            actor_id=user_id,
            payload={"online_users": online_users, "you": user_id},
        ).to_json()
    )

    # 6. Message loop — listen for client messages
    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
                msg_type = data.get("type")

                if msg_type == "ping":
                    # Heartbeat — keep connection alive
                    await websocket.send_text(
                        WSEvent(
                            type=WSEventType.PONG,
                            workspace_id=workspace_id,
                            payload={"timestamp": data.get("timestamp", "")},
                        ).to_json()
                    )

                elif msg_type == "user.typing":
                    # Broadcast typing indicator to others (no DB write needed)
                    typing_event = WSEvent(
                        type=WSEventType.USER_TYPING,
                        workspace_id=workspace_id,
                        actor_id=user_id,
                        payload=data.get("payload", {}),
                    )
                    await manager.publish(workspace_id, typing_event)

                else:
                    # Unknown message type — send error back to this client only
                    await websocket.send_text(
                        WSEvent(
                            type=WSEventType.ERROR,
                            workspace_id=workspace_id,
                            payload={"message": f"Unknown message type: {msg_type}"},
                        ).to_json()
                    )

            except json.JSONDecodeError:
                await websocket.send_text(
                    WSEvent(
                        type=WSEventType.ERROR,
                        workspace_id=workspace_id,
                        payload={"message": "Invalid JSON"},
                    ).to_json()
                )

    except WebSocketDisconnect:
        pass
    finally:
        # 7. Disconnect and announce departure
        await manager.disconnect(websocket, workspace_id, user_id)
        leave_event = user_left_event(workspace_id, user_id, user_id)
        await manager.publish(workspace_id, leave_event)
        logger.info(f"WS cleanup done: user={user_id} workspace={workspace_id}")