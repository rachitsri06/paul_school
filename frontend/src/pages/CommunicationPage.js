import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare, Bell, Send, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function CommunicationPage() {
  const [communications, setCommunications] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'notice', title: '', message: '', recipients: 'All Students', sender: '' });

  useEffect(() => { fetchComms(); }, []);

  const fetchComms = async () => {
    try {
      const { data } = await axios.get(`${API}/api/communications`, { headers: headers() });
      setCommunications(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/communications`, form, { headers: headers() });
      toast.success(`${form.type === 'sms' ? 'SMS' : form.type === 'whatsapp' ? 'WhatsApp message' : 'Communication'} sent (mocked)`);
      setShowNew(false);
      setForm({ type: 'notice', title: '', message: '', recipients: 'All Students', sender: '' });
      fetchComms();
    } catch { toast.error('Failed to send'); }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowNew(false); };
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
            <div>
              <h3 className="font-semibold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{c.message}</p>
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span>To: {c.recipients}</span>
                <span>From: {c.sender || 'Admin'}</span>
                <span>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${c.status === 'Sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
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
          <p className="text-sm text-slate-500 mt-1">Inbox, notice board & broadcast messages</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="new-message-btn">
          <Plus size={16} /> New Message
        </button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="inbox" data-testid="tab-inbox"><MessageSquare size={14} className="mr-1.5" /> Inbox ({filterByType('inbox').length})</TabsTrigger>
          <TabsTrigger value="notices" data-testid="tab-notices"><Bell size={14} className="mr-1.5" /> Notices ({filterByType('notice').length})</TabsTrigger>
          <TabsTrigger value="sms" data-testid="tab-sms"><Send size={14} className="mr-1.5" /> SMS/WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox"><CommList items={filterByType('inbox')} /></TabsContent>
        <TabsContent value="notices"><CommList items={filterByType('notice')} /></TabsContent>
        <TabsContent value="sms"><CommList items={[...filterByType('sms'), ...filterByType('whatsapp')]} /></TabsContent>
      </Tabs>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>New Message</DialogTitle></DialogHeader>
          <form onSubmit={handleSend} className="space-y-3" data-testid="comm-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="comm-type">
                <option value="notice">Notice</option>
                <option value="inbox">Inbox Message</option>
                <option value="sms">SMS Blast</option>
                <option value="whatsapp">WhatsApp Blast</option>
              </select>
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
                  <option>All Students</option><option>All Parents</option><option>All Staff</option><option>All</option><option>Class 10-A Parents</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sender</label>
                <input value={form.sender} onChange={e => setForm({...form, sender: e.target.value})} placeholder="Principal" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2" data-testid="comm-submit">
              <Send size={16} /> {form.type === 'sms' ? 'Send SMS (Mocked)' : form.type === 'whatsapp' ? 'Send WhatsApp (Mocked)' : 'Send'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
