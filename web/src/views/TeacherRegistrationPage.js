import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { BookOpen, User, Mail, Phone, Briefcase, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Teaching',
    designation: 'Teacher',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/staff/register', form);
      setSuccess(true);
      toast.success("Successfully registered! Check with Admin for your schedule.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white max-w-sm w-full p-8 rounded-2xl shadow-xl shadow-blue-900/5 text-center animate-fade-in border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Welcome Aboard!</h2>
          <p className="text-sm text-slate-500 mt-2">Your staff profile has been successfully created and linked to the active portal.</p>
          <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6 text-left">
            <p className="text-xs text-slate-500 font-medium">YOUR LOGIN CREDENTIALS</p>
            <p className="text-sm font-bold text-slate-800 mt-1">Portal: <span className="text-blue-600 font-mono">paul-school.vercel.app</span></p>
            <p className="text-sm font-bold text-slate-800 mt-1">Email: <span className="text-slate-600 font-mono">{form.email}</span></p>
            <p className="text-sm font-bold text-slate-800 mt-1">Password: <span className="text-slate-600 font-mono">{form.password || 'Teacher@123'}</span></p>
          </div>
          <Link to="/login" className="block w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 rounded-lg text-sm transition-colors">
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-900 text-white mb-4 shadow-lg shadow-blue-900/20">
            <BookOpen size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Staff Portal Join</h1>
          <p className="text-slate-500 text-sm mt-2">Register your unified profile to access the school platform.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400 transition-colors" placeholder="e.g. Rahul Sharma" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Phone</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400 transition-colors" placeholder="+91..." />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Designation</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                  </div>
                  <input required type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400 transition-colors" placeholder="Teacher, Coach..." />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400 transition-colors" placeholder="your.name@school.edu" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Create Password</label>
              <input required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-900 placeholder:text-slate-400 transition-colors mt-1" placeholder="Type a strong password" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg text-sm transition-colors mt-6 flex justify-center items-center h-12">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Join Portal"}
            </button>
            <p className="text-xs text-center text-slate-400 mt-4">By enrolling, you accept the school's digital usage policy.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
