// src/store/taskStore.js
import { create } from "zustand";
import { tasksApi } from "../api/tasks";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"];

export const useTaskStore = create((set, get) => ({
  tasks: [],         // flat array
  loading: false,

  // Derived: group by status for the board
  getBoard: () => {
    const { tasks } = get();
    return STATUSES.reduce((acc, s) => ({
      ...acc,
      [s]: tasks.filter(t => t.status === s).sort((a, b) => a.position - b.position),
    }), {});
  },

  fetchTasks: async (workspaceId, params = {}) => {
    set({ loading: true });
    try {
      const { data } = await tasksApi.list(workspaceId, params);
      set({ tasks: data.items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTask: (task) =>
    set((s) => ({ tasks: [task, ...s.tasks] })),

  updateTask: (id, changes) =>
    set((s) => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...changes } : t),
    })),

  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) })),

  // Called when WebSocket sends task.moved
  applyMove: (taskId, newStatus, newPosition) =>
    set((s) => ({
      tasks: s.tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
      ),
    })),
}));