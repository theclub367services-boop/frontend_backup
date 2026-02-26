import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import FixedBackground from './components/layout/FixedBackground';

// Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Login from './pages/public/Login';

import Dashboard from './pages/dashboard/Dashboard';
import Admin from './pages/admin/Admin';
import Checkout from './pages/dashboard/Checkout';
import Contact from './pages/public/Contact';
import Manifesto from './pages/public/Manifesto';
import Register from './pages/public/Register';

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
};

// Protected Route Implementation
const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'ADMIN' | 'USER' }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background-dark text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    console.log('Blocked by ProtectedRoute:', { userRole: user?.role, requiredRole: role });
    return <Navigate to="/" replace />;
  }

  // Redirect to payment if status is 'PENDING' and not already on payment page
  if (user?.role?.toUpperCase() === 'USER' && user?.status === 'PENDING' && window.location.hash !== '#/payment') {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
};

// Public Route Implementation - Prevents authenticated users from accessing public pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background-dark text-white">Loading...</div>;
  }

  if (isAuthenticated) {
    // Redirect based on role
    if (user?.role?.toUpperCase() === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

import { useHeartbeat } from './hooks/useHeartbeat';

const AppRoutes = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Start session heartbeat (every 5 mins) to catch expiry during idle navigation
  useHeartbeat(300000);

  const isDashboardOrAdmin = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />

      {/* Brand Background Layer (Public/Marketing only) */}
      {!isDashboardOrAdmin && <FixedBackground />}

      <div className="relative z-[2]">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/manifesto" element={<PublicRoute><Manifesto /></PublicRoute>} />
          <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />


          {/* User Flow Routes */}
          <Route path="/payment" element={
            <ProtectedRoute role="USER">
              <Checkout />
            </ProtectedRoute>
          } />

          {/* Secure Routes */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute role="USER">
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute role="ADMIN">
              <Admin />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;