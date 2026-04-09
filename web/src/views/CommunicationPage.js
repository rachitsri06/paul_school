import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Bell, Send, Plus, Phone, CheckCircle, XCircle, Clock, Loader2, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function CommunicationPage() {
  const [communications, setCommunications] = useState([]);
  const [notifLogs, setNotifLogs] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [showAttAlert, setShowAttAlert] = useState(false);
  const [showFeeReminder, setShowFeeReminder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ type: 'notice', title: '', message: '', recipients: 'All Students', sender: '' });
  const [attAlertForm, setAttAlertForm] = useState({ date: new Date().toISOString().split('T')[0], class_name: '', section: '', type: 'sms' });
  const [feeForm, setFeeForm] = useState({ type: 'sms', message: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [commRes, logRes] = await Promise.all([
        axios.get(`${API}/api/communications`, { headers: headers() }),
        axios.get(`${API}/api/notifications/logs?limit=30`, { headers: headers() })
      ]);
      setCommunications(commRes.data);
      setNotifLogs(logRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/api/communications`, form, { headers: headers() });
      if (form.type === 'sms' || form.type === 'whatsapp') {
        const sent = data.sent_count || 0;
        const failed = data.failed_count || 0;
        if (sent > 0) {
          toast.success(`${form.type.toUpperCase()} sent to ${sent} recipients${failed > 0 ? ` (${failed} failed)` : ''}`);
        } else {
          toast.error(`Failed to send ${form.type.toUpperCase()}. Check Twilio config or phone numbers.`);
        }
      } else {
        toast.success('Message sent');
      }
      setShowNew(false);
      setForm({ type: 'notice', title: '', message: '', recipients: 'All Students', sender: '' });
      fetchAll();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleAttendanceAlert = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/api/notifications/attendance-alert`, attAlertForm, { headers: headers() });
      if (data.sent > 0) {
        toast.success(data.message);
      } else {
        toast.info(data.message || 'No alerts to send');
      }
      setShowAttAlert(false);
      fetchAll();
    } catch { toast.error('Failed to send alerts'); }
    finally { setSending(false); }
  };

  const handleFeeReminder = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/api/notifications/fee-reminder`, feeForm, { headers: headers() });
      if (data.sent > 0) {
        toast.success(data.message);
      } else {
        toast.info(data.message || 'No reminders to send');
      }
      setShowFeeReminder(false);
      fetchAll();
    } catch { toast.error('Failed to send reminders'); }
    finally { setSending(false); }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setShowNew(false); setShowAttAlert(false); setShowFeeReminder(false); } };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filterByType = (type) => communications.filter(c => c.type === type);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  const CommList = ({ items }) => (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-center text-slate-400 py-8">No messages</p>}
      {items.map(c => (
        <div key={c._id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow" data-testid={`comm-${c._id}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{c.message}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                <span>To: {c.recipients}</span>
                <span>From: {c.sender || 'Admin'}</span>
                <span>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                {c.sent_count !== undefined && (
                  <span className="text-emerald-600 font-semibold">Delivered: {c.sent_count}</span>
                )}
                {c.failed_count > 0 && (
                  <span className="text-red-500 font-semibold">Failed: {c.failed_count}</span>
                )}
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${c.status === 'Sent' ? 'bg-emerald-100 text-emerald-800' : c.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
              {c.status === 'Sent' ? <CheckCircle size={12} /> : c.status === 'Failed' ? <XCircle size={12} /> : <Clock size={12} />}
              {c.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="communication-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Communication</h1>
          <p className="text-sm text-slate-500 mt-1">Inbox, notices & real SMS/WhatsApp notifications</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAttAlert(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md px-3 py-2 text-sm flex items-center gap-1.5 transition-colors" data-testid="attendance-alert-btn">
            <Bell size={14} /> Attendance Alert
          </button>
          <button onClick={() => setShowFeeReminder(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-3 py-2 text-sm flex items-center gap-1.5 transition-colors" data-testid="fee-reminder-btn">
            <Phone size={14} /> Fee Reminder
          </button>
          <button onClick={() => setShowNew(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="new-message-btn">
            <Plus size={16} /> New Message
          </button>
        </div>
      </div>

      {/* Twilio Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3" data-testid="twilio-status">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs text-blue-800">
          <strong>Twilio Connected</strong> &mdash; SMS via +17125305439 | WhatsApp via sandbox +14155238886
          <span className="text-blue-600 ml-2">(Trial: can only send to verified numbers)</span>
        </p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="inbox" data-testid="tab-inbox"><MessageSquare size={14} className="mr-1.5" /> Inbox ({filterByType('inbox').length})</TabsTrigger>
          <TabsTrigger value="notices" data-testid="tab-notices"><Bell size={14} className="mr-1.5" /> Notices ({filterByType('notice').length})</TabsTrigger>
          <TabsTrigger value="sms" data-testid="tab-sms"><Send size={14} className="mr-1.5" /> SMS/WhatsApp</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs"><History size={14} className="mr-1.5" /> Delivery Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox"><CommList items={filterByType('inbox')} /></TabsContent>
        <TabsContent value="notices"><CommList items={filterByType('notice')} /></TabsContent>
        <TabsContent value="sms"><CommList items={[...filterByType('sms'), ...filterByType('whatsapp')]} /></TabsContent>
        <TabsContent value="logs">
          <div className="space-y-3">
            {notifLogs.length === 0 && <p className="text-center text-slate-400 py-8">No delivery logs yet</p>}
            {notifLogs.map(log => (
              <div key={log._id} className="bg-white rounded-lg border border-slate-200 p-4" data-testid={`log-${log._id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${log.type?.includes('sms') ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {log.type?.replace('_', ' ')}
                    </span>
                    {log.recipient_group && <span className="text-xs text-slate-500">To: {log.recipient_group}</span>}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(log.sent_at).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{log.message}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {log.sent !== undefined && <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Sent: {log.sent}</span>}
                  {log.failed > 0 && <span className="text-red-500 font-semibold flex items-center gap-1"><XCircle size={12} /> Failed: {log.failed}</span>}
                  {log.total !== undefined && <span className="text-slate-400">Total: {log.total}</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Message Modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>New Message</DialogTitle></DialogHeader>
          <form onSubmit={handleSend} className="space-y-3" data-testid="comm-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="comm-type">
                <option value="notice">Notice</option>
                <option value="inbox">Inbox Message</option>
                <option value="sms">SMS Blast (Twilio)</option>
                <option value="whatsapp">WhatsApp Blast (Twilio)</option>
              </select>
              {(form.type === 'sms' || form.type === 'whatsapp') && (
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
                  {form.type === 'sms' ? 'Real SMS will be sent via Twilio to selected recipients' : 'Real WhatsApp messages via Twilio sandbox. Recipients must have joined sandbox first.'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="comm-title" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Message *</label>
              <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="comm-message" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recipients</label>
                <select value={form.recipients} onChange={e => setForm({...form, recipients: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option>All Students</option><option>All Parents</option><option>All Staff</option><option>All</option>
                  <option>Class 10-A Parents</option><option>Class 9-A Parents</option><option>Class 8-A Parents</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sender</label>
                <input value={form.sender} onChange={e => setForm({...form, sender: e.target.value})} placeholder="Principal" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
            </div>
            <button type="submit" disabled={sending} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60" data-testid="comm-submit">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> {form.type === 'sms' ? 'Send SMS' : form.type === 'whatsapp' ? 'Send WhatsApp' : 'Send'}</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Alert Modal */}
      <Dialog open={showAttAlert} onOpenChange={setShowAttAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Send Attendance Alerts</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">Automatically notify parents of absent/late students via SMS or WhatsApp.</p>
          <form onSubmit={handleAttendanceAlert} className="space-y-3 mt-2" data-testid="att-alert-form">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Date</label>
                <input type="date" value={attAlertForm.date} onChange={e => setAttAlertForm({...attAlertForm, date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Send Via</label>
                <select value={attAlertForm.type} onChange={e => setAttAlertForm({...attAlertForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="att-alert-type">
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Class (optional)</label>
                <select value={attAlertForm.class_name} onChange={e => setAttAlertForm({...attAlertForm, class_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option value="">All Classes</option>
                  {['5','6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Section (optional)</label>
                <select value={attAlertForm.section} onChange={e => setAttAlertForm({...attAlertForm, section: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  <option value="">All Sections</option>
                  <option value="A">A</option><option value="B">B</option>
                </select>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800">Parents of students marked <strong>Absent</strong> or <strong>Late</strong> on the selected date will receive an automatic notification with their child's name and status.</p>
            </div>
            <button type="submit" disabled={sending} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60" data-testid="att-alert-submit">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Bell size={16} /> Send Attendance Alerts</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fee Reminder Modal */}
      <Dialog open={showFeeReminder} onOpenChange={setShowFeeReminder}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Send Fee Reminders</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">Send fee payment reminders to all parents.</p>
          <form onSubmit={handleFeeReminder} className="space-y-3 mt-2" data-testid="fee-reminder-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Send Via</label>
              <select value={feeForm.type} onChange={e => setFeeForm({...feeForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="fee-reminder-type">
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Custom Message (optional)</label>
              <textarea value={feeForm.message} onChange={e => setFeeForm({...feeForm, message: e.target.value})} rows={3} placeholder="Leave blank for default fee reminder message" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="fee-reminder-message" />
            </div>
            <button type="submit" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60" data-testid="fee-reminder-submit">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Phone size={16} /> Send Fee Reminders</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
