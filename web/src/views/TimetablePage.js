import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SUBJECT_COLORS = {
  Mathematics: '#3b82f6', Science: '#10b981', English: '#f59e0b', Hindi: '#ef4444',
  'Social Studies': '#8b5cf6', Computer: '#06b6d4', Sports: '#f97316', Library: '#ec4899'
};

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [className, setClassName] = useState('10');
  const [section, setSection] = useState('A');

  useEffect(() => {
    (async () => {
      try {
        const [ttRes, exRes] = await Promise.all([
          axios.get(`${API}/api/timetable?class_name=${className}&section=${section}`, { headers: headers() }),
          axios.get(`${API}/api/timetable/exams`, { headers: headers() })
        ]);
        setTimetable(ttRes.data);
        setExams(exRes.data);
      } catch (err) { console.error(err); }
    })();
  }, [className, section]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [...new Set(timetable.map(t => t.period))].sort((a, b) => {
    const na = parseInt(a.match(/\d+/)?.[0] || '0');
    const nb = parseInt(b.match(/\d+/)?.[0] || '0');
    return na - nb;
  });

  const getEntry = (day, period) => timetable.find(t => t.day === day && t.period === period);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="timetable-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">Weekly schedule and exam timetable</p>
        </div>
        <div className="flex gap-2">
          <select value={className} onChange={e => setClassName(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="tt-class">
            {['5','6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={section} onChange={e => setSection(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="tt-section">
            <option value="A">Sec A</option><option value="B">Sec B</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="exams" data-testid="tab-exams">Exam Schedule</TabsTrigger>
          <TabsTrigger value="teachers" data-testid="tab-teachers">Teacher Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="timetable-grid">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Day</th>
                    {periods.map(p => (
                      <th key={p} className="px-3 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center min-w-[100px]">
                        {p.split('\n').map((l, i) => <div key={i} className={i === 1 ? 'text-[10px] font-normal text-slate-400 mt-0.5' : ''}>{l}</div>)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {days.map(day => (
                    <tr key={day}>
                      <td className="px-3 py-3 font-semibold text-slate-800 text-xs uppercase sticky left-0 bg-white z-10">{day}</td>
                      {periods.map(period => {
                        const entry = getEntry(day, period);
                        if (!entry) return <td key={period} className="px-2 py-2 text-center"><span className="text-xs text-slate-300">-</span></td>;
                        return (
                          <td key={period} className="px-2 py-2">
                            <div
                              className="rounded-md px-2 py-2 text-center transition-transform hover:scale-105"
                              style={{ backgroundColor: `${entry.color}15`, borderLeft: `3px solid ${entry.color}` }}
                            >
                              <p className="text-xs font-bold" style={{ color: entry.color }}>{entry.subject}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{entry.teacher}</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

        <TabsContent value="exams">
          <div className="space-y-4">
            {exams.map((exam, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-5" data-testid={`exam-${i}`}>
                <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope' }}>{exam.exam_name}</h3>
                <p className="text-sm text-slate-500 mb-4">Class {exam.class_name} | {exam.start_date} to {exam.end_date}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Subject</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Time</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {(exam.subjects || []).map((s, j) => (
                        <tr key={j}><td className="px-3 py-2 font-medium text-slate-800">{s.subject}</td><td className="px-3 py-2 text-slate-600">{s.date}</td><td className="px-3 py-2 text-slate-600">{s.time}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {exams.length === 0 && <p className="text-center text-slate-400 py-8">No exams scheduled</p>}
          </div>
        </TabsContent>

        <TabsContent value="teachers">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Teacher-Subject Mapping</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(SUBJECT_COLORS).map(([subj, color]) => {
                const entry = timetable.find(t => t.subject === subj);
                return (
                  <div key={subj} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                      {subj.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{subj}</p>
                      <p className="text-xs text-slate-500">{entry?.teacher || 'Not assigned'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
