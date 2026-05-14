import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Wallet } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function RecruiterReports() {
  const [stats, setStats] = useState({ tasks: 0, jobs: 0, applicants: 0, spent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, j, w] = await Promise.all([api.get('/tasks/my'), api.get('/jobs/my'), api.get('/wallet')]);
        setStats({
          tasks: t.data.count || 0,
          jobs: j.data.count || 0,
          applicants: 0, // Simplified for now
          spent: (w.data.transactions || []).filter(tx => tx.type === 'debit').reduce((s, tx) => s + tx.amount, 0)
        });
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-primary text-white mb-2">Analytics</div>
        <h1 className="page-title">Hiring Reports</h1>
      </div>

      {loading ? <div className="grid grid-cols-2 gap-4"><div className="neo-card p-8 h-32 animate-pulse bg-gray-100"/><div className="neo-card p-8 h-32 animate-pulse bg-gray-100"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="neo-card p-6 bg-brand-primary text-white">
            <TrendingUp size={24} className="mb-2 opacity-80" />
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">Total Tasks Posted</p>
            <p className="text-4xl font-black mt-1">{stats.tasks}</p>
          </div>
          <div className="neo-card p-6 bg-brand-secondary text-white">
            <TrendingUp size={24} className="mb-2 opacity-80" />
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">Total Jobs Posted</p>
            <p className="text-4xl font-black mt-1">{stats.jobs}</p>
          </div>
          <div className="neo-card p-6 bg-brand-dark text-white">
            <Wallet size={24} className="mb-2 opacity-80" />
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">Total Spent (₹)</p>
            <p className="text-4xl font-black mt-1">₹{stats.spent}</p>
          </div>
          <div className="neo-card p-6 bg-brand-accent text-brand-dark">
            <BarChart3 size={24} className="mb-2 opacity-80" />
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">Hiring Rate</p>
            <p className="text-4xl font-black mt-1">N/A</p>
          </div>
        </div>
      )}

      <div className="neo-card p-8 text-center text-brand-muted">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">Detailed Charts Coming Soon</h3>
        <p>We are working on adding comprehensive charts and data exports for your hiring pipeline.</p>
      </div>
    </div>
  );
}
