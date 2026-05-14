import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    setLoading(true);
    api.get('/admin/tasks')
      .then(res => setTasks(res.data.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { 
    fetchTasks(); 
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { 
      await api.delete(`/tasks/${id}`); 
      toast.success('Deleted'); 
      fetchTasks(); 
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to delete'); 
    }
  };

  return (
    <div>
      <h1 className="page-title mb-6">Task Moderation</h1>
      <div className="neo-card overflow-x-auto">
        <table className="neo-table">
          <thead><tr><th>Title</th><th>Recruiter</th><th>Budget</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr> :
             tasks.length === 0 ? <tr><td colSpan="5" className="text-center py-8">No tasks</td></tr> :
             tasks.map(t => (
              <tr key={t._id}>
                <td className="font-bold">{t.title}</td>
                <td>{t.recruiter?.companyName || t.recruiter?.name}</td>
                <td className="font-bold text-brand-success">₹{t.budget}</td>
                <td><span className={t.status === 'open' ? 'badge-open' : 'badge-closed'}>{t.status}</span></td>
                <td><button onClick={() => deleteItem(t._id)} className="neo-btn-danger px-2 py-1"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
