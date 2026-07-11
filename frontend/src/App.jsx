// src/App.jsx

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  Toaster,
} from "react-hot-toast";

import {
  Loader2,
} from "lucide-react";

import {
  useEffect,
} from "react";

import {
  useAuthStore,
} from "./store/authStore";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BoardPage from "./pages/BoardPage";
import AnalyticsPage from "./pages/AnalyticsPage";

// Layout
import AppLayout from "./components/layout/AppLayout";

// =====================================
// Protected Route
// =====================================

function ProtectedRoute({
  children,
}) {
  const {
    isAuthenticated,
    checkAuth,
    loading,
  } = useAuthStore();

  useEffect(() => {
    if (checkAuth) {
      checkAuth();
    }
  }, []);

  // Loading Screen
  if (loading) {
    return (
      <div
        className="
          flex min-h-screen
          items-center justify-center
          bg-gradient-to-br
          from-slate-100
          via-cyan-50
          to-blue-100
        "
      >
        <div
          className="
            flex flex-col
            items-center gap-4
          "
        >
          <div
            className="
              flex h-16 w-16
              items-center justify-center
              rounded-3xl
              bg-gradient-to-br
              from-cyan-500
              to-blue-600
              text-white
              shadow-2xl
            "
          >
            <Loader2
              size={30}
              className="animate-spin"
            />
          </div>

          <p
            className="
              text-sm
              font-medium
              text-slate-600
            "
          >
            Loading FlowDesk...
          </p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
    />
  );
}

// =====================================
// Public Route
// =====================================

function PublicRoute({
  children,
}) {
  const {
    isAuthenticated,
  } = useAuthStore();

  return isAuthenticated ? (
    <Navigate
      to="/"
      replace
    />
  ) : (
    children
  );
}

// =====================================
// App
// =====================================

export default function App() {
  return (
    <>
      {/* Toasts */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,

          style: {
            borderRadius: "18px",
            padding: "14px 16px",
            fontSize: "14px",
            fontWeight: 500,
          },

          success: {
            style: {
              background:
                "#ecfeff",
              color: "#155e75",
            },
          },

          error: {
            style: {
              background:
                "#fef2f2",
              color: "#991b1b",
            },
          },
        }}
      />

      <Routes>
        {/* ========================= */}
        {/* Public Routes */}
        {/* ========================= */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* ========================= */}
        {/* Protected Routes */}
        {/* ========================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <DashboardPage />
            }
          />

          <Route
            path="board/:wsId"
            element={
              <BoardPage />
            }
          />

          <Route
            path="analytics/:wsId"
            element={
              <AnalyticsPage />
            }
          />
        </Route>

        {/* ========================= */}
        {/* 404 */}
        {/* ========================= */}

        <Route
          path="*"
          element={
            <div
              className="
                flex min-h-screen
                flex-col
                items-center
                justify-center
                bg-gradient-to-br
                from-slate-100
                via-cyan-50
                to-blue-100
                px-4
                text-center
              "
            >
              <div
                className="
                  rounded-[32px]
                  border border-white/30
                  bg-white/70
                  px-10 py-12
                  shadow-2xl
                  backdrop-blur-xl
                "
              >
                <h1
                  className="
                    text-7xl
                    font-black
                    text-cyan-600
                  "
                >
                  404
                </h1>

                <p
                  className="
                    mt-3
                    text-lg
                    font-semibold
                    text-slate-800
                  "
                >
                  Page not found
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  The page you're looking for
                  doesn't exist.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}