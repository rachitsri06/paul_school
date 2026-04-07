import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, MapPin, Calendar, Heart, Bus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/students/${id}`, { headers: headers() });
        setStudent(data);
      } catch { navigate('/students'); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return null;

  const attendanceStats = {
    present: (student.attendance_history || []).filter(a => a.status === 'Present').length,
    absent: (student.attendance_history || []).filter(a => a.status === 'Absent').length,
    late: (student.attendance_history || []).filter(a => a.status === 'Late').length,
    leave: (student.attendance_history || []).filter(a => a.status === 'Leave').length,
  };
  const totalDays = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.leave;
  const attendancePct = totalDays > 0 ? Math.round(attendanceStats.present / totalDays * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="student-profile-page">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-900 transition-colors" data-testid="back-btn">
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {student.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: 'Manrope' }}>{student.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Class {student.class_name}-{student.section} | Roll No: {student.roll_no}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={14} className="text-slate-400" />
                <span>{student.gender}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={14} className="text-slate-400" />
                <span>{student.dob}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Heart size={14} className="text-slate-400" />
                <span>{student.blood_group || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Bus size={14} className="text-slate-400" />
                <span>{student.transport_route || 'None'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="text-slate-400" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                <MapPin size={14} className="text-slate-400" />
                <span>{student.address}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-sm text-slate-600">
              <span>Father: <strong>{student.father_name}</strong></span>
              <span>Mother: <strong>{student.mother_name}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="grades" data-testid="tab-grades">Grades</TabsTrigger>
          <TabsTrigger value="fees" data-testid="tab-fees">Fee History</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Monthly Attendance</h3>
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
            {(student.attendance_history || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Date</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(student.attendance_history || []).slice(0, 30).map((a, i) => (
                      <tr key={i}><td className="px-3 py-2 text-slate-600">{a.date}</td><td className="px-3 py-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${a.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Absent' ? 'bg-red-100 text-red-800' : a.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{a.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grades">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Academic History</h3>
            {(student.grades || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No grade records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Subject</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Exam</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Marks</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Grade</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(student.grades || []).map((g, i) => (
                      <tr key={i}><td className="px-3 py-2 text-slate-800 font-medium">{g.subject}</td><td className="px-3 py-2 text-slate-600">{g.exam}</td><td className="px-3 py-2 text-slate-600">{g.marks_obtained}/{g.max_marks}</td><td className="px-3 py-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${g.grade === 'A+' || g.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : g.grade === 'B+' || g.grade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{g.grade}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope' }}>Fee History</h3>
            {(student.fee_history || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No fee records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Month</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Mode</th><th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(student.fee_history || []).map((f, i) => (
                      <tr key={i}><td className="px-3 py-2 text-slate-600">{f.month}</td><td className="px-3 py-2 text-slate-800 font-medium">Rs {f.amount?.toLocaleString()}</td><td className="px-3 py-2 text-slate-600">{f.payment_mode}</td><td className="px-3 py-2"><span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">{f.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
