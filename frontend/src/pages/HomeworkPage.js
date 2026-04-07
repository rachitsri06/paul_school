import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function HomeworkPage() {
  const [homework, setHomework] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', subject: 'Mathematics', class_name: '10', section: 'A', due_date: '', description: '', assigned_by: '' });

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      const { data } = await axios.get(`${API}/api/homework`, { headers: headers() });
      setHomework(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/homework`, form, { headers: headers() });
      toast.success('Homework assigned successfully');
      setShowAssign(false);
      setForm({ title: '', subject: 'Mathematics', class_name: '10', section: 'A', due_date: '', description: '', assigned_by: '' });
      fetchHomework();
    } catch { toast.error('Failed to assign homework'); }
  };

  const updateStatus = async (hw) => {
    const next = hw.status === 'Active' ? 'Completed' : hw.status === 'Completed' ? 'Pending' : 'Active';
    try {
      await axios.put(`${API}/api/homework/${hw._id}`, { status: next }, { headers: headers() });
      toast.success(`Status updated to ${next}`);
      fetchHomework();
    } catch { toast.error('Failed to update'); }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowAssign(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const statusIcon = (s) => s === 'Active' ? <Clock size={14} className="text-blue-600" /> : s === 'Completed' ? <CheckCircle size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-amber-600" />;
  const statusBadge = (s) => s === 'Active' ? 'bg-blue-100 text-blue-800 border-blue-200' : s === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="homework-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Homework</h1>
          <p className="text-sm text-slate-500 mt-1">{homework.length} assignments tracked</p>
        </div>
        <button onClick={() => setShowAssign(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="assign-homework-btn">
          <Plus size={16} /> Assign Homework
        </button>
      </div>

      <div className="grid gap-4">
        {homework.map(hw => (
          <div key={hw._id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow" data-testid={`homework-${hw._id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-blue-900" />
                  <h3 className="font-bold text-slate-900">{hw.title}</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">{hw.description}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{hw.subject}</span>
                  <span>Class {hw.class_name}-{hw.section}</span>
                  <span>Due: {hw.due_date}</span>
                  <span>By: {hw.assigned_by || 'Teacher'}</span>
                  <span>Submissions: {hw.submissions || 0}</span>
                </div>
              </div>
              <button onClick={() => updateStatus(hw)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${statusBadge(hw.status)} transition-colors`} data-testid={`hw-status-${hw._id}`}>
                {statusIcon(hw.status)} {hw.status}
              </button>
            </div>
          </div>
        ))}
        {homework.length === 0 && <p className="text-center text-slate-400 py-8">No homework assigned yet</p>}
      </div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Assign Homework</DialogTitle></DialogHeader>
          <form onSubmit={handleAssign} className="space-y-3" data-testid="assign-hw-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="hw-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Subject</label>
                <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  {['Mathematics','Science','English','Hindi','Social Studies','Computer'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="hw-due-date" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Class</label>
                <select value={form.class_name} onChange={e => setForm({...form, class_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  {['5','6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Section</label>
                <select value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option value="A">A</option><option value="B">B</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="hw-description" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Assigned By</label>
              <input value={form.assigned_by} onChange={e => setForm({...form, assigned_by: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
            </div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="hw-submit">Assign</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
