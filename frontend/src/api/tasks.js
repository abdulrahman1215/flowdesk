// src/api/tasks.js

import { api } from "./client";

// ==========================================
// Tasks API
// ==========================================

export const tasksApi = {
  // ========================================
  // Get Tasks
  // ========================================

  list: async (
    wsId,
    params = {}
  ) => {
    return await api.get(
      `/workspaces/${wsId}/tasks`,
      {
        params,
      }
    );
  },

  // ========================================
  // Create Task
  // ========================================

  create: async (
    wsId,
    data
  ) => {
    return await api.post(
      `/workspaces/${wsId}/tasks`,
      data
    );
  },

  // ========================================
  // Update Task
  // ========================================

  update: async (
    wsId,
    id,
    data
  ) => {
    return await api.patch(
      `/workspaces/${wsId}/tasks/${id}`,
      data
    );
  },

  // ========================================
  // Move Task
  // ========================================

  move: async (
    wsId,
    id,
    data
  ) => {
    return await api.post(
      `/workspaces/${wsId}/tasks/${id}/move`,
      data
    );
  },

  // ========================================
  // Delete Task
  // ========================================

  delete: async (
    wsId,
    id
  ) => {
    return await api.delete(
      `/workspaces/${wsId}/tasks/${id}`
    );
  },

  // ========================================
  // Comments
  // ========================================

  comment: async (
    wsId,
    id,
    data
  ) => {
    return await api.post(
      `/workspaces/${wsId}/tasks/${id}/comments`,
      data
    );
  },

  // ========================================
  // Get Task Comments
  // ========================================

  getComments: async (
    wsId,
    id
  ) => {
    return await api.get(
      `/workspaces/${wsId}/tasks/${id}/comments`
    );
  },

  // ========================================
  // Activity Logs
  // ========================================

  activity: async (
    wsId,
    id
  ) => {
    return await api.get(
      `/workspaces/${wsId}/tasks/${id}/activity`
    );
  },

  // ========================================
  // Assign Task
  // ========================================

  assign: async (
    wsId,
    id,
    userId
  ) => {
    return await api.patch(
      `/workspaces/${wsId}/tasks/${id}/assign`,
      {
        user_id: userId,
      }
    );
  },

  // ========================================
  // Upload Attachment
  // ========================================

  uploadAttachment: async (
    wsId,
    id,
    file
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    return await api.post(
      `/workspaces/${wsId}/tasks/${id}/attachments`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
  },

  // ========================================
  // Archive Task
  // ========================================

  archive: async (
    wsId,
    id
  ) => {
    return await api.patch(
      `/workspaces/${wsId}/tasks/${id}/archive`
    );
  },
};

// ==========================================
// Workspaces API
// ==========================================

export const workspacesApi = {
  // ========================================
  // Get Workspaces
  // ========================================

  list: async () => {
    return await api.get(
      "/workspaces"
    );
  },

  // ========================================
  // Create Workspace
  // ========================================

  create: async (data) => {
    return await api.post(
      "/workspaces",
      data
    );
  },

  // ========================================
  // Workspace Details
  // ========================================

  details: async (wsId) => {
    return await api.get(
      `/workspaces/${wsId}`
    );
  },

  // ========================================
  // Update Workspace
  // ========================================

  update: async (
    wsId,
    data
  ) => {
    return await api.patch(
      `/workspaces/${wsId}`,
      data
    );
  },

  // ========================================
  // Delete Workspace
  // ========================================

  delete: async (wsId) => {
    return await api.delete(
      `/workspaces/${wsId}`
    );
  },

  // ========================================
  // Workspace Members
  // ========================================

  members: async (wsId) => {
    return await api.get(
      `/workspaces/${wsId}/members`
    );
  },

  // ========================================
  // Invite Member
  // ========================================

  invite: async (
    wsId,
    data
  ) => {
    return await api.post(
      `/workspaces/${wsId}/invitations`,
      data
    );
  },

  // ========================================
  // Remove Member
  // ========================================

  removeMember: async (
    wsId,
    memberId
  ) => {
    return await api.delete(
      `/workspaces/${wsId}/members/${memberId}`
    );
  },

  // ========================================
  // Analytics
  // ========================================

  analytics: async (
    wsId
  ) => {
    return await api.get(
      `/workspaces/${wsId}/analytics`
    );
  },

  // ========================================
  // Activity Feed
  // ========================================

  activity: async (wsId) => {
    return await api.get(
      `/workspaces/${wsId}/activity`
    );
  },
};