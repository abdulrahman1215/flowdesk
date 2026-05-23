// src/api/auth.js
import { api } from "./client";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  me:       ()     => api.get("/auth/me"),
  logout:   ()     => api.post("/auth/logout"),
};