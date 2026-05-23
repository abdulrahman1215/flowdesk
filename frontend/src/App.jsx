// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

import LoginPage      from "./pages/LoginPage";
import RegisterPage   from "./pages/RegisterPage";
import DashboardPage  from "./pages/DashboardPage";
import BoardPage      from "./pages/BoardPage";
import AnalyticsPage  from "./pages/AnalyticsPage";
import AppLayout      from "./components/layout/AppLayout";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index               element={<DashboardPage />} />
          <Route path="board/:wsId"  element={<BoardPage />} />
          <Route path="analytics/:wsId" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}