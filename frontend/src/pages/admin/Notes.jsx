import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = () => {
    setLoading(true);
    api.get('/admin/notes/pending')
      .then(res => setNotes(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load pending notes'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchNotes(); }, []);

  // Live reload every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchNotes(), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') await api.put(`/admin/notes/${id}/approve`);
      else await api.delete(`/admin/notes/${id}/reject`);
      toast.success(action === 'approve' ? 'Note Approved' : 'Note Rejected');
      fetchNotes();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Pending Notes Moderation</h1>
      <div className="neo-card overflow-x-auto">
        <table className="neo-table">
          <thead><tr><th>Title / Subject</th><th>Uploader</th><th>Price</th><th>File</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr> :
             notes.length === 0 ? <tr><td colSpan="5" className="text-center py-8 font-bold">No pending notes</td></tr> :
             notes.map(n => (
              <tr key={n._id}>
                <td><p className="font-bold">{n.title}</p><span className="text-xs text-brand-muted">{n.subject}</span></td>
                <td>{n.uploader?.name}</td>
                <td className="font-bold">{n.price > 0 ? `₹${n.price}` : 'Free'}</td>
                <td>
                  <a href={n.fileUrl} target="_blank" rel="noreferrer" className="neo-btn-secondary px-3 py-1 text-xs">
                    <ExternalLink size={14} /> View
                  </a>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(n._id, 'approve')} className="neo-btn-success px-2 py-1"><CheckCircle size={14}/></button>
                    <button onClick={() => handleAction(n._id, 'reject')} className="neo-btn-danger px-2 py-1"><XCircle size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

