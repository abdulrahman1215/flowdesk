import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTaskStore } from "../store/taskStore";
import { useWebSocket } from "../hooks/useWebSocket";
import KanbanBoard from "../components/board/KanbanBoard";

export default function BoardPage() {
  const { wsId } = useParams();
  const { fetchTasks, loading } = useTaskStore();
  useWebSocket(wsId);   // opens WS connection for this workspace

  useEffect(() => {
    if (wsId) fetchTasks(wsId);
  }, [wsId]);

  if (loading) return <div className="p-8 text-gray-400">Loading board…</div>;
  return <KanbanBoard workspaceId={wsId} />;
}