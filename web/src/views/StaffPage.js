import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Search, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import BulkUpload from '@/components/BulkUpload';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', emp_id: '', designation: '', department: 'Administration', phone: '', email: '',
    joining_date: '', salary: '', qualification: '', gender: 'Male', address: ''
  });

  const fetchStaff = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (deptFilter) params.set('department', deptFilter);
      const { data } = await axios.get(`${API}/api/staff?${params}`, { headers: headers() });
      setStaff(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, deptFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/staff`, { ...form, salary: parseFloat(form.salary) }, { headers: headers() });
      toast.success('Staff added successfully');
      setShowAdd(false);
      setForm({ name: '', emp_id: '', designation: '', department: 'Administration', phone: '', email: '', joining_date: '', salary: '', qualification: '', gender: 'Male', address: '' });
      fetchStaff();
    } catch { toast.error('Failed to add staff'); }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowAdd(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const departments = [...new Set(staff.map(s => s.department))].sort();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="staff-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Staff & HR</h1>
          <p className="text-sm text-slate-500 mt-1">{staff.length} staff members</p>
        </div>
        <div className="flex gap-2">
          <BulkUpload 
            entityName="Staff"
            templateHeaders={['name', 'emp_id', 'designation', 'department', 'phone', 'email', 'joining_date', 'salary', 'qualification', 'gender', 'address']}
            uploadUrl="/api/staff"
            onSuccess={fetchStaff}
          />
          <button onClick={() => setShowAdd(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="add-staff-btn">
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none" data-testid="staff-search" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="dept-filter">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(s => (
          <div key={s._id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow" data-testid={`staff-${s.emp_id}`}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold flex-shrink-0">
                {s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-500">{s.designation} | {s.emp_id}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Department</span><span className="font-medium">{s.department}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone</span><span>{s.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="truncate ml-2">{s.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Qualification</span><span>{s.qualification}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Joining</span><span>{s.joining_date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Salary</span><span className="font-semibold text-slate-900">Rs {s.salary?.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Add New Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3" data-testid="add-staff-form">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="staff-name" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Emp ID *</label><input required value={form.emp_id} onChange={e => setForm({...form, emp_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="staff-empid" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Designation</label><input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Department</label>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  {['Administration', 'Teaching Staff', 'Support Staff'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Joining Date</label><input type="date" value={form.joining_date} onChange={e => setForm({...form, joining_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Salary</label><input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="staff-salary" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Qualification</label><input value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="staff-submit">Add Staff</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
