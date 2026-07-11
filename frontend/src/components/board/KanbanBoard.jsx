import { DragDropContext } from "@hello-pangea/dnd";
import { useTaskStore } from "../../store/taskStore";
import { tasksApi } from "../../api/tasks";
import TaskColumn from "./TaskColumn";
import toast from "react-hot-toast";
import {
  Layers3,
  ListTodo,
  Loader2,
  Eye,
  CheckCircle2,
} from "lucide-react";

const COLUMNS = [
  {
    id: "backlog",
    label: "Backlog",
    icon: Layers3,
    color:
      "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "todo",
    label: "To do",
    icon: ListTodo,
    color:
      "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "in_progress",
    label: "In progress",
    icon: Loader2,
    color:
      "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "in_review",
    label: "In review",
    icon: Eye,
    color:
      "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "done",
    label: "Done",
    icon: CheckCircle2,
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
];

export default function KanbanBoard({ workspaceId }) {
  const { getBoard, applyMove } = useTaskStore();

  const board = getBoard();

  const onDragEnd = async ({
    source,
    destination,
    draggableId,
  }) => {
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    // Optimistic UI update
    applyMove(draggableId, newStatus, newPosition);

    try {
      await tasksApi.move(workspaceId, draggableId, {
        status: newStatus,
        position: newPosition,
      });

      toast.success("Task updated");
    } catch (error) {
      console.error(error);

      toast.error("Failed to move task");
    }
  };

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 min-w-max pb-4">
          {COLUMNS.map((col) => {
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className="w-[340px] flex-shrink-0"
              >
                {/* Column Header */}
                <div
                  className={`
                    mb-3
                    rounded-2xl
                    border
                    px-4
                    py-3
                    shadow-sm
                    backdrop-blur
                    ${col.color}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white/70 p-2 shadow-sm">
                        <Icon size={18} />
                      </div>

                      <div>
                        <h2 className="font-semibold text-sm">
                          {col.label}
                        </h2>

                        <p className="text-xs opacity-70">
                          {board[col.id]?.length || 0} tasks
                        </p>
                      </div>
                    </div>

                    <div className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium shadow-sm">
                      {board[col.id]?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Column Body */}
                <TaskColumn
                  column={col}
                  tasks={board[col.id] || []}
                  workspaceId={workspaceId}
                />
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}