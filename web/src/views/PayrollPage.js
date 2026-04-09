import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Wallet, Play } from 'lucide-react';
import { toast } from 'sonner';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayroll(); }, [month]);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/payroll?month=${month}`, { headers: headers() });
      setPayroll(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const processPayroll = async () => {
    setProcessing(true);
    try {
      const { data } = await axios.post(`${API}/api/payroll/process`, { month }, { headers: headers() });
      toast.success(data.message);
      fetchPayroll();
    } catch { toast.error('Failed to process payroll'); }
    finally { setProcessing(false); }
  };

  const totalNet = payroll.reduce((sum, p) => sum + (p.net_salary || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="payroll-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Payroll</h1>
          <p className="text-sm text-slate-500 mt-1">Attendance-linked salary processing</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md text-sm" data-testid="payroll-month" />
          <button onClick={processPayroll} disabled={processing} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-60" data-testid="process-payroll-btn">
            <Play size={16} /> {processing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-900">{payroll.length}</p>
          <p className="text-xs text-blue-700 font-semibold">Staff Processed</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">Rs {totalNet.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold">Net Payable</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-amber-700">Rs {payroll.reduce((s, p) => s + (p.deductions || 0), 0).toLocaleString()}</p>
          <p className="text-xs text-amber-600 font-semibold">Total Deductions</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-violet-700">Rs {payroll.reduce((s, p) => s + (p.basic_salary || 0), 0).toLocaleString()}</p>
          <p className="text-xs text-violet-600 font-semibold">Gross Salary</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : payroll.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No payroll records for {month}. Click "Process Payroll" to generate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="payroll-table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Emp ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Designation</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Basic</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Days</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Deductions</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Net Salary</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payroll.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50" data-testid={`payroll-${p.emp_id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.emp_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.staff_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.designation}</td>
                    <td className="px-4 py-3 text-right text-slate-600">Rs {p.basic_salary?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{p.days_present}/30</td>
                    <td className="px-4 py-3 text-right text-red-600">Rs {p.deductions?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">Rs {p.net_salary?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
