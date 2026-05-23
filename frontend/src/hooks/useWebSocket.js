// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from "react";
import { useTaskStore } from "../store/taskStore";
import toast from "react-hot-toast";

const BASE_WS = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

export function useWebSocket(workspaceId) {
  const wsRef    = useRef(null);
  const pingRef  = useRef(null);
  const reconnectRef = useRef(0);

  const { addTask, updateTask, removeTask, applyMove } = useTaskStore();

  const connect = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !workspaceId) return;

    const ws = new WebSocket(`${BASE_WS}/ws/${workspaceId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectRef.current = 0;                  // reset backoff
      pingRef.current = setInterval(() => {
        ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      }, 25000);                                  // heartbeat every 25s
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        handleEvent(event);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = (e) => {
      clearInterval(pingRef.current);
      if (e.code === 4001) return;               // auth failure — don't reconnect
      if (e.code === 4003) return;               // not a member — don't reconnect

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * 2 ** reconnectRef.current, 30000);
      reconnectRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [workspaceId]);

  function handleEvent(event) {
    switch (event.type) {
      case "task.created":
        addTask(event.payload.task);
        break;
      case "task.updated":
        updateTask(event.payload.task_id, event.payload.changes);
        break;
      case "task.deleted":
        removeTask(event.payload.task_id);
        break;
      case "task.moved":
        applyMove(event.payload.task_id, event.payload.status, event.payload.position);
        break;
      case "comment.added":
        // Could update a comment count badge here
        break;
      case "user.joined":
        if (!event.payload.you) {
          toast(`${event.payload.username || "Someone"} joined`, { icon: "👋", duration: 2000 });
        }
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    connect();
    return () => {
      clearInterval(pingRef.current);
      wsRef.current?.close(1000, "component unmounted");
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}