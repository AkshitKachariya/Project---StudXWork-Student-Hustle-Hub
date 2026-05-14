import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Briefcase, ChevronLeft, Send, CheckCircle, Clock, ShieldCheck, MessageCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ApplyModal from '../../components/ApplyModal';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data.data))
      .catch(() => toast.error('Failed to load job details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center animate-pulse"><div className="neo-card p-12 h-64 bg-gray-50" /></div>;
  if (!job) return <div className="p-8 text-center"><p className="text-xl font-bold">Job not found</p></div>;

  const TYPE_COLORS = {
    internship: 'bg-blue-100 text-blue-800',
    'part-time': 'bg-purple-100 text-purple-800',
    'full-time': 'bg-green-100 text-green-800',
    freelance: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold mb-6 hover:text-brand-primary transition-colors">
        <ChevronLeft size={20} /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`neo-badge ${TYPE_COLORS[job.type] || 'bg-brand-bg'}`}>{job.type}</span>
              <span className="neo-badge bg-brand-bg flex items-center gap-1"><MapPin size={14} /> {job.location || 'Remote'}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight leading-tight">{job.title}</h1>

            <div className="flex items-center gap-4 p-5 bg-brand-bg/40 border-3 border-brand-dark mb-10">
              <div className="w-14 h-14 bg-brand-dark text-white flex items-center justify-center font-black text-2xl border-3 border-brand-dark shrink-0">
                {job.recruiter?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-brand-muted tracking-widest mb-1">Hiring Manager</p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-black text-xl leading-none">{job.recruiter?.name}</span>
                  {job.recruiter?.companyName && (
                    <span className="text-brand-muted font-bold text-sm">at {job.recruiter.companyName}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs font-bold text-brand-secondary mt-1 flex items-center gap-1 uppercase">
                    <ShieldCheck size={14} /> Verified Partner
                  </p>
                  <button 
                    onClick={() => navigate('/student/chat', { state: { recruiter: job.recruiter } })}
                    className="flex items-center gap-1 text-xs font-black uppercase bg-brand-dark text-white px-2 py-1 border-2 border-brand-dark hover:bg-white hover:text-brand-dark transition-colors"
                  >
                    <MessageCircle size={12} /> Chat
                  </button>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-4 border-b-3 border-brand-dark pb-1 inline-block">Role Description</h3>
              <p className="text-brand-dark/80 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 border-b-3 border-brand-dark pb-1 inline-block">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map(skill => (
                  <span key={skill} className="neo-badge bg-brand-secondary text-white px-4 py-2 text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="neo-card p-6 bg-brand-bg/50">
            <h3 className="font-black text-lg mb-6 uppercase">Job Overview</h3>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-primary text-white flex items-center justify-center border-2 border-brand-dark">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Posted On</p>
                  <p className="font-bold">{new Date(job.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-secondary text-white flex items-center justify-center border-2 border-brand-dark">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Last Date</p>
                  <p className="font-bold">{job.lastDate ? new Date(job.lastDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Open until filled'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-dark text-white flex items-center justify-center border-2 border-brand-dark">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-muted uppercase">Company</p>
                  <p className="font-bold truncate">{job.recruiter?.companyName || job.recruiter?.name}</p>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-brand-dark/10">
                <p className="text-xs font-bold text-brand-muted uppercase mb-1">Salary / Stipend</p>
                <p className="text-2xl font-black text-brand-dark">{job.salary || 'Competitive'}</p>
              </div>
            </div>

            <div className="mt-8 pt-2">
              {job.hasApplied ? (
                <Link to="/student/applications" className="neo-btn bg-brand-success/10 text-brand-success border-brand-success w-full py-4 text-lg flex items-center justify-center gap-2 hover:bg-brand-success hover:text-white transition-all">
                  <CheckCircle size={20} /> View My Application
                </Link>
              ) : (
                <button 
                  onClick={() => setShowApply(true)}
                  className="neo-btn-secondary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  <Send size={20} /> Apply for Role
                </button>
              )}
            </div>
          </motion.div>

          <div className="neo-card p-6 bg-white border-brand-secondary">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-brand-secondary" />
              <h4 className="font-bold">Verified Listing</h4>
            </div>
            <p className="text-xs font-medium text-brand-muted">
              This job posting has been reviewed by our moderation team for authenticity and quality standards.
            </p>
          </div>
        </div>
      </div>

      {showApply && <ApplyModal item={{ ...job, type: 'job' }} onClose={() => setShowApply(false)} />}
    </div>
  );
}
