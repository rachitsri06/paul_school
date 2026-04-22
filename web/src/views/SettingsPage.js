import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, School } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/settings`, { headers: headers() });
        setSettings(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/settings`, settings, { headers: headers() });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Settings</h1>
          <p className="text-sm text-slate-500 mt-1">School configuration and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors disabled:opacity-60" data-testid="save-settings-btn">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* School Info */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <School size={18} className="text-blue-900" />
          <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>School Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">School Name</label>
            <input value={settings.school_name || ''} onChange={e => setSettings({...settings, school_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="setting-school-name" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Address</label>
            <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Phone</label>
            <input value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</label>
            <input value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Principal</label>
            <input value={settings.principal || ''} onChange={e => setSettings({...settings, principal: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Academic Year</label>
            <input value={settings.academic_year || ''} onChange={e => setSettings({...settings, academic_year: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="setting-academic-year" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Motto</label>
            <input value={settings.motto || ''} onChange={e => setSettings({...settings, motto: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" />
          </div>
        </div>
      </div>

      {/* Academic Config */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Academic Configuration</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Classes</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['PG','Nursery','LKG','UKG','1st','2nd','3rd','4th','5th'].map((c, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-md">Class {c}</span>
              ))}
            </div>
          </div>
      </div>

      {/* Notification Toggles */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Email Notifications</p>
              <p className="text-xs text-slate-500">Send notifications via email</p>
            </div>
            <Switch
              checked={settings.notification_email || false}
              onCheckedChange={(v) => setSettings({...settings, notification_email: v})}
              data-testid="toggle-email"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">SMS Notifications</p>
              <p className="text-xs text-slate-500">Send notifications via SMS</p>
            </div>
            <Switch
              checked={settings.notification_sms || false}
              onCheckedChange={(v) => setSettings({...settings, notification_sms: v})}
              data-testid="toggle-sms"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">WhatsApp Notifications</p>
              <p className="text-xs text-slate-500">Send notifications via WhatsApp</p>
            </div>
            <Switch
              checked={settings.notification_whatsapp || false}
              onCheckedChange={(v) => setSettings({...settings, notification_whatsapp: v})}
              data-testid="toggle-whatsapp"
            />
          </div>
        </div>
      </div>

      {/* System User Management */}
      <UserManagementSection />
    </div>
  );
}

function UserManagementSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/api/users`, { headers: headers() });
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleReset = async (u) => {
    if (!window.confirm(`Reset password for ${u.name}?`)) return;
    setActionId(u.id);
    try {
      await axios.put(`${API}/api/users/${u.id}`, { resetPassword: true, role: u.role }, { headers: headers() });
      const defaultPassword = u.role === 'teacher' ? 'Teacher@123' : 'Parent@123';
      toast.success(`Password reset to: ${defaultPassword}`);
    } catch { toast.error('Failed to reset password'); }
    finally { setActionId(null); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete login for ${u.name}?`)) return;
    setActionId(u.id);
    try {
      await axios.delete(`${API}/api/users/${u.id}`, { headers: headers() });
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'Failed to delete user'); 
    }
    finally { setActionId(null); }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>System User Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage teacher and parent login credentials</p>
        </div>
        <button onClick={fetchUsers} className="text-xs text-blue-900 hover:underline font-semibold">Refresh List</button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-sm">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-semibold border-b">
              <tr>
                <th className="px-5 py-3">User Details</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleReset(u)}
                        disabled={actionId === u.id}
                        className="text-[10px] font-bold text-blue-900 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        Reset Password
                      </button>
                      <button 
                        onClick={() => handleDelete(u)}
                        disabled={actionId === u.id || u.role === 'admin'}
                        className="text-[10px] font-bold text-red-600 hover:text-red-500 px-2 py-1 rounded border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">No users found in database</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
