import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, ArrowRight, Search, Calendar, MapPin, MessageSquare, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const STATUS_MAP = {
  pending:  { cls: 'badge-pending',  label: '⏳ Pending'  },
  accepted: { cls: 'badge-accepted', label: '✅ Accepted' },
  rejected: { cls: 'badge-rejected', label: '❌ Rejected' },
};

const TASK_STATUS_MAP = {
  in_progress: { cls: 'neo-badge bg-yellow-100 text-yellow-800', label: '🔨 In Progress'   },
  submitted:   { cls: 'neo-badge bg-blue-100 text-blue-800',    label: '📤 Submitted'       },
  review:      { cls: 'neo-badge bg-orange-100 text-orange-800',label: '👁 Under Review'    },
  revision:    { cls: 'neo-badge bg-amber-100 text-amber-800',  label: '🔁 Revision Needed' },
  completed:   { cls: 'neo-badge bg-green-100 text-green-800',  label: '✅ Completed'       },
  rejected:    { cls: 'neo-badge bg-red-100 text-red-800',      label: '❌ Rejected'        },
};

/* ─── View Interview Modal ─────────────────────────────────────────────── */
function ViewInterviewModal({ interview, onClose }) {
  if (!interview) return null;

  // Use interviewDetails or interview
  const data = interview;
  
  // Format date nicely
  const dateStr = data.date
    ? new Date(data.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date TBD';

  const timeStr = data.time
    ? (data.time.includes(':') 
        ? new Date(`1970-01-01T${data.time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : data.time)
    : 'Time TBD';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          className="relative z-10 w-full max-w-md bg-white border-4 border-brand-dark shadow-neo"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        >
          {/* Header */}
          <div className="bg-green-500 text-white p-5 flex items-center justify-between border-b-4 border-brand-dark">
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Appointment</p>
              <h2 className="text-xl font-black uppercase">Interview Details</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/10 transition-colors rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="neo-card p-3 bg-brand-bg/30">
                <p className="text-[10px] font-black uppercase text-brand-muted mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date
                </p>
                <p className="font-black text-brand-dark">{dateStr}</p>
              </div>
              <div className="neo-card p-3 bg-brand-bg/30">
                <p className="text-[10px] font-black uppercase text-brand-muted mb-1 flex items-center gap-1">
                  <Clock size={12} /> Time
                </p>
                <p className="font-black text-brand-dark">{timeStr}</p>
              </div>
            </div>

            <div className="neo-card p-3 bg-brand-bg/30">
              <p className="text-[10px] font-black uppercase text-brand-muted mb-1 flex items-center gap-1">
                <MapPin size={12} /> Location / Meeting Link
              </p>
              {data.location?.startsWith('http') ? (
                <a href={data.location} target="_blank" rel="noreferrer" className="font-black text-blue-600 underline break-all">
                  {data.location}
                </a>
              ) : (
                <p className="font-black text-brand-dark">{data.location || 'N/A'}</p>
              )}
            </div>

            {data.message && (
              <div className="neo-card p-3 bg-yellow-50">
                <p className="text-[10px] font-black uppercase text-yellow-700 mb-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Message from Recruiter
                </p>
                <p className="text-sm font-medium text-brand-dark italic">"{data.message}"</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="neo-btn-primary w-full py-3 font-black text-sm"
            >
              GOT IT
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);

  const fetchApps = () => {
    api.get('/applications/my')
      .then(res => setApps(res.data.data || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();

    // Live updates via socket
    const socket = io('http://localhost:5000');
    const userString = sessionStorage.getItem('studxwork-auth');
    if (userString) {
      try {
        const { state } = JSON.parse(userString);
        if (state?.user?.id || state?.user?._id) {
          socket.emit('join', state.user.id || state.user._id);
          socket.on(`appUpdate_${state.user.id || state.user._id}`, () => {
            fetchApps();
          });
        }
      } catch (e) { }
    }
    return () => socket.disconnect();
  }, []);

  return (
    <div>
      {/* View Interview Modal */}
      {selectedInterview && (
        <ViewInterviewModal 
          interview={selectedInterview} 
          onClose={() => setSelectedInterview(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="neo-badge bg-brand-accent mb-2">Track Progress</div>
          <h1 className="page-title">My Applications</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input
            type="text"
            placeholder="Search applications..."
            className="neo-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse h-28 bg-gray-100" />)}</div>
      ) : apps.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <Send size={48} className="mx-auto mb-4 text-brand-muted" />
          <p className="text-2xl font-bold">No Applications Yet</p>
          <p className="text-brand-muted mt-2">Browse tasks and jobs to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.filter(app => {
            const item = app.job || app.task;
            const recruiter = item?.recruiter;
            const searchLower = search.toLowerCase();
            return (
              item?.title?.toLowerCase().includes(searchLower) ||
              recruiter?.name?.toLowerCase().includes(searchLower) ||
              recruiter?.companyName?.toLowerCase().includes(searchLower)
            );
          }).map((app) => {
            const item = app.job || app.task;
            const isJob = !!app.job;
            const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
            const isAcceptedTask = !isJob && app.status === 'accepted' && app.task;
            const taskStatus = isAcceptedTask ? TASK_STATUS_MAP[app.task.status] : null;
            
            // Check if interview data exists (at least date or location)
            const hasInterview = isJob && app.status === 'accepted' && app.interview && (app.interview.date || app.interview.location);

            return (
              <motion.div
                key={app._id}
                whileHover={{ x: 4 }}
                className={`neo-card p-5 flex flex-col gap-0 ${hasInterview ? 'border-l-5 border-l-green-500 shadow-neo' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`neo-badge text-[10px] py-0.5 px-2 ${isJob ? 'bg-brand-secondary text-white' : 'bg-brand-accent text-brand-dark'}`}>
                        {isJob ? 'JOB' : 'TASK'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase border-2 ${status.cls}`}>{status.label}</span>
                      {taskStatus && <span className={`text-[10px] px-2 py-0.5 font-bold uppercase border-2 ${taskStatus.cls}`}>{taskStatus.label}</span>}
                      {hasInterview && (
                        <span className="text-[10px] px-2 py-0.5 font-bold uppercase border-2 border-green-400 bg-green-100 text-green-700 flex items-center gap-1">
                          <Calendar size={10} /> Interview Scheduled
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-xl mb-1 truncate">{item?.title || 'N/A'}</h3>
                    <p className="text-brand-dark/70 text-sm italic border-l-3 border-brand-accent/30 pl-3 py-1 bg-brand-bg/30 rounded-r-lg line-clamp-1">
                      "{app.proposal}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 border-t md:border-t-0 md:border-l-2 border-brand-dark/10 pt-3 md:pt-0 md:pl-5">
                    <div className="text-right text-xs font-bold text-brand-muted uppercase">
                      <div className="flex items-center gap-1 justify-end opacity-60">
                        <Clock size={12} />{new Date(app.createdAt).toLocaleDateString()}
                      </div>
                      {app.bidAmount > 0 && <div className="text-brand-primary mt-1 text-base font-black">₹{app.bidAmount}</div>}
                    </div>
                    {app.status === 'rejected' && (
                      <div className="w-full md:w-auto flex flex-col gap-2">
                        {app.rejectionReason && (
                          <div className="bg-red-50 p-2 border-2 border-red-200 text-red-700 text-[10px] font-bold max-w-[200px]">
                            Reason: {app.rejectionReason}
                          </div>
                        )}
                        <Link 
                          to={isJob ? `/student/jobs/${item?._id}` : `/student/tasks/${item?._id}`}
                          className="neo-btn bg-brand-dark text-white px-4 py-2 text-[10px] font-black text-center"
                        >
                          APPLY AGAIN
                        </Link>
                      </div>
                    )}
                    {isAcceptedTask && app.task?._id && (
                      <Link to={`/student/workspace/${app.task._id}`} className="neo-btn-primary px-4 py-2 text-sm flex items-center gap-2">
                        <ArrowRight size={16} /> GO TO WORKSPACE
                      </Link>
                    )}
                    {isJob && app.status !== 'rejected' && (
                      <Link to={`/student/jobs/${item?._id}`} className="neo-btn-secondary px-4 py-2 text-[10px] flex items-center gap-2">
                        JOB DETAILS
                      </Link>
                    )}
                    {hasInterview && (
                      <button 
                        onClick={() => setSelectedInterview(app.interviewDetails || app.interview)}
                        className="neo-btn bg-green-500 text-white px-4 py-2 text-[10px] font-black flex items-center gap-2"
                      >
                        <Calendar size={14} /> VIEW INTERVIEW
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
