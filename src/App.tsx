import React, { useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import FixedBackground from "./components/layout/FixedBackground";
import LoadingScreen from "./components/layout/Loadingscreen";
import PasswordReset from "./pages/public/PasswordReset";

// Pages
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Login from "./pages/public/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Admin from "./pages/admin/Admin";
import Checkout from "./pages/dashboard/Checkout";
import Contact from "./pages/public/Contact";
import Manifesto from "./pages/public/Manifesto";
import Register from "./pages/public/Register";

// ─── ScrollToTop ──────────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "ADMIN" | "USER";
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // While auth is resolving, show nothing (LoadingScreen handles the overlay)
  if (isLoading) return null;

  // Not logged in → go to home page (Guest-friendly landing)
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Wrong role → redirect to the right home
  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    return user?.role?.toUpperCase() === "ADMIN" ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  if (
    user?.role?.toUpperCase() === "USER" &&
    user?.status === "PENDING" &&
    // window.location.hash !== "#/payment"
    window.location.hash !== "#/dashboard"
  ) {
    return <Navigate to="/dashboard" replace />;
    // return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
};

// ─── PublicRoute ──────────────────────────────────────────────────────────────
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return user?.role?.toUpperCase() === "ADMIN" ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return <>{children}</>;
};

// ─── AppRoutes ────────────────────────────────────────────────────────────────
import { useHeartbeat } from "./hooks/useHeartbeat";

const AppRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useHeartbeat(300000);

  // Global loading state:
  // true  = auth hasn't resolved yet (first paint)
  // false = auth resolved, show content
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      // Small buffer so the progress bar has time to reach 100% smoothly
      const t = setTimeout(() => setAppReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  const isDashboardOrAdmin =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />

      {/* Loading overlay — exits once auth + initial data is ready */}
      <LoadingScreen isLoading={!appReady} />

      {/* Brand Background Layer (Public/Marketing only) */}
      {!isDashboardOrAdmin && <FixedBackground />}

      <div className="relative z-[2]">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/about"
            element={
              <PublicRoute>
                <About />
              </PublicRoute>
            }
          />
          <Route
            path="/manifesto"
            element={
              <PublicRoute>
                <Manifesto />
              </PublicRoute>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicRoute>
                <Contact />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={<Register />}
          />

          {/* Password Reset (public, no auth check) */}
          <Route
            path="/password-reset/:uid/:token"
            element={<PasswordReset />}
          />

          {/* User Flow Routes */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute role="USER">
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* Secure Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute role="USER">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="ADMIN">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <AuthProvider>
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  </AuthProvider>
);

export default App;