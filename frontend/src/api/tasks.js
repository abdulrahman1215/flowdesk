// src/api/tasks.js
import { api } from "./client";

export const tasksApi = {
  list:    (wsId, params) => api.get(`/workspaces/${wsId}/tasks`, { params }),
  create:  (wsId, data)   => api.post(`/workspaces/${wsId}/tasks`, data),
  update:  (wsId, id, d)  => api.patch(`/workspaces/${wsId}/tasks/${id}`, d),
  move:    (wsId, id, d)  => api.post(`/workspaces/${wsId}/tasks/${id}/move`, d),
  delete:  (wsId, id)     => api.delete(`/workspaces/${wsId}/tasks/${id}`),
  comment: (wsId, id, d)  => api.post(`/workspaces/${wsId}/tasks/${id}/comments`, d),
  activity:(wsId, id)     => api.get(`/workspaces/${wsId}/tasks/${id}/activity`),
};

export const workspacesApi = {
  list:   ()       => api.get("/workspaces"),
  create: (data)   => api.post("/workspaces", data),
  members:(wsId)   => api.get(`/workspaces/${wsId}/members`),
  invite: (wsId,d) => api.post(`/workspaces/${wsId}/invitations`, d),
  analytics:(wsId) => api.get(`/workspaces/${wsId}/analytics`),
};