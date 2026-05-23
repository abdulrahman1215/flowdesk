// src/store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../api/auth";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authApi.login({ email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        set({ user: data.user, isAuthenticated: true });
        return data;
      },

      register: async (formData) => {
        const { data } = await authApi.register(formData);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        set({ user: data.user, isAuthenticated: true });
        return data;
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);