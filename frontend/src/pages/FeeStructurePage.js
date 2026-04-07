import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function FeeStructurePage() {
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/fees/structure`, { headers: headers() });
        setStructure(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="fee-structure-page">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Fee Structure</h1>
        <p className="text-sm text-slate-500 mt-1">Class-wise fee breakdown for Academic Year 2025-2026</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="fee-structure-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Class</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Tuition</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Transport</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Books</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Activity</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {structure.map(f => (
                <tr key={f.class_name} className="hover:bg-slate-50" data-testid={`fee-struct-${f.class_name}`}>
                  <td className="px-4 py-3 font-semibold text-blue-900">Class {f.class_name}</td>
                  <td className="px-4 py-3 text-right text-slate-600">Rs {f.tuition?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">Rs {f.transport?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">Rs {f.books?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">Rs {f.activity?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">Rs {f.total?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concessions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-3" style={{ fontFamily: 'Manrope' }}>Available Concessions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Sibling Discount: 10%', 'Merit Scholarship: 15%', 'Staff Ward: 25%'].map((c, i) => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3" data-testid={`concession-${i}`}>
              <p className="text-sm font-semibold text-blue-900">{c.split(':')[0]}</p>
              <p className="text-xl font-bold text-blue-800 mt-1">{c.split(':')[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
