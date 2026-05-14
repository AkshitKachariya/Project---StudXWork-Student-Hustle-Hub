import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Upload, BookOpen, Lock, Link2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function BrowseNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', description: '', price: 0, fileUrl: '' });
  const { user } = useAuthStore();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notes?search=${search}`);
      setNotes(res.data.data.docs || []);
    } catch { toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, [search]);

  // Live reload every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchNotes(), 30000);
    return () => clearInterval(interval);
  }, [search]);

  const handleBuy = async (note) => {
    if (note.price > 0) {
      if (!window.confirm(`Buy this note for ₹${note.price}?`)) return;
    }
    try {
      const res = await api.post(`/notes/${note._id}/buy`);
      toast.success('Download ready!');
      window.open(res.data.fileUrl, '_blank');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to buy note'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.fileUrl) return toast.error('Please provide a file URL');
    setUploading(true);
    try {
      await api.post('/notes', form);
      toast.success('Note submitted for approval!');
      setShowUpload(false);
      setForm({ title: '', subject: '', description: '', price: 0, fileUrl: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div className="section-header mb-6">
        <div>
          <div className="neo-badge bg-brand-secondary text-white mb-2">Knowledge Hub</div>
          <h1 className="page-title">Study Notes</h1>
        </div>
        <button onClick={() => setShowUpload(true)} className="neo-btn-accent">
          <Upload size={16} /> Upload Note
        </button>
      </div>

      <div className="relative mb-6 max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="neo-input pl-12" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse h-44 bg-gray-100" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-brand-muted" />
          <p className="text-2xl font-bold">No notes available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {notes.map((note) => (
            <motion.div key={note._id} whileHover={{ y: -4 }} className="neo-card p-5 flex flex-col">
              <div className="w-10 h-10 bg-brand-secondary/10 border-3 border-brand-dark flex items-center justify-center mb-3">
                <BookOpen size={20} className="text-brand-secondary" />
              </div>
              <h3 className="font-bold text-base mb-1 line-clamp-2">{note.title}</h3>
              <span className="neo-badge bg-brand-accent text-[10px] mb-2 self-start">{note.subject}</span>
              <p className="text-xs text-brand-muted mb-1">By: {note.uploader?.name}</p>
              <p className="text-xs text-brand-muted mb-4">{note.downloads} downloads</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-brand-dark/10">
                <span className="font-black text-lg">{note.price === 0 ? 'FREE' : `₹${note.price}`}</span>
                <button onClick={() => handleBuy(note)} className={`neo-btn px-3 py-2 text-sm ${note.price > 0 ? 'bg-brand-primary text-white' : 'bg-brand-success text-white'}`}>
                  {note.price > 0 ? <><Lock size={14} /> Buy</> : <><Download size={14} /> Free</>}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="neo-card bg-white w-full max-w-lg p-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-black uppercase mb-6">Upload Study Note</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Note Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="neo-input" placeholder="e.g. Data Structures Complete Guide" required />
              </div>
              <div>
                <label className="block font-bold mb-1">Subject / Topic</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="neo-input" placeholder="e.g. Computer Science" required />
              </div>
              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="neo-input resize-none" placeholder="Brief description..." />
              </div>
              <div>
                <label className="block font-bold mb-1">Price (₹) — 0 for Free</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="neo-input" />
              </div>
              <div>
                <label className="block font-bold mb-1">File URL (Google Drive, Dropbox, etc.)</label>
                <div className="flex items-center gap-2">
                  <Link2 size={18} className="text-brand-muted shrink-0" />
                  <input 
                    type="url" 
                    value={form.fileUrl} 
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} 
                    className="neo-input" 
                    placeholder="https://drive.google.com/file/d/..." 
                    required 
                  />
                </div>
                <p className="text-[10px] text-brand-muted mt-1">Paste a publicly accessible link to your PDF, DOC, or PPT file</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="neo-btn-white flex-1">Cancel</button>
                <button type="submit" disabled={uploading} className="neo-btn-secondary flex-1">{uploading ? 'Submitting...' : 'Submit for Approval'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
