import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, CalendarOff, CheckCheck, Bell, Send } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [className, setClassName] = useState('10');
  const [section, setSection] = useState('A');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, attRes] = await Promise.all([
        axios.get(`${API}/api/students?class_name=${className}&section=${section}`, { headers: headers() }),
        axios.get(`${API}/api/attendance?date=${date}&class_name=${className}&section=${section}`, { headers: headers() })
      ]);
      setStudents(studRes.data);
      const recs = {};
      attRes.data.forEach(r => { recs[r.student_id] = r.status; });
      // Initialize all students as Present if no existing record
      studRes.data.forEach(s => { if (!recs[s._id]) recs[s._id] = 'Present'; });
      setRecords(recs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [date, className, section]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const newRecs = {};
    students.forEach(s => { newRecs[s._id] = status; });
    setRecords(newRecs);
    toast.info(`All marked as ${status}`);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const recordsList = students.map(s => ({
        student_id: s._id, student_name: s.name, roll_no: s.roll_no, status: records[s._id] || 'Present'
      }));
      const { data } = await axios.post(`${API}/api/attendance/bulk`, {
        date, class_name: className, section, records: recordsList
      }, { headers: headers() });
      toast.success(`Attendance saved! P:${data.present} A:${data.absent} L:${data.late} Lv:${data.leave}`);
    } catch (err) { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const counters = {
    present: Object.values(records).filter(v => v === 'Present').length,
    absent: Object.values(records).filter(v => v === 'Absent').length,
    late: Object.values(records).filter(v => v === 'Late').length,
    leave: Object.values(records).filter(v => v === 'Leave').length,
  };

  const statusBtn = (studentId, status, icon, color) => (
    <button
      onClick={() => setStatus(studentId, status)}
      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${records[studentId] === status ? color : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
      data-testid={`att-${studentId}-${status.toLowerCase()}`}
    >
      {icon} {status}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="attendance-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Mark daily attendance for students</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => markAll('Present')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors" data-testid="mark-all-present">
            <CheckCheck size={14} /> Mark All Present
          </button>
          <button onClick={saveAttendance} disabled={saving} className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-60" data-testid="save-attendance-btn">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Filters & Counters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="attendance-date" />
          <select value={className} onChange={e => setClassName(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="attendance-class">
            {['5','6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={section} onChange={e => setSection(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="attendance-section">
            <option value="A">Sec A</option><option value="B">Sec B</option>
          </select>
        </div>
        <div className="flex gap-2" data-testid="attendance-counters">
          <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5 text-xs font-semibold text-emerald-700">P: {counters.present}</div>
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-xs font-semibold text-red-600">A: {counters.absent}</div>
          <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 text-xs font-semibold text-amber-600">L: {counters.late}</div>
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-600">Lv: {counters.leave}</div>
          <div className="bg-slate-100 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600">Total: {students.length}</div>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="attendance-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest w-12">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Roll</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Student Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors" data-testid={`att-row-${s.roll_no}`}>
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{s.roll_no}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {statusBtn(s._id, 'Present', <CheckCircle size={12} />, 'bg-emerald-100 text-emerald-800 border border-emerald-200')}
                        {statusBtn(s._id, 'Absent', <XCircle size={12} />, 'bg-red-100 text-red-800 border border-red-200')}
                        {statusBtn(s._id, 'Late', <Clock size={12} />, 'bg-amber-100 text-amber-800 border border-amber-200')}
                        {statusBtn(s._id, 'Leave', <CalendarOff size={12} />, 'bg-blue-100 text-blue-800 border border-blue-200')}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No students found for this class/section</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
