import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, MessageSquare, Clock, 
  CheckCircle, XCircle, AlertCircle, ArrowRight, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import RaiseTicketModal from '../components/RaiseTicketModal';
import toast from 'react-hot-toast';

export default function SupportTickets() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
  const [search, setSearch] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filter);
      if (search) params.append('search', search);
      const res = await api.get(`/support?${params.toString()}`);
      setTickets(res.data.data);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [filter, search]);

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800'
  };

  const priorityColors = {
    LOW: 'bg-gray-50 text-gray-600',
    MEDIUM: 'bg-blue-50 text-blue-600',
    HIGH: 'bg-orange-50 text-orange-600',
    URGENT: 'bg-red-50 text-red-600'
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="neo-badge bg-brand-primary text-white mb-2">Help Center</div>
          <h1 className="page-title">{isAdmin ? 'Support Management' : 'My Support Tickets'}</h1>
          <p className="text-brand-muted font-medium mt-1">
            {isAdmin ? 'Manage and respond to user issues' : 'Track and manage your requests'}
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="neo-btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Raise New Ticket
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or Title..." 
            className="neo-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="neo-input"
          value={filter.status}
          onChange={(e) => setFilter({...filter, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select 
          className="neo-input"
          value={filter.category}
          onChange={(e) => setFilter({...filter, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Task Issue">Task Issue</option>
          <option value="Payment Issue">Payment Issue</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Account Issue">Account Issue</option>
          <option value="General Inquiry">General Inquiry</option>
        </select>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="neo-card p-6 animate-pulse h-24 bg-gray-100" />
          ))
        ) : tickets.length === 0 ? (
          <div className="neo-card p-12 text-center bg-white">
            <MessageSquare size={48} className="mx-auto mb-4 text-brand-muted opacity-20" />
            <p className="text-xl font-bold text-brand-muted">No tickets found</p>
            {!isAdmin && <p className="text-sm mt-1 text-brand-muted">Need help? Raise a ticket above.</p>}
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link 
              key={ticket._id} 
              to={isAdmin ? `/admin/support/${ticket._id}` : `/${user?.role}/support/${ticket._id}`}
            >
              <motion.div 
                whileHover={{ x: 5 }}
                className="neo-card p-5 bg-white flex flex-col md:flex-row md:items-center gap-4 group cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-black text-brand-primary">{ticket.ticketId}</span>
                    <span className={`neo-badge ${statusColors[ticket.status]} text-[10px]`}>{ticket.status}</span>
                    <span className={`neo-badge ${priorityColors[ticket.priority]} text-[10px]`}>{ticket.priority}</span>
                    <span className="neo-badge bg-brand-bg text-[10px]">{ticket.category}</span>
                  </div>
                  <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{ticket.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted font-medium">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    {isAdmin && (
                      <span className="flex items-center gap-1">
                        <User size={12} /> {ticket.createdBy?.name} ({ticket.userRole})
                      </span>
                    )}
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {ticket.messages?.length || 0} messages</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <ArrowRight size={20} className="text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
                </div>
              </motion.div>
            </Link>
          ))
        )}
      </div>

      {showModal && <RaiseTicketModal onClose={() => { setShowModal(false); fetchTickets(); }} />}
    </div>
  );
}
