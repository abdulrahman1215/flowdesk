import { DragDropContext } from "@hello-pangea/dnd";
import { useTaskStore } from "../../store/taskStore";
import { tasksApi } from "../../api/tasks";
import TaskColumn from "./TaskColumn";
import toast from "react-hot-toast";

const COLUMNS = [
  { id: "backlog",     label: "Backlog",     color: "bg-gray-100 text-gray-600" },
  { id: "todo",        label: "To do",       color: "bg-blue-100 text-blue-700" },
  { id: "in_progress", label: "In progress", color: "bg-amber-100 text-amber-700" },
  { id: "in_review",   label: "In review",   color: "bg-purple-100 text-purple-700" },
  { id: "done",        label: "Done",        color: "bg-green-100 text-green-700" },
];

export default function KanbanBoard({ workspaceId }) {
  const { getBoard, applyMove } = useTaskStore();
  const board = getBoard();

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId &&
        source.index === destination.index) return;

    const newStatus   = destination.droppableId;
    const newPosition = destination.index;

    // Optimistic update — UI moves instantly, API call happens in background
    applyMove(draggableId, newStatus, newPosition);

    try {
      await tasksApi.move(workspaceId, draggableId, {
        status: newStatus, position: newPosition,
      });
    } catch {
      toast.error("Failed to move task");
      // In production: revert the optimistic update here
    }
  };

  return (
    <div className="p-4 overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map(col => (
            <TaskColumn
              key={col.id}
              column={col}
              tasks={board[col.id] || []}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}