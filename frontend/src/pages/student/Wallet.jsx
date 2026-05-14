import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, History, CreditCard, Landmark, Send, Info, X, Copy, Check, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const fmt = (num) => Number(num || 0).toFixed(2);

export default function WalletPage() {
  const { user, fetchUser } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'deposit' or 'withdraw'
  const [copiedField, setCopiedField] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');   // 'all','deposit','withdrawal'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all','pending','approved','rejected'

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { method: 'upi' }
  });
  const selectedMethod = watch('method');

  const walletTxLabel = (source) => {
    const map = { task: 'Task Earnings', job: 'Job Payment', note: 'Note Sale', topup: 'Deposit Credited', withdraw: 'Withdrawal Processed', admin: 'Admin Adjustment' };
    return map[source] || 'Wallet Transaction';
  };

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallet/history');
      const requests = (res.data.data.pendingRequests || []).map(r => ({ ...r, isWalletTx: false }));
      const history  = (res.data.data.history || [])
        .filter(h => !['topup', 'withdraw'].includes(h.source)) // These are already shown via Transaction records
        .map(h => ({
        _id: h._id,
        isWalletTx: true,
        type: h.type === 'credit' ? 'deposit' : 'withdrawal',
        amount: h.amount,
        fees: 0,
        finalAmount: h.amount,
        method: h.source,
        status: 'approved',
        label: walletTxLabel(h.source),
        note: h.note,
        createdAt: h.createdAt,
      }));
      const combined = [...requests, ...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTransactions(combined);
      await fetchUser();
    } catch (err) {
      console.error('Fetch Wallet Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (modalType) {
      setValue('method', 'upi');
    }
  }, [modalType, setValue]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const onDeposit = async (data) => {
    const tid = toast.loading('Submitting deposit request...');
    try {
      const payload = {
        amount: Number(data.amount),
        method: data.method,
        paymentDetails: {
          transactionId: data.transactionId,
          upiId: data.method === 'upi' ? 'admin_payment@url' : undefined,
          bankDetails: data.method === 'bank_transfer' ? 'Admin Bank Details' : undefined
        }
      };
      await api.post('/wallet/deposit', payload);
      toast.success('Deposit request submitted! Waiting for admin approval.', { id: tid });
      setModalType(null);
      reset();
      await fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed', { id: tid });
    }
  };

  const onWithdraw = async (data) => {
    const tid = toast.loading('Submitting withdrawal request...');
    try {
      const payload = {
        amount: Number(data.amount),
        method: data.method,
        paymentDetails: {
          upiId: data.upiId,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          accountHolderName: data.accountHolderName,
          branchName: data.branchName
        }
      };
      await api.post('/wallet/withdraw', payload);
      toast.success('Withdrawal request submitted! Waiting for admin approval.', { id: tid });
      setModalType(null);
      reset();
      await fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed', { id: tid });
    }
  };

  const onFormError = (err) => {
    console.error('Form Validation Errors:', err);
    toast.error('Please fill all required fields correctly');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const adminDetails = {
    upi: 'admin_payment@url',
    bank: {
      name: 'admin_name',
      accountNum: '12345678901',
      ifsc: 'admin_bank_irfc123',
      bank: 'admin_bank',
      branch: 'admin_bank_branch'
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="section-header mb-8">
        <div>
          <div className="neo-badge bg-brand-dark text-white mb-2 uppercase tracking-widest text-[10px]">Secure Wallet</div>
          <h1 className="page-title">Financial Hub</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="neo-card p-8 bg-brand-dark text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <p className="text-white/60 font-bold uppercase text-xs tracking-widest mb-2">Available Balance</p>
              <h2 className="text-5xl font-black mb-8">₹{fmt(user?.walletBalance)}</h2>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setModalType('deposit'); reset(); }}
                  className="neo-btn bg-brand-accent text-brand-dark w-full py-3"
                >
                  <Plus size={20} /> Add Funds
                </button>
                <button 
                  onClick={() => { setModalType('withdraw'); reset(); }}
                  className="neo-btn bg-white text-brand-dark w-full py-3"
                >
                  <ArrowUpCircle size={20} /> Withdraw
                </button>
              </div>
            </div>
            <Wallet className="absolute -right-10 -bottom-10 text-white/5" size={240} />
          </motion.div>

          <div className="neo-card p-6 mt-6 bg-blue-50 border-blue-200">
            <h4 className="font-bold flex items-center gap-2 text-blue-800 mb-2">
              <Info size={18} /> Payment Policy
            </h4>
            <div className="text-sm text-blue-700 leading-relaxed font-medium space-y-2">
              <p>• Deposits: 2% platform fee applies.</p>
              <p>• Withdrawals: 5% platform fee applies.</p>
              <p>• Approval typically takes 2-4 hours.</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black uppercase flex items-center gap-2">
              <History size={24} /> Transaction Log
            </h3>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            <Filter size={15} className="text-brand-muted" />
            <select
              className="neo-input w-auto py-1.5 px-3 font-black uppercase text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="task">Tasks</option>
              <option value="job">Jobs</option>
            </select>
            <select
              className="neo-input w-auto py-1.5 px-3 font-black uppercase text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved / Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="neo-card p-6 h-24 animate-pulse bg-gray-100" />)
            ) : transactions.filter(t => {
                const matchType = typeFilter === 'all' || 
                  (typeFilter === 'deposit' && !t.isWalletTx && t.type === 'deposit') ||
                  (typeFilter === 'withdrawal' && !t.isWalletTx && t.type === 'withdrawal') ||
                  (t.isWalletTx && t.method === typeFilter);
                const status = t.isWalletTx ? 'approved' : (t.status || '').toLowerCase();
                const matchStatus = statusFilter === 'all' || status === statusFilter;
                return matchType && matchStatus;
              }).length === 0 ? (
              <div className="neo-card p-12 text-center bg-white">
                <p className="text-brand-muted font-bold">No transactions found matching your filters.</p>
              </div>
            ) : (
              transactions.filter(t => {
                const matchType = typeFilter === 'all' || 
                  (typeFilter === 'deposit' && !t.isWalletTx && t.type === 'deposit') ||
                  (typeFilter === 'withdrawal' && !t.isWalletTx && t.type === 'withdrawal') ||
                  (t.isWalletTx && t.method === typeFilter);
                const status = t.isWalletTx ? 'approved' : (t.status || '').toLowerCase();
                const matchStatus = statusFilter === 'all' || status === statusFilter;
                return matchType && matchStatus;
              }).map(t => (
                <motion.div 
                  key={t._id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center border-2 border-brand-dark shadow-sm ${
                      t.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {t.type === 'deposit' ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-lg uppercase tracking-tight">
                        {t.isWalletTx ? t.label : `${t.type} Request`}
                      </p>
                      <p className="text-xs font-bold text-brand-muted flex items-center gap-2">
                        {t.isWalletTx
                          ? <span>{t.note || t.method}</span>
                          : <><span>ID: {t.paymentDetails?.transactionId || 'N/A'}</span><span>•</span></>}
                        <span>{new Date(t.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        {!t.isWalletTx && (
                          <span className="text-[10px] font-bold text-brand-muted line-through">₹{fmt(t.amount)}</span>
                        )}
                        <p className={`text-xl font-black ${
                          t.status === 'pending' ? 'text-amber-600' :
                          t.status === 'rejected' ? 'text-red-600' :
                          'text-green-600'
                        }`}>
                          {t.type === 'deposit' ? '+' : '-'} ₹{fmt(t.finalAmount)}
                        </p>
                      </div>
                      <p className="text-[10px] font-black uppercase text-brand-primary">
                        {(Number(t.fees)||0) > 0 ? `Incl. ₹${fmt(t.fees)} Fee` : (t.isWalletTx ? t.method : t.method)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-black uppercase border-2 rounded-full ${getStatusStyle(t.status)}`}>
                      {t.isWalletTx ? 'completed' : t.status}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="neo-card bg-white w-full max-w-lg p-8 relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setModalType(null)}
                className="absolute right-6 top-6 text-brand-muted hover:text-brand-dark"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black uppercase mb-2">
                {modalType === 'deposit' ? 'Add Money' : 'Withdraw Money'}
              </h2>
              <p className="text-brand-muted font-bold text-sm mb-6">
                {modalType === 'deposit' 
                  ? 'Transfer money to admin account and provide transaction ID.' 
                  : 'Transfer funds from your wallet to your personal account.'}
              </p>

              <form onSubmit={handleSubmit(modalType === 'deposit' ? onDeposit : onWithdraw, onFormError)} className="space-y-5">
                {/* Method Selection */}
                <div>
                  <label className="block text-xs font-black uppercase mb-2 tracking-widest text-brand-muted">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setValue('method', 'upi')}
                      className={`p-4 border-3 font-bold flex flex-col items-center gap-2 transition-all ${selectedMethod === 'upi' ? 'bg-brand-accent border-brand-dark shadow-neo-sm' : 'border-gray-200 text-gray-400'}`}
                    >
                      <Send size={24} /> UPI
                    </button>
                    <button 
                      type="button"
                      onClick={() => setValue('method', 'bank_transfer')}
                      className={`p-4 border-3 font-bold flex flex-col items-center gap-2 transition-all ${selectedMethod === 'bank_transfer' ? 'bg-brand-accent border-brand-dark shadow-neo-sm' : 'border-gray-200 text-gray-400'}`}
                    >
                      <Landmark size={24} /> Bank
                    </button>
                  </div>
                </div>

                {/* Admin Details for Deposit */}
                {modalType === 'deposit' && (
                  <div className="bg-brand-bg p-5 border-2 border-brand-dark space-y-4">
                    <h4 className="font-black text-xs uppercase mb-2 text-brand-dark underline">Transfer to Admin:</h4>
                    {selectedMethod === 'upi' ? (
                      <div className="flex items-center justify-between bg-white p-3 border-2 border-brand-dark/10">
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase">UPI ID</p>
                          <p className="font-black">{adminDetails.upi}</p>
                        </div>
                        <button type="button" onClick={() => copyToClipboard(adminDetails.upi, 'upi')} className="p-2 hover:bg-brand-accent transition-colors border-2 border-brand-dark">
                          {copiedField === 'upi' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[
                          { label: 'Name', value: adminDetails.bank.name, key: 'name' },
                          { label: 'Acc No', value: adminDetails.bank.accountNum, key: 'acc' },
                          { label: 'IFSC', value: adminDetails.bank.ifsc, key: 'ifsc' },
                          { label: 'Bank', value: adminDetails.bank.bank, key: 'bank' },
                          { label: 'Branch', value: adminDetails.bank.branch, key: 'branch' }
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between bg-white p-2 border-2 border-brand-dark/10">
                            <div>
                              <p className="text-[8px] font-bold text-brand-muted uppercase leading-none">{item.label}</p>
                              <p className="font-black text-xs">{item.value}</p>
                            </div>
                            <button type="button" onClick={() => copyToClipboard(item.value, item.key)} className="p-1 hover:bg-brand-accent transition-colors border-2 border-brand-dark">
                              {copiedField === item.key ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase mb-2 tracking-widest text-brand-muted">Amount (₹)</label>
                  <input 
                    type="number" 
                    {...register('amount', { 
                      required: 'Amount is required', 
                      min: { value: 100, message: 'Minimum ₹100' },
                      max: modalType === 'withdraw' ? { value: user?.walletBalance, message: 'Insufficient balance' } : undefined
                    })} 
                    className="neo-input text-2xl font-black" 
                    placeholder="0.00"
                  />
                  {errors.amount && <p className="text-red-500 text-xs font-bold mt-1">{errors.amount.message}</p>}
                </div>

                {/* Conditional Fields */}
                <div className="space-y-4">
                  {modalType === 'deposit' ? (
                    <div>
                      <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Transaction ID / UTR No.</label>
                      <input {...register('transactionId', { required: 'Transaction ID is required for verification' })} className="neo-input py-3" placeholder="Enter Ref No. after payment" />
                      {errors.transactionId && <p className="text-red-500 text-xs font-bold mt-1">{errors.transactionId.message}</p>}
                    </div>
                  ) : (
                    <>
                      {selectedMethod === 'upi' && (
                        <div>
                          <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Your UPI ID</label>
                          <input {...register('upiId', { required: true })} className="neo-input py-3" placeholder="username@bank" />
                        </div>
                      )}
                      {selectedMethod === 'bank_transfer' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Account Holder Name</label>
                            <input {...register('accountHolderName', { required: true })} className="neo-input py-3" placeholder="Full Legal Name" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Bank Name</label>
                            <input {...register('bankName', { required: true })} className="neo-input py-3" placeholder="e.g. HDFC" />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase mb-2 text-brand-muted">IFSC Code</label>
                            <input {...register('ifscCode', { required: true })} className="neo-input py-3" placeholder="IFSC0001234" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Account Number</label>
                            <input {...register('accountNumber', { required: true })} className="neo-input py-3" placeholder="000000000000" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-black uppercase mb-2 text-brand-muted">Branch Name</label>
                            <input {...register('branchName', { required: true })} className="neo-input py-3" placeholder="Branch location" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button type="submit" className="neo-btn-dark w-full py-4 text-lg mt-4">
                  Confirm {modalType === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

