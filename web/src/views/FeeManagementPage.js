import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Printer, Bell, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function FeeManagementPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCollect, setShowCollect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ student_id: '', student_name: '', class_name: '', amount: '', payment_mode: 'Cash', fee_type: 'Monthly', month: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [payRes, studRes] = await Promise.all([
        axios.get(`${API}/api/fees/payments`, { headers: headers() }),
        axios.get(`${API}/api/students`, { headers: headers() })
      ]);
      setPayments(payRes.data);
      setStudents(studRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCollect = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/fees/collect`, { ...form, amount: parseFloat(form.amount) }, { headers: headers() });
      toast.success('Fee collected successfully');
      setShowCollect(false);
      fetchData();
    } catch { toast.error('Failed to collect fee'); }
  };

  const selectStudent = (studentId) => {
    const s = students.find(st => st._id === studentId);
    if (s) setForm({ ...form, student_id: s._id, student_name: s.name, class_name: s.class_name });
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowCollect(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="fee-management-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Fee Management</h1>
          <p className="text-sm text-slate-500 mt-1">{payments.length} payment records | Total: Rs {totalCollected.toLocaleString()}</p>
        </div>
        <button onClick={() => setShowCollect(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="collect-fee-btn">
          <Plus size={16} /> Collect Fee
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="fee-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Receipt</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Class</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Mode</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Month</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p._id} className="hover:bg-slate-50" data-testid={`fee-row-${p.receipt_no}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.receipt_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.class_name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">Rs {p.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{p.payment_mode}</td>
                  <td className="px-4 py-3 text-slate-600">{p.month}</td>
                  <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-200">{p.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={async () => {
                        try {
                          const { data } = await axios.post(`${API}/api/notifications/send`, {
                            type: 'sms',
                            phone: students.find(s => s._id === p.student_id)?.phone || '',
                            message: `Dear Parent, this is a fee payment reminder for ${p.student_name} (Class ${p.class_name}). Amount: Rs ${p.amount}. Please clear at the earliest. - St. Paul's School`
                          }, { headers: headers() });
                          if (data.success) toast.success(`SMS reminder sent to ${p.student_name}'s parent`);
                          else toast.error(`SMS failed: ${data.error}`);
                        } catch { toast.error('Failed to send SMS'); }
                      }} className="text-blue-600 hover:text-blue-800" data-testid={`remind-${p.receipt_no}`}><Bell size={14} /></button>
                      <button onClick={() => window.print()} className="text-slate-500 hover:text-slate-700" data-testid={`print-${p.receipt_no}`}><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showCollect} onOpenChange={setShowCollect}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Collect Fee</DialogTitle></DialogHeader>
          <form onSubmit={handleCollect} className="space-y-3" data-testid="collect-fee-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Student</label>
              <select value={form.student_id} onChange={e => selectStudent(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" required data-testid="fee-student-select">
                <option value="">Select Student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} (Class {s.class_name})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Amount (Rs)</label>
                <input type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="fee-amount" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Payment Mode</label>
                <select value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option>Cash</option><option>Online</option><option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Fee Type</label>
                <select value={form.fee_type} onChange={e => setForm({...form, fee_type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option>Monthly</option><option>Quarterly</option><option>Annual</option><option>Transport</option><option>Books</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Month</label>
                <input value={form.month} onChange={e => setForm({...form, month: e.target.value})} placeholder="June 2025" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="fee-month" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="fee-submit">Collect Fee</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
