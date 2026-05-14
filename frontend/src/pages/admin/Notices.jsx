import React, { useEffect, useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  const fetchNotices = () => {
    setLoading(true);
    api.get('/notices')
      .then(res => setNotices(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load notices'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchNotices(); }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/admin/notice', data);
      toast.success('Notice broadcasted!');
      reset(); fetchNotices();
    } catch { toast.error('Failed to broadcast'); }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try { 
      await api.delete(`/notices/${id}`); 
      toast.success('Deleted'); 
      fetchNotices(); 
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to delete'); 
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Broadcast Notices</h1>

      <div className="neo-card p-6 mb-8 max-w-2xl bg-brand-bg">
        <h2 className="text-xl font-black uppercase mb-4">Create New Notice</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Title</label>
            <input {...register('title', { required: true })} className="neo-input" placeholder="e.g. System Maintenance" />
          </div>
          <div>
            <label className="block font-bold mb-1">Content</label>
            <textarea {...register('content', { required: true })} rows={3} className="neo-input resize-none" placeholder="Notice details..." />
          </div>
          <div>
            <label className="block font-bold mb-1">Target Audience</label>
            <select {...register('target')} className="neo-input">
              <option value="all">Everyone</option>
              <option value="student">Students Only</option>
              <option value="recruiter">Recruiters Only</option>
            </select>
          </div>
          <button type="submit" className="neo-btn-primary w-full py-3"><Send size={18}/> Broadcast Notice</button>
        </form>
      </div>

      <h2 className="text-xl font-black uppercase mb-4">Recent Notices</h2>
      {loading ? <div className="neo-card p-8 animate-pulse h-24 bg-gray-100" /> :
       notices.length === 0 ? <p className="font-bold text-brand-muted">No notices found</p> :
       <div className="space-y-3">
         {notices.map(n => (
           <div key={n._id} className="neo-card p-5 flex justify-between items-start border-l-5 border-l-brand-dark">
             <div>
               <h3 className="font-bold text-lg">{n.title}</h3>
               <span className="neo-badge text-xs bg-gray-200 mt-1 mb-2">Target: {n.target}</span>
               <p className="text-brand-muted text-sm">{n.content}</p>
             </div>
             <button onClick={() => deleteNotice(n._id)} className="neo-btn bg-red-50 text-red-600 px-3 py-2"><Trash2 size={16}/></button>
           </div>
         ))}
       </div>
      }
    </div>
  );
}
