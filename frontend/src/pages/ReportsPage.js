import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const REPORTS = [
  { id: 'attendance_summary', name: 'Attendance Summary', desc: 'Class-wise attendance breakdown' },
  { id: 'fee_collection', name: 'Fee Collection Report', desc: 'Total fees collected per class' },
  { id: 'student_strength', name: 'Student Strength', desc: 'Class & section-wise student count' },
  { id: 'exam_results', name: 'Exam Results', desc: 'All exam grades and marks' },
  { id: 'staff_attendance', name: 'Staff Attendance', desc: 'Staff presence and details' },
  { id: 'library_report', name: 'Library Report', desc: 'Books inventory and issued status' },
  { id: 'transport_report', name: 'Transport Report', desc: 'Route details and student mapping' },
  { id: 'fee_defaulters', name: 'Fee Defaulters', desc: 'Students with pending fees' },
  { id: 'homework_report', name: 'Homework Report', desc: 'All homework assignments' },
  { id: 'payroll_report', name: 'Payroll Report', desc: 'Staff salary processing' },
  { id: 'class_performance', name: 'Class Performance', desc: 'Academic performance analysis' },
  { id: 'daily_attendance', name: 'Daily Attendance', desc: "Today's attendance records" },
];

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [activeReport, setActiveReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchReport = async (reportId) => {
    setLoading(true);
    setActiveReport(reportId);
    setAiReport('');
    try {
      const { data } = await axios.get(`${API}/api/reports/${reportId}`, { headers: headers() });
      setReportData(data);
      toast.success('Report generated');
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/ai/generate-report`, {
        report_type: activeReport,
        context: JSON.stringify(reportData).substring(0, 2000)
      }, { headers: headers() });
      setAiReport(data.report);
      toast.success('AI report generated');
    } catch { toast.error('AI report generation failed'); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Reports</h1>
        <p className="text-sm text-slate-500 mt-1">12 one-click reports with AI insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {REPORTS.map(r => (
          <button
            key={r.id}
            onClick={() => fetchReport(r.id)}
            className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${activeReport === r.id ? 'border-blue-900 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            data-testid={`report-${r.id}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className={activeReport === r.id ? 'text-blue-900' : 'text-slate-400'} />
              <span className="text-sm font-semibold text-slate-900">{r.name}</span>
            </div>
            <p className="text-xs text-slate-500">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Report Output */}
      {loading && (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>
      )}
      {reportData && !loading && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 print-full-width">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
              {REPORTS.find(r => r.id === activeReport)?.name}
            </h3>
            <div className="flex gap-2 print-hidden">
              <button onClick={generateAIReport} disabled={aiLoading} className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-60" data-testid="ai-report-btn">
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? 'Generating...' : 'AI Insights'}
              </button>
              <button onClick={() => window.print()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors" data-testid="print-report">
                <Download size={14} /> Print
              </button>
            </div>
          </div>

          {/* AI Report */}
          {aiReport && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4" data-testid="ai-report-output">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-violet-600" />
                <span className="text-sm font-bold text-violet-800">AI Generated Insights</span>
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{aiReport}</div>
            </div>
          )}

          {/* Data */}
          <div className="overflow-x-auto">
            {Array.isArray(reportData) ? (
              reportData.length > 0 ? (
                <table className="w-full text-sm" data-testid="report-data-table">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {Object.keys(reportData[0]).filter(k => k !== '_id').map(k => (
                        <th key={k} className="px-3 py-2 font-semibold text-slate-600 text-xs uppercase tracking-widest text-left">{k.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {Object.entries(row).filter(([k]) => k !== '_id').map(([k, v], j) => (
                          <td key={j} className="px-3 py-2 text-slate-600">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-slate-400 py-8">No data available</p>
              )
            ) : (
              <div className="text-sm text-slate-600">
                <pre className="bg-slate-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(reportData, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
