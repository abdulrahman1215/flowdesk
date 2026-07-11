// src/store/authStore.js

import { create } from "zustand";

import { persist } from "zustand/middleware";

import toast from "react-hot-toast";

import { authApi } from "../api/auth";

// ==========================================
// Auth Store
// ==========================================

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ======================================
      // State
      // ======================================

      user: null,

      isAuthenticated: false,

      loading: false,

      // ======================================
      // Login
      // ======================================

      login: async (
        email,
        password
      ) => {
        try {
          set({ loading: true });

          const { data } =
            await authApi.login({
              email,
              password,
            });

          // Save Tokens
          localStorage.setItem(
            "access_token",
            data.access_token
          );

          localStorage.setItem(
            "refresh_token",
            data.refresh_token
          );

          // Update State
          set({
            user: data.user,
            isAuthenticated: true,
          });

          toast.success(
            `Welcome back ${
              data.user?.full_name ||
              ""
            } 👋`
          );

          return data;
        } catch (err) {
          console.error(err);

          toast.error(
            err.response?.data?.detail ||
              "Login failed"
          );

          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // ======================================
      // Register
      // ======================================

      register: async (formData) => {
        try {
          set({ loading: true });

          const { data } =
            await authApi.register(
              formData
            );

          // Save Tokens
          localStorage.setItem(
            "access_token",
            data.access_token
          );

          localStorage.setItem(
            "refresh_token",
            data.refresh_token
          );

          // Update State
          set({
            user: data.user,
            isAuthenticated: true,
          });

          toast.success(
            "Account created successfully 🎉"
          );

          return data;
        } catch (err) {
          console.error(err);

          toast.error(
            err.response?.data?.detail ||
              "Registration failed"
          );

          throw err;
        } finally {
          set({ loading: false });
        }
      },

      // ======================================
      // Logout
      // ======================================

      logout: () => {
        // Remove Tokens
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        // Reset State
        set({
          user: null,
          isAuthenticated: false,
        });

        toast.success(
          "Logged out successfully"
        );
      },

      // ======================================
      // Update User
      // ======================================

      updateUser: (updates) => {
        const currentUser =
          get().user;

        set({
          user: {
            ...currentUser,
            ...updates,
          },
        });
      },

      // ======================================
      // Check Auth
      // ======================================

      checkAuth: () => {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },
    }),

    // ========================================
    // Persist Config
    // ========================================

    {
      name: "flowdesk-auth",

      partialize: (state) => ({
        user: state.user,
        isAuthenticated:
          state.isAuthenticated,
      }),
    }
  )
);