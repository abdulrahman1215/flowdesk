// src/api/auth.js

import { api } from "./client";

// ==========================================
// Auth API
// ==========================================

export const authApi = {
  // ========================================
  // Register
  // ========================================

  register: async (data) => {
    return await api.post(
      "/auth/register",
      data
    );
  },

  // ========================================
  // Login
  // ========================================

  login: async (data) => {
    return await api.post(
      "/auth/login",
      data
    );
  },

  // ========================================
  // Current User
  // ========================================

  me: async () => {
    return await api.get(
      "/auth/me"
    );
  },

  // ========================================
  // Logout
  // ========================================

  logout: async () => {
    return await api.post(
      "/auth/logout"
    );
  },

  // ========================================
  // Refresh Token
  // ========================================

  refresh: async (
    refresh_token
  ) => {
    return await api.post(
      "/auth/refresh",
      {
        refresh_token,
      }
    );
  },

  // ========================================
  // Forgot Password
  // ========================================

  forgotPassword: async (
    email
  ) => {
    return await api.post(
      "/auth/forgot-password",
      {
        email,
      }
    );
  },

  // ========================================
  // Reset Password
  // ========================================

  resetPassword: async (
    token,
    password
  ) => {
    return await api.post(
      "/auth/reset-password",
      {
        token,
        password,
      }
    );
  },

  // ========================================
  // Update Profile
  // ========================================

  updateProfile: async (
    data
  ) => {
    return await api.put(
      "/auth/profile",
      data
    );
  },

  // ========================================
  // Change Password
  // ========================================

  changePassword: async (
    data
  ) => {
    return await api.put(
      "/auth/change-password",
      data
    );
  },
};