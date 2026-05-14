import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = new URLSearchParams(location.search).get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp]; newOtp[i] = val; setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter full OTP');
    if (!password || password.length < 6) return toast.error('Password min 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: code, password });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card max-w-md w-full p-8">
        <h1 className="text-3xl font-black uppercase mb-2">Reset Password</h1>
        <p className="text-brand-muted font-medium mb-1">OTP sent to <strong>{email}</strong></p>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label className="block font-bold mb-2">Enter OTP</label>
            <div className="flex gap-3">
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => (inputs.current[i] = el)}
                  type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus(); }}
                  className="w-11 h-13 text-center text-xl font-black border-3 border-brand-dark bg-brand-bg focus:outline-none focus:shadow-neo transition-all" />
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="block font-bold mb-1">New Password</label>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="neo-input pr-12" placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[38px] text-brand-muted">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3">
            {loading ? '⏳ Resetting...' : 'Reset Password →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
