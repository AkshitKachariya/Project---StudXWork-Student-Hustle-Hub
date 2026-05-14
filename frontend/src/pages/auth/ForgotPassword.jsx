import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      navigate(`/reset-password?email=${email}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error sending OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card max-w-md w-full p-8">
        <h1 className="text-3xl font-black uppercase mb-2">Forgot Password</h1>
        <p className="text-brand-muted font-medium mb-6">Enter your email and we'll send a reset OTP</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="neo-input" placeholder="Enter Email" />
          </div>
          <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3">
            {loading ? '⏳ Sending...' : 'Send Reset OTP →'}
          </button>
        </form>
        <p className="mt-5 text-center font-medium">
          <Link to="/login" className="text-brand-secondary font-bold underline underline-offset-2">← Back to Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
