import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import io from 'socket.io-client';

// Auth Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Student Pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import BrowseTasks from './pages/student/BrowseTasks';
import BrowseJobs from './pages/student/BrowseJobs';
import MyApplications from './pages/student/MyApplications';
import StudentWallet from './pages/student/Wallet';
import BrowseNotes from './pages/student/BrowseNotes';
import StudentChat from './pages/student/Chat';
import StudentProfile from './pages/student/Profile';
import StudentSettings from './pages/student/Settings';
import StudentNotices from './pages/student/Notices';
import TaskDetails from './pages/student/TaskDetails';
import JobDetails from './pages/student/JobDetails';
import MyTasks from './pages/student/MyTasks';
import SharedWorkspace from './pages/SharedWorkspace';

// Recruiter Pages
import RecruiterLayout from './layouts/RecruiterLayout';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import PostTask from './pages/recruiter/PostTask';
import PostJob from './pages/recruiter/PostJob';
import ManageListings from './pages/recruiter/ManageListings';
import ViewApplicants from './pages/recruiter/ViewApplicants';
import RecruiterChat from './pages/recruiter/Chat';
import RecruiterWallet from './pages/recruiter/Wallet';
import RecruiterProfile from './pages/recruiter/Profile';
import RecruiterNotices from './pages/recruiter/Notices';
import RecruiterSettings from './pages/recruiter/Settings';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminTasks from './pages/admin/Tasks';
import AdminJobs from './pages/admin/Jobs';
import AdminNotes from './pages/admin/Notes';
import AdminPayments from './pages/admin/Payments';
import AdminWithdrawals from './pages/admin/Withdrawals';
import AdminRatings from './pages/admin/Ratings';
import AdminNotices from './pages/admin/Notices';
import AdminSettings from './pages/admin/Settings';

// Shared
import GlobalSearch from './pages/GlobalSearch';
import SupportTickets from './pages/SupportTickets';
import TicketDetails from './pages/TicketDetails';

// Guards
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { initAxios, user, isAuthenticated, logout, fetchCounters } = useAuthStore();
  
  useEffect(() => {
    initAxios();
    
    if (isAuthenticated && user) {
      const socket = io('http://localhost:5000');
      const userId = user.id || user._id;
      socket.emit('join', userId);
      
      socket.on(`account_status_${userId}`, (data) => {
        if (data.isActive === false) {
          toast.error('Your account has been suspended by an admin.', { duration: 6000 });
          logout();
        } else if (data.isActive === true) {
          toast.success('Your account has been activated!', { duration: 6000 });
        }
      });

      socket.on(`walletUpdate_${userId}`, (data) => {
        toast.success(`Wallet ${data.amount > 0 ? 'Credited' : 'Debited'}! ${data.amount > 0 ? '+' : '-'}₹${Math.abs(data.amount)}`, { icon: '💰', duration: 5000 });
        fetchCounters();
      });
      
      socket.on(`taskUpdate_${userId}`, (data) => {
        const msgs = {
          assigned: 'You have been assigned a new task! 🎉',
          submitted: 'Task work submitted for review 📤',
          revision: `Revision requested: ${data.feedback || 'Please check workspace'} 🔁`,
          completed: 'Task completed! Payment released ✅',
          rejected: 'Task rejected ❌',
          in_progress: 'Task is now in progress 🔨'
        };
        if (msgs[data.status]) toast(msgs[data.status], { icon: '🔔', duration: 5000 });
        fetchCounters();
      });

      socket.on('receiveMessage', () => {
        fetchCounters();
      });

      socket.on(`newApplication_${userId}`, () => {
        toast.success('New application received! 📄', { icon: '📄' });
        fetchCounters();
      });

      socket.on('newListing', (data) => {
        if (user.role === 'student') {
          toast(`New ${data.type} posted: ${data.title}`, { icon: '💼' });
          fetchCounters();
        }
      });
      
      socket.on('newNotice', (notice) => {
        if (notice.target === 'all' || notice.target === user.role) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1">
                <span className="font-black flex items-center gap-2">📢 {notice.title}</span>
                <span className="text-sm font-medium opacity-80">{notice.content}</span>
              </div>
            ),
            { icon: '📢', duration: 6000 }
          );
          fetchCounters();
        }
      });
      
      return () => {
        socket.off(`account_status_${userId}`);
        socket.off(`walletUpdate_${userId}`);
        socket.off(`taskUpdate_${userId}`);
        socket.off(`newApplication_${userId}`);
        socket.off('receiveMessage');
        socket.off('newListing');
        socket.off('newNotice');
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchCounters]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { border: '3px solid #1A1A2E', borderRadius: '0', fontFamily: 'Space Grotesk', fontWeight: 600 } }} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student */}
        <Route path="/student" element={<PrivateRoute roles={['student']}><StudentLayout /></PrivateRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="tasks" element={<BrowseTasks />} />
          <Route path="jobs" element={<BrowseJobs />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="wallet" element={<StudentWallet />} />
          <Route path="notes" element={<BrowseNotes />} />
          <Route path="chat" element={<StudentChat />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="notices" element={<StudentNotices />} />
          <Route path="settings" element={<StudentSettings />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="workspace/:taskId" element={<SharedWorkspace />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="support/:id" element={<TicketDetails />} />
        </Route>

        {/* Recruiter */}
        <Route path="/recruiter" element={<PrivateRoute roles={['recruiter']}><RecruiterLayout /></PrivateRoute>}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="post-task" element={<PostTask />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="listings" element={<ManageListings />} />
          <Route path="applicants" element={<ViewApplicants />} />
          <Route path="chat" element={<RecruiterChat />} />
          <Route path="wallet" element={<RecruiterWallet />} />
          <Route path="profile" element={<RecruiterProfile />} />
          <Route path="notices" element={<RecruiterNotices />} />
          <Route path="review/:taskId" element={<SharedWorkspace />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="support/:id" element={<TicketDetails />} />
          <Route path="settings" element={<RecruiterSettings />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="notes" element={<AdminNotes />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="ratings" element={<AdminRatings />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="support/:id" element={<TicketDetails />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
