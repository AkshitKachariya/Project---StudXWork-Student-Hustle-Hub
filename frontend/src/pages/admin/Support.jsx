import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  const fetchTickets = () => {
    setLoading(true);
    api.get('/admin/support')
      .then(res => setTickets(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load tickets'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { 
    fetchTickets(); 
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReply = async (id, status) => {
    const text = replyText[id];
    if (!text && status !== 'closed') return toast.error('Enter reply text');
    try {
      await api.put(`/admin/support/${id}/reply`, { reply: text || 'Ticket closed by Admin', status });
      toast.success('Replied successfully');
      setReplyText({ ...replyText, [id]: '' });
      fetchTickets();
    } catch { toast.error('Failed to reply'); }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Support Tickets</h1>

      {loading ? <div className="neo-card p-8 animate-pulse h-32 bg-gray-100" /> :
       tickets.length === 0 ? <div className="neo-card p-12 text-center font-bold text-xl">No support tickets!</div> :
       <div className="space-y-4">
         {tickets.map(t => (
           <div key={t._id} className="neo-card p-6">
             <div className="flex justify-between items-start mb-4 border-b-2 border-brand-dark/10 pb-4">
               <div>
                 <span className={t.status === 'open' ? 'badge-pending' : 'badge-closed'}>{t.status}</span>
                 <h3 className="font-bold text-xl mt-2">{t.subject}</h3>
                 <p className="text-sm font-semibold text-brand-muted">From: {t.user?.name} ({t.user?.email})</p>
               </div>
               <span className="text-xs text-brand-muted">{new Date(t.createdAt).toLocaleDateString()}</span>
             </div>
             <p className="text-brand-dark mb-4">{t.message}</p>

             {t.replies.length > 0 && (
               <div className="bg-brand-bg p-4 mb-4 border-l-4 border-l-brand-secondary">
                 <p className="text-xs font-bold text-brand-secondary uppercase mb-1">Admin Replies:</p>
                 {t.replies.map((r, i) => <p key={i} className="text-sm mb-1 text-brand-dark font-medium">- {r.adminNote}</p>)}
               </div>
             )}

             {t.status === 'open' && (
               <div className="flex gap-2 items-center">
                 <input value={replyText[t._id] || ''} onChange={(e) => setReplyText({...replyText, [t._id]: e.target.value})} placeholder="Type reply..." className="neo-input py-2 flex-1 text-sm" />
                 <button onClick={() => handleReply(t._id, 'open')} className="neo-btn-primary px-4 py-2"><Send size={16}/> Reply</button>
                 <button onClick={() => handleReply(t._id, 'closed')} className="neo-btn-dark px-4 py-2 text-sm">Close Ticket</button>
               </div>
             )}
           </div>
         ))}
       </div>
      }
    </div>
  );
}
