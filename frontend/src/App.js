import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import AttendancePage from "@/pages/AttendancePage";
import TimetablePage from "@/pages/TimetablePage";
import GradesPage from "@/pages/GradesPage";
import HomeworkPage from "@/pages/HomeworkPage";
import FeeManagementPage from "@/pages/FeeManagementPage";
import FeeStructurePage from "@/pages/FeeStructurePage";
import StaffPage from "@/pages/StaffPage";
import PayrollPage from "@/pages/PayrollPage";
import CommunicationPage from "@/pages/CommunicationPage";
import TransportPage from "@/pages/TransportPage";
import LibraryPage from "@/pages/LibraryPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="homework" element={<HomeworkPage />} />
            <Route path="fees" element={<FeeManagementPage />} />
            <Route path="fee-structure" element={<FeeStructurePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="communication" element={<CommunicationPage />} />
            <Route path="transport" element={<TransportPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
