import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import LoginPage from "@/views/LoginPage";
import DashboardPage from "@/views/DashboardPage";
import ParentDashboardPage from "@/views/ParentDashboardPage";
import StudentsPage from "@/views/StudentsPage";
import StudentProfilePage from "@/views/StudentProfilePage";
import AttendancePage from "@/views/AttendancePage";
import TimetablePage from "@/views/TimetablePage";
import GradesPage from "@/views/GradesPage";
import HomeworkPage from "@/views/HomeworkPage";
import FeeManagementPage from "@/views/FeeManagementPage";
import FeeStructurePage from "@/views/FeeStructurePage";
import StaffPage from "@/views/StaffPage";
import PayrollPage from "@/views/PayrollPage";
import CommunicationPage from "@/views/CommunicationPage";
import TransportPage from "@/views/TransportPage";
import LibraryPage from "@/views/LibraryPage";
import ReportsPage from "@/views/ReportsPage";
import SettingsPage from "@/views/SettingsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function SmartDashboard() {
  const { user } = useAuth();
  if (user?.role === 'parent') return <ParentDashboardPage />;
  return <DashboardPage />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<SmartDashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="fees" element={<AdminRoute><FeeManagementPage /></AdminRoute>} />
            <Route path="fee-structure" element={<AdminRoute><FeeStructurePage /></AdminRoute>} />
            <Route path="staff" element={<AdminRoute><StaffPage /></AdminRoute>} />
            <Route path="payroll" element={<AdminRoute><PayrollPage /></AdminRoute>} />
            <Route path="communication" element={<CommunicationPage />} />
            <Route path="transport" element={<TransportPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

