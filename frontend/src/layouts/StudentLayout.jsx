import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, ListTodo, Briefcase, Send,
  MessageCircle, Wallet, BookOpen, Bell, Settings, LogOut,
  Menu, X, User, ClipboardCheck, HeadphonesIcon, Search
} from "lucide-react";
import Logo from "../components/shared/Logo";

const links = [
  { to: '/student',             label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/student/search',      label: 'Search',        icon: Search },
  { to: '/student/tasks',       label: 'Browse Tasks',  icon: ListTodo },
  { to: '/student/jobs',        label: 'Browse Jobs',   icon: Briefcase },
  { to: '/student/applications',label: 'My Applications',icon: Send },
  { to: '/student/my-tasks',    label: 'My Tasks',      icon: ClipboardCheck },
  { to: '/student/notes',       label: 'Study Notes',   icon: BookOpen },
  { to: '/student/chat',        label: 'Messages',      icon: MessageCircle },
  { to: '/student/wallet',      label: 'Wallet',        icon: Wallet },
  { to: '/student/notices',     label: 'Notices',       icon: Bell },
  { to: '/student/profile',     label: 'Profile',       icon: User },
  { to: '/student/support',     label: 'Support',       icon: HeadphonesIcon },
  { to: '/student/settings',    label: 'Settings',      icon: Settings },
];

export default function StudentLayout() {
  const [open, setOpen] = useState(true);
  const { user, logout, counters, fetchCounters } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Student | StudXWork';
    fetchCounters();
    const interval = setInterval(fetchCounters, 60000);
    const handleChatRead = () => fetchCounters();
    window.addEventListener('chat_read', handleChatRead);
    return () => {
      window.removeEventListener('chat_read', handleChatRead);
      clearInterval(interval);
    };
  }, [fetchCounters]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getCounterForLink = (label) => {
    if (!counters) return null;
    switch(label) {
      case 'Browse Tasks': return { total: counters.browseTasks };
      case 'Browse Jobs': return { total: counters.browseJobs };
      case 'My Applications': return { total: counters.myApplications };
      case 'My Tasks': return { total: counters.myTasks };
      case 'Study Notes': return { total: counters.studyNotes };
      case 'Messages': return { total: counters.messages?.new > 0 ? counters.messages.new : null };
      case 'Notices': return { total: counters.notice };
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      {/* Sidebar */}
      <aside className={`${open ? 'w-64' : 'w-18'} flex-shrink-0 bg-brand-bg border-r-3 border-brand-dark flex flex-col transition-all duration-300 overflow-y-auto overflow-x-hidden`}>
        <div className="flex items-center justify-between pl-3 pr-4 py-3 border-b-3 border-brand-dark min-h-[64px]">
          {open && <Logo showTagline className="scale-[0.6] origin-left" />}
          <button onClick={() => setOpen(!open)} className="p-1.5 border-3 border-brand-dark hover:bg-brand-secondary/10 transition-colors">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {open && (
          <div className="p-4 border-b-3 border-brand-dark">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary border-3 border-brand-dark flex items-center justify-center text-white font-black text-xl flex-shrink-0 relative shadow-neo-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold truncate text-sm">{user?.name}</p>
                <span className="neo-badge bg-brand-accent text-brand-dark text-[9px] py-0.5 px-2">Student</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 space-y-1.5">
          {links.map(({ to, label, icon: Icon }) => {
            const counts = getCounterForLink(label);
            return (
              <NavLink key={to} to={to} end={to === '/student'}
                className={({ isActive }) => `${open ? 'sidebar-link' : 'sidebar-collapsed-link'} ${isActive ? 'active' : ''} relative flex items-center group`}>
                <div className="relative">
                  <Icon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                </div>
                {open && (
                  <div className="flex items-center justify-between flex-1 ml-3 overflow-hidden">
                    <span className="truncate font-bold text-sm">{label}</span>
                    {counts?.total > 0 && (
                      <span className="neo-badge bg-brand-bg text-brand-dark text-[10px] py-0 px-1.5 border-brand-dark/40 scale-90">
                        {counts.total}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t-3 border-brand-dark">
          <button onClick={handleLogout} className={`${open ? 'sidebar-link' : 'sidebar-collapsed-link'} w-full text-brand-primary`}>
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
