import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserCog, DollarSign, ClipboardCheck, Bell, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL;

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data);
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  const statCards = [
    { label: "Total Students", value: stats?.total_students || 0, icon: Users, color: "bg-blue-50 text-blue-900", iconBg: "bg-blue-100" },
    { label: "Total Staff", value: stats?.total_staff || 0, icon: UserCog, color: "bg-emerald-50 text-emerald-800", iconBg: "bg-emerald-100" },
    { label: "Fees Collected", value: `Rs ${(stats?.total_fees_collected || 0).toLocaleString()}`, icon: DollarSign, color: "bg-amber-50 text-amber-800", iconBg: "bg-amber-100" },
    { label: "Today's Attendance", value: `${stats?.attendance_rate || 0}%`, icon: ClipboardCheck, color: "bg-violet-50 text-violet-800", iconBg: "bg-violet-100" },
  ];

  const chartData = (stats?.class_attendance || []).map(c => ({
    name: `Class ${c.class_name}`,
    present: c.present,
    total: c.total,
  }));

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back! Here's what's happening at St. Paul's School.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <TrendingUp size={16} />
          <span className="hidden sm:inline">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, iconBg }) => (
          <div key={label} className={`${color} rounded-lg border border-slate-200 p-5 transition-shadow hover:shadow-md`} data-testid={`stat-${label.toLowerCase().replace(/ /g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                <Icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>{value}</p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1 opacity-70">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5" data-testid="attendance-chart">
          <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Class-wise Student Strength</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Bar dataKey="total" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="Students" />
                <Bar dataKey="present" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Present Today" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5" data-testid="notices-panel">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-blue-900" />
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Recent Notices</h3>
          </div>
          <div className="space-y-3">
            {(stats?.notices || []).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No notices yet</p>
            )}
            {(stats?.notices || []).map((notice, i) => (
              <div key={i} className="border-l-3 border-blue-900 pl-3 py-2" data-testid={`notice-${i}`}>
                <p className="text-sm font-semibold text-slate-800">{notice.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notice.message}</p>
                <p className="text-xs text-slate-400 mt-1">{notice.sender} &middot; {notice.recipients}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Present Today</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats?.present_today || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Absent Today</p>
          <p className="text-xl font-bold text-red-500 mt-1">{(stats?.total_today_records || 0) - (stats?.present_today || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Classes</p>
          <p className="text-xl font-bold text-blue-900 mt-1">10</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Sections</p>
          <p className="text-xl font-bold text-blue-900 mt-1">2</p>
        </div>
      </div>
    </div>
  );
}
