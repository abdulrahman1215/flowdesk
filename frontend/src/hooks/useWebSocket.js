// src/hooks/useWebSocket.js

import {
  useEffect,
  useRef,
  useCallback,
} from "react";

import {
  Wifi,
  WifiOff,
} from "lucide-react";

import { useTaskStore } from "../store/taskStore";

import toast from "react-hot-toast";

const ENV_WS_URL =
  import.meta.env.VITE_WS_URL;

const BASE_WS =
  ENV_WS_URL !== undefined
    ? ENV_WS_URL.replace(/\/$/, "")
    : import.meta.env.PROD
      ? "wss://flowdesk-api-qmtl.onrender.com"
      : "ws://localhost:8000";

export function useWebSocket(workspaceId) {
  const wsRef = useRef(null);

  const pingRef = useRef(null);

  const reconnectTimeoutRef = useRef(null);

  const reconnectAttemptsRef = useRef(0);

  const mountedRef = useRef(false);

  const {
    addTask,
    updateTask,
    removeTask,
    applyMove,
  } = useTaskStore();

  // ==============================
  // Handle Incoming Events
  // ==============================

  const handleEvent = useCallback(
    (event) => {
      switch (event.type) {
        case "task.created":
          addTask(event.payload.task);

          toast.success("New task created", {
            icon: "✨",
          });

          break;

        case "task.updated":
          updateTask(
            event.payload.task_id,
            event.payload.changes
          );

          break;

        case "task.deleted":
          removeTask(event.payload.task_id);

          toast("Task deleted", {
            icon: "🗑️",
          });

          break;

        case "task.moved":
          applyMove(
            event.payload.task_id,
            event.payload.status,
            event.payload.position
          );

          break;

        case "comment.added":
          toast("New comment added", {
            icon: "💬",
          });

          break;

        case "user.joined":
          if (!event.payload.you) {
            toast(
              `${
                event.payload.username ||
                "Someone"
              } joined workspace`,
              {
                icon: "👋",
                duration: 2500,
              }
            );
          }

          break;

        case "user.left":
          toast(
            `${
              event.payload.username ||
              "Someone"
            } left workspace`,
            {
              icon: "👋",
              duration: 2500,
            }
          );

          break;

        default:
          break;
      }
    },
    [
      addTask,
      updateTask,
      removeTask,
      applyMove,
    ]
  );

  // ==============================
  // Connect WebSocket
  // ==============================

  const connect = useCallback(() => {
    const token =
      localStorage.getItem("access_token");

    if (!token || !workspaceId) return;

    const ws = new WebSocket(
      `${BASE_WS}/ws/${workspaceId}?token=${token}`
    );

    wsRef.current = ws;

    // ------------------------------
    // Connection Open
    // ------------------------------

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;

      toast.success("Realtime connected", {
        icon: "🟢",
        id: "ws-connected",
      });

      // Heartbeat Ping
      pingRef.current = setInterval(() => {
        if (
          ws.readyState === WebSocket.OPEN
        ) {
          ws.send(
            JSON.stringify({
              type: "ping",
              timestamp: Date.now(),
            })
          );
        }
      }, 25000);
    };

    // ------------------------------
    // Incoming Messages
    // ------------------------------

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);

        handleEvent(event);
      } catch (err) {
        console.error(
          "Invalid WebSocket message",
          err
        );
      }
    };

    // ------------------------------
    // Connection Close
    // ------------------------------

    ws.onclose = (e) => {
      clearInterval(pingRef.current);

      // Auth failure
      if (e.code === 4001) {
        toast.error(
          "Authentication failed"
        );

        return;
      }

      // Permission failure
      if (e.code === 4003) {
        toast.error(
          "You are not part of this workspace"
        );

        return;
      }

      // Avoid reconnect when component unmounts
      if (!mountedRef.current) return;

      toast.error(
        "Connection lost. Reconnecting..."
      );

      // Exponential Backoff
      const delay = Math.min(
        1000 *
          2 **
            reconnectAttemptsRef.current,
        30000
      );

      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current =
        setTimeout(() => {
          connect();
        }, delay);
    };

    // ------------------------------
    // Connection Error
    // ------------------------------

    ws.onerror = () => {
      ws.close();
    };
  }, [workspaceId, handleEvent]);

  // ==============================
  // Lifecycle
  // ==============================

  useEffect(() => {
    mountedRef.current = true;

    connect();

    return () => {
      mountedRef.current = false;

      clearInterval(pingRef.current);

      clearTimeout(
        reconnectTimeoutRef.current
      );

      wsRef.current?.close(
        1000,
        "component unmounted"
      );
    };
  }, [connect]);

  // ==============================
  // Send Message
  // ==============================

  const send = useCallback((data) => {
    if (
      wsRef.current?.readyState ===
      WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify(data)
      );
    } else {
      toast.error(
        "Connection unavailable"
      );
    }
  }, []);

  // ==============================
  // Connection Status
  // ==============================

  const isConnected =
    wsRef.current?.readyState ===
    WebSocket.OPEN;

  return {
    send,
    isConnected,
  };
}
