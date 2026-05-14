import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function StudentSettings() {
  const { user, logout } = useAuthStore();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.put('/auth/change-password', { 
        email: user.email,
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      });
      toast.success(res.data.message || 'Password updated! Redirecting...');
      reset();
      setTimeout(() => logout(), 2000);
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update password';
      toast.error(errorMsg, { duration: 4000 }); 
    }
    finally { setLoading(false); }
  };

  const onSubmitTicket = async (data) => {
    // Logic removed as per request
  };

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-dark text-white mb-2">Preferences</div>
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Change Password */}
        <div className="neo-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-8 bg-brand-primary"></div>
            <h2 className="text-xl font-black uppercase">Change Password</h2>
          </div>
          
          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
            {/* Field 1: Email (Read Only) */}
            <div>
              <label className="block font-bold mb-1 text-sm text-brand-muted">Login Email (Read Only)</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                readOnly 
                disabled
                className="neo-input bg-brand-bg/50 cursor-not-allowed opacity-70 font-mono text-sm" 
              />
            </div>

            {/* Field 2: Current Password */}
            <div className="relative">
              <label className="block font-bold mb-1">Current Password</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                {...register('currentPassword', { required: true })} 
                className="neo-input pr-12" 
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[38px] text-brand-muted">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Field 3: New Password */}
            <div>
              <label className="block font-bold mb-1">New Password</label>
              <input 
                type="password" 
                {...register('newPassword', { required: true, minLength: 6 })} 
                className="neo-input" 
                placeholder="Minimum 6 characters" 
              />
            </div>

            {/* Field 4: Confirm Password */}
            <div>
              <label className="block font-bold mb-1">Confirm New Password</label>
              <input 
                type="password" 
                {...register('confirmPassword', { required: true })} 
                className="neo-input" 
                placeholder="Repeat new password"
              />
            </div>

            <button type="submit" disabled={loading} className="neo-btn-dark w-full py-4 text-lg font-black uppercase tracking-wider">
              {loading ? 'Processing...' : 'Securely Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="neo-card p-6 border-brand-primary">
          <h2 className="text-xl font-black uppercase mb-4 text-brand-primary">Danger Zone</h2>
          <p className="text-brand-muted mb-4 text-sm">Logging out will clear your session and require you to sign in again.</p>
          <button onClick={() => { logout(); toast.success('Logged out successfully'); }} className="neo-btn-danger px-6 py-3">Logout Session</button>
        </div>
      </div>
    </div>
  );
}
