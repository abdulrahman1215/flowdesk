import { Draggable } from "@hello-pangea/dnd";

const PRIORITY_STYLE = {
  urgent: "text-red-500",
  high:   "text-orange-400",
  medium: "text-yellow-400",
  low:    "text-blue-400",
  none:   "text-gray-300",
};

const PRIORITY_ICON = { urgent: "!!!", high: "!!", medium: "!", low: "↓", none: "–" };

export default function TaskCard({ task, index, workspaceId }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date()
                  && task.status !== "done";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card cursor-grab active:cursor-grabbing select-none
            ${snapshot.isDragging ? "shadow-lg rotate-1 opacity-90" : ""}
            ${overdue ? "border-l-2 border-l-red-400" : ""}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
              {task.title}
            </p>
            <span className={`text-xs font-bold shrink-0 ${PRIORITY_STYLE[task.priority]}`}
              title={task.priority}>
              {PRIORITY_ICON[task.priority]}
            </span>
          </div>

          {task.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.map(l => (
                <span key={l.id}
                  style={{ background: l.color + "22", color: l.color }}
                  className="text-xs px-1.5 py-0.5 rounded font-medium">
                  {l.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            {task.assignee ? (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600
                                text-xs flex items-center justify-center font-medium">
                  {task.assignee.username[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-400">{task.assignee.username}</span>
              </div>
            ) : <span />}
            {overdue && (
              <span className="text-xs text-red-400">overdue</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}