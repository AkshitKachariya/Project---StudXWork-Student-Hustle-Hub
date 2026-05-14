import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Briefcase, ListTodo, MapPin, SearchX } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import UserProfileModal from '../components/UserProfileModal';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], tasks: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const basePath = user?.role === 'recruiter' ? '/recruiter' : '/student';

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const q = urlParams.get('q') || '';
    if (q && !query) {
      setQuery(q);
      performSearch(q);
    }
  }, [location.search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(res.data.data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results.users.length + results.tasks.length + results.jobs.length;

  return (
    <div className="w-full pb-10">
      <div className="section-header mb-8">
        <div>
          <div className="neo-badge bg-brand-dark text-white mb-2">Platform Search</div>
          <h1 className="page-title">Find Users</h1>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="mb-10 relative w-full">
        <input
          type="text"
          className="neo-input pl-12 py-4 text-lg w-full shadow-brutal"
          placeholder="Search by student name, recruiter name, or company name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark" size={24} />
      </form>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-dark"></div>
        </div>
      ) : results.users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.users.map(u => (
            <div 
              key={u._id} 
              className="neo-card p-6 flex flex-col bg-white"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-brand-primary border-3 border-brand-dark flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-brutal">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl truncate mb-1">{u.name}</h3>
                  {u.companyName && <p className="text-sm font-bold text-brand-secondary truncate mb-1">{u.companyName}</p>}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 border-2 border-brand-dark ${u.role === 'recruiter' ? 'bg-brand-accent text-brand-dark' : 'bg-brand-bg text-brand-dark'}`}>
                      {u.role}
                    </span>
                    {u.location && <span className="text-[10px] text-brand-muted flex items-center gap-1 font-bold uppercase"><MapPin size={10} /> {u.location}</span>}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold text-brand-muted uppercase mb-2">Top Skills</p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {u.skills?.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] font-bold bg-brand-bg border-2 border-brand-dark px-2 py-0.5">
                      {s}
                    </span>
                  ))}
                  {u.skills?.length > 4 && (
                    <span className="text-[10px] font-bold bg-gray-100 border-2 border-dashed border-gray-400 px-2 py-0.5">
                      ...
                    </span>
                  )}
                  {(!u.skills || u.skills.length === 0) && (
                    <span className="text-[10px] text-brand-muted italic">No skills listed</span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(u)}
                className="neo-btn-primary w-full py-2.5 text-sm font-black uppercase tracking-tight flex items-center justify-center gap-2"
              >
                View Full Profile
              </button>
            </div>
          ))}
        </div>
      ) : query && (
        <div className="neo-card p-12 text-center bg-gray-50 flex flex-col items-center">
          <SearchX size={48} className="text-brand-muted mb-4" />
          <h2 className="text-2xl font-black">No users found for "{query}"</h2>
          <p className="text-brand-muted mt-2 font-medium">Try searching by username or company name.</p>
        </div>
      )}

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
