import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const CLASSES = ['PG', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer', 'Sports', 'Library', 'Art', 'Music', 'EVS', 'GK'];

const SUBJECT_COLORS = {
  Mathematics: '#3b82f6', Science: '#10b981', English: '#f59e0b', Hindi: '#ef4444',
  'Social Studies': '#8b5cf6', Computer: '#06b6d4', Sports: '#f97316', Library: '#ec4899',
  Art: '#84cc16', Music: '#a855f7', EVS: '#14b8a6', GK: '#f43f5e',
};
const getColor = (subject) => SUBJECT_COLORS[subject] || '#64748b';

const EMPTY_FORM = { day: 'Monday', period: 'Period 1', subject: '', teacher: '', class_name: '' };

export default function TimetablePage() {
  const { user } = useAuth();
  const { session } = useSession();
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [className, setClassName] = useState('1st');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState(null); // null = add new
  const [form, setForm] = useState({ ...EMPTY_FORM, class_name: '1st' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const fetchData = async (cn = className) => {
    setLoading(true);
    try {
      const [ttRes, exRes] = await Promise.all([
        axios.get(`${API}/api/timetable?class_name=${cn}&session=${session}`, { headers: headers() }),
        axios.get(`${API}/api/timetable/exams?session=${session}`, { headers: headers() }),
      ]);
      setTimetable(ttRes.data);
      setExams(exRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(className); }, [className, session]);

  const periods = PERIODS;
  const getEntry = (day, period) => timetable.find(t => t.day === day && t.period === period);

  const openAdd = () => {
    setEditSlot(null);
    setForm({ ...EMPTY_FORM, class_name: className });
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditSlot(slot);
    setForm({
      day: slot.day,
      period: slot.period,
      subject: slot.subject,
      teacher: slot.teacher,
      class_name: slot.class_name,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.subject || !form.teacher) return;
    setSaving(true);
    try {
      const payload = { ...form, color: getColor(form.subject) };
      if (editSlot) {
        await axios.put(`${API}/api/timetable/${editSlot.id}`, payload, { headers: headers() });
      } else {
        await axios.post(`${API}/api/timetable`, payload, { headers: headers() });
      }
      setShowModal(false);
      await fetchData(className);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await axios.delete(`${API}/api/timetable/${id}`, { headers: headers() });
      await fetchData(className);
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="timetable-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">Weekly schedule and exam timetable</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={className}
            onChange={e => setClassName(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="tt-class"
          >
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
              data-testid="add-slot-btn"
            >
              <Plus size={16} />
              Add Slot
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="exams" data-testid="tab-exams">Exam Schedule</TabsTrigger>
        </TabsList>

        {/* Weekly Grid */}
        <TabsContent value="weekly">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="timetable-grid">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest sticky left-0 bg-slate-50 z-10 min-w-[90px]">Day</th>
                      {periods.map(p => (
                        <th key={p} className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center min-w-[120px]">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td className="px-3 py-2 font-semibold text-slate-800 text-xs uppercase sticky left-0 bg-white z-10">{day}</td>
                        {periods.map(period => {
                          const entry = getEntry(day, period);
                          return (
                            <td key={period} className="px-2 py-2">
                              {entry ? (
                                <div
                                  className="rounded-md px-2 py-2 text-center relative group transition-transform hover:scale-105"
                                  style={{ backgroundColor: `${getColor(entry.subject)}18`, borderLeft: `3px solid ${getColor(entry.subject)}` }}
                                >
                                  <p className="text-xs font-bold" style={{ color: getColor(entry.subject) }}>{entry.subject}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{entry.teacher}</p>
                                  {canEdit && (
                                    <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                                      <button
                                        onClick={() => openEdit(entry)}
                                        className="p-0.5 rounded bg-white/80 hover:bg-blue-100 text-blue-600 transition-colors"
                                        title="Edit"
                                        data-testid={`edit-${day}-${period}`}
                                      >
                                        <Pencil size={10} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        disabled={deleteId === entry.id}
                                        className="p-0.5 rounded bg-white/80 hover:bg-red-100 text-red-500 transition-colors"
                                        title="Delete"
                                        data-testid={`del-${day}-${period}`}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className={`rounded-md px-2 py-3 text-center text-slate-200 text-xs ${canEdit ? 'cursor-pointer hover:bg-slate-50 hover:text-slate-400 transition-colors' : ''}`}
                                  onClick={canEdit ? () => { setForm({ day, period, subject: '', teacher: '', class_name: className }); setEditSlot(null); setShowModal(true); } : undefined}
                                >
                                  {canEdit ? <Plus size={12} className="mx-auto opacity-40" /> : '—'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subject Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(SUBJECT_COLORS).map(([subj, color]) => (
              <div key={subj} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-slate-600">{subj}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Exam Schedule */}
        <TabsContent value="exams">
          <div className="space-y-4">
            {exams.map((exam, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5" data-testid={`exam-${i}`}>
                <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope' }}>{exam.exam_name}</h3>
                <p className="text-sm text-slate-500 mb-4">Class {exam.class_name} | {exam.start_date} to {exam.end_date}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Subject</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(exam.subjects || []).map((s, j) => (
                        <tr key={j}>
                          <td className="px-3 py-2 font-medium text-slate-800">{s.subject}</td>
                          <td className="px-3 py-2 text-slate-600">{s.date}</td>
                          <td className="px-3 py-2 text-slate-600">{s.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {exams.length === 0 && <p className="text-center text-slate-400 py-8">No exams scheduled</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" data-testid="slot-modal">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
                {editSlot ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                  <select
                    value={form.class_name}
                    onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Day</label>
                  <select
                    value={form.day}
                    onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Period</label>
                <select
                  value={form.period}
                  onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="subject-select"
                >
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher Name</label>
                <input
                  type="text"
                  value={form.teacher}
                  onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                  placeholder="e.g. Mrs. Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="teacher-input"
                />
              </div>

              {/* Preview chip */}
              {form.subject && (
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-md px-3 py-2 text-sm font-semibold"
                    style={{ backgroundColor: `${getColor(form.subject)}18`, color: getColor(form.subject), borderLeft: `3px solid ${getColor(form.subject)}` }}
                  >
                    {form.subject} {form.teacher && `— ${form.teacher}`}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.subject || !form.teacher}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors"
                data-testid="save-slot-btn"
              >
                <Check size={15} />
                {saving ? 'Saving...' : editSlot ? 'Update Slot' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
