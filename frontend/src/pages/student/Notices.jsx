import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../utils/api';

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notices?role=student').then(res => setNotices(res.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-primary text-white mb-2">Announcements</div>
        <h1 className="page-title">Notices</h1>
      </div>
      {loading ? <div className="neo-card p-8 animate-pulse h-24 bg-gray-100" /> :
       notices.length === 0 ? (
        <div className="neo-card p-12 text-center"><Bell size={48} className="mx-auto mb-4 text-brand-muted" /><p className="text-xl font-bold">No notices</p></div>
       ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n._id} className="neo-card p-6 border-l-5 border-l-brand-primary">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{n.title}</h3>
                <span className="neo-badge bg-brand-bg text-xs">{n.target === 'all' ? 'Everyone' : n.target}</span>
              </div>
              <p className="text-brand-muted mt-2">{n.content}</p>
              <p className="text-xs text-brand-muted mt-3">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
