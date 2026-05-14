import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, ArrowRight, Lock, Filter,
  Calendar, Clock, MapPin, MessageSquare, X, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ─── Interview Popup Modal ─────────────────────────────────────────────── */
function InterviewModal({ applicantName, onConfirm, onCancel, loading }) {
  const [form, setForm] = useState({ date: '', time: '', location: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.location) {
      toast.error('Date, Time aur Location required hai!');
      return;
    }
    onConfirm(form);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          className="relative z-10 w-full max-w-lg bg-white border-3 border-brand-dark shadow-neo"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        >
          <div className="bg-brand-dark text-white p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Job Application</p>
              <h2 className="text-xl font-black uppercase">Schedule Interview</h2>
              <p className="text-sm opacity-70 mt-0.5">For: <span className="font-bold">{applicantName}</span></p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/10 transition-colors"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> Interview Date <span className="text-brand-primary">*</span>
                </label>
                <input type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]} className="neo-input w-full font-bold" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> Interview Time <span className="text-brand-primary">*</span>
                </label>
                <input type="time" value={form.time} onChange={set('time')} className="neo-input w-full font-bold" required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5 flex items-center gap-1">
                <MapPin size={12} /> Location / Meeting Link <span className="text-brand-primary">*</span>
              </label>
              <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Google Meet link, Office Address..." className="neo-input w-full" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5 flex items-center gap-1">
                <MessageSquare size={12} /> Message to Candidate <span className="text-brand-muted">(optional)</span>
              </label>
              <textarea value={form.message} onChange={set('message')} placeholder="Any preparation instructions..." className="neo-input w-full resize-none" rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCancel} className="neo-btn flex-1 py-3 font-black text-sm">Cancel</button>
              <button type="submit" disabled={loading} className="neo-btn bg-green-500 text-white flex-1 py-3 font-black text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                {loading ? 'Accepting...' : 'Accept & Send Details'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Rejection Reason Modal ────────────────────────────────────────────── */
function RejectionModal({ applicantName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div className="relative z-10 w-full max-w-md bg-white border-3 border-brand-dark shadow-neo" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}>
          <div className="bg-red-500 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase">Reject Application</h2>
            <button onClick={onCancel} className="p-1 hover:bg-white/10 transition-colors"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1.5 text-brand-muted">Reason for Rejection</label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Profile doesn't match requirements, Bid is too high..."
                className="neo-input w-full resize-none" rows={4} required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCancel} className="neo-btn flex-1 py-2 font-black text-xs uppercase">Cancel</button>
              <button type="submit" disabled={loading} className="neo-btn bg-red-500 text-white flex-1 py-2 font-black text-xs uppercase flex items-center justify-center gap-2">
                {loading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Interview Details Modal (Viewing) ─────────────────────────────────── */
function InterviewDetailsModal({ interview, applicantName, onCancel }) {
  if (!interview) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          className="relative z-10 w-full max-w-md bg-white border-3 border-brand-dark shadow-neo"
          initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        >
          <div className="bg-brand-dark text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase">Interview Schedule</h2>
            <button onClick={onCancel} className="p-1 hover:bg-white/10 transition-colors"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-brand-bg p-3 border-2 border-brand-dark">
              <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Candidate</p>
              <p className="font-bold">{applicantName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-bg p-3 border-2 border-brand-dark">
                <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Date</p>
                <p className="font-bold flex items-center gap-1"><Calendar size={14} /> {interview.date}</p>
              </div>
              <div className="bg-brand-bg p-3 border-2 border-brand-dark">
                <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Time</p>
                <p className="font-bold flex items-center gap-1"><Clock size={14} /> {interview.time}</p>
              </div>
            </div>
            <div className="bg-brand-bg p-3 border-2 border-brand-dark">
              <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Location / Link</p>
              <p className="font-bold text-sm break-all flex items-center gap-1"><MapPin size={14} /> {interview.location}</p>
            </div>
            {interview.message && (
              <div className="bg-brand-bg p-3 border-2 border-brand-dark">
                <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Your Message</p>
                <p className="text-sm italic">"{interview.message}"</p>
              </div>
            )}
            <button onClick={onCancel} className="neo-btn w-full py-2 font-black text-sm mt-2">Close</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function ViewApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [interviewModal, setInterviewModal] = useState(null);
  const [viewInterview, setViewInterview] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Fetch ALL applicants for this recruiter at once
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/applicants');
      setApplicants(res.data.data || []);
    } catch { toast.error('Failed to load applicants'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplicants(); }, []);

  // For JOBS: open interview modal first, then accept
  const confirmJobAccept = async (interviewData) => {
    setInterviewLoading(true);
    try {
      await api.put(`/applications/${interviewModal.appId}/status`, {
        status: 'accepted',
        interview: interviewData,
      });
      toast.success('Application accepted! Interview details sent. ✅');
      setInterviewModal(null);
      fetchApplicants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept application');
    } finally { setInterviewLoading(false); }
  };

  // For TASKS: use workflow accept-bid (with escrow)
  const acceptTaskBid = async (appId) => {
    if (!window.confirm('Accept this bid? The task budget will be deducted from your wallet as escrow.')) return;
    setActionLoading(appId);
    try {
      const res = await api.post(`/workflow/accept-bid/${appId}`);
      toast.success(res.data.message);
      fetchApplicants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept bid');
    } finally { setActionLoading(''); }
  };

  const confirmReject = async (reason) => {
    setRejectLoading(true);
    try {
      await api.put(`/applications/${rejectModal.appId}/status`, { 
        status: 'rejected',
        rejectionReason: reason
      });
      toast.success('Application rejected');
      setRejectModal(null);
      fetchApplicants();
    } catch { toast.error('Failed to reject'); }
    finally { setRejectLoading(false); }
  };

  // Filter and search
  const filtered = applicants.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = !searchQuery || 
      app.applicant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.task?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    accepted: applicants.filter(a => a.status === 'accepted').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
  };

  return (
    <div>
      {interviewModal && (
        <InterviewModal
          applicantName={interviewModal.applicantName}
          onConfirm={confirmJobAccept}
          onCancel={() => setInterviewModal(null)}
          loading={interviewLoading}
        />
      )}

      {viewInterview && (
        <InterviewDetailsModal
          interview={viewInterview.data}
          applicantName={viewInterview.name}
          onCancel={() => setViewInterview(null)}
        />
      )}

      {rejectModal && (
        <RejectionModal
          applicantName={rejectModal.applicantName}
          onConfirm={confirmReject}
          onCancel={() => setRejectModal(null)}
          loading={rejectLoading}
        />
      )}

      <div className="mb-6">
        <div className="neo-badge bg-brand-primary text-white mb-2">Hiring</div>
        <h1 className="page-title">All Applicants</h1>
        <p className="text-brand-muted font-medium mt-1">View and manage all applications for your listings</p>
      </div>

      {/* Filter Bar */}
      <div className="neo-card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant or listing..."
              className="neo-input pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`neo-btn px-3 py-1.5 text-xs font-black uppercase ${
                  filterStatus === status 
                    ? status === 'pending' ? 'bg-yellow-400 text-brand-dark' 
                    : status === 'accepted' ? 'bg-green-500 text-white' 
                    : status === 'rejected' ? 'bg-red-500 text-white' 
                    : 'bg-brand-dark text-white'
                    : 'bg-white text-brand-dark'
                }`}
              >
                {status} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applicants Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="neo-card p-6 animate-pulse bg-gray-50 h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <p className="text-xl font-bold text-brand-muted">
            {applicants.length === 0 ? 'No applications received yet' : 'No applications match your filters'}
          </p>
        </div>
      ) : (
        <div className="neo-card overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Applied For</th>
                <th>Type</th>
                <th>Bid</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const isTask = !!app.task;
                const listingTitle = app.task?.title || app.job?.title || 'N/A';
                const taskObj = app.task;
                const taskAlreadyAssigned = taskObj && !['open', 'in_bidding'].includes(taskObj.status);
                const canAccept = app.status === 'pending' && (!isTask || !taskAlreadyAssigned);

                return (
                  <tr key={app._id} className="group hover:bg-brand-bg/40 transition-colors">
                    {/* Applicant */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-primary border-2 border-brand-dark flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                          {app.applicant?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{app.applicant?.name}</p>
                          <p className="text-[11px] text-brand-muted">{app.applicant?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Listing */}
                    <td>
                      <p className="font-bold text-sm truncate max-w-[200px]" title={listingTitle}>{listingTitle}</p>
                      {app.proposal && (
                        <p className="text-[11px] text-brand-muted truncate max-w-[200px]" title={app.proposal}>
                          "{app.proposal}"
                        </p>
                      )}
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`neo-badge text-[9px] ${isTask ? 'bg-brand-accent text-brand-dark' : 'bg-brand-secondary text-white'}`}>
                        {isTask ? 'TASK' : 'JOB'}
                      </span>
                    </td>

                    {/* Bid */}
                    <td>
                      {app.bidAmount > 0 ? (
                        <span className="font-black text-green-600 text-sm">₹{app.bidAmount}</span>
                      ) : (
                        <span className="text-brand-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={
                        app.status === 'accepted' ? 'badge-accepted' : 
                        app.status === 'rejected' ? 'badge-rejected' : 
                        'badge-pending'
                      }>
                        {app.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <span className="text-xs text-brand-muted font-medium">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex gap-1.5">
                        {canAccept && (
                          <>
                            {isTask ? (
                              <button
                                onClick={() => acceptTaskBid(app._id)}
                                disabled={actionLoading === app._id}
                                className="neo-btn bg-green-500 text-white px-2.5 py-1 text-[11px] font-black"
                                title="Accept & Escrow"
                              >
                                {actionLoading === app._id ? '...' : <><CheckCircle size={13} /> Accept</>}
                              </button>
                            ) : (
                              <button
                                onClick={() => setInterviewModal({ appId: app._id, applicantName: app.applicant?.name })}
                                className="neo-btn bg-green-500 text-white px-2.5 py-1 text-[11px] font-black"
                                title="Accept & Schedule Interview"
                              >
                                <CheckCircle size={13} /> Accept
                              </button>
                            )}
                            <button
                              onClick={() => setRejectModal({ appId: app._id, applicantName: app.applicant?.name })}
                              className="neo-btn bg-red-500 text-white px-2.5 py-1 text-[11px] font-black"
                              title="Reject"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        {app.status === 'accepted' && isTask && taskObj?._id && (
                          <Link
                            to={`/recruiter/review/${taskObj._id}`}
                            className={`neo-btn px-2.5 py-1 text-[11px] font-black ${taskObj.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-brand-primary text-white'}`}
                          >
                            <ArrowRight size={13} /> {taskObj.status === 'rejected' ? 'Rejected Workspace' : 'Workspace'}
                          </Link>
                        )}
                        {app.status === 'accepted' && !isTask && (app.interviewDetails || app.interview) && (
                          <button
                            onClick={() => setViewInterview({ data: app.interviewDetails || app.interview, name: app.applicant?.name })}
                            className="neo-btn bg-brand-dark text-white px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Calendar size={12} /> View Info
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
