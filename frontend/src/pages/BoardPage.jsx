import { useEffect } from "react";
import { useParams } from "react-router-dom";

import {
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useTaskStore } from "../store/taskStore";

import { useWebSocket } from "../hooks/useWebSocket";

import KanbanBoard from "../components/board/KanbanBoard";

export default function BoardPage() {
  const { wsId } = useParams();

  const {
    fetchTasks,
    loading,
    board,
  } = useTaskStore();

  // Realtime WebSocket Connection
  const { isConnected } =
    useWebSocket(wsId);

  // Fetch Board Data
  useEffect(() => {
    if (wsId) {
      fetchTasks(wsId);
    }
  }, [wsId, fetchTasks]);

  // Count Tasks
  const totalTasks = Object.values(
    board || {}
  ).reduce(
    (acc, tasks) => acc + tasks.length,
    0
  );

  // Loading State
  if (loading) {
    return (
      <div
        className="
          flex h-[75vh]
          items-center justify-center
        "
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="
              flex h-20 w-20
              items-center justify-center
              rounded-3xl
              bg-white
              shadow-xl
              border border-slate-200
            "
          >
            <Loader2
              size={36}
              className="
                animate-spin
                text-cyan-500
              "
            />
          </div>

          <div className="text-center">
            <h2
              className="
                text-lg
                font-semibold
                text-slate-800
              "
            >
              Loading Board
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Fetching workspace tasks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="
          flex flex-col gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* Left */}
        <div>
          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-slate-800
            "
          >
            Project Board
          </h1>

          <p className="mt-1 text-slate-500">
            Manage tasks, collaborate with
            your team, and track progress in
            realtime.
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Realtime Status */}
          <div
            className={`
              flex items-center gap-2
              rounded-2xl
              border
              px-4 py-2.5
              text-sm font-medium
              shadow-sm

              ${
                isConnected
                  ? `
                    border-emerald-200
                    bg-emerald-50
                    text-emerald-600
                  `
                  : `
                    border-red-200
                    bg-red-50
                    text-red-500
                  `
              }
            `}
          >
            {isConnected ? (
              <Wifi size={16} />
            ) : (
              <WifiOff size={16} />
            )}

            {isConnected
              ? "Realtime Connected"
              : "Disconnected"}
          </div>

          {/* Task Counter */}
          <div
            className="
              rounded-2xl
              border border-slate-200
              bg-white
              px-5 py-2.5
              shadow-sm
            "
          >
            <p className="text-xs text-slate-400">
              Total Tasks
            </p>

            <h3
              className="
                text-lg
                font-bold
                text-slate-800
              "
            >
              {totalTasks}
            </h3>
          </div>
        </div>
      </div>

      {/* Board */}
      <div
        className="
          rounded-[30px]
          border border-slate-200
          bg-white/60
          backdrop-blur-xl
          p-5
          shadow-sm
        "
      >
        <KanbanBoard workspaceId={wsId} />
      </div>
    </div>
  );
}