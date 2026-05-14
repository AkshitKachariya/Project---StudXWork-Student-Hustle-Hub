import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ApplyModal({ item, onClose, onSuccess }) {
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposal.trim()) return toast.error('Please write a proposal');
    setLoading(true);
    try {
      const payload = { proposal, bidAmount: bidAmount || 0 };
      if (item.type === 'task') payload.taskId = item._id;
      else payload.jobId = item._id;
      await api.post('/applications', payload);
      toast.success('Application submitted!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="neo-card bg-white w-full max-w-lg p-8 relative max-h-[95vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 border-2 border-brand-dark hover:bg-brand-primary hover:text-white transition-colors">
            <X size={18} />
          </button>

          <h2 className="text-2xl font-black uppercase mb-1">Apply / Submit Proposal</h2>
          <p className="text-brand-muted font-medium mb-6">{item.title}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold mb-1">Your Proposal <span className="text-brand-primary">*</span></label>
              <textarea value={proposal} onChange={(e) => setProposal(e.target.value)}
                rows={5} className="neo-input resize-none"
                placeholder="Introduce yourself, explain why you're the right fit, and describe how you'd approach this task..." />
            </div>
            {item.type === 'task' && (
              <div>
                <label className="block font-bold mb-1">Your Bid Amount (₹) <span className="text-brand-muted text-xs">(optional)</span></label>
                <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                  className="neo-input" placeholder={`Budget: ₹${item.budget || item.salary || 'Negotiable'}`} />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="neo-btn-white flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="neo-btn-primary flex-1">
                {loading ? 'Submitting...' : 'Submit Application →'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
