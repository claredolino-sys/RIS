import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import GuestDashboard from './pages/GuestDashboard';
import AuthPage from './pages/AuthPage';
import EmployeeRISPage from './pages/EmployeeRISPage';
import AdminInboxPage from './pages/AdminInboxPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import SuperAdminPage from './pages/SuperAdminPage';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={!user ? <GuestDashboard /> : <Navigate to="/dashboard" replace />} />
      <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            {user?.role === 'employee' && <EmployeeRISPage />}
            {(user?.role === 'admin' || user?.role === 'admin_administrative') && <AdminInboxPage />}
            {user?.role === 'superadmin' && <SuperAdminPage />}
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['admin_administrative', 'superadmin']}>
          <Layout><InventoryPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'admin_administrative']}>
          <Layout><ReportsPage /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
