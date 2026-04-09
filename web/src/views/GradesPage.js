import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Trophy, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const autoGrade = (marks) => marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 60 ? 'B' : marks >= 50 ? 'C' : 'D';

export default function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [className, setClassName] = useState('10');
  const [section, setSection] = useState('A');
  const [exam, setExam] = useState('Mid-Term');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/grades?class_name=${className}&section=${section}&exam=${exam}`, { headers: headers() });
        setGrades(data);
      } catch (err) { console.error(err); }
    })();
  }, [className, section, exam]);

  const updateMark = (studentId, subject, marks) => {
    const m = Math.min(100, Math.max(0, parseInt(marks) || 0));
    setGrades(prev => prev.map(g =>
      g.student_id === studentId && g.subject === subject ? { ...g, marks_obtained: m, grade: autoGrade(m) } : g
    ));
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/api/grades/save`, { records: grades }, { headers: headers() });
      toast.success('Grades saved successfully');
    } catch { toast.error('Failed to save grades'); }
    finally { setSaving(false); }
  };

  // Group by student
  const studentMap = {};
  grades.forEach(g => {
    if (!studentMap[g.student_id]) studentMap[g.student_id] = { name: g.student_name, roll_no: g.roll_no, subjects: {} };
    studentMap[g.student_id].subjects[g.subject] = g;
  });
  const subjects = [...new Set(grades.map(g => g.subject))];

  // Rankings
  const rankings = Object.entries(studentMap).map(([id, s]) => {
    const total = Object.values(s.subjects).reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
    const avg = subjects.length > 0 ? (total / subjects.length).toFixed(1) : 0;
    return { id, name: s.name, roll_no: s.roll_no, total, avg: parseFloat(avg) };
  }).sort((a, b) => b.total - a.total);

  // Class stats
  const allMarks = grades.map(g => g.marks_obtained);
  const classAvg = allMarks.length > 0 ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1) : 0;
  const highest = allMarks.length > 0 ? Math.max(...allMarks) : 0;
  const passRate = allMarks.length > 0 ? ((allMarks.filter(m => m >= 33).length / allMarks.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="grades-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Grades & Exams</h1>
          <p className="text-sm text-slate-500 mt-1">Inline editable marks with auto-grading</p>
        </div>
        <button onClick={saveGrades} disabled={saving} className="bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-colors disabled:opacity-60" data-testid="save-grades-btn">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Grades'}
        </button>
      </div>

      <div className="flex gap-2">
        <select value={className} onChange={e => setClassName(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          {['5','6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={section} onChange={e => setSection(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm">
          <option value="A">Sec A</option><option value="B">Sec B</option>
        </select>
        <select value={exam} onChange={e => setExam(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="exam-select">
          <option value="Mid-Term">Mid-Term</option><option value="Annual">Annual</option>
        </select>
      </div>

      {/* Class Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-900">{classAvg}</p>
          <p className="text-xs text-blue-700 font-semibold">Class Average</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">{highest}</p>
          <p className="text-xs text-emerald-600 font-semibold">Highest Marks</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700">{passRate}%</p>
          <p className="text-xs text-amber-600 font-semibold">Pass Rate</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-violet-700">{Object.keys(studentMap).length}</p>
          <p className="text-xs text-violet-600 font-semibold">Students</p>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="grades-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Roll</th>
                <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest sticky left-[60px] bg-slate-50 z-10">Student</th>
                {subjects.map(s => <th key={s} className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center min-w-[90px]">{s}</th>)}
                <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Total</th>
                <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.map((r, idx) => {
                const s = studentMap[r.id];
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-800 sticky left-0 bg-white z-10">{r.roll_no}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 sticky left-[60px] bg-white z-10 whitespace-nowrap">{r.name}</td>
                    {subjects.map(subj => {
                      const g = s.subjects[subj];
                      if (!g) return <td key={subj} className="px-3 py-2 text-center text-slate-300">-</td>;
                      return (
                        <td key={subj} className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" min="0" max="100"
                              value={g.marks_obtained}
                              onChange={e => updateMark(r.id, subj, e.target.value)}
                              className="w-14 px-1.5 py-1 border border-slate-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-900 focus:border-transparent outline-none"
                              data-testid={`mark-${r.roll_no}-${subj}`}
                            />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${g.grade === 'A+' || g.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : g.grade === 'B+' || g.grade === 'B' ? 'bg-blue-100 text-blue-800' : g.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {g.grade}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-slate-900">{r.total}</td>
                    <td className="px-3 py-2 text-center">
                      {idx < 3 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><Trophy size={12} />{idx + 1}</span>
                      ) : (
                        <span className="text-xs text-slate-500">{idx + 1}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
