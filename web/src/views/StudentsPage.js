import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, User, IdCard, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BulkUpload from '@/components/BulkUpload';

const API = "";
const token = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [showIdCard, setShowIdCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', roll_no: '', class_name: '1st', gender: 'Male',
    dob: '', father_name: '', mother_name: '', phone: '', address: '',
    admission_date: '', blood_group: '', transport_route: '', photo_url: ''
  });

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('class_name', classFilter);
      const { data } = await axios.get(`${API}/api/students?${params}`, { headers: headers() });
      setStudents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, classFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/students`, form, { headers: headers() });
      toast.success('Student enrolled successfully');
      setShowEnroll(false);
      setForm({ name: '', roll_no: '', class_name: '1st', gender: 'Male', dob: '', father_name: '', mother_name: '', phone: '', address: '', admission_date: '', blood_group: '', transport_route: '', photo_url: '' });
      fetchStudents();
    } catch (err) {
      toast.error('Failed to enroll student');
    }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setShowEnroll(false); setShowIdCard(null); } };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="students-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Students</h1>
          <p className="text-sm text-slate-500 mt-1">{students.length} students enrolled</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <BulkUpload 
              entityName="Students"
              templateHeaders={['name', 'roll_no', 'class_name', 'gender', 'dob', 'father_name', 'mother_name', 'phone', 'address', 'blood_group']}
              uploadUrl="/api/students"
              onSuccess={fetchStudents}
            />
          )}
          {isAdmin && <button onClick={() => setShowEnroll(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="enroll-student-btn">
            <Plus size={16} /> Enroll Student
          </button>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search by name or roll no..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none"
            data-testid="student-search-input"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="pl-9 pr-8 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 appearance-none bg-white" data-testid="class-filter">
            <option value="">All Classes</option>
            {['PG','Nursery','LKG','UKG','1st','2nd','3rd','4th','5th'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left" data-testid="students-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Roll No</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Class</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Gender</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Phone</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/students/${s._id}`)} data-testid={`student-row-${s.roll_no}`}>
                  <td className="px-4 py-3 font-mono text-slate-900">{s.roll_no}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">{s.name[0]}</div>
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.class_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.gender}</td>
                  <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => navigate(`/students/${s._id}`)} className="text-blue-900 hover:text-blue-700 text-xs font-medium" data-testid={`view-student-${s.roll_no}`}><User size={16} /></button>
                      <button onClick={() => setShowIdCard(s)} className="text-emerald-700 hover:text-emerald-600 text-xs font-medium" data-testid={`id-card-${s.roll_no}`}><IdCard size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>Enroll New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-3" data-testid="enroll-form">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="enroll-name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Roll No *</label>
                <input required value={form.roll_no} onChange={e => setForm({...form, roll_no: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="enroll-roll" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Class</label>
                <select value={form.class_name} onChange={e => setForm({...form, class_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  {['PG','Nursery','LKG','UKG','1st','2nd','3rd','4th','5th'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">DOB</label>
                <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Father's Name</label>
                <input value={form.father_name} onChange={e => setForm({...form, father_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Mother's Name</label>
                <input value={form.mother_name} onChange={e => setForm({...form, mother_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Blood Group</label>
                <input value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Address</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
            </div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="enroll-submit">Enroll Student</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ID Card Modal */}
      <Dialog open={!!showIdCard} onOpenChange={() => setShowIdCard(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope' }}>Student ID Card</DialogTitle>
          </DialogHeader>
          {showIdCard && (
            <div className="border-2 border-blue-900 rounded-lg overflow-hidden print-full-width" data-testid="id-card">
              <div className="bg-blue-900 text-white p-3 text-center">
                <p className="text-xs font-bold uppercase tracking-widest">St. Paul's School, Maharajganj</p>
                <p className="text-[10px] mt-0.5 text-blue-200">Study &middot; Play &middot; Serve</p>
              </div>
              <div className="p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {showIdCard.name[0]}
                </div>
                <p className="font-bold text-slate-900 text-lg">{showIdCard.name}</p>
                <p className="text-sm text-slate-500 mt-1">Class {showIdCard.class_name} | Roll No: {showIdCard.roll_no}</p>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <p>Father: {showIdCard.father_name}</p>
                  <p>Blood Group: {showIdCard.blood_group || 'N/A'}</p>
                  <p>Phone: {showIdCard.phone}</p>
                  <p>Transport: {showIdCard.transport_route || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-2 text-center border-t">
                <p className="text-[10px] text-slate-500">Academic Year 2025-2026</p>
              </div>
            </div>
          )}
          <button onClick={() => window.print()} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm mt-2" data-testid="print-id-card">Print ID Card</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
