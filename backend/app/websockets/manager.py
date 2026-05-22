# app/websockets/manager.py
import asyncio
import logging
from collections import defaultdict
from fastapi import WebSocket
import redis.asyncio as aioredis

from app.websockets.events import WSEvent, WSEventType
from app.core.redis import get_redis, workspace_channel

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages all active WebSocket connections on THIS server instance.

    Structure:
        _rooms: { workspace_id: { user_id: [WebSocket, ...] } }

    One user can have multiple connections (multiple browser tabs).
    Redis Pub/Sub bridges between multiple server instances.
    """

    def __init__(self):
        # workspace_id → user_id → list of WebSocket connections
        self._rooms: dict[str, dict[str, list[WebSocket]]] = defaultdict(
            lambda: defaultdict(list)
        )
        # Track active Redis subscriber tasks so we can cancel them
        self._subscriber_tasks: dict[str, asyncio.Task] = {}

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, workspace_id: str,
                      user_id: str) -> None:
        await websocket.accept()
        self._rooms[workspace_id][user_id].append(websocket)
        logger.info(f"WS connected: user={user_id} workspace={workspace_id}")

        # Start Redis subscriber for this workspace if not already running
        if workspace_id not in self._subscriber_tasks:
            task = asyncio.create_task(
                self._redis_subscriber(workspace_id)
            )
            self._subscriber_tasks[workspace_id] = task

    async def disconnect(self, websocket: WebSocket, workspace_id: str,
                          user_id: str) -> None:
        user_connections = self._rooms[workspace_id].get(user_id, [])
        if websocket in user_connections:
            user_connections.remove(websocket)

        # Clean up empty user entry
        if not user_connections:
            self._rooms[workspace_id].pop(user_id, None)

        # Clean up empty workspace — cancel the Redis subscriber
        if not self._rooms[workspace_id]:
            self._rooms.pop(workspace_id, None)
            task = self._subscriber_tasks.pop(workspace_id, None)
            if task:
                task.cancel()
                logger.info(f"Stopped Redis subscriber for workspace={workspace_id}")

        logger.info(f"WS disconnected: user={user_id} workspace={workspace_id}")

    # ── Sending messages ──────────────────────────────────────────────────────

    async def send_to_user(self, user_id: str, workspace_id: str,
                            event: WSEvent) -> None:
        """Send to all connections of a specific user in a workspace."""
        connections = self._rooms.get(workspace_id, {}).get(user_id, [])
        dead: list[WebSocket] = []
        for ws in connections:
            try:
                await ws.send_text(event.to_json())
            except Exception:
                dead.append(ws)
        for ws in dead:
            connections.remove(ws)

    async def broadcast_to_workspace(self, workspace_id: str,
                                      event: WSEvent,
                                      exclude_user_id: str | None = None) -> None:
        """
        Broadcast to every connected user in a workspace.
        exclude_user_id: skip the actor (they already know what they did).
        """
        user_map = self._rooms.get(workspace_id, {})
        dead_pairs: list[tuple[str, WebSocket]] = []

        for user_id, connections in user_map.items():
            if user_id == exclude_user_id:
                continue
            for ws in connections:
                try:
                    await ws.send_text(event.to_json())
                except Exception:
                    dead_pairs.append((user_id, ws))

        # Clean up broken connections
        for user_id, ws in dead_pairs:
            conns = self._rooms.get(workspace_id, {}).get(user_id, [])
            if ws in conns:
                conns.remove(ws)

    # ── Redis Pub/Sub ─────────────────────────────────────────────────────────

    async def publish(self, workspace_id: str, event: WSEvent) -> None:
        """
        Publish an event to Redis. Every server instance subscribed
        to this workspace channel will receive it and broadcast locally.
        """
        redis = await get_redis()
        channel = workspace_channel(workspace_id)
        await redis.publish(channel, event.to_json())

    async def _redis_subscriber(self, workspace_id: str) -> None:
        """
        Long-running async task. Subscribes to the Redis channel for a
        workspace and forwards every message to local WebSocket connections.
        Runs until the workspace has no more connected users.
        """
        redis = await get_redis()
        channel = workspace_channel(workspace_id)

        # Create a dedicated pubsub connection (separate from the pool)
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)
        logger.info(f"Redis subscriber started: channel={channel}")

        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    event = WSEvent.from_json(message["data"])
                    # Forward to all local connections for this workspace
                    await self.broadcast_to_workspace(
                        workspace_id,
                        event,
                        exclude_user_id=event.actor_id,
                    )
                except Exception as e:
                    logger.error(f"Error processing Redis message: {e}")
        except asyncio.CancelledError:
            logger.info(f"Redis subscriber cancelled: channel={channel}")
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()

    def get_room_presence(self, workspace_id: str) -> list[str]:
        """Returns list of user_ids currently connected to a workspace."""
        return list(self._rooms.get(workspace_id, {}).keys())

    def connection_count(self) -> int:
        total = 0
        for workspace in self._rooms.values():
            for connections in workspace.values():
                total += len(connections)
        return total


# Single shared instance — imported everywhere
manager = ConnectionManager()