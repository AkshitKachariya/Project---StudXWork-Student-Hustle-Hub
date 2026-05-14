import React, { useEffect, useState } from 'react';
import { Star, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = () => {
    setLoading(true);
    api.get('/ratings/all')
      .then(res => setRatings(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load ratings'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { 
    fetchRatings(); 
    const interval = setInterval(fetchRatings, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleApproval = async (id) => {
    try {
      await api.put(`/ratings/${id}/toggle`);
      toast.success('Rating visibility toggled');
      fetchRatings();
    } catch { toast.error('Failed to toggle'); }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Ratings & Reviews Moderation</h1>

      {loading ? <div className="neo-card p-8 animate-pulse h-32 bg-gray-100" /> :
       ratings.length === 0 ? <div className="neo-card p-12 text-center font-bold text-xl">No ratings found</div> :
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {ratings.map(r => (
           <div key={r._id} className="neo-card p-5">
             <div className="flex justify-between items-start mb-3">
               <div>
                 <p className="font-bold text-sm text-brand-muted">Reviewer: {r.reviewer?.name}</p>
                 <p className="font-bold text-sm text-brand-muted">Reviewee: {r.reviewee?.name}</p>
               </div>
               <div className="flex items-center gap-1 bg-brand-accent px-2 py-1 border-2 border-brand-dark font-black text-sm">
                 <Star size={14} className="fill-brand-dark" /> {r.rating}
               </div>
             </div>
             <p className="font-medium text-brand-dark mb-4">"{r.comment}"</p>
             <div className="flex items-center justify-between border-t-2 border-brand-dark/10 pt-3">
               <span className={`text-xs font-bold px-2 py-1 ${r.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                 {r.isApproved ? 'Visible (Approved)' : 'Hidden (Rejected)'}
               </span>
               <button onClick={() => toggleApproval(r._id)} className={`neo-btn px-3 py-1 text-xs ${r.isApproved ? 'bg-brand-warning' : 'bg-brand-success text-white'}`}>
                 {r.isApproved ? <><ShieldAlert size={14}/> Hide</> : <><CheckCircle size={14}/> Approve</>}
               </button>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  );
}
