import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bus, MapPin, Phone, Users } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function TransportPage() {
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [routeRes, studRes] = await Promise.all([
          axios.get(`${API}/api/transport/routes`, { headers: headers() }),
          axios.get(`${API}/api/transport/students`, { headers: headers() })
        ]);
        setRoutes(routeRes.data);
        setStudents(studRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const filteredStudents = selectedRoute ? students.filter(s => s.transport_route === selectedRoute) : students;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="transport-page">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Transport</h1>
        <p className="text-sm text-slate-500 mt-1">Routes, buses, and student mapping</p>
      </div>

      {/* Routes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((r, i) => (
          <div
            key={i}
            onClick={() => setSelectedRoute(selectedRoute === r.route_name ? '' : r.route_name)}
            className={`bg-white rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md ${selectedRoute === r.route_name ? 'border-blue-900 shadow-md' : 'border-slate-200'}`}
            data-testid={`route-${i}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center">
                <Bus size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{r.route_name}</h3>
                <p className="text-xs text-slate-500 font-mono">{r.bus_number}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /><span>{r.driver} - {r.driver_phone}</span></div>
              <div className="flex items-center gap-2"><Users size={12} className="text-slate-400" /><span>{r.students_count} students</span></div>
              <div className="flex items-start gap-2 mt-2">
                <MapPin size={12} className="text-slate-400 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {(r.stops || []).map((stop, j) => (
                    <span key={j} className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{stop}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Mapping */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>
            Student Mapping {selectedRoute && <span className="text-blue-900">- {selectedRoute}</span>}
          </h3>
          <span className="text-xs text-slate-500">{filteredStudents.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="transport-students-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Roll No</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Class</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-600">{s.roll_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.class_name}-{s.section}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">{s.transport_route}</span></td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
