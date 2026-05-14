import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, DollarSign, Tag, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ApplyModal from '../../components/ApplyModal';
import { Eye } from 'lucide-react';

export default function BrowseTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?page=${page}&limit=9&search=${search}`);
      setTasks(res.data.data.docs || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [page, search]);

  const statusColor = { 
    open: 'badge-open', 
    in_bidding: 'neo-badge bg-purple-100 text-purple-800',
    'in-progress': 'badge-pending', 
    in_progress: 'badge-pending', 
    assigned: 'neo-badge bg-indigo-100 text-indigo-800',
    submitted: 'neo-badge bg-blue-100 text-blue-800',
    review: 'neo-badge bg-orange-100 text-orange-800',
    revision: 'neo-badge bg-amber-100 text-amber-800',
    completed: 'badge-accepted',
    rejected: 'badge-rejected'
  };

  return (
    <div>
      <div className="section-header mb-6">
        <div>
          <div className="neo-badge bg-brand-primary text-white mb-2">Tasks Marketplace</div>
          <h1 className="page-title">Browse Mini Tasks</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="neo-input pl-12" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse h-48 bg-gray-100" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <p className="text-2xl font-bold">No tasks found</p>
          <p className="text-brand-muted mt-2">Check back later or try a different search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <motion.div key={task._id} whileHover={{ y: -4 }} className="neo-card p-6 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={statusColor[task.status] || 'neo-badge'}>{task.status}</span>
                <span className="font-black text-xl text-brand-primary flex items-center gap-1">₹{task.budget}</span>
              </div>
              <h3 className="text-lg font-bold mb-2 line-clamp-2">{task.title}</h3>
              <p className="text-brand-muted text-sm mb-4 flex-1 line-clamp-3">{task.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {task.skills?.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs neo-badge bg-brand-bg">{s}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-brand-muted border-t-2 border-brand-dark/10 pt-3">
                <span className="font-medium">{task.recruiter?.companyName || task.recruiter?.name}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(task.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to={`/student/tasks/${task._id}`} className="neo-btn bg-white border-brand-dark flex-1 flex items-center justify-center gap-2">
                  <Eye size={16} /> Details
                </Link>
                {(task.status === 'open' || task.status === 'in_bidding') && (
                  task.hasApplied ? (
                    <Link to="/student/applications" className="neo-btn bg-green-50 text-brand-success border-brand-success flex-1 flex items-center justify-center gap-2 hover:bg-brand-success hover:text-white transition-all text-[13px] whitespace-nowrap">
                      <CheckCircle size={14} /> Tracking
                    </Link>
                  ) : (
                    <button onClick={() => setSelected({ ...task, type: 'task' })} className="neo-btn-accent flex-1 flex items-center justify-center gap-2">
                      Apply Now
                    </button>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-3 justify-center mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`neo-btn px-4 py-2 ${page === i + 1 ? 'bg-brand-dark text-white' : 'bg-white'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selected && <ApplyModal item={selected} onClose={() => setSelected(null)} onSuccess={fetchTasks} />}
    </div>
  );
}
