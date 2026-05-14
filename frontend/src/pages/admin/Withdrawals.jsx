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

export default function AdminWithdrawals() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState('');
  const [copiedField, setCopiedField] = useState(null);

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
    const adminNote = prompt('Add a note for the user (optional):');
    if (adminNote === null) return;

    const tid = toast.loading(`Processing withdrawal ${status}...`);
    try {
      await api.put(`/wallet/admin/requests/${id}`, { status, adminNote });
      toast.success(`Withdrawal ${status} successfully!`, { id: tid });
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Update failed', { id: tid });
    }
  };

  const copyToClipboard = (text, fieldId) => {
    navigator.clipboard.writeText(text || '');
    setCopiedField(fieldId);
    toast.success('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = t.type === 'withdrawal';
    const matchesFilter = filter === 'all' || (t.status || '').toLowerCase() === filter.toLowerCase();
    const userName = t.user?.name || '';
    const matchesSearch = userName.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesFilter && matchesSearch;
  });

  return (
    <div className="pb-20">
      <div className="section-header mb-8">
        <div>
          <div className="neo-badge bg-brand-primary text-white mb-2 uppercase tracking-widest text-[10px] font-black">Payout Hub</div>
          <h1 className="page-title">Withdrawal Requests</h1>
        </div>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: 'Pending', count: transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', count: transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').length, color: 'text-green-600 bg-green-50' },
          { label: 'Rejected', count: transactions.filter(t => t.type === 'withdrawal' && t.status === 'rejected').length, color: 'text-red-600 bg-red-50' },
          { label: 'All History', count: transactions.filter(t => t.type === 'withdrawal').length, color: 'text-brand-dark bg-gray-100' }
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
          <p className="stat-label text-brand-dark opacity-60 font-black">Pending Withdrawals</p>
          <p className="stat-value text-amber-600">
            {transactions.filter(t => t.status === 'pending' && t.type === 'withdrawal').length}
          </p>
        </div>
        <div className="stat-card border-3 border-brand-dark bg-brand-bg">
          <p className="stat-label text-brand-dark opacity-60 font-black">Total Payouts Done</p>
          <p className="stat-value text-brand-dark">
            ₹{fmt(transactions.filter(t => t.status === 'approved' && t.type === 'withdrawal').reduce((acc, curr) => acc + (Number(curr.finalAmount) || 0), 0))}
          </p>
        </div>
        <div className="stat-card border-3 border-brand-dark bg-blue-50">
          <p className="stat-label text-brand-dark opacity-60 font-black">Admin Revenue (5% Fees)</p>
          <p className="stat-value text-blue-600">
            ₹{fmt(transactions.filter(t => (t.status || '').toLowerCase() === 'approved' && t.type === 'withdrawal').reduce((acc, curr) => acc + (Number(curr.fees) || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by User Name..." 
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
          <option value="all">All History</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="neo-card p-10 animate-pulse bg-gray-100" />)}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="neo-card p-20 text-center bg-white border-3 border-brand-dark/10">
          <Info size={48} className="mx-auto text-brand-muted mb-4" />
          <h2 className="text-2xl font-black">No withdrawals found</h2>
          <p className="text-brand-muted mt-2">There are no withdrawal requests matching your filters.</p>
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
                {/* User Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 flex items-center justify-center border-3 border-brand-dark shadow-neo-sm shrink-0 bg-red-100 text-red-700`}>
                    <ArrowUpCircle size={32} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-xl uppercase tracking-tight">Withdrawal Request</span>
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

                {/* Amount Info */}
                <div className="flex flex-wrap gap-6 items-center bg-brand-bg/50 p-4 border-2 border-brand-dark/10">
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Requested</p>
                    <p className="text-lg font-black">₹{fmt(t.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-brand-muted mb-1">Fee (5%)</p>
                    <p className="text-xs font-black text-blue-600">- ₹{fmt(t.fees)}</p>
                  </div>
                  <div className="px-3 py-1 bg-brand-dark text-white border-2 border-brand-dark">
                    <p className="text-[10px] font-black uppercase text-white/60 mb-1">PAY TO USER</p>
                    <p className="text-xl font-black">₹{fmt(t.finalAmount)}</p>
                  </div>
                </div>

                {/* User Payout Details */}
                <div className="flex-1 min-w-[280px]">
                  <p className="text-[10px] font-black uppercase text-brand-muted mb-2 flex items-center gap-2">
                    <Info size={12} /> Payout Destination
                  </p>
                  <div className="space-y-1 bg-white border-2 border-brand-dark/10 p-3">
                    {t.method === 'upi' ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase leading-none">UPI ID</p>
                          <p className="font-black text-sm">{t.paymentDetails?.upiId || 'N/A'}</p>
                        </div>
                        <button onClick={() => copyToClipboard(t.paymentDetails?.upiId, t._id + 'upi')} className="p-1.5 border-2 border-brand-dark hover:bg-brand-accent transition-colors">
                          {copiedField === t._id + 'upi' ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Name', value: t.paymentDetails?.accountHolderName, key: 'name' },
                          { label: 'Acc', value: t.paymentDetails?.accountNumber, key: 'acc' },
                          { label: 'IFSC', value: t.paymentDetails?.ifscCode, key: 'ifsc' },
                          { label: 'Bank', value: t.paymentDetails?.bankName, key: 'bank' }
                        ].map(field => (
                          <div key={field.key} className="flex items-center justify-between bg-gray-50 p-1.5 border border-brand-dark/10">
                            <div className="min-w-0 flex-1">
                              <p className="text-[8px] font-bold text-brand-muted uppercase leading-none truncate">{field.label}</p>
                              <p className="font-black text-[10px] truncate">{field.value || 'N/A'}</p>
                            </div>
                            <button onClick={() => copyToClipboard(field.value, t._id + field.key)} className="p-1 hover:text-brand-primary">
                              {copiedField === t._id + field.key ? <Check size={10} /> : <Copy size={10} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  {t.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(t._id, 'approved')}
                        className="neo-btn bg-brand-dark text-white flex-1 lg:flex-initial py-2 text-xs font-black"
                      >
                        <CheckCircle size={16} /> I HAVE PAID, APPROVE
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
