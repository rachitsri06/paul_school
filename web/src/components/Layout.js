import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSession, SESSIONS } from '@/contexts/SessionContext';
import {
  LayoutDashboard, Users, ClipboardCheck, Calendar, GraduationCap, BookOpen,
  DollarSign, CreditCard, UserCog, Wallet, MessageSquare, Bus, Library,
  BarChart3, Settings, LogOut, Menu, X, ChevronRight, CalendarRange
} from 'lucide-react';

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_school-hub-495/artifacts/ud1nrved_17104.jpg";

const navItems = [
  { to: "/portal", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "teacher", "parent"] },
  { to: "/portal/students", icon: Users, label: "Students", roles: ["admin", "teacher"] },
  { to: "/portal/attendance", icon: ClipboardCheck, label: "Attendance", roles: ["admin", "teacher"] },
  { to: "/portal/timetable", icon: Calendar, label: "Timetable", roles: ["admin", "teacher"] },
  { to: "/portal/grades", icon: GraduationCap, label: "Grades & Exams", roles: ["admin", "teacher"] },
  { to: "/portal/homework", icon: BookOpen, label: "Homework", roles: ["admin", "teacher"] },
  { to: "/portal/fees", icon: DollarSign, label: "Fee Management", roles: ["admin"] },
  { to: "/portal/fee-structure", icon: CreditCard, label: "Fee Structure", roles: ["admin"] },
  { to: "/portal/staff", icon: UserCog, label: "Staff & HR", roles: ["admin"] },
  { to: "/portal/payroll", icon: Wallet, label: "Payroll", roles: ["admin"] },
  { to: "/portal/communication", icon: MessageSquare, label: "Communication", roles: ["admin", "teacher"] },
  { to: "/portal/transport", icon: Bus, label: "Transport", roles: ["admin", "teacher"] },
  { to: "/portal/library", icon: Library, label: "Library", roles: ["admin", "teacher"] },
  { to: "/portal/reports", icon: BarChart3, label: "Reports", roles: ["admin"] },
  { to: "/portal/settings", icon: Settings, label: "Settings", roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { session, changeSession } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const userRole = user?.role || 'teacher';

  const filteredNavItems = navItems.filter(n => n.roles.includes(userRole));

  const pageTitle = navItems.find(n => {
    if (n.to === "/portal") return location.pathname === "/portal" || location.pathname === "/portal/";
    return location.pathname.startsWith(n.to);
  })?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col print-hidden`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
          <img src={SCHOOL_LOGO} alt="St. Paul's School" className="w-10 h-10 rounded-full object-cover bg-white" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Manrope' }}>St. Paul's School</h1>
            <p className="text-xs text-slate-400 truncate">Maharajganj &middot; {session}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" data-testid="sidebar-nav">
          {filteredNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/portal"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : 'text-slate-300 hover:text-white'}`
              }
              data-testid={`nav-${label.toLowerCase().replace(/[& ]/g, '-')}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-white">
              {(user?.name || user?.email || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || "admin"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
            data-testid="logout-btn"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 print-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                data-testid="mobile-menu-btn"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <span className="hidden sm:inline">St. Paul's School</span>
                <ChevronRight size={14} className="hidden sm:inline" />
                <span className="font-semibold text-slate-900">{pageTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Session Selector */}
              <div className="flex items-center gap-1.5">
                <CalendarRange size={14} className="text-blue-900 hidden sm:inline" />
                <select
                  id="session-selector"
                  value={session}
                  onChange={e => changeSession(e.target.value)}
                  className="text-xs font-semibold text-blue-900 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 transition-colors"
                  title="Select Academic Session"
                  data-testid="session-selector"
                >
                  {SESSIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-white">
                {(user?.name || "A")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
