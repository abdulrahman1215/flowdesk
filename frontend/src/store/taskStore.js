// src/store/taskStore.js

import { create } from "zustand";

import { tasksApi } from "../api/tasks";

import toast from "react-hot-toast";

// ==========================================
// Task Statuses
// ==========================================

const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

// ==========================================
// Task Store
// ==========================================

export const useTaskStore = create(
  (set, get) => ({
    // ======================================
    // State
    // ======================================

    tasks: [],

    loading: false,

    selectedTask: null,

    filters: {
      search: "",
      priority: "all",
      assignee: "all",
    },

    // ======================================
    // Derived Board Data
    // ======================================

    getBoard: () => {
      const { tasks } = get();

      return STATUSES.reduce(
        (acc, status) => ({
          ...acc,

          [status]: tasks
            .filter(
              (task) =>
                task.status === status
            )
            .sort(
              (a, b) =>
                a.position -
                b.position
            ),
        }),
        {}
      );
    },

    // ======================================
    // Fetch Tasks
    // ======================================

    fetchTasks: async (
      workspaceId,
      params = {}
    ) => {
      try {
        set({ loading: true });

        const { data } =
          await tasksApi.list(
            workspaceId,
            params
          );

        set({
          tasks: data.items || [],
        });
      } catch (err) {
        console.error(err);

        toast.error(
          "Failed to load tasks"
        );
      } finally {
        set({ loading: false });
      }
    },

    // ======================================
    // Add Task
    // ======================================

    addTask: (task) => {
      set((state) => ({
        tasks: [
          task,
          ...state.tasks,
        ],
      }));

      toast.success(
        "Task added successfully"
      );
    },

    // ======================================
    // Update Task
    // ======================================

    updateTask: (
      id,
      changes
    ) => {
      set((state) => ({
        tasks: state.tasks.map(
          (task) =>
            task.id === id
              ? {
                  ...task,
                  ...changes,
                }
              : task
        ),
      }));
    },

    // ======================================
    // Remove Task
    // ======================================

    removeTask: (id) => {
      set((state) => ({
        tasks: state.tasks.filter(
          (task) => task.id !== id
        ),
      }));

      toast.success(
        "Task removed"
      );
    },

    // ======================================
    // Move Task (Drag & Drop)
    // ======================================

    applyMove: (
      taskId,
      newStatus,
      newPosition
    ) => {
      set((state) => ({
        tasks: state.tasks.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: newStatus,
                  position:
                    newPosition,
                }
              : task
        ),
      }));
    },

    // ======================================
    // Select Task
    // ======================================

    selectTask: (task) => {
      set({
        selectedTask: task,
      });
    },

    clearSelectedTask: () => {
      set({
        selectedTask: null,
      });
    },

    // ======================================
    // Filters
    // ======================================

    setFilters: (filters) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
      }));
    },

    clearFilters: () => {
      set({
        filters: {
          search: "",
          priority: "all",
          assignee: "all",
        },
      });
    },

    // ======================================
    // Search Tasks
    // ======================================

    getFilteredTasks: () => {
      const {
        tasks,
        filters,
      } = get();

      return tasks.filter(
        (task) => {
          const matchesSearch =
            task.title
              ?.toLowerCase()
              .includes(
                filters.search.toLowerCase()
              );

          const matchesPriority =
            filters.priority ===
              "all" ||
            task.priority ===
              filters.priority;

          const matchesAssignee =
            filters.assignee ===
              "all" ||
            task.assignee?.id ===
              filters.assignee;

          return (
            matchesSearch &&
            matchesPriority &&
            matchesAssignee
          );
        }
      );
    },

    // ======================================
    // Statistics
    // ======================================

    getStats: () => {
      const { tasks } = get();

      return {
        total: tasks.length,

        completed:
          tasks.filter(
            (t) => t.status === "done"
          ).length,

        inProgress:
          tasks.filter(
            (t) =>
              t.status ===
              "in_progress"
          ).length,

        overdue:
          tasks.filter(
            (t) =>
              t.due_date &&
              new Date(
                t.due_date
              ) < new Date() &&
              t.status !== "done"
          ).length,
      };
    },
  })
);