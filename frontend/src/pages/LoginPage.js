import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_school-hub-495/artifacts/ud1nrved_17104.jpg";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to St. Paul\'s School Management System');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(e => e.msg || JSON.stringify(e)).join(' ') : 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img src={SCHOOL_LOGO} alt="St. Paul's School" className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg border-4 border-white mb-4" />
          <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: 'Manrope' }}>
            St. Paul's School
          </h1>
          <p className="text-sm text-slate-500 mt-1">Maharajganj &middot; Study &middot; Play &middot; Serve</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope' }}>Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Access the school management system</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@stpauls.edu"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                required
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                required
                data-testid="login-password-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 transition-colors disabled:opacity-60 text-sm"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          St. Paul's School Management System &copy; 2025
        </p>
      </div>
    </div>
  );
}
