import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, ArrowDownCircle, ArrowUpCircle, 
  CheckCircle, XCircle, Search, Filter,
  User, Calendar, Landmark, Send, Info, Copy, Check
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const fmt = (num) => Number(num || 0).toFixed(2);

export default function AdminPayments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/wallet/admin/requests');
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, status) => {
    const adminNote = prompt('Add a note (optional):');
    if (adminNote === null) return; // Cancelled
    
    const tid = toast.loading(`Processing ${status}...`);
    try {
      await api.put(`/wallet/admin/requests/${id}`, { status, adminNote });
      toast.success(`Transaction ${status} successfully!`, { id: tid });
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed', { id: tid });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Transaction ID Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = t.type === 'deposit';
    const matchesFilter = filter === 'all' || (t.status || '').toLowerCase() === filter.toLowerCase();
    const userName = t.user?.name || '';
    const txnId = t.paymentDetails?.transactionId || '';
    const matchesSearch = userName.toLowerCase().includes(search.toLowerCase()) || 
                          txnId.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesFilter && matchesSearch;
  });

  return (
    <div className="pb-20">
      <div className="section-header mb-8">
        <div>
          <div className="neo-badge bg-brand-primary text-white mb-2 uppercase tracking-widest text-[10px] font-black">Finance Control</div>
          <h1 className="page-title">Deposit Verifications</h1>
        </div>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: 'Pending', count: transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', count: transactions.filter(t => t.type === 'deposit' && t.status === 'approved').length, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', count: transactions.filter(t => t.type === 'deposit' && t.status === 'rejected').length, color: 'text-red-600 bg-red-50' },
          { label: 'All History', count: transactions.filter(t => t.type === 'deposit').length, color: 'text-brand-dark bg-gray-100' }
        ].map((c, idx) => (
          <div key={idx} className={`px-4 py-2 border-2 border-brand-dark shadow-neo-sm flex items-center gap-3 ${c.color}`}>
            <span className="text-[10px] font-black uppercase tracking-wider">{c.label}</span>
            <span className="text-xl font-black">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="stat-card border-3 border-brand-dark bg-amber-50">
          <p className="stat-label text-brand-dark opacity-60 font-black">Pending Requests</p>
          <p className="stat-value text-amber-600">
            {transactions.filter(t => t.status === 'pending' && t.type === 'deposit').length}
          </p>
        </div>
        <div className="stat-card border-3 border-brand-dark bg-green-50">
          <p className="stat-label text-brand-dark opacity-60 font-black">Total Deposits (Final)</p>
          <p className="stat-value text-green-600">
            ₹{fmt(transactions.filter(t => t.status === 'approved' && t.type === 'deposit').reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0))}
          </p>
        </div>
        <div className="stat-card border-3 border-brand-dark bg-blue-50">
          <p className="stat-label text-brand-dark opacity-60 font-black">Admin Revenue (2% Fees)</p>
          <p className="stat-value text-blue-600">
            ₹{fmt(transactions.filter(t => (t.status || '').toLowerCase() === 'approved' && t.type === 'deposit').reduce((acc, curr) => acc + (Number(curr.fees) || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by User Name or Transaction ID..." 
            className="neo-input pl-12 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="neo-input w-auto font-black uppercase text-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">Pending Requests</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Transactions</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="neo-card p-10 animate-pulse bg-gray-100" />)}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="neo-card p-20 text-center bg-white border-3 border-brand-dark/10">
          <Info size={48} className="mx-auto text-brand-muted mb-4" />
          <h2 className="text-2xl font-black">No requests found</h2>
          <p className="text-brand-muted mt-2">There are no deposit requests matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTransactions.map(t => (
            <motion.div 
              key={t._id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`neo-card p-6 bg-white border-l-[12px] ${t.status === 'pending' ? 'border-l-amber-400 shadow-neo' : t.status === 'approved' ? 'border-l-green-500 opacity-80' : 'border-l-red-500 opacity-80'}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* User & Type */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 flex items-center justify-center border-3 border-brand-dark shadow-neo-sm shrink-0 bg-green-100 text-green-700`}>
                    <ArrowDownCircle size={32} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-xl uppercase tracking-tight">Deposit Request</span>
                      <div className="flex items-center gap-1 bg-brand-bg px-2 py-1 border-2 border-brand-dark">
                        <span className="text-[10px] font-black uppercase text-brand-muted">UTR:</span>
                        <span className="text-xs font-black">{t.paymentDetails?.transactionId || 'N/A'}</span>
                        <button onClick={() => copyToClipboard(t.paymentDetails?.transactionId || '', t._id)} className="ml-1 hover:text-brand-primary">
                          {copiedId === t._id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-brand-primary" />
                      <p className="font-bold">{t.user?.name || 'Unknown'} <span className="text-[10px] font-black px-1.5 py-0.5 bg-gray-100 border border-gray-300 uppercase ml-1">{t.user?.role || 'N/A'}</span></p>
                      <span className="text-brand-muted">•</span>
                      <Calendar size={14} className="text-brand-primary" />
                      <p className="text-xs font-medium text-brand-muted">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Amount & Method Info */}
                <div className="flex flex-wrap gap-8 items-center bg-brand-bg/50 p-4 border-2 border-brand-dark/10 flex-1">
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Total Sent</p>
                    <p className="text-xl font-black">₹{fmt(t.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Fee (2%)</p>
                    <p className="text-xs font-black text-blue-600">- ₹{fmt(t.fees)}</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 border-2 border-green-600/20">
                    <p className="text-[10px] font-black uppercase text-green-700 mb-1">To Wallet</p>
                    <p className="text-xl font-black text-green-700">₹{fmt(t.finalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Method</p>
                    <p className="font-bold flex items-center gap-2 uppercase text-xs">
                      {t.method === 'upi' ? <Send size={14} /> : <Landmark size={14} />}
                      {t.method || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  {t.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(t._id, 'approved')}
                        className="neo-btn bg-green-500 text-white flex-1 lg:flex-initial py-2 text-xs font-black"
                      >
                        <CheckCircle size={16} /> VERIFY & APPROVE
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(t._id, 'rejected')}
                        className="neo-btn bg-red-500 text-white flex-1 lg:flex-initial py-2 text-xs font-black"
                      >
                        <XCircle size={16} /> REJECT
                      </button>
                    </>
                  ) : (
                    <div className={`text-center font-black uppercase text-[10px] p-2 border-2 border-brand-dark ${t.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status}
                    </div>
                  )}
                </div>
              </div>
              {t.adminNote && (
                <div className="mt-4 p-3 bg-gray-50 border-2 border-brand-dark/5 text-xs font-bold text-brand-muted italic">
                  Note: "{t.adminNote}"
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
