import { Users, Briefcase, ListTodo, BookOpen, TrendingUp, Star } from 'lucide-react';
import api from '../../utils/api';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const fmt = (num) => Number(num || 0).toFixed(2);

const StatCard = ({ label, value, color, icon: Icon, onClick, subValue }) => (
    <motion.div 
        whileHover={{ y: -4 }} 
        onClick={onClick}
        className={`stat-card border-3 border-brand-dark ${color} cursor-pointer relative overflow-hidden group`}
    >
        <div className="flex items-center justify-between mb-2">
            <span className="stat-label font-black uppercase opacity-60 text-[10px]">{label}</span>
            {Icon && <Icon size={20} className="opacity-40 group-hover:scale-110 transition-transform" />}
        </div>
        <div className="flex items-baseline gap-2">
            <span className="stat-value font-black text-2xl">{value}</span>
            {subValue && <span className="text-[10px] font-bold opacity-60">{subValue}</span>}
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-brand-dark/10 group-hover:bg-brand-dark/30 transition-colors w-full" />
    </motion.div>
);

export default function AdminDashboard() {
    const { counters, fetchCounters } = useAuthStore();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(!counters);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [noticesRes] = await Promise.all([
                api.get('/notices'),
                fetchCounters()
            ]);
            setNotices(noticesRes.data.data?.slice(0, 3) || []);
        } catch (err) {
            console.error('Admin Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-xl font-bold">Loading Analytics...</div>;

    return (
        <div>
            <div className="mb-8">
                <div className="neo-badge bg-brand-primary text-white mb-2">Platform Overview</div>
                <h1 className="page-title">Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    label="Users" 
                    value={counters?.users || 0} 
                    icon={Users} 
                    color="bg-brand-primary/10" 
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard 
                    label="Tasks" 
                    value={counters?.tasks || 0} 
                    icon={ListTodo} 
                    color="bg-brand-accent/30" 
                    onClick={() => navigate('/admin/tasks')}
                />
                <StatCard 
                    label="Jobs" 
                    value={counters?.jobs || 0} 
                    icon={Briefcase} 
                    color="bg-white" 
                    onClick={() => navigate('/admin/jobs')}
                />
                <StatCard 
                    label="Approved Notes" 
                    value={counters?.notes || 0} 
                    icon={BookOpen} 
                    color="bg-white" 
                    onClick={() => navigate('/admin/notes')}
                />

                <StatCard 
                    label="Deposits" 
                    value={counters?.deposits?.total || 0} 
                    subValue={`(${counters?.deposits?.new || 0} New / ${counters?.deposits?.pending || 0} Pending)`}
                    color="bg-green-50" 
                    onClick={() => navigate('/admin/payments')}
                />

                <StatCard 
                    label="Withdrawals" 
                    value={counters?.withdrawals?.total || 0} 
                    subValue={`(${counters?.withdrawals?.new || 0} New / ${counters?.withdrawals?.pending || 0} Pending)`}
                    color="bg-brand-bg" 
                    onClick={() => navigate('/admin/withdrawals')}
                />

                <StatCard 
                    label="Ratings" 
                    value={counters?.ratings || 0} 
                    icon={Star}
                    color="bg-yellow-50" 
                    onClick={() => navigate('/admin/ratings')}
                />

                <StatCard 
                    label="Support" 
                    value={counters?.supports?.total || 0} 
                    subValue={`(${counters?.supports?.new || 0} New / ${counters?.supports?.pending || 0} Pending)`}
                    color="bg-blue-50" 
                    onClick={() => navigate('/admin/support')}
                />

                <StatCard 
                    label="Total Revenue" 
                    value={`₹${fmt(counters?.totalRevenue)}`} 
                    icon={TrendingUp} 
                    color="bg-brand-dark text-green-600" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="neo-card p-6 bg-brand-bg border-l-5 border-l-brand-dark">
                    <h2 className="text-xl font-black uppercase mb-4">📢 Recent Notices</h2>
                    {notices.length === 0 ? (
                        <p className="text-brand-muted">No notices sent recently.</p>
                    ) : (
                        <div className="space-y-4">
                            {notices.map(n => (
                                <div key={n._id} className="border-b-2 border-brand-dark pb-2 last:border-0">
                                    <h3 className="font-bold">{n.title}</h3>
                                    <p className="text-xs text-brand-muted mt-1 truncate">{n.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="neo-card p-6 bg-brand-bg flex flex-col justify-center text-center">
                    <h2 className="text-xl font-black uppercase mb-2">System Status: Optimal</h2>
                    <p className="text-brand-muted text-sm">All services are running smoothly. Keep an eye on pending withdrawals and notes moderation.</p>
                </div>
            </div>
        </div>
    );
}
