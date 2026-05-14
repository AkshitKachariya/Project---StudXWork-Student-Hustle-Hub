import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Globe, AlertCircle, Plus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function RaiseTicketModal({ onClose, relatedTask, relatedPayment }) {
  const [loading, setLoading] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlNameInput, setUrlNameInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: relatedTask ? 'Task Issue' : relatedPayment ? 'Payment Issue' : 'General Inquiry',
    priority: 'LOW'
  });

  const categories = ['Task Issue', 'Payment Issue', 'Technical Issue', 'Account Issue', 'General Inquiry'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  const addAttachmentUrl = () => {
    if (!urlInput.trim()) return;
    setAttachmentUrls([...attachmentUrls, { url: urlInput.trim(), name: urlNameInput.trim() || urlInput.trim().split('/').pop() || 'file' }]);
    setUrlInput(''); setUrlNameInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Please fill all required fields');

    setLoading(true);
    try {
      const payload = {
        ...form,
        attachmentUrls
      };
      if (relatedTask && relatedTask._id) payload.relatedTaskId = relatedTask._id;
      if (relatedPayment) payload.relatedPaymentId = relatedPayment;

      await api.post('/support', payload);

      toast.success('Support ticket raised successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="neo-card bg-white w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-brand-dark text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black uppercase">Raise Support Ticket</h2>
              <p className="text-xs text-white/60 font-medium mt-1">Our team will get back to you within 24 hours.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Related Info Badge */}
            {(relatedTask || relatedPayment) && (
              <div className="neo-card p-3 bg-brand-accent/20 border-brand-accent flex items-center gap-3">
                <AlertCircle className="text-brand-dark" size={18} />
                <span className="text-sm font-bold">
                  Linking to: {relatedTask ? `Task - ${relatedTask.title}` : `Payment Ref - ${relatedPayment}`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 uppercase">Category</label>
                <select 
                  className="neo-input"
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 uppercase">Priority</label>
                <select 
                  className="neo-input"
                  value={form.priority}
                  onChange={(e) => setForm({...form, priority: e.target.value})}
                >
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Subject / Title</label>
              <input 
                type="text" 
                className="neo-input"
                placeholder="Briefly describe your issue..."
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Detailed Description</label>
              <textarea 
                rows={5}
                className="neo-input resize-none"
                placeholder="Provide as much detail as possible to help us resolve the issue faster..."
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
            </div>

            {/* Attachment URLs */}
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Attachment URLs (Optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {attachmentUrls.map((file, i) => (
                  <div key={i} className="neo-badge bg-brand-bg flex items-center gap-2">
                    <Globe size={12} />
                    <span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span>
                    <button type="button" onClick={() => setAttachmentUrls(attachmentUrls.filter((_, idx) => idx !== i))}>
                      <X size={14} className="text-brand-primary" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={urlNameInput} onChange={(e) => setUrlNameInput(e.target.value)} placeholder="File name" className="neo-input w-28 text-xs" />
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste file URL..." className="neo-input flex-1 text-xs" 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttachmentUrl(); }}} />
                <button type="button" onClick={addAttachmentUrl} className="neo-btn-white py-2 px-3 text-xs flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="neo-btn-white flex-1 py-3"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="neo-btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : <><Send size={18} /> Submit Ticket</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
