import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDashboard } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import StudentRegister from './pages/StudentRegister';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import BackOfficeDashboard from './pages/BackOfficeDashboard';
import HeadOfficerDashboard from './pages/HeadOfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Unauthorized from './pages/Unauthorized';

// Role Guard Component
const RoleGuard = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Guest Guard Component (redirects authenticated users to their role-based dashboard)
const GuestGuard = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleDashboard(user.role)} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <GuestGuard>
            <Login />
          </GuestGuard>
        }
      />
      <Route
        path="/register"
        element={
          <GuestGuard>
            <StudentRegister />
          </GuestGuard>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Role Guarded Dashboard Routes */}
      <Route
        path="/student"
        element={
          <RoleGuard allowedRoles={['STUDENT_COORDINATOR', 'ADMIN']}>
            <StudentDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/staff"
        element={
          <RoleGuard allowedRoles={['STAFF_COORDINATOR', 'ADMIN']}>
            <StaffDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/back-office"
        element={
          <RoleGuard allowedRoles={['CHAMBER_BACK_OFFICER', 'ADMIN']}>
            <BackOfficeDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/head-officer"
        element={
          <RoleGuard allowedRoles={['HEAD_OFFICER', 'ADMIN']}>
            <HeadOfficerDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </RoleGuard>
        }
      />

      {/* Analytics Dashboard Route for Head Officer, Admin, and Back Officer */}
      <Route
        path="/analytics"
        element={
          <RoleGuard allowedRoles={['HEAD_OFFICER', 'ADMIN', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER']}>
            <AnalyticsDashboard />
          </RoleGuard>
        }
      />

      <Route
        path="/dashboard/analytics"
        element={
          <RoleGuard allowedRoles={['HEAD_OFFICER', 'ADMIN', 'CHAMBER_BACK_OFFICER', 'BACK_OFFICER']}>
            <AnalyticsDashboard />
          </RoleGuard>
        }
      />

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
