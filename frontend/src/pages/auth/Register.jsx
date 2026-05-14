import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, GraduationCap, Building2 } from 'lucide-react';
import Logo from '../../components/shared/Logo';

export default function Register() {
  const { register: reg, handleSubmit, formState: { errors }, watch } = useForm();
  const [role, setRole] = useState('student');
  const [showPass, setShowPass] = useState(false);
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await register({ ...data, role });
      toast.success('OTP sent to your email!');
      navigate(`/verify-otp?userId=${res.userId}&email=${data.email}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <Link to="/" className="fixed top-6 left-6 flex items-center gap-2 font-bold hover:text-brand-primary transition-colors">
        <Logo showTagline className="scale-90" />
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card max-w-lg w-full p-8 relative mt-8">
        <div className="absolute -top-5 -right-5 bg-brand-accent border-3 border-brand-dark px-3 py-1 font-bold text-sm shadow-neo rotate-3">
          FREE to Join!
        </div>

        <h1 className="text-3xl font-black uppercase mb-2">Create Account</h1>
        <p className="text-brand-muted font-medium mb-6">Start earning & learning today</p>

        {/* Role Selector */}
        <div className="flex gap-4 mb-6">
          {[
            { value: 'student', label: 'Student', Icon: GraduationCap, color: 'bg-brand-primary text-white' },
            { value: 'recruiter', label: 'Recruiter', Icon: Building2, color: 'bg-brand-secondary text-white' },
          ].map(({ value, label, Icon, color }) => (
            <button key={value} type="button" onClick={() => setRole(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold border-3 border-brand-dark transition-all duration-150
                ${role === value ? `${color} shadow-neo -translate-x-0.5 -translate-y-0.5` : 'bg-white'}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Full Name</label>
            <input {...reg('name', { required: 'Name is required' })} className="neo-input" placeholder="Enter Username" />
            {errors.name && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.name.message}</p>}
          </div>

          <div>
            <label className="block font-bold mb-1">Email Address</label>
            <input type="email" {...reg('email', { required: 'Email is required' })} className="neo-input" placeholder="Enter Email" />
            {errors.email && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.email.message}</p>}
          </div>

          {role === 'recruiter' && (
            <div>
              <label className="block font-bold mb-1">Company Name</label>
              <input {...reg('companyName', { required: role === 'recruiter' ? 'Company name required' : false })} className="neo-input" placeholder="Tech Corp Pvt Ltd" />
              {errors.companyName && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.companyName.message}</p>}
            </div>
          )}

          <div className="relative">
            <label className="block font-bold mb-1">Password</label>
            <input type={showPass ? 'text' : 'password'} {...reg('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} className="neo-input pr-12" placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-[38px] text-brand-muted">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="text-brand-primary text-sm font-semibold mt-1">⚠ {errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="neo-btn-primary w-full py-3 text-base mt-2">
            {loading ? '⏳ Creating Account...' : `Create ${role === 'recruiter' ? 'Recruiter' : 'Student'} Account →`}
          </button>
        </form>

        <p className="mt-5 text-center font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-secondary font-bold underline underline-offset-2 hover:text-brand-primary">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
}
