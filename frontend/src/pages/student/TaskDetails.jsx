import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Users, Briefcase, ChevronLeft, Send, CheckCircle, ShieldCheck, MessageCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ApplyModal from '../../components/ApplyModal';

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(res => setTask(res.data.data))
      .catch(() => toast.error('Failed to load task details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center animate-pulse"><div className="neo-card p-12 h-64 bg-gray-50" /></div>;
  if (!task) return <div className="p-8 text-center"><p className="text-xl font-bold">Task not found</p></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold mb-6 hover:text-brand-primary transition-colors">
        <ChevronLeft size={20} /> Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="neo-badge bg-brand-primary text-white">{task.status}</span>
              <span className="neo-badge bg-brand-bg">Task ID: {task._id.slice(-6)}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight leading-tight">{task.title}</h1>
            
            <div className="flex items-center gap-4 p-5 bg-brand-bg/40 border-3 border-brand-dark mb-10">
              <div className="w-14 h-14 bg-brand-dark text-white flex items-center justify-center font-black text-2xl border-3 border-brand-dark shrink-0">
                {task.recruiter?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-brand-muted tracking-widest mb-1">Posted By</p>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-black text-xl leading-none">{task.recruiter?.name}</span>
                  {task.recruiter?.companyName && (
                    <span className="text-brand-muted font-bold text-sm">at {task.recruiter.companyName}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs font-bold text-brand-primary flex items-center gap-1 uppercase">
                    <ShieldCheck size={14} /> Verified Professional
                  </p>
                  <button 
                    onClick={() => navigate('/student/chat', { state: { recruiter: task.recruiter } })}
                    className="flex items-center gap-1 text-xs font-black uppercase bg-brand-dark text-white px-2 py-1 border-2 border-brand-dark hover:bg-white hover:text-brand-dark transition-colors"
                  >
                    <MessageCircle size={12} /> Chat
                  </button>
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-3 border-b-3 border-brand-dark pb-1 inline-block">Description</h3>
              <p className="text-brand-dark/80 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 border-b-3 border-brand-dark pb-1 inline-block">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {task.skills?.map(skill => (
                  <span key={skill} className="neo-badge bg-brand-accent px-4 py-2 text-sm">
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
            <h3 className="font-black text-lg mb-6 uppercase">Task Summary</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-success text-white flex items-center justify-center border-2 border-brand-dark">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Fixed Budget</p>
                  <p className="font-black text-xl text-brand-success">₹{task.budget}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-primary text-white flex items-center justify-center border-2 border-brand-dark">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Deadline</p>
                  <p className="font-bold">{new Date(task.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-dark text-white flex items-center justify-center border-2 border-brand-dark">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-muted uppercase">Recruiter</p>
                  <p className="font-bold truncate">{task.recruiter?.companyName || task.recruiter?.name}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-brand-dark/10">
              {task.hasApplied ? (
                <Link to="/student/applications" className="neo-btn bg-brand-success/10 text-brand-success border-brand-success w-full py-4 text-lg flex items-center justify-center gap-2 hover:bg-brand-success hover:text-white transition-all">
                  <CheckCircle size={20} /> View My Application
                </Link>
              ) : (task.status === 'open' || task.status === 'in_bidding') ? (
                <button 
                  onClick={() => setShowApply(true)}
                  className="neo-btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  <Send size={20} /> Apply for Task
                </button>
              ) : (
                <div className="p-4 bg-gray-100 border-2 border-brand-dark text-center font-bold text-brand-muted">
                  Applications Closed
                </div>
              )}
            </div>
          </motion.div>

          <div className="neo-card p-6 bg-white border-brand-primary">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-brand-primary" />
              <h4 className="font-bold">Safe Payments</h4>
            </div>
            <p className="text-xs font-medium text-brand-muted">
              Funds are held in escrow and released only after you complete the task and the recruiter approves it.
            </p>
          </div>
        </div>
      </div>

      {showApply && <ApplyModal item={{ ...task, type: 'task' }} onClose={() => setShowApply(false)} />}
    </div>
  );
}
