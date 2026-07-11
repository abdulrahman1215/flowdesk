import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import {
  Plus,
  X,
  Sparkles,
} from "lucide-react";

import { tasksApi } from "../../api/tasks";
import { useTaskStore } from "../../store/taskStore";
import TaskCard from "./TaskCard";

import toast from "react-hot-toast";

export default function TaskColumn({
  column,
  tasks,
  workspaceId,
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const { addTask } = useTaskStore();

  const quickAdd = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      const { data } = await tasksApi.create(
        workspaceId,
        {
          title,
          status: column.id,
        }
      );

      addTask(data);

      toast.success("Task created");

      setTitle("");
      setAdding(false);
    } catch (error) {
      console.error(error);

      toast.error("Failed to create task");
    }
  };

  return (
    <div
      className="
        w-[340px]
        shrink-0
        rounded-3xl
        bg-slate-50/80
        border border-slate-200
        backdrop-blur
        shadow-sm
        p-3
        flex flex-col
        max-h-[85vh]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div
            className={`
              px-3 py-1 rounded-full
              text-xs font-semibold
              border
              shadow-sm
              ${column.color}
            `}
          >
            {column.label}
          </div>

          <span
            className="
              text-xs
              font-medium
              text-slate-500
              bg-white
              px-2 py-1
              rounded-full
              border border-slate-200
            "
          >
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setAdding((a) => !a)}
          className="
            w-9 h-9
            rounded-xl
            flex items-center justify-center
            bg-white
            border border-slate-200
            text-slate-500
            hover:bg-slate-100
            hover:text-slate-800
            transition-all
            shadow-sm
          "
        >
          {adding ? (
            <X size={16} />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>

      {/* Quick Add */}
      {adding && (
        <form
          onSubmit={quickAdd}
          className="
            mb-4
            rounded-2xl
            bg-white
            border border-slate-200
            shadow-sm
            p-4
            space-y-3
            animate-in fade-in
          "
        >
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles size={16} />

            <span className="text-sm font-semibold">
              Create Task
            </span>
          </div>

          <input
            autoFocus
            placeholder="Enter task title..."
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="
              w-full
              rounded-xl
              border border-slate-200
              bg-slate-50
              px-4 py-3
              text-sm
              outline-none
              focus:ring-2
              focus:ring-cyan-500
              focus:border-transparent
              transition
            "
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="
                flex-1
                rounded-xl
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                px-4 py-2.5
                text-sm
                font-semibold
                text-white
                shadow-md
                hover:opacity-90
                transition
              "
            >
              Add Task
            </button>

            <button
              type="button"
              onClick={() =>
                setAdding(false)
              }
              className="
                rounded-xl
                border border-slate-200
                bg-white
                px-4 py-2.5
                text-sm
                font-medium
                text-slate-600
                hover:bg-slate-100
                transition
              "
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1
              overflow-y-auto
              rounded-2xl
              transition-all
              duration-200
              space-y-3
              p-1

              ${
                snapshot.isDraggingOver
                  ? `
                    bg-cyan-50
                    ring-2
                    ring-cyan-200
                  `
                  : ""
              }
            `}
          >
            {tasks.length === 0 && (
              <div
                className="
                  flex flex-col
                  items-center
                  justify-center
                  py-10
                  text-center
                  text-slate-400
                "
              >
                <div
                  className="
                    w-12 h-12
                    rounded-2xl
                    bg-white
                    border border-slate-200
                    flex items-center justify-center
                    mb-3
                  "
                >
                  <Plus size={18} />
                </div>

                <p className="text-sm font-medium">
                  No tasks yet
                </p>

                <p className="text-xs mt-1">
                  Drag tasks here or create a new one
                </p>
              </div>
            )}

            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                workspaceId={workspaceId}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}