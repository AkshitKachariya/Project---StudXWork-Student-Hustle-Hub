import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Send, Globe, Clock, CheckCircle, 
  XCircle, AlertCircle, ExternalLink, User, Shield, Lock, RotateCcw, Plus, X
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlNameInput, setUrlNameInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const scrollRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/support/${id}`);
      setTicket(res.data.data);
    } catch {
      toast.error('Failed to load ticket');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // Live reload every 10 seconds
    const interval = setInterval(() => fetchTicket(), 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);

  const addAttachmentUrl = () => {
    if (!urlInput.trim()) return;
    setAttachmentUrls([...attachmentUrls, { url: urlInput.trim(), name: urlNameInput.trim() || urlInput.trim().split('/').pop() || 'file' }]);
    setUrlInput(''); setUrlNameInput('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msg.trim() && attachmentUrls.length === 0) return;

    setSending(true);
    try {
      await api.post(`/support/${id}/messages`, {
        message: msg,
        attachmentUrls
      });

      setMsg('');
      setAttachmentUrls([]);
      fetchTicket();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    setActionLoading(true);
    try {
      await api.patch(`/support/${id}`, { status });
      toast.success(`Ticket marked as ${status}`);
      fetchTicket();
    } catch {
      toast.error('Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await api.post(`/support/${id}/reopen`);
      toast.success('Ticket reopened');
      fetchTicket();
    } catch {
      toast.error('Reopen failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 animate-pulse"><div className="neo-card h-96 bg-gray-50" /></div>;
  if (!ticket) return null;

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold mb-4 hover:text-brand-primary transition-colors shrink-0">
        <ChevronLeft size={20} /> Back to Tickets
      </button>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Main Chat Thread */}
        <div className="flex-1 neo-card bg-white flex flex-col overflow-hidden">
          {/* Ticket Header */}
          <div className="p-4 border-b-3 border-brand-dark bg-brand-bg/30 flex justify-between items-center shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-brand-primary">{ticket.ticketId}</span>
                <span className={`neo-badge ${statusColors[ticket.status]} text-[9px]`}>{ticket.status}</span>
              </div>
              <h2 className="font-black uppercase text-sm md:text-base truncate max-w-[300px]">{ticket.title}</h2>
            </div>
            {isAdmin && !isClosed && (
              <div className="flex gap-2">
                {!isResolved && (
                  <button 
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={actionLoading}
                    className="neo-btn-success text-[10px] py-1 px-3 flex items-center gap-1"
                  >
                    <CheckCircle size={12} /> Resolve
                  </button>
                )}
                <button 
                  onClick={() => handleStatusChange('CLOSED')}
                  disabled={actionLoading}
                  className="neo-btn-danger text-[10px] py-1 px-3 flex items-center gap-1"
                >
                  <Lock size={12} /> Close
                </button>
              </div>
            )}
            {!isAdmin && (isResolved || isClosed) && (
               <button 
                onClick={handleReopen}
                disabled={actionLoading}
                className="neo-btn-accent text-[10px] py-1 px-3 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reopen
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
            {/* Initial Description */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary border-2 border-brand-dark flex items-center justify-center text-white text-xs font-black shrink-0">
                {ticket.createdBy?.name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm">{ticket.createdBy?.name}</span>
                  <span className="text-[10px] text-brand-muted font-bold">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <div className="neo-card p-4 bg-white text-sm leading-relaxed border-l-4 border-l-brand-primary">
                  {ticket.description}
                  {ticket.attachments?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-brand-bg flex flex-wrap gap-2">
                      {ticket.attachments.map((file, i) => (
                        <a key={i} href={file.path} target="_blank" rel="noreferrer" className="neo-badge bg-brand-bg hover:bg-brand-accent transition-colors flex items-center gap-1 text-[10px]">
                          <ExternalLink size={10} /> {file.originalName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {ticket.messages?.map((msg, idx) => {
              const isSenderAdmin = msg.sender?.role === 'admin';
              const isMyMsg = msg.sender?._id === user?.id || msg.sender === user?.id;

              return (
                <div key={idx} className={`flex gap-3 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full border-2 border-brand-dark flex items-center justify-center text-white text-xs font-black shrink-0 ${isSenderAdmin ? 'bg-brand-secondary' : 'bg-brand-primary'}`}>
                    {msg.sender?.name?.[0] || 'U'}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isMyMsg ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMyMsg ? 'flex-row-reverse' : ''}`}>
                      <span className="font-black text-sm">
                        {msg.sender?.name} {isSenderAdmin && <span className="text-[9px] bg-brand-secondary text-white px-1 rounded ml-1">ADMIN</span>}
                      </span>
                      <span className="text-[10px] text-brand-muted font-bold">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`neo-card p-4 text-sm inline-block text-left ${isSenderAdmin ? 'bg-brand-secondary/5 border-l-4 border-l-brand-secondary' : 'bg-white'}`}>
                      {msg.message}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-brand-bg flex flex-wrap gap-2">
                          {msg.attachments.map((file, i) => (
                            <a key={i} href={file.path} target="_blank" rel="noreferrer" className="neo-badge bg-brand-bg hover:bg-brand-accent transition-colors flex items-center gap-1 text-[10px]">
                              <ExternalLink size={10} /> {file.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          {!isClosed && !isResolved ? (
            <div className="p-4 border-t-3 border-brand-dark bg-white shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {attachmentUrls.map((file, i) => (
                    <div key={i} className="neo-badge bg-brand-bg flex items-center gap-2 text-[10px]">
                      <Globe size={10} /> {file.name}
                      <button type="button" onClick={() => setAttachmentUrls(attachmentUrls.filter((_, idx) => idx !== i))}><XCircle size={12} /></button>
                    </div>
                  ))}
                </div>
                {/* URL attachment input */}
                <div className="flex gap-2">
                  <input value={urlNameInput} onChange={(e) => setUrlNameInput(e.target.value)} placeholder="File name" className="neo-input w-28 text-xs" />
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste file URL..." className="neo-input flex-1 text-xs" 
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttachmentUrl(); }}} />
                  <button type="button" onClick={addAttachmentUrl} className="neo-btn-white p-2 shrink-0">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="neo-input flex-1" 
                    placeholder="Type your message..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                  <button 
                    disabled={sending}
                    className="neo-btn-primary p-2 px-4 shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-gray-100 border-t-3 border-brand-dark text-center flex flex-col items-center justify-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-brand-muted font-bold uppercase text-xs">
                <Lock size={14} /> Ticket is {ticket.status}
              </div>
              <p className="text-[10px] text-brand-muted">You cannot send more messages. Reopen the ticket if the issue persists.</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-72 space-y-4 shrink-0">
          <div className="neo-card p-5 bg-white">
            <h3 className="font-black uppercase text-xs mb-3 border-b-2 border-brand-dark pb-1">Ticket Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-brand-muted font-bold uppercase">Priority</p>
                <span className={`neo-badge inline-block mt-1 ${ticket.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-brand-muted font-bold uppercase">Category</p>
                <p className="text-sm font-bold">{ticket.category}</p>
              </div>
              {ticket.relatedTaskId && (
                <div>
                  <p className="text-[10px] text-brand-muted font-bold uppercase">Related Task</p>
                  <p className="text-sm font-bold text-brand-primary truncate">{ticket.relatedTaskId.title}</p>
                </div>
              )}
               {ticket.relatedPaymentId && (
                <div>
                  <p className="text-[10px] text-brand-muted font-bold uppercase">Payment Ref</p>
                  <p className="text-xs font-mono bg-brand-bg p-1 rounded mt-1 truncate">{ticket.relatedPaymentId}</p>
                </div>
              )}
            </div>
          </div>

          <div className="neo-card p-5 bg-brand-bg/50">
             <h3 className="font-black uppercase text-xs mb-3 border-b-2 border-brand-dark pb-1">User Details</h3>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-brand-primary text-white flex items-center justify-center font-black border-2 border-brand-dark">
                 {ticket.createdBy?.name?.[0]}
               </div>
               <div>
                 <p className="text-sm font-bold">{ticket.createdBy?.name}</p>
                 <p className="text-[10px] text-brand-muted uppercase font-bold">{ticket.userRole}</p>
               </div>
             </div>
          </div>

          {isAdmin && (
            <div className="neo-card p-5 bg-brand-secondary/5">
              <h3 className="font-black uppercase text-xs mb-3 border-b-2 border-brand-dark pb-1">Internal Admin Notes</h3>
              <textarea 
                className="neo-input text-xs resize-none h-32"
                placeholder="Only visible to other admins..."
                defaultValue={ticket.adminNotes}
                onBlur={(e) => api.patch(`/support/${id}`, { adminNotes: e.target.value })}
              />
              <p className="text-[9px] text-brand-muted mt-2">Changes are saved automatically on blur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
