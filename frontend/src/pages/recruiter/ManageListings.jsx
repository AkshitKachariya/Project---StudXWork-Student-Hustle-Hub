import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TASK_STATUS_MAP = {
  open:        { cls: 'badge-open', label: 'Open' },
  in_bidding:  { cls: 'neo-badge bg-purple-100 text-purple-800', label: 'In Bidding' },
  assigned:    { cls: 'neo-badge bg-indigo-100 text-indigo-800', label: 'Assigned' },
  in_progress: { cls: 'badge-pending', label: 'In Progress' },
  submitted:   { cls: 'neo-badge bg-blue-100 text-blue-800', label: 'Submitted' },
  review:      { cls: 'neo-badge bg-orange-100 text-orange-800', label: 'Review' },
  revision:    { cls: 'neo-badge bg-amber-100 text-amber-800', label: 'Revision' },
  completed:   { cls: 'badge-accepted', label: 'Completed' },
  rejected:    { cls: 'badge-rejected', label: 'Rejected' },
};

export default function ManageListings() {
  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, j] = await Promise.all([api.get('/tasks/my'), api.get('/jobs/my')]);
      setTasks(t.data.data || []);
      setJobs(j.data.data || []);
    } catch { toast.error('Failed to load listings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(() => {
      api.get('/tasks/my').then(t => setTasks(t.data.data || [])).catch(() => {});
      api.get('/jobs/my').then(j => setJobs(j.data.data || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted'); fetchData();
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await api.delete(`/jobs/${id}`);
    toast.success('Job deleted'); fetchData();
  };

  const items = tab === 'tasks' ? tasks : jobs;

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-dark text-white mb-2">Management</div>
        <h1 className="page-title">My Listings</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setTab('tasks')} className={`neo-btn px-6 py-2 ${tab === 'tasks' ? 'bg-brand-dark text-white' : 'bg-white'}`}>
          Tasks ({tasks.length})
        </button>
        <button onClick={() => setTab('jobs')} className={`neo-btn px-6 py-2 ${tab === 'jobs' ? 'bg-brand-dark text-white' : 'bg-white'}`}>
          Jobs ({jobs.length})
        </button>
      </div>

      {loading ? <div className="neo-card p-8 animate-pulse h-24 bg-gray-100" /> :
       items.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <p className="text-2xl font-bold">No {tab} posted yet</p>
        </div>
       ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const statusInfo = tab === 'tasks' ? (TASK_STATUS_MAP[item.status] || { cls: 'neo-badge', label: item.status }) : null;
            const hasWorkflow = tab === 'tasks' && !['open', 'in_bidding'].includes(item.status) && item.status !== 'cancelled';
            const canDelete = tab === 'tasks' ? ['open', 'in_bidding'].includes(item.status) : true;
            
            return (
              <motion.div key={item._id} whileHover={{ x: 4 }} className="neo-card p-5 flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-brand-muted flex-wrap">
                    {tab === 'tasks' ? (
                      <span className={statusInfo.cls}>{statusInfo.label}</span>
                    ) : (
                      <span className={item.status === 'active' ? 'badge-open' : 'badge-closed'}>{item.status}</span>
                    )}
                    {item.budget && <span className="font-semibold">₹{item.budget}</span>}
                    {item.escrowAmount > 0 && <span className="font-semibold text-brand-success">Escrow: ₹{item.escrowAmount}</span>}
                    {item.type && <span className="font-semibold capitalize">{item.type}</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasWorkflow && (
                    <Link to={`/recruiter/review/${item._id}`}
                      className="neo-btn bg-brand-primary text-white px-3 py-2 text-sm flex items-center gap-1">
                      <Eye size={16} /> Review
                    </Link>
                  )}
                  {canDelete && (
                    <button onClick={() => tab === 'tasks' ? deleteTask(item._id) : deleteJob(item._id)}
                      className="neo-btn bg-red-50 text-red-600 border-red-300 px-3 py-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
