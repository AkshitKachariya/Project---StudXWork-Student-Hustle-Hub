import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../../components/shared/Logo';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [showPass, setShowPass] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await login(data);
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'recruiter') navigate('/recruiter');
      else navigate('/student');
    } catch (err) {
      console.error('Login error:', err);
      const error = err.response?.data;
      if (error?.error === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email first');
        navigate(`/verify-otp?userId=${error.userId}`);
      } else {
        const msg = error?.error || err.message || 'Login failed. Please check your connection.';
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 font-bold hover:text-brand-primary transition-colors">
        <Logo showTagline className="scale-90" />
      </Link>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="neo-card max-w-md w-full p-8 relative">
        <div className="absolute -top-5 -left-5 bg-brand-primary text-white border-3 border-brand-dark px-3 py-1 font-bold text-sm shadow-neo -rotate-3">
          Welcome Back!
        </div>

        <h1 className="text-3xl font-black uppercase mb-2 mt-2">Login</h1>
        <p className="text-brand-muted font-medium mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Email Address</label>
            <input type="email" {...register('email', { required: 'Email required' })} className="neo-input" placeholder="Enter Email" />
            {errors.email && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.email.message}</p>}
          </div>

          <div className="relative">
            <label className="block font-bold mb-1">Password</label>
            <input type={showPass ? 'text' : 'password'} {...register('password', { required: 'Password required' })} className="neo-input pr-12" placeholder="Your password" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[38px] text-brand-muted">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-bold text-brand-secondary hover:text-brand-primary">Forgot Password?</Link>
          </div>

          <button type="submit" disabled={loading} className="neo-btn-secondary w-full py-3 text-base">
            {loading ? '⏳ Logging in...' : 'Login →'}
          </button>
        </form>

        <p className="mt-5 text-center font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-primary font-bold underline underline-offset-2">Sign Up Free</Link>
        </p>
      </motion.div>
    </div>
  );
}
