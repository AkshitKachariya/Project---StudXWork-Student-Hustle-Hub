import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusSquare, Briefcase, Users, Wallet, ArrowRight, List, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const StatCard = ({ label, value, color, icon: Icon, to, subValue }) => (
  <Link to={to || '#'}>
    <motion.div whileHover={{ y: -4 }} className={`stat-card ${color} cursor-pointer relative group`}>
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label font-black uppercase opacity-60 text-[10px]">{label}</span>
        <Icon size={20} className="opacity-40 group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="stat-value font-black text-2xl">{value}</span>
        {subValue && <span className="text-[10px] font-bold opacity-60">{subValue}</span>}
      </div>
      <ArrowRight size={14} className="opacity-30 mt-2" />
    </motion.div>
  </Link>
);

export default function RecruiterDashboard() {
  const { user, counters, fetchCounters } = useAuthStore();
  const [notices, setNotices] = useState([]);
  const [wallet, setWallet] = useState(0);

  const fetchData = async () => {
    try {
      const [walletRes, noticesRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/notices?role=recruiter'),
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

  return (
    <div>
      <div className="mb-8">
        <div className="neo-badge bg-brand-secondary text-white mb-3">Recruiter Panel</div>
        <h1 className="page-title">Welcome, {user?.companyName || user?.name} 👋</h1>
        <p className="text-brand-muted font-medium mt-1">Manage your postings and find the right talent.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="My Listings" 
          value={(counters?.listings?.jobs || 0) + (counters?.listings?.tasks || 0)} 
          subValue={`(${counters?.listings?.jobs || 0} Jobs / ${counters?.listings?.tasks || 0} Tasks)`}
          icon={List} 
          color="bg-white" 
          to="/recruiter/listings" 
        />
        <StatCard 
          label="Applications" 
          value={counters?.applications?.total || 0} 
          subValue={`(${counters?.applications?.new || 0} New / ${counters?.applications?.pending || 0} Pending)`}
          icon={Users} 
          color="bg-brand-secondary/5" 
          to="/recruiter/applicants" 
        />
        <StatCard 
          label="Messages" 
          value={counters?.messages?.total || 0} 
          subValue={`(${counters?.messages?.new || 0} New)`}
          icon={MessageCircle} 
          color="bg-brand-primary/5" 
          to="/recruiter/chat" 
        />
        <StatCard 
          label="Wallet Balance" 
          value={`₹${Number(wallet||0).toFixed(2)}`} 
          icon={Wallet} 
          color="bg-brand-accent/30" 
          to="/recruiter/wallet" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/recruiter/post-task">
          <motion.div whileHover={{ y: -4 }} className="neo-card p-8 bg-brand-accent flex items-center gap-6 cursor-pointer">
            <PlusSquare size={40} />
            <div>
              <h3 className="text-2xl font-black">Post Mini Task</h3>
              <p className="font-medium mt-1">Get quick work done by students</p>
            </div>
            <ArrowRight size={24} className="ml-auto" />
          </motion.div>
        </Link>
        <Link to="/recruiter/post-job">
          <motion.div whileHover={{ y: -4 }} className="neo-card p-8 bg-brand-secondary text-white flex items-center gap-6 cursor-pointer">
            <Briefcase size={40} />
            <div>
              <h3 className="text-2xl font-black">Post a Job</h3>
              <p className="font-medium mt-1 opacity-80">Internships, part-time & more</p>
            </div>
            <ArrowRight size={24} className="ml-auto" />
          </motion.div>
        </Link>
      </div>

      {/* Notices */}
      {notices.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black uppercase flex items-center gap-2 text-brand-dark">📢 Recent Notices</h2>
            <Link to="/recruiter/notices" className="text-sm font-bold text-brand-secondary underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notices.map((n) => (
              <div key={n._id} className="neo-card p-5 border-l-5 border-l-brand-secondary bg-white">
                <h3 className="font-bold text-lg">{n.title}</h3>
                <p className="text-sm text-brand-muted mt-2 line-clamp-2">{n.content}</p>
                <span className="text-[10px] text-brand-muted mt-3 block">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
  }