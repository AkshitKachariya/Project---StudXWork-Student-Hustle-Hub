import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, CheckCircle, XCircle, RotateCcw, Send, Activity, ArrowRight, Briefcase } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

const STATUS_CONFIG = {
  in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'In Progress' },
  submitted:   { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Submitted' },
  review:      { color: 'bg-orange-100 text-orange-800', icon: Activity, label: 'Under Review' },
  revision:    { color: 'bg-amber-100 text-amber-800', icon: RotateCcw, label: 'Revision Needed' },
  completed:   { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
  rejected:    { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
};

export default function MyTasks() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTasks = () => {
    api.get('/workflow/my-tasks')
      .then(res => setTasks(res.data.data || []))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
    const socket = io('http://localhost:5000');
    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit('join', userId);
      socket.on(`taskUpdate_${userId}`, () => fetchTasks());
    }
    return () => socket.disconnect();
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => {
    if (filter === 'active') return ['in_progress', 'revision', 'submitted', 'review'].includes(t.status);
    if (filter === 'done') return ['completed', 'rejected'].includes(t.status);
    return true;
  });

  const activeCount = tasks.filter(t => ['in_progress', 'revision', 'submitted', 'review'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-primary text-white mb-2">Work</div>
        <h1 className="page-title">My Assigned Tasks</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="neo-card p-4 bg-white">
          <p className="stat-label">Total</p>
          <p className="stat-value">{tasks.length}</p>
        </div>
        <div className="neo-card p-4 bg-yellow-50">
          <p className="stat-label">Active</p>
          <p className="stat-value text-yellow-700">{activeCount}</p>
        </div>
        <div className="neo-card p-4 bg-green-50">
          <p className="stat-label">Completed</p>
          <p className="stat-value text-green-700">{completedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'done'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`neo-btn px-5 py-2 text-sm capitalize ${filter === f ? 'bg-brand-dark text-white' : 'bg-white'}`}>
            {f === 'done' ? 'Completed/Rejected' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse h-28 bg-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <Briefcase size={48} className="mx-auto mb-4 text-brand-muted" />
          <p className="text-2xl font-bold">No tasks found</p>
          <p className="text-brand-muted mt-2">{filter !== 'all' ? 'Try a different filter' : 'Once a recruiter assigns you a task, it will appear here'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(task => {
            const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.in_progress;
            const StatusIcon = sc.icon;
            const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <Link key={task._id} to={`/student/workspace/${task._id}`}>
                <motion.div whileHover={{ x: 6 }} className="neo-card p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`neo-badge ${sc.color} flex items-center gap-1 text-xs`}>
                        <StatusIcon size={12} /> {sc.label}
                      </span>
                      {task.submissions?.length > 0 && (
                        <span className="neo-badge bg-brand-bg text-xs">v{task.submissions.length}</span>
                      )}
                      {daysLeft <= 3 && daysLeft > 0 && task.status !== 'completed' && task.status !== 'rejected' && (
                        <span className="neo-badge bg-red-100 text-red-800 text-xs">⚠ {daysLeft}d left</span>
                      )}
                      {daysLeft <= 0 && task.status !== 'completed' && task.status !== 'rejected' && (
                        <span className="neo-badge bg-red-500 text-white text-xs">⚠ OVERDUE</span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{task.title}</h3>
                    <p className="text-brand-muted text-sm mt-1">
                      {task.recruiter?.companyName || task.recruiter?.name} · Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-xl text-brand-success">₹{task.escrowAmount || task.budget}</p>
                      <p className="text-[10px] text-brand-muted font-bold uppercase">Escrow</p>
                    </div>
                    <ArrowRight size={20} className="text-brand-muted" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
