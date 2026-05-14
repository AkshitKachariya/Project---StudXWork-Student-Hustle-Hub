import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    api.get('/admin/jobs')
      .then(res => setJobs(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { 
    fetchJobs(); 
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try { 
      await api.delete(`/jobs/${id}`); 
      toast.success('Deleted'); 
      fetchJobs(); 
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to delete'); 
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Job Moderation</h1>
      <div className="neo-card overflow-x-auto">
        <table className="neo-table">
          <thead><tr><th>Title</th><th>Recruiter</th><th>Type</th><th>Salary</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr> :
             jobs.length === 0 ? <tr><td colSpan="5" className="text-center py-8">No jobs</td></tr> :
             jobs.map(j => (
              <tr key={j._id}>
                <td className="font-bold">{j.title}</td>
                <td>{j.recruiter?.companyName || j.recruiter?.name}</td>
                <td className="capitalize">{j.type}</td>
                <td className="font-bold text-brand-success">{j.salary || 'N/A'}</td>
                <td><button onClick={() => deleteItem(j._id)} className="neo-btn-danger px-2 py-1"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
