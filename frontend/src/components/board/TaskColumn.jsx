import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { tasksApi } from "../../api/tasks";
import { useTaskStore } from "../../store/taskStore";
import TaskCard from "./TaskCard";
import toast from "react-hot-toast";

export default function TaskColumn({ column, tasks, workspaceId }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle]   = useState("");
  const { addTask } = useTaskStore();

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await tasksApi.create(workspaceId, {
        title, status: column.id,
      });
      addTask(data);
      setTitle("");
      setAdding(false);
    } catch {
      toast.error("Failed to create task");
    }
  };

  return (
    <div className="w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${column.color}`}>
            {column.label}
          </span>
          <span className="text-xs text-gray-400">{tasks.length}</span>
        </div>
        <button onClick={() => setAdding(a => !a)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none">+</button>
      </div>

      {/* Quick add form */}
      {adding && (
        <form onSubmit={quickAdd} className="card mb-2 space-y-2">
          <input className="input text-sm" autoFocus placeholder="Task title…"
            value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs py-1 px-3">Add</button>
            <button type="button" onClick={() => setAdding(false)}
              className="btn-secondary text-xs py-1 px-3">Cancel</button>
          </div>
        </form>
      )}

      {/* Droppable task list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-20 rounded-lg transition-colors space-y-2 p-1
              ${snapshot.isDraggingOver ? "bg-brand-50" : ""}`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index}
                workspaceId={workspaceId} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}