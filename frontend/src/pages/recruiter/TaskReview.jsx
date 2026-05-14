import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle, XCircle, RotateCcw, Clock,
  FileText, Download, ExternalLink, MessageCircle, Activity,
  AlertTriangle, Send, Star, User, HeadphonesIcon
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { io } from 'socket.io-client';
import RaiseTicketModal from '../../components/RaiseTicketModal';

const STATUS_CONFIG = {
  open:        { color: 'bg-blue-100 text-blue-800', label: 'Open' },
  in_bidding:  { color: 'bg-purple-100 text-purple-800', label: 'In Bidding' },
  assigned:    { color: 'bg-indigo-100 text-indigo-800', label: 'Assigned' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
  submitted:   { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  review:      { color: 'bg-orange-100 text-orange-800', label: 'Under Review' },
  revision:    { color: 'bg-amber-100 text-amber-800', label: 'Revision Needed' },
  completed:   { color: 'bg-green-100 text-green-800', label: 'Completed' },
  rejected:    { color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

const WORKFLOW_STEPS = ['open', 'in_progress', 'submitted', 'review', 'completed'];

export default function TaskReview() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('submissions');
  const [actionLoading, setActionLoading] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/workflow/workspace/${taskId}`);
      setTask(res.data.data);
    } catch {
      toast.error('Failed to load task');
      navigate(-1);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTask();
    const socket = io('http://localhost:5000');
    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit('join', userId);
      socket.on(`taskUpdate_${userId}`, () => fetchTask());
    }
    // Live reload every 15 seconds
    const interval = setInterval(() => fetchTask(), 15000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [taskId]);

  const handleApprove = async () => {
    if (!window.confirm(`Approve this submission and release ₹${task.escrowAmount} to ${task.assignedTo?.name}?`)) return;
    setActionLoading('approve');
    try {
      const res = await api.post(`/workflow/approve/${taskId}`);
      toast.success(res.data.message);
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleRevision = async () => {
    if (!feedback.trim()) return toast.error('Please provide feedback');
    setActionLoading('revision');
    try {
      await api.post(`/workflow/revision/${taskId}`, { feedback });
      toast.success('Revision requested');
      setShowRevisionModal(false);
      setFeedback('');
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await api.post(`/workflow/reject/${taskId}`, { reason: rejectReason });
      toast.success('Task rejected. Escrow refunded.');
      setShowRejectModal(false);
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setActionLoading(''); }
  };

  if (loading) return <div className="p-8"><div className="neo-card p-12 animate-pulse h-64 bg-gray-50" /></div>;
  if (!task) return null;

  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
  const canReview = task.status === 'submitted';
  const currentStep = WORKFLOW_STEPS.indexOf(task.status === 'revision' ? 'submitted' : task.status);

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold mb-6 hover:text-brand-primary transition-colors">
        <ChevronLeft size={20} /> Back
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`neo-badge ${sc.color}`}>{sc.label}</span>
              {task.revisionCount > 0 && <span className="neo-badge bg-amber-100 text-amber-800">Revisions: {task.revisionCount}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{task.title}</h1>
          </div>
          <div className="flex items-center gap-6">
            {task.assignedTo && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary text-white flex items-center justify-center font-black border-2 border-brand-dark">
                  {task.assignedTo.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Assigned To</p>
                  <p className="font-bold">{task.assignedTo.name}</p>
                </div>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs font-bold text-brand-muted uppercase">Escrow</p>
              <p className="text-2xl font-black text-brand-success">₹{task.escrowAmount}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setShowTicketModal(true)}
              className="neo-btn-white text-xs px-3 py-2 flex items-center gap-2"
            >
              <HeadphonesIcon size={14} /> Raise Issue
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-1">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-2 border-2 border-brand-dark ${
                i <= currentStep ? 'bg-brand-success' : task.status === 'rejected' ? 'bg-red-200' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px] font-bold uppercase text-brand-muted">
          {WORKFLOW_STEPS.map(s => <span key={s}>{s.replace('_', ' ')}</span>)}
        </div>
      </motion.div>

      {/* Action Buttons for Review */}
      {canReview && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-5 mb-6 bg-blue-50 border-l-4 border-blue-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black uppercase text-blue-800">📋 Submission Ready for Review</h3>
              <p className="text-sm text-blue-600 mt-1">Review the student's work and take action below.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleApprove} disabled={!!actionLoading}
                className="neo-btn-success px-5 py-2 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> {actionLoading === 'approve' ? 'Processing...' : 'Approve & Pay'}
              </button>
              <button onClick={() => setShowRevisionModal(true)} disabled={!!actionLoading}
                className="neo-btn bg-amber-400 text-brand-dark px-5 py-2 text-sm flex items-center gap-2">
                <RotateCcw size={16} /> Request Revision
              </button>
              <button onClick={() => setShowRejectModal(true)} disabled={!!actionLoading}
                className="neo-btn-danger px-5 py-2 text-sm flex items-center gap-2">
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status Alerts */}
      {task.status === 'completed' && (
        <div className="neo-card p-5 mb-6 bg-green-50 border-l-4 border-green-500">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 shrink-0" size={20} />
            <div>
              <h3 className="font-black uppercase text-green-800">Task Completed ✅</h3>
              <p className="text-sm text-green-700 mt-1">₹{task.escrowAmount} released to {task.assignedTo?.name}</p>
            </div>
          </div>
        </div>
      )}
      {task.status === 'revision' && (
        <div className="neo-card p-5 mb-6 bg-amber-50 border-l-4 border-amber-400">
          <div className="flex items-start gap-3">
            <RotateCcw className="text-amber-600 shrink-0" size={20} />
            <div>
              <h3 className="font-black uppercase text-amber-800">Waiting for Resubmission</h3>
              <p className="text-sm text-amber-700 mt-1">Your feedback: {task.revisionFeedback}</p>
            </div>
          </div>
        </div>
      )}
      {task.status === 'in_progress' && (
        <div className="neo-card p-5 mb-6 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex items-start gap-3">
            <Clock className="text-yellow-600 shrink-0" size={20} />
            <div>
              <h3 className="font-black uppercase text-yellow-800">Student is Working</h3>
              <p className="text-sm text-yellow-700 mt-1">Waiting for {task.assignedTo?.name} to submit work.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['submissions', 'overview', 'activity'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`neo-btn px-5 py-2 text-sm capitalize ${tab === t ? 'bg-brand-dark text-white' : 'bg-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'submissions' && (
          <motion.div key="submissions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(!task.submissions || task.submissions.length === 0) ? (
              <div className="neo-card p-12 text-center">
                <FileText size={48} className="mx-auto mb-4 text-brand-muted" />
                <p className="text-xl font-bold">No Submissions Yet</p>
                <p className="text-brand-muted mt-2">The student hasn't submitted any work yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...task.submissions].reverse().map((sub, i) => (
                  <motion.div key={i} whileHover={{ x: 4 }} className={`neo-card p-6 ${i === 0 && canReview ? 'border-l-4 border-blue-500 bg-blue-50/30' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="neo-badge bg-brand-primary text-white">v{sub.version}</span>
                        {i === 0 && canReview && <span className="neo-badge bg-blue-500 text-white text-xs">Latest</span>}
                        <span className="text-sm font-bold text-brand-muted">
                          {new Date(sub.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {sub.message && <p className="text-sm mb-4 border-l-3 border-brand-dark pl-3">{sub.message}</p>}
                    {sub.files?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold uppercase text-brand-muted mb-2">📎 Files ({sub.files.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map((f, fi) => (
                            <a key={fi} href={f.path} target="_blank" rel="noopener noreferrer"
                              className="neo-badge bg-brand-bg flex items-center gap-1 hover:bg-brand-accent transition-colors cursor-pointer">
                              <ExternalLink size={12} /> {f.originalName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {sub.links?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-brand-muted mb-2">🔗 Links</p>
                        <div className="flex flex-wrap gap-2">
                          {sub.links.map((l, li) => (
                            <a key={li} href={l.url} target="_blank" rel="noopener noreferrer"
                              className="neo-badge bg-brand-primary/10 text-brand-primary flex items-center gap-1 hover:bg-brand-primary hover:text-white transition-colors cursor-pointer">
                              <ExternalLink size={12} /> {l.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 neo-card p-6">
                <h3 className="text-xl font-black uppercase mb-4 border-b-3 border-brand-dark pb-2 inline-block">Description</h3>
                <p className="text-brand-dark/80 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                {task.skills?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.skills.map(s => <span key={s} className="neo-badge bg-brand-accent">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="neo-card p-5 bg-brand-bg/50">
                  <h4 className="font-black uppercase text-sm mb-3">Task Info</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-brand-muted font-bold">Status</span><span className={`neo-badge ${sc.color} text-xs`}>{sc.label}</span></div>
                    <div className="flex justify-between"><span className="text-brand-muted font-bold">Escrow</span><span className="font-black text-brand-success">₹{task.escrowAmount}</span></div>
                    <div className="flex justify-between"><span className="text-brand-muted font-bold">Deadline</span><span className="font-bold">{new Date(task.deadline).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-brand-muted font-bold">Submissions</span><span className="font-bold">{task.submissions?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-brand-muted font-bold">Revisions</span><span className="font-bold">{task.revisionCount}</span></div>
                  </div>
                </div>
                {task.assignedTo && (
                  <div className="neo-card p-5">
                    <h4 className="font-black uppercase text-sm mb-3">Assigned Student</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center font-black border-2 border-brand-dark text-xl">
                        {task.assignedTo.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{task.assignedTo.name}</p>
                        {task.assignedTo.college && <p className="text-xs text-brand-muted">{task.assignedTo.college}</p>}
                      </div>
                    </div>
                    {task.assignedTo.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {task.assignedTo.skills.map(s => <span key={s} className="neo-badge bg-brand-bg text-xs">{s}</span>)}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => navigate('/recruiter/chat', { state: { recruiter: task.assignedTo } })}
                  className="neo-btn-primary w-full flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> Chat with Student
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="neo-card p-6">
              <h3 className="text-xl font-black uppercase mb-6">Activity Log</h3>
              {(!task.activityLog || task.activityLog.length === 0) ? (
                <p className="text-brand-muted text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-0">
                  {[...task.activityLog].reverse().map((log, i) => (
                    <div key={i} className="flex gap-4 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 border-brand-dark shrink-0 ${
                          log.action.includes('APPROVED') ? 'bg-brand-success' :
                          log.action.includes('REJECT') ? 'bg-red-500' :
                          log.action.includes('REVISION') ? 'bg-amber-500' :
                          log.action.includes('SUBMITTED') ? 'bg-blue-500' :
                          'bg-brand-primary'
                        }`} />
                        {i < task.activityLog.length - 1 && <div className="w-0.5 flex-1 bg-brand-dark/20 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="font-bold text-sm">{log.action.replace(/_/g, ' ')}</p>
                        {log.message && <p className="text-xs text-brand-muted mt-0.5">{log.message}</p>}
                        <p className="text-[10px] text-brand-muted mt-1">
                          {log.by?.name || 'System'} · {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="neo-card bg-white w-full max-w-lg p-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-black uppercase mb-2">🔁 Request Revision</h2>
            <p className="text-brand-muted text-sm mb-6">Provide feedback on what needs to be changed.</p>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5}
              className="neo-input resize-none mb-4" placeholder="Describe what changes are needed..." />
            <div className="flex gap-3">
              <button onClick={() => setShowRevisionModal(false)} className="neo-btn-white flex-1">Cancel</button>
              <button onClick={handleRevision} disabled={actionLoading === 'revision'}
                className="neo-btn bg-amber-400 text-brand-dark flex-1">
                {actionLoading === 'revision' ? 'Sending...' : 'Send Revision Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="neo-card bg-white w-full max-w-lg p-8 max-h-[95vh] overflow-y-auto">
            <h2 className="text-2xl font-black uppercase mb-2 text-red-600">❌ Reject Work</h2>
            <p className="text-brand-muted text-sm mb-2">This will reject the work and refund your escrow (₹{task.escrowAmount}).</p>
            <p className="text-red-500 text-xs font-bold mb-4">⚠ This action cannot be undone.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              className="neo-input resize-none mb-4" placeholder="Reason for rejection (optional)..." />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="neo-btn-white flex-1">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading === 'reject'}
                className="neo-btn-danger flex-1">
                {actionLoading === 'reject' ? 'Processing...' : 'Reject & Refund'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showTicketModal && (
        <RaiseTicketModal 
          onClose={() => setShowTicketModal(false)}
          relatedTask={task}
        />
      )}
    </div>
  );
}
