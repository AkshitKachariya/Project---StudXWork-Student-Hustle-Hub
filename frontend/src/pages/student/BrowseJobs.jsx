import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, Briefcase, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ApplyModal from '../../components/ApplyModal';
import { Eye } from 'lucide-react';

const TYPE_COLORS = {
  internship: 'bg-brand-secondary text-white',
  'part-time': 'bg-brand-accent text-brand-dark',
  'full-time':  'bg-brand-success text-white',
  freelance:    'bg-brand-warning text-white',
};

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs?page=${page}&limit=9&search=${search}&type=${type}`);
      setJobs(res.data.data.docs || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [page, search, type]);

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-secondary text-white mb-2">Jobs Portal</div>
        <h1 className="page-title">Browse Jobs & Internships</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="neo-input pl-12" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="neo-input w-auto">
          <option value="">All Types</option>
          <option value="internship">Internship</option>
          <option value="part-time">Part-Time</option>
          <option value="full-time">Full-Time</option>
          <option value="freelance">Freelance</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="neo-card p-6 animate-pulse h-52 bg-gray-100" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="neo-card p-12 text-center">
          <p className="text-2xl font-bold">No jobs found</p>
          <p className="text-brand-muted mt-2">Try different filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <motion.div key={job._id} whileHover={{ y: -4 }} className="neo-card p-6 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={`neo-badge text-xs ${TYPE_COLORS[job.type] || 'bg-gray-100'}`}>{job.type}</span>
                {job.salary && <span className="font-bold text-brand-success text-sm">{job.salary}</span>}
              </div>
              <h3 className="text-xl font-bold mb-1 line-clamp-1">{job.title}</h3>
              <p className="font-semibold text-brand-secondary mb-2">{job.recruiter?.companyName || job.recruiter?.name}</p>
              <p className="text-brand-muted text-sm mb-4 flex-1 line-clamp-3">{job.description}</p>
              <div className="flex items-center gap-4 text-xs text-brand-muted border-t-2 border-brand-dark/10 pt-3 mb-4">
                <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                {job.lastDate && <span className="flex items-center gap-1"><Clock size={12} />{new Date(job.lastDate).toLocaleDateString()}</span>}
              </div>
              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {job.skills.slice(0, 3).map((s) => <span key={s} className="text-xs neo-badge bg-brand-bg">{s}</span>)}
                </div>
              )}
              <div className="flex gap-2 mt-auto">
                <Link to={`/student/jobs/${job._id}`} className="neo-btn bg-white border-brand-dark flex-1 flex items-center justify-center gap-2">
                  <Eye size={16} /> Details
                </Link>
                {job.hasApplied ? (
                  <Link to="/student/applications" className="neo-btn bg-green-50 text-brand-success border-brand-success flex-1 flex items-center justify-center gap-2 hover:bg-brand-success hover:text-white transition-all text-[13px] whitespace-nowrap">
                    <CheckCircle size={14} /> Tracking
                  </Link>
                ) : (
                  <button onClick={() => setSelected({ ...job, type: 'job' })} className="neo-btn-secondary flex-1">Apply Now</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-3 justify-center mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`neo-btn px-4 py-2 ${page === i + 1 ? 'bg-brand-dark text-white' : 'bg-white'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {selected && <ApplyModal item={selected} onClose={() => setSelected(null)} onSuccess={fetchJobs} />}
    </div>
  );
}
