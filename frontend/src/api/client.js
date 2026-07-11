// src/api/client.js

import axios from "axios";

import toast from "react-hot-toast";

// ==========================================
// Environment
// ==========================================

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

// ==========================================
// Axios Instance
// ==========================================

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout: 15000,
});

// ==========================================
// Request Interceptor
// Attach JWT Token
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor
// Handle Refresh Token + Errors
// ==========================================

let isRefreshing = false;

let failedQueue = [];

// Process queued requests
const processQueue = (
  error,
  token = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    // ======================================
    // Unauthorized -> Refresh Token
    // ======================================

    if (
      error.response?.status ===
        401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(
          (
            resolve,
            reject
          ) => {
            failedQueue.push({
              resolve,
              reject,
            });
          }
        )
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;

            return api(
              originalRequest
            );
          })
          .catch((err) =>
            Promise.reject(err)
          );
      }

      originalRequest._retry = true;

      isRefreshing = true;

      try {
        const refreshToken =
          localStorage.getItem(
            "refresh_token"
          );

        // Refresh API Call
        const { data } =
          await axios.post(
            `${BASE_URL}/api/v1/auth/refresh`,
            {
              refresh_token:
                refreshToken,
            }
          );

        // Save new tokens
        localStorage.setItem(
          "access_token",
          data.access_token
        );

        localStorage.setItem(
          "refresh_token",
          data.refresh_token
        );

        // Update Authorization
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        processQueue(
          null,
          data.access_token
        );

        return api(
          originalRequest
        );
      } catch (refreshError) {
        processQueue(
          refreshError,
          null
        );

        // Clear storage
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        toast.error(
          "Session expired. Please login again."
        );

        // Redirect
        window.location.href =
          "/login";

        return Promise.reject(
          refreshError
        );
      } finally {
        isRefreshing = false;
      }
    }

    // ======================================
    // Handle Global Errors
    // ======================================

    if (
      error.response?.status ===
      500
    ) {
      toast.error(
        "Server error occurred"
      );
    }

    if (
      error.response?.status ===
      403
    ) {
      toast.error(
        "You are not allowed to perform this action"
      );
    }

    if (
      error.code === "ECONNABORTED"
    ) {
      toast.error(
        "Request timeout"
      );
    }

    if (!error.response) {
      toast.error(
        "Network error. Please check your connection."
      );
    }

    return Promise.reject(error);
  }
);

// ==========================================
// API Helpers
// ==========================================

export const setAuthToken = (
  token
) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers
      .common.Authorization;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  delete api.defaults.headers
    .common.Authorization;
};

export default api;