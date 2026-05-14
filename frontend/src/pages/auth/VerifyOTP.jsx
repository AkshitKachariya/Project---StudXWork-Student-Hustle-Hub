import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const userId = params.get('userId');
  const email = params.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const { verifyOtp } = useAuthStore();

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter full 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOtp(userId, code);
      toast.success('Email verified! Welcome 🎉');
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'recruiter') navigate('/recruiter');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { userId });
      toast.success('New OTP sent!');
    } catch { toast.error('Failed to resend OTP'); }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card max-w-md w-full p-8 relative">
        <div className="absolute -top-5 -right-5 bg-brand-success text-white border-3 border-brand-dark px-3 py-1 font-bold text-sm shadow-neo rotate-3">
          📧 Check Email
        </div>
        <h1 className="text-3xl font-black uppercase mb-2">Verify Email</h1>
        <p className="text-brand-muted font-medium mb-1">We sent a 6-digit OTP to:</p>
        {email && <p className="font-bold text-brand-secondary mb-6 truncate">{email}</p>}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-center mb-8">
            {otp.map((digit, i) => (
              <input key={i} ref={(el) => (inputs.current[i] = el)}
                type="text" maxLength={1} value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-black border-3 border-brand-dark bg-brand-bg focus:outline-none focus:shadow-neo focus:-translate-y-0.5 transition-all" />
            ))}
          </div>
          <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3 text-base">
            {loading ? '⏳ Verifying...' : 'Verify OTP →'}
          </button>
        </form>

        <button onClick={handleResend} className="mt-4 w-full text-center font-semibold text-brand-muted hover:text-brand-primary transition-colors text-sm">
          Didn't receive it? Resend OTP
        </button>
      </motion.div>
    </div>
  );
}
