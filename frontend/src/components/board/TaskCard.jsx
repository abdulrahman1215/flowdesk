import { Draggable } from "@hello-pangea/dnd";
import {
  CalendarDays,
  MessageSquare,
  Paperclip,
} from "lucide-react";

const PRIORITY_STYLE = {
  urgent:
    "bg-red-100 text-red-600 border border-red-200",
  high:
    "bg-orange-100 text-orange-600 border border-orange-200",
  medium:
    "bg-yellow-100 text-yellow-700 border border-yellow-200",
  low:
    "bg-blue-100 text-blue-600 border border-blue-200",
  none:
    "bg-slate-100 text-slate-500 border border-slate-200",
};

const PRIORITY_LABEL = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

export default function TaskCard({
  task,
  index,
  workspaceId,
}) {
  const overdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done";

  return (
    <Draggable
      draggableId={String(task.id)}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            group
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            transition-all
            duration-200
            cursor-grab
            active:cursor-grabbing
            hover:shadow-lg
            hover:-translate-y-1
            select-none

            ${
              snapshot.isDragging
                ? "rotate-1 shadow-2xl scale-[1.02]"
                : ""
            }

            ${
              overdue
                ? "border-l-4 border-l-red-500"
                : ""
            }
          `}
        >
          {/* Top */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800 leading-snug flex-1">
              {task.title}
            </h3>

            <span
              className={`
                px-2 py-1 rounded-full text-[10px]
                font-semibold whitespace-nowrap
                ${PRIORITY_STYLE[task.priority]}
              `}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="mt-2 text-xs text-slate-500 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Labels */}
          {task.labels?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.labels.map((label) => (
                <span
                  key={label.id}
                  style={{
                    background: `${label.color}15`,
                    color: label.color,
                    border: `1px solid ${label.color}30`,
                  }}
                  className="px-2 py-1 rounded-full text-[11px] font-medium"
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            {/* Assignee */}
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <div
                  className="
                    w-8 h-8 rounded-full
                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600
                    text-white text-xs
                    font-bold
                    flex items-center justify-center
                    shadow-sm
                  "
                >
                  {task.assignee.username[0].toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700">
                    {task.assignee.username}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    Assignee
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Unassigned
              </span>
            )}

            {/* Due Date */}
            {task.due_date && (
              <div
                className={`
                  flex items-center gap-1
                  text-[11px]
                  font-medium

                  ${
                    overdue
                      ? "text-red-500"
                      : "text-slate-500"
                  }
                `}
              >
                <CalendarDays size={13} />

                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Bottom Meta */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare size={14} />
                <span>{task.comments_count || 0}</span>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <Paperclip size={14} />
                <span>{task.attachments_count || 0}</span>
              </div>
            </div>

            {overdue && (
              <span className="text-[11px] font-semibold text-red-500">
                Overdue
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}