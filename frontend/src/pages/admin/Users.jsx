import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, Trash2, Search, Wallet } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?role=${role}&search=${search}&limit=50`);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to load users';
      toast.error(msg);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      api.get(`/admin/users?role=${role}&search=${search}&limit=50`)
        .then(res => setUsers(res.data.data || []))
        .catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [role, search]);

  const toggleStatus = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle`);
      toast.success('User status updated');
      fetchUsers();
    } catch { toast.error('Failed to update'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">User Management</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="neo-input pl-10" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="neo-input w-40">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="recruiter">Recruiters</option>
        </select>
      </div>

      <div className="neo-card overflow-x-auto">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th><div className="flex items-center gap-1"><Wallet size={14} /> Wallet</div></th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr> :
              users.length === 0 ? <tr><td colSpan="6" className="text-center py-8">No users found</td></tr> :
                users.map(u => (
                  <tr key={u._id}>
                    <td className="font-bold">{u.name} {u.companyName && <span className="text-xs text-brand-muted block">{u.companyName}</span>}</td>
                    <td>{u.email}</td>
                    <td><span className={`neo-badge text-[10px] ${u.role === 'admin' ? 'bg-brand-dark text-white' : u.role === 'recruiter' ? 'bg-brand-secondary text-white' : 'bg-brand-primary text-white'}`}>{u.role}</span></td>
                    <td>
                      <span className={`font-black text-sm ${(u.walletBalance || 0) > 0 ? 'text-green-600' : 'text-brand-muted'}`}>
                        ₹{Number(u.walletBalance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={u.isActive ? 'badge-active' : 'badge-rejected'}>{u.isActive ? 'Active' : 'Banned'}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => toggleStatus(u._id)} className={`neo-btn px-2 py-1 text-xs ${u.isActive ? 'bg-brand-warning text-white' : 'bg-brand-success text-white'}`}>
                          {u.isActive ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
                        </button>
                        {u.role !== 'admin' && (
                          <button onClick={() => deleteUser(u._id)} className="neo-btn bg-brand-primary text-white px-2 py-1 text-xs">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
