import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Users, ListTodo, Briefcase, BookOpen,
  CreditCard, ArrowDownCircle, Star, Bell, HeadphonesIcon,
  Settings, LogOut, Menu, X, ShieldCheck
} from 'lucide-react';
import Logo from '../components/shared/Logo';

const links = [
  { to: '/admin',              label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/admin/users',        label: 'Users',         icon: Users },
  { to: '/admin/tasks',        label: 'Tasks',         icon: ListTodo },
  { to: '/admin/jobs',         label: 'Jobs',          icon: Briefcase },
  { to: '/admin/notes',        label: 'Notes',         icon: BookOpen },
  { to: '/admin/payments',     label: 'Deposits',      icon: CreditCard },
  { to: '/admin/withdrawals',  label: 'Withdrawals',   icon: ArrowDownCircle },
  { to: '/admin/ratings',      label: 'Ratings',       icon: Star },
  { to: '/admin/notices',      label: 'Notices',       icon: Bell },
  { to: '/admin/support',      label: 'Support',       icon: HeadphonesIcon },
  { to: '/admin/settings',     label: 'Settings',      icon: Settings },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const { user, logout, counters, fetchCounters } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => { 
    document.title = 'Admin | StudXWork';
    fetchCounters();
    const interval = setInterval(fetchCounters, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchCounters]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getCounterForLink = (label) => {
    if (!counters) return null;
    switch(label) {
      case 'Users': return { total: counters.users };
      case 'Tasks': return { total: counters.tasks };
      case 'Jobs': return { total: counters.jobs };
      case 'Notes': return { total: counters.notes };
      case 'Deposits': return { notify: counters.deposits?.pending > 0 ? counters.deposits.pending : null, total: counters.deposits?.total };
      case 'Withdrawals': return { notify: counters.withdrawals?.pending > 0 ? counters.withdrawals.pending : null, total: counters.withdrawals?.total };
      case 'Ratings': return { total: counters.ratings };
      case 'Notices': return { total: counters.notices };
      case 'Support': return { notify: counters.supports?.pending > 0 ? counters.supports.pending : null, total: counters.supports?.total };
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <aside className={`${open ? 'w-64' : 'w-16'} flex-shrink-0 bg-brand-dark text-white flex flex-col transition-all duration-300 overflow-y-auto overflow-x-hidden`}>
        <div className="flex items-center justify-between pl-3 pr-4 py-3 border-b-2 border-white/20 min-h-[64px]">
          {open && <Logo light showTagline className="scale-[0.6] origin-left" />}
          <button onClick={() => setOpen(!open)} className="p-1.5 border-2 border-white/30 hover:bg-white/10 transition-colors">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {open && (
          <div className="p-4 border-b-3 border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary border-3 border-white flex items-center justify-center font-black text-lg flex-shrink-0 relative">
                <ShieldCheck size={24} />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold truncate text-sm">{user?.name}</p>
                <span className="text-[9px] bg-brand-primary px-2 py-0.5 font-bold uppercase border border-white/30">System Admin</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 space-y-1">
          {links.map(({ to, label, icon: Icon }) => {
            const counts = getCounterForLink(label);
            return (
              <NavLink key={to} to={to} end={to === '/admin'}
                className={({ isActive }) =>
                  `${open ? 'flex items-center gap-3 px-3 py-2.5' : 'flex items-center justify-center w-10 h-10 mx-auto'} font-semibold transition-all duration-150 cursor-pointer border-2 border-transparent relative group
                  ${isActive ? 'bg-brand-primary text-white shadow-neo border-brand-primary' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <div className="relative">
                  <Icon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                </div>
                {open && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate text-sm">{label}</span>
                    {counts?.total > 0 && (
                      <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-bold border border-white/10">
                        {counts.total}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t-3 border-white/20">
          <button onClick={handleLogout} className={`${open ? 'flex items-center gap-3 px-3 py-2.5 w-full' : 'flex items-center justify-center w-10 h-10 mx-auto'} text-brand-primary hover:bg-white/10 font-semibold transition-colors border-2 border-transparent`}>
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
