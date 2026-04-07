import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ClipboardCheck, GraduationCap, DollarSign, BookOpen, Bell, Bus, ChevronDown, Calendar, Heart, Phone, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childDetail, setChildDetail] = useState(null);
  const [homework, setHomework] = useState([]);
  const [notices, setNotices] = useState([]);
  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [childRes, hwRes, noticeRes, transRes] = await Promise.all([
          axios.get(`${API}/api/parent/children`, { headers: headers() }),
          axios.get(`${API}/api/parent/homework`, { headers: headers() }),
          axios.get(`${API}/api/parent/notices`, { headers: headers() }),
          axios.get(`${API}/api/parent/transport`, { headers: headers() }),
        ]);
        setChildren(childRes.data);
        setHomework(hwRes.data);
        setNotices(noticeRes.data);
        setTransport(transRes.data);
        if (childRes.data.length > 0) {
          setSelectedChild(childRes.data[0]._id);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const fetchChildDetail = useCallback(async (childId) => {
    if (!childId) return;
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/parent/child/${childId}`, { headers: headers() });
      setChildDetail(data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedChild) fetchChildDetail(selectedChild);
  }, [selectedChild, fetchChildDetail]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  const attendanceStats = childDetail ? {
    present: (childDetail.attendance_history || []).filter(a => a.status === 'Present').length,
    absent: (childDetail.attendance_history || []).filter(a => a.status === 'Absent').length,
    late: (childDetail.attendance_history || []).filter(a => a.status === 'Late').length,
    leave: (childDetail.attendance_history || []).filter(a => a.status === 'Leave').length,
  } : { present: 0, absent: 0, late: 0, leave: 0 };

  const totalDays = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.leave;
  const attendancePct = totalDays > 0 ? Math.round(attendanceStats.present / totalDays * 100) : 0;

  const totalFees = (childDetail?.fee_history || []).reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="parent-dashboard-page">
      {/* Welcome + Child Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>
            Welcome, {user?.name || 'Parent'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {children.length > 1 ? `You have ${children.length} children enrolled` : 'Parent Portal - St. Paul\'s School'}
          </p>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="relative" data-testid="child-selector">
            <select
              value={selectedChild || ''}
              onChange={e => setSelectedChild(e.target.value)}
              className="pl-10 pr-8 py-2.5 border-2 border-blue-900 rounded-lg text-sm font-semibold text-blue-900 bg-blue-50 appearance-none focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer"
              data-testid="child-select"
            >
              {children.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} - Class {c.class_name}-{c.section}
                </option>
              ))}
            </select>
            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-900" />
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-900" />
          </div>
        )}
      </div>

      {/* Children Cards (if multiple) */}
      {children.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="children-cards">
          {children.map(c => (
            <div
              key={c._id}
              onClick={() => setSelectedChild(c._id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedChild === c._id ? 'border-blue-900 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-blue-300'}`}
              data-testid={`child-card-${c.roll_no}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  {c.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">Class {c.class_name}-{c.section} | Roll: {c.roll_no}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : childDetail ? (
        <>
          {/* Child Profile Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5" data-testid="child-profile-card">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {childDetail.name[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Manrope' }}>{childDetail.name}</h2>
                <p className="text-sm text-slate-500">Class {childDetail.class_name}-{childDetail.section} | Roll No: {childDetail.roll_no}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /><span>{childDetail.dob}</span></div>
                  <div className="flex items-center gap-1.5"><Heart size={13} className="text-slate-400" /><span>{childDetail.blood_group || 'N/A'}</span></div>
                  <div className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /><span>{childDetail.phone}</span></div>
                  <div className="flex items-center gap-1.5"><Bus size={13} className="text-slate-400" /><span>{childDetail.transport_route || 'None'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="parent-stats">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <ClipboardCheck size={20} className="mx-auto text-emerald-600 mb-1" />
              <p className="text-xl font-bold text-emerald-700">{attendancePct}%</p>
              <p className="text-xs text-emerald-600 font-semibold">Attendance</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <GraduationCap size={20} className="mx-auto text-blue-600 mb-1" />
              <p className="text-xl font-bold text-blue-700">{(childDetail.grades || []).length}</p>
              <p className="text-xs text-blue-600 font-semibold">Subjects Graded</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <DollarSign size={20} className="mx-auto text-amber-600 mb-1" />
              <p className="text-xl font-bold text-amber-700">Rs {totalFees.toLocaleString()}</p>
              <p className="text-xs text-amber-600 font-semibold">Fees Paid</p>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
              <BookOpen size={20} className="mx-auto text-violet-600 mb-1" />
              <p className="text-xl font-bold text-violet-700">{homework.length}</p>
              <p className="text-xs text-violet-600 font-semibold">Homework</p>
            </div>
          </div>

          {/* Tabs: Attendance, Grades, Fees, Homework, Notices, Transport */}
          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="bg-slate-100 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="attendance" data-testid="parent-tab-attendance"><ClipboardCheck size={14} className="mr-1" />Attendance</TabsTrigger>
              <TabsTrigger value="grades" data-testid="parent-tab-grades"><GraduationCap size={14} className="mr-1" />Grades</TabsTrigger>
              <TabsTrigger value="fees" data-testid="parent-tab-fees"><DollarSign size={14} className="mr-1" />Fees</TabsTrigger>
              <TabsTrigger value="homework" data-testid="parent-tab-homework"><BookOpen size={14} className="mr-1" />Homework</TabsTrigger>
              <TabsTrigger value="notices" data-testid="parent-tab-notices"><Bell size={14} className="mr-1" />Notices</TabsTrigger>
              <TabsTrigger value="transport" data-testid="parent-tab-transport"><Bus size={14} className="mr-1" />Transport</TabsTrigger>
            </TabsList>

            {/* Attendance Tab */}
            <TabsContent value="attendance">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Attendance Record</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">{attendanceStats.present}</p>
                    <p className="text-xs text-emerald-600 font-semibold">Present</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{attendanceStats.absent}</p>
                    <p className="text-xs text-red-500 font-semibold">Absent</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">{attendanceStats.late}</p>
                    <p className="text-xs text-amber-500 font-semibold">Late</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{attendanceStats.leave}</p>
                    <p className="text-xs text-blue-500 font-semibold">Leave</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{attendancePct}%</p>
                    <p className="text-xs text-slate-500 font-semibold">Rate</p>
                  </div>
                </div>
                {(childDetail.attendance_history || []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No attendance records yet</p>
                ) : (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm" data-testid="parent-attendance-table">
                      <thead className="bg-slate-50 sticky top-0"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(childDetail.attendance_history || []).slice(0, 30).map((a, i) => (
                          <tr key={i}><td className="px-3 py-2 text-slate-600">{a.date}</td><td className="px-3 py-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Absent' ? 'bg-red-100 text-red-800' : a.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{a.status}</span></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Grades Tab */}
            <TabsContent value="grades">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Report Card</h3>
                {(childDetail.grades || []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No grades available yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="parent-grades-table">
                      <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Subject</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Exam</th><th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Marks</th><th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Max</th><th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Grade</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(childDetail.grades || []).map((g, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-slate-800">{g.subject}</td>
                            <td className="px-3 py-2 text-slate-600">{g.exam}</td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-900">{g.marks_obtained}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{g.max_marks}</td>
                            <td className="px-3 py-2 text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${g.grade === 'A+' || g.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : g.grade === 'B+' || g.grade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{g.grade}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Total & Percentage */}
                    {(childDetail.grades || []).length > 0 && (() => {
                      const total = childDetail.grades.reduce((s, g) => s + (g.marks_obtained || 0), 0);
                      const maxTotal = childDetail.grades.reduce((s, g) => s + (g.max_marks || 0), 0);
                      const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : 0;
                      return (
                        <div className="flex justify-end gap-4 mt-3 pt-3 border-t border-slate-200">
                          <span className="text-sm font-semibold text-slate-600">Total: <strong className="text-slate-900">{total}/{maxTotal}</strong></span>
                          <span className="text-sm font-semibold text-slate-600">Percentage: <strong className="text-blue-900">{pct}%</strong></span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Fee History</h3>
                {(childDetail.fee_history || []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No fee records yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="parent-fees-table">
                      <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Month</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Mode</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Type</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(childDetail.fee_history || []).map((f, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-slate-600">{f.month}</td>
                            <td className="px-3 py-2 font-semibold text-slate-900">Rs {f.amount?.toLocaleString()}</td>
                            <td className="px-3 py-2 text-slate-600">{f.payment_mode}</td>
                            <td className="px-3 py-2 text-slate-600">{f.fee_type}</td>
                            <td className="px-3 py-2"><span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">{f.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-3 pt-3 border-t border-slate-200">
                      <span className="text-sm font-semibold text-slate-600">Total Paid: <strong className="text-emerald-700">Rs {totalFees.toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Homework Tab */}
            <TabsContent value="homework">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Homework</h3>
                {homework.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No homework assigned</p>
                ) : (
                  <div className="space-y-3">
                    {homework.map(hw => (
                      <div key={hw._id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors" data-testid={`parent-hw-${hw._id}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{hw.title}</p>
                            <p className="text-sm text-slate-500 mt-1">{hw.description}</p>
                            <div className="flex gap-3 mt-2 text-xs text-slate-400">
                              <span className="bg-slate-100 px-2 py-0.5 rounded">{hw.subject}</span>
                              <span>Class {hw.class_name}-{hw.section}</span>
                              <span>Due: {hw.due_date}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded ${hw.status === 'Active' ? 'bg-blue-100 text-blue-800' : hw.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{hw.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notices Tab */}
            <TabsContent value="notices">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>School Notices</h3>
                {notices.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No notices</p>
                ) : (
                  <div className="space-y-3">
                    {notices.map(n => (
                      <div key={n._id} className="border-l-3 border-blue-900 pl-4 py-2" data-testid={`parent-notice-${n._id}`}>
                        <p className="font-semibold text-slate-900">{n.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                        <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                          <span>From: {n.sender || 'School'}</span>
                          <span>{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Transport Tab */}
            <TabsContent value="transport">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Transport Details</h3>
                {transport.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No transport route assigned</p>
                ) : (
                  <div className="space-y-4">
                    {transport.map((r, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-4" data-testid={`parent-route-${i}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center">
                            <Bus size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{r.route_name}</p>
                            <p className="text-xs text-slate-500 font-mono">{r.bus_number}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><span className="text-slate-400">Driver:</span><span>{r.driver}</span></div>
                          <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /><span>{r.driver_phone}</span></div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Stops</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(r.stops || []).map((stop, j) => (
                              <span key={j} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                                <MapPin size={10} />{stop}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No children linked to your account. Please contact the school administration.</p>
        </div>
      )}
    </div>
  );
}
