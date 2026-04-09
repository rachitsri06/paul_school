import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BookOpen, Plus, Search, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [issued, setIssued] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Textbook', total_copies: '', available_copies: '' });
  const [issueForm, setIssueForm] = useState({ book_id: '', student_id: '', student_name: '', issue_date: new Date().toISOString().split('T')[0], due_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bRes, iRes, sRes] = await Promise.all([
        axios.get(`${API}/api/library/books?search=${search}`, { headers: headers() }),
        axios.get(`${API}/api/library/issued`, { headers: headers() }),
        axios.get(`${API}/api/students`, { headers: headers() })
      ]);
      setBooks(bRes.data);
      setIssued(iRes.data);
      setStudents(sRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/library/books`, { ...bookForm, total_copies: parseInt(bookForm.total_copies), available_copies: parseInt(bookForm.available_copies) }, { headers: headers() });
      toast.success('Book added');
      setShowAddBook(false);
      fetchData();
    } catch { toast.error('Failed to add book'); }
  };

  const issueBook = async (e) => {
    e.preventDefault();
    try {
      const student = students.find(s => s._id === issueForm.student_id);
      await axios.post(`${API}/api/library/issue`, { ...issueForm, student_name: student?.name || '' }, { headers: headers() });
      toast.success('Book issued');
      setShowIssue(false);
      fetchData();
    } catch { toast.error('Failed to issue book'); }
  };

  const returnBook = async (issueId) => {
    try {
      await axios.post(`${API}/api/library/return/${issueId}`, {}, { headers: headers() });
      toast.success('Book returned');
      fetchData();
    } catch { toast.error('Failed to return book'); }
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setShowAddBook(false); setShowIssue(false); } };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="library-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope' }}>Library</h1>
          <p className="text-sm text-slate-500 mt-1">{books.length} books in inventory | {issued.filter(i => i.status === 'Issued').length} currently issued</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddBook(true)} className="bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="add-book-btn">
            <Plus size={16} /> Add Book
          </button>
          <button onClick={() => setShowIssue(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2 text-sm flex items-center gap-2 transition-colors" data-testid="issue-book-btn">
            <BookOpen size={16} /> Issue Book
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-900 outline-none" data-testid="library-search" />
      </div>

      {/* Book Inventory */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200"><h3 className="font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Book Inventory</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="books-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Author</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">ISBN</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest text-center">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.map(b => (
                <tr key={b._id} className="hover:bg-slate-50" data-testid={`book-${b.isbn}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{b.title}</td>
                  <td className="px-4 py-3 text-slate-600">{b.author}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.isbn}</td>
                  <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">{b.category}</span></td>
                  <td className="px-4 py-3 text-center text-slate-600">{b.total_copies}</td>
                  <td className="px-4 py-3 text-center font-semibold"><span className={b.available_copies > 0 ? 'text-emerald-600' : 'text-red-600'}>{b.available_copies}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issued Books */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200"><h3 className="font-bold text-slate-900" style={{ fontFamily: 'Manrope' }}>Issued Books</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="issued-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Issue Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Due Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issued.map(i => (
                <tr key={i._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{i.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{i.issue_date}</td>
                  <td className="px-4 py-3 text-slate-600">{i.due_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${i.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{i.status}</span></td>
                  <td className="px-4 py-3">{i.status === 'Issued' && (
                    <button onClick={() => returnBook(i._id)} className="text-blue-900 hover:text-blue-700 text-xs font-medium flex items-center gap-1" data-testid={`return-${i._id}`}><RotateCcw size={12} /> Return</button>
                  )}</td>
                </tr>
              ))}
              {issued.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No issued books</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Book Modal */}
      <Dialog open={showAddBook} onOpenChange={setShowAddBook}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Add Book</DialogTitle></DialogHeader>
          <form onSubmit={addBook} className="space-y-3" data-testid="add-book-form">
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Title *</label><input required value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="book-title" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Author</label><input value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">ISBN</label><input value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Category</label>
                <select value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1">
                  {['Textbook','Reference','Fiction','Biography','Science','History','Philosophy'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Copies</label><input type="number" value={bookForm.total_copies} onChange={e => setBookForm({...bookForm, total_copies: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
            </div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Available Copies</label><input type="number" value={bookForm.available_copies} onChange={e => setBookForm({...bookForm, available_copies: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="book-submit">Add Book</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Book Modal */}
      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Manrope' }}>Issue Book</DialogTitle></DialogHeader>
          <form onSubmit={issueBook} className="space-y-3" data-testid="issue-book-form">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Book</label>
              <select required value={issueForm.book_id} onChange={e => setIssueForm({...issueForm, book_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="issue-book-select">
                <option value="">Select Book</option>
                {books.filter(b => b.available_copies > 0).map(b => <option key={b._id} value={b._id}>{b.title} ({b.available_copies} available)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Student</label>
              <select required value={issueForm.student_id} onChange={e => setIssueForm({...issueForm, student_id: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" data-testid="issue-student-select">
                <option value="">Select Student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} (Class {s.class_name})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Issue Date</label><input type="date" value={issueForm.issue_date} onChange={e => setIssueForm({...issueForm, issue_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
              <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Due Date</label><input type="date" value={issueForm.due_date} onChange={e => setIssueForm({...issueForm, due_date: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1" /></div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md px-4 py-2.5 text-sm transition-colors" data-testid="issue-submit">Issue Book</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
