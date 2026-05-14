import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListTodo, Briefcase, Send, Wallet, BookOpen, Bell, ArrowRight, TrendingUp, ClipboardCheck, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const StatCard = ({ label, value, color, icon: Icon, to, subValue }) => (
  <Link to={to || '#'}>
    <motion.div whileHover={{ y: -3 }} className={`stat-card ${color} cursor-pointer relative group`}>
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label font-black uppercase opacity-60 text-[10px]">{label}</span>
        <Icon size={20} className="opacity-50 group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="stat-value font-black text-2xl">{value}</span>
        {subValue && <span className="text-[10px] font-bold opacity-60">{subValue}</span>}
      </div>
    </motion.div>
  </Link>
);

export default function StudentDashboard() {
  const { user, counters, fetchCounters } = useAuthStore();
  const [wallet, setWallet] = useState(0);
  const [notices, setNotices] = useState([]);

  const fetchData = async () => {
    try {
      const [walletRes, noticesRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/notices?role=student'),
        fetchCounters()
      ]);
      setWallet(walletRes.data.data.walletBalance || 0);
      setNotices(noticesRes.data.data?.slice(0, 3) || []);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickLinks = [
    { to: '/student/tasks',    label: 'Browse Tasks', icon: ListTodo,       color: 'bg-brand-accent' },
    { to: '/student/my-tasks', label: 'My Tasks',     icon: ClipboardCheck, color: 'bg-brand-primary text-white' },
    { to: '/student/jobs',     label: 'Find Jobs',    icon: Briefcase,      color: 'bg-brand-secondary text-white' },
    { to: '/student/wallet',   label: 'My Wallet',    icon: Wallet,         color: 'bg-brand-dark text-white' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="neo-badge bg-brand-accent mb-3">Student Panel</div>
        <h1 className="page-title">Hey, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-brand-muted font-medium mt-1">Here's your overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Browse Tasks"     value={counters?.browseTasks || 0}        icon={ListTodo}  color="bg-white" to="/student/tasks" />
        <StatCard label="Browse Jobs"      value={counters?.browseJobs || 0}         icon={Briefcase} color="bg-brand-primary/5" to="/student/jobs" />
        <StatCard label="My Applications"  value={counters?.myApplications || 0}     icon={Send}      color="bg-brand-secondary/5" to="/student/applications" />
        <StatCard label="My Tasks"         value={counters?.myTasks || 0}            icon={ClipboardCheck} color="bg-yellow-50" to="/student/my-tasks" />
        <StatCard label="Study Notes"      value={counters?.studyNotes || 0}         icon={BookOpen} color="bg-white" to="/student/notes" />
        <StatCard label="Messages"         value={counters?.messages?.total || 0}    subValue={`(${counters?.messages?.new || 0} New)`} icon={MessageCircle} color="bg-blue-50" to="/student/chat" />
        <StatCard label="Notices"          value={counters?.notice || 0}             icon={Bell} color="bg-white" to="/student/notices" />
        <StatCard label="Wallet Balance"   value={`₹${Number(wallet||0).toFixed(2)}`} icon={Wallet}    color="bg-brand-accent/30" to="/student/wallet" />
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <h2 className="text-xl font-black uppercase">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickLinks.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to}>
            <motion.div whileHover={{ y: -4 }} className={`neo-card p-5 ${color} flex flex-col items-center gap-3 text-center cursor-pointer`}>
              <Icon size={28} />
              <span className="font-bold text-sm">{label}</span>
              <ArrowRight size={14} className="opacity-60" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Notices */}
      {notices.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black uppercase flex items-center gap-2 text-brand-dark">📢 Announcements</h2>
            <Link to="/student/notices" className="text-sm font-bold text-brand-secondary underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notices.map((n) => (
              <div key={n._id} className="neo-card p-5 border-l-5 border-l-brand-primary bg-white">
                <h3 className="font-bold text-lg">{n.title}</h3>
                <p className="text-sm text-brand-muted mt-2 line-clamp-2">{n.content}</p>
                <span className="text-[10px] text-brand-muted mt-3 block">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
