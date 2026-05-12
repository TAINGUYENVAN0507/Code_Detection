import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { clearAuth, getStoredAuth } from "./api/authApi";
import AnalyzePage from "./components/AnalyzePage";
import AuthPage from "./components/AuthPage";

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredAuth()?.user || null);

  function handleLogout() {
    clearAuth();
    setCurrentUser(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/analyze" replace />} />
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/analyze" replace />
            ) : (
              <AuthPage mode="login" onAuth={setCurrentUser} />
            )
          }
        />
        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/analyze" replace />
            ) : (
              <AuthPage mode="register" onAuth={setCurrentUser} />
            )
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute user={currentUser}>
              <AnalyzePage currentUser={currentUser} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
